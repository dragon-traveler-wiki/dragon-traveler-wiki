import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { purgeExpired } from '../src/retention';
import {
  createHarness,
  json,
  type Harness,
  type TestUser,
} from './helpers/harness';

const TEAM = {
  name: 'Route Test Team',
  content_type: 'PvE',
  faction: 'wild_spirit',
  members: [{ character_slug: 'athena_ssr_ex', position: { row: 0, col: 0 } }],
};

let h: Harness;
let mod: TestUser;

beforeAll(async () => {
  h = await createHarness();
  mod = await h.createUser({ id: 'mod', name: 'Mod', role: 'moderator' });
});

afterAll(async () => {
  await h.dispose();
});

type ListBody = {
  items: Array<{ id: string; status?: string; score: number }>;
  nextCursor: string | null;
  total: number | null;
};

describe('authentication', () => {
  it('reports no user when signed out', async () => {
    const res = await h.request('/v1/auth/me');
    expect(await json(res)).toEqual({ user: null });
  });

  it('rejects writes without a session', async () => {
    const res = await h.request('/v1/teams', { method: 'POST', body: TEAM });
    expect(res.status).toBe(401);
  });

  it('rejects writes that lack the CSRF header', async () => {
    const user = await h.createUser();
    const res = await h.request('/v1/teams', {
      method: 'POST',
      body: TEAM,
      user,
      omitCsrf: true,
    });
    expect(res.status).toBe(403);
  });
});

describe('publishing', () => {
  it('publishes a valid team and rejects bad or unknown data', async () => {
    const author = await h.createUser();
    const created = await h.request('/v1/teams', {
      method: 'POST',
      body: TEAM,
      user: author,
    });
    expect(created.status).toBe(201);
    const { id } = await json<{ id: string }>(created);

    const list = await json<ListBody>(
      await h.request(`/v1/teams?owner=${author.id}`),
    );
    expect(list.items.map((item) => item.id)).toEqual([id]);

    const invalid = await h.request('/v1/teams', {
      method: 'POST',
      body: { ...TEAM, members: [] },
      user: author,
    });
    expect(invalid.status).toBe(400);

    const unknown = await h.request('/v1/teams', {
      method: 'POST',
      body: {
        ...TEAM,
        members: [{ character_slug: 'nobody', position: { row: 0, col: 0 } }],
      },
      user: author,
    });
    expect(unknown.status).toBe(422);
  });
});

describe('listing', () => {
  it('hides unpublished items and pages with a total on the first page', async () => {
    const owner = await h.createUser();
    for (const [id, status, createdAt] of [
      ['list-a', 'published', 300],
      ['list-b', 'published', 200],
      ['list-c', 'published', 100],
      ['list-hidden', 'hidden', 400],
      ['list-deleted', 'deleted', 500],
    ] as const) {
      await h.createItem({ id, ownerId: owner.id, status, createdAt });
    }

    const first = await json<ListBody>(
      await h.request(`/v1/teams?owner=${owner.id}&sort=new&limit=2`),
    );
    expect(first.items.map((item) => item.id)).toEqual(['list-a', 'list-b']);
    expect(first.total).toBe(3);
    expect(first.nextCursor).not.toBeNull();

    const second = await json<ListBody>(
      await h.request(
        `/v1/teams?owner=${owner.id}&sort=new&limit=2&cursor=${first.nextCursor}`,
      ),
    );
    expect(second.items.map((item) => item.id)).toEqual(['list-c']);
    expect(second.total).toBeNull();
    expect(second.nextCursor).toBeNull();
  });

  it('only shows hidden items to moderators', async () => {
    const owner = await h.createUser();
    await h.createItem({
      id: 'vis-hidden',
      ownerId: owner.id,
      status: 'hidden',
    });
    const query = `/v1/teams?owner=${owner.id}&status=hidden`;

    const anonymous = await json<ListBody>(await h.request(query));
    expect(anonymous.items).toEqual([]);
    const moderator = await json<ListBody>(
      await h.request(query, { user: mod }),
    );
    expect(moderator.items.map((item) => item.id)).toEqual(['vis-hidden']);
  });

  it('returns 400 for a malformed cursor', async () => {
    const res = await h.request('/v1/teams?cursor=nonsense');
    expect(res.status).toBe(400);
  });
});

describe('votes and reports', () => {
  it('lets others upvote once and never the owner', async () => {
    const owner = await h.createUser();
    const fan = await h.createUser();
    await h.createItem({ id: 'vote-item', ownerId: owner.id });

    const own = await h.request('/v1/teams/vote-item/upvote', {
      method: 'PUT',
      user: owner,
    });
    expect(own.status).toBe(400);

    const first = await h.request('/v1/teams/vote-item/upvote', {
      method: 'PUT',
      user: fan,
    });
    expect((await json<{ score: number }>(first)).score).toBe(1);
    const again = await h.request('/v1/teams/vote-item/upvote', {
      method: 'PUT',
      user: fan,
    });
    expect((await json<{ score: number }>(again)).score).toBe(1);
    const removed = await h.request('/v1/teams/vote-item/upvote', {
      method: 'DELETE',
      user: fan,
    });
    expect((await json<{ score: number }>(removed)).score).toBe(0);
  });

  it('lets a reporter withdraw an open report but not a closed one', async () => {
    const owner = await h.createUser();
    const reporter = await h.createUser();
    const stranger = await h.createUser();
    await h.createItem({ id: 'report-item', ownerId: owner.id });
    const filed = await h.request('/v1/teams/report-item/reports', {
      method: 'POST',
      body: { reason: 'spam', note: 'ad' },
      user: reporter,
    });
    expect(filed.status).toBeLessThan(300);

    const mine = await json<{ reports: Array<{ id: string }> }>(
      await h.request('/v1/me/reports', { user: reporter }),
    );
    const reportId = mine.reports[0].id;

    const notMine = await h.request(`/v1/me/reports/${reportId}`, {
      method: 'DELETE',
      user: stranger,
    });
    expect(notMine.status).toBe(404);
    const withdrawn = await h.request(`/v1/me/reports/${reportId}`, {
      method: 'DELETE',
      user: reporter,
    });
    expect(withdrawn.status).toBe(200);

    await h.createItem({ id: 'report-item-2', ownerId: owner.id });
    await h.request('/v1/teams/report-item-2/reports', {
      method: 'POST',
      body: { reason: 'spam', note: '' },
      user: reporter,
    });
    await h.request('/v1/teams/report-item-2/moderate', {
      method: 'POST',
      body: { action: 'hide' },
      user: mod,
    });
    const closed = await json<{ reports: Array<{ id: string }> }>(
      await h.request('/v1/me/reports', { user: reporter }),
    );
    const tooLate = await h.request(`/v1/me/reports/${closed.reports[0].id}`, {
      method: 'DELETE',
      user: reporter,
    });
    expect(tooLate.status).toBe(409);
  });
});

describe('moderation', () => {
  it('refuses non-moderators', async () => {
    const user = await h.createUser();
    await h.createItem({ id: 'mod-denied', ownerId: user.id });
    const res = await h.request('/v1/teams/mod-denied/moderate', {
      method: 'POST',
      body: { action: 'hide' },
      user,
    });
    expect(res.status).toBe(403);
  });

  it('hides an item, closes its reports, and writes the audit log', async () => {
    const owner = await h.createUser();
    const reporter = await h.createUser();
    await h.createItem({ id: 'mod-hide', ownerId: owner.id });
    await h.request('/v1/teams/mod-hide/reports', {
      method: 'POST',
      body: { reason: 'abusive', note: '' },
      user: reporter,
    });

    const res = await h.request('/v1/teams/mod-hide/moderate', {
      method: 'POST',
      body: { action: 'hide' },
      user: mod,
    });
    expect(res.status).toBe(200);
    expect((await h.request('/v1/teams/mod-hide')).status).toBe(404);

    const reports = await json<{
      reports: Array<{ item_id: string; status: string }>;
    }>(await h.request('/v1/admin/reports', { user: mod }));
    expect(
      reports.reports.filter((report) => report.item_id === 'mod-hide'),
    ).toEqual([expect.objectContaining({ status: 'resolved' })]);

    const log = await json<{
      actions: Array<{ action: string; target_id: string }>;
    }>(await h.request('/v1/admin/actions', { user: mod }));
    expect(log.actions).toContainEqual(
      expect.objectContaining({ action: 'hide', target_id: 'mod-hide' }),
    );
  });

  it('never resurrects a deleted item through a report action', async () => {
    const owner = await h.createUser();
    const reporter = await h.createUser();
    await h.createItem({
      id: 'mod-gone',
      ownerId: owner.id,
      status: 'deleted',
    });
    await h.db
      .prepare(
        "INSERT INTO reports (id, item_id, reporter_user_id, reason, note, status, created_at) VALUES ('rep-gone', 'mod-gone', ?, 'spam', '', 'open', 1)",
      )
      .bind(reporter.id)
      .run();

    const res = await h.request('/v1/admin/reports/rep-gone', {
      method: 'PATCH',
      body: { action: 'restore', note: '' },
      user: mod,
    });
    expect(res.status).toBe(200);
    const row = await h.db
      .prepare("SELECT status FROM community_items WHERE id = 'mod-gone'")
      .first<{ status: string }>();
    expect(row?.status).toBe('deleted');

    const again = await h.request('/v1/admin/reports/rep-gone', {
      method: 'PATCH',
      body: { action: 'hide', note: '' },
      user: mod,
    });
    expect(again.status).toBe(409);
  });

  it('closes open reports when the author deletes their own item', async () => {
    const owner = await h.createUser();
    const reporter = await h.createUser();
    await h.createItem({ id: 'self-delete', ownerId: owner.id });
    await h.request('/v1/teams/self-delete/reports', {
      method: 'POST',
      body: { reason: 'other', note: '' },
      user: reporter,
    });
    const res = await h.request('/v1/teams/self-delete', {
      method: 'DELETE',
      user: owner,
    });
    expect(res.status).toBe(200);
    const report = await h.db
      .prepare("SELECT status FROM reports WHERE item_id = 'self-delete'")
      .first<{ status: string }>();
    expect(report?.status).toBe('resolved');
  });
});

describe('suspensions', () => {
  it('blocks publishing, voting, and reporting but not self-service deletes', async () => {
    const owner = await h.createUser();
    const target = await h.createUser({ name: 'Target' });
    await h.createItem({ id: 'susp-own', ownerId: target.id });
    await h.createItem({ id: 'susp-other', ownerId: owner.id });

    const suspend = await h.request(`/v1/admin/users/${target.id}/suspend`, {
      method: 'POST',
      body: { duration: '7d', reason: 'spam', hideContent: true },
      user: mod,
    });
    expect(suspend.status).toBe(200);

    const hidden = await h.db
      .prepare("SELECT status FROM community_items WHERE id = 'susp-own'")
      .first<{ status: string }>();
    expect(hidden?.status).toBe('hidden');

    const publish = await h.request('/v1/teams', {
      method: 'POST',
      body: TEAM,
      user: target,
    });
    expect(publish.status).toBe(403);
    expect(await json(publish)).toMatchObject({
      code: 'suspended',
      error: expect.stringContaining('spam'),
    });
    expect(
      (
        await h.request('/v1/teams/susp-other/upvote', {
          method: 'PUT',
          user: target,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await h.request('/v1/teams/susp-other/reports', {
          method: 'POST',
          body: { reason: 'spam', note: '' },
          user: target,
        })
      ).status,
    ).toBe(403);

    // They can still see their own state and delete their own content...
    const me = await json<{ user: { suspension: { permanent: boolean } } }>(
      await h.request('/v1/auth/me', { user: target }),
    );
    expect(me.user.suspension.permanent).toBe(false);
    expect(
      (
        await h.request('/v1/teams/susp-own', {
          method: 'DELETE',
          user: target,
        })
      ).status,
    ).toBe(200);
    // ...but can't escape by deleting the account.
    expect(
      (await h.request('/v1/auth/me', { method: 'DELETE', user: target }))
        .status,
    ).toBe(403);

    const lifted = await h.request(`/v1/admin/users/${target.id}/unsuspend`, {
      method: 'POST',
      user: mod,
    });
    expect(lifted.status).toBe(200);
    const publishAgain = await h.request('/v1/teams', {
      method: 'POST',
      body: TEAM,
      user: target,
    });
    expect(publishAgain.status).toBe(201);
  });

  it('cannot suspend yourself or another moderator', async () => {
    const other = await h.createUser({ role: 'moderator' });
    const body = { duration: '1d', reason: '', hideContent: false };
    expect(
      (
        await h.request(`/v1/admin/users/${mod.id}/suspend`, {
          method: 'POST',
          body,
          user: mod,
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await h.request(`/v1/admin/users/${other.id}/suspend`, {
          method: 'POST',
          body,
          user: mod,
        })
      ).status,
    ).toBe(400);
  });

  it('only shows suspension details to moderators', async () => {
    const target = await h.createUser();
    await h.request(`/v1/admin/users/${target.id}/suspend`, {
      method: 'POST',
      body: { duration: 'permanent', reason: 'abuse', hideContent: false },
      user: mod,
    });
    const publicView = await json<{ user: Record<string, unknown> }>(
      await h.request(`/v1/users/${target.id}`),
    );
    expect(publicView.user.moderation).toBeUndefined();
    const modView = await json<{
      user: { moderation: { suspension: { permanent: boolean } } };
    }>(await h.request(`/v1/users/${target.id}`, { user: mod }));
    expect(modView.user.moderation.suspension.permanent).toBe(true);
  });
});

describe('moderator roles', () => {
  it('lets moderators promote and demote others, with an audit trail', async () => {
    const person = await h.createUser();
    const promote = await h.request(`/v1/admin/users/${person.id}/role`, {
      method: 'POST',
      body: { role: 'moderator' },
      user: mod,
    });
    expect(promote.status).toBe(200);
    const asMod = await json<{ user: { role: string } }>(
      await h.request('/v1/auth/me', { user: person }),
    );
    expect(asMod.user.role).toBe('moderator');

    const demote = await h.request(`/v1/admin/users/${person.id}/role`, {
      method: 'POST',
      body: { role: 'user' },
      user: mod,
    });
    expect(demote.status).toBe(200);
    // Takes effect immediately, on the same session.
    const asUser = await json<{ user: { role: string } }>(
      await h.request('/v1/auth/me', { user: person }),
    );
    expect(asUser.user.role).toBe('user');

    const log = await json<{ actions: Array<{ action: string }> }>(
      await h.request(`/v1/admin/actions?user=${person.id}`, { user: mod }),
    );
    expect(log.actions.map((action) => action.action).sort()).toEqual([
      'demote',
      'promote',
    ]);
  });

  it('refuses regular users, self changes, and demoting configured moderators', async () => {
    const regular = await h.createUser();
    const configured = await h.createUser({
      role: 'moderator',
      identity: { provider: 'github', providerUserId: '9001' },
    });
    expect(
      (
        await h.request(`/v1/admin/users/${regular.id}/role`, {
          method: 'POST',
          body: { role: 'moderator' },
          user: regular,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await h.request(`/v1/admin/users/${mod.id}/role`, {
          method: 'POST',
          body: { role: 'user' },
          user: mod,
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await h.request(`/v1/admin/users/${configured.id}/role`, {
          method: 'POST',
          body: { role: 'user' },
          user: mod,
        })
      ).status,
    ).toBe(400);
    const view = await json<{
      user: { moderation: { canChangeRole: boolean } };
    }>(await h.request(`/v1/users/${configured.id}`, { user: mod }));
    expect(view.user.moderation.canChangeRole).toBe(false);
  });
});

describe('site reference tier list', () => {
  it('follows the pinned list only while it is a published character list', async () => {
    const owner = await h.createUser();
    await h.createItem({
      id: 'ref-list',
      kind: 'tier_list',
      ownerId: owner.id,
    });
    await h.createItem({ id: 'ref-team', kind: 'team', ownerId: owner.id });

    expect(await json(await h.request('/v1/settings'))).toEqual({
      referenceTierListId: null,
    });
    expect(
      (
        await h.request('/v1/admin/settings/reference-tier-list', {
          method: 'PUT',
          body: { id: 'ref-team' },
          user: mod,
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await h.request('/v1/admin/settings/reference-tier-list', {
          method: 'PUT',
          body: { id: 'ref-list' },
          user: mod,
        })
      ).status,
    ).toBe(200);
    expect(await json(await h.request('/v1/settings'))).toEqual({
      referenceTierListId: 'ref-list',
    });

    await h.request('/v1/tier-lists/ref-list/moderate', {
      method: 'POST',
      body: { action: 'hide' },
      user: mod,
    });
    expect(await json(await h.request('/v1/settings'))).toEqual({
      referenceTierListId: null,
    });
  });
});

describe('account deletion', () => {
  it('unpublishes content and closes reports about it', async () => {
    const owner = await h.createUser();
    const reporter = await h.createUser();
    await h.createItem({ id: 'acct-item', ownerId: owner.id });
    await h.request('/v1/teams/acct-item/reports', {
      method: 'POST',
      body: { reason: 'spam', note: '' },
      user: reporter,
    });
    const res = await h.request('/v1/auth/me', {
      method: 'DELETE',
      user: owner,
    });
    expect(res.status).toBe(200);
    expect((await h.request('/v1/teams/acct-item')).status).toBe(404);
    const report = await h.db
      .prepare("SELECT status FROM reports WHERE item_id = 'acct-item'")
      .first<{ status: string }>();
    expect(report?.status).toBe('resolved');
  });
});

describe('retention', () => {
  it('removes old handled reports and keeps open or recent ones', async () => {
    const owner = await h.createUser();
    await h.createItem({ id: 'ret-item', ownerId: owner.id });
    // Reports are unique per (item, reporter), so each one needs its own reporter.
    const [oldReporter, newReporter, openReporter] = [
      await h.createUser(),
      await h.createUser(),
      await h.createUser(),
    ];
    const now = Math.floor(Date.now() / 1000);
    const insert = (
      id: string,
      reporter: TestUser,
      status: string,
      resolvedAt: number | null,
    ) =>
      h.db
        .prepare(
          "INSERT INTO reports (id, item_id, reporter_user_id, reason, note, status, created_at, resolved_at) VALUES (?, 'ret-item', ?, 'spam', '', ?, 1, ?)",
        )
        .bind(id, reporter.id, status, resolvedAt);
    await h.db.batch([
      insert('ret-old', oldReporter, 'resolved', now - 200 * 86400),
      insert('ret-new', newReporter, 'dismissed', now - 86400),
      insert('ret-open', openReporter, 'open', null),
    ]);

    await purgeExpired(h.db, now);
    const remaining = await h.db
      .prepare("SELECT id FROM reports WHERE item_id = 'ret-item' ORDER BY id")
      .all<{ id: string }>();
    expect(remaining.results.map((row) => row.id)).toEqual([
      'ret-new',
      'ret-open',
    ]);
  });
});

describe('robustness', () => {
  it('ignores a malformed cookie instead of failing the request', async () => {
    const res = await h.request('/v1/auth/me', {
      headers: { Cookie: 'dt_session=%; other=%E0%A4%A' },
    });
    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ user: null });
  });

  it('answers 400 for a malformed JSON body', async () => {
    const author = await h.createUser();
    const res = await h.request('/v1/teams', {
      method: 'POST',
      rawBody: '{not json',
      user: author,
    });
    expect(res.status).toBe(400);
    expect(await json(res)).toMatchObject({
      error: expect.stringContaining('JSON'),
    });
  });

  it('rate limits the unauthenticated OAuth start endpoint', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 70; i += 1) {
      const res = await h.request('/v1/auth/github/start');
      statuses.push(res.status);
    }
    expect(statuses[0]).toBe(302);
    expect(statuses).toContain(429);
    const stored = await h.db
      .prepare('SELECT COUNT(*) AS count FROM oauth_states')
      .first<{ count: number }>();
    expect(stored?.count).toBeLessThanOrEqual(60);
  });
});

describe('concurrent edits', () => {
  it('never answers 500 when two edits overlap, and keeps history consistent', async () => {
    const author = await h.createUser();
    const created = await h.request('/v1/teams', {
      method: 'POST',
      body: TEAM,
      user: author,
    });
    const { id } = await json<{ id: string }>(created);

    const responses = await Promise.all(
      ['First edit', 'Second edit'].map((name) =>
        h.request(`/v1/teams/${id}`, {
          method: 'PATCH',
          body: { ...TEAM, name },
          user: author,
        }),
      ),
    );
    const statuses = responses.map((res) => res.status);
    expect(statuses.every((status) => status === 200 || status === 409)).toBe(
      true,
    );
    expect(statuses).toContain(200);

    const succeeded = statuses.filter((status) => status === 200).length;
    const row = await h.db
      .prepare('SELECT revision FROM community_items WHERE id = ?')
      .bind(id)
      .first<{ revision: number }>();
    expect(row?.revision).toBe(1 + succeeded);
    const history = await h.db
      .prepare(
        'SELECT COUNT(*) AS count FROM community_revisions WHERE item_id = ?',
      )
      .bind(id)
      .first<{ count: number }>();
    expect(history?.count).toBe(succeeded);
  });
});

describe('review follow-ups', () => {
  it('refuses to promote someone who is suspended until it is lifted', async () => {
    const person = await h.createUser();
    await h.request(`/v1/admin/users/${person.id}/suspend`, {
      method: 'POST',
      body: { duration: '7d', reason: 'spam', hideContent: false },
      user: mod,
    });
    const refused = await h.request(`/v1/admin/users/${person.id}/role`, {
      method: 'POST',
      body: { role: 'moderator' },
      user: mod,
    });
    expect(refused.status).toBe(400);

    await h.request(`/v1/admin/users/${person.id}/unsuspend`, {
      method: 'POST',
      user: mod,
    });
    const allowed = await h.request(`/v1/admin/users/${person.id}/role`, {
      method: 'POST',
      body: { role: 'moderator' },
      user: mod,
    });
    expect(allowed.status).toBe(200);
  });

  it('settles reports about hidden items when suspending with hide-content', async () => {
    const owner = await h.createUser();
    const reporter = await h.createUser();
    await h.createItem({ id: 'susp-report', ownerId: owner.id });
    await h.request('/v1/teams/susp-report/reports', {
      method: 'POST',
      body: { reason: 'spam', note: '' },
      user: reporter,
    });
    await h.request(`/v1/admin/users/${owner.id}/suspend`, {
      method: 'POST',
      body: { duration: '1d', reason: '', hideContent: true },
      user: mod,
    });
    const report = await h.db
      .prepare("SELECT status FROM reports WHERE item_id = 'susp-report'")
      .first<{ status: string }>();
    expect(report?.status).toBe('resolved');
  });

  it('shows a re-filed report as open with no leftover resolution', async () => {
    const owner = await h.createUser();
    const reporter = await h.createUser();
    await h.createItem({ id: 'refile', ownerId: owner.id });
    await h.request('/v1/teams/refile/reports', {
      method: 'POST',
      body: { reason: 'spam', note: 'first' },
      user: reporter,
    });
    const first = await h.db
      .prepare("SELECT id FROM reports WHERE item_id = 'refile'")
      .first<{ id: string }>();
    await h.request(`/v1/admin/reports/${first?.id}`, {
      method: 'PATCH',
      body: { action: 'dismiss', note: 'looks fine' },
      user: mod,
    });

    await h.request('/v1/teams/refile/reports', {
      method: 'POST',
      body: { reason: 'abusive', note: 'again' },
      user: reporter,
    });
    const row = await h.db
      .prepare(
        "SELECT status, resolution_note, resolved_by_user_id, resolved_at FROM reports WHERE item_id = 'refile'",
      )
      .first<Record<string, unknown>>();
    expect(row).toEqual({
      status: 'open',
      resolution_note: '',
      resolved_by_user_id: null,
      resolved_at: null,
    });
  });

  it('labels audit-log entries for reports and the site reference', async () => {
    const owner = await h.createUser();
    const reporter = await h.createUser();
    await h.createItem({
      id: 'label-item',
      kind: 'tier_list',
      ownerId: owner.id,
      title: 'Label Test List',
    });
    await h.request('/v1/tier-lists/label-item/reports', {
      method: 'POST',
      body: { reason: 'spam', note: '' },
      user: reporter,
    });
    const report = await h.db
      .prepare("SELECT id FROM reports WHERE item_id = 'label-item'")
      .first<{ id: string }>();
    await h.request(`/v1/admin/reports/${report?.id}`, {
      method: 'PATCH',
      body: { action: 'dismiss', note: '' },
      user: mod,
    });
    await h.request('/v1/admin/settings/reference-tier-list', {
      method: 'PUT',
      body: { id: 'label-item' },
      user: mod,
    });

    const log = await json<{
      actions: Array<{ action: string; target_label: string | null }>;
    }>(await h.request('/v1/admin/actions', { user: mod }));
    // Other tests write the same kinds of entries in the same second, so check
    // that the entry exists rather than which one the log happens to list first.
    const labelsFor = (action: string) =>
      log.actions
        .filter((entry) => entry.action === action)
        .map((entry) => entry.target_label);
    expect(labelsFor('dismiss-report')).toContain('Label Test List');
    expect(labelsFor('set-reference')).toContain('Label Test List');
  });
});
