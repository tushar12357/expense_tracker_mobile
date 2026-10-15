import { useMemo, useState } from 'react';
import { Button, FormError, Header, Input, Screen, SelectField, Text } from '@/components/ui';
import { useUpdateProfile } from '@/hooks/queries';
import { COMMON_TIMEZONES } from '@/lib/format';
import { useAuth } from '@/providers/auth';
import { useToast } from '@/providers/toast';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const update = useUpdateProfile();
  const [name, setName] = useState(user?.displayName ?? '');
  const [tz, setTz] = useState(user?.timezone ?? 'Asia/Kolkata');

  const options = useMemo(() => Array.from(new Set([user?.timezone ?? tz, ...COMMON_TIMEZONES])).map((z) => ({ value: z, label: z })), [user?.timezone, tz]);
  const dirty = name.trim() !== user?.displayName || tz !== user?.timezone;

  function save() {
    update.mutate(
      { displayName: name.trim(), timezone: tz },
      {
        onSuccess: (u) => {
          setUser(u);
          toast.show('Profile updated');
        },
      },
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Profile" back />
      <Input label="Display name" value={name} onChangeText={setName} maxLength={100} />
      <Input label="Email" value={user?.email ?? ''} editable={false} hint="Email can't be changed." style={{ opacity: 0.6 }} />
      <SelectField label="Time zone" value={tz} options={options} onChange={(v) => v && setTz(v)} />
      <Text variant="caption" tone="faint">
        Your time zone decides where one month ends and the next begins in reports and budgets.
      </Text>
      <FormError error={update.error} />
      <Button title="Save changes" onPress={save} loading={update.isPending} disabled={!dirty || !name.trim()} />
    </Screen>
  );
}
