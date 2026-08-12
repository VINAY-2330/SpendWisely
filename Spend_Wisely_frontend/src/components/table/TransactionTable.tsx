import { useState, useEffect } from "react";
import type { Transaction } from "../../types";

export default function TransactionTable({ transactions, loading, error, isDark = true }: any) {
  // NEW: State for tracking the clicked row
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateStr: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateStr));
  // NEW: More detailed date formatter for the modal
  const formatModalDate = (dateStr: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit' }).format(new Date(dateStr));

  const tableText = isDark ? 'text-slate-200' : 'text-slate-700';
  const headerBorder = isDark ? 'border-slate-100' : 'border-slate-200';
  const rowBorder = isDark ? 'border-slate-50/50' : 'border-slate-200';
  const rowHover = isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-100';

  // NEW: Escape key listener to close the modal (Assignment Requirement met!)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedTxn(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) return <div className={`p-8 text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <>
      <div className="w-full overflow-x-auto">
        <table className={`w-full text-left text-sm border-collapse ${tableText}`}>
          <thead>
            <tr className={`${tableText} border-b ${headerBorder}`}>
              <th className={`font-medium pb-3 pl-4 ${tableText}`}>Date</th>
              <th className={`font-medium pb-3 ${tableText}`}>Description</th>
              <th className={`font-medium pb-3 ${tableText}`}>Category</th>
              <th className={`font-medium pb-3 text-right ${tableText}`}>Amount</th>
              <th className={`font-medium pb-3 text-right pr-4 ${tableText}`}>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn: Transaction) => (
              <tr 
                key={txn.id} 
                onClick={() => setSelectedTxn(txn)} // NEW: Click handler opens modal
                className={`group transition-colors border-b last:border-0 ${rowBorder} ${rowHover} cursor-pointer`} // Added cursor-pointer
              >
                <td className={`py-3 pl-4 rounded-l-xl ${tableText}`}>{formatDate(txn.txn_timestamp)}</td>
                <td className={`py-3 font-medium ${tableText}`}>{txn.merchant}</td>
                <td className={`py-3 ${tableText}`}>{txn.category}</td>
                <td className={`py-3 text-right font-medium ${tableText}`}>
                  {txn.status === 'SUCCESS' ? formatCurrency(txn.amount) : `${txn.coins_earned} CP`}
                </td>
                <td className="py-3 text-right pr-4 rounded-r-xl">
                  <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${
                    txn.status === 'SUCCESS' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'
                  }`}>
                    {txn.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NEW: Hand-built Modal Overlay */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            className={`${isDark ? 'bg-[#1e2530] border-slate-700' : 'bg-white border-slate-200'} border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200`}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedTxn.merchant}</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatModalDate(selectedTxn.txn_timestamp)}</p>
              </div>
              <button 
                onClick={() => setSelectedTxn(null)}
                className={`w-8 h-8 flex items-center justify-center rounded-full ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200'} transition-colors`}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className={`flex justify-between py-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Amount</span>
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(selectedTxn.amount)}</span>
              </div>
              <div className={`flex justify-between py-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Category</span>
                <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{selectedTxn.category}</span>
              </div>
              <div className={`flex justify-between py-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Status</span>
                <span className={`font-bold ${selectedTxn.status === 'SUCCESS' ? 'text-[#166534]' : 'text-[#991b1b]'}`}>
                  {selectedTxn.status}
                </span>
              </div>
              <div className={`flex justify-between py-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Coins Earned</span>
                <span className="text-orange-500 font-bold">+{selectedTxn.coins_earned} CP</span>
              </div>
              <div className="flex justify-between py-2">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Transaction ID</span>
                <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{selectedTxn.external_id}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedTxn(null)}
              className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}