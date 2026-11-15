import { useMemo, useState } from 'react';
import { AccountsView } from './components/AccountsView';
import { CategoriesView } from './components/CategoriesView';
import { ExpenseModal } from './components/ExpenseModal';
import { OverviewView } from './components/OverviewView';
import { PatternsView } from './components/PatternsView';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { TransactionsView } from './components/TransactionsView';
import { CURRENT_MONTH_KEY, getMonthKey } from './data/seedData';
import { useBudgetStore } from './hooks/useBudgetStore';
import { Expense, NavView } from './types/budget';

export default function App() {
  const {
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
  } = useBudgetStore();

  const [activeView, setActiveView] = useState<NavView>('overview');
  const [selectedMonth, setSelectedMonth] = useState<string>(CURRENT_MONTH_KEY);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Drill-down filter state for Transactions view
  const [txMonthFilter, setTxMonthFilter] = useState<string>(CURRENT_MONTH_KEY);
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('all');
  const [txAccountFilter, setTxAccountFilter] = useState<string>('all');
  const [txFilterVersion, setTxFilterVersion] = useState(0);

  // Modal state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const monthSpent = useMemo(
    () =>
      expenses
        .filter((e) => getMonthKey(e.date) === selectedMonth)
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses, selectedMonth]
  );

  const handleSelectView = (view: NavView, filterCategoryId?: string) => {
    if (view === 'transactions') {
      setTxMonthFilter(filterCategoryId ? selectedMonth : 'all');
      setTxCategoryFilter(filterCategoryId ?? 'all');
      setTxAccountFilter('all');
      setTxFilterVersion((v) => v + 1);
    }
    setActiveView(view);
  };

  const handleDrillDownFromPatterns = (monthKey: string, categoryId: string) => {
    setSelectedMonth(monthKey);
    setTxMonthFilter(monthKey);
    setTxCategoryFilter(categoryId);
    setTxAccountFilter('all');
    setTxFilterVersion((v) => v + 1);
    setActiveView('transactions');
  };

  const handleInspectAccountTransactions = (accountId: string) => {
    setTxMonthFilter('all');
    setTxCategoryFilter('all');
    setTxAccountFilter(accountId);
    setTxFilterVersion((v) => v + 1);
    setActiveView('transactions');
  };

  const handleOpenNewExpense = () => {
    setEditingExpense(null);
    setExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseModalOpen(true);
  };

  const handleSaveExpense = (
    data: Omit<Expense, 'id'>,
    existingId?: string,
    deductFromAccount = false
  ) => {
    if (existingId) {
      updateExpense(existingId, data);
    } else {
      addExpense(data, deductFromAccount);
      const expenseMonth = getMonthKey(data.date);
      setSelectedMonth(expenseMonth);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar
        activeView={activeView}
        onSelectView={(v) => handleSelectView(v)}
        selectedMonth={selectedMonth}
        monthSpent={monthSpent}
        monthlyBudget={effectiveMonthlyBudget}
        totalAccountBalance={totalAccountBalance}
        onExportCsv={() => exportCsv()}
        onRestoreSample={() => {
          restoreSampleData();
          setSelectedMonth(CURRENT_MONTH_KEY);
        }}
        onClearExpenses={() => setConfirmClearOpen(true)}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeView={activeView}
          selectedMonth={selectedMonth}
          availableMonths={availableMonths}
          onChangeMonth={setSelectedMonth}
          onOpenNewExpense={handleOpenNewExpense}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {activeView === 'overview' && (
            <OverviewView
              expenses={expenses}
              categories={categories}
              categoryMap={categoryMap}
              accountMap={accountMap}
              selectedMonth={selectedMonth}
              monthlyBudget={effectiveMonthlyBudget}
              onSelectMonth={setSelectedMonth}
              onNavigate={handleSelectView}
              onOpenNewExpense={handleOpenNewExpense}
              onEditExpense={handleOpenEditExpense}
              onDeleteExpense={deleteExpense}
            />
          )}

          {activeView === 'transactions' && (
            <TransactionsView
              key={txFilterVersion}
              expenses={expenses}
              categories={categories}
              categoryMap={categoryMap}
              accounts={accounts}
              accountMap={accountMap}
              availableMonths={availableMonths}
              initialMonthFilter={txMonthFilter}
              initialCategoryFilter={txCategoryFilter}
              initialAccountFilter={txAccountFilter}
              onOpenNewExpense={handleOpenNewExpense}
              onEditExpense={handleOpenEditExpense}
              onUpdateExpenseCategory={(id, categoryId) => updateExpense(id, { categoryId })}
              onDeleteExpense={deleteExpense}
              onDeleteBulk={deleteExpensesBulk}
              onExportCsv={exportCsv}
              onImportCsvBatch={importExpenses}
            />
          )}

          {activeView === 'accounts' && (
            <AccountsView
              accounts={accounts}
              accountMap={accountMap}
              transfers={transfers}
              expenses={expenses}
              selectedMonth={selectedMonth}
              onAddAccount={addAccount}
              onUpdateAccount={updateAccount}
              onDeleteAccount={deleteAccount}
              onAdjustBalance={adjustAccountBalance}
              onTransfer={transferBetweenAccounts}
              onInspectAccountTransactions={handleInspectAccountTransactions}
            />
          )}

          {activeView === 'categories' && (
            <CategoriesView
              categories={categories}
              expenses={expenses}
              selectedMonth={selectedMonth}
              settings={settings}
              totalCategoryBudget={totalCategoryBudget}
              effectiveMonthlyBudget={effectiveMonthlyBudget}
              onAddCategory={addCategory}
              onUpdateCategory={updateCategory}
              onDeleteCategory={deleteCategory}
              onUpdateSettings={updateSettings}
            />
          )}

          {activeView === 'patterns' && (
            <PatternsView
              expenses={expenses}
              categories={categories}
              selectedMonth={selectedMonth}
              onDrillDown={handleDrillDownFromPatterns}
            />
          )}
        </main>
      </div>

      <ExpenseModal
        isOpen={expenseModalOpen}
        initialExpense={editingExpense}
        categories={categories}
        accounts={accounts}
        defaultMonth={selectedMonth}
        onClose={() => setExpenseModalOpen(false)}
        onSave={handleSaveExpense}
      />

      {confirmClearOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-confirm-title"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg p-6 space-y-4">
            <h2 id="clear-confirm-title" className="font-display text-base font-semibold text-slate-900">
              Clear all logged expenses?
            </h2>
            <p className="text-sm text-slate-600">
              This removes all {expenses.length} expenses from your ledger while keeping your
              categories and account balances intact. You can restore sample data anytime from the
              sidebar.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllExpenses();
                  setConfirmClearOpen(false);
                }}
                className="px-4 py-2 text-xs font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg"
              >
                Clear Expenses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
