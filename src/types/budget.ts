export type PaymentMethod = 'Bank Transfer' | 'E-Wallet' | 'Debit Card' | 'Credit Card' | 'Cash';

export type NavView = 'overview' | 'transactions' | 'categories' | 'patterns' | 'accounts';

export type AccountKind = 'bank' | 'ewallet' | 'gosave' | 'cash';

export interface Account {
  id: string;
  name: string;
  institution: string;
  kind: AccountKind;
  balance: number;
  goalAmount?: number;
  color: string;
  accountNumberLast4?: string;
  notes?: string;
}

export interface AccountTransfer {
  id: string;
  date: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  monthlyBudget?: number;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  merchant: string;
  categoryId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  accountId?: string;
  recurring: boolean;
  notes?: string;
}

export interface BudgetSettings {
  currency: string;
  monthlyTargetOverride: number | null;
}
