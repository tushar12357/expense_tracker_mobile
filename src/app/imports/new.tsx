import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AccountField } from '@/components/domain';
import { Button, Card, Chip, FormError, Header, Screen, Text } from '@/components/ui';
import { radius, space, useTheme } from '@/constants/theme';
import { useAccounts, useImportAdapters, useUploadImport } from '@/hooks/queries';
import { ApiError } from '@/lib/api';
import { useToast } from '@/providers/toast';

interface Picked {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
}

export default function NewImport() {
  const t = useTheme();
  const toast = useToast();
  const accounts = useAccounts();
  const adapters = useImportAdapters();
  const upload = useUploadImport();

  const [accountId, setAccountId] = useState<string | undefined>();
  const [adapterKey, setAdapterKey] = useState<string | undefined>();
  const [file, setFile] = useState<Picked | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId && accounts.data) setAccountId(accounts.data.find((a) => a.isActive)?.id);
  }, [accounts.data, accountId]);

  async function pick() {
    setPickError(null);
    const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
    if (res.canceled) return;
    const a = res.assets[0]!;
    if (!a.name.toLowerCase().endsWith('.csv')) {
      setFile(null);
      setPickError('Only .csv files are supported.');
      return;
    }
    setFile({ uri: a.uri, name: a.name, mimeType: 'text/csv', size: a.size });
  }

  function submit() {
    if (!file || !accountId) return;
    upload.mutate(
      { accountId, adapterKey, file },
      {
        onSuccess: (res) => {
          toast.show(res.status === 'COMPLETED' ? 'Import complete' : 'Import started');
          router.replace({ pathname: '/imports/[id]', params: { id: res.batchId } });
        },
      },
    );
  }

  // 409 DUPLICATE_IMPORT carries the existing batch id in its details.
  const err = upload.error;
  const existingId = err instanceof ApiError && err.code === 'DUPLICATE_IMPORT' ? err.details[0]?.message.match(/[0-9a-f-]{36}/i)?.[0] : undefined;

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <View style={{ padding: space.lg }}>
          <Button title="Import statement" onPress={submit} loading={upload.isPending} disabled={!file || !accountId} icon="upload" />
        </View>
      }
    >
      <Header title="Upload statement" back />
      <AccountField label="Import into account" value={accountId} onChange={setAccountId} />

      <View style={{ gap: 8 }}>
        <Text variant="label" tone="muted">
          Bank format
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label="Auto-detect" active={!adapterKey} onPress={() => setAdapterKey(undefined)} icon="auto-fix" />
          {adapters.data?.map((a) => (
            <Chip key={a.key} label={a.displayName} active={adapterKey === a.key} onPress={() => setAdapterKey(a.key)} />
          ))}
        </View>
      </View>

      <Pressable
        onPress={pick}
        style={{
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: file ? t.primary : t.border,
          borderRadius: radius.lg,
          backgroundColor: file ? t.primarySoft : t.surface,
          padding: space.xl,
          alignItems: 'center',
          gap: space.sm,
        }}
      >
        <MaterialCommunityIcons name={file ? 'file-check-outline' : 'file-upload-outline'} size={40} color={t.primary} />
        <Text variant="heading" style={{ textAlign: 'center' }} numberOfLines={2}>
          {file ? file.name : 'Choose a CSV file'}
        </Text>
        <Text variant="caption" tone="muted">
          {file ? `${file.size ? `${(file.size / 1024).toFixed(1)} KB · ` : ''}Tap to change` : 'Max 10 MB · up to 50,000 rows'}
        </Text>
      </Pressable>
      {pickError && (
        <Text variant="caption" tone="danger">
          {pickError}
        </Text>
      )}

      <Card style={{ gap: 6 }}>
        <Text variant="label">How it works</Text>
        <Text variant="caption" tone="muted">
          • Rows already in your ledger are marked duplicate, never double-counted.
        </Text>
        <Text variant="caption" tone="muted">
          • The import is all-or-nothing. If it fails, nothing is saved — just upload again.
        </Text>
        <Text variant="caption" tone="muted">
          • Merchant rules categorize rows automatically.
        </Text>
      </Card>

      <FormError error={err} />
      {existingId && (
        <Button title="View existing import" variant="secondary" onPress={() => router.replace({ pathname: '/imports/[id]', params: { id: existingId } })} />
      )}
    </Screen>
  );
}
