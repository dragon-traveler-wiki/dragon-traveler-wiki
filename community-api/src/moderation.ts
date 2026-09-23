export type ModerationAction = 'hide' | 'restore' | 'delete';
export type ModerationStatus = 'hidden' | 'published' | 'deleted';

/** Maps a moderator action to the resulting community_items.status value. */
export function statusForModerationAction(
  action: ModerationAction,
): ModerationStatus {
  if (action === 'hide') return 'hidden';
  if (action === 'restore') return 'published';
  return 'deleted';
}
