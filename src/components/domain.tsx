import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { space, useTheme } from '@/constants/theme';
import { useAccounts, useCategories } from '@/hooks/queries';
import { formatMoney, formatTime, monthLong, shiftMonth, isFutureMonth } from '@/lib/format';
import { ACCOUNT_TYPES, categoryIcon } from '@/lib/icons';
import type { Transaction } from '@/lib/types';
import { IconBadge, SelectField, Text, type Option } from './ui';

export function amountTone(type: Transaction['type']): 'success' | 'default' | 'muted' {
  return type === 'INCOME' || type === 'REFUND' ? 'success' : type === 'TRANSFER' ? 'muted' : 'default';
}

export function signedAmount(tx: Pick<Transaction, 'type' | 'amount'>): string {
  const sign = tx.type === 'INCOME' || tx.type === 'REFUND' ? '+' : tx.type === 'EXPENSE' ? '-' : '';
  return `${sign}${formatMoney(tx.amount).replace('-', '')}`;
}

export const TransactionRow = memo(function TransactionRow({
  tx,
  onPress,
  showDate,
}: {
  tx: Transaction;
  onPress: () => void;
  showDate?: boolean;
}) {
  const t = useTheme();
  const isTransfer = tx.type === 'TRANSFER';
  const icon = isTransfer ? 'swap-horizontal' : categoryIcon(tx.category?.icon);
  const color = isTransfer ? t.textMuted : (tx.category?.color ?? t.textFaint);
  const title = tx.merchantName || tx.description;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingVertical: 12,
        paddingHorizontal: space.lg,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <IconBadge icon={icon} color={color} size={42} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontWeight: '600' }} numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {tx.category?.name ?? (isTransfer ? 'Transfer' : 'Uncategorized')} · {tx.account.name}
          {showDate ? ` · ${formatTime(tx.occurredAt)}` : ''}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={{ fontWeight: '700' }} tone={amountTone(tx.type)}>
          {signedAmount(tx)}
        </Text>
        {!tx.category && !isTransfer ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <MaterialCommunityIcons name="tag-off-outline" size={12} color={t.warning} />
            <Text variant="caption" tone="warning">
              Needs category
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

export function MonthSwitcher({
  value,
  onChange,
}: {
  value: { year: number; month: number };
  onChange: (v: { year: number; month: number }) => void;
}) {
  const t = useTheme();
  const next = shiftMonth(value, 1);
  const canNext = !isFutureMonth(next);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Pressable
        onPress={() => onChange(shiftMonth(value, -1))}
        hitSlop={12}
        style={{ padding: 6, borderRadius: 20, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}
      >
        <MaterialCommunityIcons name="chevron-left" size={22} color={t.text} />
      </Pressable>
      <Text variant="heading">
        {monthLong(value.month)} {value.year}
      </Text>
      <Pressable
        onPress={() => canNext && onChange(next)}
        disabled={!canNext}
        hitSlop={12}
        style={{
          padding: 6,
          borderRadius: 20,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
          opacity: canNext ? 1 : 0.35,
        }}
      >
        <MaterialCommunityIcons name="chevron-right" size={22} color={t.text} />
      </Pressable>
    </View>
  );
}

export function useCategoryOptions(opts: { includeIncome?: boolean } = {}) {
  const { data } = useCategories();
  return useMemo<Array<Option<string>>>(
    () =>
      (data ?? [])
        .filter((c) => opts.includeIncome !== false || !['Salary', 'Other Income'].includes(c.name))
        .map((c) => ({ value: c.id, label: c.name, icon: categoryIcon(c.icon), color: c.color ?? undefined })),
    [data, opts.includeIncome],
  );
}

export function CategoryField({
  value,
  onChange,
  label = 'Category',
  clearLabel = 'No category',
  error,
}: {
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  label?: string;
  clearLabel?: string;
  error?: string | null;
}) {
  const options = useCategoryOptions();
  return (
    <SelectField
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      placeholder="Choose a category"
      clearLabel={clearLabel}
      error={error}
    />
  );
}

export function AccountField({
  value,
  onChange,
  label = 'Account',
  error,
  includeInactive,
}: {
  value: string | null | undefined;
  onChange: (id: string) => void;
  label?: string;
  error?: string | null;
  includeInactive?: boolean;
}) {
  const { data } = useAccounts();
  const options = useMemo<Array<Option<string>>>(
    () =>
      (data ?? [])
        .filter((a) => includeInactive || a.isActive)
        .map((a) => ({
          value: a.id,
          label: a.name,
          description: a.currentBalance ? `Balance ${formatMoney(a.currentBalance)}` : undefined,
          icon: ACCOUNT_TYPES.find((x) => x.value === a.type)?.icon,
        })),
    [data, includeInactive],
  );
  return (
    <SelectField
      label={label}
      value={value}
      options={options}
      onChange={(v) => v && onChange(v)}
      placeholder={options.length ? 'Choose an account' : 'Create an account first'}
      error={error}
    />
  );
}
