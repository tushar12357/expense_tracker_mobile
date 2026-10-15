import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Badge, Button, Card, Divider, EmptyState, ErrorState, FormError, Header, IconBadge, Input, Screen, SelectField, Sheet, SkeletonCard, Text } from '@/components/ui';
import { radius, space, useTheme } from '@/constants/theme';
import { useCategories, useDeleteCategory, useSaveCategory } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { CATEGORY_COLORS, CATEGORY_ICONS, PICKABLE_ICONS, categoryIcon } from '@/lib/icons';
import type { Category } from '@/lib/types';
import { useToast } from '@/providers/toast';

export default function Categories() {
  const t = useTheme();
  const toast = useToast();
  const query = useCategories();
  const save = useSaveCategory();
  const del = useDeleteCategory();

  const [editing, setEditing] = useState<{ category?: Category } | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('circle');
  const [color, setColor] = useState(CATEGORY_COLORS[0]!);
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    const c = editing.category;
    setName(c?.name ?? '');
    setIcon(c?.icon ?? 'circle');
    setColor(c?.color ?? CATEGORY_COLORS[0]!);
    setParentId(c?.parentId ?? null);
    save.reset();
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const all = useMemo(() => query.data ?? [], [query.data]);
  const system = all.filter((c) => c.isSystem);
  const mine = all.filter((c) => !c.isSystem);
  // Parents must be top-level; a category that has children cannot itself become a child.
  const hasChildren = editing?.category ? all.some((c) => c.parentId === editing.category!.id) : false;
  const parentOptions = useMemo(
    () => all.filter((c) => !c.parentId && c.id !== editing?.category?.id).map((c) => ({ value: c.id, label: c.name })),
    [all, editing?.category?.id],
  );

  function submit() {
    save.mutate(
      { id: editing?.category?.id, name: name.trim(), icon, color, parentId: hasChildren ? undefined : parentId },
      {
        onSuccess: () => {
          toast.show(editing?.category ? 'Category updated' : 'Category created');
          setEditing(null);
        },
      },
    );
  }

  function confirmDelete(c: Category) {
    Alert.alert('Delete category?', 'Its transactions become uncategorized, and any rules or budgets using it are removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          del.mutate(c.id, {
            onSuccess: () => {
              setEditing(null);
              toast.show('Category deleted');
            },
            onError: (e) => toast.show(errorMessage(e), 'error'),
          }),
      },
    ]);
  }

  return (
    <Screen edges={['top', 'bottom']} onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <Header title="Categories" back right={<Button title="New" icon="plus" size="md" onPress={() => setEditing({})} />} />
      {query.isLoading ? (
        <SkeletonCard lines={4} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <>
          <Text variant="label" tone="muted">
            YOUR CATEGORIES
          </Text>
          {mine.length === 0 ? (
            <Card>
              <EmptyState icon="shape-plus-outline" title="No custom categories" message="Built-in categories cover most needs. Add your own for anything else." action="Create category" onAction={() => setEditing({})} />
            </Card>
          ) : (
            <Card padded={false}>
              {mine.map((c, i) => (
                <View key={c.id}>
                  {i > 0 && <Divider />}
                  <CategoryRow c={c} parent={all.find((p) => p.id === c.parentId)?.name} onPress={() => setEditing({ category: c })} />
                </View>
              ))}
            </Card>
          )}
          <Text variant="label" tone="muted">
            BUILT-IN
          </Text>
          <Card padded={false}>
            {system.map((c, i) => (
              <View key={c.id}>
                {i > 0 && <Divider />}
                <CategoryRow c={c} />
              </View>
            ))}
          </Card>
        </>
      )}

      <Sheet
        visible={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.category ? 'Edit category' : 'New category'}
        footer={
          <View style={{ gap: 10 }}>
            <Button title={editing?.category ? 'Save changes' : 'Create category'} onPress={submit} loading={save.isPending} disabled={!name.trim()} />
            {editing?.category && <Button title="Delete category" variant="danger" onPress={() => confirmDelete(editing.category!)} />}
          </View>
        }
      >
        <View style={{ alignItems: 'center' }}>
          <IconBadge icon={categoryIcon(icon)} color={color} size={64} />
        </View>
        <Input label="Name" value={name} onChangeText={setName} placeholder="Pets" maxLength={100} />
        <View style={{ gap: 8 }}>
          <Text variant="label" tone="muted">
            Color
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {CATEGORY_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, alignItems: 'center', justifyContent: 'center', borderWidth: color === c ? 3 : 0, borderColor: t.text }}
              >
                {color === c && <MaterialCommunityIcons name="check" size={18} color="#fff" />}
              </Pressable>
            ))}
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Text variant="label" tone="muted">
            Icon
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {PICKABLE_ICONS.map((k) => (
              <Pressable
                key={k}
                onPress={() => setIcon(k)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: icon === k ? color + '26' : t.surface,
                  borderWidth: 1.5,
                  borderColor: icon === k ? color : t.border,
                }}
              >
                <MaterialCommunityIcons name={CATEGORY_ICONS[k]!} size={22} color={icon === k ? color : t.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>
        {!hasChildren && (
          <SelectField label="Parent (optional)" value={parentId} options={parentOptions} onChange={setParentId} clearLabel="Top level" placeholder="Top level" />
        )}
        <FormError error={save.error} />
      </Sheet>
    </Screen>
  );
}

function CategoryRow({ c, parent, onPress }: { c: Category; parent?: string; onPress?: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, paddingHorizontal: space.lg, opacity: pressed ? 0.6 : 1 })}
    >
      <IconBadge icon={categoryIcon(c.icon)} color={c.color ?? undefined} size={38} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '500' }}>{c.name}</Text>
        {parent ? (
          <Text variant="caption" tone="muted">
            in {parent}
          </Text>
        ) : null}
      </View>
      {c.isSystem ? <Badge label="BUILT-IN" /> : <MaterialCommunityIcons name="chevron-right" size={22} color={t.textFaint} />}
    </Pressable>
  );
}
