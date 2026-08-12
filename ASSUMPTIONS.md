# Product & Architectural Assumptions

The assignment brief intentionally left several areas open to interpretation regarding the product's design and business logic[cite: 1]. Below are the key assumptions and product calls I made while building SpendWisely:

## 1. Authentication & User State
* **Assumption:** Implementing a full JWT/OAuth authentication flow would consume time better spent on the core 10k-row table performance and ACID-compliant database logic.
* **Product Call:** I assumed a single-tenant, mocked "logged-in" state. The backend database seeds a single `user_balance` row (ID: 1), and all transaction/redemption APIs hardcode queries to this specific user to demonstrate the core mechanics without the overhead of auth.

## 2. Coin Earning Cap
* **Assumption:** The brief mentioned coins are earned at "one coin per 100 spent, capped per transaction"[cite: 1] but did not specify the exact cap limit. 
* **Product Call:** I assumed a hard cap of **50 coins per transaction**. This prevents a single massive purchase (e.g., a car or a large medical bill) from instantly unlocking the entire rewards catalogue, which would break the gamified economy of the app.

## 3. UI/UX Design Language
* **Assumption:** The brief noted that "visual quality and polish" are evaluated[cite: 1], but no design files were provided. I assumed a modern, premium aesthetic would best fit a consumer-facing gamified fintech app.
* **Product Call:** I implemented a dark-mode "bento box" dashboard layout using CSS Grid, frosted glass effects (`backdrop-blur`), and custom styling. This avoids the generic look of standard component libraries and aligns with high-end startup design trends.

## 4. The Rewards Catalogue
* **Assumption:** The brief asked for a catalogue of "four to six rewards that you define (vouchers, cashback, whatever fits)"[cite: 1].
* **Product Call:** I seeded the database with digital vouchers that appeal to a broad consumer base (e.g., Amazon, Swiggy, Zomato, BookMyShow). I priced them between 2,500 and 5,000 coins to require sustained engagement from the user to achieve a redemption.

## 5. Database Concurrency
* **Assumption:** Even though this is a demo, a real rewards app will face concurrent API requests (e.g., a user double-clicking "Redeem" or using multiple devices).
* **Product Call:** I assumed race conditions were a high priority to solve. Therefore, I explicitly utilized raw SQL `SELECT ... FOR UPDATE` commands to lock the user's balance row during the redemption transaction, strictly preventing the balance from ever dropping below zero.