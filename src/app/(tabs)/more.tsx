import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { ServerSheet } from '@/components/server-sheet';
import { Card, Group, Header, ListRow, Screen, Text } from '@/components/ui';
import { space, useTheme } from '@/constants/theme';
import { getBaseUrl } from '@/lib/api';
import { useAuth } from '@/providers/auth';

export default function More() {
  const t = useTheme();
  const { user, signOut } = useAuth();
  const [serverOpen, setServerOpen] = useState(false);
  const initials = (user?.displayName ?? '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  function confirmSignOut() {
    Alert.alert('Sign out?', 'You will need to sign in again to see your data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <Screen>
      <Header title="More" large />
      <Card onPress={() => router.push('/profile')} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="heading" tone="onPrimary">
            {initials}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="heading" numberOfLines={1}>
            {user?.displayName}
          </Text>
          <Text tone="muted" numberOfLines={1}>
            {user?.email}
          </Text>
          <Text variant="caption" tone="faint">
            {user?.timezone}
          </Text>
        </View>
      </Card>

      <Text variant="label" tone="muted">
        MONEY
      </Text>
      <Group>
        <ListRow icon="bank-outline" title="Accounts" subtitle="Balances and opening balances" chevron onPress={() => router.push('/accounts')} />
        <ListRow icon="file-upload-outline" title="Import statements" subtitle="HDFC and generic CSV" chevron onPress={() => router.push('/imports')} />
        <ListRow icon="shape-outline" title="Categories" subtitle="Organize your spending" chevron onPress={() => router.push('/categories')} />
        <ListRow icon="auto-fix" title="Merchant rules" subtitle="Auto-categorize by description" chevron onPress={() => router.push('/rules')} />
      </Group>

      <Text variant="label" tone="muted">
        ACCOUNT
      </Text>
      <Group>
        <ListRow icon="account-outline" title="Profile & time zone" chevron onPress={() => router.push('/profile')} />
        <ListRow icon="shield-lock-outline" title="Security & data" subtitle="Password, export, delete account" chevron onPress={() => router.push('/security')} />
        <ListRow icon="server-network" title="Server" subtitle={getBaseUrl()} chevron onPress={() => setServerOpen(true)} />
      </Group>

      <Group>
        <ListRow icon="logout" title="Sign out" destructive onPress={confirmSignOut} />
      </Group>
      <Text variant="caption" tone="faint" style={{ textAlign: 'center' }}>
        SpendSense · amounts in INR
      </Text>
      <ServerSheet visible={serverOpen} onClose={() => setServerOpen(false)} />
    </Screen>
  );
}
