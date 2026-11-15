import React, { useMemo } from 'react';
import {
  formatCurrency,
  getLastNMonths,
  getMonthKey,
  getMonthLabel,
  shiftMonthKey,
} from '../data/seedData';
import { Category, Expense } from '../types/budget';
import { TablePagination, usePagination } from './TablePagination';

interface PatternsViewProps {
  expenses: Expense[];
  categories: Category[];
  selectedMonth: string;
  onDrillDown: (monthKey: string, categoryId: string) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const PatternsView: React.FC<PatternsViewProps> = ({
  expenses,
  categories,
  selectedMonth,
  onDrillDown,
}) => {
  const months = useMemo(() => getLastNMonths(selectedMonth, 6), [selectedMonth]);
  const prevMonthKey = useMemo(() => shiftMonthKey(selectedMonth, -1), [selectedMonth]);

  // Category x Month Matrix
  const matrixData = useMemo(() => {
    let maxCell = 0;

    const rows = categories.map((cat) => {
      const cells = months.map((m) => {
        const val = expenses
          .filter((e) => e.categoryId === cat.id && getMonthKey(e.date) === m)
          .reduce((sum, e) => sum + e.amount, 0);
        if (val > maxCell) maxCell = val;
        return { monthKey: m, value: val };
      });

      const sixMoTotal = cells.reduce((s, c) => s + c.value, 0);
      const nonZeroMonths = cells.filter((c) => c.value > 0).length || 1;
      const avg = sixMoTotal / months.length;
      const currVal = cells.find((c) => c.monthKey === selectedMonth)?.value ?? 0;
      const prevVal = cells.find((c) => c.monthKey === prevMonthKey)?.value ?? 0;
      const momPct = prevVal > 0 ? ((currVal - prevVal) / prevVal) * 100 : null;

      return {
        category: cat,
        cells,
        sixMoTotal,
        avg,
        momPct,
        activeMonths: nonZeroMonths,
      };
    });

    const columnTotals = months.map((m) =>
      expenses
        .filter((e) => getMonthKey(e.date) === m)
        .reduce((sum, e) => sum + e.amount, 0)
    );

    return { rows, columnTotals, maxCell };
  }, [categories, expenses, months, selectedMonth, prevMonthKey]);

  const matrixPagination = usePagination(matrixData.rows, 20);

  // Day-of-Week Spending Distribution across the 6-month window
  const weekdayStats = useMemo(() => {
    const totals = new Array(7).fill(0);
    const counts = new Array(7).fill(0);

    expenses.forEach((e) => {
      if (!months.includes(getMonthKey(e.date))) return;
      const [y, m, d] = e.date.split('-').map(Number);
      const jsDay = new Date(y, m - 1, d).getDay(); // 0=Sun..6=Sat
      const idx = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon..6=Sun
      totals[idx] += e.amount;
      counts[idx] += 1;
    });

    const maxTotal = Math.max(...totals, 1);
    return WEEKDAYS.map((day, i) => ({
      day,
      total: totals[i],
      count: counts[i],
      ratio: totals[i] / maxTotal,
    }));
  }, [expenses, months]);

  // Recurring vs Discretionary + Top Merchants (for selected month)
  const { recurringTotal, discretionaryTotal, topMerchants } = useMemo(() => {
    const monthItems = expenses.filter((e) => getMonthKey(e.date) === selectedMonth);
    let rec = 0;
    let disc = 0;
    const merchantTotals = new Map<string, { amount: number; count: number; categoryId: string }>();

    monthItems.forEach((e) => {
      if (e.recurring) rec += e.amount;
      else disc += e.amount;

      const existing = merchantTotals.get(e.merchant);
      if (existing) {
        existing.amount += e.amount;
        existing.count += 1;
      } else {
        merchantTotals.set(e.merchant, {
          amount: e.amount,
          count: 1,
          categoryId: e.categoryId,
        });
      }
    });

    const ranked = Array.from(merchantTotals.entries())
      .map(([merchant, info]) => ({ merchant, ...info }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    return {
      recurringTotal: rec,
      discretionaryTotal: disc,
      topMerchants: ranked,
    };
  }, [expenses, selectedMonth]);

  const monthGrandTotal = recurringTotal + discretionaryTotal;
  const recurringPct = monthGrandTotal > 0 ? Math.round((recurringTotal / monthGrandTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 6-Month Category Spending Heatmap Matrix */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Six-Month Category Spending Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare category spending intensity across months. Click any cell to inspect matching
              transactions.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {getMonthLabel(months[0], true)} – {getMonthLabel(months[months.length - 1], true)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-2.5 pl-6 pr-3">Category</th>
                {months.map((m) => (
                  <th
                    key={m}
                    className={`py-2.5 px-3 text-right whitespace-nowrap ${
                      m === selectedMonth ? 'text-slate-900 font-semibold' : ''
                    }`}
                  >
                    {getMonthLabel(m, true)}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right whitespace-nowrap">6-Mo Avg</th>
                <th className="py-2.5 pl-3 pr-6 text-right whitespace-nowrap">MoM Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {matrixPagination.paginatedItems.map((row) => (
                <tr key={row.category.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 pl-6 pr-3 font-medium text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: row.category.color }}
                      />
                      <span>{row.category.name}</span>
                    </div>
                  </td>
                  {row.cells.map((cell) => {
                    const intensity =
                      matrixData.maxCell > 0 ? cell.value / matrixData.maxCell : 0;
                    const bgAlpha = cell.value > 0 ? 0.04 + intensity * 0.14 : 0;
                    return (
                      <td key={cell.monthKey} className="p-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => onDrillDown(cell.monthKey, row.category.id)}
                          className={`w-full px-2 py-1.5 rounded-md font-mono text-xs tabular-nums text-right transition-colors hover:ring-1 hover:ring-slate-300 ${
                            cell.value === 0 ? 'text-slate-300' : 'text-slate-800'
                          } ${cell.monthKey === selectedMonth ? 'ring-1 ring-slate-200' : ''}`}
                          style={
                            cell.value > 0
                              ? {
                                  backgroundColor: `rgba(4, 120, 87, ${bgAlpha.toFixed(3)})`,
                                }
                              : undefined
                          }
                          title={`Inspect ${row.category.name} in ${getMonthLabel(cell.monthKey)}`}
                        >
                          {cell.value > 0 ? formatCurrency(cell.value, false) : '—'}
                        </button>
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                    {formatCurrency(row.avg, false)}
                  </td>
                  <td className="py-2.5 pl-3 pr-6 text-right font-mono text-xs tabular-nums whitespace-nowrap">
                    {row.momPct === null ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <span
                        className={
                          row.momPct > 5
                            ? 'text-red-700 font-medium'
                            : row.momPct < -5
                              ? 'text-emerald-700 font-medium'
                              : 'text-slate-600'
                        }
                      >
                        {row.momPct > 0 ? '+' : ''}
                        {row.momPct.toFixed(1)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50/70 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                <td className="py-3 pl-6 pr-3 font-sans">Monthly Total</td>
                {matrixData.columnTotals.map((tot, idx) => (
                  <td key={months[idx]} className="py-3 px-3 text-right">
                    {formatCurrency(tot, false)}
                  </td>
                ))}
                <td className="py-3 px-3 text-right text-slate-600">
                  {formatCurrency(
                    matrixData.columnTotals.reduce((a, b) => a + b, 0) / months.length,
                    false
                  )}
                </td>
                <td className="py-3 pl-3 pr-6" />
              </tr>
            </tfoot>
          </table>
          <TablePagination
            currentPage={matrixPagination.currentPage}
            totalPages={matrixPagination.totalPages}
            pageSize={matrixPagination.pageSize}
            totalItems={matrixPagination.totalItems}
            startIndex={matrixPagination.startIndex}
            endIndex={matrixPagination.endIndex}
            onPageChange={matrixPagination.setPage}
            onPageSizeChange={matrixPagination.setPageSize}
          />
        </div>
      </section>

      {/* Secondary Pattern Panels */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekday Distribution */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Spending by Day of Week
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              6-month cumulative distribution across weekdays and weekends.
            </p>
          </div>

          <div className="space-y-3">
            {weekdayStats.map((item) => (
              <div key={item.day} className="grid grid-cols-12 items-center gap-3 text-xs">
                <span className="col-span-2 font-medium text-slate-700">{item.day}</span>
                <div className="col-span-6 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-800 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(item.ratio * 100, item.total > 0 ? 3 : 0)}%` }}
                  />
                </div>
                <div className="col-span-4 text-right font-mono tabular-nums text-slate-700">
                  <span className="font-medium text-slate-900">
                    {formatCurrency(item.total, false)}
                  </span>
                  <span className="text-slate-400"> · {item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed vs Discretionary & Top Merchants */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Recurring vs. Discretionary · {getMonthLabel(selectedMonth, true)}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fixed commitments compared to variable day-to-day spending.
                </p>
              </div>
              <span className="font-mono text-xs text-slate-600 tabular-nums">
                {recurringPct}% fixed
              </span>
            </div>

            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-slate-800 transition-all duration-300"
                style={{ width: `${recurringPct}%` }}
              />
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${monthGrandTotal > 0 ? 100 - recurringPct : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="h-2.5 w-2.5 rounded-xs bg-slate-800 inline-block" />
                <span>Recurring:</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(recurringTotal)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600 inline-block" />
                <span>Discretionary:</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(discretionaryTotal)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-semibold text-slate-700">
              Top Merchants in {getMonthLabel(selectedMonth)}
            </h3>
            {topMerchants.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {topMerchants.map((m) => (
                  <div
                    key={m.merchant}
                    className="py-2 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">{m.merchant}</div>
                      <div className="text-slate-500 font-mono tabular-nums">
                        {m.count} {m.count === 1 ? 'charge' : 'charges'}
                      </div>
                    </div>
                    <div className="font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                      {formatCurrency(m.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No transactions logged in {getMonthLabel(selectedMonth)}.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
