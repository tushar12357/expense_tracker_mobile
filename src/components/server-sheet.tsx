import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { getBaseUrl, normalizeServerUrl, setServerUrl } from '@/lib/api';
import { useToast } from '@/providers/toast';
import { Button, Input, Sheet, Text } from './ui';

/** Lets the user point the app at their API (needed on a physical device, where localhost is the phone). */
export function ServerSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const [url, setUrl] = useState(getBaseUrl());
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (visible) setUrl(getBaseUrl());
  }, [visible]);

  async function test() {
    setTesting(true);
    try {
      const res = await fetch(`${normalizeServerUrl(url)}/health`);
      if (res.ok) toast.show('Server reachable');
      else toast.show(`Server answered ${res.status}`, 'error');
    } catch {
      toast.show("Can't reach that address", 'error');
    } finally {
      setTesting(false);
    }
  }

  async function save() {
    await setServerUrl(url.trim() ? url : null);
    toast.show('Server address saved');
    onClose();
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Server address"
      footer={
        <View style={{ gap: 10 }}>
          <Button title="Save" onPress={save} />
          <Button title="Test connection" variant="secondary" onPress={test} loading={testing} />
        </View>
      }
    >
      <Text tone="muted">
        The address of your SpendSense API. On a physical phone use your computer's LAN IP, e.g. http://192.168.1.10:5000.
        Leave empty to use the automatic default.
      </Text>
      <Input
        label="API base URL"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="http://192.168.1.10:5000"
      />
    </Sheet>
  );
}
