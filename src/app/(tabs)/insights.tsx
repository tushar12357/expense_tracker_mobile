import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { CHART_PALETTE, DonutChart, TrendChart } from '@/components/charts';
import { MonthSwitcher } from '@/components/domain';
import {
  Badge,
  Card,
  Delta,
  Divider,
  EmptyState,
  ErrorState,
  Header,
  IconBadge,
  Screen,
  SectionTitle,
  Segmented,
  SkeletonCard,
  Text,
} from '@/components/ui';
import { radius, space, useTheme } from '@/constants/theme';
import { useBreakdown, useInsights, useTrends } from '@/hooks/queries';
import { currentYearMonth, formatDate, formatMoney, formatPct, num } from '@/lib/format';

export default function Insights() {
  const t = useTheme();
  const [ym, setYm] = useState(currentYearMonth);
  const [span, setSpan] = useState<'6' | '12'>('6');
  const breakdown = useBreakdown(ym);
  const trends = useTrends(Number(span));
  const insights = useInsights();

  const cats = useMemo(() => breakdown.data?.categories ?? [], [breakdown.data]);
  const slices = useMemo(
    () => cats.map((c, i) => ({ key: c.categoryId ?? 'none', value: num(c.total), color: c.color ?? CHART_PALETTE[i % CHART_PALETTE.length]! })),
    [cats],
  );
  const refresh = () => {
    breakdown.refetch();
    trends.refetch();
    insights.refetch();
  };

  const ins = insights.data;

  return (
    <Screen onRefresh={refresh} refreshing={breakdown.isRefetching || trends.isRefetching || insights.isRefetching}>
      <Header title="Insights" subtitle="Where your money goes and where it's heading" large />

      {/* Forecast */}
      {ins && (
        <Card style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="heading">Month-end forecast</Text>
            <Badge label={`${ins.forecast.confidence.toUpperCase()} CONFIDENCE`} tone={ins.forecast.confidence === 'high' ? 'success' : ins.forecast.confidence === 'medium' ? 'warning' : 'neutral'} />
          </View>
          <View style={{ flexDirection: 'row', gap: space.xl }}>
            <View>
              <Text variant="caption" tone="muted">
                Spent so far
              </Text>
              <Text variant="title">{formatMoney(ins.forecast.spentToDate, { decimals: false })}</Text>
            </View>
            <View>
              <Text variant="caption" tone="muted">
                Projected
              </Text>
              <Text variant="title" tone="primary">
                {formatMoney(ins.forecast.projectedMonthEnd, { decimals: false })}
              </Text>
            </View>
          </View>
          <Text variant="caption" tone="muted">
            Last month you spent {formatMoney(ins.forecast.previousMonthTotal, { decimals: false })} · {ins.forecast.daysRemaining} days left
          </Text>
          {ins.forecast.notes.map((n) => (
            <Text key={n} variant="caption" tone="faint">
              • {n}
            </Text>
          ))}
        </Card>
      )}

      {/* Month over month */}
      {ins?.monthOverMonth?.previous && (
        <Card style={{ gap: space.md }}>
          <Text variant="heading">Month over month</Text>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <MoMTile label="Income" value={ins.monthOverMonth.current.income} change={ins.monthOverMonth.incomeChangePct} />
            <MoMTile label="Spending" value={ins.monthOverMonth.current.netExpenses} change={ins.monthOverMonth.expenseChangePct} invert />
          </View>
        </Card>
      )}

      {/* Trends */}
      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="heading">Trends</Text>
          <View style={{ width: 130 }}>
            <Segmented options={[{ value: '6', label: '6M' }, { value: '12', label: '12M' }]} value={span} onChange={setSpan} />
          </View>
        </View>
        {trends.isLoading ? <SkeletonCard /> : trends.isError ? <ErrorState error={trends.error} onRetry={() => trends.refetch()} /> : <TrendChart months={trends.data!.months} />}
      </Card>

      {/* Category breakdown */}
      <MonthSwitcher value={ym} onChange={setYm} />
      {breakdown.isLoading ? (
        <SkeletonCard lines={4} />
      ) : breakdown.isError ? (
        <ErrorState error={breakdown.error} onRetry={() => breakdown.refetch()} />
      ) : cats.length === 0 ? (
        <Card>
          <EmptyState icon="chart-donut" title="No spending this month" message="Once you add or import expenses, the breakdown shows up here." />
        </Card>
      ) : (
        <Card style={{ gap: space.lg }}>
          <Text variant="heading">Spending by category</Text>
          <View style={{ alignItems: 'center' }}>
            <DonutChart slices={slices} centerLabel="Net spend" centerValue={formatMoney(breakdown.data!.total, { decimals: false })} />
          </View>
          <View>
            {cats.map((c, i) => (
              <View key={c.categoryId ?? 'none'}>
                {i > 0 && <Divider />}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 12 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: slices[i]!.color }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600' }} numberOfLines={1}>
                      {c.categoryName}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {c.transactionCount} txn · {formatPct(c.percentage)} of spend
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 3 }}>
                    <Text style={{ fontWeight: '700' }}>{formatMoney(c.total, { decimals: false })}</Text>
                    <Delta pct={c.changePct} invert />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Safe to spend */}
      {ins && (
        <Card style={{ gap: space.md }}>
          <SectionTitle title="Safe to spend, explained" />
          <Text variant="title" tone={ins.safeToSpend.shortfall ? 'danger' : 'primary'}>
            {ins.safeToSpend.amount !== null ? formatMoney(ins.safeToSpend.amount, { decimals: false }) : '—'}
          </Text>
          <View style={{ gap: 8 }}>
            <BreakdownLine label="Available balance" value={ins.safeToSpend.breakdown.availableBalance} />
            <BreakdownLine label="Upcoming bills" value={ins.safeToSpend.breakdown.upcomingObligations} minus />
            <BreakdownLine label="Goal savings this month" value={ins.safeToSpend.breakdown.remainingSavingsCommitment} minus />
          </View>
          {ins.safeToSpend.upcomingObligations.length > 0 && (
            <View style={{ gap: 6, backgroundColor: t.surfaceAlt, padding: space.md, borderRadius: radius.md }}>
              <Text variant="label" tone="muted">
                Expected before month-end
              </Text>
              {ins.safeToSpend.upcomingObligations.map((o) => (
                <View key={o.label + o.dueDate} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="caption" style={{ flex: 1 }} numberOfLines={1}>
                    {o.label} · {formatDate(o.dueDate, false)}
                  </Text>
                  <Text variant="caption" style={{ fontWeight: '600' }}>
                    {formatMoney(o.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {ins.safeToSpend.assumptions.map((a) => (
            <Text key={a} variant="caption" tone="faint">
              • {a}
            </Text>
          ))}
        </Card>
      )}

      {/* Recurring */}
      {ins && ins.recurringCandidates.length > 0 && (
        <View style={{ gap: space.md }}>
          <SectionTitle title="Likely recurring charges" />
          <Card padded={false}>
            {ins.recurringCandidates.map((r, i) => (
              <View key={r.label + r.frequency}>
                {i > 0 && <Divider />}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg }}>
                  <IconBadge icon="repeat" size={38} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600' }} numberOfLines={1}>
                      {r.label}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {r.frequency === 'MONTHLY' ? 'Monthly' : 'Weekly'} · next ~{formatDate(r.nextExpected, false)} · seen {r.occurrences}×
                    </Text>
                  </View>
                  <Text style={{ fontWeight: '700' }}>{formatMoney(r.typicalAmount, { decimals: false })}</Text>
                </View>
              </View>
            ))}
          </Card>
          <Text variant="caption" tone="faint">
            Detected from your spending pattern — not confirmed by you.
          </Text>
        </View>
      )}

      {/* Goals */}
      {ins && ins.savingsGoals.length > 0 && (
        <Card style={{ gap: space.md }}>
          <SectionTitle title="Goals on track?" action="Open" onAction={() => router.push('/plan')} />
          {ins.savingsGoals.map((g) => (
            <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialCommunityIcons name={g.isOverdue ? 'clock-alert-outline' : 'flag-checkered'} size={20} color={g.isOverdue ? t.danger : t.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600' }}>{g.name}</Text>
                <Text variant="caption" tone="muted">
                  {formatPct(g.progressPct)} done
                  {g.requiredMonthlySaving ? ` · save ${formatMoney(g.requiredMonthlySaving, { decimals: false })}/mo` : ''}
                </Text>
              </View>
              {g.isOverdue && <Badge label="OVERDUE" tone="danger" />}
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

function MoMTile({ label, value, change, invert }: { label: string; value: string; change: string | null; invert?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.surfaceAlt, borderRadius: radius.md, padding: space.md, gap: 4 }}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="heading" numberOfLines={1} adjustsFontSizeToFit>
        {formatMoney(value, { decimals: false })}
      </Text>
      <Delta pct={change} invert={invert} />
    </View>
  );
}

function BreakdownLine({ label, value, minus }: { label: string; value: string | null; minus?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text tone="muted">{label}</Text>
      <Text style={{ fontWeight: '600' }}>
        {value === null ? 'n/a' : `${minus ? '− ' : ''}${formatMoney(value)}`}
      </Text>
    </View>
  );
}
