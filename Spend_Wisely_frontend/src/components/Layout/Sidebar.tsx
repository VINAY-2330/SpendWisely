export default function Sidebar({ isDark = true }: { isDark?: boolean }) {
  const menuItems = [
    { name: 'Dashboard', active: true },
    { name: 'Transactions', active: false },
    { name: 'Analytics', active: false },
    { name: 'Budgets', active: false },
    { name: 'Goals', active: false },
    { name: 'Rewards', active: false },
    { name: 'Settings', active: false },
  ];

  return (
    <aside className={`w-64 border-r flex flex-col p-6 hidden lg:flex shrink-0 transition-colors duration-300 ${isDark ? 'bg-[#1e2530] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
          SW
        </div>
        <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>SpendWisely</h1>
      </div>

      <nav className="space-y-2 flex-grow">
        {menuItems.map((item) => (
          <button
            key={item.name}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              item.active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                : isDark
                  ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {item.name}
          </button>
        ))}
      </nav>

      <div className={`border p-4 rounded-2xl mt-auto transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}>
        <p className={`text-xs font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Monthly Challenge</p>
        <p className={`text-[11px] mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Spend less on dining out this month</p>
        <div className={`w-full h-2 rounded-full overflow-hidden mb-2 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
          <div className="bg-blue-500 h-full w-[72%]"></div>
        </div>
        <div className={`flex justify-between text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <span>Progress</span>
          <span className="text-blue-400 font-bold">72%</span>
        </div>
      </div>
    </aside>
  );
}