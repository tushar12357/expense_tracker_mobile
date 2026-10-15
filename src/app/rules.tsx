import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { CategoryField } from '@/components/domain';
import { Badge, Button, Card, Divider, EmptyState, ErrorState, FormError, Header, Input, ListRow, Screen, Sheet, SkeletonCard, Text } from '@/components/ui';
import { useApplyRule, useCategories, useDeleteRule, useRules, useSaveRule } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { categoryIcon } from '@/lib/icons';
import type { MerchantRule } from '@/lib/types';
import { useToast } from '@/providers/toast';

export default function Rules() {
  const toast = useToast();
  const query = useRules();
  const categories = useCategories();
  const save = useSaveRule();
  const del = useDeleteRule();
  const apply = useApplyRule();

  const [editing, setEditing] = useState<{ rule?: MerchantRule } | null>(null);
  const [pattern, setPattern] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [normalized, setNormalized] = useState('');
  const [priority, setPriority] = useState('0');

  useEffect(() => {
    if (!editing) return;
    const r = editing.rule;
    setPattern(r?.pattern ?? '');
    setCategoryId(r?.categoryId ?? null);
    setNormalized(r?.normalizedName ?? '');
    setPriority(String(r?.priority ?? 0));
    save.reset();
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const prio = Number(priority);
  const prioOk = /^-?\d+$/.test(priority) && prio >= -1000 && prio <= 1000;
  const valid = pattern.trim().length >= 2 && !!categoryId && prioOk;
  const catOf = (id: string) => categories.data?.find((c) => c.id === id);

  function submit() {
    save.mutate(
      { id: editing?.rule?.id, pattern: pattern.trim(), categoryId: categoryId!, normalizedName: normalized.trim() || null, priority: prio },
      {
        onSuccess: () => {
          toast.show(editing?.rule ? 'Rule updated' : 'Rule created');
          setEditing(null);
        },
      },
    );
  }

  function runRule(r: MerchantRule) {
    apply.mutate(r.id, {
      onSuccess: ({ updated }) => toast.show(updated === 0 ? 'No unreviewed transactions matched' : `Updated ${updated} transaction${updated === 1 ? '' : 's'}`),
      onError: (e) => toast.show(errorMessage(e), 'error'),
    });
  }

  function confirmDelete(r: MerchantRule) {
    Alert.alert('Delete rule?', 'Transactions already categorized keep their category.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          del.mutate(r.id, {
            onSuccess: () => {
              setEditing(null);
              toast.show('Rule deleted');
            },
            onError: (e) => toast.show(errorMessage(e), 'error'),
          }),
      },
    ]);
  }

  const rules = query.data ?? [];

  return (
    <Screen edges={['top', 'bottom']} onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <Header title="Merchant rules" back right={<Button title="New" icon="plus" size="md" onPress={() => setEditing({})} />} />
      <Text tone="muted">
        When a description contains a rule's text, the transaction is filed under its category — on import and when you tap Apply. Rules never
        override transactions you've reviewed.
      </Text>
      {query.isLoading ? (
        <SkeletonCard lines={3} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : rules.length === 0 ? (
        <Card>
          <EmptyState icon="auto-fix" title="No rules yet" message='Example: "SWIGGY" → Food & Dining.' action="Create rule" onAction={() => setEditing({})} />
        </Card>
      ) : (
        <Card padded={false}>
          {rules.map((r, i) => {
            const c = catOf(r.categoryId);
            return (
              <View key={r.id}>
                {i > 0 && <Divider />}
                <ListRow
                  icon={categoryIcon(c?.icon)}
                  iconColor={c?.color ?? undefined}
                  title={`"${r.pattern}"`}
                  subtitle={`→ ${c?.name ?? 'Category'}${r.normalizedName ? ` · as ${r.normalizedName}` : ''}`}
                  onPress={() => setEditing({ rule: r })}
                  right={
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      {r.priority !== 0 && <Badge label={`P${r.priority}`} tone="primary" />}
                      <Button title="Apply" size="md" variant="secondary" onPress={() => runRule(r)} loading={apply.isPending && apply.variables === r.id} style={{ height: 32, paddingHorizontal: 12 }} />
                    </View>
                  }
                />
              </View>
            );
          })}
        </Card>
      )}

      <Sheet
        visible={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.rule ? 'Edit rule' : 'New rule'}
        footer={
          <View style={{ gap: 10 }}>
            <Button title={editing?.rule ? 'Save changes' : 'Create rule'} onPress={submit} loading={save.isPending} disabled={!valid} />
            {editing?.rule && <Button title="Delete rule" variant="danger" onPress={() => confirmDelete(editing.rule!)} />}
          </View>
        }
      >
        <Input label="Description contains" value={pattern} onChangeText={setPattern} placeholder="SWIGGY" autoCapitalize="none" maxLength={100} hint="Case-insensitive, at least 2 characters." />
        <CategoryField value={categoryId} onChange={setCategoryId} label="Assign category" clearLabel="Choose…" />
        <Input label="Clean merchant name (optional)" value={normalized} onChangeText={setNormalized} placeholder="Swiggy" maxLength={200} />
        <Input label="Priority" value={priority} onChangeText={setPriority} keyboardType="numbers-and-punctuation" hint="Higher runs first (−1000 to 1000)." error={prioOk ? null : 'Enter a whole number between −1000 and 1000'} />
        <FormError error={save.error} />
      </Sheet>
    </Screen>
  );
}
