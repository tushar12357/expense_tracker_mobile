import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, Card, FormError, Header, Input, Screen, Sheet, Text } from '@/components/ui';
import { space } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/providers/auth';
import { useToast } from '@/providers/toast';
import { useMutation } from '@tanstack/react-query';

export default function Security() {
  const { signOut } = useAuth();
  const toast = useToast();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const change = useMutation({
    mutationFn: () => api.post('/auth/change-password', { currentPassword: current, newPassword: next }, { noAuthRedirect: true }),
    onSuccess: () => {
      setCurrent('');
      setNext('');
      toast.show('Password changed');
    },
  });
  const nextError =
    next.length > 0 && (next.length < 10 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) ? 'At least 10 characters, with letters and digits' : null;

  const [exporting, setExporting] = useState(false);
  async function exportData() {
    setExporting(true);
    try {
      const data = await api.get<unknown>('/users/me/export');
      const stamp = new Date().toISOString().slice(0, 10);
      const file = new File(Paths.cache, `spendsense-export-${stamp}.json`);
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify(data, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export SpendSense data', UTI: 'public.json' });
      } else {
        toast.show(`Saved to ${file.uri}`, 'info');
      }
    } catch (e) {
      toast.show(errorMessage(e), 'error');
    } finally {
      setExporting(false);
    }
  }

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pw, setPw] = useState('');
  const del = useMutation({
    mutationFn: () => api.delete('/users/me', undefined, { password: pw }),
    onSuccess: () => signOut(),
  });

  function askDelete() {
    Alert.alert('Delete account?', 'This permanently deletes your account and every transaction, budget and goal. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        style: 'destructive',
        onPress: () => {
          setPw('');
          del.reset();
          setDeleteOpen(true);
        },
      },
    ]);
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Security & data" back />

      <Card style={{ gap: space.md }}>
        <Text variant="heading">Change password</Text>
        <Input label="Current password" value={current} onChangeText={setCurrent} secure />
        <Input label="New password" value={next} onChangeText={setNext} secure error={nextError} hint="10+ characters with letters and digits" />
        <FormError error={change.error} />
        <Button title="Update password" onPress={() => change.mutate()} loading={change.isPending} disabled={!current || !next || !!nextError} />
      </Card>

      <Card style={{ gap: space.md }}>
        <Text variant="heading">Export your data</Text>
        <Text tone="muted">Download everything you own — accounts, transactions, imports, budgets and goals — as a JSON file.</Text>
        <Button title="Export data" icon="export-variant" variant="secondary" onPress={exportData} loading={exporting} />
      </Card>

      <Card style={{ gap: space.md }}>
        <Text variant="heading" tone="danger">
          Danger zone
        </Text>
        <Text tone="muted">Permanently delete your account and all associated data.</Text>
        <Button title="Delete account" variant="danger" icon="trash-can-outline" onPress={askDelete} />
      </Card>

      <Sheet
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Confirm deletion"
        footer={<Button title="Delete everything" variant="danger" onPress={() => del.mutate()} loading={del.isPending} disabled={!pw} />}
      >
        <View style={{ gap: space.md }}>
          <Text tone="muted">Enter your password to permanently delete your account.</Text>
          <Input label="Password" value={pw} onChangeText={setPw} secure autoFocus />
          <FormError error={del.error} />
        </View>
      </Sheet>
    </Screen>
  );
}
