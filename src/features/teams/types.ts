import type { ContentType } from '@/constants/content-types';
import type { FactionSlug } from '@/types/faction';
import type { Quality } from '@/types/quality';
import type { CommunityMeta } from '@/features/community/types';

export interface TeamMemberPosition {
  row: number; // 0 = Front, 1 = Middle, 2 = Back
  col: number; // 0 = Left, 1 = Center, 2 = Right
}

export interface TeamMember {
  character_slug: string;
  character_quality?: Quality;
  overdrive_order: number | null;
  note?: string;
  position?: TeamMemberPosition;
}

export interface TeamBenchMember {
  character_slug: string;
  character_quality?: Quality;
  note?: string;
}

export interface TeamWyrmspells {
  breach?: string;
  refuge?: string;
  wildcry?: string;
  dragons_call?: string;
}

export interface Team {
  name: string;
  author?: string;
  content_type: ContentType;
  description?: string;
  faction: FactionSlug;
  members: TeamMember[];
  bench?: TeamBenchMember[];
  wyrmspells?: TeamWyrmspells;
  last_updated: number;
  community?: CommunityMeta;
}
