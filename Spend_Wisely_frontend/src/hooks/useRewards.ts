import { useState, useEffect } from "react";
import type { Reward } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function useRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/rewards`);
        if (response.ok) {
          const data = await response.json();
          setRewards(data);
        }
      } catch (error) {
        console.error("Failed to fetch rewards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  // Function to call the POST endpoint for redemptions
  const redeemReward = async (rewardId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/rewards/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reward_id: rewardId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to redeem reward");
    }

    return await response.json();
  };

  return { rewards, loading, redeemReward };
}