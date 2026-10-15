import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { ImportStatusBadge } from '@/components/import-bits';
import { Button, Card, EmptyState, ErrorState, Header, IconBadge, Screen, SkeletonCard, Text, Divider, Group, ListRow } from '@/components/ui';
import { space, useTheme } from '@/constants/theme';
import { useImportAdapters, useImports } from '@/hooks/queries';
import { formatRelative } from '@/lib/format';

export default function Imports() {
  const t = useTheme();
  const query = useImports();
  const adapters = useImportAdapters();
  const items = query.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Screen edges={['top', 'bottom']} onRefresh={() => query.refetch()} refreshing={query.isRefetching && !query.isFetchingNextPage}>
      <Header title="Import statements" back />
      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
          <IconBadge icon="file-delimited-outline" size={46} />
          <View style={{ flex: 1 }}>
            <Text variant="heading">Bring in a bank statement</Text>
            <Text variant="caption" tone="muted">
              Upload a CSV. Duplicates are detected, so overlapping statements are safe.
            </Text>
          </View>
        </View>
        <Button title="Upload CSV" icon="file-upload-outline" onPress={() => router.push('/imports/new')} />
      </Card>

      {adapters.data && (
        <View style={{ gap: space.sm }}>
          <Text variant="label" tone="muted">
            SUPPORTED FORMATS
          </Text>
          <Card style={{ gap: space.md }}>
            {adapters.data.map((a, i) => (
              <View key={a.key} style={{ gap: 4 }}>
                {i > 0 && <Divider />}
                <Text style={{ fontWeight: '600' }}>{a.displayName}</Text>
                <Text variant="caption" tone="muted">
                  Columns: {a.expectedColumns.join(' · ')}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      <Text variant="label" tone="muted">
        HISTORY
      </Text>
      {query.isLoading ? (
        <SkeletonCard />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon="history" title="No imports yet" message="Your uploaded statements will be listed here." />
        </Card>
      ) : (
        <>
          <Group>
            {items.map((b) => (
              <ListRow
                key={b.id}
                icon="file-delimited-outline"
                title={b.fileName}
                subtitle={`${b.account.name} · ${b.acceptedRows} added, ${b.duplicateRows} duplicate${b.rejectedRows ? `, ${b.rejectedRows} rejected` : ''} · ${formatRelative(b.createdAt)}`}
                right={<ImportStatusBadge status={b.status} />}
                onPress={() => router.push({ pathname: '/imports/[id]', params: { id: b.id } })}
              />
            ))}
          </Group>
          {query.hasNextPage && (
            <Button title="Load more" variant="secondary" size="md" onPress={() => query.fetchNextPage()} loading={query.isFetchingNextPage} />
          )}
          {query.isFetchingNextPage && <ActivityIndicator color={t.primary} />}
        </>
      )}
    </Screen>
  );
}
