import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space, useTheme } from '@/constants/theme';
import { errorMessage } from '@/lib/api';
import type { IconName } from '@/lib/icons';

// ── Typography ─────────────────────────────────────────────────────────────────

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';
const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontSize: 34, fontWeight: '700', letterSpacing: -0.8 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontSize: 17, fontWeight: '600', letterSpacing: -0.1 },
  body: { fontSize: 15, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '500' },
};

export function Text({
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}: {
  variant?: Variant;
  tone?: 'default' | 'muted' | 'faint' | 'primary' | 'success' | 'danger' | 'warning' | 'onPrimary';
} & React.ComponentProps<typeof RNText>) {
  const t = useTheme();
  const color = {
    default: t.text,
    muted: t.textMuted,
    faint: t.textFaint,
    primary: t.primary,
    success: t.success,
    danger: t.danger,
    warning: t.warning,
    onPrimary: t.onPrimary,
  }[tone];
  return <RNText {...rest} style={[VARIANTS[variant], { color }, style]} />;
}

// ── Layout ─────────────────────────────────────────────────────────────────────

export function Screen({
  children,
  scroll = true,
  onRefresh,
  refreshing = false,
  padded = true,
  contentStyle,
  edges = ['top'],
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
  footer?: ReactNode;
}) {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={edges}>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[{ paddingHorizontal: padded ? space.lg : 0, paddingBottom: 120, gap: space.lg }, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primary} /> : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingHorizontal: padded ? space.lg : 0 }, contentStyle]}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

export function Header({
  title,
  subtitle,
  back,
  right,
  large,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  large?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ paddingTop: space.sm, paddingBottom: space.xs, gap: space.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 40, gap: space.sm }}>
        {back && (
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            hitSlop={12}
            style={[styles.iconBtn, { backgroundColor: t.surface, borderColor: t.border }]}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color={t.text} />
          </Pressable>
        )}
        {!large && (
          <Text variant="heading" style={{ flex: 1 }} numberOfLines={1}>
            {title}
          </Text>
        )}
        {large && <View style={{ flex: 1 }} />}
        {right}
      </View>
      {large && (
        <View style={{ gap: 2 }}>
          <Text variant="title">{title}</Text>
          {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
        </View>
      )}
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  tone,
  disabled,
}: {
  icon: IconName;
  onPress: () => void;
  tone?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
}) {
  const t = useTheme();
  const color = tone === 'primary' ? t.primary : tone === 'danger' ? t.danger : t.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconBtn,
        { backgroundColor: t.surface, borderColor: t.border, opacity: pressed || disabled ? 0.6 : 1 },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={21} color={color} />
    </Pressable>
  );
}

export function Card({
  children,
  style,
  onPress,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padded?: boolean;
}) {
  const t = useTheme();
  const base: ViewStyle = {
    backgroundColor: t.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.border,
    padding: padded ? space.lg : 0,
    shadowColor: t.shadow,
    shadowOpacity: t.isDark ? 0 : 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: t.isDark ? 0 : 1,
  };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text variant="heading">{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text variant="label" tone="primary">
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border }} />;
}

// ── Buttons ────────────────────────────────────────────────────────────────────

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  size = 'lg',
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const palette = {
    primary: { bg: t.primary, fg: t.onPrimary, border: t.primary },
    secondary: { bg: t.surface, fg: t.text, border: t.border },
    ghost: { bg: 'transparent', fg: t.primary, border: 'transparent' },
    danger: { bg: t.dangerSoft, fg: t.danger, border: 'transparent' },
  }[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      disabled={inactive}
      style={({ pressed }) => [
        {
          height: size === 'lg' ? 52 : 42,
          borderRadius: radius.md,
          paddingHorizontal: space.lg,
          backgroundColor: palette.bg,
          borderWidth: 1,
          borderColor: palette.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: inactive ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon && <MaterialCommunityIcons name={icon} size={20} color={palette.fg} />}
          <RNText style={{ color: palette.fg, fontSize: size === 'lg' ? 16 : 14, fontWeight: '600' }}>{title}</RNText>
        </>
      )}
    </Pressable>
  );
}

export function Fab({ onPress, icon = 'plus' }: { onPress: () => void; icon?: IconName }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: t.primary,
          bottom: 16 + (Platform.OS === 'ios' ? 0 : 0) + Math.max(insets.bottom - 8, 0),
          shadowColor: t.primary,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={28} color={t.onPrimary} />
    </Pressable>
  );
}

// ── Inputs ─────────────────────────────────────────────────────────────────────

export function Input({
  label,
  error,
  hint,
  prefix,
  secure,
  style,
  ...rest
}: TextInputProps & { label?: string; error?: string | null; hint?: string; prefix?: string; secure?: boolean }) {
  const t = useTheme();
  const [focus, setFocus] = useState(false);
  const [reveal, setReveal] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text variant="label" tone="muted">
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: rest.multiline ? 'flex-start' : 'center',
          backgroundColor: t.surface,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: error ? t.danger : focus ? t.primary : t.border,
          paddingHorizontal: space.md,
        }}
      >
        {prefix ? (
          <Text variant="heading" tone="muted" style={{ marginRight: 6 }}>
            {prefix}
          </Text>
        ) : null}
        <TextInput
          placeholderTextColor={t.textFaint}
          {...rest}
          secureTextEntry={secure && !reveal}
          onFocus={(e) => {
            setFocus(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            rest.onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              color: t.text,
              fontSize: 16,
              paddingVertical: rest.multiline ? 12 : 14,
              minHeight: rest.multiline ? 88 : undefined,
              textAlignVertical: rest.multiline ? 'top' : 'center',
            },
            style,
          ]}
        />
        {secure ? (
          <Pressable onPress={() => setReveal((r) => !r)} hitSlop={10}>
            <MaterialCommunityIcons name={reveal ? 'eye-off-outline' : 'eye-outline'} size={20} color={t.textFaint} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="faint">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.surfaceAlt, borderRadius: radius.md, padding: 3 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              paddingVertical: 9,
              alignItems: 'center',
              borderRadius: radius.md - 3,
              backgroundColor: active ? t.surface : 'transparent',
              shadowColor: t.shadow,
              shadowOpacity: active && !t.isDark ? 0.1 : 0,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: active ? 1 : 0,
            }}
          >
            <Text variant="label" tone={active ? 'default' : 'muted'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
  color,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
  color?: string;
}) {
  const t = useTheme();
  const accent = color ?? t.primary;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: active ? accent : t.border,
        backgroundColor: active ? (t.isDark ? t.primarySoft : accent + '1A') : t.surface,
      }}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={16} color={active ? accent : t.textMuted} /> : null}
      <Text variant="label" style={{ color: active ? accent : t.textMuted }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'danger' | 'warning' | 'primary' }) {
  const t = useTheme();
  const map = {
    neutral: { bg: t.surfaceAlt, fg: t.textMuted },
    success: { bg: t.successSoft, fg: t.success },
    danger: { bg: t.dangerSoft, fg: t.danger },
    warning: { bg: t.warningSoft, fg: t.warning },
    primary: { bg: t.primarySoft, fg: t.primary },
  }[tone];
  return (
    <View style={{ backgroundColor: map.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' }}>
      <RNText style={{ color: map.fg, fontSize: 11, fontWeight: '700', letterSpacing: 0.2 }}>{label}</RNText>
    </View>
  );
}

export function IconBadge({ icon, color, size = 40 }: { icon: IconName; color?: string; size?: number }) {
  const t = useTheme();
  const c = color ?? t.primary;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: c + (t.isDark ? '2E' : '1F'),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialCommunityIcons name={icon} size={size * 0.52} color={c} />
    </View>
  );
}

export function ProgressBar({ value, color, height = 8 }: { value: number; color?: string; height?: number }) {
  const t = useTheme();
  const pct = Math.max(0, Math.min(100, value));
  const [anim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 600, useNativeDriver: false }).start();
  }, [pct, anim]);
  return (
    <View style={{ height, borderRadius: height, backgroundColor: t.surfaceAlt, overflow: 'hidden' }}>
      <Animated.View
        style={{
          height,
          borderRadius: height,
          backgroundColor: color ?? t.primary,
          width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

// ── Rows / lists ───────────────────────────────────────────────────────────────

export function ListRow({
  icon,
  iconColor,
  title,
  subtitle,
  right,
  onPress,
  chevron,
  destructive,
}: {
  icon?: IconName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingVertical: 12,
        paddingHorizontal: space.lg,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {icon ? <IconBadge icon={icon} color={destructive ? t.danger : iconColor} size={38} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" tone={destructive ? 'danger' : 'default'} style={{ fontWeight: '500' }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {chevron ? <MaterialCommunityIcons name="chevron-right" size={22} color={t.textFaint} /> : null}
    </Pressable>
  );
}

export function Group({ children }: { children: ReactNode[] | ReactNode }) {
  const items = (Array.isArray(children) ? children : [children]).filter(Boolean);
  return (
    <Card padded={false}>
      {items.map((c, i) => (
        <View key={i}>
          {i > 0 && (
            <View style={{ marginLeft: space.lg + 38 + space.md }}>
              <Divider />
            </View>
          )}
          {c}
        </View>
      ))}
    </Card>
  );
}

// ── States ─────────────────────────────────────────────────────────────────────

export function Skeleton({ height = 16, width, style }: { height?: number; width?: number | `${number}%`; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[{ height, width: width ?? '100%', borderRadius: 8, backgroundColor: t.surfaceAlt, opacity }, style]}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card style={{ gap: 12 }}>
      <Skeleton height={14} width="40%" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={i === 0 ? 28 : 12} width={i === 0 ? '60%' : '90%'} />
      ))}
    </Card>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  onAction,
}: {
  icon: IconName;
  title: string;
  message?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.xl, gap: space.md }}>
      <IconBadge icon={icon} size={64} />
      <Text variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {message ? (
        <Text tone="muted" style={{ textAlign: 'center' }}>
          {message}
        </Text>
      ) : null}
      {action && onAction ? <Button title={action} onPress={onAction} size="md" /> : null}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.xl, gap: space.md }}>
      <IconBadge icon="cloud-off-outline" color="#E5484D" size={64} />
      <Text variant="heading">Couldn't load this</Text>
      <Text tone="muted" style={{ textAlign: 'center' }}>
        {errorMessage(error)}
      </Text>
      {onRetry ? <Button title="Try again" onPress={onRetry} size="md" variant="secondary" icon="refresh" /> : null}
    </View>
  );
}

export function Loading() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
      <ActivityIndicator size="large" color={t.primary} />
    </View>
  );
}

// ── Sheet & pickers ────────────────────────────────────────────────────────────

export function Sheet({
  visible,
  onClose,
  title,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: t.overlay }]} onPress={onClose} />
        <View
          style={{
            backgroundColor: t.bg,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            maxHeight: '88%',
            paddingBottom: Math.max(insets.bottom, 12),
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.border }} />
          </View>
          {title ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: space.md }}>
              <Text variant="heading" style={{ flex: 1 }}>
                {title}
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={22} color={t.textMuted} />
              </Pressable>
            </View>
          ) : null}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.lg }}
          >
            {children}
          </ScrollView>
          {footer ? <View style={{ paddingHorizontal: space.lg, paddingTop: 4 }}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: IconName;
  color?: string;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  clearLabel,
  error,
}: {
  label?: string;
  value: T | null | undefined;
  options: Array<Option<T>>;
  onChange: (v: T | null) => void;
  placeholder?: string;
  /** When set, shows a "none" row that clears the selection. */
  clearLabel?: string;
  error?: string | null;
}) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text variant="label" tone="muted">
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: t.surface,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: error ? t.danger : t.border,
          paddingHorizontal: space.md,
          minHeight: 52,
        }}
      >
        {selected?.icon ? <IconBadge icon={selected.icon} color={selected.color} size={28} /> : null}
        <RNText style={{ flex: 1, color: selected ? t.text : t.textFaint, fontSize: 16 }} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </RNText>
        <MaterialCommunityIcons name="chevron-down" size={22} color={t.textFaint} />
      </Pressable>
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
      <Sheet visible={open} onClose={() => setOpen(false)} title={label ?? placeholder}>
        <Card padded={false}>
          {clearLabel ? (
            <OptionRow
              label={clearLabel}
              selected={!selected}
              onPress={() => {
                onChange(null);
                setOpen(false);
              }}
            />
          ) : null}
          {options.map((o, i) => (
            <View key={o.value}>
              {(i > 0 || clearLabel) && <Divider />}
              <OptionRow
                label={o.label}
                description={o.description}
                icon={o.icon}
                color={o.color}
                selected={o.value === value}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              />
            </View>
          ))}
        </Card>
      </Sheet>
    </View>
  );
}

function OptionRow({
  label,
  description,
  icon,
  color,
  selected,
  onPress,
}: {
  label: string;
  description?: string;
  icon?: IconName;
  color?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        padding: space.md,
        paddingHorizontal: space.lg,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {icon ? <IconBadge icon={icon} color={color} size={34} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: selected ? '600' : '400' }}>{label}</Text>
        {description ? (
          <Text variant="caption" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      {selected ? <MaterialCommunityIcons name="check" size={20} color={t.primary} /> : null}
    </Pressable>
  );
}

// ── Misc ───────────────────────────────────────────────────────────────────────

export function Delta({ pct, invert }: { pct: string | null | undefined; invert?: boolean }) {
  if (pct === null || pct === undefined) return null;
  const n = Number(pct);
  if (!Number.isFinite(n) || Math.abs(n) < 0.05) return <Badge label="0%" />;
  // For spending, an increase is bad (invert=true).
  const good = invert ? n < 0 : n > 0;
  return <Badge label={`${n > 0 ? '▲' : '▼'} ${Math.abs(n).toFixed(0)}%`} tone={good ? 'success' : 'danger'} />;
}

export function FormError({ error }: { error: unknown }) {
  const t = useTheme();
  if (!error) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 8, backgroundColor: t.dangerSoft, padding: space.md, borderRadius: radius.md }}>
      <MaterialCommunityIcons name="alert-circle-outline" size={18} color={t.danger} />
      <Text variant="label" tone="danger" style={{ flex: 1 }}>
        {errorMessage(error)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
