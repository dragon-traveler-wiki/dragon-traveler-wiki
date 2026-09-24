export type CommunityKind = 'team' | 'tier_list';

export interface CommunityAuthor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface CommunityMeta {
  id: string;
  kind: CommunityKind;
  slug: string;
  author: CommunityAuthor;
  score: number;
  status: 'published' | 'hidden' | 'deleted';
  viewerHasUpvoted: boolean;
  viewerOwns: boolean;
  revision: number;
  createdAt: number;
  updatedAt: number;
}

export interface CommunityItem<T> extends CommunityMeta {
  payload: T;
}

export interface CommunityListResponse<T> {
  items: CommunityItem<T>[];
  nextCursor: string | null;
  /** Matching item count; only sent on the first page (no cursor). */
  total?: number | null;
}

export interface CommunityIdentity {
  provider: 'discord' | 'github';
  username: string;
}

export interface CommunityUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'user' | 'moderator';
  primaryProvider: 'discord' | 'github' | null;
  identities: CommunityIdentity[];
  unreadReportCount: number;
}

export interface CommunityStats {
  teams: number;
  tierLists: number;
  /** Total upvotes received across published items. */
  upvotes: number;
}

export interface PublicProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  stats: CommunityStats;
}

export interface CommunityRevision {
  revision: number;
  editorName: string;
  createdAt: number;
}

export interface MyReport {
  id: string;
  item_id: string;
  reason: string;
  note: string;
  status: 'open' | 'dismissed' | 'resolved';
  resolution_note: string;
  created_at: number;
  kind: CommunityKind;
  title: string;
  slug: string;
  item_status: 'published' | 'hidden' | 'deleted';
}
