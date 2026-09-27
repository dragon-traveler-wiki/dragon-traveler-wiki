import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRouteHtml,
  cleanGameText,
  findFirstAvailableHowlkinMember,
  getOracleScrollReference,
  hasAsset,
  normalizeTypeKey,
} from '../../scripts/generate-route-pages.mjs';

const BASE_HTML = `<!doctype html>
<html>
  <head>
    <title>Dragon Traveler Wiki</title>
    <meta name="description" content="Default description" />
    <meta property="og:title" content="Dragon Traveler Wiki" />
    <meta property="og:description" content="Default description" />
    <meta property="og:url" content="https://dtwiki.org" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Dragon Traveler Wiki" />
    <meta property="og:image" content="https://dtwiki.org/default.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Default" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Dragon Traveler Wiki" />
    <meta name="twitter:description" content="Default description" />
    <meta name="twitter:image" content="https://dtwiki.org/default.jpg" />
    <meta name="twitter:image:alt" content="Default" />
  </head>
</html>`;

test('wide entity embeds do not claim dimensions that vary by asset', () => {
  const image = {
    url: 'https://dtwiki.org/assets/character/athena/scene.png',
    alt: 'Athena default scene illustration',
    type: 'image/png',
    cardType: 'summary_large_image',
  };
  const html = buildRouteHtml(
    BASE_HTML,
    '/characters/athena',
    { title: 'Athena', description: 'Frontline Guardian.' },
    'Dragon Traveler Wiki',
    'https://dtwiki.org',
    image,
  );

  assert.match(html, /<title>Athena \| Dragon Traveler Wiki<\/title>/);
  assert.match(
    html,
    /property="og:image" content="https:\/\/dtwiki\.org\/assets\/character\/athena\/scene\.png"/,
  );
  assert.match(html, /property="og:image:secure_url"/);
  assert.doesNotMatch(html, /property="og:image:width"/);
  assert.doesNotMatch(html, /property="og:image:height"/);
  assert.match(html, /property="og:image:type" content="image\/png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(
    html,
    /name="twitter:image:alt" content="Athena default scene illustration"/,
  );
});

test('square entity embeds use summary cards without inaccurate dimensions', () => {
  const html = buildRouteHtml(
    BASE_HTML,
    '/artifacts/example',
    { title: 'Example', description: 'Example artifact.' },
    'Dragon Traveler Wiki',
    'https://dtwiki.org',
    {
      url: 'https://dtwiki.org/assets/artifacts/example/artifact.png',
      alt: 'Example artifact',
      type: 'image/png',
      cardType: 'summary',
    },
  );

  assert.match(html, /name="twitter:card" content="summary"/);
  assert.doesNotMatch(html, /property="og:image:width"/);
  assert.doesNotMatch(html, /property="og:image:height"/);
});

test('embed text and asset keys are normalized for game data', () => {
  assert.equal(normalizeTypeKey("Dragon's Call"), 'dragons_call');
  assert.equal(
    cleanGameText('Applies {stun} after [Martial Verdict].'),
    'Applies Stun after Martial Verdict.',
  );
});

test('routes without a related image omit image metadata', () => {
  const html = buildRouteHtml(
    BASE_HTML,
    '/gear',
    { title: 'Gear', description: 'Browse gear.' },
    'Dragon Traveler Wiki',
    'https://dtwiki.org',
    null,
  );

  assert.doesNotMatch(html, /property="og:image/);
  assert.doesNotMatch(html, /name="twitter:image/);
  assert.match(html, /name="twitter:card" content="summary"/);
});

test('R2-only assets are recognized through the asset manifest', () => {
  const assetPath = 'character/tamamo_no_mae_ssr_plus/skins/default/scene.png';

  assert.equal(
    hasAsset(assetPath, new Set([assetPath]), 'missing-assets'),
    true,
  );
  assert.equal(hasAsset(assetPath, new Set(), 'missing-assets'), false);
});

test('Howlkin embeds select the first member with an available icon', () => {
  const qualityBySlug = new Map([
    ['missing_member', 'sr'],
    ['available_member', 'ssr'],
  ]);

  assert.equal(
    findFirstAvailableHowlkinMember(
      ['missing_member', 'available_member'],
      qualityBySlug,
      (assetPath) => assetPath === 'howlkin/ssr/available_member.png',
    ),
    'available_member',
  );
});

test('Oracle Scroll references use their explicit name and slug', () => {
  assert.deepEqual(
    getOracleScrollReference({
      name: "Cleopatra's Leisure Time",
      slug: 'cleopatras_leisure_time',
    }),
    {
      name: "Cleopatra's Leisure Time",
      slug: 'cleopatras_leisure_time',
    },
  );
  assert.equal(getOracleScrollReference('Cleopatra'), null);
});
