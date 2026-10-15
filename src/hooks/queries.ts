import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Account,
  AccountType,
  BudgetList,
  Category,
  CategoryBreakdown,
  DashboardSummary,
  GoalStatus,
  ImportAdapter,
  ImportBatch,
  ImportRow,
  ImportRowStatus,
  ImportSummary,
  Insights,
  MerchantRule,
  Page,
  SavingsGoal,
  Transaction,
  TransactionType,
  Trends,
  User,
} from '@/lib/types';

export interface YearMonth {
  year: number;
  month: number;
}

/** Ledger changes ripple into balances, analytics, budgets and insights; refetch them all. */
function invalidateMoney(qc: QueryClient) {
  for (const key of ['transactions', 'summary', 'breakdown', 'trends', 'insights', 'budgets', 'accounts', 'transaction']) {
    qc.invalidateQueries({ queryKey: [key] });
  }
}

// ── Dashboard & analytics ──────────────────────────────────────────────────────

export const useSummary = (ym: YearMonth) =>
  useQuery({
    queryKey: ['summary', ym],
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary', { ...ym }),
    placeholderData: keepPreviousData,
  });

export const useBreakdown = (ym: YearMonth) =>
  useQuery({
    queryKey: ['breakdown', ym],
    queryFn: () => api.get<CategoryBreakdown>('/analytics/categories', { ...ym }),
    placeholderData: keepPreviousData,
  });

export const useTrends = (months: number) =>
  useQuery({
    queryKey: ['trends', months],
    queryFn: () => api.get<Trends>('/analytics/trends', { months }),
    placeholderData: keepPreviousData,
  });

export const useInsights = () =>
  useQuery({ queryKey: ['insights'], queryFn: () => api.get<Insights>('/insights') });

// ── Transactions ───────────────────────────────────────────────────────────────

export interface TxFilters {
  q?: string;
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  uncategorized?: boolean;
  from?: string;
  to?: string;
}

export const useTransactions = (filters: TxFilters, limit = 30) =>
  useInfiniteQuery({
    queryKey: ['transactions', filters, limit],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      api.get<Page<Transaction>>('/transactions', {
        ...filters,
        uncategorized: filters.uncategorized ? 'true' : undefined,
        limit,
        cursor: pageParam,
      }),
    getNextPageParam: (last) => (last.pagination.hasMore ? (last.pagination.nextCursor ?? undefined) : undefined),
  });

export const useTransaction = (id: string) =>
  useQuery({ queryKey: ['transaction', id], queryFn: () => api.get<Transaction>(`/transactions/${id}`) });

export interface NewTransaction {
  accountId: string;
  type: TransactionType;
  amount: string;
  description: string;
  categoryId?: string;
  occurredAt?: string;
  merchantName?: string;
  notes?: string;
}
export const useCreateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: NewTransaction) => api.post<Transaction>('/transactions', b),
    onSuccess: () => invalidateMoney(qc),
  });
};

export interface TransactionPatch {
  categoryId?: string | null;
  merchantName?: string | null;
  notes?: string | null;
  type?: TransactionType;
  isReviewed?: boolean;
}
export const useUpdateTransaction = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: TransactionPatch) => api.patch<Transaction>(`/transactions/${id}`, b),
    onSuccess: () => invalidateMoney(qc),
  });
};

export const useDeleteTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => invalidateMoney(qc),
  });
};

// ── Accounts ───────────────────────────────────────────────────────────────────

export const useAccounts = () =>
  useQuery({ queryKey: ['accounts'], queryFn: () => api.get<Account[]>('/accounts') });

export interface AccountInput {
  name?: string;
  type?: AccountType;
  openingBalance?: string;
  isActive?: boolean;
}
export const useSaveAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: AccountInput & { id?: string }) =>
      id ? api.patch<Account>(`/accounts/${id}`, body) : api.post<Account>('/accounts', body),
    onSuccess: () => invalidateMoney(qc),
  });
};
export const useDeleteAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/accounts/${id}`),
    onSuccess: () => invalidateMoney(qc),
  });
};

// ── Categories & rules ─────────────────────────────────────────────────────────

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/categories'), staleTime: 5 * 60_000 });

export interface CategoryInput {
  name?: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
}
export const useSaveCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: CategoryInput & { id?: string }) =>
      id ? api.patch<Category>(`/categories/${id}`, body) : api.post<Category>('/categories', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      invalidateMoney(qc);
    },
  });
};
export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['rules'] });
      invalidateMoney(qc);
    },
  });
};

export const useRules = () =>
  useQuery({ queryKey: ['rules'], queryFn: () => api.get<MerchantRule[]>('/merchant-rules') });

export interface RuleInput {
  pattern?: string;
  categoryId?: string;
  normalizedName?: string | null;
  priority?: number;
}
export const useSaveRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: RuleInput & { id?: string }) =>
      id ? api.patch<MerchantRule>(`/merchant-rules/${id}`, body) : api.post<MerchantRule>('/merchant-rules', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  });
};
export const useDeleteRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/merchant-rules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  });
};
export const useApplyRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ updated: number }>(`/merchant-rules/${id}/apply`),
    onSuccess: () => invalidateMoney(qc),
  });
};

// ── Budgets ────────────────────────────────────────────────────────────────────

export const useBudgets = (ym: YearMonth) =>
  useQuery({
    queryKey: ['budgets', ym],
    queryFn: () => api.get<BudgetList>('/budgets', { ...ym }),
    placeholderData: keepPreviousData,
  });

export const useUpsertBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, ...body }: { categoryId: string; amount: string } & Partial<YearMonth>) =>
      api.put(`/budgets/${categoryId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['insights'] });
    },
  });
};
export const useDeleteBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, year, month }: { categoryId: string } & YearMonth) =>
      api.delete(`/budgets/${categoryId}`, { year, month }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['insights'] });
    },
  });
};

// ── Savings goals ──────────────────────────────────────────────────────────────

export const useGoals = () =>
  useQuery({ queryKey: ['goals'], queryFn: () => api.get<SavingsGoal[]>('/savings-goals') });

export interface GoalInput {
  name?: string;
  targetAmount?: string;
  currentAmount?: string;
  targetDate?: string | null;
  notes?: string | null;
  status?: GoalStatus;
}
export const useSaveGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: GoalInput & { id?: string }) =>
      id ? api.patch<SavingsGoal>(`/savings-goals/${id}`, body) : api.post<SavingsGoal>('/savings-goals', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['insights'] });
    },
  });
};
export const useDeleteGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/savings-goals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['insights'] });
    },
  });
};

// ── Imports ────────────────────────────────────────────────────────────────────

export const useImportAdapters = () =>
  useQuery({ queryKey: ['import-adapters'], queryFn: () => api.get<ImportAdapter[]>('/imports/adapters'), staleTime: Infinity });

export const useImports = () =>
  useInfiniteQuery({
    queryKey: ['imports'],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => api.get<Page<ImportBatch>>('/imports', { limit: 20, cursor: pageParam }),
    getNextPageParam: (last) => (last.pagination.hasMore ? (last.pagination.nextCursor ?? undefined) : undefined),
  });

/** Polls while the batch is still being processed (async server mode). */
export const useImportBatch = (id: string) =>
  useQuery({
    queryKey: ['import', id],
    queryFn: () => api.get<ImportBatch>(`/imports/${id}`),
    refetchInterval: (q) => (q.state.data && !q.state.data.isFinished ? 2000 : false),
  });

export const useImportRows = (id: string, status?: ImportRowStatus) =>
  useInfiniteQuery({
    queryKey: ['import-rows', id, status],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => api.get<Page<ImportRow>>(`/imports/${id}/rows`, { status, limit: 50, cursor: pageParam }),
    getNextPageParam: (last) => (last.pagination.hasMore ? (last.pagination.nextCursor ?? undefined) : undefined),
  });

export interface UploadArgs {
  accountId: string;
  adapterKey?: string;
  file: { uri: string; name: string; mimeType?: string };
}
/** 201 (sync mode) returns the summary; 202 (async mode) returns the batch, which has `batchId` too. */
export type UploadResponse = Partial<ImportSummary> & { batchId: string; status: ImportBatch['status'] };

export const useUploadImport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, adapterKey, file }: UploadArgs) => {
      const form = new FormData();
      form.append('accountId', accountId);
      if (adapterKey) form.append('adapterKey', adapterKey);
      // React Native's FormData accepts a { uri, name, type } descriptor in place of a Blob.
      form.append('file', { uri: file.uri, name: file.name, type: file.mimeType ?? 'text/csv' } as unknown as Blob);
      return api.upload<UploadResponse>('/imports', form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['imports'] });
      invalidateMoney(qc);
    },
  });
};

// ── Profile ────────────────────────────────────────────────────────────────────

export const useUpdateProfile = () =>
  useMutation({
    mutationFn: (b: { displayName?: string; timezone?: string }) => api.patch<User>('/users/me', b),
  });
