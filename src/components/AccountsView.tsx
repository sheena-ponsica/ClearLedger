import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, Pencil, Plus, SlidersHorizontal, Trash2, X } from 'lucide-react';
import {
  CATEGORY_COLOR_PALETTE,
  TODAY_ISO,
  formatCurrency,
  formatShortDate,
  getMonthKey,
  getMonthLabel,
} from '../data/seedData';
import { Account, AccountKind, AccountTransfer, Expense } from '../types/budget';
import { TablePagination, usePagination } from './TablePagination';

interface AccountsViewProps {
  accounts: Account[];
  accountMap: Map<string, Account>;
  transfers: AccountTransfer[];
  expenses: Expense[];
  selectedMonth: string;
  onAddAccount: (account: Omit<Account, 'id'>) => void;
  onUpdateAccount: (id: string, updates: Partial<Omit<Account, 'id'>>) => void;
  onDeleteAccount: (id: string) => void;
  onAdjustBalance: (id: string, value: number, mode: 'add' | 'set') => void;
  onTransfer: (fromId: string, toId: string, amount: number, note?: string, date?: string) => void;
  onInspectAccountTransactions: (accountId: string) => void;
}

const KIND_LABELS: Record<AccountKind, string> = {
  bank: 'Bank Account',
  ewallet: 'E-Wallet',
  gosave: 'GoTyme GoSave',
  cash: 'Cash on Hand',
};

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  accountMap,
  transfers,
  expenses,
  selectedMonth,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onAdjustBalance,
  onTransfer,
  onInspectAccountTransactions,
}) => {
  // Transfer Modal State
  const [transferOpen, setTransferOpen] = useState(false);
  const [fromId, setFromId] = useState(accounts[0]?.id ?? '');
  const [toId, setToId] = useState(accounts[1]?.id ?? '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState(TODAY_ISO);
  const [transferNote, setTransferNote] = useState('');
  const [transferError, setTransferError] = useState('');

  // Adjust Balance Modal State
  const [adjustAccount, setAdjustAccount] = useState<Account | null>(null);
  const [adjustMode, setAdjustMode] = useState<'add' | 'set'>('add');
  const [adjustValue, setAdjustValue] = useState('');
  const [adjustError, setAdjustError] = useState('');

  // Add / Edit Account Modal State
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accName, setAccName] = useState('');
  const [accInstitution, setAccInstitution] = useState('');
  const [accKind, setAccKind] = useState<AccountKind>('bank');
  const [accBalance, setAccBalance] = useState('0');
  const [accGoal, setAccGoal] = useState('');
  const [accColor, setAccColor] = useState(CATEGORY_COLOR_PALETTE[0]);
  const [accNotes, setAccNotes] = useState('');
  const [accError, setAccError] = useState('');

  const monthOutflowByAccount = useMemo(() => {
    const map = new Map<string, number>();
    expenses
      .filter((e) => getMonthKey(e.date) === selectedMonth && e.accountId)
      .forEach((e) => {
        if (!e.accountId) return;
        map.set(e.accountId, (map.get(e.accountId) ?? 0) + e.amount);
      });
    return map;
  }, [expenses, selectedMonth]);

  const {
    totalBalance,
    bankBalance,
    ewalletBalance,
    goTymeTotal,
    goSaveTotal,
    goSaveTotalGoal,
    goTymeAccounts,
    otherAccounts,
    institutionBreakdown,
  } = useMemo(() => {
    let total = 0;
    let banks = 0;
    let ewallets = 0;
    let gtTotal = 0;
    let gsTotal = 0;
    let gsGoal = 0;

    const gtList: Account[] = [];
    const others: Account[] = [];
    const instTotals = new Map<string, { name: string; balance: number; color: string }>();

    accounts.forEach((acc) => {
      total += acc.balance;
      if (acc.kind === 'ewallet' || acc.kind === 'cash') ewallets += acc.balance;
      else banks += acc.balance;

      if (acc.institution.toLowerCase() === 'gotyme' || acc.kind === 'gosave') {
        gtTotal += acc.balance;
        gtList.push(acc);
        if (acc.kind === 'gosave') {
          gsTotal += acc.balance;
          gsGoal += acc.goalAmount ?? 0;
        }
      } else {
        others.push(acc);
      }

      const instKey = acc.institution || acc.name;
      const prev = instTotals.get(instKey);
      if (prev) {
        prev.balance += acc.balance;
      } else {
        instTotals.set(instKey, { name: instKey, balance: acc.balance, color: acc.color });
      }
    });

    const instList = Array.from(instTotals.values()).sort((a, b) => b.balance - a.balance);

    return {
      totalBalance: total,
      bankBalance: banks,
      ewalletBalance: ewallets,
      goTymeTotal: gtTotal,
      goSaveTotal: gsTotal,
      goSaveTotalGoal: gsGoal,
      goTymeAccounts: gtList,
      otherAccounts: others,
      institutionBreakdown: instList,
    };
  }, [accounts]);

  const goTymeMain = goTymeAccounts.find((a) => a.kind !== 'gosave') ?? null;
  const goSaveAccounts = goTymeAccounts.filter((a) => a.kind === 'gosave');

  const goTymeTableList = useMemo(
    () => [...(goTymeMain ? [goTymeMain] : []), ...goSaveAccounts],
    [goTymeMain, goSaveAccounts]
  );

  const goTymePagination = usePagination(goTymeTableList, 20);
  const otherAccountsPagination = usePagination(otherAccounts, 20);
  const transfersPagination = usePagination(transfers, 20);

  const openTransferModal = (presetFromId?: string) => {
    const first = presetFromId ?? accounts[0]?.id ?? '';
    const second = accounts.find((a) => a.id !== first)?.id ?? first;
    setFromId(first);
    setToId(second);
    setTransferAmount('');
    setTransferDate(TODAY_ISO);
    setTransferNote('');
    setTransferError('');
    setTransferOpen(true);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!fromId || !toId || fromId === toId) {
      setTransferError('Choose two different accounts for the transfer.');
      return;
    }
    if (Number.isNaN(amt) || amt <= 0) {
      setTransferError('Enter a transfer amount greater than ₱0.00.');
      return;
    }
    onTransfer(fromId, toId, amt, transferNote, transferDate);
    setTransferOpen(false);
  };

  const openAdjustModal = (acc: Account, mode: 'add' | 'set' = 'add') => {
    setAdjustAccount(acc);
    setAdjustMode(mode);
    setAdjustValue(mode === 'set' ? acc.balance.toFixed(2) : '');
    setAdjustError('');
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustAccount) return;
    const val = parseFloat(adjustValue);
    if (Number.isNaN(val)) {
      setAdjustError('Enter a valid amount.');
      return;
    }
    onAdjustBalance(adjustAccount.id, val, adjustMode);
    setAdjustAccount(null);
  };

  const openAddAccountModal = (presetKind: AccountKind = 'bank', presetInst = '') => {
    setEditingAccount(null);
    setAccName('');
    setAccInstitution(presetInst);
    setAccKind(presetKind);
    setAccBalance('0');
    setAccGoal(presetKind === 'gosave' ? '50000' : '');
    setAccColor(presetKind === 'gosave' ? '#0F766E' : CATEGORY_COLOR_PALETTE[0]);
    setAccNotes('');
    setAccError('');
    setAccountModalOpen(true);
  };

  const openEditAccountModal = (acc: Account) => {
    setEditingAccount(acc);
    setAccName(acc.name);
    setAccInstitution(acc.institution);
    setAccKind(acc.kind);
    setAccBalance(acc.balance.toFixed(2));
    setAccGoal(acc.goalAmount ? String(acc.goalAmount) : '');
    setAccColor(acc.color);
    setAccNotes(acc.notes ?? '');
    setAccError('');
    setAccountModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(accBalance);
    const goal = accGoal.trim() ? parseFloat(accGoal) : undefined;
    if (!accName.trim()) {
      setAccError('Enter an account or wallet name.');
      return;
    }
    if (!accInstitution.trim()) {
      setAccError('Enter the bank or e-wallet institution (e.g., BDO, GoTyme, GCash).');
      return;
    }
    if (Number.isNaN(bal)) {
      setAccError('Enter a valid balance.');
      return;
    }

    const payload: Omit<Account, 'id'> = {
      name: accName.trim(),
      institution: accInstitution.trim(),
      kind: accKind,
      balance: Math.round(bal * 100) / 100,
      goalAmount: goal && !Number.isNaN(goal) && goal > 0 ? Math.round(goal) : undefined,
      color: accColor,
      notes: accNotes.trim() || undefined,
    };

    if (editingAccount) {
      onUpdateAccount(editingAccount.id, payload);
    } else {
      onAddAccount(payload);
    }
    setAccountModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 4-Column Summary Strip */}
      <section aria-label="Account balance summary">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-5 space-y-1.5">
            <div className="text-xs font-medium text-slate-500">Total Liquid Funds</div>
            <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {formatCurrency(totalBalance)}
            </div>
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              Across {accounts.length} accounts & pockets
            </div>
          </div>

          <div className="p-5 space-y-1.5">
            <div className="text-xs font-medium text-slate-500">Bank Accounts</div>
            <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {formatCurrency(bankBalance)}
            </div>
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              {totalBalance > 0 ? Math.round((bankBalance / totalBalance) * 100) : 0}% of total funds
            </div>
          </div>

          <div className="p-5 space-y-1.5">
            <div className="text-xs font-medium text-slate-500">GoTyme + GoSave Total</div>
            <div className="font-mono text-2xl font-semibold text-emerald-800 tabular-nums">
              {formatCurrency(goTymeTotal)}
            </div>
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              {goSaveAccounts.length} GoSave pockets ({formatCurrency(goSaveTotal, false)})
            </div>
          </div>

          <div className="p-5 space-y-1.5">
            <div className="text-xs font-medium text-slate-500">E-Wallets & Cash</div>
            <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {formatCurrency(ewalletBalance)}
            </div>
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              GCash & Cash on Hand ({totalBalance > 0 ? Math.round((ewalletBalance / totalBalance) * 100) : 0}%)
            </div>
          </div>
        </div>
      </section>

      {/* Institution Allocation Strip & Top Actions */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Funds Distribution by Institution
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Track balances across BDO, GoTyme, MariBank, Chinabank, Maya Savings, GCash, and Cash on Hand.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => openTransferModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>Transfer Funds</span>
            </button>
            <button
              type="button"
              onClick={() => openAddAccountModal('bank', '')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Bank / Wallet</span>
            </button>
          </div>
        </div>

        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          {institutionBreakdown.map((inst) => {
            const pct = totalBalance > 0 ? (inst.balance / totalBalance) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <div
                key={inst.name}
                style={{ width: `${pct}%`, backgroundColor: inst.color }}
                className="h-full border-r border-white/60 last:border-r-0 transition-all duration-300"
                title={`${inst.name}: ${formatCurrency(inst.balance)} (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 pt-1">
          {institutionBreakdown.map((inst) => {
            const pct = totalBalance > 0 ? Math.round((inst.balance / totalBalance) * 100) : 0;
            return (
              <div key={inst.name} className="inline-flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: inst.color }}
                />
                <span className="font-medium text-slate-800">{inst.name}</span>
                <span className="font-mono tabular-nums text-slate-500">
                  {formatCurrency(inst.balance, false)} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* GoTyme Bank & 5 GoSave Accounts */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              GoTyme Bank & GoSave Pockets
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Main wallet plus {goSaveAccounts.length} dedicated GoSave savings pockets
              {goSaveTotalGoal > 0
                ? ` · ${formatCurrency(goSaveTotal, false)} of ${formatCurrency(goSaveTotalGoal, false)} combined goal`
                : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
              {formatCurrency(goTymeTotal)}
            </span>
            <button
              type="button"
              onClick={() => openAddAccountModal('gosave', 'GoTyme')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add GoSave</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-2.5 pl-6 pr-3">Account / GoSave Pocket</th>
                <th className="py-2.5 px-3 text-right">Current Balance</th>
                <th className="py-2.5 px-3 w-64">Savings Goal Progress</th>
                <th className="py-2.5 px-3 text-right">
                  {getMonthLabel(selectedMonth, true)} Outflow
                </th>
                <th className="py-2.5 pl-3 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {goTymePagination.paginatedItems.map((acc) => {
                const outflow = monthOutflowByAccount.get(acc.id) ?? 0;
                const goal = acc.goalAmount ?? 0;
                const pct = goal > 0 ? Math.min(Math.round((acc.balance / goal) * 100), 100) : 0;

                return (
                  <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-6 pr-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-xs shrink-0"
                          style={{ backgroundColor: acc.color }}
                        />
                        <div>
                          <div className="font-medium text-slate-900">{acc.name}</div>
                          <div className="text-xs text-slate-500">
                            {KIND_LABELS[acc.kind]}
                            {acc.notes ? ` · ${acc.notes}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(acc.balance)}
                    </td>
                    <td className="py-3 px-3">
                      {goal > 0 ? (
                        <div className="space-y-1">
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-700 rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] font-mono text-slate-500 tabular-nums">
                            <span>{pct}% of goal</span>
                            <span>{formatCurrency(goal, false)}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Everyday spending account</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {outflow > 0 ? (
                        <button
                          type="button"
                          onClick={() => onInspectAccountTransactions(acc.id)}
                          className="hover:text-emerald-700 hover:underline transition-colors"
                        >
                          {formatCurrency(outflow)}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 pl-3 pr-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openAdjustModal(acc, 'add')}
                          className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="Deposit or adjust balance"
                        >
                          Adjust
                        </button>
                        <button
                          type="button"
                          onClick={() => openTransferModal(acc.id)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-md transition-colors"
                          aria-label={`Transfer from ${acc.name}`}
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditAccountModal(acc)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md transition-colors"
                          aria-label={`Edit ${acc.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {accounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteAccount(acc.id)}
                            className="p-1.5 text-slate-400 hover:text-red-700 rounded-md transition-colors"
                            aria-label={`Delete ${acc.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <TablePagination
            currentPage={goTymePagination.currentPage}
            totalPages={goTymePagination.totalPages}
            pageSize={goTymePagination.pageSize}
            totalItems={goTymePagination.totalItems}
            startIndex={goTymePagination.startIndex}
            endIndex={goTymePagination.endIndex}
            onPageChange={goTymePagination.setPage}
            onPageSizeChange={goTymePagination.setPageSize}
          />
        </div>
      </section>

      {/* Other Banks & E-Wallets */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Banks, E-Wallets & Cash
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              BDO, Chinabank, MariBank, Maya Savings, GCash, Cash on Hand, and any new accounts you open.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {otherAccounts.length} accounts
            </span>
            <button
              type="button"
              onClick={() => openAddAccountModal('bank', '')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Account</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-2.5 pl-6 pr-3">Institution & Account</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">
                  {getMonthLabel(selectedMonth, true)} Outflow
                </th>
                <th className="py-2.5 px-3 text-right">Current Balance</th>
                <th className="py-2.5 pl-3 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {otherAccountsPagination.paginatedItems.map((acc) => {
                const outflow = monthOutflowByAccount.get(acc.id) ?? 0;
                return (
                  <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-6 pr-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-xs shrink-0"
                          style={{ backgroundColor: acc.color }}
                        />
                        <div>
                          <div className="font-medium text-slate-900">{acc.name}</div>
                          {acc.notes && <div className="text-xs text-slate-500">{acc.notes}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">
                      {acc.institution} · {KIND_LABELS[acc.kind]}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {outflow > 0 ? (
                        <button
                          type="button"
                          onClick={() => onInspectAccountTransactions(acc.id)}
                          className="hover:text-emerald-700 hover:underline transition-colors"
                        >
                          {formatCurrency(outflow)}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(acc.balance)}
                    </td>
                    <td className="py-3 pl-3 pr-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openAdjustModal(acc, 'add')}
                          className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          Adjust
                        </button>
                        <button
                          type="button"
                          onClick={() => openTransferModal(acc.id)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-md transition-colors"
                          aria-label={`Transfer from ${acc.name}`}
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditAccountModal(acc)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md transition-colors"
                          aria-label={`Edit ${acc.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {accounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteAccount(acc.id)}
                            className="p-1.5 text-slate-400 hover:text-red-700 rounded-md transition-colors"
                            aria-label={`Delete ${acc.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <TablePagination
            currentPage={otherAccountsPagination.currentPage}
            totalPages={otherAccountsPagination.totalPages}
            pageSize={otherAccountsPagination.pageSize}
            totalItems={otherAccountsPagination.totalItems}
            startIndex={otherAccountsPagination.startIndex}
            endIndex={otherAccountsPagination.endIndex}
            onPageChange={otherAccountsPagination.setPage}
            onPageSizeChange={otherAccountsPagination.setPageSize}
          />
        </div>
      </section>

      {/* Recent Transfers History */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Recent Account Transfers
          </h2>
          <button
            type="button"
            onClick={() => openTransferModal()}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
          >
            + New transfer
          </button>
        </div>
        {transfers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-2.5 pl-6 pr-3">Date</th>
                  <th className="py-2.5 px-3">From</th>
                  <th className="py-2.5 px-3">To</th>
                  <th className="py-2.5 px-3">Note</th>
                  <th className="py-2.5 pl-3 pr-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {transfersPagination.paginatedItems.map((t) => (
                  <tr key={t.id} className="h-10 hover:bg-slate-50/60">
                    <td className="py-2 pl-6 pr-3 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {formatShortDate(t.date)}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {accountMap.get(t.fromAccountId)?.name ?? 'Removed Account'}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {accountMap.get(t.toAccountId)?.name ?? 'Removed Account'}
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-500 truncate max-w-[260px]">
                      {t.note ?? '—'}
                    </td>
                    <td className="py-2 pl-3 pr-6 text-right font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination
              currentPage={transfersPagination.currentPage}
              totalPages={transfersPagination.totalPages}
              pageSize={transfersPagination.pageSize}
              totalItems={transfersPagination.totalItems}
              startIndex={transfersPagination.startIndex}
              endIndex={transfersPagination.endIndex}
              onPageChange={transfersPagination.setPage}
              onPageSizeChange={transfersPagination.setPageSize}
            />
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-xs text-slate-500">
            No internal transfers recorded yet.
          </div>
        )}
      </section>

      {/* Transfer Funds Modal */}
      {transferOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-modal-title"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 id="transfer-modal-title" className="font-display text-base font-semibold text-slate-900">
                Transfer Between Accounts
              </h3>
              <button
                type="button"
                onClick={() => setTransferOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              {transferError && (
                <div className="px-3 py-2 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg">
                  {transferError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">From Account</label>
                <select
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance, false)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">To Account</label>
                <select
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance, false)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Amount (PHP)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-400">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0.00"
                      autoFocus
                      className="w-full pl-7 pr-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Note (optional)</label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="e.g., Monthly GoSave deposit"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTransferOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {adjustAccount && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="adjust-modal-title"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                <h3 id="adjust-modal-title" className="font-display text-base font-semibold text-slate-900">
                  Update Balance · {adjustAccount.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAdjustAccount(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              {adjustError && (
                <div className="px-3 py-2 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg">
                  {adjustError}
                </div>
              )}
              <div className="text-xs text-slate-600 flex justify-between">
                <span>Current Balance:</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(adjustAccount.balance)}
                </span>
              </div>

              <div className="inline-flex w-full p-1 bg-slate-100 border border-slate-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustMode('add');
                    setAdjustValue('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    adjustMode === 'add' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Deposit / Withdraw (+/-)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustMode('set');
                    setAdjustValue(adjustAccount.balance.toFixed(2));
                  }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    adjustMode === 'set' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Set Exact Balance
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {adjustMode === 'add'
                    ? 'Amount to add (use negative e.g. -500 to subtract)'
                    : 'New Exact Balance (PHP)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-400">
                    ₱
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={adjustValue}
                    onChange={(e) => setAdjustValue(e.target.value)}
                    placeholder={adjustMode === 'add' ? 'e.g., 5000 or -1200' : '0.00'}
                    autoFocus
                    className="w-full pl-7 pr-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAdjustAccount(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                >
                  Update Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Account Modal */}
      {accountModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-modal-title"
        >
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 id="account-modal-title" className="font-display text-base font-semibold text-slate-900">
                {editingAccount ? 'Edit Account / Wallet' : 'Add Bank Account or E-Wallet'}
              </h3>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
              {accError && (
                <div className="px-3 py-2 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg">
                  {accError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Account / Pocket Name
                  </label>
                  <input
                    type="text"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    placeholder="e.g., BDO Payroll, GoSave 6"
                    autoFocus
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Institution
                  </label>
                  <input
                    type="text"
                    value={accInstitution}
                    onChange={(e) => setAccInstitution(e.target.value)}
                    placeholder="e.g., BDO, GoTyme, GCash"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Type</label>
                  <select
                    value={accKind}
                    onChange={(e) => {
                      const nextKind = e.target.value as AccountKind;
                      setAccKind(nextKind);
                      if (nextKind === 'cash' && !accInstitution.trim()) {
                        setAccInstitution('Cash');
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="bank">Bank Account</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="gosave">GoTyme GoSave Pocket</option>
                    <option value="cash">Cash on Hand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Current Balance (PHP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-400">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={accBalance}
                      onChange={(e) => setAccBalance(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Savings Goal Target (optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-400">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={accGoal}
                      onChange={(e) => setAccGoal(e.target.value)}
                      placeholder="Optional"
                      className="w-full pl-7 pr-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Notes</label>
                  <input
                    type="text"
                    value={accNotes}
                    onChange={(e) => setAccNotes(e.target.value)}
                    placeholder="Optional purpose"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-medium text-slate-700 mr-1">Color:</span>
                {CATEGORY_COLOR_PALETTE.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setAccColor(hex)}
                    className={`h-5 w-5 rounded-sm ${
                      accColor === hex ? 'ring-2 ring-offset-2 ring-slate-900' : ''
                    }`}
                    style={{ backgroundColor: hex }}
                    aria-label={`Select color ${hex}`}
                  />
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                >
                  {editingAccount ? 'Save Changes' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
