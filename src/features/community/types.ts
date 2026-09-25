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

export interface Suspension {
  /** Unix seconds the suspension ends; null when permanent. */
  until: number | null;
  permanent: boolean;
  reason: string;
}

export type SuspensionDuration = '1d' | '7d' | '30d' | 'permanent';

export interface CommunityUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'user' | 'moderator';
  primaryProvider: 'discord' | 'github' | null;
  identities: CommunityIdentity[];
  unreadReportCount: number;
  /** Open reports awaiting review; always 0 for non-moderators. */
  openReportCount: number;
  suspension: Suspension | null;
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
  /** Only present when the viewer is a moderator. */
  moderation?: {
    canSuspend: boolean;
    suspension: Suspension | null;
  };
}

export interface ModerationAction {
  id: string;
  action: string;
  target_kind: 'team' | 'tier_list' | 'user' | 'report' | 'setting';
  target_id: string;
  target_label: string | null;
  note: string;
  moderator_name: string;
  created_at: number;
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
