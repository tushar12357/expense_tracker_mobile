import type { TransactionType } from './types';

/** Indian digit grouping (12,34,567.89) on a decimal string, without going through floats. */
export function groupIndian(intPart: string): string {
  if (intPart.length <= 3) return intPart;
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

export function formatMoney(value: string | number | null | undefined, opts: { decimals?: boolean; sign?: boolean } = {}): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'number' ? value.toFixed(2) : value;
  const negative = n.startsWith('-');
  const [i = '0', f = '00'] = n.replace('-', '').split('.');
  const showDecimals = opts.decimals ?? true;
  const body = groupIndian(i) + (showDecimals ? `.${f.padEnd(2, '0').slice(0, 2)}` : '');
  const sign = negative ? '-' : opts.sign ? '+' : '';
  return `${sign}₹${body}`;
}

/** Compact: ₹1.2L, ₹45K — used on chart axes and tight tiles. */
export function formatCompact(value: string | number): string {
  const n = Math.abs(Number(value));
  const sign = Number(value) < 0 ? '-' : '';
  if (n >= 1e7) return `${sign}₹${(n / 1e7).toFixed(n >= 1e8 ? 0 : 1)}Cr`;
  if (n >= 1e5) return `${sign}₹${(n / 1e5).toFixed(n >= 1e6 ? 0 : 1)}L`;
  if (n >= 1e3) return `${sign}₹${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`;
  return `${sign}₹${n.toFixed(0)}`;
}

export const num = (v: string | number | null | undefined) => (v === null || v === undefined ? 0 : Number(v));

export function formatPct(v: string | null | undefined, digits = 0): string {
  if (v === null || v === undefined) return '—';
  return `${Number(v).toFixed(digits)}%`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const monthShort = (m: number) => MONTHS[m - 1] ?? '';
export const monthLong = (m: number) => MONTHS_LONG[m - 1] ?? '';

export function formatDate(iso: string, withYear = true): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Today';
  if (same(d, yesterday)) return 'Yesterday';
  return `${d.toLocaleDateString(undefined, { weekday: 'short' })}, ${formatDate(iso, d.getFullYear() !== today.getFullYear())}`;
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(iso);
}

/** "2026-10" -> "Oct" */
export const trendMonthLabel = (ym: string) => monthShort(Number(ym.slice(5, 7)));

export function currentYearMonth() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
export function shiftMonth(ym: { year: number; month: number }, delta: number) {
  const idx = ym.year * 12 + (ym.month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}
export const isFutureMonth = (ym: { year: number; month: number }) => {
  const c = currentYearMonth();
  return ym.year * 12 + ym.month > c.year * 12 + c.month;
};

export const TYPE_LABEL: Record<TransactionType, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  REFUND: 'Refund',
  TRANSFER: 'Transfer',
};

/** Matches /^\d{1,12}(\.\d{1,2})?$/ — the backend's money format. */
export const isValidAmount = (s: string) => /^\d{1,12}(\.\d{1,2})?$/.test(s) && Number(s) > 0;

/** Keep only digits and one dot, max 2 decimals — for amount inputs. */
export function sanitizeAmountInput(s: string): string {
  let out = s.replace(/[^\d.]/g, '');
  const dot = out.indexOf('.');
  if (dot !== -1) out = out.slice(0, dot + 1) + out.slice(dot + 1).replace(/\./g, '').slice(0, 2);
  return out.slice(0, 15);
}

export function toDateOnly(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
];
