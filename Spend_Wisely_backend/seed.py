"""
Spendwisely — DB seed script.

Usage:
    python seed.py

Reads transactions.json, creates the schema (idempotent — drops and
recreates), normalizes the known data-quality issues, and loads
everything into Postgres. Requires DATABASE_URL in .env.
"""

import json
import os
import sys
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
TRANSACTIONS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "transactions.json")

COIN_RATE = 100          # 1 coin per ₹100 spent
COIN_CAP_PER_TXN = 500   # max coins earnable on a single transaction

REWARDS_CATALOGUE = [
    ("₹50 Cashback", "Instant cashback to your linked account", 100),
    ("₹100 Cashback", "Instant cashback to your linked account", 190),
    ("Amazon Voucher ₹200", "Digital gift voucher, delivered by email", 380),
    ("Movie Ticket Voucher", "Single ticket voucher for partner cinemas", 250),
    ("Swiggy Voucher ₹150", "Food delivery voucher", 280),
    ("Flight Discount ₹500", "Discount on your next flight booking", 900),
]

SCHEMA_SQL = """
DROP TABLE IF EXISTS redemptions CASCADE;
DROP TABLE IF EXISTS user_balance CASCADE;
DROP TABLE IF EXISTS rewards_catalogue CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;

CREATE TABLE transactions (
    id              SERIAL PRIMARY KEY,
    external_id     TEXT NOT NULL,
    merchant        TEXT NOT NULL,
    category        TEXT NOT NULL DEFAULT 'Uncategorized',
    amount          NUMERIC(14, 2) NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'INR',
    payment_method  TEXT,
    status          TEXT NOT NULL,
    txn_timestamp   TIMESTAMPTZ NOT NULL,
    coins_earned    INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_transactions_external_id ON transactions(external_id);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_timestamp ON transactions(txn_timestamp);
CREATE INDEX idx_transactions_merchant ON transactions(merchant);

CREATE TABLE rewards_catalogue (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    coin_cost       INTEGER NOT NULL
);

CREATE TABLE user_balance (
    id              SERIAL PRIMARY KEY,
    coins           INTEGER NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE redemptions (
    id              SERIAL PRIMARY KEY,
    reward_id       INTEGER NOT NULL REFERENCES rewards_catalogue(id),
    coins_spent     INTEGER NOT NULL,
    redeemed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
"""


def normalize_timestamp(raw):
    """Handles both ISO-8601 strings and epoch-millisecond ints."""
    if isinstance(raw, (int, float)):
        # epoch milliseconds
        return datetime.fromtimestamp(raw / 1000, tz=timezone.utc)
    if isinstance(raw, str):
        # handle trailing 'Z'
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    raise ValueError(f"Unrecognized timestamp format: {raw!r}")


def normalize_amount(raw):
    """Handles amounts stored as strings or numbers."""
    try:
        return Decimal(str(raw))
    except (InvalidOperation, TypeError):
        raise ValueError(f"Unrecognized amount format: {raw!r}")


def normalize_status(raw):
    return str(raw).strip().upper()


def normalize_category(raw):
    if raw is None or str(raw).strip() == "":
        return "Uncategorized"
    return str(raw).strip()


def compute_coins(amount: Decimal, status: str) -> int:
    if status != "SUCCESS" or amount <= 0:
        return 0
    coins = int(amount // COIN_RATE)
    return min(coins, COIN_CAP_PER_TXN)


def load_and_normalize(path):
    with open(path, "r", encoding="utf-8") as f:
        raw_records = json.load(f)

    seen_ids = set()
    rows = []
    skipped_duplicates = 0
    skipped_errors = 0

    for rec in raw_records:
        ext_id = rec.get("id")

        if ext_id in seen_ids:
            skipped_duplicates += 1
            continue

        try:
            amount = normalize_amount(rec["amount"])
            ts = normalize_timestamp(rec["timestamp"])
            status = normalize_status(rec["status"])
            category = normalize_category(rec.get("category"))
            coins = compute_coins(amount, status)

            rows.append((
                ext_id,
                rec.get("merchant", "Unknown"),
                category,
                amount,
                rec.get("currency", "INR"),
                rec.get("payment_method"),
                status,
                ts,
                coins,
            ))
            seen_ids.add(ext_id)

        except (ValueError, KeyError) as e:
            skipped_errors += 1
            print(f"  [skip] {ext_id}: {e}")

    print(f"\nLoaded {len(rows)} rows "
          f"(skipped {skipped_duplicates} duplicates, {skipped_errors} malformed)")
    return rows


def seed():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set in .env")
        sys.exit(1)

    if not os.path.exists(TRANSACTIONS_FILE):
        print(f"ERROR: transactions.json not found at {TRANSACTIONS_FILE}")
        sys.exit(1)

    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            print("Creating schema...")
            cur.execute(SCHEMA_SQL)

            print("Reading and normalizing transactions.json...")
            rows = load_and_normalize(TRANSACTIONS_FILE)

            print("Inserting transactions...")
            execute_values(
                cur,
                """
                INSERT INTO transactions
                    (external_id, merchant, category, amount, currency,
                     payment_method, status, txn_timestamp, coins_earned)
                VALUES %s
                """,
                rows,
            )

            print("Seeding rewards catalogue...")
            execute_values(
                cur,
                "INSERT INTO rewards_catalogue (name, description, coin_cost) VALUES %s",
                REWARDS_CATALOGUE,
            )

            print("Computing initial coin balance...")
            cur.execute("SELECT COALESCE(SUM(coins_earned), 0) FROM transactions")
            total_coins = cur.fetchone()[0]
            cur.execute(
                "INSERT INTO user_balance (coins) VALUES (%s)",
                (total_coins,),
            )

            conn.commit()
            print(f"\nDone. {len(rows)} transactions loaded, "
                  f"{total_coins} coins credited to user_balance.")

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    seed()