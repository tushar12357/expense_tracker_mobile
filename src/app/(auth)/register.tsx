import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AuthShell } from '@/components/auth-shell';
import { ServerSheet } from '@/components/server-sheet';
import { Button, FormError, Input, SelectField, Text } from '@/components/ui';
import { COMMON_TIMEZONES } from '@/lib/format';
import { useAuth } from '@/providers/auth';

function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
}

export default function Register() {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timezone, setTimezone] = useState(deviceTimezone());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [serverOpen, setServerOpen] = useState(false);

  const tzOptions = useMemo(() => {
    const all = Array.from(new Set([timezone, ...COMMON_TIMEZONES]));
    return all.map((z) => ({ value: z, label: z }));
  }, [timezone]);

  const passwordError =
    password.length > 0 && (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
      ? 'At least 10 characters, with letters and digits'
      : null;
  const valid = displayName.trim() && /\S+@\S+\.\S+/.test(email) && password.length >= 10 && !passwordError;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await signUp({ email: email.trim(), password, displayName: displayName.trim(), timezone });
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Create account" subtitle="Import statements, set budgets, and know what's safe to spend.">
      <FormError error={error} />
      <Input label="Your name" value={displayName} onChangeText={setDisplayName} placeholder="Asha Verma" textContentType="name" />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="you@example.com"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secure
        textContentType="newPassword"
        placeholder="10+ characters"
        error={passwordError}
        hint="Use letters and digits."
      />
      <SelectField label="Time zone" value={timezone} options={tzOptions} onChange={(v) => v && setTimezone(v)} />
      <Button title="Create account" onPress={submit} loading={busy} disabled={!valid} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        <Text tone="muted">Already have an account?</Text>
        <Link href="/login">
          <Text tone="primary" style={{ fontWeight: '600' }}>
            Sign in
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
