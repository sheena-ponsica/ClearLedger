import React, { useMemo, useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  CATEGORY_COLOR_PALETTE,
  formatCurrency,
  getLastNMonths,
  getMonthKey,
  getMonthLabel,
} from '../data/seedData';
import { BudgetSettings, Category, Expense } from '../types/budget';
import { TablePagination, usePagination } from './TablePagination';

interface CategoriesViewProps {
  categories: Category[];
  expenses: Expense[];
  selectedMonth: string;
  settings: BudgetSettings;
  totalCategoryBudget?: number;
  effectiveMonthlyBudget: number;
  onAddCategory: (cat: Omit<Category, 'id'>) => void;
  onUpdateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => void;
  onDeleteCategory: (id: string, reassignToId: string) => void;
  onUpdateSettings: (updates: Partial<BudgetSettings>) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  expenses,
  selectedMonth,
  settings,
  effectiveMonthlyBudget,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onUpdateSettings,
}) => {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(CATEGORY_COLOR_PALETTE[0]);
  const [formError, setFormError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reassignId, setReassignId] = useState<string>('');

  const [overrideInput, setOverrideInput] = useState<string>(
    settings.monthlyTargetOverride !== null ? String(settings.monthlyTargetOverride) : ''
  );

  const last6Months = useMemo(() => getLastNMonths(selectedMonth, 6), [selectedMonth]);

  const monthTotalSpent = useMemo(
    () =>
      expenses
        .filter((e) => getMonthKey(e.date) === selectedMonth)
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses, selectedMonth]
  );

  const categoryStats = useMemo(() => {
    const activeMonthCount = Math.max(
      new Set(
        expenses
          .filter((e) => last6Months.includes(getMonthKey(e.date)))
          .map((e) => getMonthKey(e.date))
      ).size,
      1
    );

    return categories
      .map((cat) => {
        const monthSpent = expenses
          .filter((e) => e.categoryId === cat.id && getMonthKey(e.date) === selectedMonth)
          .reduce((sum, e) => sum + e.amount, 0);

        const sixMonthTotal = expenses
          .filter((e) => e.categoryId === cat.id && last6Months.includes(getMonthKey(e.date)))
          .reduce((sum, e) => sum + e.amount, 0);

        const avgMonthly = sixMonthTotal / activeMonthCount;
        const share = monthTotalSpent > 0 ? monthSpent / monthTotalSpent : 0;
        const totalCount = expenses.filter((e) => e.categoryId === cat.id).length;

        return {
          category: cat,
          monthSpent,
          sixMonthTotal,
          avgMonthly,
          share,
          totalCount,
        };
      })
      .sort((a, b) => b.monthSpent - a.monthSpent);
  }, [categories, expenses, selectedMonth, last6Months, monthTotalSpent]);

  const categoryPagination = usePagination(categoryStats, 20);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setFormError('Enter a category name.');
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setFormError('A category with this name already exists.');
      return;
    }

    onAddCategory({
      name: trimmed,
      color: newColor,
    });
    setNewName('');
    setFormError('');
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  const saveEdit = (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    onUpdateCategory(id, {
      name: trimmed,
      color: editColor,
    });
    setEditingId(null);
  };

  const startDelete = (id: string) => {
    const fallback = categories.find((c) => c.id !== id)?.id ?? '';
    setDeletingId(id);
    setReassignId(fallback);
  };

  const confirmDelete = () => {
    if (!deletingId || !reassignId) return;
    onDeleteCategory(deletingId, reassignId);
    setDeletingId(null);
  };

  const applyOverride = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(overrideInput);
    if (overrideInput.trim() === '' || Number.isNaN(val) || val <= 0) {
      onUpdateSettings({ monthlyTargetOverride: null });
      setOverrideInput('');
    } else {
      onUpdateSettings({ monthlyTargetOverride: Math.round(val) });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Open Tracking & Optional Reference Card */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Monthly Spending Mode
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Categories track open amounts without fixed monthly caps. Optionally set a monthly
                reference target for the overview chart, or leave it open.
              </p>
            </div>
            <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {effectiveMonthlyBudget > 0 ? formatCurrency(effectiveMonthlyBudget, false) : 'Open'}
            </div>
          </div>

          <form onSubmit={applyOverride} className="flex flex-wrap items-center gap-3 pt-2">
            <div className="relative w-52">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                ₱
              </span>
              <input
                type="number"
                min="0"
                step="100"
                value={overrideInput}
                onChange={(e) => setOverrideInput(e.target.value)}
                placeholder="Open (no fixed limit)"
                aria-label="Optional monthly reference target"
                className="w-full pl-7 pr-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:font-sans placeholder:text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-700"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
            >
              Set Optional Target
            </button>
            {settings.monthlyTargetOverride !== null && (
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({ monthlyTargetOverride: null });
                  setOverrideInput('');
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 underline"
              >
                Clear (Keep Open)
              </button>
            )}
          </form>
        </div>

        {/* Add Category Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Create Category
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize expenses with flexible, open-amount categories.
            </p>
          </div>

          <form onSubmit={handleAddCategory} className="space-y-3">
            {formError && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-md">
                {formError}
              </div>
            )}
            <div>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name (e.g., Pet Care, Education)"
                aria-label="New category name"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Category color">
                {CATEGORY_COLOR_PALETTE.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setNewColor(hex)}
                    aria-label={`Select color ${hex}`}
                    aria-checked={newColor === hex}
                    role="radio"
                    className={`h-5 w-5 rounded-sm transition-transform ${
                      newColor === hex ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : ''
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Category</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Delete Confirmation Banner */}
      {deletingId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-amber-950">
            Reassign existing expenses from{' '}
            <span className="font-semibold">
              {categories.find((c) => c.id === deletingId)?.name}
            </span>{' '}
            to:
          </div>
          <div className="flex items-center gap-2.5">
            <select
              value={reassignId}
              onChange={(e) => setReassignId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg text-slate-900"
            >
              {categories
                .filter((c) => c.id !== deletingId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={confirmDelete}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg"
            >
              Confirm Delete
            </button>
            <button
              type="button"
              onClick={() => setDeletingId(null)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Expense Categories · {getMonthLabel(selectedMonth)}
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {categories.length} categories · {formatCurrency(monthTotalSpent, false)} spent this month
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-2.5 pl-6 pr-3">Category</th>
                <th className="py-2.5 px-3 text-right">
                  Spent ({getMonthLabel(selectedMonth, true)})
                </th>
                <th className="py-2.5 px-3 w-56">Share of Month</th>
                <th className="py-2.5 px-3 text-right">6-Mo Avg</th>
                <th className="py-2.5 px-3 text-right">6-Mo Total</th>
                <th className="py-2.5 pl-3 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {categoryPagination.paginatedItems.map(
                ({ category, monthSpent, sixMonthTotal, avgMonthly, share, totalCount }) => {
                  const isEditing = editingId === category.id;
                  const sharePct = Math.round(share * 100);

                  return (
                    <tr key={category.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pl-6 pr-3">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={editColor}
                              onChange={(e) => setEditColor(e.target.value)}
                              aria-label="Category color"
                              className="h-6 w-6 rounded border border-slate-300 cursor-pointer p-0"
                            />
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="px-2.5 py-1 text-sm bg-white border border-slate-300 rounded-md text-slate-900 w-48"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <span
                              className="h-3 w-3 rounded-xs shrink-0"
                              style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <div className="font-medium text-slate-900">{category.name}</div>
                              <div className="text-xs text-slate-400 font-mono tabular-nums">
                                {totalCount} total {totalCount === 1 ? 'entry' : 'entries'}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-900 tabular-nums">
                        {formatCurrency(monthSpent)}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(share * 100, 100)}%`,
                                backgroundColor: category.color,
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono text-slate-500 tabular-nums w-9 text-right">
                            {sharePct}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                        {formatCurrency(avgMonthly, false)}/mo
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums">
                        {formatCurrency(sixMonthTotal, false)}
                      </td>

                      <td className="py-3 pl-3 pr-6 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => saveEdit(category.id)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md"
                              aria-label="Save category"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md"
                              aria-label="Cancel edit"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(category)}
                              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md transition-colors"
                              aria-label={`Edit ${category.name}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            {categories.length > 1 && (
                              <button
                                type="button"
                                onClick={() => startDelete(category.id)}
                                className="p-1.5 text-slate-400 hover:text-red-700 rounded-md transition-colors"
                                aria-label={`Delete ${category.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
          <TablePagination
            currentPage={categoryPagination.currentPage}
            totalPages={categoryPagination.totalPages}
            pageSize={categoryPagination.pageSize}
            totalItems={categoryPagination.totalItems}
            startIndex={categoryPagination.startIndex}
            endIndex={categoryPagination.endIndex}
            onPageChange={categoryPagination.setPage}
            onPageSizeChange={categoryPagination.setPageSize}
          />
        </div>
      </section>
    </div>
  );
};
