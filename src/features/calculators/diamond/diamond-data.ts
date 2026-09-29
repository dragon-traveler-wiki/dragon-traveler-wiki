export type DiamondBaseSource = {
  id: string;
  label: string;
  defaultAmount: number;
  defaultCadenceDays: number;
};

export type DiamondOption = {
  value: string;
  label: string;
};

export const BASE_GAIN_SOURCES: DiamondBaseSource[] = [
  {
    id: 'storyChapterClear',
    label: 'Story chapter clear',
    defaultAmount: 7350,
    defaultCadenceDays: 6,
  },
  {
    id: 'wildHuntDailyQuest',
    label: 'Wild Hunt daily quest',
    defaultAmount: 50,
    defaultCadenceDays: 1,
  },
  {
    id: 'maintenance',
    label: 'Maintenance rewards',
    defaultAmount: 300,
    defaultCadenceDays: 14,
  },
  {
    id: 'share',
    label: 'Share reward',
    defaultAmount: 100,
    defaultCadenceDays: 7,
  },
  {
    id: 'guildAuctionDividend',
    label: 'Guild auction house dividend',
    defaultAmount: 2000,
    defaultCadenceDays: 7,
  },
  {
    id: 'signInWeekly',
    label: 'Sign-in gift (weekly part)',
    defaultAmount: 100,
    defaultCadenceDays: 7,
  },
  {
    id: 'signInMonthly',
    label: 'Sign-in gift (monthly part)',
    defaultAmount: 500,
    defaultCadenceDays: 30,
  },
  {
    id: 'goldenLeafHuntRound',
    label: 'Golden Leaf Hunt round',
    defaultAmount: 1450,
    defaultCadenceDays: 7,
  },
  {
    id: 'guildGarrison',
    label: 'Guild garrison',
    defaultAmount: 2880,
    defaultCadenceDays: 7,
  },
  {
    id: 'trialByFire',
    label: 'Trial by Fire',
    defaultAmount: 4500,
    defaultCadenceDays: 14,
  },
  {
    id: 'realmClash',
    label: 'Realm Clash',
    defaultAmount: 1500,
    defaultCadenceDays: 7,
  },
  {
    id: 'dailyGift',
    label: 'Daily Gift',
    defaultAmount: 30,
    defaultCadenceDays: 1,
  },
  {
    id: 'guildExpedition',
    label: 'Guild Expedition',
    defaultAmount: 1000,
    defaultCadenceDays: 7,
  },
  {
    id: 'luckyOverdriveCombo',
    label: 'Lucky Overdrive Combo',
    defaultAmount: 100,
    defaultCadenceDays: 1,
  },
];

export const BASE_SPEND_SOURCES: DiamondBaseSource[] = [
  {
    id: 'quickPatrol',
    label: 'Quick patrol',
    defaultAmount: 180,
    defaultCadenceDays: 1,
  },
  {
    id: 'goldenHorns',
    label: 'Golden horns',
    defaultAmount: 0,
    defaultCadenceDays: 1,
  },
  {
    id: 'legacyDragonCrystal',
    label: 'Legacy dragon crystal',
    defaultAmount: 800,
    defaultCadenceDays: 1,
  },
  {
    id: 'soulElixir',
    label: 'Soul elixir',
    defaultAmount: 1200,
    defaultCadenceDays: 1,
  },
  {
    id: 'dispatchRerolls',
    label: 'Dispatch rerolls',
    defaultAmount: 100,
    defaultCadenceDays: 1,
  },
  {
    id: 'forestDefense',
    label: 'Forest defense',
    defaultAmount: 50,
    defaultCadenceDays: 1,
  },
  {
    id: 'treasureHeist',
    label: 'Treasure heist',
    defaultAmount: 50,
    defaultCadenceDays: 1,
  },
  {
    id: 'wildRally',
    label: 'Wild rally',
    defaultAmount: 50,
    defaultCadenceDays: 1,
  },
  {
    id: 'slimeShowdown',
    label: 'Slime showdown',
    defaultAmount: 150,
    defaultCadenceDays: 1,
  },
  {
    id: 'guildExpeditionActionPoints',
    label: 'Guild expedition action points',
    defaultAmount: 100,
    defaultCadenceDays: 1,
  },
  {
    id: 'explorerGuide',
    label: 'Explorer guide',
    defaultAmount: 200,
    defaultCadenceDays: 1,
  },
  {
    id: 'championExpedition',
    label: 'Champion expedition',
    defaultAmount: 400,
    defaultCadenceDays: 1,
  },
  {
    id: 'cloudClashChallenges',
    label: 'Cloud Clash challenge attempts',
    defaultAmount: 450,
    defaultCadenceDays: 7,
  },
  {
    id: 'cloudClashEnercore',
    label: 'Cloud Clash Enercore',
    defaultAmount: 300,
    defaultCadenceDays: 7,
  },
  {
    id: 'luminarySummoning',
    label: 'Luminary Summoning',
    defaultAmount: 0,
    defaultCadenceDays: 14,
  },
  {
    id: 'primalAmber',
    label: 'Primal Amber',
    defaultAmount: 1000,
    defaultCadenceDays: 30,
  },
];

export const POINTS_LEAGUE_OPTIONS: DiamondOption[] = [
  { value: 'legend', label: 'Legend rank (300/day)' },
  { value: 'king', label: 'King rank (220/day)' },
  { value: 'champion', label: 'Champion rank (180/day)' },
  { value: 'grandmaster', label: 'Grandmaster rank (150/day)' },
  { value: 'master', label: 'Master rank (120/day)' },
  { value: 'expert', label: 'Expert rank (100/day)' },
  { value: 'elite', label: 'Elite rank (80/day)' },
  { value: 'apprentice', label: 'Apprentice rank (60/day)' },
  { value: 'novice', label: 'Novice rank (40/day)' },
];

export const POINTS_LEAGUE_DAILY_BY_RANK: Record<string, number> = {
  legend: 300,
  king: 220,
  champion: 180,
  grandmaster: 150,
  master: 120,
  expert: 100,
  elite: 80,
  apprentice: 60,
  novice: 40,
};

export const ARENA_OPTIONS: DiamondOption[] = [
  { value: '1000', label: 'Rank 1 (1000/day)' },
  { value: '800', label: 'Rank 2 (800/day)' },
  { value: '750', label: 'Rank 3 (750/day)' },
  { value: '700', label: 'Rank 4-5 (700/day)' },
  { value: '650', label: 'Rank 6-9 (650/day)' },
  { value: '600', label: 'Rank 10 (600/day)' },
  { value: '550', label: 'Rank 11-20 (550/day)' },
  { value: '500', label: 'Rank 21-50 (500/day)' },
  { value: '450', label: 'Rank 51-100 (450/day)' },
  { value: '400', label: 'Rank 101-200 (400/day)' },
  { value: '350', label: 'Rank 201-300 (350/day)' },
  { value: '300', label: 'Rank 301-400 (300/day)' },
  { value: '280', label: 'Rank 401-600 (280/day)' },
  { value: '260', label: 'Rank 601-800 (260/day)' },
  { value: '240', label: 'Rank 801-1000 (240/day)' },
  { value: '220', label: 'Rank 1001-1500 (220/day)' },
  { value: '200', label: 'Rank 1501-2000 (200/day)' },
  { value: '180', label: 'Rank 2001-2500 (180/day)' },
  { value: '160', label: 'Rank 2501-3000 (160/day)' },
  { value: '140', label: 'Rank 3001-4000 (140/day)' },
  { value: '130', label: 'Rank 4001-5000 (130/day)' },
  { value: '120', label: 'Rank 5001-6000 (120/day)' },
  { value: '110', label: 'Rank 6001-8000 (110/day)' },
  { value: '100', label: 'Rank 8001-10000 (100/day)' },
];

export const COLOSSEUM_OPTIONS: DiamondOption[] = [
  { value: '3000', label: 'Rank 1 (3000 / 2 weeks)' },
  { value: '2700', label: 'Rank 2-3 (2700 / 2 weeks)' },
  { value: '2400', label: 'Rank 4-10 (2400 / 2 weeks)' },
  { value: '2100', label: 'Rank 11-20 (2100 / 2 weeks)' },
  { value: '1800', label: 'Rank 21-50 (1800 / 2 weeks)' },
  { value: '1680', label: 'Rank 51-100 (1680 / 2 weeks)' },
  { value: '1560', label: 'Rank 101-200 (1560 / 2 weeks)' },
  { value: '1440', label: 'Rank 201-500 (1440 / 2 weeks)' },
  { value: '1320', label: 'Rank 501-1000 (1320 / 2 weeks)' },
  { value: '1200', label: 'Rank 1000+ (1200 / 2 weeks)' },
];

export const WILD_HUNT_OPTIONS: DiamondOption[] = [
  { value: '8888', label: 'Rank 1 (8888 / 2 weeks)' },
  { value: '5888', label: 'Rank 2 (5888 / 2 weeks)' },
  { value: '3888', label: 'Rank 3 (3888 / 2 weeks)' },
  { value: '2888', label: 'Rank 4-10 (2888 / 2 weeks)' },
  { value: '2288', label: 'Rank 11-20 (2288 / 2 weeks)' },
  { value: '1688', label: 'Rank 21-50 (1688 / 2 weeks)' },
  { value: '1488', label: 'Rank 51-100 (1488 / 2 weeks)' },
  { value: '1288', label: 'Top 5% (1288 / 2 weeks)' },
  { value: '1088', label: 'Top 10% (1088 / 2 weeks)' },
  { value: '888', label: 'Top 20% (888 / 2 weeks)' },
];

export const SUPREME_MONTHLY_CARD = 10200;
