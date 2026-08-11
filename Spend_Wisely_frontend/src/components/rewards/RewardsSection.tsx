import { useState } from "react";
import { useRewards } from "../../hooks/useRewards";

interface RewardsSectionProps {
  currentBalance: number;
  onRedeemSuccess: () => void;
  isDark?: boolean;
}

export default function RewardsSection({ currentBalance, onRedeemSuccess, isDark = true }: RewardsSectionProps) {
  const { rewards, loading, redeemReward } = useRewards();
  const [processingId, setProcessingId] = useState<number | null>(null);
  // Track successful redemptions to disable buttons
  const [redeemedIds, setRedeemedIds] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const handleRedeem = async (rewardId: number) => {
    setProcessingId(rewardId);
    setMessage(null);
    try {
      await redeemReward(rewardId);
      
      // Update UI state
      setRedeemedIds((prev) => [...prev, rewardId]);
      setMessage('Reward redeemed successfully!');
      onRedeemSuccess(); // This refreshes the balance in the header
      
      // Hide success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      alert(error.message || 'Failed to redeem');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>Loading rewards...</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Success Message Banner */}
      {message && (
        <div className="mb-4 p-3 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold text-center border border-emerald-200">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
        {rewards.slice(0, 3).map((reward) => {
          const isRedeemed = redeemedIds.includes(reward.id);
          const canAfford = currentBalance >= reward.coin_cost;
          const isProcessing = processingId === reward.id;

          return (
            <div key={reward.id} className={`rounded-2xl p-3 border shadow-[0_10px_25px_rgba(2,6,23,0.25)] flex flex-col ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200 shadow-[0_10px_25px_rgba(148,163,184,0.18)]'}`}>
              <div className={`h-28 bg-gradient-to-br rounded-xl mb-3 flex items-center justify-center border ${isDark ? 'from-slate-700 to-slate-800 border-slate-600' : 'from-slate-100 to-slate-200 border-slate-200'}`}>
                <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                  {isRedeemed ? 'Redeemed' : 'Reward Image'}
                </span>
              </div>
              
              <h3 className={`font-bold text-sm leading-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{reward.name}</h3>
              <p className={`font-bold text-sm mt-1 flex items-center gap-1 ${isDark ? 'text-orange-400' : 'text-orange-500'}`}>
                 <span className={isDark ? 'text-yellow-400 text-xs' : 'text-yellow-500 text-xs'}>🪙</span> {reward.coin_cost.toLocaleString()} CP
              </p>
              
              <div className="mt-auto pt-3">
                <button
                  onClick={() => handleRedeem(reward.id)}
                  disabled={!canAfford || isProcessing || isRedeemed}
                  className={`w-full py-2 rounded-full text-sm font-bold transition-all ${
                    isRedeemed 
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                      : isProcessing 
                      ? 'bg-slate-100 text-slate-400' 
                      : canAfford 
                      ? 'bg-[#007aff] text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isRedeemed ? 'Redeemed' : isProcessing ? 'Processing...' : 'Redeem'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}