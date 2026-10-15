import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { CategoryField, amountTone, signedAmount } from '@/components/domain';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  FormError,
  Header,
  IconBadge,
  Input,
  Loading,
  Screen,
  Segmented,
  Sheet,
  Text,
} from '@/components/ui';
import { space, useTheme } from '@/constants/theme';
import { useDeleteTransaction, useSaveRule, useTransaction, useUpdateTransaction } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/format';
import { categoryIcon } from '@/lib/icons';
import type { TransactionType } from '@/lib/types';
import { useToast } from '@/providers/toast';

const TYPES: Array<{ value: TransactionType; label: string }> = [
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'INCOME', label: 'Income' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'TRANSFER', label: 'Transfer' },
];

export default function TransactionDetail() {
  const t = useTheme();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useTransaction(id);
  const update = useUpdateTransaction(id);
  const remove = useDeleteTransaction();
  const saveRule = useSaveRule();
  const tx = query.data;

  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [ruleOpen, setRuleOpen] = useState(false);
  const [pattern, setPattern] = useState('');

  useEffect(() => {
    if (tx) {
      setMerchant(tx.merchantName ?? '');
      setNotes(tx.notes ?? '');
    }
  }, [tx?.id, tx?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (query.isLoading) return <Loading />;
  if (query.isError || !tx) {
    return (
      <Screen>
        <Header title="Transaction" back />
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </Screen>
    );
  }

  const dirty = merchant.trim() !== (tx.merchantName ?? '') || notes.trim() !== (tx.notes ?? '');
  const patch = (body: Parameters<typeof update.mutate>[0], msg = 'Saved') =>
    update.mutate(body, { onSuccess: () => toast.show(msg), onError: (e) => toast.show(errorMessage(e), 'error') });

  function confirmDelete() {
    Alert.alert('Delete transaction?', 'This removes it from your ledger and balances. Import history is kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove.mutate(id, {
            onSuccess: () => {
              toast.show('Transaction deleted');
              router.back();
            },
            onError: (e) => toast.show(errorMessage(e), 'error'),
          }),
      },
    ]);
  }

  function openRule() {
    // Merchant name is the cleanest pattern; otherwise the first few words of the description.
    setPattern((tx!.merchantName || tx!.description).trim().split(/\s+/).slice(0, 3).join(' ').slice(0, 100));
    setRuleOpen(true);
  }

  function createRule() {
    if (!tx?.category) return;
    saveRule.mutate(
      { pattern: pattern.trim(), categoryId: tx.category.id, normalizedName: tx.merchantName ?? null },
      {
        onSuccess: () => {
          setRuleOpen(false);
          toast.show('Rule created — apply it from Merchant rules');
        },
      },
    );
  }

  const isTransfer = tx.type === 'TRANSFER';

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Transaction" back />

      <Card style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xl }}>
        <IconBadge
          icon={isTransfer ? 'swap-horizontal' : categoryIcon(tx.category?.icon)}
          color={isTransfer ? t.textMuted : (tx.category?.color ?? t.textFaint)}
          size={56}
        />
        <Text variant="display" tone={amountTone(tx.type)}>
          {signedAmount(tx)}
        </Text>
        <Text variant="heading" style={{ textAlign: 'center' }}>
          {tx.merchantName || tx.description}
        </Text>
        <Text tone="muted">
          {formatDate(tx.occurredAt)} · {formatTime(tx.occurredAt)}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
          <Badge label={tx.account.name} />
          {tx.isReviewed ? <Badge label="Reviewed" tone="success" /> : <Badge label="Unreviewed" tone="warning" />}
          {tx.importRowId ? <Badge label="Imported" tone="primary" /> : null}
        </View>
      </Card>

      <View style={{ gap: 6 }}>
        <Text variant="label" tone="muted">
          Type
        </Text>
        <Segmented options={TYPES} value={tx.type} onChange={(v) => v !== tx.type && patch({ type: v }, 'Type updated')} />
      </View>

      {!isTransfer && (
        <CategoryField
          value={tx.category?.id}
          onChange={(cid) => patch({ categoryId: cid }, cid ? 'Category updated' : 'Category cleared')}
          clearLabel="Uncategorized"
        />
      )}
      {tx.category && !isTransfer && (
        <Button title="Always categorize this merchant like this" variant="secondary" size="md" icon="auto-fix" onPress={openRule} />
      )}

      <Input label="Merchant" value={merchant} onChangeText={setMerchant} placeholder="Clean merchant name" maxLength={200} />
      <Input label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Add a note" maxLength={1000} />
      {dirty && (
        <Button
          title="Save changes"
          loading={update.isPending}
          onPress={() => patch({ merchantName: merchant.trim() || null, notes: notes.trim() || null })}
        />
      )}

      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: space.md }}>
            <Text style={{ fontWeight: '600' }}>Mark as reviewed</Text>
            <Text variant="caption" tone="muted">
              Reviewed transactions are never changed by merchant rules.
            </Text>
          </View>
          <Switch
            value={tx.isReviewed}
            onValueChange={(v) => patch({ isReviewed: v }, v ? 'Marked reviewed' : 'Marked unreviewed')}
            trackColor={{ true: t.primary }}
          />
        </View>
      </Card>

      <Card style={{ gap: 8 }}>
        <Text variant="label" tone="muted">
          Original description
        </Text>
        <Text>{tx.description}</Text>
      </Card>

      <FormError error={update.error} />
      <Button title="Delete transaction" variant="danger" icon="trash-can-outline" onPress={confirmDelete} loading={remove.isPending} />

      <Sheet
        visible={ruleOpen}
        onClose={() => setRuleOpen(false)}
        title="New merchant rule"
        footer={<Button title="Create rule" onPress={createRule} loading={saveRule.isPending} disabled={pattern.trim().length < 2} />}
      >
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <MaterialCommunityIcons name="information-outline" size={18} color={t.textMuted} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            Future imports whose description contains this text will be filed under {tx.category?.name}.
          </Text>
        </View>
        <Input label="Description contains" value={pattern} onChangeText={setPattern} autoCapitalize="none" maxLength={100} />
        <FormError error={saveRule.error} />
      </Sheet>
    </Screen>
  );
}
