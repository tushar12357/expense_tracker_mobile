import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { MonthSwitcher, TransactionRow } from '@/components/domain';
import {
  Card,
  EmptyState,
  ErrorState,
  Fab,
  IconBadge,
  Screen,
  SectionTitle,
  SkeletonCard,
  Text,
  Divider,
} from '@/components/ui';
import { radius, space, useTheme } from '@/constants/theme';
import { useAccounts, useBreakdown, useInsights, useSummary, useTransactions } from '@/hooks/queries';
import { currentYearMonth, formatCompact, formatMoney, formatPct, num } from '@/lib/format';
import { ACCOUNT_TYPES } from '@/lib/icons';
import { useAuth } from '@/providers/auth';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Home() {
  const t = useTheme();
  const { user } = useAuth();
  const [ym, setYm] = useState(currentYearMonth);
  const summary = useSummary(ym);
  const breakdown = useBreakdown(ym);
  const insights = useInsights();
  const accounts = useAccounts();
  const recent = useTransactions({}, 6);

  const refreshing = summary.isRefetching || accounts.isRefetching || recent.isRefetching;
  const refresh = () => {
    summary.refetch();
    breakdown.refetch();
    insights.refetch();
    accounts.refetch();
    recent.refetch();
  };

  const noAccounts = accounts.isSuccess && accounts.data.length === 0;
  const s = summary.data;
  const sts = insights.data?.safeToSpend;
  const isCurrent = ym.year === currentYearMonth().year && ym.month === currentYearMonth().month;
  const totalBalance = (accounts.data ?? [])
    .filter((a) => a.isActive && a.type !== 'CREDIT_CARD')
    .reduce((sum, a) => sum + num(a.currentBalance), 0);
  const recentTx = recent.data?.pages.flatMap((p) => p.data).slice(0, 6) ?? [];
  const topCats = (breakdown.data?.categories ?? []).slice(0, 4);

  return (
    <View style={{ flex: 1 }}>
      <Screen onRefresh={refresh} refreshing={refreshing}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: space.sm }}>
          <View>
            <Text tone="muted">{greeting()},</Text>
            <Text variant="title">{user?.displayName.split(' ')[0] ?? 'there'}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/imports')}
            style={{ backgroundColor: t.primarySoft, padding: 10, borderRadius: 20 }}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="file-upload-outline" size={22} color={t.primary} />
          </Pressable>
        </View>

        {noAccounts && (
          <Card>
            <EmptyState
              icon="bank-plus"
              title="Add your first account"
              message="Create an account (like your savings account), then import a statement or add transactions."
              action="Add account"
              onAction={() => router.push('/accounts')}
            />
          </Card>
        )}

        {/* Hero: safe to spend */}
        {!noAccounts && (
          <LinearGradient
            colors={t.isDark ? ['#2B2670', '#4A3FD0'] : ['#4338CA', '#6D5DF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: radius.xl, padding: space.xl, gap: space.md }}
          >
            {insights.isLoading ? (
              <Text tone="onPrimary" style={{ opacity: 0.8 }}>
                Calculating…
              </Text>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text variant="label" tone="onPrimary" style={{ opacity: 0.85 }}>
                    SAFE TO SPEND THIS MONTH
                  </Text>
                  <MaterialCommunityIcons name="information-outline" size={14} color="rgba(255,255,255,0.7)" />
                </View>
                <Text variant="display" tone="onPrimary">
                  {sts?.amount !== null && sts?.amount !== undefined ? formatMoney(sts.amount, { decimals: false }) : '—'}
                </Text>
                <View style={{ flexDirection: 'row', gap: space.xl, flexWrap: 'wrap' }}>
                  <HeroStat label="Per day" value={sts?.dailyAllowance ? formatMoney(sts.dailyAllowance, { decimals: false }) : '—'} />
                  <HeroStat label="Balance" value={formatMoney(totalBalance, { decimals: false })} />
                  <HeroStat label="Days left" value={String(insights.data?.period.daysRemaining ?? '—')} />
                </View>
                {sts?.shortfall && (
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.16)', padding: 8, borderRadius: radius.md }}>
                    <MaterialCommunityIcons name="alert-outline" size={16} color="#FFD79A" />
                    <Text variant="caption" tone="onPrimary">
                      Upcoming bills and goals exceed your balance.
                    </Text>
                  </View>
                )}
                {sts?.isEstimate && (
                  <Text variant="caption" tone="onPrimary" style={{ opacity: 0.7 }}>
                    Estimate · balance minus expected bills and savings goals
                  </Text>
                )}
              </>
            )}
          </LinearGradient>
        )}

        <MonthSwitcher value={ym} onChange={setYm} />

        {summary.isError ? (
          <ErrorState error={summary.error} onRetry={() => summary.refetch()} />
        ) : !s ? (
          <SkeletonCard />
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <StatTile label="Income" value={s.totalIncome} icon="arrow-down-left" tone="success" />
              <StatTile label="Spent" value={s.netExpenses} icon="arrow-up-right" tone="danger" />
            </View>
            <Card style={{ gap: space.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ gap: 2 }}>
                  <Text variant="label" tone="muted">
                    Net cash flow
                  </Text>
                  <Text variant="title" tone={num(s.netCashFlow) >= 0 ? 'success' : 'danger'}>
                    {formatMoney(s.netCashFlow, { sign: true })}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Text variant="label" tone="muted">
                    Savings rate
                  </Text>
                  <Text variant="heading">{s.savingsRate === null ? 'n/a' : formatPct(s.savingsRate)}</Text>
                </View>
              </View>
              {s.uncategorizedCount > 0 && (
                <Pressable
                  onPress={() => router.push({ pathname: '/transactions', params: { uncategorized: 'true' } })}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.warningSoft, padding: 10, borderRadius: radius.md }}
                >
                  <MaterialCommunityIcons name="tag-off-outline" size={18} color={t.warning} />
                  <Text variant="label" tone="warning" style={{ flex: 1 }}>
                    {s.uncategorizedCount} transaction{s.uncategorizedCount === 1 ? '' : 's'} need a category
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={t.warning} />
                </Pressable>
              )}
            </Card>
          </>
        )}

        {/* Alerts from budgets */}
        {isCurrent && (insights.data?.budgetAlerts.length ?? 0) > 0 && (
          <Card style={{ gap: space.sm }}>
            <SectionTitle title="Budget alerts" action="Open" onAction={() => router.push('/plan')} />
            {insights.data!.budgetAlerts.map((a) => (
              <View key={a.category} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <IconBadge
                  icon={a.status === 'exceeded' ? 'alert-circle-outline' : 'alert-outline'}
                  color={a.status === 'exceeded' ? t.danger : t.warning}
                  size={32}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600' }}>{a.category}</Text>
                  <Text variant="caption" tone="muted">
                    {formatPct(a.utilizationPct)} used ·{' '}
                    {num(a.remaining) < 0 ? `${formatMoney(String(Math.abs(num(a.remaining))))} over` : `${formatMoney(a.remaining)} left`}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Top categories */}
        {topCats.length > 0 && (
          <Card style={{ gap: space.md }}>
            <SectionTitle title="Top spending" action="See all" onAction={() => router.push('/insights')} />
            {topCats.map((c) => (
              <View key={c.categoryId ?? 'none'} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.color ?? t.textFaint }} />
                    <Text style={{ fontWeight: '500' }}>{c.categoryName}</Text>
                  </View>
                  <Text style={{ fontWeight: '600' }}>{formatCompact(c.total)}</Text>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: t.surfaceAlt }}>
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      width: `${Math.min(100, Number(c.percentage ?? 0))}%`,
                      backgroundColor: c.color ?? t.textFaint,
                    }}
                  />
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Accounts */}
        {(accounts.data?.length ?? 0) > 0 && (
          <View style={{ gap: space.md }}>
            <SectionTitle title="Accounts" action="Manage" onAction={() => router.push('/accounts')} />
            <ScrollRow>
              {accounts.data!.filter((a) => a.isActive).map((a) => (
                <Card key={a.id} style={{ width: 168, gap: 10 }} onPress={() => router.push({ pathname: '/transactions', params: { accountId: a.id } })}>
                  <IconBadge icon={ACCOUNT_TYPES.find((x) => x.value === a.type)?.icon ?? 'bank-outline'} size={34} />
                  <View>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {a.name}
                    </Text>
                    <Text variant="heading" tone={num(a.currentBalance) < 0 ? 'danger' : 'default'}>
                      {formatMoney(a.currentBalance, { decimals: false })}
                    </Text>
                    {a.balanceIsEstimate && (
                      <Text variant="caption" tone="faint">
                        Estimate
                      </Text>
                    )}
                  </View>
                </Card>
              ))}
            </ScrollRow>
          </View>
        )}

        {/* Recent */}
        <View style={{ gap: space.md }}>
          <SectionTitle title="Recent activity" action="View all" onAction={() => router.push('/transactions')} />
          {recent.isLoading ? (
            <SkeletonCard lines={4} />
          ) : recentTx.length === 0 ? (
            <Card>
              <EmptyState
                icon="receipt-text-outline"
                title="No transactions yet"
                message="Add one manually or import a bank statement."
                action="Add transaction"
                onAction={() => router.push('/transaction/new')}
              />
            </Card>
          ) : (
            <Card padded={false}>
              {recentTx.map((tx, i) => (
                <View key={tx.id}>
                  {i > 0 && <Divider />}
                  <TransactionRow tx={tx} onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: tx.id } })} />
                </View>
              ))}
            </Card>
          )}
        </View>
      </Screen>
      {!noAccounts && <Fab onPress={() => router.push('/transaction/new')} />}
    </View>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text variant="caption" tone="onPrimary" style={{ opacity: 0.7 }}>
        {label}
      </Text>
      <Text variant="heading" tone="onPrimary">
        {value}
      </Text>
    </View>
  );
}

function StatTile({ label, value, icon, tone }: { label: string; value: string; icon: 'arrow-down-left' | 'arrow-up-right'; tone: 'success' | 'danger' }) {
  const t = useTheme();
  return (
    <Card style={{ flex: 1, gap: 10 }}>
      <IconBadge icon={icon} color={tone === 'success' ? t.success : t.danger} size={34} />
      <View>
        <Text variant="caption" tone="muted">
          {label}
        </Text>
        <Text variant="heading" numberOfLines={1} adjustsFontSizeToFit>
          {formatMoney(value, { decimals: false })}
        </Text>
      </View>
    </Card>
  );
}

/** Horizontal scroller that bleeds to the screen edges while keeping the page gutter. */
function ScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -space.lg }}
      contentContainerStyle={{ gap: space.md, paddingHorizontal: space.lg }}
    >
      {children}
    </ScrollView>
  );
}
