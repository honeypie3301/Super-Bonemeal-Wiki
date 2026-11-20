import { WikiArticle } from '../types';

export const WIKI_ARTICLES: WikiArticle[] = [
  { slug: 'home', title: 'Home', category: 'Core Guide', filename: 'Home.tsx', order: 1 },
  { slug: 'mechanics', title: 'Growth Mechanics', category: 'Core Guide', filename: 'Mechanics.tsx', order: 2 },
  { slug: 'versions', title: 'Version History', category: 'Core Guide', filename: 'Versions.tsx', order: 3 },
  { slug: 'items', title: 'Items & Crafting', category: 'Content & Data', filename: 'Items.tsx', order: 4 },
  { slug: 'acquisition', title: 'Trades & Loot Tables', category: 'Content & Data', filename: 'Acquisition.tsx', order: 5 },
  { slug: 'technical', title: 'Mod Specs & Compatibility', category: 'Technical', filename: 'Technical.tsx', order: 6 }
];

export function getWikiArticles(): WikiArticle[] {
  return WIKI_ARTICLES;
}

export function getArticleBySlug(slug: string): WikiArticle | undefined {
  return WIKI_ARTICLES.find(a => a.slug === slug);
}

/**
 * Static full-text search database across all articles for instantaneous,
 * offline, 100% independent deep search across items, crafting, mechanics,
 * trades, loot tables, tags, and mod metadata.
 */
export const WIKI_SEARCH_DATABASE: Record<string, string> = {
  home: `
    Super Bonemeal Super Bone Meal Minecraft NeoForge 1.21.1 Mod Field Guide
    50x50 area landscape transformation single click
    Bone Block Bone Meal shapeless crafting output 2
    10x targeted crop sapling moss boost
    Villager Farmer Wandering Trader Archaeology Chest Fishing Loot Tables
    honeypie_3301 MCreator GPLv3 v1.4.0
  `,
  mechanics: `
    Growth Mechanics SuperBonemealRightclickedOnBlockProcedure useOn
    Targeted Single-Plant Boost 10 consecutive bonemeal applications BoneMealItem growCrop growWaterPlant
    minecraft:moss_block minecraft:saplings minecraft:crops c:saplings snowrealmagic:plants
    50x2x50 Area Transformation 50x50 5000 blocks x-25 y-1 z-25
    10% chance Math.random < 0.1 per block short_grass excluded Blocks.SHORT_GRASS
    HAPPY_VILLAGER particles 200 count spread 6 1.6 6 levelEvent 2005
    Creative mode instabuild stack shrink 1 InteractionResult.SUCCESS
  `,
  versions: `
    Version History Changelog Updates Patch Notes Modrinth
    Super Bone Meal 1.4.0 NeoForge 1.21.1 Villager Wanderer trading 3 loot tables Logo
    Super Bone Meal 1.3.3 Forge 1.20.1 NeoForge 1.21.1 c:saplings minecraft:crops
  `,
  items: `
    Super Bone Meal super_bonemeal:super_bonemeal Rarity.UNCOMMON CreativeModeTabs.FUNCTIONAL_BLOCKS
    Shapeless Crafting Recipe super_bonemeal_recipe.json 4 Bone Block 5 Bone Meal yields 2 Super Bone Meal
    super_bone_meal.png lang en_us.json
  `,
  acquisition: `
    Trades Loot Tables Advancement
    Wandering Trader 2 Emerald for 1 Super Bone Meal max 4 uses 5 XP 0.04 price multiplier
    Farmer Villager Level 2 Apprentice 1 Emerald for 2 Super Bone Meal max 10 uses 7 XP 0.05 price multiplier
    Archaeology Loot archeology_loot.json weight 10 10% chance 0-3 count
    Chest Loot chest_loot.json weight 6 6% chance 1-5 count
    Fishing Loot fishing_loot.json weight 25 25% chance 1-2 count
    Recipe Advancement super_bonemeal_recipe has_the_recipe has_ingredient_0 minecraft:bone_block
  `,
  technical: `
    Technical Mod Specs Compatibility neoforge.mods.toml pack.mcmeta
    modId super_bonemeal version 1.4.0 NeoForge 21.1.232 Minecraft 1.21.1 pack_format 48
    GNU General Public License version 3 GPLv3
    Snow Real Magic snowrealmagic:plants NeoForge common tag c:saplings minecraft:moss_block
  `
};
