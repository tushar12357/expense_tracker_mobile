import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/constants/theme';
import type { IconName } from '@/lib/icons';

const tab = (name: IconName, focused: IconName) => ({
  tabBarIcon: ({ color, focused: f, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <MaterialCommunityIcons name={f ? focused : name} size={size + 1} color={color} />
  ),
});

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textFaint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.border,
          height: 56 + Math.max(insets.bottom, Platform.OS === 'ios' ? 0 : 6),
          paddingTop: 6,
        },
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', ...tab('home-variant-outline', 'home-variant') }} />
      <Tabs.Screen name="transactions" options={{ title: 'Activity', ...tab('format-list-bulleted', 'format-list-bulleted') }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', ...tab('chart-donut', 'chart-donut-variant') }} />
      <Tabs.Screen name="plan" options={{ title: 'Plan', ...tab('target', 'bullseye-arrow') }} />
      <Tabs.Screen name="more" options={{ title: 'More', ...tab('account-circle-outline', 'account-circle') }} />
    </Tabs>
  );
}
