import { useState } from "react";
import { useTransactions } from "./hooks/useTransactions";
import { useBalance } from "./hooks/useBalance";
import type { TransactionFilters } from "./types";
import TransactionTable from "./components/table/TransactionTable";
import RewardsSection from "./components/rewards/RewardsSection";
import SpendAnalytics from "./components/charts/SpendAnalytics";
import FilterBar from "./components/table/FilterBar";
import Sidebar from "./components/Layout/Sidebar";

function App() {
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '', category: '', status: '', amount_min: '', amount_max: '', 
    start_date: '', end_date: '', // NEW
    sort_by: 'txn_timestamp', sort_dir: 'desc'
  });
  const [isDark, setIsDark] = useState(true);

  const { transactions, loading: txLoading, error, page, totalPages, nextPage, prevPage } = useTransactions(1, 10, filters);
  const { balance, loading: balanceLoading, refreshBalance } = useBalance();

  const appBg = isDark ? 'bg-[#131822] text-slate-100' : 'bg-slate-100 text-slate-900';
  const panelBg = isDark ? 'bg-[#171e29] border-slate-800' : 'bg-white border-slate-200';
  const subtleText = isDark ? 'text-slate-400' : 'text-slate-500';
  const strongText = isDark ? 'text-white' : 'text-slate-900';
  const headerBg = isDark ? 'bg-[#171e29] border-slate-800' : 'bg-white border-slate-200';

  return (
    <div className={`min-h-screen font-sans flex overflow-x-hidden transition-colors duration-300 ${appBg}`}>
      <Sidebar isDark={isDark} />

      <div className="flex-grow flex flex-col min-w-0">
        <header className={`border-b px-8 py-4 flex items-center justify-between transition-colors duration-300 ${headerBg}`}>
          <div>
            <h2 className={`text-xl font-bold flex items-center gap-2 ${strongText}`}>
              Welcome back, Vinay! 👋
            </h2>
            <p className={`text-xs ${subtleText}`}>Track your spending, earn coins and unlock rewards.</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{isDark ? '🌙' : '☀️'}</span>
              {isDark ? 'Dark' : 'Light'}
            </button>

            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2 rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/20 border border-orange-400 flex items-center gap-3">
              <span className="text-lg">🪙</span>
              <div>
                <p className="text-[10px] text-orange-100 font-medium uppercase tracking-wider">Coin Balance</p>
                <p className="text-base leading-none">{balanceLoading ? '...' : `${(balance ?? 0).toLocaleString()}`}</p>
              </div>
            </div>

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isDark ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-slate-200 border border-slate-300 text-slate-700'}`}>
              V
            </div>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className={`col-span-1 lg:col-span-5 border rounded-3xl p-6 shadow-xl flex flex-col transition-colors duration-300 ${panelBg}`}>
              <h3 className={`text-base font-bold mb-4 ${strongText}`}>Spend Analytics</h3>
              <div className="flex-grow flex items-center justify-center">
                <SpendAnalytics transactions={transactions} isDark={isDark} />
              </div>
            </section>

            <section className={`col-span-1 lg:col-span-7 border rounded-3xl p-6 shadow-xl flex flex-col transition-colors duration-300 ${panelBg}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-base font-bold ${strongText}`}>Rewards Catalogue</h3>
              </div>
              <RewardsSection currentBalance={balance ?? 0} onRedeemSuccess={refreshBalance} isDark={isDark} />
            </section>
          </div>

          <section className={`border rounded-3xl p-6 shadow-xl transition-colors duration-300 ${panelBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className={`text-base font-bold ${strongText}`}>Recent Transactions</h3>

              <div className={`flex items-center gap-3 px-3 py-1.5 rounded-xl border ${isDark ? 'bg-[#131822] border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                <span className={`text-xs ${subtleText}`}>
                  Page <strong className={strongText}>{page}</strong> of {totalPages}
                </span>
                <div className="flex gap-1">
                  <button onClick={prevPage} disabled={page === 1 || txLoading} className={`p-1 rounded-lg ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'} disabled:opacity-40`}>&lt;</button>
                  <button onClick={nextPage} disabled={page === totalPages || txLoading} className={`p-1 rounded-lg ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'} disabled:opacity-40`}>&gt;</button>
                </div>
              </div>
            </div>

            <FilterBar filters={filters} setFilters={setFilters} isDark={isDark} />
            <TransactionTable transactions={transactions} loading={txLoading} error={error} isDark={isDark} />
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;