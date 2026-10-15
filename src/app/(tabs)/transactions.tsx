import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountField, CategoryField, TransactionRow } from '@/components/domain';
import { Button, Chip, EmptyState, ErrorState, Fab, Header, Segmented, Sheet, SkeletonCard, Text } from '@/components/ui';
import { radius, space, useTheme } from '@/constants/theme';
import { useAccounts, useTransactions, type TxFilters } from '@/hooks/queries';
import { dayLabel, formatMoney, TYPE_LABEL } from '@/lib/format';
import type { Transaction, TransactionType } from '@/lib/types';

type Range = 'all' | 'this' | 'last' | '3m';
const RANGE_OPTIONS: Array<{ value: Range; label: string }> = [
  { value: 'all', label: 'All time' },
  { value: 'this', label: 'This month' },
  { value: 'last', label: 'Last month' },
  { value: '3m', label: '3 months' },
];

function rangeToDates(r: Range): Pick<TxFilters, 'from' | 'to'> {
  if (r === 'all') return {};
  const now = new Date();
  const startOf = (offset: number) => new Date(now.getFullYear(), now.getMonth() + offset, 1);
  if (r === 'this') return { from: startOf(0).toISOString(), to: startOf(1).toISOString() };
  if (r === 'last') return { from: startOf(-1).toISOString(), to: startOf(0).toISOString() };
  return { from: startOf(-2).toISOString(), to: startOf(1).toISOString() };
}

export default function Transactions() {
  const t = useTheme();
  const params = useLocalSearchParams<{ uncategorized?: string; accountId?: string }>();
  const accounts = useAccounts();

  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [type, setType] = useState<TransactionType | undefined>();
  const [uncategorized, setUncategorized] = useState(false);
  const [accountId, setAccountId] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [range, setRange] = useState<Range>('all');
  const [sheet, setSheet] = useState(false);

  // Deep links from Home ("need a category", account cards) arrive as route params.
  useEffect(() => {
    if (params.uncategorized === 'true') setUncategorized(true);
    if (params.accountId) setAccountId(params.accountId);
  }, [params.uncategorized, params.accountId]);

  useEffect(() => {
    const id = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(id);
  }, [search]);

  const filters = useMemo<TxFilters>(
    () => ({ q: q || undefined, type, uncategorized: uncategorized || undefined, accountId, categoryId, ...rangeToDates(range) }),
    [q, type, uncategorized, accountId, categoryId, range],
  );
  const query = useTransactions(filters);

  const sections = useMemo(() => {
    const items = query.data?.pages.flatMap((p) => p.data) ?? [];
    const out: Array<{ title: string; total: number; data: Transaction[] }> = [];
    for (const tx of items) {
      const title = dayLabel(tx.occurredAt);
      const last = out[out.length - 1];
      const delta = tx.type === 'EXPENSE' ? -Number(tx.amount) : tx.type === 'TRANSFER' ? 0 : Number(tx.amount);
      if (last && last.title === title) {
        last.data.push(tx);
        last.total += delta;
      } else out.push({ title, total: delta, data: [tx] });
    }
    return out;
  }, [query.data]);

  const activeCount =
    (uncategorized ? 1 : 0) + (accountId ? 1 : 0) + (categoryId ? 1 : 0) + (range !== 'all' ? 1 : 0);
  const clearAll = () => {
    setType(undefined);
    setUncategorized(false);
    setAccountId(undefined);
    setCategoryId(undefined);
    setRange('all');
    setSearch('');
    router.setParams({ uncategorized: undefined, accountId: undefined });
  };
  const accountName = accounts.data?.find((a) => a.id === accountId)?.name;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView edges={['top']} style={{ paddingHorizontal: space.lg }}>
        <Header title="Activity" subtitle="Every transaction, searchable" large />
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center', marginTop: space.sm }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: t.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: t.border,
              paddingHorizontal: space.md,
            }}
          >
            <MaterialCommunityIcons name="magnify" size={20} color={t.textFaint} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search description or merchant"
              placeholderTextColor={t.textFaint}
              style={{ flex: 1, color: t.text, fontSize: 15, paddingVertical: 12 }}
              returnKeyType="search"
            />
            {search ? (
              <Pressable onPress={() => setSearch('')} hitSlop={10}>
                <MaterialCommunityIcons name="close-circle" size={18} color={t.textFaint} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => setSheet(true)}
            style={{
              width: 48,
              height: 48,
              borderRadius: radius.md,
              backgroundColor: activeCount ? t.primary : t.surface,
              borderWidth: 1,
              borderColor: activeCount ? t.primary : t.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="tune-variant" size={22} color={activeCount ? t.onPrimary : t.text} />
            {activeCount > 0 && (
              <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: t.danger, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="caption" tone="onPrimary" style={{ fontSize: 10 }}>
                  {activeCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginVertical: space.md, flexWrap: 'wrap' }}>
          <Chip label="All" active={!type} onPress={() => setType(undefined)} />
          {(['EXPENSE', 'INCOME', 'REFUND', 'TRANSFER'] as const).map((k) => (
            <Chip key={k} label={TYPE_LABEL[k]} active={type === k} onPress={() => setType(type === k ? undefined : k)} />
          ))}
        </View>
        {(uncategorized || accountName) && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: space.sm, flexWrap: 'wrap' }}>
            {uncategorized && <Chip label="Needs category" icon="tag-off-outline" active color={t.warning} onPress={() => setUncategorized(false)} />}
            {accountName && <Chip label={accountName} icon="bank-outline" active onPress={() => setAccountId(undefined)} />}
          </View>
        )}
      </SafeAreaView>

      {query.isLoading ? (
        <View style={{ padding: space.lg }}>
          <SkeletonCard lines={4} />
        </View>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(tx) => tx.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 140 }}
          refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => query.refetch()} tintColor={t.primary} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          renderSectionHeader={({ section }) => (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xs }}>
              <Text variant="label" tone="muted">
                {section.title}
              </Text>
              <Text variant="label" tone="faint">
                {section.total === 0 ? '' : formatMoney(String(section.total), { sign: true, decimals: false })}
              </Text>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <View
              style={{
                marginHorizontal: space.lg,
                backgroundColor: t.surface,
                borderColor: t.border,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderTopWidth: index === 0 ? 1 : 0,
                borderBottomWidth: 1,
                borderTopLeftRadius: index === 0 ? radius.lg : 0,
                borderTopRightRadius: index === 0 ? radius.lg : 0,
                borderBottomLeftRadius: index === section.data.length - 1 ? radius.lg : 0,
                borderBottomRightRadius: index === section.data.length - 1 ? radius.lg : 0,
                borderBottomColor: index === section.data.length - 1 ? t.border : t.border,
                overflow: 'hidden',
              }}
            >
              <TransactionRow tx={item} showDate onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: item.id } })} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-text-outline"
              title={q || activeCount || type ? 'No matches' : 'No transactions yet'}
              message={q || activeCount || type ? 'Try changing or clearing your filters.' : 'Add a transaction or import a bank statement.'}
              action={q || activeCount || type ? 'Clear filters' : 'Add transaction'}
              onAction={q || activeCount || type ? clearAll : () => router.push('/transaction/new')}
            />
          }
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={{ margin: space.lg }} color={t.primary} /> : null}
        />
      )}

      <Fab onPress={() => router.push('/transaction/new')} />

      <Sheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title="Filters"
        footer={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Reset" variant="secondary" onPress={clearAll} style={{ flex: 1 }} />
            <Button title="Apply" onPress={() => setSheet(false)} style={{ flex: 1 }} />
          </View>
        }
      >
        <View style={{ gap: 6 }}>
          <Text variant="label" tone="muted">
            Period
          </Text>
          <Segmented options={RANGE_OPTIONS} value={range} onChange={setRange} />
        </View>
        <AccountField label="Account" value={accountId} onChange={setAccountId} includeInactive />
        <CategoryField label="Category" value={categoryId} onChange={(id) => setCategoryId(id ?? undefined)} clearLabel="Any category" />
        <Chip label="Only uncategorized" icon="tag-off-outline" active={uncategorized} onPress={() => setUncategorized((u) => !u)} />
      </Sheet>
    </View>
  );
}
