export enum ExpenseCategory {
  Food = 'Food',
  Transport = 'Transport',
  Travel = 'Travel',
  Utilities = 'Utilities',
  Entertainment = 'Entertainment',
  Health = 'Health',
  Shopping = 'Shopping',
  Other = 'Other',
}

export interface Expense {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  notes?: string;
  receiptUrl?: string; // Base64 or blob URL if we store it
  isRecurring?: boolean;
}

export type CategoryBudgets = Partial<Record<ExpenseCategory, number>>;

export interface DashboardStats {
  total: number;
  count: number;
  average: number;
  highestCategory: string;
}

export interface ReceiptData {
  merchant: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
}