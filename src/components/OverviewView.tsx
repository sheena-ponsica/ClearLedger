import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  TODAY_ISO,
  formatCurrency,
  formatShortDate,
  getDaysInMonth,
  getMonthKey,
  getMonthLabel,
  shiftMonthKey,
} from '../data/seedData';
import { Account, Category, Expense, NavView } from '../types/budget';
import { CategoryDonutChart, ChartMode, MonthlySpendingChart } from './SpendingCharts';
import { TablePagination, usePagination } from './TablePagination';

interface OverviewViewProps {
  expenses: Expense[];
  categories: Category[];
  categoryMap: Map<string, Category>;
  accountMap: Map<string, Account>;
  selectedMonth: string;
  monthlyBudget: number;
  onSelectMonth: (monthKey: string) => void;
  onNavigate: (view: NavView, filterCategoryId?: string) => void;
  onOpenNewExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  expenses,
  categories,
  categoryMap,
  accountMap,
  selectedMonth,
  monthlyBudget,
  onSelectMonth,
  onNavigate,
  onOpenNewExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>('trend');
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);

  const monthExpenses = useMemo(
    () =>
      expenses
        .filter((e) => getMonthKey(e.date) === selectedMonth)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, selectedMonth]
  );

  const recentPagination = usePagination(monthExpenses, 20);

  const prevMonthKey = useMemo(() => shiftMonthKey(selectedMonth, -1), [selectedMonth]);

  const prevMonthSpent = useMemo(
    () =>
      expenses
        .filter((e) => getMonthKey(e.date) === prevMonthKey)
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses, prevMonthKey]
  );

  const totalSpent = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthExpenses]
  );

  const remainingBudget = monthlyBudget - totalSpent;
  const budgetRatio = monthlyBudget > 0 ? totalSpent / monthlyBudget : 0;

  const momDeltaPct =
    prevMonthSpent > 0 ? ((totalSpent - prevMonthSpent) / prevMonthSpent) * 100 : null;

  const daysElapsed = useMemo(() => {
    const totalDays = getDaysInMonth(selectedMonth);
    if (selectedMonth === TODAY_ISO.slice(0, 7)) {
      return Number(TODAY_ISO.slice(8, 10));
    }
    return totalDays;
  }, [selectedMonth]);

  const dailyAverage = daysElapsed > 0 ? totalSpent / daysElapsed : 0;

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, number>();
    monthExpenses.forEach((e) => {
      totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amount);
    });

    return categories
      .map((cat) => {
        const spent = totals.get(cat.id) ?? 0;
        const share = totalSpent > 0 ? spent / totalSpent : 0;
        return { category: cat, spent, share };
      })
      .sort((a, b) => b.spent - a.spent);
  }, [categories, monthExpenses, totalSpent]);

  const topCategory = categoryBreakdown.find((c) => c.spent > 0) ?? null;

  const hasTarget = monthlyBudget > 0;
  const budgetStatusLabel =
    budgetRatio > 1 ? 'Above target' : budgetRatio >= 0.8 ? 'Near target' : 'Within target';

  const budgetStatusClass =
    budgetRatio > 1 ? 'text-red-700' : budgetRatio >= 0.8 ? 'text-amber-700' : 'text-emerald-700';

  const priorDiff = totalSpent - prevMonthSpent;

  return (
    <div className="space-y-6">
      {/* 4-Column KPI Strip */}
      <section aria-label="Monthly summary metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-5 space-y-1.5">
            <div className="text-xs font-medium text-slate-500">
              Total Spent ({getMonthLabel(selectedMonth, true)})
            </div>
            <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {formatCurrency(totalSpent)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              {momDeltaPct !== null ? (
                <>
                  {momDeltaPct > 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-red-600 shrink-0" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                  )}
                  <span className="font-mono tabular-nums">
                    {momDeltaPct > 0 ? '+' : ''}
                    {momDeltaPct.toFixed(1)}% vs {getMonthLabel(prevMonthKey, true)}
                  </span>
                </>
              ) : (
                <span>{monthExpenses.length} transactions logged</span>
              )}
            </div>
          </div>

          {hasTarget ? (
            <div className="p-5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">Target Remaining</span>
                <span className={`text-xs font-medium ${budgetStatusClass}`}>{budgetStatusLabel}</span>
              </div>
              <div
                className={`font-mono text-2xl font-semibold tabular-nums ${
                  remainingBudget < 0 ? 'text-red-700' : 'text-slate-900'
                }`}
              >
                {remainingBudget < 0
                  ? `-${formatCurrency(Math.abs(remainingBudget))}`
                  : formatCurrency(remainingBudget)}
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                Of {formatCurrency(monthlyBudget, false)} monthly target
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">
                  Prior Month ({getMonthLabel(prevMonthKey, true)})
                </span>
                <span className="text-xs font-medium text-slate-500">Open tracking</span>
              </div>
              <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {formatCurrency(prevMonthSpent)}
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                {prevMonthSpent > 0
                  ? priorDiff <= 0
                    ? `${formatCurrency(Math.abs(priorDiff), false)} lower so far`
                    : `${formatCurrency(priorDiff, false)} higher so far`
                  : 'No prior month entries'}
              </div>
            </div>
          )}

          <div className="p-5 space-y-1.5">
            <div className="text-xs font-medium text-slate-500">Daily Average</div>
            <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {formatCurrency(dailyAverage)}
            </div>
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              Across {daysElapsed} {daysElapsed === 1 ? 'day' : 'days'} · {monthExpenses.length} entries
            </div>
          </div>

          <div className="p-5 space-y-1.5">
            <div className="text-xs font-medium text-slate-500">Top Category</div>
            <div className="font-display text-lg font-semibold text-slate-900 truncate pt-0.5">
              {topCategory ? topCategory.category.name : 'No spending yet'}
            </div>
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              {topCategory
                ? `${formatCurrency(topCategory.spent)} · ${Math.round(topCategory.share * 100)}% of month`
                : 'Log an expense to track shares'}
            </div>
          </div>
        </div>
      </section>

      {/* Main Chart + Category Breakdown Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Monthly Spending Patterns
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare 6-month totals, inspect category mix, or track daily spending pace.
              </p>
            </div>

            <div
              className="inline-flex items-center p-1 bg-slate-100 border border-slate-200 rounded-lg"
              role="tablist"
              aria-label="Chart visualization mode"
            >
              {(
                [
                  { id: 'trend', label: 'Monthly Trend' },
                  { id: 'stacked', label: 'Category Stack' },
                  { id: 'pace', label: 'Daily Pace' },
                ] as { id: ChartMode; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={chartMode === tab.id}
                  onClick={() => setChartMode(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    chartMode === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <MonthlySpendingChart
            expenses={expenses}
            categories={categories}
            selectedMonth={selectedMonth}
            monthlyBudget={monthlyBudget}
            mode={chartMode}
            onSelectMonth={onSelectMonth}
          />
        </div>

        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Category Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{getMonthLabel(selectedMonth)}</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('categories')}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
            >
              Manage categories
            </button>
          </div>

          {totalSpent > 0 ? (
            <>
              <CategoryDonutChart
                items={categoryBreakdown}
                totalSpent={totalSpent}
                hoveredCategoryId={hoveredCategoryId}
                onHoverCategory={setHoveredCategoryId}
                onClickCategory={(catId) => onNavigate('transactions', catId)}
              />

              <div className="space-y-3 pt-2 border-t border-slate-100">
                {categoryBreakdown.map(({ category, spent, share }) => {
                  const isHighlighted = hoveredCategoryId === category.id;
                  const barPct = Math.min(share * 100, 100);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onMouseEnter={() => setHoveredCategoryId(category.id)}
                      onMouseLeave={() => setHoveredCategoryId(null)}
                      onClick={() => onNavigate('transactions', category.id)}
                      className={`w-full text-left block rounded-lg p-1.5 -mx-1.5 transition-colors ${
                        isHighlighted ? 'bg-slate-50' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2.5 w-2.5 rounded-xs shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium text-slate-800 truncate">
                            {category.name}
                          </span>
                        </div>
                        <div className="font-mono tabular-nums whitespace-nowrap shrink-0">
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(spent, false)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${barPct}%`,
                              backgroundColor: category.color,
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 tabular-nums w-9 text-right">
                          {Math.round(share * 100)}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm text-slate-600">
                No expenses logged for {getMonthLabel(selectedMonth)}.
              </p>
              <button
                type="button"
                onClick={onOpenNewExpense}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Log First Expense</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Recent Transactions Ledger */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Recent Expenses · {getMonthLabel(selectedMonth)}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('transactions')}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
          >
            View all transactions
          </button>
        </div>

        {monthExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 bg-slate-50/60">
                  <th className="py-2.5 pl-6 pr-3">Date</th>
                  <th className="py-2.5 px-3">Merchant</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentPagination.paginatedItems.map((exp) => {
                  const cat = categoryMap.get(exp.categoryId);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors h-11">
                      <td className="py-2.5 pl-6 pr-3 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {formatShortDate(exp.date)}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        <div className="truncate max-w-[260px]">{exp.merchant}</div>
                        {exp.notes && (
                          <div className="text-xs font-normal text-slate-500 truncate max-w-[260px]">
                            {exp.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        {cat?.name ?? 'Uncategorized'}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-500 whitespace-nowrap">
                        {exp.accountId && accountMap.get(exp.accountId)
                          ? accountMap.get(exp.accountId)!.name
                          : exp.paymentMethod}
                        {exp.recurring ? ' · Recurring' : ''}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="py-2.5 pl-3 pr-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditExpense(exp)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md transition-colors"
                            aria-label={`Edit ${exp.merchant}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-red-700 rounded-md transition-colors"
                            aria-label={`Delete ${exp.merchant}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <TablePagination
              currentPage={recentPagination.currentPage}
              totalPages={recentPagination.totalPages}
              pageSize={recentPagination.pageSize}
              totalItems={recentPagination.totalItems}
              startIndex={recentPagination.startIndex}
              endIndex={recentPagination.endIndex}
              onPageChange={recentPagination.setPage}
              onPageSizeChange={recentPagination.setPageSize}
            />
          </div>
        ) : (
          <div className="px-6 py-12 text-center space-y-3">
            <p className="text-sm text-slate-600">
              No transactions recorded in {getMonthLabel(selectedMonth)}.
            </p>
            <button
              type="button"
              onClick={onOpenNewExpense}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log First Expense</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
