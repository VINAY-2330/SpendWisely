import { useState, useEffect, useCallback } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function useBalance() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBalance = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/balance`);
      if (response.ok) {
        const data = await response.json();
        setBalance(data.coins);
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, refreshBalance: fetchBalance };
}