import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { MonthSwitcher, useCategoryOptions } from '@/components/domain';
import { DateField } from '@/components/date-field';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormError,
  Header,
  IconBadge,
  Input,
  ProgressBar,
  Screen,
  Segmented,
  Sheet,
  SkeletonCard,
  Text,
  SelectField,
} from '@/components/ui';
import { space, useTheme } from '@/constants/theme';
import {
  useBudgets,
  useDeleteBudget,
  useDeleteGoal,
  useGoals,
  useSaveGoal,
  useUpsertBudget,
  type YearMonth,
} from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { currentYearMonth, formatDate, formatMoney, formatPct, isValidAmount, num, sanitizeAmountInput, toDateOnly } from '@/lib/format';
import { categoryIcon } from '@/lib/icons';
import type { BudgetItem, BudgetStatus, GoalStatus, SavingsGoal } from '@/lib/types';
import { useToast } from '@/providers/toast';

export default function Plan() {
  const [tab, setTab] = useState<'budgets' | 'goals'>('budgets');
  return (
    <Screen>
      <Header title="Plan" subtitle="Budgets and savings goals" large />
      <Segmented options={[{ value: 'budgets', label: 'Budgets' }, { value: 'goals', label: 'Savings goals' }]} value={tab} onChange={setTab} />
      {tab === 'budgets' ? <Budgets /> : <Goals />}
    </Screen>
  );
}

// ── Budgets ────────────────────────────────────────────────────────────────────

function statusColor(s: BudgetStatus, t: ReturnType<typeof useTheme>) {
  return s === 'exceeded' ? t.danger : s === 'warning' ? t.warning : t.success;
}

function Budgets() {
  const t = useTheme();
  const toast = useToast();
  const [ym, setYm] = useState<YearMonth>(currentYearMonth);
  const query = useBudgets(ym);
  const upsert = useUpsertBudget();
  const del = useDeleteBudget();

  const [sheet, setSheet] = useState<{ item?: BudgetItem } | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  const data = query.data;
  const budgetedIds = new Set(data?.budgets.map((b) => b.category.id));

  function open(item?: BudgetItem) {
    setSheet({ item });
    setCategoryId(item?.category.id ?? null);
    setAmount(item ? item.amount.replace(/\.00$/, '') : '');
    upsert.reset();
  }

  function save() {
    if (!categoryId) return;
    upsert.mutate(
      { categoryId, amount, ...ym },
      {
        onSuccess: () => {
          setSheet(null);
          toast.show('Budget saved');
        },
      },
    );
  }

  function remove() {
    const item = sheet?.item;
    if (!item) return;
    Alert.alert('Remove budget?', `${item.category.name} will no longer have a limit for this month.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          del.mutate(
            { categoryId: item.category.id, ...ym },
            {
              onSuccess: () => {
                setSheet(null);
                toast.show('Budget removed');
              },
              onError: (e) => toast.show(errorMessage(e), 'error'),
            },
          ),
      },
    ]);
  }

  const total = data ? num(data.totals.budgeted) : 0;
  const totalPct = total > 0 ? (num(data!.totals.spent) / total) * 100 : 0;

  return (
    <>
      <MonthSwitcher value={ym} onChange={setYm} />
      {query.isLoading ? (
        <SkeletonCard lines={3} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <>
          {data && data.budgets.length > 0 && (
            <Card style={{ gap: space.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text variant="caption" tone="muted">
                    Spent of {formatMoney(data.totals.budgeted, { decimals: false })}
                  </Text>
                  <Text variant="title">{formatMoney(data.totals.spent, { decimals: false })}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text variant="caption" tone="muted">
                    {num(data.totals.remaining) >= 0 ? 'Remaining' : 'Over by'}
                  </Text>
                  <Text variant="title" tone={num(data.totals.remaining) >= 0 ? 'success' : 'danger'}>
                    {formatMoney(String(Math.abs(num(data.totals.remaining))), { decimals: false })}
                  </Text>
                </View>
              </View>
              <ProgressBar value={totalPct} color={totalPct > 100 ? t.danger : totalPct >= 80 ? t.warning : t.primary} height={10} />
            </Card>
          )}

          {data && data.budgets.length === 0 ? (
            <Card>
              <EmptyState
                icon="wallet-outline"
                title="No budgets for this month"
                message="Set a monthly limit for categories like Food or Shopping and track it live."
                action="Add budget"
                onAction={() => open()}
              />
            </Card>
          ) : (
            <>
              {data?.budgets.map((b) => {
                const color = statusColor(b.status, t);
                return (
                  <Card key={b.id} onPress={() => open(b)} style={{ gap: space.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                      <IconBadge icon={categoryIcon(b.category.icon)} color={b.category.color ?? undefined} size={40} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '600' }}>{b.category.name}</Text>
                        <Text variant="caption" tone="muted">
                          {formatMoney(b.spent, { decimals: false })} of {formatMoney(b.amount, { decimals: false })}
                        </Text>
                      </View>
                      <Badge label={b.status === 'ok' ? 'ON TRACK' : b.status === 'warning' ? 'NEAR LIMIT' : 'OVER'} tone={b.status === 'ok' ? 'success' : b.status === 'warning' ? 'warning' : 'danger'} />
                    </View>
                    <ProgressBar value={num(b.utilizationPct)} color={color} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text variant="caption" tone="muted">
                        {formatPct(b.utilizationPct)} used
                      </Text>
                      <Text variant="caption" style={{ color, fontWeight: '600' }}>
                        {num(b.remaining) >= 0 ? `${formatMoney(b.remaining, { decimals: false })} left` : `${formatMoney(String(Math.abs(num(b.remaining))), { decimals: false })} over`}
                      </Text>
                    </View>
                  </Card>
                );
              })}
              <Button title="Add budget" icon="plus" variant="secondary" onPress={() => open()} />
            </>
          )}
        </>
      )}

      <Sheet
        visible={!!sheet}
        onClose={() => setSheet(null)}
        title={sheet?.item ? `Edit ${sheet.item.category.name} budget` : 'New budget'}
        footer={
          <View style={{ gap: 10 }}>
            <Button title="Save budget" onPress={save} loading={upsert.isPending} disabled={!categoryId || !isValidAmount(amount)} />
            {sheet?.item && <Button title="Remove budget" variant="danger" onPress={remove} />}
          </View>
        }
      >
        {sheet?.item ? null : <BudgetCategory value={categoryId} onChange={setCategoryId} exclude={budgetedIds} />}
        <Input label="Monthly limit" prefix="₹" value={amount} onChangeText={(v) => setAmount(sanitizeAmountInput(v))} keyboardType="decimal-pad" placeholder="10000" />
        <FormError error={upsert.error} />
      </Sheet>
    </>
  );
}

function BudgetCategory({ value, onChange, exclude }: { value: string | null; onChange: (v: string | null) => void; exclude: Set<string> }) {
  const options = useCategoryOptions({ includeIncome: false }).filter((o) => !exclude.has(o.value));
  return <SelectField label="Category" value={value} options={options} onChange={onChange} placeholder="Choose a category" />;
}

// ── Goals ──────────────────────────────────────────────────────────────────────

const GOAL_STATUS: Array<{ value: GoalStatus; label: string }> = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'ACHIEVED', label: 'Achieved' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function toCents(s: string): number {
  return Math.round(Number(s) * 100);
}

function Goals() {
  const t = useTheme();
  const toast = useToast();
  const query = useGoals();
  const save = useSaveGoal();
  const del = useDeleteGoal();

  const [editing, setEditing] = useState<{ goal?: SavingsGoal } | null>(null);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<GoalStatus>('ACTIVE');

  const [adding, setAdding] = useState<SavingsGoal | null>(null);
  const [addAmount, setAddAmount] = useState('');

  useEffect(() => {
    if (!editing) return;
    const g = editing.goal;
    setName(g?.name ?? '');
    setTarget(g ? g.targetAmount.replace(/\.00$/, '') : '');
    setCurrent(g ? g.currentAmount.replace(/\.00$/, '') : '');
    setDate(g?.targetDate ? new Date(`${g.targetDate}T00:00:00`) : null);
    setNotes(g?.notes ?? '');
    setStatus(g?.status ?? 'ACTIVE');
    save.reset();
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const valid = name.trim().length > 0 && isValidAmount(target) && (current === '' || /^\d{1,12}(\.\d{1,2})?$/.test(current));

  function submit() {
    const body = {
      name: name.trim(),
      targetAmount: target,
      currentAmount: current === '' ? '0' : current,
      targetDate: date ? toDateOnly(date) : null,
      notes: notes.trim() || null,
    };
    save.mutate(
      editing?.goal ? { id: editing.goal.id, ...body, status } : { ...body, ...(body.targetDate === null && { targetDate: undefined }), notes: body.notes ?? undefined },
      {
        onSuccess: () => {
          setEditing(null);
          toast.show(editing?.goal ? 'Goal updated' : 'Goal created');
        },
      },
    );
  }

  function confirmDelete(g: SavingsGoal) {
    Alert.alert('Delete goal?', `"${g.name}" will be removed permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          del.mutate(g.id, {
            onSuccess: () => {
              setEditing(null);
              toast.show('Goal deleted');
            },
            onError: (e) => toast.show(errorMessage(e), 'error'),
          }),
      },
    ]);
  }

  function contribute() {
    if (!adding) return;
    const cents = toCents(adding.currentAmount) + toCents(addAmount);
    save.mutate(
      { id: adding.id, currentAmount: (cents / 100).toFixed(2) },
      {
        onSuccess: () => {
          setAdding(null);
          setAddAmount('');
          toast.show('Contribution added');
        },
      },
    );
  }

  const goals = query.data ?? [];

  return (
    <>
      {query.isLoading ? (
        <SkeletonCard lines={3} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : goals.length === 0 ? (
        <Card>
          <EmptyState
            icon="flag-checkered"
            title="No savings goals yet"
            message="Set a target and date — we'll tell you how much to put away each month."
            action="Create a goal"
            onAction={() => setEditing({})}
          />
        </Card>
      ) : (
        <>
          {goals.map((g) => {
            const pct = num(g.progressPct);
            const inactive = g.status === 'CANCELLED' || g.status === 'PAUSED';
            return (
              <Card key={g.id} onPress={() => setEditing({ goal: g })} style={{ gap: space.md, opacity: inactive ? 0.7 : 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <IconBadge icon={g.status === 'ACHIEVED' ? 'trophy-outline' : 'flag-checkered'} color={g.status === 'ACHIEVED' ? t.success : t.primary} size={42} />
                  <View style={{ flex: 1 }}>
                    <Text variant="heading" numberOfLines={1}>
                      {g.name}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {g.targetDate ? `By ${formatDate(g.targetDate)}` : 'No deadline'}
                    </Text>
                  </View>
                  {g.status !== 'ACTIVE' ? <Badge label={g.status} tone={g.status === 'ACHIEVED' ? 'success' : 'neutral'} /> : g.isOverdue ? <Badge label="OVERDUE" tone="danger" /> : null}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Text variant="title">{formatMoney(g.currentAmount, { decimals: false })}</Text>
                  <Text tone="muted">of {formatMoney(g.targetAmount, { decimals: false })}</Text>
                </View>
                <ProgressBar value={pct} color={g.status === 'ACHIEVED' ? t.success : t.primary} height={10} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="caption" tone="muted">
                    {formatPct(g.progressPct)} · {formatMoney(g.remaining, { decimals: false })} to go
                  </Text>
                  {g.requiredMonthlySaving && (
                    <Text variant="caption" tone="primary" style={{ fontWeight: '600' }}>
                      Save {formatMoney(g.requiredMonthlySaving, { decimals: false })}/mo
                      {g.monthsLeft ? ` · ${g.monthsLeft} mo` : ''}
                    </Text>
                  )}
                </View>
                {g.status === 'ACTIVE' && (
                  <Button title="Add money" icon="plus" size="md" variant="secondary" onPress={() => { setAdding(g); setAddAmount(''); save.reset(); }} />
                )}
              </Card>
            );
          })}
          <Button title="New goal" icon="plus" variant="secondary" onPress={() => setEditing({})} />
        </>
      )}

      {/* Create / edit */}
      <Sheet
        visible={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.goal ? 'Edit goal' : 'New savings goal'}
        footer={
          <View style={{ gap: 10 }}>
            <Button title={editing?.goal ? 'Save changes' : 'Create goal'} onPress={submit} loading={save.isPending} disabled={!valid} />
            {editing?.goal && <Button title="Delete goal" variant="danger" onPress={() => confirmDelete(editing.goal!)} />}
          </View>
        }
      >
        <Input label="Goal name" value={name} onChangeText={setName} placeholder="Emergency fund" maxLength={200} />
        <Input label="Target amount" prefix="₹" value={target} onChangeText={(v) => setTarget(sanitizeAmountInput(v))} keyboardType="decimal-pad" placeholder="200000" />
        <Input label="Saved so far" prefix="₹" value={current} onChangeText={(v) => setCurrent(sanitizeAmountInput(v))} keyboardType="decimal-pad" placeholder="0" />
        <DateField label="Target date (optional)" value={date} onChange={setDate} optional minimumDate={new Date()} />
        <Input label="Notes (optional)" value={notes} onChangeText={setNotes} multiline maxLength={1000} />
        {editing?.goal && (
          <View style={{ gap: 6 }}>
            <Text variant="label" tone="muted">
              Status
            </Text>
            <Segmented options={GOAL_STATUS} value={status} onChange={setStatus} />
          </View>
        )}
        <FormError error={save.error} />
      </Sheet>

      {/* Contribute */}
      <Sheet
        visible={!!adding}
        onClose={() => setAdding(null)}
        title={adding ? `Add to ${adding.name}` : ''}
        footer={<Button title="Add money" onPress={contribute} loading={save.isPending} disabled={!isValidAmount(addAmount)} />}
      >
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <MaterialCommunityIcons name="information-outline" size={18} color={t.textMuted} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            Goals are tracked manually. This adds to the amount you've saved so far.
          </Text>
        </View>
        <Input label="Amount" prefix="₹" value={addAmount} onChangeText={(v) => setAddAmount(sanitizeAmountInput(v))} keyboardType="decimal-pad" autoFocus placeholder="5000" />
        <FormError error={save.error} />
      </Sheet>
    </>
  );
}
