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
Official Agrarian & Flora Acceleration Field Guide for the Super Bone Meal Minecraft mod.
</UpdatedFrame>

<UpdatedFrame id="home_maintenance_notice_v140" isUpdated={true}>
> **Wiki Maintenance Note**
> 
> <u>The wiki is always updated before a new version releases.</u> If something in-game doesn't match what's documented here, please make sure your mod build is up to date.
> 
> **Recent Version Highlights (v1.4.0 Update):**
> - **Archaeology, Chest & Fishing Loot Tables**: Super Bone Meal can now be found natively via Archaeology brushing (10% chance, 0–3 items), Structure Chests (~6% chance, 1–5 items), and Fishing gameplay loot (25% chance, 1–2 items).
> - **Standardized Crafting Recipe**: Crafting recipe updated to combine 4 Bone Blocks (corners) + 5 Vanilla Bone Meals to yield 2 Super Bone Meal items.
> - **Villager & Wandering Trader Economy**: Preserved Wandering Trader (2 Emeralds → 1) and Apprentice Farmer (1 Emerald → 2) trading options.
</UpdatedFrame>

## Overview
**Super Bone Meal** is a Minecraft utility mod designed to eliminate tedious botanical farming and transform barren landscapes into lush, vibrant meadows with a single click.

By harnessing a concentrated 50x50 area effect and a dedicated single-tick 10-pulse precision strike for crops and saplings, Super Bone Meal allows builders and survivalists to instantly mature forests, crops, bamboo, and sugar cane without tedious grinding.

### Key Capabilities
- **50x50 Carpet Growth**: Fertilizes a massive 2,500-block area on terrain, spawning diverse flora with a 10% natural distribution.
- **Smart Meadow Filter**: Skips blocks that are already short grass, preventing chaotic clutter into tall grass.
- **Precision Crop & Sapling Growth**: Direct hits on crops, saplings, or moss trigger 10 instant growth bursts in a single tick.
- **Loot Table Distribution**: Found natively in Archaeology suspect sand/gravel, Structure Chests, and Fishing catches.
- **Villager & Wandering Trader Economy**: Fully integrated trades with Farmer Villagers (Apprentice) and Wandering Traders.`
  },
  {
    slug: 'items',
    title: 'Items & Mechanics',
    category: 'Features & Gear',
    order: 2,
    content: `# Items & Mechanics

<UpdatedFrame id="super_bonemeal_dossier_v140" isUpdated={true}>
## Super Bone Meal

**Item Registry Name**: \`super_bonemeal:super_bonemeal\`  
**Rarity**: Uncommon  
**Stack Size**: 64  
**Category**: Utility & Fertilizer  

### Item Overview
A concentrated, highly potent bone meal formulation capable of accelerating botanical growth across a massive 50x50 radius or instantly maturing crops and saplings through rapid-fire fertilizer pulses.

### Core Mechanics & Procedures

#### 1. Precision Crop & Sapling Growth (Targeted Mode)
When right-clicked directly onto a block tagged as a crop, sapling, or moss block:
- **Eligible Targets**: \`#minecraft:saplings\`, \`#minecraft:crops\`, \`#c:saplings\`, \`#snowrealmagic:plants\`, \`Blocks.MOSS_BLOCK\`, Sugar Cane, and Bamboo.
- **Pulse Count**: Applies **10 consecutive growth bursts** (\`levelEvent 2005\` with \`growCrop\`/\`growWaterPlant\`) in a single tick.
- **Outcome**: Instantly brute-forces trees to grow from saplings, turns seeds into fully ripe harvests, and maximizes bamboo/sugar cane height immediately.

#### 2. 50x50 Area Carpet Growth (Terrain Mode)
When right-clicked onto open terrain (dirt, grass blocks, etc.):
- **Area Range**: Scans a **50x2x50 block volume** (\`x-25\` to \`x+24\`, \`y-1\` to \`y\`, \`z-25\` to \`z+24\`).
- **Meadow Distribution Rate**: 10% random chance per eligible block.
- **Smart Meadow Filter**: Intelligently skips blocks that are already \`Blocks.SHORT_GRASS\`, preventing clutter from stacking into Tall Grass and preserving a clean meadow landscape.

#### 3. Visuals & Audio FX
- Spawns a burst of 100–200 **Happy Villager particles** (\`ParticleTypes.HAPPY_VILLAGER\`) and fertilizer sound effects across a 6.0 x 1.6 x 6.0 coordinate bounding box on impact.

#### 4. Survival Acquisition & Loot Tables
- **Archaeology Brushing**: Brushing suspicious sand or gravel has a 10% chance to yield 0 to 3 Super Bone Meal items (\`super_bonemeal:archaeology/archeology_loot\`).
- **Structure Chests**: Structure chests have a ~6% chance to contain 1 to 5 Super Bone Meal items (\`super_bonemeal:chests/chest_loot\`).
- **Fishing Gameplay Loot**: Fishing drops Super Bone Meal with a 25% chance for 1 to 2 items (\`super_bonemeal:gameplay/fishing_loot\`).
- **Wandering Trader**: 2 Emeralds → 1 Super Bone Meal (Level 1 trade, max 4 trades per trader).
- **Farmer Villager**: 1 Emerald → 2 Super Bone Meal (Level 2 Apprentice trade, max 10 trades per farmer).

#### 5. Crafting Recipe
Crafted using 4 Bone Blocks (placed in 4 corners) and 5 Vanilla Bone Meals (\`minecraft:bone_meal\`), yielding **2 Super Bone Meal items**.
</UpdatedFrame>`
  },
  {
    slug: 'versions',
    title: 'Version History',
    category: 'Changelog',
    order: 3,
    content: `# Version History

<UpdatedFrame id="versions_history_feed_v140" isUpdated={true}>
Explore the release timeline and changelog history of the Super Bone Meal mod, synchronized with Modrinth and CurseForge releases.

### Release Timeline

#### Super Bone Meal 1.4.0 (Latest Update)
- **Release Date**: August 21, 2026
- **Loaders**: NeoForge, Forge (Minecraft 1.20.6 / 1.21.1)
- **Changelog**:
  - **Loot Table Additions**: Integrated Super Bone Meal into Archaeology brushing (10% chance, 0–3 items), Structure Chests (~6% chance, 1–5 items), and Fishing gameplay loot (25% chance, 1–2 items).
  - **Recipe Standardization**: Rebalanced recipe to require 4 Bone Blocks + 5 Vanilla Bone Meals to craft 2 Super Bone Meals.
  - **Branding & Meta Polish**: Added official mod icon and updated NeoForge metadata.

#### Super Bone Meal 1.3.4
- **Release Date**: August 20, 2026
- **Loaders**: NeoForge (1.21.1)
- **Changelog**: Introduced Wandering Trader and Apprentice Farmer villager trading mechanics.

#### Super Bone Meal 1.3.2 (Beta / Experimental)
- **Release Date**: February 26, 2026
- **Loaders**: NeoForge (Minecraft 1.21.1)
- **Changelog**: Experimental feature tuning, balance revisions, and asset polish.

#### Super Bone Meal 1.3.1
- **Release Date**: February 24, 2026
- **Loaders**: NeoForge (1.21.1), Forge (1.20.1)
- **Changelog**: Increased item texture resolution and visual clarity in hand and hotbar.

#### Super Bone Meal 1.3.0
- **Release Date**: February 20–22, 2026
- **Loaders**: NeoForge (1.21.1), Forge (1.20.1)
- **Changelog**:
  - **Backport**: Ported to Forge 1.20.1.
  - **Instant Tree Growth**: Added high-priority Precision Strike logic with 10–20 rapid bone meal hits to force saplings to grow in one tick.
  - **Expanded Crop Support**: Added instant-growth support for Sugar Cane and Bamboo.
  - **Meadow Density Polish**: Fine-tuned random growth chance to 10% for the 50x50 area for clean meadow distribution.
  - **Particle Tuning**: Reduced Happy Villager particles from 200 to 100 for smoother FPS.

#### Super Bone Meal 1.1.1
- **Release Date**: February 20, 2026
- **Loaders**: NeoForge (1.21.1)
- **Changelog**: Survival item consumption fixes and Creative mode infinity checks.

#### Super Bone Meal 1.0.0
- **Release Date**: February 20, 2026
- **Loaders**: NeoForge (1.21.1)
- **Changelog**: Initial release of Super Bone Meal featuring 50x50 area fertilization and instant bone meal acceleration.
</UpdatedFrame>`
  }
];
