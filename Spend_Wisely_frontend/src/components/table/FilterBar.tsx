import type { TransactionFilters } from "../../types";

interface FilterBarProps {
  filters: TransactionFilters;
  setFilters: React.Dispatch<React.SetStateAction<TransactionFilters>>;
  isDark?: boolean;
}

export default function FilterBar({ filters, setFilters, isDark = true }: FilterBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const inputClasses = isDark
    ? 'bg-slate-800/80 border-slate-600 text-slate-200 placeholder:text-slate-400'
    : 'bg-slate-100 border-slate-300 text-slate-700 placeholder:text-slate-500';

  const selectClasses = isDark
    ? 'bg-slate-800 border-slate-600 text-slate-200'
    : 'bg-slate-100 border-slate-300 text-slate-700';

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <div className="relative flex-grow min-w-[200px]">
        <svg className={`w-4 h-4 absolute left-4 top-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input 
          type="text" name="search" value={filters.search} onChange={handleChange} placeholder="Search..."
          className={`w-full pl-10 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow ${inputClasses}`}
        />
      </div>

      <select 
        name="category" 
        value={filters.category} 
        onChange={handleChange} 
        className={`px-4 py-2 border rounded-full text-sm focus:outline-none min-w-[140px] ${selectClasses}`}
      >
        <option value="">Category</option>
        <option value="Groceries">Groceries</option>
        <option value="Food & Dining">Food & Dining</option>
        <option value="Shopping">Shopping</option>
        <option value="Travel">Travel</option>
        <option value="Insurance">Insurance</option>
        <option value="Entertainment">Entertainment</option>
      </select>

      <select 
        name="status" 
        value={filters.status} 
        onChange={handleChange} 
        className={`px-4 py-2 border rounded-full text-sm focus:outline-none min-w-[120px] ${selectClasses}`}
      >
        <option value="">Status</option>
        <option value="SUCCESS">Success</option>
        <option value="FAILED">Failed</option>
        <option value="PENDING">Pending</option>
      </select>
    </div>
  );
}