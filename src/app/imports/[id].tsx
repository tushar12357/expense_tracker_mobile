import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { CountGrid, ImportStatusBadge, RowStatusBadge } from '@/components/import-bits';
import { Button, Card, Chip, Divider, EmptyState, ErrorState, Header, Loading, Screen, Text } from '@/components/ui';
import { radius, space, useTheme } from '@/constants/theme';
import { useImportBatch, useImportRows } from '@/hooks/queries';
import { formatDate, formatTime } from '@/lib/format';
import type { ImportRowStatus } from '@/lib/types';

const FILTERS: Array<{ value?: ImportRowStatus; label: string }> = [
  { value: undefined, label: 'All' },
  { value: 'ACCEPTED', label: 'Added' },
  { value: 'DUPLICATE', label: 'Duplicates' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SKIPPED', label: 'Skipped' },
];

export default function ImportDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const batch = useImportBatch(id);
  const [filter, setFilter] = useState<ImportRowStatus | undefined>();
  const rows = useImportRows(id, filter);
  const b = batch.data;
  const items = rows.data?.pages.flatMap((p) => p.data) ?? [];

  if (batch.isLoading) return <Loading />;
  if (batch.isError || !b) {
    return (
      <Screen>
        <Header title="Import" back />
        <ErrorState error={batch.error} onRetry={() => batch.refetch()} />
      </Screen>
    );
  }

  const running = !b.isFinished && b.status !== 'PARTIAL';

  return (
    <Screen edges={['top', 'bottom']} onRefresh={() => { batch.refetch(); rows.refetch(); }} refreshing={batch.isRefetching && !running}>
      <Header title="Import details" back />
      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <MaterialCommunityIcons name="file-delimited-outline" size={32} color={t.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="heading" numberOfLines={2}>
              {b.fileName}
            </Text>
            <Text variant="caption" tone="muted">
              {b.account.name} · {formatDate(b.createdAt)} {formatTime(b.createdAt)} · {b.adapterKey}
            </Text>
          </View>
          <ImportStatusBadge status={b.status} />
        </View>

        {running && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.primarySoft, padding: space.md, borderRadius: radius.md }}>
            <ActivityIndicator color={t.primary} />
            <Text variant="label" tone="primary" style={{ flex: 1 }}>
              {b.status === 'PENDING' ? 'Waiting in the queue…' : 'Processing your statement…'}
            </Text>
          </View>
        )}

        {(b.status === 'FAILED' || b.status === 'PARTIAL') && (
          <View style={{ gap: space.sm, backgroundColor: t.dangerSoft, padding: space.md, borderRadius: radius.md }}>
            <Text variant="label" tone="danger">
              {b.errorMeta?.reason ?? 'The import did not finish. Nothing was saved.'}
            </Text>
            <Text variant="caption" tone="muted">
              Imports are all-or-nothing. Upload the same file again to retry.
            </Text>
            <Button title="Upload again" size="md" variant="secondary" onPress={() => router.replace('/imports/new')} />
          </View>
        )}

        <CountGrid
          items={[
            { label: 'Total rows', value: b.totalRows },
            { label: 'Added', value: b.acceptedRows, tone: 'success' },
            { label: 'Duplicates', value: b.duplicateRows, tone: b.duplicateRows ? 'warning' : 'default' },
            { label: 'Rejected', value: b.rejectedRows, tone: b.rejectedRows ? 'danger' : 'default' },
            { label: 'Skipped', value: b.skippedRows },
            { label: 'Warnings', value: b.warningCount, tone: b.warningCount ? 'warning' : 'default' },
          ]}
        />
        {b.status === 'COMPLETED' && b.acceptedRows > 0 && (
          <Button title="View transactions" size="md" variant="secondary" onPress={() => router.push('/transactions')} />
        )}
      </Card>

      <Text variant="label" tone="muted">
        ROW OUTCOMES
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FILTERS.map((f) => (
          <Chip key={f.label} label={f.label} active={filter === f.value} onPress={() => setFilter(f.value)} />
        ))}
      </View>

      {rows.isLoading ? (
        <ActivityIndicator color={t.primary} />
      ) : rows.isError ? (
        <ErrorState error={rows.error} onRetry={() => rows.refetch()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon="table-search" title="No rows" message={filter ? 'No rows with this outcome.' : running ? 'Rows appear once processing finishes.' : undefined} />
        </Card>
      ) : (
        <>
          <Card padded={false}>
            {items.map((r, i) => {
              const n = r.normalizedData as { description?: string; amount?: string; type?: string; localDate?: string } | null;
              const raw = r.rawData ? Object.values(r.rawData).filter(Boolean).join(' · ') : null;
              return (
                <View key={r.id}>
                  {i > 0 && <Divider />}
                  <View style={{ padding: space.md, paddingHorizontal: space.lg, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text variant="caption" tone="muted">
                        Row {r.rowNumber}
                      </Text>
                      <RowStatusBadge status={r.status} />
                    </View>
                    {n?.description ? (
                      <Text numberOfLines={2} style={{ fontWeight: '500' }}>
                        {n.description}
                      </Text>
                    ) : raw ? (
                      <Text numberOfLines={2} tone="muted">
                        {raw}
                      </Text>
                    ) : null}
                    {(n?.amount || n?.localDate) && (
                      <Text variant="caption" tone="muted">
                        {[n.localDate, n.type, n.amount && `₹${n.amount}`].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                    {r.reason ? (
                      <Text variant="caption" tone={r.status === 'REJECTED' ? 'danger' : 'warning'}>
                        {r.reason}
                      </Text>
                    ) : null}
                    {r.transactionId ? (
                      <Text variant="caption" tone="primary" onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: r.transactionId! } })}>
                        Open transaction
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </Card>
          {rows.hasNextPage && <Button title="Load more rows" variant="secondary" size="md" onPress={() => rows.fetchNextPage()} loading={rows.isFetchingNextPage} />}
        </>
      )}
    </Screen>
  );
}
