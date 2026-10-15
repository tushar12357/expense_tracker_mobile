import { useEffect, useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, FormError, Header, IconBadge, Input, Screen, Sheet, SkeletonCard, Text } from '@/components/ui';
import { space, useTheme } from '@/constants/theme';
import { useAccounts, useDeleteAccount, useSaveAccount } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { formatMoney, num, sanitizeAmountInput } from '@/lib/format';
import { ACCOUNT_TYPES, accountMeta } from '@/lib/icons';
import type { Account, AccountType } from '@/lib/types';
import { useToast } from '@/providers/toast';

export default function Accounts() {
  const t = useTheme();
  const toast = useToast();
  const query = useAccounts();
  const save = useSaveAccount();
  const del = useDeleteAccount();

  const [editing, setEditing] = useState<{ account?: Account } | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('SAVINGS');
  const [opening, setOpening] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!editing) return;
    const a = editing.account;
    setName(a?.name ?? '');
    setType(a?.type ?? 'SAVINGS');
    setOpening(a ? a.openingBalance : '');
    setActive(a?.isActive ?? true);
    save.reset();
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const valid = name.trim().length > 0 && (opening === '' || /^\d{1,12}(\.\d{1,2})?$/.test(opening));

  function submit() {
    save.mutate(
      {
        id: editing?.account?.id,
        name: name.trim(),
        type,
        openingBalance: opening === '' ? '0' : opening,
        ...(editing?.account && { isActive: active }),
      },
      {
        onSuccess: () => {
          toast.show(editing?.account ? 'Account updated' : 'Account created');
          setEditing(null);
        },
      },
    );
  }

  function confirmDelete(a: Account) {
    Alert.alert('Delete account?', `"${a.name}" will be removed. Accounts with history can only be deactivated.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          del.mutate(a.id, {
            onSuccess: () => {
              setEditing(null);
              toast.show('Account deleted');
            },
            onError: (e) => toast.show(errorMessage(e), 'error'),
          }),
      },
    ]);
  }

  const accounts = query.data ?? [];

  return (
    <Screen edges={['top', 'bottom']} onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <Header title="Accounts" back />
      {query.isLoading ? (
        <SkeletonCard />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : accounts.length === 0 ? (
        <Card>
          <EmptyState
            icon="bank-plus"
            title="No accounts yet"
            message="Add the accounts you want to track. Balances are computed from the opening balance plus your transactions."
            action="Add account"
            onAction={() => setEditing({})}
          />
        </Card>
      ) : (
        <>
          {accounts.map((a) => (
            <Card key={a.id} onPress={() => setEditing({ account: a })} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, opacity: a.isActive ? 1 : 0.6 }}>
              <IconBadge icon={accountMeta(a.type).icon} size={44} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="heading" numberOfLines={1}>
                  {a.name}
                </Text>
                <Text variant="caption" tone="muted">
                  {accountMeta(a.type).label}
                  {a.balanceIsEstimate ? ' · estimate (transfers excluded)' : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text variant="heading" tone={num(a.currentBalance) < 0 ? 'danger' : 'default'}>
                  {formatMoney(a.currentBalance)}
                </Text>
                {!a.isActive && <Badge label="INACTIVE" />}
              </View>
            </Card>
          ))}
          <Button title="Add account" icon="plus" variant="secondary" onPress={() => setEditing({})} />
        </>
      )}

      <Sheet
        visible={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.account ? 'Edit account' : 'New account'}
        footer={
          <View style={{ gap: 10 }}>
            <Button title={editing?.account ? 'Save changes' : 'Create account'} onPress={submit} loading={save.isPending} disabled={!valid} />
            {editing?.account && <Button title="Delete account" variant="danger" onPress={() => confirmDelete(editing.account!)} />}
          </View>
        }
      >
        <Input label="Account name" value={name} onChangeText={setName} placeholder="HDFC Savings" maxLength={100} />
        <View style={{ gap: 6 }}>
          <Text variant="label" tone="muted">
            Type
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ACCOUNT_TYPES.map((a) => (
              <Chip key={a.value} label={a.label} icon={a.icon} active={type === a.value} onPress={() => setType(a.value)} />
            ))}
          </View>
        </View>
        <Input
          label="Opening balance"
          prefix="₹"
          value={opening}
          onChangeText={(v) => setOpening(sanitizeAmountInput(v))}
          keyboardType="decimal-pad"
          placeholder="0"
          hint="The balance before your first recorded transaction."
        />
        {editing?.account && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }}>Active</Text>
              <Text variant="caption" tone="muted">
                Inactive accounts can't receive new entries.
              </Text>
            </View>
            <Switch value={active} onValueChange={setActive} trackColor={{ true: t.primary }} />
          </View>
        )}
        <FormError error={save.error} />
      </Sheet>
    </Screen>
  );
}
