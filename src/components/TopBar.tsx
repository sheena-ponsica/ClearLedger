import React from 'react';
import { ChevronLeft, ChevronRight, Menu, Plus } from 'lucide-react';
import { getMonthLabel, shiftMonthKey } from '../data/seedData';
import { NavView } from '../types/budget';

interface TopBarProps {
  activeView: NavView;
  selectedMonth: string;
  availableMonths: string[];
  onChangeMonth: (monthKey: string) => void;
  onOpenNewExpense: () => void;
  onOpenMobileNav: () => void;
}

const VIEW_LABELS: Record<NavView, string> = {
  overview: 'Overview',
  transactions: 'Transactions',
  accounts: 'Accounts & Wallets',
  categories: 'Categories',
  patterns: 'Monthly Patterns',
};

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  selectedMonth,
  availableMonths,
  onChangeMonth,
  onOpenNewExpense,
  onOpenMobileNav,
}) => {
  const monthOptions = Array.from(new Set([selectedMonth, ...availableMonths])).sort().reverse();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg focus-visible:outline-2 focus-visible:outline-emerald-700"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-500 hidden sm:inline whitespace-nowrap">Workspace</span>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
            /
          </span>
          <h1 className="font-display font-semibold text-slate-900 truncate">
            {VIEW_LABELS[activeView]}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div
          className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5"
          role="group"
          aria-label="Select month"
        >
          <button
            type="button"
            onClick={() => onChangeMonth(shiftMonthKey(selectedMonth, -1))}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <select
            value={selectedMonth}
            onChange={(e) => onChangeMonth(e.target.value)}
            aria-label="Active month"
            className="bg-transparent px-2 py-1 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none cursor-pointer tabular-nums"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {getMonthLabel(m)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onChangeMonth(shiftMonthKey(selectedMonth, 1))}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenNewExpense}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Log Expense</span>
        </button>
      </div>
    </header>
  );
};
