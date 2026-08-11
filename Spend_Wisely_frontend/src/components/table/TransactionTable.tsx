import type { Transaction } from "../../types";

export default function TransactionTable({ transactions, loading, error, isDark = true }: any) {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateStr: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateStr));

  const tableText = isDark ? 'text-slate-200' : 'text-slate-700';
  const headerBorder = isDark ? 'border-slate-100' : 'border-slate-200';
  const rowBorder = isDark ? 'border-slate-50/50' : 'border-slate-200';
  const rowHover = isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-100';

  if (loading) return <div className={`p-8 text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
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
            <tr key={txn.id} className={`group transition-colors border-b last:border-0 ${rowBorder} ${rowHover}`}>
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
  );
}