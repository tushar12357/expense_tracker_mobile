import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AuthShell } from '@/components/auth-shell';
import { ServerSheet } from '@/components/server-sheet';
import { Button, FormError, Input, Text } from '@/components/ui';
import { useAuth } from '@/providers/auth';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [serverOpen, setServerOpen] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see where your money goes.">
      <FormError error={error} />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="username"
        autoComplete="email"
        placeholder="you@example.com"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secure
        textContentType="password"
        autoComplete="current-password"
        placeholder="Your password"
        onSubmitEditing={submit}
      />
      <Button title="Sign in" onPress={submit} loading={busy} disabled={!email.trim() || !password} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        <Text tone="muted">New to SpendSense?</Text>
        <Link href="/register">
          <Text tone="primary" style={{ fontWeight: '600' }}>
            Create account
          </Text>
        </Link>
      </View>
      <Pressable onPress={() => setServerOpen(true)} hitSlop={10} style={{ alignItems: 'center' }}>
        <Text variant="caption" tone="faint">
          Server settings
        </Text>
      </Pressable>
      <ServerSheet visible={serverOpen} onClose={() => setServerOpen(false)} />
    </AuthShell>
  );
}
