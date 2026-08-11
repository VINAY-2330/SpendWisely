import { useState, useEffect } from "react";
import type { Transaction, PaginatedResponse, TransactionFilters } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function useTransactions(initialPage: number = 1, limit: number = 10, filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        // Build the query string dynamically
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (filters) {
          if (filters.search) params.append("search", filters.search);
          if (filters.category) params.append("category", filters.category);
          if (filters.status) params.append("status", filters.status);
          if (filters.amount_min) params.append("amount_min", filters.amount_min);
          if (filters.amount_max) params.append("amount_max", filters.amount_max);
          if (filters.sort_by) params.append("sort_by", filters.sort_by);
          if (filters.sort_dir) params.append("sort_dir", filters.sort_dir);
        }

        const response = await fetch(`${API_BASE_URL}/api/transactions?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch data");

        const result: PaginatedResponse = await response.json();
        setTransactions(result.data);
        setTotalPages(result.total_pages);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the fetch slightly to prevent spamming the API on rapid typing
    const timeoutId = setTimeout(() => {
      fetchTransactions();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [page, limit, filters]);

  const nextPage = () => { if (page < totalPages) setPage(p => p + 1); };
  const prevPage = () => { if (page > 1) setPage(p => p - 1); };

  return { transactions, loading, error, page, totalPages, nextPage, prevPage };
}