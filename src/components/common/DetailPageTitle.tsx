import { useDarkMode } from '@/hooks';
import { Title } from '@mantine/core';
import type { ReactNode } from 'react';

export default function DetailPageTitle({ children }: { children: ReactNode }) {
  const isDark = useDarkMode();

  return (
    <Title
      order={1}
      c={isDark ? 'white' : 'dark'}
      fz={{ base: '1.5rem', sm: '2.125rem' }}
      style={{ lineHeight: 1.2, wordBreak: 'break-word' }}
    >
      {children}
    </Title>
  );
}
