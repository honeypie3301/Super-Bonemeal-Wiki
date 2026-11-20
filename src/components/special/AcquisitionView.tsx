import React, { useState } from 'react';
import {
  Coins,
  Pickaxe,
  Fish,
  Archive,
  Award,
  Users,
  Compass
} from 'lucide-react';
import UpdatedFrame from '../UpdatedFrame';

interface TradeOffer {
  trader: string;
  tier: string;
  cost: string;
  reward: string;
  maxUses: number;
  xp: number;
  priceMultiplier: string;
  sourceClass: string;
}

interface LootTableEntry {
  id: string;
  title: string;
  lootType: string;
  file: string;
  rolls: number;
  itemWeight: number;
  emptyWeight: number;
  dropChance: string;
  countRange: string;
  notes: string;
}

export default function AcquisitionView() {
  const [activeTab, setActiveTab] = useState<'all' | 'trades' | 'loot' | 'advancement'>('all');

  const trades: TradeOffer[] = [
    {
      trader: 'Farmer Villager',
      tier: 'Level 2 (Apprentice)',
      cost: '1 × Emerald',
      reward: '2 × Super Bone Meal',
      maxUses: 10,
      xp: 7,
      priceMultiplier: '0.05',
      sourceClass: 'VillagerTradesEvent (VillagerProfession.FARMER, level 2)'
    },
    {
      trader: 'Wandering Trader',
      tier: 'Generic Trade Pool',
      cost: '2 × Emerald',
      reward: '1 × Super Bone Meal',
      maxUses: 4,
      xp: 5,
      priceMultiplier: '0.04',
      sourceClass: 'WandererTradesEvent (getGenericTrades)'
    }
  ];

  const lootTables: LootTableEntry[] = [
    {
      id: 'fishing_loot',
      title: 'Fishing Gameplay Loot',
      lootType: 'minecraft:fishing',
      file: 'data/super_bonemeal/loot_table/gameplay/fishing_loot.json',
      rolls: 1,
      itemWeight: 25,
      emptyWeight: 75,
      dropChance: '25%',
      countRange: '1 – 2',
      notes: 'Highest single-roll drop probability among the mod loot tables.'
    },
    {
      id: 'archeology_loot',
      title: 'Archaeology Loot',
      lootType: 'minecraft:archaeology',
      file: 'data/super_bonemeal/loot_table/archaeology/archeology_loot.json',
      rolls: 1,
      itemWeight: 10,
      emptyWeight: 90,
      dropChance: '10%',
      countRange: '0 – 3',
      notes: 'Includes a min count of 0 in set_count, meaning successful rolls can yield 0 to 3 items.'
    },
    {
      id: 'chest_loot',
      title: 'Chest Loot',
      lootType: 'minecraft:chest',
      file: 'data/super_bonemeal/loot_table/chests/chest_loot.json',
      rolls: 1,
      itemWeight: 6,
      emptyWeight: 94,
      dropChance: '6%',
      countRange: '1 – 5',
      notes: 'Lowest drop chance, but offers the largest stack size (up to 5 Super Bone Meal).'
    }
  ];

  const getLootIcon = (id: string) => {
    switch (id) {
      case 'fishing_loot':
        return Fish;
      case 'archeology_loot':
        return Pickaxe;
      default:
        return Archive;
    }
  };

  return (
    <div className="space-y-8 max-w-[1000px] mx-auto text-ink-muted select-text">

      {/* Filter Tabs */}
      <div className="p-3 bg-surface border border-line rounded-xl flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Acquisition Methods', icon: Compass },
          { id: 'trades', label: 'Villager & Trader Offers', icon: Coins },
          { id: 'loot', label: 'World Loot Tables (3)', icon: Archive },
          { id: 'advancement', label: 'Recipe Advancement', icon: Award }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 border transition-colors cursor-pointer ${
                active
                  ? 'bg-accent-soft text-accent-text border-accent-border font-semibold'
                  : 'bg-surface-alt text-ink-muted border-line hover:text-ink'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section 1: Trades */}
      {(activeTab === 'all' || activeTab === 'trades') && (
        <UpdatedFrame id="sb_acquisition_trades" isUpdated={true}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent-text font-semibold">
              <Users className="w-4 h-4" />
              <span>NPC Trades (SuperBonemealModTrades.java)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trades.map((trade) => (
                <div key={trade.trader} className="p-5 bg-surface border border-line rounded-xl space-y-4">
                  <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
                    <div>
                      <h3 className="font-display text-lg font-bold text-ink">{trade.trader}</h3>
                      <p className="text-xs font-mono text-ink-subtle">{trade.tier}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-accent-soft text-accent-text border border-accent-border">
                      {trade.cost} → {trade.reward}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 bg-surface-alt border border-line rounded-lg">
                      <div className="text-[10px] font-mono text-ink-subtle uppercase">Max Uses</div>
                      <div className="text-sm font-mono font-bold text-ink mt-0.5">{trade.maxUses}</div>
                    </div>
                    <div className="p-2.5 bg-surface-alt border border-line rounded-lg">
                      <div className="text-[10px] font-mono text-ink-subtle uppercase">Trader XP</div>
                      <div className="text-sm font-mono font-bold text-good-text mt-0.5">+{trade.xp}</div>
                    </div>
                    <div className="p-2.5 bg-surface-alt border border-line rounded-lg">
                      <div className="text-[10px] font-mono text-ink-subtle uppercase">Price Mult</div>
                      <div className="text-sm font-mono font-bold text-ink mt-0.5">{trade.priceMultiplier}</div>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-ink-subtle break-all">
                    Hook: <span className="text-ink-muted">{trade.sourceClass}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </UpdatedFrame>
      )}

      {/* Section 2: Loot Tables */}
      {(activeTab === 'all' || activeTab === 'loot') && (
        <UpdatedFrame id="sb_acquisition_loot" isUpdated={true}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent-text font-semibold">
              <Archive className="w-4 h-4" />
              <span>Loot Tables (v1.4.0)</span>
            </div>

            <div className="space-y-4">
              {lootTables.map((table) => {
                const Icon = getLootIcon(table.id);
                return (
                  <div key={table.id} className="p-5 bg-surface border border-line rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-accent-text shrink-0" />
                        <div>
                          <h3 className="font-display text-lg font-bold text-ink">{table.title}</h3>
                          <code className="text-[11px] font-mono text-ink-subtle">{table.lootType}</code>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-good-soft text-good-text border border-good-border">
                          {table.dropChance} Drop Rate
                        </span>
                        <span className="px-2.5 py-1 rounded text-xs font-mono bg-surface-alt text-ink border border-line">
                          Count: {table.countRange}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-2.5 bg-surface-alt border border-line rounded-lg">
                        <div className="text-[10px] text-ink-subtle uppercase">Pool Rolls</div>
                        <div className="text-ink font-semibold mt-0.5">{table.rolls}</div>
                      </div>
                      <div className="p-2.5 bg-surface-alt border border-line rounded-lg">
                        <div className="text-[10px] text-ink-subtle uppercase">Item Weight</div>
                        <div className="text-accent-text font-semibold mt-0.5">{table.itemWeight}</div>
                      </div>
                      <div className="p-2.5 bg-surface-alt border border-line rounded-lg">
                        <div className="text-[10px] text-ink-subtle uppercase">Empty Weight</div>
                        <div className="text-ink font-semibold mt-0.5">{table.emptyWeight}</div>
                      </div>
                      <div className="p-2.5 bg-surface-alt border border-line rounded-lg">
                        <div className="text-[10px] text-ink-subtle uppercase">Quantity Range</div>
                        <div className="text-ink font-semibold mt-0.5">{table.countRange}</div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-ink-muted">
                      <span>{table.notes}</span>
                      <code className="text-[10px] font-mono text-ink-subtle break-all shrink-0">{table.file}</code>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </UpdatedFrame>
      )}

      {/* Section 3: Recipe Advancement */}
      {(activeTab === 'all' || activeTab === 'advancement') && (
        <div className="p-5 bg-surface border border-line rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent-text font-semibold">
            <Award className="w-4 h-4" />
            <span>Recipe Book Advancement</span>
          </div>
          <h3 className="font-display text-lg font-bold text-ink">
            super_bonemeal:recipes/super_bonemeal_recipe
          </h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            Inherits from <code className="font-mono text-ink">minecraft:recipes/root</code> and unlocks <code className="font-mono text-accent-text">super_bonemeal:super_bonemeal_recipe</code> in the player&apos;s Recipe Book.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 bg-surface-alt border border-line rounded-lg space-y-1">
              <div className="text-ink font-semibold">Criterion 1: has_ingredient_0</div>
              <div className="text-ink-subtle">Trigger: minecraft:inventory_changed</div>
              <div className="text-accent-text">Item: minecraft:bone_block</div>
            </div>
            <div className="p-3.5 bg-surface-alt border border-line rounded-lg space-y-1">
              <div className="text-ink font-semibold">Criterion 2: has_the_recipe</div>
              <div className="text-ink-subtle">Trigger: minecraft:recipe_unlocked</div>
              <div className="text-accent-text">Recipe: super_bonemeal:super_bonemeal_recipe</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
