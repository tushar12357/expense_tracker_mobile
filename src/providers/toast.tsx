import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, useTheme } from '@/constants/theme';

type Kind = 'success' | 'error' | 'info';
interface ToastApi {
  show: (message: string, kind?: Kind) => void;
}
const Ctx = createContext<ToastApi>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; kind: Kind } | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, kind: Kind = 'success') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, kind });
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
      void Haptics.notificationAsync(
        kind === 'error' ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
      }, kind === 'error' ? 4200 : 2200);
    },
    [opacity],
  );

  const api = useMemo(() => ({ show }), [show]);
  const color = toast?.kind === 'error' ? t.danger : toast?.kind === 'info' ? t.primary : t.success;
  const icon = toast?.kind === 'error' ? 'alert-circle' : toast?.kind === 'info' ? 'information' : 'check-circle';

  return (
    <Ctx.Provider value={api}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[styles.wrap, { top: insets.top + 8, opacity }]}
        >
          <View style={[styles.toast, { backgroundColor: t.isDark ? t.surfaceAlt : '#14172B', borderColor: t.border }]}>
            <MaterialCommunityIcons name={icon} size={20} color={color} />
            <Text style={styles.text} numberOfLines={4}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 520,
  },
  text: { color: '#fff', fontSize: 14, fontWeight: '500', flexShrink: 1 },
});
