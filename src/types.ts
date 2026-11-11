export type TransactionType = 'expense' | 'income';

export type ExpenseCategoryKey =
  | 'makanan'
  | 'transportasi'
  | 'kebutuhan'
  | 'pendidikan'
  | 'operasional'
  | 'lainnya';

export type IncomeCategoryKey =
  | 'gaji'
  | 'bisnis'
  | 'investasi'
  | 'hadiah'
  | 'freelance'
  | 'lainnya';

export type CategoryKey = ExpenseCategoryKey | IncomeCategoryKey;

export interface CategoryInfo {
  key: string;
  label: string;
  color: string;
  bgLight: string;
  borderColor: string;
  iconName: string;
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategoryKey, CategoryInfo> = {
  makanan: {
    key: 'makanan',
    label: 'Makanan & Minuman',
    color: '#059669', // Emerald-600
    bgLight: 'bg-emerald-50 text-emerald-800',
    borderColor: 'border-emerald-200',
    iconName: 'Utensils',
  },
  transportasi: {
    key: 'transportasi',
    label: 'Transportasi',
    color: '#0284c7', // Sky-600
    bgLight: 'bg-sky-50 text-sky-800',
    borderColor: 'border-sky-200',
    iconName: 'Car',
  },
  kebutuhan: {
    key: 'kebutuhan',
    label: 'Kebutuhan Pokok',
    color: '#047857', // Emerald-700
    bgLight: 'bg-teal-50 text-teal-800',
    borderColor: 'border-teal-200',
    iconName: 'ShoppingBag',
  },
  pendidikan: {
    key: 'pendidikan',
    label: 'Pendidikan',
    color: '#7c3aed', // Violet-600
    bgLight: 'bg-purple-50 text-purple-800',
    borderColor: 'border-purple-200',
    iconName: 'GraduationCap',
  },
  operasional: {
    key: 'operasional',
    label: 'Operasional & Tagihan',
    color: '#d97706', // Amber-600
    bgLight: 'bg-amber-50 text-amber-800',
    borderColor: 'border-amber-200',
    iconName: 'Zap',
  },
  lainnya: {
    key: 'lainnya',
    label: 'Lainnya',
    color: '#4b5563', // Gray-600
    bgLight: 'bg-gray-100 text-gray-800',
    borderColor: 'border-gray-200',
    iconName: 'MoreHorizontal',
  },
};

export const INCOME_CATEGORIES: Record<IncomeCategoryKey, CategoryInfo> = {
  gaji: {
    key: 'gaji',
    label: 'Gaji Pokok & Upah',
    color: '#10b981', // Emerald-500
    bgLight: 'bg-emerald-50 text-emerald-900',
    borderColor: 'border-emerald-300',
    iconName: 'Briefcase',
  },
  bisnis: {
    key: 'bisnis',
    label: 'Usaha & Bisnis',
    color: '#3b82f6', // Blue-500
    bgLight: 'bg-blue-50 text-blue-900',
    borderColor: 'border-blue-300',
    iconName: 'TrendingUp',
  },
  investasi: {
    key: 'investasi',
    label: 'Investasi & Dividen',
    color: '#8b5cf6', // Violet-500
    bgLight: 'bg-purple-50 text-purple-900',
    borderColor: 'border-purple-300',
    iconName: 'PieChart',
  },
  freelance: {
    key: 'freelance',
    label: 'Freelance & Sampingan',
    color: '#06b6d4', // Cyan-500
    bgLight: 'bg-cyan-50 text-cyan-900',
    borderColor: 'border-cyan-300',
    iconName: 'Laptop',
  },
  hadiah: {
    key: 'hadiah',
    label: 'Hadiah & Bonus',
    color: '#f59e0b', // Amber-500
    bgLight: 'bg-amber-50 text-amber-900',
    borderColor: 'border-amber-300',
    iconName: 'Gift',
  },
  lainnya: {
    key: 'lainnya',
    label: 'Pemasukan Lainnya',
    color: '#6b7280', // Gray-500
    bgLight: 'bg-gray-100 text-gray-800',
    borderColor: 'border-gray-200',
    iconName: 'PlusCircle',
  },
};

// Backward-compatible alias
export const CATEGORIES = EXPENSE_CATEGORIES;

export function getCategoryInfo(type: TransactionType, catKey: string): CategoryInfo {
  if (type === 'income') {
    return (
      INCOME_CATEGORIES[catKey as IncomeCategoryKey] || {
        key: catKey,
        label: catKey,
        color: '#10b981',
        bgLight: 'bg-emerald-50 text-emerald-900',
        borderColor: 'border-emerald-300',
        iconName: 'ArrowDownLeft',
      }
    );
  }
  return (
    EXPENSE_CATEGORIES[catKey as ExpenseCategoryKey] || {
      key: catKey,
      label: catKey,
      color: '#ef4444',
      bgLight: 'bg-red-50 text-red-900',
      borderColor: 'border-red-300',
      iconName: 'ArrowUpRight',
    }
  );
}

export interface TransactionItem {
  id: string;
  userId: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  category: string;
  createdAt: any;
  updatedAt: any;
}

export type Expense = TransactionItem & {
  type: 'expense';
  category: ExpenseCategoryKey;
};

export type Income = TransactionItem & {
  type: 'income';
  category: IncomeCategoryKey;
};

export interface FinancialSummary {
  // Saldo
  totalBalance: number; // Total Incomes - Total Expenses
  todayBalance: number;
  monthBalance: number;

  // Pemasukan
  totalIncome: number;
  monthIncome: number;
  todayIncome: number;
  incomeCount: number;

  // Pengeluaran
  totalExpense: number;
  monthExpense: number;
  todayExpense: number;
  expenseCount: number;

  // Global
  totalTransactions: number;
}
