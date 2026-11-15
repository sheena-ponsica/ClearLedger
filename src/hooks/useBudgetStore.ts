import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
  DEFAULT_TRANSFERS,
  SEED_EXPENSES,
  TODAY_ISO,
  getMonthKey,
} from '../data/seedData';
import { Account, AccountTransfer, BudgetSettings, Category, Expense } from '../types/budget';

const STORAGE_KEYS = {
  categories: 'clearledger_categories_v2',
  expenses: 'clearledger_expenses_v2',
  settings: 'clearledger_settings_v2',
  accounts: 'clearledger_accounts_v2',
  transfers: 'clearledger_transfers_v2',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useBudgetStore() {
  const [categories, setCategories] = useState<Category[]>(() =>
    readStorage<Category[]>(STORAGE_KEYS.categories, DEFAULT_CATEGORIES)
  );
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    readStorage<Expense[]>(STORAGE_KEYS.expenses, SEED_EXPENSES)
  );
  const [settings, setSettings] = useState<BudgetSettings>(() =>
    readStorage<BudgetSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  );
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const stored = readStorage<Account[]>(STORAGE_KEYS.accounts, DEFAULT_ACCOUNTS);
    const migratedKey = 'clearledger_migrated_cash_v1';
    try {
      if (!localStorage.getItem(migratedKey)) {
        localStorage.setItem(migratedKey, '1');
        if (!stored.some((a) => a.kind === 'cash' || a.id === 'acc-cash-on-hand')) {
          const cashAccount = DEFAULT_ACCOUNTS.find((a) => a.id === 'acc-cash-on-hand');
          if (cashAccount) return [...stored, cashAccount];
        }
      }
    } catch {
      // Ignore storage errors
    }
    return stored;
  });
  const [transfers, setTransfers] = useState<AccountTransfer[]>(() =>
    readStorage<AccountTransfer[]>(STORAGE_KEYS.transfers, DEFAULT_TRANSFERS)
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
    } catch {
      // Ignore storage quota errors
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
    } catch {
      // Ignore storage quota errors
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
    } catch {
      // Ignore storage quota errors
    }
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.transfers, JSON.stringify(transfers));
    } catch {
      // Ignore storage quota errors
    }
  }, [transfers]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const accountMap = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  const totalCategoryBudget = useMemo(
    () => categories.reduce((sum, cat) => sum + (cat.monthlyBudget ?? 0), 0),
    [categories]
  );

  const effectiveMonthlyBudget = useMemo(() => {
    if (settings.monthlyTargetOverride !== null && settings.monthlyTargetOverride > 0) {
      return settings.monthlyTargetOverride;
    }
    return 0;
  }, [settings.monthlyTargetOverride]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => set.add(getMonthKey(e.date)));
    set.add('2026-11');
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const totalAccountBalance = useMemo(
    () => accounts.reduce((sum, acc) => sum + acc.balance, 0),
    [accounts]
  );

  const addExpense = useCallback(
    (input: Omit<Expense, 'id'>, deductFromAccount = false) => {
      const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setExpenses((prev) => [{ ...input, id }, ...prev]);
      if (deductFromAccount && input.accountId) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === input.accountId
              ? { ...a, balance: Math.round((a.balance - input.amount) * 100) / 100 }
              : a
          )
        );
      }
      return id;
    },
    []
  );

  const updateExpense = useCallback((id: string, updates: Partial<Omit<Expense, 'id'>>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const deleteExpensesBulk = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setExpenses((prev) => prev.filter((e) => !idSet.has(e.id)));
  }, []);

  const importExpenses = useCallback((batch: Omit<Expense, 'id'>[]) => {
    const now = Date.now();
    const mapped: Expense[] = batch.map((item, idx) => ({
      ...item,
      id: `exp-imp-${now}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
    }));
    setExpenses((prev) => [...mapped, ...prev]);
    return mapped.length;
  }, []);

  const addCategory = useCallback((input: Omit<Category, 'id'>) => {
    const id = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setCategories((prev) => [...prev, { ...input, id }]);
    return id;
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Omit<Category, 'id'>>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteCategory = useCallback((id: string, reassignToCategoryId: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.categoryId === id ? { ...e, categoryId: reassignToCategoryId } : e))
    );
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addAccount = useCallback((input: Omit<Account, 'id'>) => {
    const id = `acc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setAccounts((prev) => [...prev, { ...input, id }]);
    return id;
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<Omit<Account, 'id'>>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.accountId === id ? { ...e, accountId: undefined } : e))
    );
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const adjustAccountBalance = useCallback((id: string, deltaOrAbsolute: number, mode: 'add' | 'set') => {
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const next = mode === 'set' ? deltaOrAbsolute : a.balance + deltaOrAbsolute;
        return { ...a, balance: Math.round(next * 100) / 100 };
      })
    );
  }, []);

  const transferBetweenAccounts = useCallback(
    (fromAccountId: string, toAccountId: string, amount: number, note?: string, date = TODAY_ISO) => {
      if (fromAccountId === toAccountId || amount <= 0) return;
      const rounded = Math.round(amount * 100) / 100;
      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id === fromAccountId) {
            return { ...a, balance: Math.round((a.balance - rounded) * 100) / 100 };
          }
          if (a.id === toAccountId) {
            return { ...a, balance: Math.round((a.balance + rounded) * 100) / 100 };
          }
          return a;
        })
      );
      const trfId = `trf-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      setTransfers((prev) => [
        { id: trfId, date, fromAccountId, toAccountId, amount: rounded, note: note?.trim() || undefined },
        ...prev,
      ]);
    },
    []
  );

  const updateSettings = useCallback((updates: Partial<BudgetSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const restoreSampleData = useCallback(() => {
    setCategories(DEFAULT_CATEGORIES);
    setExpenses(SEED_EXPENSES);
    setSettings(DEFAULT_SETTINGS);
    setAccounts(DEFAULT_ACCOUNTS);
    setTransfers(DEFAULT_TRANSFERS);
  }, []);

  const clearAllExpenses = useCallback(() => {
    setExpenses([]);
  }, []);

  const exportCsv = useCallback(
    (rowsToExport?: Expense[]) => {
      const target = rowsToExport ?? expenses;
      const header = [
        'Date',
        'Merchant',
        'Category',
        'Amount (PHP)',
        'Account / Wallet',
        'Payment Method',
        'Recurring',
        'Notes',
      ];
      const lines = target.map((e) => {
        const catName = categoryMap.get(e.categoryId)?.name ?? 'Uncategorized';
        const accName = e.accountId ? (accountMap.get(e.accountId)?.name ?? '') : '';
        const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
        return [
          e.date,
          escape(e.merchant),
          escape(catName),
          e.amount.toFixed(2),
          escape(accName),
          escape(e.paymentMethod),
          e.recurring ? 'Yes' : 'No',
          escape(e.notes ?? ''),
        ].join(',');
      });
      const csv = [header.join(','), ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clearledger-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [expenses, categoryMap, accountMap]
  );

  return {
    categories,
    categoryMap,
    expenses,
    settings,
    accounts,
    accountMap,
    transfers,
    totalCategoryBudget,
    effectiveMonthlyBudget,
    totalAccountBalance,
    availableMonths,
    addExpense,
    updateExpense,
    deleteExpense,
    deleteExpensesBulk,
    importExpenses,
    addCategory,
    updateCategory,
    deleteCategory,
    addAccount,
    updateAccount,
    deleteAccount,
    adjustAccountBalance,
    transferBetweenAccounts,
    updateSettings,
    restoreSampleData,
    clearAllExpenses,
    exportCsv,
  };
}
