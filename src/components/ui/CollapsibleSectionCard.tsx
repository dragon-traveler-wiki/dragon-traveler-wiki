import {
  Box,
  Collapse,
  Group,
  UnstyledButton,
  type MantineColor,
} from '@mantine/core';
import { useCallback, useState, type ReactNode } from 'react';
import { IoChevronDown } from 'react-icons/io5';
import { IMAGE_SIZE, NAV_ITEM_HEIGHT, TRANSITION } from '@/constants/ui';
import { StaticSurface } from '@/components/ui/Surface';

interface CollapsibleSectionCardProps {
  header: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  id?: string;
  color?: MantineColor;
}

export default function CollapsibleSectionCard({
  header,
  children,
  defaultExpanded = true,
  id,
  color,
}: CollapsibleSectionCardProps) {
  const [opened, setOpened] = useState(defaultExpanded);
  const toggle = useCallback(() => setOpened((v) => !v), []);

  return (
    <StaticSurface
      id={id}
      p="lg"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {color && (
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, var(--mantine-color-${color}-5), var(--mantine-color-${color}-3))`,
          }}
        />
      )}
      <UnstyledButton
        onClick={toggle}
        style={{
          width: '100%',
          minHeight: NAV_ITEM_HEIGHT,
          paddingBlock: 4,
          borderRadius: 'var(--mantine-radius-sm)',
        }}
        aria-expanded={opened}
      >
        <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
          <Box style={{ flex: 1, minWidth: 0 }}>{header}</Box>
          <Box
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              transition: `transform ${TRANSITION.FAST} ${TRANSITION.EASE}`,
              transform: opened ? 'rotate(180deg)' : 'rotate(0deg)',
              color: 'var(--mantine-color-dimmed)',
            }}
          >
            <IoChevronDown size={IMAGE_SIZE.ICON_LG} />
          </Box>
        </Group>
      </UnstyledButton>

      <Collapse expanded={opened}>
        <Box pt="md">{children}</Box>
      </Collapse>
    </StaticSurface>
  );
}
