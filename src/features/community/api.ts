import type {
  CommunityKind,
  CommunityListResponse,
  CommunityRevision,
  CommunityUser,
  ModerationAction,
  MyReport,
  PublicProfile,
  SuspensionDuration,
} from './types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const isCommunityApiConfigured = Boolean(API_BASE);

export class CommunityApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) {
    throw new CommunityApiError('Community services are not configured.', 503);
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
  };
  if (!response.ok) {
    throw new CommunityApiError(
      body.error || `Request failed (${response.status})`,
      response.status,
    );
  }
  return body as T;
}

function collectionForKind(kind: CommunityKind): string {
  return kind === 'team' ? 'teams' : 'tier-lists';
}

export async function getCurrentUser(): Promise<{
  user: CommunityUser | null;
  csrfToken?: string;
}> {
  return request('/v1/auth/me');
}

export function getOAuthUrl(
  provider: 'discord' | 'github',
  mode: 'login' | 'link' = 'login',
): string {
  if (!isCommunityApiConfigured) {
    throw new CommunityApiError('Community services are not configured.', 503);
  }
  const returnTo = `${window.location.pathname}${window.location.search}`;
  return `${API_BASE}/v1/auth/${provider}/start?mode=${mode}&returnTo=${encodeURIComponent(returnTo)}`;
}

export async function logout(csrfToken: string): Promise<void> {
  await request('/v1/auth/logout', {
    method: 'POST',
    headers: { 'X-CSRF-Token': csrfToken },
  });
}

export async function deleteAccount(csrfToken: string): Promise<void> {
  await request('/v1/auth/me', {
    method: 'DELETE',
    headers: { 'X-CSRF-Token': csrfToken },
  });
}

export async function unlinkIdentity(
  provider: 'discord' | 'github',
  csrfToken: string,
): Promise<void> {
  await request(`/v1/auth/${provider}/unlink`, {
    method: 'DELETE',
    headers: { 'X-CSRF-Token': csrfToken },
  });
}

export async function setPrimaryIdentity(
  provider: 'discord' | 'github',
  csrfToken: string,
): Promise<void> {
  await request('/v1/auth/primary', {
    method: 'PATCH',
    headers: { 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ provider }),
  });
}

export async function listCommunityItems<T>(
  kind: CommunityKind,
  params?: URLSearchParams,
): Promise<CommunityListResponse<T>> {
  const query = params?.toString();
  return request(`/v1/${collectionForKind(kind)}${query ? `?${query}` : ''}`);
}

export async function getCommunityItem<T>(kind: CommunityKind, id: string) {
  return request<{ item: CommunityListResponse<T>['items'][number] }>(
    `/v1/${collectionForKind(kind)}/${encodeURIComponent(id)}`,
  );
}

export async function publishCommunityItem<T>(
  kind: CommunityKind,
  payload: T,
  csrfToken: string,
  turnstileToken: string,
): Promise<{ id: string; slug: string }> {
  return request(`/v1/${collectionForKind(kind)}`, {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
      'X-Turnstile-Token': turnstileToken,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateCommunityItem<T>(
  kind: CommunityKind,
  id: string,
  payload: T,
  csrfToken: string,
): Promise<void> {
  await request(`/v1/${collectionForKind(kind)}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(payload),
  });
}

export async function setUpvote(
  kind: CommunityKind,
  id: string,
  upvote: boolean,
  csrfToken: string,
): Promise<{ score: number; viewerHasUpvoted: boolean }> {
  return request(
    `/v1/${collectionForKind(kind)}/${encodeURIComponent(id)}/upvote`,
    {
      method: upvote ? 'PUT' : 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken },
    },
  );
}

export async function reportCommunityItem(
  kind: CommunityKind,
  id: string,
  reason: string,
  note: string,
  csrfToken: string,
  turnstileToken: string,
): Promise<void> {
  await request(
    `/v1/${collectionForKind(kind)}/${encodeURIComponent(id)}/reports`,
    {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken,
        'X-Turnstile-Token': turnstileToken,
      },
      body: JSON.stringify({ reason, note }),
    },
  );
}

export async function deleteCommunityItem(
  kind: CommunityKind,
  id: string,
  csrfToken: string,
): Promise<void> {
  await request(`/v1/${collectionForKind(kind)}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-CSRF-Token': csrfToken },
  });
}

export async function getMyItems() {
  return request<{ items: CommunityListResponse<unknown>['items'] }>(
    '/v1/me/items',
  );
}

export async function getReports() {
  return request<{ reports: Array<Record<string, unknown>> }>(
    '/v1/admin/reports',
  );
}

export async function resolveReport(
  id: string,
  action: string,
  note: string,
  csrfToken: string,
) {
  return request(`/v1/admin/reports/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ action, note }),
  });
}

export async function getPublicProfile(userId: string) {
  return request<{ user: PublicProfile }>(
    `/v1/users/${encodeURIComponent(userId)}`,
  );
}

export async function getMyReports() {
  return request<{ reports: MyReport[] }>('/v1/me/reports');
}

export async function getRevisions(kind: CommunityKind, id: string) {
  return request<{ revisions: CommunityRevision[] }>(
    `/v1/${collectionForKind(kind)}/${encodeURIComponent(id)}/revisions`,
  );
}

export async function moderateItem(
  kind: CommunityKind,
  id: string,
  action: 'hide' | 'restore' | 'delete',
  csrfToken: string,
) {
  await request(
    `/v1/${collectionForKind(kind)}/${encodeURIComponent(id)}/moderate`,
    {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ action }),
    },
  );
}

export async function getSiteSettings() {
  return request<{ referenceTierListId: string | null }>('/v1/settings');
}

export async function setReferenceTierList(
  id: string | null,
  csrfToken: string,
) {
  await request('/v1/admin/settings/reference-tier-list', {
    method: 'PUT',
    headers: { 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ id }),
  });
}

export async function suspendUser(
  userId: string,
  input: {
    duration: SuspensionDuration;
    reason: string;
    hideContent: boolean;
  },
  csrfToken: string,
) {
  await request(`/v1/admin/users/${encodeURIComponent(userId)}/suspend`, {
    method: 'POST',
    headers: { 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  });
}

export async function setUserRole(
  userId: string,
  role: 'user' | 'moderator',
  csrfToken: string,
) {
  await request(`/v1/admin/users/${encodeURIComponent(userId)}/role`, {
    method: 'POST',
    headers: { 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ role }),
  });
}

export async function unsuspendUser(userId: string, csrfToken: string) {
  await request(`/v1/admin/users/${encodeURIComponent(userId)}/unsuspend`, {
    method: 'POST',
    headers: { 'X-CSRF-Token': csrfToken },
  });
}

export async function getModerationActions(userId?: string) {
  const query = userId ? `?user=${encodeURIComponent(userId)}` : '';
  return request<{ actions: ModerationAction[] }>(`/v1/admin/actions${query}`);
}

export async function withdrawReport(id: string, csrfToken: string) {
  await request(`/v1/me/reports/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-CSRF-Token': csrfToken },
  });
}
