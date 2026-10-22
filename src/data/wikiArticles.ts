/**
 * =========================================================================================
 * CRITICAL WIKI MAINTENANCE REMINDERS:
 * 1. STRICT FACTUAL ACCURACY / NO NARRATIVE TONES:
 *    - Never use speculative, sensationalized, roleplay, or fictional narrative phrasing.
 *    - Rely strictly on verified source code implementations, exact values, and game mechanics.
 * 2. MOD UPDATES vs. WIKI MAINTENANCE NOTE:
 *    - When updating mod versions or release notes, ONLY edit the Wiki Maintenance Note 
 *      in HomeView.tsx. Do NOT modify the core wiki text unless the mod mechanics themselves changed.
 * =========================================================================================
 */

export interface WikiArticleData {
  slug: string;
  title: string;
  category: string;
  order: number;
  content: string;
}

export const WIKI_ARTICLES: WikiArticleData[] = [
  {
    slug: 'home',
    title: 'Home',
    category: 'Core Guide',
    order: 1,
    content: `# Super Bone Meal Wiki

<UpdatedFrame id="home_hero_dial_picker" isUpdated={true}>
Official documentation for the Super Bone Meal Minecraft mod (version 1.4.0 for Minecraft 1.21.1 NeoForge).
</UpdatedFrame>

<UpdatedFrame id="home_maintenance_notice_v140_verified" isUpdated={true}>
> **Wiki Maintenance Note**
> 
> <u>The wiki is always updated before a new version releases.</u> If something in-game doesn't match what's documented here, please make sure your mod build is up to date.
> 
> **Recent Highlights:**
> - **Loot Tables**: Added loot table injections for archaeology (10% chance, 0–3 items), chests (6% chance, 1–5 items), and fishing (25% chance, 1–2 items).
> - **Crafting Recipe**: Shapeless recipe requiring 4 Bone Blocks and 5 Bone Meals to yield 2 Super Bone Meals.
> - **Targeted Plant Growth**: Right-clicking Moss Blocks, saplings (#minecraft:saplings, #c:saplings), crops (#minecraft:crops), or Snow! Real Magic! plants (#snowrealmagic:plants) applies 10 bone meal growth calls in 1 tick.
> - **Area Fertilization**: Right-clicking other blocks runs a 50x2x50 loop (x-25 to x+24, y-1 to y, z-25 to z+24), skipping short grass with a 10% chance to apply bone meal.
> - **Villager & Wandering Trader Trades**: Wandering Traders offer 1 Super Bone Meal for 2 Emeralds (max 4 trades). Level 2 Apprentice Farmers offer 2 Super Bone Meals for 1 Emerald (max 10 trades).
</UpdatedFrame>

## Overview
Super Bone Meal expands plant fertilization to a 50x2x50 volume and applies 10 instant bone meal growth pulses to targeted vegetation.

Super Bone Meal adds a single item, Super Bone Meal (\`super_bonemeal:super_bonemeal\`), which functions either as an area fertilizer across a 50x2x50 volume or as a rapid growth accelerator on targeted plants.

### Mechanics Summary
- **Targeted Growth (10 Pulses)**: When right-clicked on \`Blocks.MOSS_BLOCK\` or blocks tagged with \`#minecraft:saplings\`, \`#minecraft:crops\`, \`#c:saplings\`, or \`#snowrealmagic:plants\`, the procedure runs 10 times, calling \`BoneMealItem.growCrop\` or \`BoneMealItem.growWaterPlant\` and triggering level event 2005.
- **Area Fertilization (50x2x50 Volume)**: When right-clicked on any other block, coordinates are scanned from x-25 to x+24, y-1 to y, and z-25 to z+24. Any block that is not \`Blocks.SHORT_GRASS\` has a 10% random chance (\`Math.random() < 0.1\`) to receive a bone meal call.
- **Particles**: Spawns 200 \`ParticleTypes.HAPPY_VILLAGER\` particles at the clicked position (dx=6, dy=1.6, dz=6, speed=1).
- **Item Consumption**: Unless the player is in Creative mode (\`instabuild\`), 1 Super Bone Meal is consumed per use.
- **Crafting**: Shapeless crafting with 4 Bone Blocks and 5 Bone Meals produces 2 Super Bone Meals.
- **Loot Tables**: Generates in archaeology (10% chance, 0–3 items), chests (6% chance, 1–5 items), and fishing (25% chance, 1–2 items).
- **Trading**: Available from Wandering Traders (2 Emeralds -> 1 item, max 4) and Level 2 Apprentice Farmers (1 Emerald -> 2 items, max 10).`
  },
  {
    slug: 'items',
    title: 'Items & Mechanics',
    category: 'Features & Gear',
    order: 2,
    content: `# Items & Mechanics

<UpdatedFrame id="super_bonemeal_dossier_v140_verified" isUpdated={true}>
## Super Bone Meal

- **Registry Name**: \`super_bonemeal:super_bonemeal\`
- **Rarity**: Uncommon (\`Rarity.UNCOMMON\`)
- **Creative Mode Tab**: Functional Blocks (\`CreativeModeTabs.FUNCTIONAL_BLOCKS\`)
- **Max Stack Size**: 64
- **Item Class**: \`SuperBonemealItem\` (extends \`Item\`)

### Usage Mechanics

#### 1. Targeted Plant Growth
When right-clicked on a block:
- **Condition**: The targeted block satisfies any of the following:
  - Is \`Blocks.MOSS_BLOCK\`
  - Has tag \`#minecraft:saplings\`
  - Has tag \`#minecraft:crops\`
  - Has tag \`#c:saplings\`
  - Has tag \`#snowrealmagic:plants\`
- **Execution**: A loop runs 10 times calling \`BoneMealItem.growCrop\` or \`BoneMealItem.growWaterPlant\`. If successful and on the server side, it plays level event 2005 (bone meal particle/sound effect) at the block position.

#### 2. Area Fertilization (50x2x50)
If the clicked block does not match the targeted condition:
- **Scan Bounds**:
  - X axis: \`x - 25\` to \`x + 24\` (50 blocks)
  - Y axis: \`y - 1\` to \`y\` (2 blocks)
  - Z axis: \`z - 25\` to \`z + 24\` (50 blocks)
  - Total block positions evaluated: 5,000
- **Filter**: Checks that the block is not \`Blocks.SHORT_GRASS\` and that \`Math.random() < 0.1\` (10% chance).
- **Execution**: If both conditions pass, \`BoneMealItem.growCrop\` or \`BoneMealItem.growWaterPlant\` is called, and level event 2005 is broadcast.

#### 3. Particles & Item Consumption
- **Particles**: Emits 200 \`HAPPY_VILLAGER\` particles centered at the clicked coordinates (dx: 6, dy: 1.6, dz: 6, speed: 1).
- **Consumption**: Decrements stack count by 1 unless the player has \`instabuild\` (Creative mode).

### Acquisition

#### Crafting Recipe
- **Type**: Shapeless crafting (\`minecraft:crafting_shapeless\`)
- **Ingredients**:
  - 4x \`minecraft:bone_block\`
  - 5x \`minecraft:bone_meal\`
- **Result**: 2x \`super_bonemeal:super_bonemeal\`
- **Unlock Requirement**: Having \`minecraft:bone_block\` in inventory.

#### Loot Tables
- **Archaeology** (\`super_bonemeal:archaeology/archeology_loot\`): 1 roll. 10% chance for 0–3 Super Bone Meals (weight 10 vs weight 90 empty).
- **Chests** (\`super_bonemeal:chests/chest_loot\`): 1 roll. 6% chance for 1–5 Super Bone Meals (weight 6 vs weight 94 empty).
- **Fishing** (\`super_bonemeal:gameplay/fishing_loot\`): 1 roll. 25% chance for 1–2 Super Bone Meals (weight 25 vs weight 75 empty).

#### Villager & Wandering Trader Trades
- **Wandering Trader**:
  - Cost: 2 Emeralds
  - Offer: 1 Super Bone Meal
  - Max Trades: 4
  - XP Reward: 5
  - Price Multiplier: 0.04
- **Farmer Villager (Apprentice Level 2)**:
  - Cost: 1 Emerald
  - Offer: 2 Super Bone Meals
  - Max Trades: 10
  - XP Reward: 7
  - Price Multiplier: 0.05
</UpdatedFrame>`
  },
  {
    slug: 'versions',
    title: 'Version History',
    category: 'Changelog',
    order: 3,
    content: `# Version History

<UpdatedFrame id="versions_history_feed_v140" isUpdated={true}>
Version changelogs and release information for Super Bone Meal.

### Release History

#### Super Bone Meal 1.4.0
- **Minecraft Version**: 1.21.1
- **Mod Loader**: NeoForge (>= 21.1.232)
- **Changes**:
  - Added loot table drops: Archaeology (10% chance, 0–3 items), Chests (6% chance, 1–5 items), Fishing (25% chance, 1–2 items).
  - Added shapeless crafting recipe: 4 Bone Blocks + 5 Bone Meals -> 2 Super Bone Meals.
  - Added official logo asset and updated mod metadata in neoforge.mods.toml.

#### Super Bone Meal 1.3.4
- **Minecraft Version**: 1.21.1
- **Mod Loader**: NeoForge
- **Changes**:
  - Added Wandering Trader trade: 2 Emeralds for 1 Super Bone Meal (max 4 trades).
  - Added Apprentice Farmer trade: 1 Emerald for 2 Super Bone Meals (max 10 trades).

#### Super Bone Meal 1.0.0
- **Minecraft Version**: 1.21.1
- **Mod Loader**: NeoForge
- **Changes**:
  - Initial release with 50x2x50 area fertilization and 10-cycle targeted plant growth.
</UpdatedFrame>`
  }
];
