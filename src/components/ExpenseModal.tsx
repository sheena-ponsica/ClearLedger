import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { TODAY_ISO, formatCurrency } from '../data/seedData';
import { Account, Category, Expense, PaymentMethod } from '../types/budget';

interface ExpenseModalProps {
  isOpen: boolean;
  initialExpense: Expense | null;
  categories: Category[];
  accounts: Account[];
  defaultMonth: string;
  onClose: () => void;
  onSave: (
    data: Omit<Expense, 'id'>,
    existingId?: string,
    deductFromAccount?: boolean
  ) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'E-Wallet',
  'Bank Transfer',
  'Debit Card',
  'Credit Card',
  'Cash',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  initialExpense,
  categories,
  accounts,
  defaultMonth,
  onClose,
  onSave,
}) => {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(TODAY_ISO);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('E-Wallet');
  const [recurring, setRecurring] = useState(false);
  const [deductBalance, setDeductBalance] = useState(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (initialExpense) {
      setMerchant(initialExpense.merchant);
      setAmount(initialExpense.amount.toFixed(2));
      setCategoryId(initialExpense.categoryId);
      setAccountId(initialExpense.accountId ?? '');
      setDate(initialExpense.date);
      setPaymentMethod(initialExpense.paymentMethod);
      setRecurring(initialExpense.recurring);
      setDeductBalance(false);
      setNotes(initialExpense.notes ?? '');
    } else {
      const defaultDate =
        defaultMonth === TODAY_ISO.slice(0, 7) ? TODAY_ISO : `${defaultMonth}-15`;
      setMerchant('');
      setAmount('');
      setCategoryId(categories[0]?.id ?? '');
      const defaultAcc = accounts.find((a) => a.id === 'acc-gcash') ?? accounts[0];
      setAccountId(defaultAcc?.id ?? '');
      setDate(defaultDate);
      setPaymentMethod(defaultAcc?.kind === 'ewallet' ? 'E-Wallet' : 'Debit Card');
      setRecurring(false);
      setDeductBalance(true);
      setNotes('');
    }
    setError('');
  }, [isOpen, initialExpense, categories, accounts, defaultMonth]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAccountChange = (nextAccountId: string) => {
    setAccountId(nextAccountId);
    const found = accounts.find((a) => a.id === nextAccountId);
    if (found) {
      if (found.kind === 'ewallet') setPaymentMethod('E-Wallet');
      else if (found.kind === 'cash') setPaymentMethod('Cash');
      else setPaymentMethod('Debit Card');
    } else {
      setPaymentMethod('Cash');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!merchant.trim()) {
      setError('Enter a merchant or expense description.');
      return;
    }
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid amount greater than ₱0.00.');
      return;
    }
    if (!categoryId) {
      setError('Select a category.');
      return;
    }
    if (!date) {
      setError('Select a valid date.');
      return;
    }

    onSave(
      {
        merchant: merchant.trim(),
        amount: Math.round(parsedAmount * 100) / 100,
        categoryId,
        accountId: accountId || undefined,
        date,
        paymentMethod,
        recurring,
        notes: notes.trim() || undefined,
      },
      initialExpense?.id,
      !initialExpense && deductBalance && Boolean(accountId)
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="expense-modal-title" className="font-display text-base font-semibold text-slate-900">
            {initialExpense ? 'Edit Expense' : 'Log New Expense'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="exp-merchant" className="block text-xs font-medium text-slate-700 mb-1.5">
                Merchant or Description
              </label>
              <input
                id="exp-merchant"
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g., Landers, Meralco, GrabCar"
                autoFocus
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label htmlFor="exp-amount" className="block text-xs font-medium text-slate-700 mb-1.5">
                Amount (PHP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-400">
                  ₱
                </span>
                <input
                  id="exp-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label htmlFor="exp-date" className="block text-xs font-medium text-slate-700 mb-1.5">
                Date
              </label>
              <input
                id="exp-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label htmlFor="exp-category" className="block text-xs font-medium text-slate-700 mb-1.5">
                Category
              </label>
              <select
                id="exp-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="exp-account" className="block text-xs font-medium text-slate-700 mb-1.5">
                Account / E-Wallet
              </label>
              <select
                id="exp-account"
                value={accountId}
                onChange={(e) => handleAccountChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
              >
                <option value="">Cash / Unlinked</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance, false)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="exp-method" className="block text-xs font-medium text-slate-700 mb-1.5">
                Payment Method
              </label>
              <select
                id="exp-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="exp-notes" className="block text-xs font-medium text-slate-700 mb-1.5">
                Notes (optional)
              </label>
              <input
                id="exp-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional memo"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                />
                <span className="text-sm text-slate-700">Recurring monthly expense</span>
              </label>

              {!initialExpense && accountId && (
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={deductBalance}
                    onChange={(e) => setDeductBalance(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                  />
                  <span className="text-sm text-slate-700">Deduct from account balance</span>
                </label>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
            >
              {initialExpense ? 'Save Changes' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
