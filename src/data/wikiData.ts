import { WikiArticle, RecipeSpec, TradeSpec } from '../types';

export const WIKI_ARTICLES: WikiArticle[] = [
  {
    slug: 'home',
    title: 'Home',
    category: 'Core Guide',
    order: 1,
    description: 'Welcome to the official Super Bone Meal Minecraft mod wiki documentation.',
  },
  {
    slug: 'versions',
    title: 'Version History',
    category: 'Core Guide',
    order: 2,
    description: 'Live auto-fetched release logs, changelogs, and download links.',
  },
  {
    slug: 'items',
    title: 'Items',
    category: 'Items & Gear',
    order: 3,
    description: 'Properties, creative tab, stack limits, and 3x3 crafting grid recipe.',
  },
  {
    slug: 'mechanics_aoe',
    title: '50x50 AoE & Growth Logic',
    category: 'Mechanics',
    order: 4,
    description: 'How the 50x50 area bonemeal pulse and 10x brute-force crop loops operate in Java.',
  },
  {
    slug: 'villager_trades',
    title: 'Merchant & Villager Trades',
    category: 'Flora & Fauna',
    order: 5,
    description: 'Farmer Apprentice and Wandering Trader Emerald trades.',
  },
];

export const SUPER_BONEMEAL_RECIPE: RecipeSpec = {
  id: 'super_bonemeal_recipe',
  type: 'CRAFTING SHAPED',
  title: 'Super Bone Meal',
  yieldCount: 2,
  recipeNumber: 'Recipe 1/1',
  recipeFile: 'super_bonemeal_recipe.json',
  output: {
    code: 'Sbm',
    name: 'Super Bone Meal',
    count: 2,
  },
  grid: [
    { code: 'Bb', name: 'Bone Block' }, // 0: Top-Left Corner
    { code: 'Bm', name: 'Bone Meal' },  // 1: Top-Center (Plus)
    { code: 'Bb', name: 'Bone Block' }, // 2: Top-Right Corner
    { code: 'Bm', name: 'Bone Meal' },  // 3: Mid-Left (Plus)
    { code: 'Bm', name: 'Bone Meal' },  // 4: Center (Plus)
    { code: 'Bm', name: 'Bone Meal' },  // 5: Mid-Right (Plus)
    { code: 'Bb', name: 'Bone Block' }, // 6: Bottom-Left Corner
    { code: 'Bm', name: 'Bone Meal' },  // 7: Bottom-Center (Plus)
    { code: 'Bb', name: 'Bone Block' }, // 8: Bottom-Right Corner
  ],
  ingredientsList: [
    { key: 'A', name: 'Bone Block (4 Corners)' },
    { key: 'B', name: 'Bone Meal (5 Center Plus Shape)' },
  ],
};

export const TRADES_DATA: TradeSpec[] = [
  {
    profession: 'Farmer Villager',
    level: 2,
    levelTitle: 'Apprentice Farmer',
    cost: {
      item: 'Emerald',
      count: 1,
      icon: 'emerald',
    },
    result: {
      item: 'Super Bone Meal',
      count: 2,
      icon: 'super_bonemeal',
    },
    maxTrades: 10,
    xpGain: 7,
    priceMultiplier: 0.05,
  },
  {
    profession: 'Wandering Trader',
    level: 1,
    levelTitle: 'Nomadic Merchant',
    cost: {
      item: 'Emerald',
      count: 2,
      icon: 'emerald',
    },
    result: {
      item: 'Super Bone Meal',
      count: 1,
      icon: 'super_bonemeal',
    },
    maxTrades: 4,
    xpGain: 5,
    priceMultiplier: 0.04,
  },
];

export const STATIC_FALLBACK_VERSIONS = [
  {
    id: 'tLC9m5S6',
    name: 'Super Bone Meal 1.3.2 (Experimental)',
    version_number: '1.3.2',
    game_versions: ['1.21.1'],
    loaders: ['neoforge'],
    version_type: 'beta',
    date_published: '2026-02-26T15:36:59Z',
    changelog: 'Experimental build testing 50x50 radius performance tweaks and NeoForge 1.21.1 updates.',
    downloads: 36,
    fileUrl: 'https://modrinth.com/mod/super-bone-meal/version/1.3.2',
    filename: 'super_bonemeal_experimental-1.3.2-neoforge-1.21.1.jar',
  },
  {
    id: 'QWRvOKbk',
    name: 'Super Bone Meal 1.3.1',
    version_number: '1.3.1',
    game_versions: ['1.21.1'],
    loaders: ['neoforge'],
    version_type: 'release',
    date_published: '2026-02-24T03:02:40Z',
    changelog: 'Made the texture bigger.',
    downloads: 16,
    fileUrl: 'https://modrinth.com/mod/super-bone-meal/version/1.3.1',
    filename: 'super_bonemeal-1.3.1-neoforge-1.21.1.jar',
  },
  {
    id: 'OkJphdfx',
    name: 'Super Bone Meal 1.3.0',
    version_number: '1.3.0',
    game_versions: ['1.21.1', '1.20.1'],
    loaders: ['neoforge', 'forge'],
    version_type: 'release',
    date_published: '2026-02-20T06:43:41Z',
    changelog: '- Instant Tree Growth: Added high-priority precision strike logic.\n- Expanded Crop Support: Added instant-growth for Sugar Cane & Bamboo.\n- Logic Optimization: Improved server-side performance.',
    downloads: 38,
    fileUrl: 'https://modrinth.com/mod/super-bone-meal/version/1.3.0',
    filename: 'super_bonemeal-1.3.0-neoforge-1.21.1.jar',
  },
];
