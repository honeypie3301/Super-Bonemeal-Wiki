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

<UpdatedFrame id="home_maintenance_notice" isUpdated={true}>
> **Wiki Maintenance Note**
> 
> <u>The wiki is always updated before a new version releases.</u> If something in-game doesn't match what's documented here, please make sure your mod build is up to date.
> 
> **Recent Version Highlights:**
> - **Wandering Trader Trades**: Wandering Traders now offer Super Bone Meal for purchase (exchange 2 Emeralds for 1 Super Bone Meal, up to 4 trades per trader).
> - **Farmer Villager Trades**: Level 2 (Apprentice) Farmer Villagers now trade 2 Super Bone Meal for 1 Emerald (up to 10 trades per apprentice farmer).
</UpdatedFrame>

## Overview
**Super Bone Meal** is a Minecraft utility mod designed to eliminate tedious botanical farming and transform barren landscapes into lush, vibrant meadows with a single click.

By harnessing a concentrated 50x50 area effect and a dedicated single-tick 10-pulse precision strike for crops and saplings, Super Bone Meal allows builders and survivalists to instantly mature forests, crops, bamboo, and sugar cane without tedious grinding.

### Key Capabilities
- **50x50 Carpet Growth**: Fertilizes a massive 2,500-block area on terrain, spawning diverse flora with a 10% natural distribution.
- **Smart Meadow Filter**: Skips blocks that are already short grass, preventing chaotic clutter into tall grass.
- **Precision Crop & Sapling Growth**: Direct hits on crops, saplings, or moss trigger 10 instant growth bursts in a single tick.
- **Villager & Wandering Trader Economy**: Fully integrated trades with Farmer Villagers (Apprentice) and Wandering Traders.`
  },
  {
    slug: 'items',
    title: 'Items & Mechanics',
    category: 'Features & Gear',
    order: 2,
    content: `# Items & Mechanics

<UpdatedFrame id="super_bonemeal_dossier" isUpdated={true}>
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

#### 4. Survival Consumption & Balance
- Consumes 1 item per use in Survival and Adventure modes.
- Creative mode users can use it infinitely without inventory depletion.

### Trading Mechanics
- **Wandering Trader**: 2 Emeralds → 1 Super Bone Meal (Level 1 trade, max 4 trades per trader).
- **Farmer Villager**: 1 Emerald → 2 Super Bone Meal (Level 2 Apprentice trade, max 10 trades per farmer).

### Crafting Recipe
Crafted shapelessly using 4 Bone Blocks and 5 Super Bone Meal for batch duplication, or crafted via shaped crafting using 9 Bone Blocks.
</UpdatedFrame>`
  },
  {
    slug: 'versions',
    title: 'Version History',
    category: 'Changelog',
    order: 3,
    content: `# Version History

<UpdatedFrame id="versions_history_feed" isUpdated={true}>
Explore the release timeline and changelog history of the Super Bone Meal mod, synchronized with Modrinth and CurseForge releases.

### Release Timeline

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
  - **Instant Tree Growth**: Added high-priority Precision Strike logic with 10–20 rapid bone meal hits to force saplings (Oak, Spruce, Birch, Acacia, Dark Oak, Jungle, Mangrove, Cherry) to grow in one tick.
  - **Expanded Crop Support**: Added instant-growth support for Sugar Cane and Bamboo.
  - **Meadow Density Polish**: Fine-tuned random growth chance to 10% for the 50x50 area for clean meadow distribution.
  - **Particle Tuning**: Reduced Happy Villager particles from 200 to 100 for smoother FPS.

#### Super Bone Meal 1.1.1
- **Release Date**: February 20, 2026
- **Loaders**: NeoForge (1.21.1)
- **Changelog**:
  - **Survival Balance**: Fixed item consumption in Survival/Adventure mode (\`shrink(1)\` on use).
  - **Creative Mode Support**: Prevents item consumption when used in Creative mode.
  - **Entity Safety Check**: Added null-safety validation for non-player activations.

#### Super Bone Meal 1.1.0
- **Release Date**: February 20, 2026
- **Loaders**: NeoForge (1.21.1)
- **Changelog**:
  - **Height Optimization**: Optimized search radius down to 8 vertical blocks to minimize tick overhead across hilly terrain.
  - **Tall Grass Prevention**: Added Smart Filter to skip existing Short Grass to prevent messy Tall Grass clutter.
  - **Performance Optimization**: Tuned area growth random chance for smooth server FPS.
  - **Particle Cleanup**: Reduced Happy Villager particle burst from 700 to 200.

#### Super Bone Meal 1.0.0
- **Release Date**: February 20, 2026
- **Loaders**: NeoForge (1.21.1)
- **Changelog**: Initial release of Super Bone Meal featuring 50x50 area fertilization and instant bone meal acceleration.
</UpdatedFrame>`
  }
];
