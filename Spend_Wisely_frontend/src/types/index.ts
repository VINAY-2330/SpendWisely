export interface Transaction {
  id: number;
  external_id: string;
  merchant: string;
  category: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  status: string;
  txn_timestamp: string;
  coins_earned: number;
}

export interface PaginatedResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface Reward {
  id: number;
  name: string;
  description: string;
  coin_cost: number;
}

export interface BalanceResponse {
  coins: number;
}

// Here is the missing export!
export interface TransactionFilters {
  search: string;
  category: string;
  status: string;
  amount_min: string;
  amount_max: string;
  sort_by: string;
  sort_dir: string;
}