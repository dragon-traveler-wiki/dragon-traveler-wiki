import { Text } from '@mantine/core';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router';

/**
 * A community card's title. With `to`, it's a real link stretched over the
 * whole card (see `.dt-link-card` in interactions.css), so the card is
 * clickable, focusable, and openable in a new tab without a link-role wrapper.
 */
export default function CardTitle({
  to,
  style,
  children,
}: {
  to?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  if (!to) {
    return (
      <Text
        fw={700}
        size="md"
        className="dt-link-text"
        lineClamp={1}
        style={style}
      >
        {children}
      </Text>
    );
  }
  return (
    <Text
      component={Link}
      to={to}
      fw={700}
      size="md"
      className="dt-link-text dt-link-card__link"
      lineClamp={1}
      style={style}
    >
      {children}
    </Text>
  );
}
