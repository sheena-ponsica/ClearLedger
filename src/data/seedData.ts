import { Account, AccountTransfer, BudgetSettings, Category, Expense } from '../types/budget';

export const CATEGORY_COLOR_PALETTE = [
  '#0F766E', // Deep Teal
  '#047857', // Emerald
  '#2563EB', // Cobalt
  '#4F46E5', // Indigo
  '#D97706', // Amber
  '#DC2626', // Crimson
  '#0284C7', // Sky
  '#64748B', // Slate
  '#7C3AED', // Violet
  '#BE185D', // Berry
];

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc-bdo',
    name: 'BDO Savings',
    institution: 'BDO',
    kind: 'bank',
    balance: 68500.0,
    color: '#1D4ED8',
    notes: 'Primary payroll & bills account',
  },
  {
    id: 'acc-chinabank',
    name: 'Chinabank Savings',
    institution: 'Chinabank',
    kind: 'bank',
    balance: 42300.0,
    color: '#B91C1C',
    notes: 'Passbook & check reserve',
  },
  {
    id: 'acc-maribank',
    name: 'MariBank',
    institution: 'MariBank',
    kind: 'bank',
    balance: 35800.0,
    color: '#EA580C',
    notes: 'Daily interest savings',
  },
  {
    id: 'acc-maya-savings',
    name: 'Maya Savings',
    institution: 'Maya',
    kind: 'bank',
    balance: 54200.0,
    color: '#047857',
    notes: 'High-yield digital savings',
  },
  {
    id: 'acc-gcash',
    name: 'GCash Wallet',
    institution: 'GCash',
    kind: 'ewallet',
    balance: 9450.0,
    color: '#0284C7',
    notes: 'QR payments, load & transfers',
  },
  {
    id: 'acc-cash-on-hand',
    name: 'Cash on Hand',
    institution: 'Cash',
    kind: 'cash',
    balance: 3850.0,
    color: '#475569',
    notes: 'Physical bills & coins in wallet',
  },
  {
    id: 'acc-gotyme-main',
    name: 'GoTyme Everyday',
    institution: 'GoTyme',
    kind: 'bank',
    balance: 14200.0,
    color: '#0F766E',
    notes: 'Main GoTyme debit card wallet',
  },
  {
    id: 'acc-gosave-1',
    name: 'GoSave 1 · Emergency Fund',
    institution: 'GoTyme',
    kind: 'gosave',
    balance: 85000.0,
    goalAmount: 150000,
    color: '#0D9488',
  },
  {
    id: 'acc-gosave-2',
    name: 'GoSave 2 · Travel Fund',
    institution: 'GoTyme',
    kind: 'gosave',
    balance: 28500.0,
    goalAmount: 60000,
    color: '#0F766E',
  },
  {
    id: 'acc-gosave-3',
    name: 'GoSave 3 · Bills & Annual Dues',
    institution: 'GoTyme',
    kind: 'gosave',
    balance: 19000.0,
    goalAmount: 30000,
    color: '#14B8A6',
  },
  {
    id: 'acc-gosave-4',
    name: 'GoSave 4 · Home & Tech',
    institution: 'GoTyme',
    kind: 'gosave',
    balance: 22400.0,
    goalAmount: 45000,
    color: '#115E59',
  },
  {
    id: 'acc-gosave-5',
    name: 'GoSave 5 · Tax & Investments',
    institution: 'GoTyme',
    kind: 'gosave',
    balance: 31000.0,
    goalAmount: 50000,
    color: '#047857',
  },
];

export const DEFAULT_TRANSFERS: AccountTransfer[] = [
  {
    id: 'trf-1',
    date: '2026-11-01',
    fromAccountId: 'acc-bdo',
    toAccountId: 'acc-gosave-1',
    amount: 10000,
    note: 'Monthly emergency fund top-up',
  },
  {
    id: 'trf-2',
    date: '2026-11-02',
    fromAccountId: 'acc-bdo',
    toAccountId: 'acc-gcash',
    amount: 5000,
    note: 'Weekly e-wallet allowance',
  },
  {
    id: 'trf-3',
    date: '2026-11-05',
    fromAccountId: 'acc-gotyme-main',
    toAccountId: 'acc-gosave-2',
    amount: 3500,
    note: 'Travel stash transfer',
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-housing', name: 'Housing & Utilities', color: '#0F766E' },
  { id: 'cat-groceries', name: 'Groceries', color: '#047857' },
  { id: 'cat-dining', name: 'Dining & Coffee', color: '#D97706' },
  { id: 'cat-transport', name: 'Transportation', color: '#2563EB' },
  { id: 'cat-subscriptions', name: 'Subscriptions', color: '#4F46E5' },
  { id: 'cat-shopping', name: 'Shopping & Home', color: '#0284C7' },
  { id: 'cat-health', name: 'Healthcare', color: '#DC2626' },
  { id: 'cat-leisure', name: 'Travel & Leisure', color: '#64748B' },
];

export const DEFAULT_SETTINGS: BudgetSettings = {
  currency: 'PHP',
  monthlyTargetOverride: null,
};

export const CURRENT_MONTH_KEY = '2026-11';
export const TODAY_ISO = '2026-11-14';

export const SEED_EXPENSES: Expense[] = [
  // --- November 2026 (up to Nov 14) ---
  { id: 'exp-1101', date: '2026-11-01', merchant: 'Condo Monthly Rent', categoryId: 'cat-housing', amount: 18500.0, paymentMethod: 'Bank Transfer', accountId: 'acc-bdo', recurring: true, notes: 'Monthly lease' },
  { id: 'exp-1102', date: '2026-11-02', merchant: 'Landers Superstore', categoryId: 'cat-groceries', amount: 3420.5, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-1103', date: '2026-11-02', merchant: 'Yardstick Coffee', categoryId: 'cat-dining', amount: 245.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-1104', date: '2026-11-03', merchant: 'PLDT Home Fiber', categoryId: 'cat-housing', amount: 1699.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-1105', date: '2026-11-04', merchant: 'GrabCar Rides', categoryId: 'cat-transport', amount: 685.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-1106', date: '2026-11-05', merchant: 'SM Supermarket', categoryId: 'cat-groceries', amount: 2380.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-1107', date: '2026-11-05', merchant: 'Spotify & Google One', categoryId: 'cat-subscriptions', amount: 368.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-1108', date: '2026-11-06', merchant: 'Manam Comfort Filipino', categoryId: 'cat-dining', amount: 1450.0, paymentMethod: 'Debit Card', accountId: 'acc-maribank', recurring: false, notes: 'Friday dinner' },
  { id: 'exp-1109', date: '2026-11-07', merchant: 'Uniqlo SM Aura', categoryId: 'cat-shopping', amount: 2490.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false, notes: 'Workwear shirts' },
  { id: 'exp-1110', date: '2026-11-08', merchant: 'Meralco Electricity', categoryId: 'cat-housing', amount: 3680.4, paymentMethod: 'Bank Transfer', accountId: 'acc-bdo', recurring: true },
  { id: 'exp-1111', date: '2026-11-09', merchant: 'Mercury Drug', categoryId: 'cat-health', amount: 940.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-1112', date: '2026-11-10', merchant: 'Robinsons Supermarket', categoryId: 'cat-groceries', amount: 2150.75, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-1113', date: '2026-11-11', merchant: 'Netflix & iCloud+', categoryId: 'cat-subscriptions', amount: 728.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-1114', date: '2026-11-11', merchant: 'Harlan + Holden Coffee', categoryId: 'cat-dining', amount: 215.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-1115', date: '2026-11-12', merchant: 'Petron Blaze Fuel', categoryId: 'cat-transport', amount: 1850.0, paymentMethod: 'Debit Card', accountId: 'acc-chinabank', recurring: false },
  { id: 'exp-1116', date: '2026-11-13', merchant: 'Muji BGC', categoryId: 'cat-shopping', amount: 1280.0, paymentMethod: 'Debit Card', accountId: 'acc-maribank', recurring: false },
  { id: 'exp-1117', date: '2026-11-14', merchant: 'Wildflour Cafe', categoryId: 'cat-dining', amount: 1690.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false, notes: 'Weekend brunch' },

  // --- October 2026 ---
  { id: 'exp-1001', date: '2026-10-01', merchant: 'Condo Monthly Rent', categoryId: 'cat-housing', amount: 18500.0, paymentMethod: 'Bank Transfer', accountId: 'acc-bdo', recurring: true },
  { id: 'exp-1002', date: '2026-10-03', merchant: 'PLDT Home Fiber', categoryId: 'cat-housing', amount: 1699.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-1003', date: '2026-10-03', merchant: 'Landers Superstore', categoryId: 'cat-groceries', amount: 3890.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-1004', date: '2026-10-04', merchant: 'Autosweep & Easytrip RFID', categoryId: 'cat-transport', amount: 1500.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-1005', date: '2026-10-05', merchant: 'Spotify & Google One', categoryId: 'cat-subscriptions', amount: 368.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-1006', date: '2026-10-07', merchant: 'Ooma Sushi Bar', categoryId: 'cat-dining', amount: 1640.0, paymentMethod: 'Debit Card', accountId: 'acc-maribank', recurring: false },
  { id: 'exp-1007', date: '2026-10-08', merchant: 'Meralco Electricity', categoryId: 'cat-housing', amount: 3920.0, paymentMethod: 'Bank Transfer', accountId: 'acc-bdo', recurring: true },
  { id: 'exp-1008', date: '2026-10-10', merchant: 'SM Supermarket', categoryId: 'cat-groceries', amount: 2740.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-1009', date: '2026-10-11', merchant: 'Netflix & iCloud+', categoryId: 'cat-subscriptions', amount: 728.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-1010', date: '2026-10-12', merchant: 'Hi-Precision Diagnostics', categoryId: 'cat-health', amount: 2650.0, paymentMethod: 'Bank Transfer', accountId: 'acc-chinabank', recurring: false, notes: 'Annual lab checkup' },
  { id: 'exp-1011', date: '2026-10-15', merchant: 'Shopee Mall Home', categoryId: 'cat-shopping', amount: 2340.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-1012', date: '2026-10-17', merchant: 'The Marketplace', categoryId: 'cat-groceries', amount: 2980.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-1013', date: '2026-10-18', merchant: 'Mendokoro Ramenba', categoryId: 'cat-dining', amount: 1280.0, paymentMethod: 'Cash', accountId: 'acc-cash-on-hand', recurring: false },
  { id: 'exp-1014', date: '2026-10-20', merchant: 'GrabCar Rides', categoryId: 'cat-transport', amount: 1120.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-1015', date: '2026-10-22', merchant: 'Canva & ChatGPT Plus', categoryId: 'cat-subscriptions', amount: 1399.0, paymentMethod: 'Debit Card', accountId: 'acc-maribank', recurring: true },
  { id: 'exp-1016', date: '2026-10-24', merchant: 'SM Supermarket', categoryId: 'cat-groceries', amount: 2180.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-1017', date: '2026-10-25', merchant: 'Power Plant Cinema', categoryId: 'cat-leisure', amount: 1350.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-1018', date: '2026-10-27', merchant: 'Shell Fuel Station', categoryId: 'cat-transport', amount: 1950.0, paymentMethod: 'Debit Card', accountId: 'acc-chinabank', recurring: false },
  { id: 'exp-1019', date: '2026-10-29', merchant: 'Toby’s Estate Coffee', categoryId: 'cat-dining', amount: 640.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-1020', date: '2026-10-30', merchant: 'IKEA Pasay', categoryId: 'cat-shopping', amount: 3450.0, paymentMethod: 'Debit Card', accountId: 'acc-bdo', recurring: false, notes: 'Kitchen organizers' },

  // --- September 2026 ---
  { id: 'exp-0901', date: '2026-09-01', merchant: 'Condo Monthly Rent', categoryId: 'cat-housing', amount: 18500.0, paymentMethod: 'Bank Transfer', accountId: 'acc-bdo', recurring: true },
  { id: 'exp-0902', date: '2026-09-03', merchant: 'PLDT Home Fiber', categoryId: 'cat-housing', amount: 1699.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-0903', date: '2026-09-04', merchant: 'GrabCar Rides', categoryId: 'cat-transport', amount: 1380.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-0904', date: '2026-09-05', merchant: 'Landers Superstore', categoryId: 'cat-groceries', amount: 3650.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-0905', date: '2026-09-05', merchant: 'Spotify & Google One', categoryId: 'cat-subscriptions', amount: 368.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-0906', date: '2026-09-08', merchant: 'Meralco Electricity', categoryId: 'cat-housing', amount: 4120.0, paymentMethod: 'Bank Transfer', accountId: 'acc-bdo', recurring: true },
  { id: 'exp-0907', date: '2026-09-10', merchant: 'Cebu Pacific Air', categoryId: 'cat-leisure', amount: 6450.0, paymentMethod: 'Debit Card', accountId: 'acc-maribank', recurring: false, notes: 'Weekend Boracay flight' },
  { id: 'exp-0908', date: '2026-09-11', merchant: 'Netflix & iCloud+', categoryId: 'cat-subscriptions', amount: 728.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-0909', date: '2026-09-13', merchant: 'SM Supermarket', categoryId: 'cat-groceries', amount: 2890.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-0910', date: '2026-09-16', merchant: 'Wolfgang’s Steakhouse', categoryId: 'cat-dining', amount: 3180.0, paymentMethod: 'Bank Transfer', accountId: 'acc-chinabank', recurring: false },
  { id: 'exp-0911', date: '2026-09-19', merchant: 'Decathlon Pasig', categoryId: 'cat-shopping', amount: 3250.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-0912', date: '2026-09-21', merchant: 'The Marketplace', categoryId: 'cat-groceries', amount: 2620.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-0913', date: '2026-09-22', merchant: 'Canva & ChatGPT Plus', categoryId: 'cat-subscriptions', amount: 1399.0, paymentMethod: 'Debit Card', accountId: 'acc-maribank', recurring: true },
  { id: 'exp-0914', date: '2026-09-24', merchant: 'Petron Blaze Fuel', categoryId: 'cat-transport', amount: 2140.0, paymentMethod: 'Debit Card', accountId: 'acc-chinabank', recurring: false },
  { id: 'exp-0915', date: '2026-09-26', merchant: 'Single Origin Coffee', categoryId: 'cat-dining', amount: 780.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-0916', date: '2026-09-27', merchant: 'Watsons Pharmacy', categoryId: 'cat-health', amount: 1120.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-0917', date: '2026-09-28', merchant: 'Robinsons Supermarket', categoryId: 'cat-groceries', amount: 2340.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-0918', date: '2026-09-29', merchant: 'Nono’s Comfort Kitchen', categoryId: 'cat-dining', amount: 1840.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },

  // --- August 2026 ---
  { id: 'exp-0801', date: '2026-08-01', merchant: 'Condo Monthly Rent', categoryId: 'cat-housing', amount: 18500.0, paymentMethod: 'Bank Transfer', accountId: 'acc-bdo', recurring: true },
  { id: 'exp-0802', date: '2026-08-03', merchant: 'PLDT Home Fiber', categoryId: 'cat-housing', amount: 1699.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-0803', date: '2026-08-04', merchant: 'GrabCar Rides', categoryId: 'cat-transport', amount: 1490.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-0804', date: '2026-08-05', merchant: 'Spotify & Google One', categoryId: 'cat-subscriptions', amount: 368.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-0805', date: '2026-08-06', merchant: 'SM Supermarket', categoryId: 'cat-groceries', amount: 2940.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-0806', date: '2026-08-08', merchant: 'Meralco Electricity', categoryId: 'cat-housing', amount: 4480.0, paymentMethod: 'Bank Transfer', accountId: 'acc-bdo', recurring: true },
  { id: 'exp-0807', date: '2026-08-11', merchant: 'Netflix & iCloud+', categoryId: 'cat-subscriptions', amount: 728.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-0808', date: '2026-08-12', merchant: 'Tagaytay Ridge Villa', categoryId: 'cat-leisure', amount: 5800.0, paymentMethod: 'Bank Transfer', accountId: 'acc-maya-savings', recurring: false },
  { id: 'exp-0809', date: '2026-08-14', merchant: 'Landers Superstore', categoryId: 'cat-groceries', amount: 3560.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-0810', date: '2026-08-15', merchant: 'Jollibee & Mang Inasal', categoryId: 'cat-dining', amount: 860.0, paymentMethod: 'Cash', accountId: 'acc-cash-on-hand', recurring: false },
  { id: 'exp-0811', date: '2026-08-18', merchant: 'Power Mac Center', categoryId: 'cat-shopping', amount: 4590.0, paymentMethod: 'Debit Card', accountId: 'acc-maribank', recurring: false, notes: 'MagSafe & charger' },
  { id: 'exp-0812', date: '2026-08-20', merchant: 'Metro Dental Clinic', categoryId: 'cat-health', amount: 2800.0, paymentMethod: 'Bank Transfer', accountId: 'acc-chinabank', recurring: false },
  { id: 'exp-0813', date: '2026-08-22', merchant: 'Canva & ChatGPT Plus', categoryId: 'cat-subscriptions', amount: 1399.0, paymentMethod: 'Debit Card', accountId: 'acc-maribank', recurring: true },
  { id: 'exp-0814', date: '2026-08-23', merchant: 'Robinsons Supermarket', categoryId: 'cat-groceries', amount: 2680.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-0815', date: '2026-08-25', merchant: 'Shell Fuel Station', categoryId: 'cat-transport', amount: 2210.0, paymentMethod: 'Debit Card', accountId: 'acc-chinabank', recurring: false },
  { id: 'exp-0816', date: '2026-08-28', merchant: 'Las Flores BGC', categoryId: 'cat-dining', amount: 2450.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-0817', date: '2026-08-30', merchant: 'The Marketplace', categoryId: 'cat-groceries', amount: 2190.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },

  // --- July 2026 ---
  { id: 'exp-0701', date: '2026-07-01', merchant: 'Condo Monthly Rent', categoryId: 'cat-housing', amount: 18500.0, paymentMethod: 'Bank Transfer', accountId: 'acc-bdo', recurring: true },
  { id: 'exp-0702', date: '2026-07-03', merchant: 'PLDT Home Fiber', categoryId: 'cat-housing', amount: 1699.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-0703', date: '2026-07-04', merchant: 'Autosweep & Easytrip RFID', categoryId: 'cat-transport', amount: 1500.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-0704', date: '2026-07-05', merchant: 'Spotify & Google One', categoryId: 'cat-subscriptions', amount: 368.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-0705', date: '2026-07-06', merchant: 'Landers Superstore', categoryId: 'cat-groceries', amount: 3480.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-0706', date: '2026-07-08', merchant: 'Meralco Electricity', categoryId: 'cat-housing', amount: 4290.0, paymentMethod: 'Bank Transfer', accountId: 'acc-bdo', recurring: true },
  { id: 'exp-0707', date: '2026-07-11', merchant: 'Netflix & iCloud+', categoryId: 'cat-subscriptions', amount: 728.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-0708', date: '2026-07-12', merchant: 'SM Supermarket', categoryId: 'cat-groceries', amount: 2650.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-0709', date: '2026-07-14', merchant: 'Grace Park Dining', categoryId: 'cat-dining', amount: 2150.0, paymentMethod: 'Debit Card', accountId: 'acc-maribank', recurring: false },
  { id: 'exp-0710', date: '2026-07-16', merchant: 'Subic Bay Hotel', categoryId: 'cat-leisure', amount: 4200.0, paymentMethod: 'Bank Transfer', accountId: 'acc-bdo', recurring: false },
  { id: 'exp-0711', date: '2026-07-18', merchant: 'GrabCar Rides', categoryId: 'cat-transport', amount: 1180.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-0712', date: '2026-07-20', merchant: 'Zara Greenbelt', categoryId: 'cat-shopping', amount: 2890.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-0713', date: '2026-07-22', merchant: 'Canva & ChatGPT Plus', categoryId: 'cat-subscriptions', amount: 1399.0, paymentMethod: 'Debit Card', accountId: 'acc-maribank', recurring: true },
  { id: 'exp-0714', date: '2026-07-24', merchant: 'The Marketplace', categoryId: 'cat-groceries', amount: 2920.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-0715', date: '2026-07-25', merchant: 'Mercury Drug', categoryId: 'cat-health', amount: 890.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-0716', date: '2026-07-27', merchant: 'Mary Grace Cafe', categoryId: 'cat-dining', amount: 1120.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-0717', date: '2026-07-29', merchant: 'Robinsons Supermarket', categoryId: 'cat-groceries', amount: 2140.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },

  // --- June 2026 ---
  { id: 'exp-0601', date: '2026-06-01', merchant: 'Condo Monthly Rent', categoryId: 'cat-housing', amount: 18500.0, paymentMethod: 'Bank Transfer', accountId: 'acc-bdo', recurring: true },
  { id: 'exp-0602', date: '2026-06-03', merchant: 'PLDT Home Fiber', categoryId: 'cat-housing', amount: 1699.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-0603', date: '2026-06-04', merchant: 'GrabCar Rides', categoryId: 'cat-transport', amount: 1290.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-0604', date: '2026-06-05', merchant: 'Spotify & Google One', categoryId: 'cat-subscriptions', amount: 368.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-0605', date: '2026-06-07', merchant: 'SM Supermarket', categoryId: 'cat-groceries', amount: 2790.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-0606', date: '2026-06-08', merchant: 'Meralco Electricity', categoryId: 'cat-housing', amount: 3750.0, paymentMethod: 'Bank Transfer', accountId: 'acc-bdo', recurring: true },
  { id: 'exp-0607', date: '2026-06-11', merchant: 'Netflix & iCloud+', categoryId: 'cat-subscriptions', amount: 728.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: true },
  { id: 'exp-0608', date: '2026-06-13', merchant: 'Landers Superstore', categoryId: 'cat-groceries', amount: 3340.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-0609', date: '2026-06-15', merchant: 'People’s Palace Thai', categoryId: 'cat-dining', amount: 1920.0, paymentMethod: 'Debit Card', accountId: 'acc-maribank', recurring: false },
  { id: 'exp-0610', date: '2026-06-18', merchant: 'IKEA Pasay', categoryId: 'cat-shopping', amount: 4180.0, paymentMethod: 'Debit Card', accountId: 'acc-bdo', recurring: false },
  { id: 'exp-0611', date: '2026-06-20', merchant: 'SM MOA Concert Tickets', categoryId: 'cat-leisure', amount: 3200.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
  { id: 'exp-0612', date: '2026-06-22', merchant: 'Canva & ChatGPT Plus', categoryId: 'cat-subscriptions', amount: 1399.0, paymentMethod: 'Debit Card', accountId: 'acc-maribank', recurring: true },
  { id: 'exp-0613', date: '2026-06-23', merchant: 'Petron Blaze Fuel', categoryId: 'cat-transport', amount: 2050.0, paymentMethod: 'Debit Card', accountId: 'acc-chinabank', recurring: false },
  { id: 'exp-0614', date: '2026-06-25', merchant: 'Robinsons Supermarket', categoryId: 'cat-groceries', amount: 2540.0, paymentMethod: 'Debit Card', accountId: 'acc-gotyme-main', recurring: false },
  { id: 'exp-0615', date: '2026-06-27', merchant: 'The Medical City Clinic', categoryId: 'cat-health', amount: 1850.0, paymentMethod: 'Bank Transfer', accountId: 'acc-chinabank', recurring: false },
  { id: 'exp-0616', date: '2026-06-29', merchant: 'Bo’s Coffee', categoryId: 'cat-dining', amount: 640.0, paymentMethod: 'E-Wallet', accountId: 'acc-gcash', recurring: false },
];

export function formatCurrency(amount: number, showDecimals = true): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function getMonthLabel(monthKey: string, short = false): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', {
    month: short ? 'short' : 'long',
    year: short ? '2-digit' : 'numeric',
  });
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const d = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getLastNMonths(anchorMonthKey: string, count: number): string[] {
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    months.push(shiftMonthKey(anchorMonthKey, -i));
  }
  return months;
}

export function getDaysInMonth(monthKey: string): number {
  const [yearStr, monthStr] = monthKey.split('-');
  return new Date(Number(yearStr), Number(monthStr), 0).getDate();
}

export function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
