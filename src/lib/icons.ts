import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { AccountType } from './types';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Backend stores lucide-style icon names on categories; map them to MaterialCommunityIcons. */
export const CATEGORY_ICONS: Record<string, IconName> = {
  briefcase: 'briefcase-outline',
  'plus-circle': 'plus-circle-outline',
  home: 'home-outline',
  'shopping-cart': 'cart-outline',
  utensils: 'silverware-fork-knife',
  car: 'car-outline',
  zap: 'flash-outline',
  repeat: 'repeat',
  'shopping-bag': 'shopping-outline',
  'heart-pulse': 'heart-pulse',
  film: 'movie-open-outline',
  plane: 'airplane',
  'graduation-cap': 'school-outline',
  'piggy-bank': 'piggy-bank-outline',
  banknote: 'cash',
  receipt: 'receipt-text-outline',
  'arrow-left-right': 'swap-horizontal',
  circle: 'circle-outline',
  coffee: 'coffee-outline',
  gift: 'gift-outline',
  phone: 'cellphone',
  paw: 'paw-outline',
  dumbbell: 'dumbbell',
  gamepad: 'gamepad-variant-outline',
  baby: 'baby-face-outline',
  wrench: 'wrench-outline',
};

export const PICKABLE_ICONS = Object.keys(CATEGORY_ICONS);

export function categoryIcon(name?: string | null): IconName {
  return (name && CATEGORY_ICONS[name]) || 'tag-outline';
}

export const ACCOUNT_TYPES: Array<{ value: AccountType; label: string; icon: IconName }> = [
  { value: 'SAVINGS', label: 'Savings', icon: 'bank-outline' },
  { value: 'CURRENT', label: 'Current', icon: 'domain' },
  { value: 'CREDIT_CARD', label: 'Credit card', icon: 'credit-card-outline' },
  { value: 'WALLET', label: 'Wallet', icon: 'wallet-outline' },
  { value: 'CASH', label: 'Cash', icon: 'cash' },
];
export const accountMeta = (t: AccountType) => ACCOUNT_TYPES.find((a) => a.value === t) ?? ACCOUNT_TYPES[0]!;

export const CATEGORY_COLORS = [
  '#5046E5', '#7C3AED', '#EC4899', '#EF4444', '#F97316', '#EAB308',
  '#16A34A', '#14B8A6', '#0EA5E9', '#3B82F6', '#78716C', '#64748B',
];
