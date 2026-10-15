import { useColorScheme } from 'react-native';

const light = {
  bg: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F2F8',
  border: '#E6E8F0',
  text: '#0F1222',
  textMuted: '#5B6178',
  textFaint: '#8E94A9',
  primary: '#5046E5',
  primarySoft: '#ECEBFD',
  onPrimary: '#FFFFFF',
  success: '#12A150',
  successSoft: '#E4F6EB',
  danger: '#E5484D',
  dangerSoft: '#FDECEC',
  warning: '#E08A00',
  warningSoft: '#FFF3DC',
  overlay: 'rgba(15,18,34,0.45)',
  shadow: '#1B1F3B',
};

const dark: typeof light = {
  bg: '#0B0D17',
  surface: '#141726',
  surfaceAlt: '#1C2033',
  border: '#262B42',
  text: '#F3F4FA',
  textMuted: '#A3A9C2',
  textFaint: '#6D7490',
  primary: '#7B72FF',
  primarySoft: '#23224A',
  onPrimary: '#FFFFFF',
  success: '#3DD68C',
  successSoft: '#12301F',
  danger: '#FF6B70',
  dangerSoft: '#3A1719',
  warning: '#F5B544',
  warningSoft: '#3A2B0E',
  overlay: 'rgba(0,0,0,0.6)',
  shadow: '#000000',
};

export type Theme = typeof light & { isDark: boolean };

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? { ...dark, isDark: true } : { ...light, isDark: false };
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;
