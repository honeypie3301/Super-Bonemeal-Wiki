import React, { useState } from 'react';
import {
  Package, Search, Sparkles, Compass, Sprout, Layers
} from 'lucide-react';
import UpdatedFrame from '../UpdatedFrame';
import FancyRecipeView from './FancyRecipeView';
import { trackTelemetryClick } from '../../utils/telemetry';

interface ItemData {
  id: string;
  name: string;
  category: 'utility' | 'ingredients';
  desc: string;
  isUpdated?: boolean;
  stats?: { label: string; value: string }[];
  recipes?: string[];
  notes?: string[];
}

export default function ItemsView() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('super_bonemeal');

  const categories = [
    { id: 'all', name: 'All Entries', icon: Package },
    { id: 'utility', name: 'Mod Items', icon: Sparkles },
    { id: 'ingredients', name: 'Crafting Ingredients', icon: Layers }
  ];

  const items: ItemData[] = [
    {
      id: 'super_bonemeal',
      name: 'Super Bone Meal',
      category: 'utility',
      isUpdated: true,
      desc: 'An upgraded fertilizer item that accelerates a single crop, sapling, or moss block 10 times on direct click, or sweeps a massive 50×2×50 area around terrain to revitalize landscapes in a single click.',
      stats: [
        { label: 'Registry ID', value: 'super_bonemeal:super_bonemeal' },
        { label: 'Rarity Tier', value: 'UNCOMMON' },
        { label: 'Creative Tab', value: 'Functional Blocks' },
        { label: 'Craft Output', value: '2 per craft (Shapeless)' },
        { label: 'Area Radius', value: '50 × 2 × 50 blocks (10% chance)' },
        { label: 'Targeted Boost', value: '10× consecutive bonemeal passes' }
      ],
      recipes: ['super_bonemeal:super_bonemeal'],
      notes: [
        'Lang Key: "item.super_bonemeal.super_bonemeal": "Super Bone Meal".',
        'Model Parent: "item/generated" using texture "super_bonemeal:item/super_bone_meal".',
        'Targeted Mode: Clicking Moss Block, minecraft:saplings, minecraft:crops, c:saplings, or snowrealmagic:plants applies 10 growth iterations directly without sweeping surrounding terrain.',
        'Area Mode: Clicking any other block scans (x-25, y-1, z-25) across 50×2×50 blocks, skipping Blocks.SHORT_GRASS and rolling a 10% chance to grow crops or water plants.',
        'Consumes 1 item per use in Survival/Adventure mode; preserved when player has Creative instabuild.'
      ]
    },
    {
      id: 'bone_block',
      name: 'Bone Block',
      category: 'ingredients',
      desc: 'Vanilla compressed bone block used both as a shapeless crafting ingredient (4× required per craft) and as the recipe book advancement trigger.',
      stats: [
        { label: 'Registry ID', value: 'minecraft:bone_block' },
        { label: 'Quantity Per Craft', value: '4' },
        { label: 'Advancement Trigger', value: 'has_ingredient_0 (inventory_changed)' }
      ],
      notes: [
        'Obtaining a Bone Block in your inventory satisfies the "has_ingredient_0" criterion in super_bonemeal:recipes/super_bonemeal_recipe.'
      ]
    },
    {
      id: 'bone_meal',
      name: 'Bone Meal',
      category: 'ingredients',
      desc: 'Vanilla fertilizer consumed in bulk (5× per craft) alongside 4 Bone Blocks to yield 2 Super Bone Meal.',
      stats: [
        { label: 'Registry ID', value: 'minecraft:bone_meal' },
        { label: 'Quantity Per Craft', value: '5' },
        { label: 'Total Bone Meal Equivalent', value: '41 Bone Meal (4×9 + 5) → 2 Super Bone Meal' }
      ],
      notes: [
        'Because 1 Bone Block equals 9 Bone Meal, crafting 2 Super Bone Meal costs 41 vanilla Bone Meal (20.5 Bone Meal per Super Bone Meal).'
      ]
    }
  ];

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      (item.notes?.some((n) => n.toLowerCase().includes(q)) ?? false);
    return matchesCat && matchesSearch;
  });

  const activeItem = items.find((i) => i.id === selectedItemId) || filteredItems[0] || items[0];

  return (
    <div className="space-y-8 max-w-[1000px] mx-auto text-ink-muted select-text">

      {/* Filter & Search Bar */}
      <div className="p-4 bg-surface border border-line rounded-xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  trackTelemetryClick({ page: 'items', target: cat.name, category: 'filter' });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  active
                    ? 'bg-accent-soft text-accent-text border-accent-border font-semibold'
                    : 'bg-surface-alt text-ink-muted border-line hover:text-ink'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[210px]">
          <Search className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter items..."
            className="w-full bg-surface-alt border border-line rounded-lg py-1.5 pl-8.5 pr-3 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Item Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {filteredItems.map((item) => {
          const isSelected = activeItem?.id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setSelectedItemId(item.id);
                trackTelemetryClick({ page: 'items', target: item.name, category: 'item' });
              }}
              className={`text-left p-4 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                isSelected
                  ? 'bg-accent-soft border-accent-border'
                  : 'bg-surface border-line hover:border-accent/40 hover:bg-surface-alt'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display font-semibold text-sm text-ink">{item.name}</span>
                {item.isUpdated && (
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface border border-accent-border text-accent-text">
                    Core
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-ink-subtle truncate">{item.id}</div>
            </button>
          );
        })}
      </div>

      {/* Active Item Detail Panel */}
      {activeItem && (
        <UpdatedFrame id={`sb_item_${activeItem.id}`} isUpdated={Boolean(activeItem.isUpdated)}>
          <div className="p-6 bg-surface border border-line rounded-xl space-y-6">
            <div className="border-b border-line pb-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-2xl font-bold text-ink">{activeItem.name}</h2>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-surface-alt border border-line text-accent-text">
                  {activeItem.category === 'utility' ? 'Mod Item' : 'Vanilla Ingredient'}
                </span>
              </div>
              <p className="text-sm text-ink-muted leading-relaxed">{activeItem.desc}</p>
            </div>

            {activeItem.stats && activeItem.stats.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeItem.stats.map((stat) => (
                  <div key={stat.label} className="p-3 bg-surface-alt border border-line rounded-lg">
                    <div className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider">{stat.label}</div>
                    <div className="text-xs font-mono font-semibold text-ink mt-1 break-all">{stat.value}</div>
                  </div>
                ))}
              </div>
            )}

            {activeItem.recipes && activeItem.recipes.length > 0 && (
              <FancyRecipeView itemIds={activeItem.recipes} title="Crafting Recipe (3×3 Shapeless)" />
            )}

            {activeItem.notes && activeItem.notes.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-line-soft">
                <div className="text-xs font-mono uppercase tracking-wider text-ink-subtle font-semibold flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-accent-text" />
                  <span>Implementation Notes</span>
                </div>
                <ul className="space-y-1.5 text-xs text-ink-muted list-disc list-inside font-mono">
                  {activeItem.notes.map((note, idx) => (
                    <li key={idx} className="leading-relaxed">{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </UpdatedFrame>
      )}

      {/* Material Value Breakdown */}
      <div className="p-5 bg-surface border border-line rounded-xl flex items-start gap-3">
        <Compass className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
        <div className="text-xs text-ink-muted leading-relaxed">
          <strong className="text-ink">Economy Tip:</strong> Crafting 2 Super Bone Meal takes 4 Bone Blocks + 5 Bone Meal (41 Bone Meal total, or 20.5 per item). Apprentice Farmer Villagers sell <strong className="text-accent-text">2 Super Bone Meal for just 1 Emerald</strong>—making villager trading dramatically cheaper once established.
        </div>
      </div>

    </div>
  );
}
