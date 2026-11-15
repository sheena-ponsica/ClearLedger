import React from 'react';
import {
  BarChart3,
  Download,
  FolderKanban,
  LayoutDashboard,
  ListOrdered,
  RotateCcw,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { formatCurrency, getMonthLabel } from '../data/seedData';
import { NavView } from '../types/budget';

interface SidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  selectedMonth: string;
  monthSpent: number;
  monthlyBudget: number;
  totalAccountBalance: number;
  onExportCsv: () => void;
  onRestoreSample: () => void;
  onClearExpenses: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: NavView; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ListOrdered },
  { id: 'accounts', label: 'Accounts & Wallets', icon: Wallet },
  { id: 'categories', label: 'Categories', icon: FolderKanban },
  { id: 'patterns', label: 'Monthly Patterns', icon: BarChart3 },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  selectedMonth,
  monthSpent,
  monthlyBudget,
  totalAccountBalance,
  onExportCsv,
  onRestoreSample,
  onClearExpenses,
  mobileOpen,
  onCloseMobile,
}) => {
  const hasTarget = monthlyBudget > 0;
  const ratio = hasTarget ? monthSpent / monthlyBudget : 0;
  const pct = Math.min(Math.round(ratio * 100), 999);
  const barWidth = Math.min(ratio * 100, 100);

  const statusText = !hasTarget
    ? 'Open amount'
    : ratio > 1
      ? 'Above target'
      : ratio >= 0.8
        ? 'Near target'
        : 'Within target';

  const statusColorClass = !hasTarget
    ? 'text-slate-500'
    : ratio > 1
      ? 'text-red-700'
      : ratio >= 0.8
        ? 'text-amber-700'
        : 'text-emerald-700';

  const barColorClass =
    ratio > 1 ? 'bg-red-600' : ratio >= 0.8 ? 'bg-amber-600' : 'bg-emerald-700';

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200 w-64">
      <div>
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200">
          <a
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              onSelectView('overview');
              onCloseMobile();
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            ClearLedger
          </a>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md focus-visible:outline-2 focus-visible:outline-emerald-700"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-3 py-5 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-emerald-700 ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-5 space-y-5">
        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 truncate">
              {getMonthLabel(selectedMonth)}
            </span>
            <span className={`text-xs font-medium whitespace-nowrap ${statusColorClass}`}>
              {statusText}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 font-mono text-sm tabular-nums">
            <span className="font-semibold text-slate-900">{formatCurrency(monthSpent, false)}</span>
            {hasTarget ? (
              <span className="text-slate-500">
                / {formatCurrency(monthlyBudget, false)} ({pct}%)
              </span>
            ) : (
              <span className="text-xs text-slate-400">spent</span>
            )}
          </div>
          {hasTarget && (
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${barColorClass}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            onSelectView('accounts');
            onCloseMobile();
          }}
          className="w-full text-left pt-3 border-t border-slate-100 flex items-baseline justify-between gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-xs font-medium text-slate-500">Total Funds</span>
          <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
            {formatCurrency(totalAccountBalance, false)}
          </span>
        </button>

        <div className="pt-3 border-t border-slate-100 space-y-1">
          <button
            type="button"
            onClick={onExportCsv}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={onRestoreSample}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>Restore Sample Data</span>
          </button>
          <button
            type="button"
            onClick={onClearExpenses}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50/60 rounded-md transition-colors whitespace-nowrap"
          >
            <Trash2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Clear All Expenses</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
