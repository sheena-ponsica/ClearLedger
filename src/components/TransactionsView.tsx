import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Download, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { formatCurrency, formatShortDate, getMonthKey, getMonthLabel } from '../data/seedData';
import { Account, Category, Expense, PaymentMethod } from '../types/budget';
import { TablePagination, usePagination } from './TablePagination';

interface TransactionsViewProps {
  expenses: Expense[];
  categories: Category[];
  categoryMap: Map<string, Category>;
  accounts: Account[];
  accountMap: Map<string, Account>;
  availableMonths: string[];
  initialMonthFilter: string;
  initialCategoryFilter: string;
  initialAccountFilter: string;
  onOpenNewExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onUpdateExpenseCategory: (id: string, categoryId: string) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteBulk: (ids: string[]) => void;
  onExportCsv: (rows: Expense[]) => void;
  onImportCsvBatch: (batch: Omit<Expense, 'id'>[]) => number;
}

type SortField = 'date' | 'amount' | 'merchant';
type SortDir = 'asc' | 'desc';

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  expenses,
  categories,
  categoryMap,
  accounts,
  accountMap,
  availableMonths,
  initialMonthFilter,
  initialCategoryFilter,
  initialAccountFilter,
  onOpenNewExpense,
  onEditExpense,
  onUpdateExpenseCategory,
  onDeleteExpense,
  onDeleteBulk,
  onExportCsv,
  onImportCsvBatch,
}) => {
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>(initialMonthFilter);
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategoryFilter);
  const [accountFilter, setAccountFilter] = useState<string>(initialAccountFilter);
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses
      .filter((e) => {
        if (monthFilter !== 'all' && getMonthKey(e.date) !== monthFilter) return false;
        if (categoryFilter !== 'all' && e.categoryId !== categoryFilter) return false;
        if (accountFilter !== 'all' && e.accountId !== accountFilter) return false;
        if (methodFilter !== 'all' && e.paymentMethod !== methodFilter) return false;
        if (q) {
          const catName = categoryMap.get(e.categoryId)?.name.toLowerCase() ?? '';
          const accName = e.accountId ? (accountMap.get(e.accountId)?.name.toLowerCase() ?? '') : '';
          const match =
            e.merchant.toLowerCase().includes(q) ||
            (e.notes?.toLowerCase().includes(q) ?? false) ||
            catName.includes(q) ||
            accName.includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'date') cmp = a.date.localeCompare(b.date);
        else if (sortField === 'amount') cmp = a.amount - b.amount;
        else cmp = a.merchant.localeCompare(b.merchant);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [
    expenses,
    monthFilter,
    categoryFilter,
    accountFilter,
    methodFilter,
    search,
    sortField,
    sortDir,
    categoryMap,
    accountMap,
  ]);

  const filteredTotal = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered]
  );

  const pagination = usePagination(filtered, 20);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'merchant' ? 'asc' : 'desc');
    }
  };

  const allOnPageSelected =
    pagination.paginatedItems.length > 0 &&
    pagination.paginatedItems.every((e) => selectedIds.has(e.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pagination.paginatedItems.forEach((e) => next.delete(e.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pagination.paginatedItems.forEach((e) => next.add(e.id));
        return next;
      });
    }
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    onDeleteBulk(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const resetFilters = () => {
    setSearch('');
    setMonthFilter('all');
    setCategoryFilter('all');
    setAccountFilter('all');
    setMethodFilter('all');
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setImportFeedback('Paste at least one CSV row (Date, Merchant, Category, Amount).');
      return;
    }

    const defaultCatId = categories[0]?.id ?? 'cat-groceries';
    const parsed: Omit<Expense, 'id'>[] = [];

    lines.forEach((line, idx) => {
      const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      if (idx === 0 && cols[0].toLowerCase() === 'date') return;
      if (cols.length < 2) return;

      // Support either: Date, Merchant, Category, Amount OR Date, Merchant, Amount
      const dateCandidate = /^\d{4}-\d{2}-\d{2}$/.test(cols[0]) ? cols[0] : '2026-11-14';
      const merchant = cols[1] || 'Imported Expense';
      let categoryId = defaultCatId;
      let amountNum = 0;

      if (cols.length >= 4) {
        const matchedCat = categories.find(
          (c) => c.name.toLowerCase() === cols[2].toLowerCase()
        );
        if (matchedCat) categoryId = matchedCat.id;
        amountNum = parseFloat(cols[3].replace(/[^0-9.-]/g, ''));
      } else {
        amountNum = parseFloat((cols[2] ?? '').replace(/[^0-9.-]/g, ''));
      }

      if (!Number.isNaN(amountNum) && amountNum > 0) {
        parsed.push({
          date: dateCandidate,
          merchant,
          categoryId,
          amount: Math.round(amountNum * 100) / 100,
          paymentMethod: 'Credit Card' as PaymentMethod,
          recurring: false,
        });
      }
    });

    if (parsed.length === 0) {
      setImportFeedback('No valid rows found. Format: YYYY-MM-DD, Merchant, Category, Amount');
      return;
    }

    const added = onImportCsvBatch(parsed);
    setImportFeedback(`Imported ${added} expense${added === 1 ? '' : 's'}.`);
    setCsvText('');
    setShowImport(false);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchant, category, or notes..."
              aria-label="Search transactions"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              aria-label="Filter by month"
              className="px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-700"
            >
              <option value="all">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {getMonthLabel(m)}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              className="px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-700"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              aria-label="Filter by account or wallet"
              className="px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-700"
            >
              <option value="all">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              aria-label="Filter by payment method"
              className="px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-700"
            >
              <option value="all">All Methods</option>
              <option value="E-Wallet">E-Wallet</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Cash">Cash</option>
            </select>

            <button
              type="button"
              onClick={() => setShowImport((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import CSV</span>
            </button>

            <button
              type="button"
              onClick={() => onExportCsv(filtered)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {showImport && (
          <form onSubmit={handleImportSubmit} className="pt-3 border-t border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="csv-paste" className="text-xs font-medium text-slate-700">
                Paste CSV rows (format: YYYY-MM-DD, Merchant, Category, Amount)
              </label>
              <button
                type="button"
                onClick={() => setShowImport(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
            <textarea
              id="csv-paste"
              rows={3}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={'2026-11-14, Gus Market, Groceries, 48.20\n2026-11-13, Caltrain Ticket, Transportation, 14.50'}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-700"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Unmatched category names default to {categories[0]?.name ?? 'first category'}.
              </span>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
              >
                Import Rows
              </button>
            </div>
          </form>
        )}

        {importFeedback && (
          <div className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg flex items-center justify-between">
            <span>{importFeedback}</span>
            <button
              type="button"
              onClick={() => setImportFeedback(null)}
              className="text-emerald-700 hover:text-emerald-900 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span className="font-mono tabular-nums">
              {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums font-medium text-slate-900">
              Total {formatCurrency(filteredTotal)}
            </span>
            {(search ||
              monthFilter !== 'all' ||
              categoryFilter !== 'all' ||
              accountFilter !== 'all' ||
              methodFilter !== 'all') && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>

          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-md transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete {selectedIds.size} selected</span>
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-2.5 pl-4 pr-2 w-10">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all transactions on this page"
                      className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                    />
                  </th>
                  <th className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() => toggleSort('date')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>Date</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() => toggleSort('merchant')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>Merchant</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('amount')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 ml-auto"
                    >
                      <span>Amount</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pagination.paginatedItems.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors h-11">
                    <td className="py-2 pl-4 pr-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(exp.id)}
                        onChange={() => toggleRow(exp.id)}
                        aria-label={`Select ${exp.merchant}`}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                      />
                    </td>
                    <td className="py-2 px-3 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {formatShortDate(exp.date)}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900">
                      <div className="truncate max-w-[260px]">{exp.merchant}</div>
                      {exp.notes && (
                        <div className="text-xs font-normal text-slate-500 truncate max-w-[260px]">
                          {exp.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <select
                        value={exp.categoryId}
                        onChange={(e) => onUpdateExpenseCategory(exp.id, e.target.value)}
                        aria-label={`Category for ${exp.merchant}`}
                        className="text-xs font-medium text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-700 rounded-md px-1.5 py-1 focus:outline-none cursor-pointer"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-500 whitespace-nowrap">
                      {exp.accountId && accountMap.get(exp.accountId)
                        ? accountMap.get(exp.accountId)!.name
                        : exp.paymentMethod}
                      {exp.recurring ? ' · Recurring' : ''}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-2 pl-3 pr-5 text-right whitespace-nowrap">
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
                ))}
              </tbody>
            </table>
            <TablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        ) : (
          <div className="px-6 py-14 text-center space-y-3">
            <p className="text-sm font-medium text-slate-800">No matching expenses found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Adjust your search or filters, or log a new expense to start building your ledger.
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              {(search ||
                monthFilter !== 'all' ||
                categoryFilter !== 'all' ||
                accountFilter !== 'all' ||
                methodFilter !== 'all') && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                onClick={onOpenNewExpense}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Log Expense</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
