import type {
  CharacterClass,
  CharacterSkin,
} from '@/features/characters/types';
import type { GearType } from '@/features/wiki/gear/types';
import type { RelicType } from '@/features/wiki/relics/types';
import type { StatusEffectType } from '@/features/wiki/status-effects/types';
import type { WyrmspellType } from '@/features/wiki/wyrmspells/types';
import type { FactionSlug } from '@/types/faction';
import type { Quality } from '@/types/quality';
import type { ResourceCategory } from '@/features/wiki/resources/types';
import { normalizeKey, normalizeQualityKey } from '@/utils/asset-utils';

const rawBase: string =
  import.meta.env.VITE_ASSETS_BASE ?? import.meta.env.BASE_URL;
const BASE = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

export function getAssetUrl(path: string): string {
  return `${BASE}${path.replace(/^\/+/, '')}`;
}

export function getVersionedAssetUrl(
  path: string,
  entry?: { sha256: string },
): string {
  const url = getAssetUrl(path);
  if (!entry) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${entry.sha256.slice(0, 12)}`;
}

export function getCharacterModelAssetPath(
  characterSlug: string,
  skinSlug: string,
  filename = 'model.json',
): string {
  return `character/${characterSlug}/skins/${skinSlug}/model/${filename}`;
}

// ── Class ────────────────────────────────────────────────────────────────────

export const CLASS_ICON_MAP: Record<CharacterClass, string> = {
  guardian: `${BASE}class/guardian.png`,
  priest: `${BASE}class/priest.png`,
  assassin: `${BASE}class/assassin.png`,
  warrior: `${BASE}class/warrior.png`,
  archer: `${BASE}class/archer.png`,
  mage: `${BASE}class/mage.png`,
};

// ── Faction ──────────────────────────────────────────────────────────────────

export const FACTION_ICON_MAP: Record<FactionSlug, string> = {
  elemental_echo: `${BASE}faction/elemental_echo.png`,
  wild_spirit: `${BASE}faction/wild_spirit.png`,
  arcane_wisdom: `${BASE}faction/arcane_wisdom.png`,
  sanctum_glory: `${BASE}faction/sanctum_glory.png`,
  otherworld_return: `${BASE}faction/otherworld_return.png`,
  illusion_veil: `${BASE}faction/illusion_veil.png`,
};

// ── Quality ──────────────────────────────────────────────────────────────────

export const QUALITY_ICON_MAP: Record<Quality, string> = {
  'UR+': `${BASE}quality/ur_plus.png`,
  UR: `${BASE}quality/ur.png`,
  'SSR EX': `${BASE}quality/ssr_ex.png`,
  'SSR+': `${BASE}quality/ssr_plus.png`,
  SSR: `${BASE}quality/ssr.png`,
  SR: `${BASE}quality/sr.png`,
  R: `${BASE}quality/r.png`,
  N: `${BASE}quality/n.png`,
  C: `${BASE}quality/c.png`,
};

// ── Wyrms ────────────────────────────────────────────────────────────────────

export function getWyrmIcon(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}wyrm/${normalizeKey(name)}/avatar.png`;
}

export function getWyrmPortrait(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}wyrm/${normalizeKey(name)}/portrait.png`;
}

export function getWyrmIllustration(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}wyrm/${normalizeKey(name)}/illustration.png`;
}

export function getWyrmSkillIcon(
  wyrmName: string,
  skillName: string,
): string | undefined {
  if (!wyrmName || !skillName) return undefined;
  return `${BASE}wyrm/${normalizeKey(wyrmName)}/skills/${normalizeKey(skillName)}.png`;
}

export const FACTION_WYRM_MAP: Record<FactionSlug, string> = {
  elemental_echo: `${BASE}wyrm/blazing_dragon/portrait.png`,
  wild_spirit: `${BASE}wyrm/jade_dragon/portrait.png`,
  arcane_wisdom: `${BASE}wyrm/nymph_dragon/portrait.png`,
  sanctum_glory: `${BASE}wyrm/heavenglow_dragon/portrait.png`,
  otherworld_return: `${BASE}wyrm/nethercrypt_dragon/portrait.png`,
  illusion_veil: `${BASE}wyrm/shadowbane_dragon/portrait.png`,
};

// ── Artifacts ────────────────────────────────────────────────────────────────

export function getArtifactIcon(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}artifacts/${normalizeKey(name)}/artifact.png`;
}

export function getTreasureIcon(
  artifactName: string,
  treasureName: string,
): string | undefined {
  if (!artifactName || !treasureName) return undefined;
  return `${BASE}artifacts/${normalizeKey(artifactName)}/treasures/${normalizeKey(treasureName)}.png`;
}

// ── Gear ─────────────────────────────────────────────────────────────────────

export const GEAR_TYPE_ICON_MAP: Record<GearType, string> = {
  Headgear: `${BASE}gear/icons/headgear.png`,
  Chestplate: `${BASE}gear/icons/chestplate.png`,
  Bracers: `${BASE}gear/icons/bracers.png`,
  Boots: `${BASE}gear/icons/boots.png`,
  Weapon: `${BASE}gear/icons/weapon.png`,
  Accessory: `${BASE}gear/icons/accessory.png`,
};

export const RELIC_TYPE_ICON_MAP: Record<RelicType, string> = {
  'Sanctuary Relic': `${BASE}relic/icons/sanctuary_relic.png`,
  'Legendary Ritual Vessel': `${BASE}relic/icons/legendary_ritual_vessel.png`,
  'Fated Relic': `${BASE}relic/icons/fated_relic.png`,
  'Symbol of Theocracy': `${BASE}relic/icons/symbol_of_theocracy.png`,
};

export function getGearIcon(type: string, name: string): string | undefined {
  if (!type || !name) return undefined;
  return `${BASE}gear/${normalizeKey(type)}/${normalizeKey(name)}.png`;
}

// ── Howlkin ──────────────────────────────────────────────────────────────────

export function getHowlkinIcon(
  name: string,
  quality: string,
): string | undefined {
  if (!name || !quality) return undefined;
  return `${BASE}howlkin/${normalizeQualityKey(quality)}/${normalizeKey(name)}.png`;
}

// ── Noble Phantasm ───────────────────────────────────────────────────────────

export function getNoblePhantasmIcon(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}noble_phantasm/${normalizeKey(name)}.png`;
}

// ── Relic ────────────────────────────────────────────────────────────────────

export function getRelicIcon(
  name: string,
  quality: string,
): string | undefined {
  if (!name || !quality) return undefined;
  return `${BASE}relic/${normalizeQualityKey(quality)}/${normalizeKey(name)}.png`;
}

export function getOracleScrollVideo(slug: string): string | undefined {
  if (!slug) return undefined;
  return `${BASE}relic/oracle_scroll/${slug}.mp4`;
}

// ── Resource ─────────────────────────────────────────────────────────────────

/** Build a resource icon path using the resource's stable slug. */
export function getResourceIcon(
  slug: string,
  category: ResourceCategory,
): string | undefined {
  if (!slug || !category) return undefined;
  return `${BASE}resource/${category.toLowerCase()}/${slug}.png`;
}

// ── Skill ────────────────────────────────────────────────────────────────────

/** Build a Divinity choice icon path from its shared icon slug (a generic stat badge reused across many heroes' choices, not per-choice art). */
export function getDivinityIcon(slug: string): string | undefined {
  if (!slug) return undefined;
  return `${BASE}skill/divinity/${normalizeKey(slug)}.png`;
}

// ── Status Effect ────────────────────────────────────────────────────────────

/** Build a status-effect icon path using the effect's stable slug. */
export function getStatusEffectIcon(
  slug: string,
  type: StatusEffectType = 'Utility',
): string | undefined {
  if (!slug) return undefined;
  return `${BASE}status_effect/${normalizeKey(type)}/${slug}.png`;
}

// ── Subclass ─────────────────────────────────────────────────────────────────

export function getSubclassIcon(
  subclassSlug: string,
  characterClass?: string,
): string | undefined {
  if (!subclassSlug || !characterClass) return undefined;
  const subclassKey = normalizeKey(subclassSlug);
  return `${BASE}subclass/${normalizeKey(characterClass)}/${subclassKey}.png`;
}

// ── Wyrmspell ────────────────────────────────────────────────────────────────

export function getWyrmspellIcon(
  name: string,
  type?: string,
): string | undefined {
  if (!name || !type) return undefined;
  const nameKey = normalizeKey(name);
  return `${BASE}wyrmspell/${normalizeKey(type)}/${nameKey}.png`;
}

export const WYRMSPELL_TYPE_ICON_MAP: Record<WyrmspellType, string> = {
  Breach: `${BASE}wyrmspell/icons/breach.png`,
  Refuge: `${BASE}wyrmspell/icons/refuge.png`,
  Wildcry: `${BASE}wyrmspell/icons/wildcry.png`,
  "Dragon's Call": `${BASE}wyrmspell/icons/dragons_call.png`,
};

// ── Event ────────────────────────────────────────────────────────────────────

export const placeholderEventImage = `${BASE}event/placeholder.webp`;

/** Build an event banner path using the event's stable slug. */
export function getEventImage(slug: string): string {
  return `${BASE}event/${slug}.webp`;
}

// ── Illustrations ────────────────────────────────────────────────────────────

export interface Illustration {
  name: string;
  src: string;
  type: 'image' | 'video';
  skinSlug?: string;
  assetPath?: string;
  /** Distinguishes the one-time entrance clip from the repeatable idle clip; only relevant for videos. */
  videoVariant?: 'birth' | 'loop';
  /** The illustration a skin should open on when first selected, if available. */
  isDefault?: boolean;
}

function resolveAssetKey(characterName: string, characterKey?: string): string {
  const explicitKey = (characterKey ?? '').trim();
  return normalizeKey(explicitKey || characterName);
}

export function getPortrait(
  characterName: string,
  characterKey?: string,
  skinSlug = 'default',
): string | undefined {
  if (!characterName) return undefined;
  const key = resolveAssetKey(characterName, characterKey);
  return `${BASE}character/${key}/skins/${skinSlug}/portrait.png`;
}

export type CharacterSkinAsset =
  'portrait' | 'full_body' | 'card' | 'scene' | 'birth' | 'loop';

export function getCharacterSkinAsset(
  characterSlug: string,
  skinSlug: string,
  asset: CharacterSkinAsset,
  type: 'image' | 'video' = 'image',
): string | undefined {
  if (
    !characterSlug ||
    !skinSlug ||
    (type === 'video' && asset !== 'birth' && asset !== 'loop')
  )
    return undefined;
  return `${BASE}character/${characterSlug}/skins/${skinSlug}/${asset}.${type === 'video' ? 'mp4' : 'png'}`;
}

export function resolveIllustrations(
  characterName: string,
  characterKey: string | undefined,
  skins: CharacterSkin[] | undefined,
): Illustration[] {
  const key = resolveAssetKey(characterName, characterKey);
  const skinAssetPath = (skinSlug: string, filename: string) =>
    `character/${key}/skins/${skinSlug}/${filename}`;
  const candidates: Illustration[] = (skins ?? []).flatMap((skin) => [
    {
      name: `${skin.name} Animation`,
      src: getCharacterSkinAsset(key, skin.slug, 'loop', 'video')!,
      type: 'video' as const,
      skinSlug: skin.slug,
      assetPath: skinAssetPath(skin.slug, 'loop.mp4'),
      videoVariant: 'loop' as const,
    },
    {
      name: `${skin.name} Birth Animation`,
      src: getCharacterSkinAsset(key, skin.slug, 'birth', 'video')!,
      type: 'video' as const,
      skinSlug: skin.slug,
      assetPath: skinAssetPath(skin.slug, 'birth.mp4'),
      videoVariant: 'birth' as const,
    },
    {
      // The scene image is every skin's canonical default illustration — preferred
      // over the animations when picking what to show on first selection.
      name: skin.name,
      src: getCharacterSkinAsset(key, skin.slug, 'scene')!,
      type: 'image' as const,
      skinSlug: skin.slug,
      assetPath: skinAssetPath(skin.slug, 'scene.png'),
      isDefault: true,
    },
  ]);
  return candidates;
}

const availability = new Map<string, Promise<boolean>>();

/** Probe optional skin files once and keep only media that can actually load. */
export function probeIllustrations(
  candidates: Illustration[],
): Promise<Illustration[]> {
  if (typeof window === 'undefined') return Promise.resolve(candidates);
  return Promise.all(
    candidates.map(async (candidate) => {
      let probe = availability.get(candidate.src);
      if (!probe) {
        probe = new Promise<boolean>((resolve) => {
          const element =
            candidate.type === 'image'
              ? new Image()
              : document.createElement('video');
          element.onload = () => resolve(true);
          element.onerror = () => resolve(false);
          if (element instanceof HTMLVideoElement)
            element.onloadedmetadata = () => resolve(true);
          element.src = candidate.src;
        });
        availability.set(candidate.src, probe);
      }
      return (await probe) ? candidate : null;
    }),
  ).then((items) =>
    items.filter((item): item is Illustration => item !== null),
  );
}

export function resolveManifestIllustrations(
  candidates: Illustration[],
  assets: Record<string, { sha256: string }>,
): Illustration[] {
  return candidates.flatMap((illustration) => {
    if (!illustration.assetPath) return [illustration];
    const entry = assets[illustration.assetPath];
    if (!entry) return [];
    const separator = illustration.src.includes('?') ? '&' : '?';
    return [
      {
        ...illustration,
        src: `${illustration.src}${separator}v=${entry.sha256.slice(0, 12)}`,
      },
    ];
  });
}

export async function getTalentIcon(
  characterName: string,
  characterKey?: string,
): Promise<string | undefined> {
  if (!characterName) return undefined;
  const key = resolveAssetKey(characterName, characterKey);
  return `${BASE}character/${key}/talent.png`;
}

export async function getCharacterSkillIcon(
  characterName: string,
  skillName: string,
  characterKey?: string,
): Promise<string | undefined> {
  if (!characterName || !skillName) return undefined;
  const key = resolveAssetKey(characterName, characterKey);
  return `${BASE}character/${key}/skills/${normalizeKey(skillName)}.png`;
}
