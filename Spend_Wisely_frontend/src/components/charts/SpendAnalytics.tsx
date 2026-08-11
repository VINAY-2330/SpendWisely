import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from "recharts";
import type { Transaction } from "../../types";

interface SpendAnalyticsProps {
  transactions: Transaction[];
  isDark?: boolean;
}

// A professional color palette for our categories
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 12}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={1}
      />
      <circle
        cx={cx}
        cy={cy}
        r={outerRadius + 18}
        fill="none"
        stroke={fill}
        strokeOpacity={0.35}
        strokeWidth={2}
      />
    </g>
  );
};

export default function SpendAnalytics({ transactions, isDark = true }: SpendAnalyticsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Process the raw data into an aggregated format for the chart
  const chartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    transactions.forEach((txn) => {
      // Only count SUCCESSful transactions towards the spend analytics
      if (txn.status === 'SUCCESS') {
        categoryTotals[txn.category] = (categoryTotals[txn.category] || 0) + txn.amount;
      }
    });

    // Convert the object into the array format Recharts expects, sorted by highest spend
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const totalSpend = chartData.reduce((sum, item) => sum + item.value, 0);

  // Format the tooltip values as currency
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={isDark ? 'bg-slate-800 p-3 border border-slate-600 rounded-lg shadow-lg text-sm' : 'bg-white p-3 border border-slate-200 rounded-lg shadow-lg text-sm'}>
          <p className={isDark ? 'font-bold text-slate-200' : 'font-bold text-slate-700'}>{payload[0].name}</p>
          <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className={`h-56 w-full border rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-900/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
        Not enough successful transactions to generate insights.
      </div>
    );
  }

  return (
    <div
      className={`h-72 w-full border rounded-2xl p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 ${isDark ? 'bg-slate-900/80 border-slate-700 shadow-[0_12px_30px_rgba(2,6,23,0.45)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.55)]' : 'bg-slate-50 border-slate-200 shadow-[0_12px_30px_rgba(148,163,184,0.18)] hover:shadow-[0_20px_40px_rgba(148,163,184,0.22)]'}`}
      style={{ transform: 'perspective(1200px) rotateX(4deg)' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
            {...({
              activeIndex: activeIndex ?? undefined,
              activeShape: renderActiveShape,
              onMouseEnter: (_: any, index: number) => setActiveIndex(index),
              onMouseLeave: () => setActiveIndex(null),
            } as any)}
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.8}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            formatter={(value) => <span className={isDark ? 'text-slate-300 font-medium text-sm' : 'text-slate-700 font-medium text-sm'}>{value}</span>}
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className={isDark ? 'fill-slate-200 text-[11px] font-medium' : 'fill-slate-700 text-[11px] font-medium'}
          >
            <tspan x="50%" dy="-0.2em" style={{ fontSize: '11px' }}>Total</tspan>
            <tspan x="50%" dy="1.4em" style={{ fontSize: '16px', fontWeight: 700 }}>
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalSpend)}
            </tspan>
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}