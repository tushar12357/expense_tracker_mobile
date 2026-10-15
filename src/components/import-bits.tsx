import { View } from 'react-native';
import { radius, space, useTheme } from '@/constants/theme';
import type { ImportRowStatus, ImportStatus } from '@/lib/types';
import { Badge, Text } from './ui';

export function ImportStatusBadge({ status }: { status: ImportStatus }) {
  const map: Record<ImportStatus, { label: string; tone: 'success' | 'danger' | 'warning' | 'primary' | 'neutral' }> = {
    COMPLETED: { label: 'COMPLETED', tone: 'success' },
    FAILED: { label: 'FAILED', tone: 'danger' },
    PARTIAL: { label: 'RETRY NEEDED', tone: 'warning' },
    PROCESSING: { label: 'PROCESSING', tone: 'primary' },
    PENDING: { label: 'QUEUED', tone: 'neutral' },
  };
  return <Badge label={map[status].label} tone={map[status].tone} />;
}

export function RowStatusBadge({ status }: { status: ImportRowStatus }) {
  const tone = { ACCEPTED: 'success', DUPLICATE: 'warning', REJECTED: 'danger', SKIPPED: 'neutral' } as const;
  return <Badge label={status} tone={tone[status]} />;
}

export function CountGrid({
  items,
}: {
  items: Array<{ label: string; value: number; tone?: 'success' | 'warning' | 'danger' | 'default' }>;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
      {items.map((i) => (
        <View key={i.label} style={{ flexGrow: 1, flexBasis: '30%', backgroundColor: t.surfaceAlt, borderRadius: radius.md, padding: space.md, gap: 2 }}>
          <Text variant="title" tone={i.tone ?? 'default'}>
            {i.value}
          </Text>
          <Text variant="caption" tone="muted">
            {i.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
