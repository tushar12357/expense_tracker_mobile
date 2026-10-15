export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'REFUND';
export type AccountType = 'SAVINGS' | 'CURRENT' | 'CREDIT_CARD' | 'WALLET' | 'CASH';
export type GoalStatus = 'ACTIVE' | 'ACHIEVED' | 'PAUSED' | 'CANCELLED';
export type ImportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
export type ImportRowStatus = 'ACCEPTED' | 'DUPLICATE' | 'SKIPPED' | 'REJECTED';
export type Confidence = 'low' | 'medium' | 'high';
export type BudgetStatus = 'ok' | 'warning' | 'exceeded';

export interface User {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  createdAt: string;
}
export interface AuthResponse {
  user: User;
  token: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  currentBalance?: string;
  balanceIsEstimate?: boolean;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
}
export type CategoryRef = Pick<Category, 'id' | 'name' | 'icon' | 'color'>;

export interface MerchantRule {
  id: string;
  pattern: string;
  categoryId: string;
  normalizedName: string | null;
  priority: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  currency: string;
  occurredAt: string;
  description: string;
  merchantName: string | null;
  notes: string | null;
  sourceTxId: string | null;
  isReviewed: boolean;
  importRowId: string | null;
  transferPeerId: string | null;
  createdAt: string;
  updatedAt: string;
  account: { id: string; name: string; type: AccountType };
  category: CategoryRef | null;
}

export interface Pagination {
  hasMore: boolean;
  nextCursor: string | null;
  count: number;
}
export interface Page<T> {
  data: T[];
  pagination: Pagination;
}

export interface DashboardSummary {
  period: { year: number; month: number; label: string; timezone: string };
  currency: string;
  totalIncome: string;
  totalExpenses: string;
  totalRefunds: string;
  netExpenses: string;
  netCashFlow: string;
  savingsRate: string | null;
  transactionCount: number;
  transferCount: number;
  uncategorizedCount: number;
}

export interface CategoryBreakdown {
  period: { year: number; month: number; label: string };
  currency: string;
  total: string;
  categories: Array<{
    categoryId: string | null;
    categoryName: string;
    color: string | null;
    total: string;
    percentage: string | null;
    previousTotal: string;
    changePct: string | null;
    transactionCount: number;
  }>;
}

export interface TrendMonth {
  month: string;
  income: string;
  netExpenses: string;
  netCashFlow: string;
  savingsRate: string | null;
  incomeChangePct: string | null;
  expenseChangePct: string | null;
}
export interface Trends {
  currency: string;
  months: TrendMonth[];
}

export interface Insights {
  period: { year: number; month: number; today: string; daysRemaining: number };
  currency: string;
  monthOverMonth?: {
    current: { month: string; income: string; netExpenses: string };
    previous?: { month: string; income: string; netExpenses: string };
    incomeChangePct: string | null;
    expenseChangePct: string | null;
  };
  forecast: {
    isEstimate: boolean;
    spentToDate: string;
    projectedMonthEnd: string;
    previousMonthTotal: string;
    method: string;
    confidence: Confidence;
    daysElapsed: number;
    daysRemaining: number;
    notes: string[];
  };
  safeToSpend: {
    isEstimate: boolean;
    amount: string | null;
    dailyAllowance: string | null;
    shortfall: boolean;
    breakdown: {
      availableBalance: string | null;
      upcomingObligations: string;
      remainingSavingsCommitment: string;
    };
    upcomingObligations: Array<{ label: string; amount: string; dueDate: string }>;
    assumptions: string[];
  };
  recurringCandidates: Array<{
    label: string;
    frequency: 'WEEKLY' | 'MONTHLY';
    typicalAmount: string;
    occurrences: number;
    lastSeen: string;
    nextExpected: string;
    confidence: Confidence;
    categoryId: string | null;
    status: 'UNCONFIRMED';
  }>;
  budgetAlerts: Array<{ category: string; status: BudgetStatus; utilizationPct: string | null; remaining: string }>;
  savingsGoals: Array<{
    id: string;
    name: string;
    progressPct: string | null;
    requiredMonthlySaving: string | null;
    isOverdue: boolean;
  }>;
}

export interface BudgetItem {
  id: string;
  category: CategoryRef;
  amount: string;
  spent: string;
  remaining: string;
  utilizationPct: string | null;
  status: BudgetStatus;
  currency: string;
}
export interface BudgetList {
  period: { year: number; month: number };
  totals: { budgeted: string; spent: string; remaining: string };
  budgets: BudgetItem[];
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  currency: string;
  targetDate: string | null;
  status: GoalStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  remaining: string;
  progressPct: string | null;
  monthsLeft: number | null;
  isOverdue: boolean;
  requiredMonthlySaving: string | null;
}

export interface ImportBatch {
  id: string;
  fileName: string;
  adapterKey: string;
  status: ImportStatus;
  totalRows: number;
  acceptedRows: number;
  duplicateRows: number;
  rejectedRows: number;
  skippedRows: number;
  warningCount: number;
  attempts: number;
  errorMeta: { reason?: string; retryable?: boolean } | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  account: { id: string; name: string };
  isFinished: boolean;
}
export interface ImportSummary {
  batchId: string;
  status: ImportStatus;
  totalRows: number;
  acceptedRows: number;
  duplicateRows: number;
  rejectedRows: number;
  skippedRows: number;
  warningCount: number;
  errors: Array<{ rowNumber: number; status: 'DUPLICATE' | 'REJECTED'; reason: string }>;
  errorsTruncated: boolean;
}
export interface ImportRow {
  id: string;
  rowNumber: number;
  status: ImportRowStatus;
  reason: string | null;
  transactionId: string | null;
  normalizedData: Record<string, unknown> | null;
  rawData?: Record<string, unknown>;
}
export interface ImportAdapter {
  key: string;
  displayName: string;
  expectedColumns: string[];
}
