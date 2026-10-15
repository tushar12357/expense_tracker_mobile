import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { radius, useTheme } from '@/constants/theme';
import { formatCompact, formatMoney, num, trendMonthLabel } from '@/lib/format';
import type { TrendMonth } from '@/lib/types';
import { Text } from './ui';

export const CHART_PALETTE = ['#5046E5', '#14B8A6', '#F97316', '#EC4899', '#0EA5E9', '#EAB308', '#16A34A', '#A855F7', '#EF4444', '#64748B'];

export interface DonutSlice {
  key: string;
  value: number;
  color: string;
}

export function DonutChart({
  slices,
  size = 176,
  stroke = 22,
  centerLabel,
  centerValue,
}: {
  slices: DonutSlice[];
  size?: number;
  stroke?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((s, x) => s + Math.max(x.value, 0), 0);
  const gap = slices.length > 1 ? 3 : 0; // visual gap between arcs, in px of circumference
  let offset = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.surfaceAlt} strokeWidth={stroke} fill="none" />
          {total > 0 &&
            slices.map((s) => {
              const len = (Math.max(s.value, 0) / total) * c;
              const dash = Math.max(len - gap, 0.5);
              const el = (
                <Circle
                  key={s.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={s.color}
                  strokeWidth={stroke}
                  fill="none"
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += len;
              return el;
            })}
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', maxWidth: size - stroke * 2 - 8 }}>
        {centerLabel ? (
          <Text variant="caption" tone="muted">
            {centerLabel}
          </Text>
        ) : null}
        {centerValue ? (
          <Text variant="heading" numberOfLines={1} adjustsFontSizeToFit>
            {centerValue}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** Income vs net expenses per month. Tap a bar group to see the exact numbers. */
export function TrendChart({ months, height = 180 }: { months: TrendMonth[]; height?: number }) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const padL = 38;
  const padB = 22;
  const padT = 8;
  const innerH = height - padB - padT;
  const max = Math.max(1, ...months.flatMap((m) => [num(m.income), num(m.netExpenses)]));
  const niceMax = niceCeil(max);
  const ticks = [0, 0.5, 1].map((f) => niceMax * f);
  const innerW = Math.max(width - padL, 0);
  const groupW = months.length ? innerW / months.length : 0;
  const barW = Math.min(14, Math.max(groupW * 0.28, 4));
  const y = (v: number) => padT + innerH - (v / niceMax) * innerH;
  const sel = selected !== null ? months[selected] : null;

  return (
    <View style={{ gap: 10 }}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={height}>
            {ticks.map((tk) => (
              <G key={tk}>
                <Line x1={padL} x2={width} y1={y(tk)} y2={y(tk)} stroke={t.border} strokeWidth={1} strokeDasharray={tk === 0 ? undefined : '3 4'} />
                <SvgText x={padL - 6} y={y(tk) + 4} fontSize={10} fill={t.textFaint} textAnchor="end">
                  {formatCompact(tk)}
                </SvgText>
              </G>
            ))}
            {months.map((m, i) => {
              const cx = padL + groupW * i + groupW / 2;
              const inc = num(m.income);
              const exp = num(m.netExpenses);
              const active = selected === i;
              return (
                <G key={m.month} opacity={selected === null || active ? 1 : 0.45} onPress={() => setSelected(active ? null : i)}>
                  <Rect x={padL + groupW * i} y={0} width={groupW} height={height} fill="transparent" />
                  <Rect x={cx - barW - 1} y={y(inc)} width={barW} height={Math.max(padT + innerH - y(inc), inc > 0 ? 2 : 0)} rx={3} fill={t.success} />
                  <Rect x={cx + 1} y={y(exp)} width={barW} height={Math.max(padT + innerH - y(exp), exp > 0 ? 2 : 0)} rx={3} fill={t.primary} />
                  <SvgText x={cx} y={height - 6} fontSize={10} fill={active ? t.text : t.textFaint} textAnchor="middle" fontWeight={active ? '700' : '400'}>
                    {trendMonthLabel(m.month)}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Legend color={t.success} label="Income" />
        <Legend color={t.primary} label="Spent" />
      </View>
      {sel && (
        <View style={{ backgroundColor: t.surfaceAlt, borderRadius: radius.md, padding: 12, gap: 4 }}>
          <Text variant="label">{sel.month}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="caption" tone="muted">
              Income
            </Text>
            <Text variant="caption" tone="success">
              {formatMoney(sel.income)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="caption" tone="muted">
              Spent
            </Text>
            <Text variant="caption">{formatMoney(sel.netExpenses)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="caption" tone="muted">
              Saved
            </Text>
            <Text variant="caption" tone={num(sel.netCashFlow) >= 0 ? 'success' : 'danger'}>
              {formatMoney(sel.netCashFlow)}
              {sel.savingsRate !== null ? `  (${Number(sel.savingsRate).toFixed(0)}%)` : ''}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

function niceCeil(v: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}
