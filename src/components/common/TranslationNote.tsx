import { Alert, Anchor } from '@mantine/core';
import type { ReactNode } from 'react';
import { IoInformationCircleOutline } from 'react-icons/io5';

interface TranslationNoteProps {
  sourceHref: string;
  sourceLabel: ReactNode;
  /** Text shown before the source link; replaces the default guide copy. */
  children?: ReactNode;
}

export default function TranslationNote({
  sourceHref,
  sourceLabel,
  children,
}: TranslationNoteProps) {
  return (
    <Alert
      variant="light"
      color="yellow"
      title="Translation note"
      icon={<IoInformationCircleOutline />}
    >
      {children ??
        'This section is translated and adapted from a Chinese community guide on GameKee:'}{' '}
      <Anchor href={sourceHref} target="_blank" rel="noopener noreferrer">
        {sourceLabel}
      </Anchor>
      .{!children && ' Source terms may contain typos or naming differences.'}
    </Alert>
  );
}
