import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="SpendWisely API")

# --- CORS CONFIGURATION ---
# Bulletproof CORS Fix: Allow all origins so any GitHub/Vercel link works
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # The magic asterisk allows ALL Vercel preview links!
    allow_credentials=False, # Must be False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE CONNECTION ---
def get_db_connection():
    try:
        conn = psycopg2.connect(
            os.getenv("DATABASE_URL"),
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")

# --- MODELS ---
class RedeemRequest(BaseModel):
    reward_id: int

# --- API ENDPOINTS ---

@app.get("/api/balance")
def get_balance():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Single mocked user for project scope
        cur.execute("SELECT coins FROM user_balance WHERE id = 1;")
        result = cur.fetchone()
        if not result:
            return {"coins": 0}
        return result
    finally:
        cur.close()
        conn.close()

@app.get("/api/rewards")
def get_rewards():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, name, description, coin_cost FROM rewards ORDER BY coin_cost ASC;")
        rewards = cur.fetchall()
        return rewards
    finally:
        cur.close()
        conn.close()

@app.get("/api/transactions")
def get_transactions(
    page: int = 1,
    limit: int = 10,
    search: str = "",
    category: str = "",
    status: str = "",
    amount_min: str = "",
    amount_max: str = "",
    start_date: str = "",
    end_date: str = "",
    sort_by: str = "txn_timestamp",
    sort_dir: str = "desc"
):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # 1. Input Validation (Prevent SQL Injection on sort parameters)
        valid_sort_columns = ["txn_timestamp", "amount", "merchant", "category", "status"]
        if sort_by not in valid_sort_columns:
            sort_by = "txn_timestamp"
            
        if sort_dir.lower() not in ["asc", "desc"]:
            sort_dir = "desc"

        # 2. Build the dynamic WHERE clause
        query_conditions = ["1=1"]
        params = []

        if search:
            query_conditions.append("merchant ILIKE %s")
            params.append(f"%{search}%")
        
        if category:
            query_conditions.append("category = %s")
            params.append(category)
            
        if status:
            query_conditions.append("status = %s")
            params.append(status)
            
        if amount_min:
            try:
                query_conditions.append("amount >= %s")
                params.append(float(amount_min))
            except ValueError:
                pass
                
        if amount_max:
            try:
                query_conditions.append("amount <= %s")
                params.append(float(amount_max))
            except ValueError:
                pass
                
        # Date Range Logic
        if start_date:
            query_conditions.append("txn_timestamp >= %s")
            params.append(f"{start_date} 00:00:00")
        if end_date:
            query_conditions.append("txn_timestamp <= %s")
            params.append(f"{end_date} 23:59:59")

        where_clause = " AND ".join(query_conditions)

        # 3. Get total count for pagination math
        count_query = f"SELECT COUNT(*) FROM transactions WHERE {where_clause};"
        cur.execute(count_query, params)
        total_records = cur.fetchone()["count"]
        total_pages = (total_records + limit - 1) // limit

        # 4. Fetch paginated, filtered data
        offset = (page - 1) * limit
        data_query = f"""
            SELECT id, external_id, merchant, category, amount, currency, 
                   payment_method, status, txn_timestamp, coins_earned
            FROM transactions
            WHERE {where_clause}
            ORDER BY {sort_by} {sort_dir}
            LIMIT %s OFFSET %s;
        """
        data_params = params + [limit, offset]
        cur.execute(data_query, data_params)
        transactions = cur.fetchall()

        # Format datetime objects into strings for valid JSON responses
        for txn in transactions:
            if 'txn_timestamp' in txn and txn['txn_timestamp']:
                txn['txn_timestamp'] = txn['txn_timestamp'].isoformat()

        return {
            "data": transactions,
            "total": total_records,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    finally:
        cur.close()
        conn.close()


@app.post("/api/rewards/redeem")
def redeem_reward(request: RedeemRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Start explicit transaction
        cur.execute("BEGIN;")

        # 1. Fetch reward cost
        cur.execute("SELECT coin_cost FROM rewards WHERE id = %s;", (request.reward_id,))
        reward = cur.fetchone()
        if not reward:
            cur.execute("ROLLBACK;")
            raise HTTPException(status_code=404, detail="Reward not found")
            
        cost = reward["coin_cost"]

        # 2. Fetch user balance with a ROW LEVEL LOCK to prevent race conditions
        cur.execute("SELECT coins FROM user_balance WHERE id = 1 FOR UPDATE;")
        user_balance_row = cur.fetchone()
        
        if not user_balance_row:
            cur.execute("ROLLBACK;")
            raise HTTPException(status_code=404, detail="User balance not found")
            
        current_balance = user_balance_row["coins"]

        # 3. Validate affordability
        if current_balance < cost:
            cur.execute("ROLLBACK;")
            raise HTTPException(status_code=400, detail="Insufficient coins")

        # 4. Deduct balance safely
        new_balance = current_balance - cost
        cur.execute("UPDATE user_balance SET coins = %s WHERE id = 1;", (new_balance,))

        # Commit the transaction safely
        cur.execute("COMMIT;")
        
        return {"success": True, "new_balance": new_balance, "message": "Reward redeemed successfully!"}

    except Exception as e:
        cur.execute("ROLLBACK;")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()