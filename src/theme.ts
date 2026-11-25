import { useColorScheme } from 'react-native';

const light = {
  bg: '#f4f2ee',
  card: '#ffffff',
  ink: '#1c1b19',
  muted: '#77736b',
  line: '#e4e0d8',
  accent: '#1f7a4d',
  accentInk: '#ffffff',
  warn: '#9a5b00',
};
const dark: typeof light = {
  bg: '#121211',
  card: '#1c1c1a',
  ink: '#eeebe4',
  muted: '#9a958c',
  line: '#2c2b28',
  accent: '#3fb27a',
  accentInk: '#0d1a13',
  warn: '#e0a54a',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
