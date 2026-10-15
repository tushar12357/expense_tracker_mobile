import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AccountField, CategoryField } from '@/components/domain';
import { DateField } from '@/components/date-field';
import { Button, FormError, Header, Input, Screen, Segmented, Text } from '@/components/ui';
import { space, useTheme } from '@/constants/theme';
import { useAccounts, useCreateTransaction } from '@/hooks/queries';
import { isValidAmount, sanitizeAmountInput } from '@/lib/format';
import type { TransactionType } from '@/lib/types';
import { useToast } from '@/providers/toast';

const TYPES: Array<{ value: TransactionType; label: string }> = [
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'INCOME', label: 'Income' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'TRANSFER', label: 'Transfer' },
];

export default function NewTransaction() {
  const t = useTheme();
  const toast = useToast();
  const accounts = useAccounts();
  const create = useCreateTransaction();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!accountId && accounts.data) setAccountId(accounts.data.find((a) => a.isActive)?.id);
  }, [accounts.data, accountId]);

  const amountOk = isValidAmount(amount);
  const canSave = amountOk && !!accountId && description.trim().length > 0;
  const tone = type === 'INCOME' || type === 'REFUND' ? t.success : type === 'EXPENSE' ? t.danger : t.textMuted;

  function submit() {
    // Keep "now" for today's entries; for other days use the picked date at the current time of day.
    const now = new Date();
    const when = new Date(date);
    if (when.toDateString() === now.toDateString()) when.setTime(now.getTime());
    else when.setHours(now.getHours(), now.getMinutes(), 0, 0);

    create.mutate(
      {
        accountId: accountId!,
        type,
        amount,
        description: description.trim(),
        occurredAt: when.toISOString(),
        ...(categoryId && { categoryId }),
        ...(merchant.trim() && { merchantName: merchant.trim() }),
        ...(notes.trim() && { notes: notes.trim() }),
      },
      {
        onSuccess: () => {
          toast.show('Transaction added');
          router.back();
        },
      },
    );
  }

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <View style={{ padding: space.lg }}>
          <Button title="Save transaction" onPress={submit} disabled={!canSave} loading={create.isPending} />
        </View>
      }
    >
      <Header title="New transaction" back />
      <Segmented options={TYPES} value={type} onChange={setType} />

      <View style={{ alignItems: 'center', paddingVertical: space.lg, gap: 4 }}>
        <Text variant="label" tone="muted">
          Amount
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="display" style={{ color: tone }}>
            ₹
          </Text>
          <Input
            value={amount}
            onChangeText={(v) => setAmount(sanitizeAmountInput(v))}
            placeholder="0"
            keyboardType="decimal-pad"
            autoFocus
            style={{ fontSize: 40, fontWeight: '700', textAlign: 'center', minWidth: 120, color: tone }}
          />
        </View>
        {amount.length > 0 && !amountOk && (
          <Text variant="caption" tone="danger">
            Enter an amount above 0 with up to 2 decimals
          </Text>
        )}
      </View>

      <AccountField value={accountId} onChange={setAccountId} />
      {type !== 'TRANSFER' && <CategoryField value={categoryId} onChange={setCategoryId} clearLabel="Leave uncategorized" />}
      <DateField label="Date" value={date} onChange={(d) => d && setDate(d)} maximumDate={new Date()} />
      <Input label="Description" value={description} onChangeText={setDescription} placeholder="e.g. Dinner at Truffles" maxLength={500} />
      <Input label="Merchant (optional)" value={merchant} onChangeText={setMerchant} placeholder="e.g. Truffles" maxLength={200} />
      <Input label="Notes (optional)" value={notes} onChangeText={setNotes} multiline maxLength={1000} placeholder="Anything to remember" />
      <FormError error={create.error} />
    </Screen>
  );
}
