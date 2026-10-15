import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, View } from 'react-native';
import { radius, space, useTheme } from '@/constants/theme';
import { formatDate } from '@/lib/format';
import { Text } from './ui';

export function DateField({
  label,
  value,
  onChange,
  optional,
  minimumDate,
  maximumDate,
}: {
  label: string;
  value: Date | null;
  onChange: (d: Date | null) => void;
  /** Shows a clear button when a value is set. */
  optional?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
}) {
  const t = useTheme();
  const shown = value ?? new Date();

  const box = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: t.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: t.border,
    paddingHorizontal: space.md,
    minHeight: 52,
  };

  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      {Platform.OS === 'android' ? (
        <Pressable
          style={box}
          onPress={() =>
            DateTimePickerAndroid.open({
              value: shown,
              mode: 'date',
              minimumDate,
              maximumDate,
              onValueChange: (_e, d) => onChange(d),
            })
          }
        >
          <MaterialCommunityIcons name="calendar-month-outline" size={20} color={t.textMuted} />
          <Text style={{ flex: 1, color: value ? t.text : t.textFaint, fontSize: 16 }}>{value ? formatDate(value.toISOString()) : 'Not set'}</Text>
          {optional && value ? (
            <Pressable onPress={() => onChange(null)} hitSlop={10}>
              <MaterialCommunityIcons name="close-circle" size={18} color={t.textFaint} />
            </Pressable>
          ) : null}
        </Pressable>
      ) : (
        <View style={box}>
          <MaterialCommunityIcons name="calendar-month-outline" size={20} color={t.textMuted} />
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            {optional && !value ? (
              <Pressable onPress={() => onChange(new Date())}>
                <Text tone="faint" style={{ fontSize: 16 }}>
                  Not set — tap to choose
                </Text>
              </Pressable>
            ) : (
              <DateTimePicker
                value={shown}
                mode="date"
                display="compact"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onValueChange={(_e, d) => onChange(d)}
              />
            )}
          </View>
          {optional && value ? (
            <Pressable onPress={() => onChange(null)} hitSlop={10}>
              <MaterialCommunityIcons name="close-circle" size={18} color={t.textFaint} />
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}
