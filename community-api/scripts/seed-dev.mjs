// Seeds the LOCAL dev D1 database with dummy community data for manual QA.
//
//   node scripts/seed-dev.mjs           reset seed rows, then insert fresh ones
//   node scripts/seed-dev.mjs --reset   only remove seed rows
//
// Every row it creates has an id starting with "seed-", so real data is never
// touched. It only ever runs wrangler with --local and refuses "remote" args.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.argv.slice(2).some((arg) => /remote/i.test(arg))) {
  console.error('This script only seeds the local database.');
  process.exit(1);
}

const apiDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(apiDir, '..');
const DB_NAME = 'dragon-traveler-community';
const RESET_ONLY = process.argv.includes('--reset');
const DAY = 86400;
const NOW = Math.floor(Date.now() / 1000);

function wrangler(args) {
  return execFileSync(
    process.execPath,
    [join(apiDir, 'node_modules/wrangler/bin/wrangler.js'), ...args],
    { cwd: apiDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

function d1(extra) {
  return wrangler(['d1', 'execute', DB_NAME, '--local', ...extra]);
}

function findRealUserId() {
  const out = d1([
    '--json',
    '--command',
    `SELECT u.id FROM users u WHERE u.id NOT LIKE 'seed-%' AND u.deleted_at IS NULL
       AND EXISTS (SELECT 1 FROM oauth_identities oi WHERE oi.user_id = u.id)
     ORDER BY u.created_at DESC LIMIT 1`,
  ]);
  const rows = JSON.parse(out.slice(out.search(/^\[/m)))[0].results;
  return rows[0]?.id ?? null;
}

function dataDir() {
  let dir = '../dragon-traveler-data/data';
  try {
    const env = readFileSync(join(repoRoot, '.env.local'), 'utf8');
    const match = env.match(/^DATA_DIR=(.+)$/m);
    if (match) dir = match[1].trim();
  } catch {
    // fall back to the sibling-clone default
  }
  return resolve(repoRoot, dir);
}

function loadCatalog(name) {
  return JSON.parse(readFileSync(join(dataDir(), 'enUS', name), 'utf8'));
}

// --- deterministic randomness so re-runs produce the same data ---
let seedState = 0x5eed1234;
function rng() {
  seedState = (seedState + 0x6d2b79f5) | 0;
  let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = (list) => list[Math.floor(rng() * list.length)];
function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sql(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

function insert(table, row) {
  const cols = Object.keys(row);
  return `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((c) => sql(row[c])).join(', ')});`;
}

function slugify(value) {
  return (
    value
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'item'
  );
}

const RESET_SQL = [
  "DELETE FROM moderation_actions WHERE moderator_user_id LIKE 'seed-%';",
  "DELETE FROM site_settings WHERE value LIKE 'seed-%';",
  "DELETE FROM reports WHERE item_id LIKE 'seed-%' OR reporter_user_id LIKE 'seed-%';",
  "DELETE FROM votes WHERE item_id LIKE 'seed-%' OR user_id LIKE 'seed-%';",
  "DELETE FROM community_revisions WHERE item_id LIKE 'seed-%' OR editor_user_id LIKE 'seed-%';",
  "DELETE FROM community_items WHERE id LIKE 'seed-%' OR owner_user_id LIKE 'seed-%';",
  "DELETE FROM users WHERE id LIKE 'seed-%';",
];

function runSql(statements, label) {
  const dir = join(apiDir, '.wrangler');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `seed-dev-${label}.sql`);
  writeFileSync(file, statements.join('\n') + '\n');
  d1(['--file', file]);
}

if (RESET_ONLY) {
  runSql(RESET_SQL, 'reset');
  console.log('Removed all seed-* rows from the local database.');
  process.exit(0);
}

// --- catalog ---
const characters = loadCatalog('characters.json');
const nobles = loadCatalog('noble-phantasm.json');
const wyrmspells = loadCatalog('wyrmspells.json');
const QUALITY_RANK = { 'SSR EX': 0, 'SSR+': 1, SSR: 2, SR: 3, R: 4, N: 5 };
const spellsByType = {};
for (const spell of wyrmspells)
  (spellsByType[spell.type] ??= []).push(spell.slug);

// --- users ---
const realUserId = findRealUserId();
const authors = [
  ['seed-aria', 'Aria Stormcaller'],
  ['seed-bram', 'Bram Ironfist'],
  ['seed-cyra', 'Cyra Nightwhisper'],
  ['seed-dorian', 'Dorian Ashveil'],
  ['seed-elowen', 'Elowen Brightleaf'],
  ['seed-fenn', 'Fenn the Frugal'],
];
const voterNames = [
  'Kestrel',
  'Marrow',
  'Nyx',
  'Orin',
  'Pip',
  'Quill',
  'Rook',
  'Sable',
];
const voters = voterNames.map((name, i) => [
  `seed-voter-${i + 1}`,
  `Player ${name}`,
]);
const MOD_ID = 'seed-mod';
const users = [
  ...authors.map(([id, name]) => ({ id, name, role: 'user' })),
  ...voters.map(([id, name]) => ({ id, name, role: 'user' })),
  { id: MOD_ID, name: 'Mod Mira', role: 'moderator' },
];
const userName = Object.fromEntries(users.map((u) => [u.id, u.name]));
const real = realUserId ?? 'seed-aria';
const voterId = (n) => `seed-voter-${n}`;

// --- items ---
const items = [];

function timestamps(hasRevisions) {
  const created = NOW - between(3, 60) * DAY - between(0, DAY - 1);
  const updated = hasRevisions
    ? Math.min(NOW - 3600, created + between(1, 20) * DAY)
    : created;
  return { created, updated };
}

const TEAM_SPECS = [
  [
    'Wild Spirit Sustain',
    'wild_spirit',
    'PvE',
    'seed-aria',
    'Rock-solid healing loop for long PvE stages.',
    2,
  ],
  [
    'Sanctum Glory Bulwark',
    'sanctum_glory',
    'PvE',
    'seed-bram',
    'Frontline wall that outlasts most stage bosses.',
    0,
  ],
  [
    'Arcane Burst Core',
    'arcane_wisdom',
    'PvP',
    'seed-cyra',
    'Front-loaded burst for arena openers.',
    1,
  ],
  [
    'Elemental Echo Chain',
    'elemental_echo',
    'Boss',
    'seed-aria',
    'Chained elemental procs tuned for boss windows.',
    0,
  ],
  [
    'Otherworld Rush',
    'otherworld_return',
    'PvP',
    real,
    'Fast tempo team - my personal arena main.',
    2,
  ],
  [
    'Illusion Veil Control',
    'illusion_veil',
    'PvP',
    'seed-dorian',
    'Disruption-heavy control with a late-game payoff.',
    0,
  ],
  [
    'Beginner Friendly Core',
    'wild_spirit',
    'All',
    'seed-elowen',
    'Easy to build and forgiving. Great first team.',
    1,
  ],
  [
    'Boss Rush Nuke',
    'arcane_wisdom',
    'Boss',
    'seed-bram',
    'All-in damage for boss rush weeks.',
    0,
  ],
  [
    'Budget Guardian Wall',
    'sanctum_glory',
    'All',
    real,
    'Cheap, sturdy, and no SSR EX required.',
    1,
  ],
  [
    'Frost & Flame Combo',
    'elemental_echo',
    'PvE',
    'seed-fenn',
    'Two-element combo that scales with gear.',
    0,
  ],
  [
    'Dark Horse Ambush',
    'illusion_veil',
    'All',
    'seed-cyra',
    'Surprise composition - still being refined.',
    0,
    'hidden',
  ],
  [
    'Spam Team Please Ignore',
    'wild_spirit',
    'All',
    'seed-fenn',
    'buy now!!! best team ever!!!',
    0,
    'hidden',
  ],
];

// Bulk filler so browse pages span several pages (server page size is 24).
const BULK_TEAM_COUNT = 45;
const BULK_ADJECTIVES = [
  'Swift',
  'Iron',
  'Radiant',
  'Shadow',
  'Crimson',
  'Verdant',
  'Frozen',
  'Storm',
  'Ancient',
  'Golden',
];
const CONTENT_TYPES = ['All', 'PvP', 'PvE', 'Boss'];
const FACTIONS = [
  'elemental_echo',
  'wild_spirit',
  'arcane_wisdom',
  'sanctum_glory',
  'otherworld_return',
  'illusion_veil',
];
const BULK_OWNERS = [...authors.map((a) => a[0]), real];
for (let n = 1; n <= BULK_TEAM_COUNT; n++) {
  TEAM_SPECS.push([
    `${pick(BULK_ADJECTIVES)} ${pick(['Vanguard', 'Squad', 'Legion', 'Trio', 'Core'])} #${n}`,
    pick(FACTIONS),
    pick(CONTENT_TYPES),
    pick(BULK_OWNERS),
    `Auto-generated team ${n} for pagination testing.`,
    between(0, 2),
  ]);
}

TEAM_SPECS.forEach(
  ([name, faction, contentType, owner, description, revs, status], i) => {
    const pool = characters.filter((c) => c.factions?.includes(faction));
    const sorted = shuffle(pool).sort(
      (a, b) => (QUALITY_RANK[a.quality] ?? 9) - (QUALITY_RANK[b.quality] ?? 9),
    );
    const size = Math.min(sorted.length, between(4, 6));
    const chosen = sorted.slice(0, size);
    const cells = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8])
      .slice(0, size)
      .sort((a, b) => a - b);
    const order = shuffle(Array.from({ length: size }, (_, k) => k + 1));
    const members = chosen.map((c, k) => ({
      character_slug: c.slug,
      character_quality: c.quality,
      overdrive_order: order[k],
      ...(k < 2
        ? {
            note:
              k === 0
                ? 'Cast first for the opener.'
                : 'Hold until the second wave.',
          }
        : {}),
      position: { row: Math.floor(cells[k] / 3), col: cells[k] % 3 },
    }));
    const benchPool = characters.filter((c) => !chosen.includes(c));
    const bench = shuffle(benchPool)
      .slice(0, between(0, 3))
      .map((c) => ({
        character_slug: c.slug,
        character_quality: c.quality,
        note: 'Swap in if the main unit is missing.',
      }));
    const withSpells = i % 3 !== 2;
    const payload = {
      name,
      content_type: contentType,
      description,
      faction,
      members,
      ...(bench.length ? { bench } : {}),
      ...(withSpells
        ? {
            wyrmspells: {
              breach: pick(spellsByType.Breach),
              refuge: pick(spellsByType.Refuge),
              wildcry: pick(spellsByType.Wildcry),
              dragons_call: pick(spellsByType["Dragon's Call"]),
            },
          }
        : {}),
    };
    items.push({
      id: `seed-team-${String(i + 1).padStart(2, '0')}`,
      kind: 'team',
      owner,
      status: status ?? 'published',
      revs,
      facet: faction,
      payload,
    });
  },
);

const CUSTOM_TIERS = {
  arena: [
    { name: 'S+' },
    { name: 'S' },
    { name: 'A' },
    { name: 'B' },
    { name: 'C' },
  ],
  boss: [
    { name: 'Must Have', note: 'Build these first.' },
    { name: 'Strong' },
    { name: 'Situational', note: 'Great in the right fight.' },
    { name: 'Skip' },
  ],
  support: [{ name: 'S' }, { name: 'A' }, { name: 'B' }, { name: 'C' }],
};
const DEFAULT_TIERS = ['S+', 'S', 'A', 'B', 'C', 'D'];

const TIER_SPECS = [
  [
    'Season PvE Meta Tier List',
    'character',
    'PvE',
    'seed-aria',
    'What is actually clearing content this season.',
    null,
    45,
    1,
  ],
  [
    'Arena Tier List',
    'character',
    'PvP',
    'seed-bram',
    'Arena rankings after the latest balance patch.',
    'arena',
    40,
    0,
  ],
  [
    'Boss Rush Picks',
    'character',
    'Boss',
    'seed-cyra',
    'Who to invest in for boss rush.',
    'boss',
    32,
    2,
  ],
  [
    'Best Free-to-Play Units',
    'character',
    'All',
    'seed-fenn',
    'Value picks that will not cost you a fortune.',
    null,
    30,
    0,
  ],
  [
    'Support & Healer Ranking',
    'character',
    'All',
    'seed-elowen',
    'Ranking every support and healer.',
    'support',
    25,
    0,
  ],
  [
    'Noble Phantasm Priority',
    'noble_phantasm',
    'All',
    'seed-dorian',
    'Which noble phantasms deserve your resources first.',
    'support',
    30,
    1,
  ],
  [
    'Endgame Noble Phantasms',
    'noble_phantasm',
    'PvE',
    real,
    'My endgame noble phantasm ranking.',
    null,
    20,
    2,
  ],
  [
    'Hot Takes (Please Report)',
    'character',
    'All',
    'seed-dorian',
    'these rankings are objectively correct and you are all idiots',
    null,
    20,
    0,
    'hidden',
  ],
];

// Bulk filler so browse pages span several pages (server page size is 24).
const BULK_TIER_COUNT = 40;
for (let n = 1; n <= BULK_TIER_COUNT; n++) {
  const entityType = n % 5 === 0 ? 'noble_phantasm' : 'character';
  TIER_SPECS.push([
    `${pick(BULK_ADJECTIVES)} ${entityType === 'character' ? 'Character' : 'Noble Phantasm'} Ranking #${n}`,
    entityType,
    pick(CONTENT_TYPES),
    pick(BULK_OWNERS),
    `Auto-generated tier list ${n} for pagination testing.`,
    pick([null, null, 'arena', 'boss', 'support']),
    between(10, 30),
    between(0, 2),
  ]);
}

TIER_SPECS.forEach(
  (
    [
      name,
      entityType,
      contentType,
      owner,
      description,
      customKey,
      count,
      revs,
      status,
    ],
    i,
  ) => {
    const tierDefs = customKey ? CUSTOM_TIERS[customKey] : null;
    const tierNames = tierDefs ? tierDefs.map((t) => t.name) : DEFAULT_TIERS;
    const source =
      entityType === 'character' ? shuffle(characters) : shuffle(nobles);
    const entries = source
      .slice(0, Math.min(count, source.length))
      .map((entity, k) => {
        const tier =
          k < tierNames.length
            ? tierNames[k]
            : tierNames[Math.floor(Math.sqrt(rng()) * tierNames.length)];
        const note =
          rng() < 0.12 ? 'Excels with the right supports.' : undefined;
        return entityType === 'character'
          ? {
              character_slug: entity.slug,
              character_quality: entity.quality,
              tier,
              ...(note ? { note } : {}),
            }
          : {
              noble_phantasm_slug: entity.slug,
              tier,
              ...(note ? { note } : {}),
            };
      });
    items.push({
      id: `seed-tier-${String(i + 1).padStart(2, '0')}`,
      kind: 'tier_list',
      owner,
      status: status ?? 'published',
      revs,
      facet: entityType,
      payload: {
        name,
        entity_type: entityType,
        content_type: contentType,
        description,
        ...(tierDefs ? { tiers: tierDefs } : {}),
        entries,
      },
    });
  },
);

// Stress case for the card previews: a full team with the maximum 12 subs.
const stressTeam = items.find((item) => item.id === 'seed-team-01');
if (stressTeam) {
  const used = new Set(stressTeam.payload.members.map((m) => m.character_slug));
  stressTeam.payload.name = 'Max Subs Stress Test';
  stressTeam.payload.description =
    'Six mains and twelve subs, for testing overflow.';
  stressTeam.payload.bench = shuffle(
    characters.filter((c) => !used.has(c.slug)),
  )
    .slice(0, 12)
    .map((c) => ({
      character_slug: c.slug,
      character_quality: c.quality,
      note: 'Swap in if the main unit is missing.',
    }));
}

// --- build SQL ---
const statements = [...RESET_SQL];
for (const user of users) {
  statements.push(
    insert('users', {
      id: user.id,
      display_name: user.name,
      avatar_url: null,
      role: user.role,
      created_at: NOW - 90 * DAY,
      updated_at: NOW - 90 * DAY,
    }),
  );
}

const itemMeta = new Map();
for (const item of items) {
  const ownerName = userName[item.owner] ?? 'You';
  const { created, updated } = timestamps(item.revs > 0);
  itemMeta.set(item.id, { created, updated });
  const stored = {
    ...item.payload,
    slug: slugify(item.payload.name),
    author: ownerName,
    last_updated: updated,
  };
  statements.push(
    insert('community_items', {
      id: item.id,
      kind: item.kind,
      slug: stored.slug,
      title: item.payload.name,
      owner_user_id: item.owner,
      content_type: item.payload.content_type,
      facet: item.facet,
      payload_json: JSON.stringify(stored),
      status: item.status,
      score: 0,
      revision: item.revs + 1,
      created_at: created,
      updated_at: updated,
    }),
  );
  for (let r = 1; r <= item.revs; r++) {
    const older = {
      ...stored,
      description: `Draft v${r}: ${item.payload.description}`,
      last_updated: created + r * DAY,
    };
    statements.push(
      insert('community_revisions', {
        item_id: item.id,
        revision: r,
        editor_user_id: item.owner,
        payload_json: JSON.stringify(older),
        created_at: Math.min(updated, created + r * DAY),
      }),
    );
  }
}

// votes (score is the denormalized vote count)
const allVoterIds = [...authors.map((a) => a[0]), ...voters.map((v) => v[0])];
const scoreByItem = new Map();
for (const item of items) {
  const { created } = itemMeta.get(item.id);
  const pool = allVoterIds.filter((id) => id !== item.owner);
  const voterIds = shuffle(pool).slice(0, between(0, pool.length));
  if (realUserId && item.owner !== realUserId && rng() < 0.4)
    voterIds.push(realUserId);
  scoreByItem.set(item.id, voterIds.length);
  for (const userId of voterIds) {
    statements.push(
      insert('votes', {
        item_id: item.id,
        user_id: userId,
        created_at: Math.min(NOW - 60, created + between(1, 30) * 3600),
      }),
    );
  }
  statements.push(
    `UPDATE community_items SET score = ${scoreByItem.get(item.id)} WHERE id = ${sql(item.id)};`,
  );
}

// reports: [item, reporter, reason, note, status, resolutionNote, resolvedAgoSeconds]
const reporterForYou = realUserId ?? voterId(7);
const REPORTS = [
  [
    'seed-team-04',
    voterId(1),
    'broken',
    'Member positions overlap in-game formation.',
    'open',
  ],
  [
    'seed-team-08',
    voterId(2),
    'other',
    'Near-duplicate of another team with tiny changes.',
    'open',
  ],
  ['seed-tier-03', voterId(3), 'spam', '', 'open'],
  [
    'seed-tier-05',
    reporterForYou,
    'broken',
    'A couple of entries look mis-tiered.',
    'open',
  ],
  [
    'seed-team-12',
    voterId(4),
    'spam',
    'Obvious advertising.',
    'resolved',
    'Hidden: spam.',
    2 * DAY,
  ],
  [
    'seed-team-11',
    voterId(6),
    'abusive',
    'Description is hostile toward other players.',
    'resolved',
    'Hidden while the author revises.',
    4 * DAY,
  ],
  [
    'seed-tier-08',
    reporterForYou,
    'abusive',
    'Insulting descriptions.',
    'resolved',
    'Hidden pending author edit.',
    DAY,
  ],
  [
    'seed-team-02',
    voterId(5),
    'broken',
    'Seems off.',
    'dismissed',
    'Checked in-game; the composition is valid.',
    3 * DAY,
  ],
  [
    'seed-tier-01',
    reporterForYou,
    'spam',
    'Way too many entries.',
    'dismissed',
    'Not spam - long lists are allowed.',
    5 * 3600,
  ],
];
REPORTS.forEach(
  ([itemId, reporter, reason, note, status, resolutionNote, ago], i) => {
    const resolvedAt = status === 'open' ? null : NOW - ago;
    const created = (resolvedAt ?? NOW - 2 * DAY) - between(1, 2) * DAY;
    statements.push(
      insert('reports', {
        id: `seed-report-${i + 1}`,
        item_id: itemId,
        reporter_user_id: reporter,
        reason,
        note,
        status,
        resolution_note: resolutionNote ?? '',
        resolved_by_user_id: status === 'open' ? null : MOD_ID,
        created_at: created,
        resolved_at: resolvedAt,
      }),
    );
  },
);

// a suspended user plus a few audit-log rows so those screens have content
statements.push(
  `UPDATE users SET suspended_until = ${NOW + 3 * DAY}, suspension_reason = 'Repeated spam publications' WHERE id = 'seed-voter-8';`,
);
[
  ['suspend-7d', 'user', 'seed-voter-8', 'Repeated spam publications', 4 * DAY],
  ['hide', 'team', 'seed-team-11', '', 3 * DAY],
  ['delete', 'team', 'seed-team-12', 'Spam', 2 * DAY],
].forEach(([action, targetKind, targetId, note, ago], i) => {
  statements.push(
    insert('moderation_actions', {
      id: `seed-action-${i + 1}`,
      moderator_user_id: MOD_ID,
      action,
      target_kind: targetKind,
      target_id: targetId,
      note,
      created_at: NOW - ago,
    }),
  );
});

// pin a seeded character tier list as the site's default reference
statements.push(
  insert('site_settings', {
    key: 'reference_tier_list_id',
    value: 'seed-tier-01',
    updated_at: NOW,
    updated_by_user_id: MOD_ID,
  }),
);

// make the resolved reports you filed show up as "unread" in the header badge
if (realUserId)
  statements.push(
    `UPDATE users SET reports_seen_at = 0 WHERE id = ${sql(realUserId)};`,
  );

runSql(statements, 'insert');

const teamCount = items.filter((i) => i.kind === 'team').length;
console.log(
  `Seeded ${users.length} users, ${teamCount} teams, ${items.length - teamCount} tier lists, ` +
    `${REPORTS.length} reports.`,
);
console.log(
  realUserId
    ? `Some items and reports belong to your real local account (${realUserId}).`
    : 'No signed-in local account found; items are owned by seed users only.',
);
console.log('Remove it all again with: node scripts/seed-dev.mjs --reset');
