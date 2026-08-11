import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables (like your Neon DATABASE_URL)
load_dotenv()

app = FastAPI()

# Configure CORS so your React frontend can communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection helper
def get_db_connection():
    try:
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        return conn
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database connection failed")

# Pydantic models for request validation
class RedeemRequest(BaseModel):
    reward_id: int


# ==========================================
# API ENDPOINTS
# ==========================================


# 1. Fetch User Balance
@app.get("/api/balance")
def get_balance():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT coins FROM user_balance LIMIT 1;")
            record = cur.fetchone()
            return {"coins": record['coins'] if record else 0}
    finally:
        conn.close()


# 2. Fetch the Rewards Catalogue
@app.get("/api/rewards")
def get_rewards():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, name, description, coin_cost FROM rewards_catalogue ORDER BY coin_cost ASC;")
            return cur.fetchall()
    finally:
        conn.close()


# 3. Fetch Transactions (with advanced filtering, sorting, and pagination)
@app.get("/api/transactions")
def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    amount_min: Optional[float] = None,
    amount_max: Optional[float] = None,
    sort_by: str = Query("txn_timestamp", pattern="^(txn_timestamp|amount)$"), # Safe column sorting
    sort_dir: str = Query("desc", pattern="^(asc|desc)$") # Safe direction sorting
):
    conn = get_db_connection()
    offset = (page - 1) * limit
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Base queries using 1=1 to easily append AND clauses
            query = "SELECT * FROM transactions WHERE 1=1"
            count_query = "SELECT COUNT(*) FROM transactions WHERE 1=1"
            params = []
            
            # Dynamic Filtering
            if search:
                query += " AND merchant ILIKE %s" # ILIKE provides case-insensitive search
                count_query += " AND merchant ILIKE %s"
                params.append(f"%{search}%")
                
            if category:
                query += " AND category = %s"
                count_query += " AND category = %s"
                params.append(category)
                
            if status:
                query += " AND status = %s"
                count_query += " AND status = %s"
                params.append(status)
                
            if date_from:
                query += " AND txn_timestamp >= %s"
                count_query += " AND txn_timestamp >= %s"
                params.append(date_from)
                
            if date_to:
                query += " AND txn_timestamp <= %s"
                count_query += " AND txn_timestamp <= %s"
                params.append(date_to)
                
            if amount_min is not None:
                query += " AND amount >= %s"
                count_query += " AND amount >= %s"
                params.append(amount_min)
                
            if amount_max is not None:
                query += " AND amount <= %s"
                count_query += " AND amount <= %s"
                params.append(amount_max)
                
            # Execute count query FIRST before adding ORDER BY and LIMIT clauses
            cur.execute(count_query, params)
            total_records = cur.fetchone()['count']
            
            # Add secure dynamic sorting
            query += f" ORDER BY {sort_by} {sort_dir.upper()}"
            
            # Add pagination
            query += " LIMIT %s OFFSET %s"
            params.extend([limit, offset])
            
            # Execute final data query
            cur.execute(query, params)
            transactions = cur.fetchall()
            
            return {
                "data": transactions,
                "total": total_records,
                "page": page,
                "limit": limit,
                "total_pages": (total_records + limit - 1) // limit if total_records > 0 else 1
            }
    finally:
        conn.close()


# 4. Process a Reward Redemption (Atomic Transaction)
@app.post("/api/rewards/redeem")
def redeem_reward(req: RedeemRequest):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Start database transaction to ensure Atomicity
            cur.execute("BEGIN;")
            
            # Check if reward exists and retrieve its cost
            cur.execute("SELECT coin_cost FROM rewards_catalogue WHERE id = %s;", (req.reward_id,))
            reward = cur.fetchone()
            if not reward:
                cur.execute("ROLLBACK;")
                raise HTTPException(status_code=404, detail="Reward not found")
            
            cost = reward['coin_cost']
            
            # Check user balance and apply a Row-Level Lock (FOR UPDATE) to prevent race conditions
            cur.execute("SELECT coins FROM user_balance LIMIT 1 FOR UPDATE;") 
            balance_record = cur.fetchone()
            current_balance = balance_record['coins'] if balance_record else 0
            
            if current_balance < cost:
                cur.execute("ROLLBACK;")
                raise HTTPException(status_code=400, detail="Insufficient coin balance")
            
            # Deduct balance and insert redemption record
            new_balance = current_balance - cost
            cur.execute("UPDATE user_balance SET coins = %s, updated_at = now();", (new_balance,))
            cur.execute(
                "INSERT INTO redemptions (reward_id, coins_spent) VALUES (%s, %s);",
                (req.reward_id, cost)
            )
            
            # Commit the transaction safely
            cur.execute("COMMIT;")
            return {"status": "success", "message": "Reward redeemed successfully", "new_balance": new_balance}
            
    except Exception as e:
        conn.rollback()
        # Re-raise explicit HTTP exceptions so FastAPI returns the correct status code (e.g., 400, 404)
        if isinstance(e, HTTPException):
            raise e
        # Catch unexpected errors as 500s
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()