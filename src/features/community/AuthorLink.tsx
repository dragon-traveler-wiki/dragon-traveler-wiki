import { Text } from '@mantine/core';
import { Link } from 'react-router';
import type { CommunityAuthor } from './types';

interface AuthorLinkProps {
  author?: CommunityAuthor;
  fallback?: string;
  size?: string;
  fw?: number;
}

/** Renders a published item's real author as a link to their public profile. */
export default function AuthorLink({
  author,
  fallback,
  size,
  fw = 500,
}: AuthorLinkProps) {
  if (!author) {
    if (!fallback) return null;
    return (
      <Text span size={size} fw={fw} inherit>
        {fallback}
      </Text>
    );
  }
  return (
    <Text
      span
      component={Link}
      to={`/profile/${author.id}`}
      size={size}
      fw={fw}
      className="dt-link-text dt-link-card__above"
      inherit
      style={{ textDecoration: 'none' }}
    >
      {author.displayName}
    </Text>
  );
}
