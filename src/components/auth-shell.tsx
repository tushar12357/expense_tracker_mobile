import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, space, useTheme } from '@/constants/theme';
import { Text } from './ui';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#4338CA', '#6D5DF6', '#8B7CFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingBottom: 56, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}
          >
            <SafeAreaView edges={['top']}>
              <View style={{ paddingHorizontal: space.xl, paddingTop: space.xl, gap: space.lg }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="wallet-outline" size={28} color="#fff" />
                </View>
                <View style={{ gap: 6 }}>
                  <Text variant="display" tone="onPrimary">
                    {title}
                  </Text>
                  <Text tone="onPrimary" style={{ opacity: 0.85 }}>
                    {subtitle}
                  </Text>
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>
          <View
            style={{
              marginTop: -32,
              marginHorizontal: space.lg,
              backgroundColor: t.surface,
              borderRadius: radius.xl,
              padding: space.xl,
              gap: space.lg,
              borderWidth: 1,
              borderColor: t.border,
              shadowColor: t.shadow,
              shadowOpacity: t.isDark ? 0 : 0.1,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 8 },
              elevation: 3,
            }}
          >
            {children}
          </View>
          <SafeAreaView edges={['bottom']} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
