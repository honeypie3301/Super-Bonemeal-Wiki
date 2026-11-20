import React, { useState } from 'react';
import { Hammer, Flame, Scissors, Sparkles, RefreshCw } from 'lucide-react';
import recipeDataRaw from '@/recipe_details.json';

// Type declarations for our recipe structure
interface RecipeDetails {
  file: string;
  type: string;
  outputCount: number;
  pattern: string[] | null;
  keyMap: Record<string, { item?: string; tag?: string }> | null;
  ingredients: string[];
}

const recipeDetails = recipeDataRaw as Record<string, RecipeDetails[]>;

interface FancyRecipeViewProps {
  itemIds: string[];
  title?: string;
}

interface VisualSpec {
  short: string;
  name: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  glowClass: string;
}

// Visual spec helper for Minecraft items
function getItemVisualSpec(rawId: string): VisualSpec {
  if (!rawId) {
    return {
      short: '',
      name: '',
      bgClass: 'bg-[#080a08]',
      textClass: 'text-[#829285]',
      borderClass: 'border-[#151d16]',
      glowClass: 'shadow-none'
    };
  }
  
  const cleanId = rawId.replace('super_bonemeal:', '').replace('minecraft:', '').toLowerCase();
  const displayName = cleanId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const mapping: Record<string, { short: string; bg: string; text: string; border: string; glow: string }> = {
    'super_bonemeal': {
      short: 'Sbm',
      bg: 'bg-[#12261a]',
      text: 'text-[#86efac]',
      border: 'border-[#255739]',
      glow: 'group-hover:shadow-[0_0_12px_rgba(134,239,172,0.25)]'
    },
    'bone_block': {
      short: 'Bb',
      bg: 'bg-[#23221d]',
      text: 'text-[#f3f0e4]',
      border: 'border-[#4a473a]',
      glow: 'group-hover:shadow-[0_0_10px_rgba(243,240,228,0.18)]'
    },
    'bone_meal': {
      short: 'Bm',
      bg: 'bg-[#1c1d1e]',
      text: 'text-[#e2e8f0]',
      border: 'border-[#3e434a]',
      glow: 'group-hover:shadow-[0_0_10px_rgba(226,232,240,0.16)]'
    },
    'emerald': {
      short: 'Em',
      bg: 'bg-[#0f2419]',
      text: 'text-[#34d399]',
      border: 'border-[#1d5438]',
      glow: 'group-hover:shadow-[0_0_10px_rgba(52,211,153,0.2)]'
    }
  };

  if (mapping[cleanId]) {
    return {
      short: mapping[cleanId].short,
      name: displayName,
      bgClass: mapping[cleanId].bg,
      textClass: mapping[cleanId].text,
      borderClass: mapping[cleanId].border,
      glowClass: mapping[cleanId].glow
    };
  }

  // Automatic abbreviation rules
  const words = cleanId.split('_');
  let abbrev = '';
  if (words.length >= 3) {
    abbrev = (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  } else if (words.length === 2) {
    abbrev = (words[0][0] + words[1][0]).toUpperCase();
  } else if (cleanId.length > 0) {
    abbrev = cleanId[0].toUpperCase() + (cleanId[1] || '').toLowerCase();
  } else {
    abbrev = '?';
  }

  // Fallback styling: neutral high-quality dark-greenish gray
  return {
    short: abbrev,
    name: displayName,
    bgClass: 'bg-[#0d100d]',
    textClass: 'text-[#a9d1b0]',
    borderClass: 'border-[#223024]',
    glowClass: 'group-hover:shadow-[0_0_8px_rgba(169,209,176,0.1)]'
  };
}

// Helper to sanitize internal names for display
function getCleanName(rawId: string): string {
  if (!rawId) return '';
  const name = rawId.replace('super_bonemeal:', '').replace('minecraft:', '');
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const itemIdMapping: Record<string, string> = {};

export default function FancyRecipeView({ itemIds, title }: FancyRecipeViewProps) {
  const [activeRecipeIndex, setActiveRecipeIndex] = useState<Record<string, number>>({});

  // Gather all recipes for the given item IDs
  const itemsWithRecipes = itemIds
    .map(id => {
      const cleanId = id.startsWith('super_bonemeal:') ? id.replace('super_bonemeal:', '') : id;
      const mappedId = itemIdMapping[cleanId] || id;
      const normalizedId = mappedId.includes(':') ? mappedId : `super_bonemeal:${mappedId}`;
      const recipes = recipeDetails[normalizedId] || [];
      return { id: normalizedId, name: getCleanName(normalizedId), recipes };
    })
    .filter(item => item.recipes.length > 0);

  if (itemsWithRecipes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 mt-4 select-text">
      {title && (
        <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#709978] mb-3 flex items-center gap-1.5 font-bold">
          <Hammer className="w-3.5 h-3.5" />
          {title}
        </h4>
      )}

      <div className="space-y-4">
        {itemsWithRecipes.map(item => {
          const recipes = item.recipes;
          const currentIndex = activeRecipeIndex[item.id] || 0;
          const recipe = recipes[currentIndex];
          if (!recipe) return null;

          const isMultiRecipe = recipes.length > 1;

          // Render appropriate layout based on recipe type
          const isSmelting = recipe.type.includes('smelting') || recipe.type.includes('blasting');
          const isStonecutting = recipe.type.includes('stonecutting');
          const isSmithing = recipe.type.includes('smithing') || (recipe.ingredients.length === 2 && recipe.ingredients.some(i => i.includes('sword') || i.includes('tool')) && recipe.ingredients.some(i => i.includes('shard')));
          const isBrewing = recipe.type.includes('brewing') || recipe.type.includes('brew');

          const outputSpec = getItemVisualSpec(item.id);

          return (
            <div 
              key={item.id} 
              className="bg-[#050605] border border-[#141b15] rounded-xl p-4 sm:p-5 relative transition-all hover:border-[#1e2a1f]"
            >
              <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 blur-2xl rounded-full" />
              </div>

              {/* Recipe Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#121813]/60">
                <div>
                  <span className="text-[10px] font-mono text-[#5a6b5e] uppercase tracking-wider">
                    {recipe.type.replace('minecraft:', '').replace('_', ' ').toUpperCase()}
                  </span>
                  <h5 className="font-serif text-sm font-bold text-[#e0e7e0] mt-0.5">
                    {item.name} <span className="text-xs text-[#829285] font-normal font-sans">(Yield: x{recipe.outputCount})</span>
                  </h5>
                </div>

                {isMultiRecipe && (
                  <button
                    onClick={() => {
                      const nextIdx = (currentIndex + 1) % recipes.length;
                      setActiveRecipeIndex(prev => ({ ...prev, [item.id]: nextIdx }));
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-[#111612] border border-[#1e2820] text-[#709978] rounded hover:text-[#a9d1b0] hover:border-[#2e3e31] transition-all cursor-pointer select-none"
                  >
                    <RefreshCw className="w-3 h-3 animate-spin-hover" />
                    Recipe {currentIndex + 1}/{recipes.length}
                  </button>
                )}
              </div>

              {/* Responsive Visual-First Stacked Layout */}
              <div className="flex flex-col gap-4">
                {/* 1. Visual Assembly Stage */}
                <div className="w-full py-4 px-4 sm:px-6 bg-[#080a08]/40 rounded-lg border border-[#111712] relative z-10 flex justify-center items-center">
                  <div className="w-full max-w-sm flex justify-center items-center">
                    {isSmelting ? (
                    <div className="flex items-center gap-3 sm:gap-4 flex-nowrap justify-center w-full">
                      {/* Furnace Input Slot */}
                      {(() => {
                        const rawInput = recipe.ingredients.find(i => i.startsWith('Input: '))?.replace('Input: ', '') || recipe.ingredients[0] || '';
                        const spec = getItemVisualSpec(rawInput);
                        return (
                          <div className="relative group shrink-0 hover:z-30">
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 border rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 cursor-help ${spec.bgClass} ${spec.borderClass} ${spec.textClass} ${spec.glowClass} hover:border-[#709978] shrink-0`}>
                              <span className="text-[9px] sm:text-[10px] font-mono font-bold">{spec.short}</span>
                            </div>
                            {/* Tooltip */}
                            <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#080a08] border border-[#223024] text-xs font-mono p-2 rounded shadow-2xl z-25 flex flex-col items-center gap-0.5 min-w-[120px]">
                              <span className="text-[#a9d1b0] font-bold font-serif text-center whitespace-nowrap">{spec.name}</span>
                              <span className="text-[9px] text-[#5a6b5e] uppercase tracking-wider">{rawInput}</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#223024]" />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Fire indicator */}
                      <div className="flex flex-col items-center text-amber-500 animate-pulse shrink-0">
                        <Flame className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-amber-500" />
                        <span className="text-[7px] sm:text-[8px] font-mono text-amber-500/80 mt-0.5 uppercase tracking-wider">SMELT</span>
                      </div>

                      {/* Arrow */}
                      <div className="text-[#3a4f3e] font-bold text-sm sm:text-base select-none shrink-0">→</div>

                      {/* Furnace Output Slot */}
                      <div className="relative group shrink-0 hover:z-30">
                        <div className={`w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 border-2 rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 ${outputSpec.bgClass} ${outputSpec.borderClass} ${outputSpec.textClass} ${outputSpec.glowClass} shrink-0`}>
                          <span className="text-xs sm:text-sm font-mono font-bold">{outputSpec.short}</span>
                        </div>
                        <span className="absolute bottom-0.5 right-0.5 bg-[#121613] border border-[#303d33] px-1 text-[8px] sm:text-[9px] font-mono text-amber-400 font-bold rounded">
                          x{recipe.outputCount}
                        </span>
                        {/* Tooltip */}
                        <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#080a08] border border-[#223024] text-xs font-mono p-2 rounded shadow-2xl z-25 flex flex-col items-center gap-0.5 min-w-[120px]">
                          <span className="text-[#a9d1b0] font-bold font-serif text-center whitespace-nowrap">{outputSpec.name}</span>
                          <span className="text-[9px] text-[#5a6b5e] uppercase tracking-wider">{item.id}</span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#223024]" />
                        </div>
                      </div>
                    </div>
                  ) : isStonecutting ? (
                    <div className="flex items-center gap-3 sm:gap-4 flex-nowrap justify-center w-full">
                      {/* Stonecutter Input Slot */}
                      {(() => {
                        const rawInput = recipe.ingredients[0] || '';
                        const spec = getItemVisualSpec(rawInput);
                        return (
                          <div className="relative group shrink-0 hover:z-30">
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 border rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 cursor-help ${spec.bgClass} ${spec.borderClass} ${spec.textClass} ${spec.glowClass} hover:border-[#709978] shrink-0`}>
                              <span className="text-[9px] sm:text-[10px] font-mono font-bold">{spec.short}</span>
                            </div>
                            {/* Tooltip */}
                            <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#080a08] border border-[#223024] text-xs font-mono p-2 rounded shadow-2xl z-25 flex flex-col items-center gap-0.5 min-w-[120px]">
                              <span className="text-[#a9d1b0] font-bold font-serif text-center whitespace-nowrap">{spec.name}</span>
                              <span className="text-[9px] text-[#5a6b5e] uppercase tracking-wider">{rawInput}</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#223024]" />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Stonecutter icon */}
                      <div className="flex flex-col items-center text-[#829285] shrink-0">
                        <Scissors className="w-4 h-4 sm:w-5 sm:h-5 -rotate-95" />
                        <span className="text-[7px] sm:text-[8px] font-mono text-[#5a6b5e] mt-0.5 uppercase tracking-wider">CUT</span>
                      </div>

                      {/* Arrow */}
                      <div className="text-[#3a4f3e] font-bold text-sm sm:text-base select-none shrink-0">→</div>

                      {/* Output Slot */}
                      <div className="relative group shrink-0 hover:z-30">
                        <div className={`w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 border-2 rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 ${outputSpec.bgClass} ${outputSpec.borderClass} ${outputSpec.textClass} ${outputSpec.glowClass} shrink-0`}>
                          <span className="text-xs sm:text-sm font-mono font-bold">{outputSpec.short}</span>
                        </div>
                        <span className="absolute bottom-0.5 right-0.5 bg-[#121613] border border-[#303d33] px-1 text-[8px] sm:text-[9px] font-mono text-[#a9d1b0] font-bold rounded">
                          x{recipe.outputCount}
                        </span>
                        {/* Tooltip */}
                        <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#080a08] border border-[#223024] text-xs font-mono p-2 rounded shadow-2xl z-25 flex flex-col items-center gap-0.5 min-w-[120px]">
                          <span className="text-[#a9d1b0] font-bold font-serif text-center whitespace-nowrap">{outputSpec.name}</span>
                          <span className="text-[9px] text-[#5a6b5e] uppercase tracking-wider">{item.id}</span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#223024]" />
                        </div>
                      </div>
                    </div>
                  ) : isSmithing ? (
                    <div className="flex items-center gap-2 sm:gap-3 flex-nowrap justify-center w-full">
                      {/* Base Item */}
                      {(() => {
                        const rawInput = recipe.ingredients[0] || '';
                        const spec = getItemVisualSpec(rawInput);
                        return (
                          <div className="relative group shrink-0 hover:z-30">
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 border rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 cursor-help ${spec.bgClass} ${spec.borderClass} ${spec.textClass} ${spec.glowClass} hover:border-[#709978] shrink-0`}>
                              <span className="text-[9px] sm:text-[10px] font-mono font-bold">{spec.short}</span>
                            </div>
                            {/* Tooltip */}
                            <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#080a08] border border-[#223024] text-xs font-mono p-2 rounded shadow-2xl z-20 flex flex-col items-center gap-0.5 min-w-[120px]">
                              <span className="text-[#a9d1b0] font-bold font-serif text-center whitespace-nowrap">{spec.name}</span>
                              <span className="text-[9px] text-[#5a6b5e] uppercase tracking-wider">Base: {rawInput}</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#223024]" />
                            </div>
                          </div>
                        );
                      })()}

                      <div className="text-[#5a6b5e] font-bold text-xs sm:text-sm shrink-0">+</div>

                      {/* Upgrade Material */}
                      {(() => {
                        const rawInput = recipe.ingredients[1] || '';
                        const spec = getItemVisualSpec(rawInput);
                        return (
                          <div className="relative group shrink-0 hover:z-30">
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 border rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 cursor-help ${spec.bgClass} ${spec.borderClass} ${spec.textClass} ${spec.glowClass} hover:border-[#709978] shrink-0`}>
                              <span className="text-[9px] sm:text-[10px] font-mono font-bold">{spec.short}</span>
                            </div>
                            {/* Tooltip */}
                            <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#080a08] border border-[#223024] text-xs font-mono p-2 rounded shadow-2xl z-20 flex flex-col items-center gap-0.5 min-w-[120px]">
                              <span className="text-[#a9d1b0] font-bold font-serif text-center whitespace-nowrap">{spec.name}</span>
                              <span className="text-[9px] text-[#5a6b5e] uppercase tracking-wider">Upgrade: {rawInput}</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#223024]" />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Arrow */}
                      <div className="text-[#3a4f3e] font-bold text-sm sm:text-base select-none shrink-0">→</div>

                      {/* Result */}
                      <div className="relative group shrink-0 hover:z-30">
                        <div className={`w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 border-2 rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 ${outputSpec.bgClass} ${outputSpec.borderClass} ${outputSpec.textClass} ${outputSpec.glowClass} shrink-0`}>
                          <span className="text-xs sm:text-sm font-mono font-bold">{outputSpec.short}</span>
                        </div>
                        <span className="absolute bottom-0.5 right-0.5 bg-[#121613] border border-[#303d33] px-1 text-[8px] sm:text-[9px] font-mono text-emerald-400 font-bold rounded">
                          x{recipe.outputCount}
                        </span>
                        {/* Tooltip */}
                        <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#080a08] border border-[#223024] text-xs font-mono p-2 rounded shadow-2xl z-20 flex flex-col items-center gap-0.5 min-w-[120px]">
                          <span className="text-[#a9d1b0] font-bold font-serif text-center whitespace-nowrap">{outputSpec.name}</span>
                          <span className="text-[9px] text-[#5a6b5e] uppercase tracking-wider">{item.id}</span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#223024]" />
                        </div>
                      </div>
                    </div>
                  ) : isBrewing ? (
                    <div className="flex items-center gap-3 sm:gap-4 flex-nowrap justify-center w-full">
                      {/* Ingredient / Brew Agent (Top Center/Left) */}
                      {(() => {
                        const rawInput = recipe.ingredients[0] || '';
                        const spec = getItemVisualSpec(rawInput);
                        return (
                          <div className="relative group shrink-0 hover:z-30">
                            <div className="text-[8px] font-mono text-[#5a6b5e] uppercase tracking-wider mb-1 text-center font-semibold">Agent</div>
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 border rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 cursor-help ${spec.bgClass} ${spec.borderClass} ${spec.textClass} ${spec.glowClass} hover:border-[#709978] shrink-0`}>
                              <span className="text-[9px] sm:text-[10px] font-mono font-bold">{spec.short}</span>
                            </div>
                            {/* Tooltip */}
                            <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#080a08] border border-[#223024] text-xs font-mono p-2 rounded shadow-2xl z-20 flex flex-col items-center gap-0.5 min-w-[120px]">
                              <span className="text-[#a9d1b0] font-bold font-serif text-center whitespace-nowrap">{spec.name}</span>
                              <span className="text-[9px] text-[#5a6b5e] uppercase tracking-wider">{rawInput}</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#223024]" />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Sparkly / bubble indicator */}
                      <div className="flex flex-col items-center text-emerald-400 animate-pulse shrink-0 mt-4">
                        <Sparkles className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-emerald-500/20" />
                        <span className="text-[7px] sm:text-[8px] font-mono text-emerald-400/80 mt-0.5 uppercase tracking-wider">BREW</span>
                      </div>

                      {/* Reagent / Base bottle */}
                      {(() => {
                        const rawInput = recipe.ingredients[1] || '';
                        const spec = getItemVisualSpec(rawInput);
                        return (
                          <div className="relative group shrink-0 hover:z-30">
                            <div className="text-[8px] font-mono text-[#5a6b5e] uppercase tracking-wider mb-1 text-center font-semibold">Base</div>
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 border rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 cursor-help ${spec.bgClass} ${spec.borderClass} ${spec.textClass} ${spec.glowClass} hover:border-[#709978] shrink-0`}>
                              <span className="text-[9px] sm:text-[10px] font-mono font-bold">{spec.short}</span>
                            </div>
                            {/* Tooltip */}
                            <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#080a08] border border-[#223024] text-xs font-mono p-2 rounded shadow-2xl z-20 flex flex-col items-center gap-0.5 min-w-[120px]">
                              <span className="text-[#a9d1b0] font-bold font-serif text-center whitespace-nowrap">{spec.name}</span>
                              <span className="text-[9px] text-[#5a6b5e] uppercase tracking-wider">{rawInput}</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#223024]" />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Arrow */}
                      <div className="text-[#3a4f3e] font-bold text-sm sm:text-base select-none shrink-0 mt-4">→</div>

                      {/* Output Potion Result */}
                      <div className="relative group shrink-0 hover:z-30">
                        <div className="text-[8px] font-mono text-[#5a6b5e] uppercase tracking-wider mb-1 text-center font-semibold">Product</div>
                        <div className={`w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 border-2 rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 ${outputSpec.bgClass} ${outputSpec.borderClass} ${outputSpec.textClass} ${outputSpec.glowClass} shrink-0`}>
                          <span className="text-xs sm:text-sm font-mono font-bold">{outputSpec.short}</span>
                        </div>
                        <span className="absolute bottom-0.5 right-0.5 bg-[#121613] border border-[#303d33] px-1 text-[8px] sm:text-[9px] font-mono text-[#a9d1b0] font-bold rounded">
                          x{recipe.outputCount}
                        </span>
                        {/* Tooltip */}
                        <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#080a08] border border-[#223024] text-xs font-mono p-2 rounded shadow-2xl z-25 flex flex-col items-center gap-0.5 min-w-[120px]">
                          <span className="text-[#a9d1b0] font-bold font-serif text-center whitespace-nowrap">{outputSpec.name}</span>
                          <span className="text-[9px] text-[#5a6b5e] uppercase tracking-wider">{item.id}</span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#223024]" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Default / Standard 3x3 Grid
                    <div className="flex items-center gap-3 sm:gap-4 flex-nowrap justify-center w-full">
                      {/* 3x3 Grid Layout */}
                      <div className="grid grid-cols-3 gap-1 bg-[#090b09] p-2 rounded-xl border border-[#1b251d] shadow-[inset_0_2px_10px_rgba(0,0,0,0.9)] shrink-0">
                        {(() => {
                          const pattern = recipe.pattern || ["abc", "def", "ghi"];
                          const isShapeless = recipe.type === 'minecraft:crafting_shapeless';

                          const cells = [];

                          if (isShapeless) {
                            // Shapeless ingredients mapped in sequence
                            for (let idx = 0; idx < 9; idx++) {
                                const ingredient = recipe.ingredients[idx];
                                if (ingredient) {
                                  const spec = getItemVisualSpec(ingredient);
                                  cells.push(
                                    <div key={idx} className="relative group shrink-0 hover:z-30">
                                      <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 border rounded-lg flex flex-col items-center justify-center p-0.5 shadow-inner transition-all duration-200 cursor-help ${spec.bgClass} ${spec.borderClass} ${spec.textClass} ${spec.glowClass} hover:border-[#709978] shrink-0`}>
                                        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-mono font-bold">{spec.short}</span>
                                      </div>
                                      {/* Tooltip */}
                                      <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#080a08] border border-[#223024] text-xs font-mono p-2 rounded shadow-2xl z-30 flex flex-col items-center gap-0.5 min-w-[125px]">
                                        <span className="text-[#a9d1b0] font-bold font-serif text-center whitespace-nowrap">{spec.name}</span>
                                        <span className="text-[9px] text-[#5a6b5e] uppercase tracking-wider">{ingredient.replace('super_bonemeal:', '').replace('minecraft:', '')}</span>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#223024]" />
                                      </div>
                                    </div>
                                  );
                                } else {
                                  cells.push(
                                    <div key={idx} className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-[#040504] border border-[#121612] rounded-lg shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.85)] opacity-25 shrink-0" />
                                  );
                                }
                            }
                          } else {
                            // Shaped pattern mapping
                            for (let r = 0; r < 3; r++) {
                              const row = pattern[r] || '   ';
                              for (let c = 0; c < 3; c++) {
                                const char = row[c] || ' ';
                                if (char !== ' ') {
                                  const keyVal = recipe.keyMap?.[char];
                                  const fullItemName = keyVal?.item ? keyVal.item : (keyVal?.tag ? `#${keyVal.tag}` : char);
                                  const spec = getItemVisualSpec(fullItemName);
                                  cells.push(
                                    <div key={`${r}-${c}`} className="relative group shrink-0 hover:z-30">
                                      <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 border rounded-lg flex flex-col items-center justify-center p-0.5 shadow-inner transition-all duration-200 cursor-help ${spec.bgClass} ${spec.borderClass} ${spec.textClass} ${spec.glowClass} hover:border-[#709978] shrink-0`}>
                                        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-mono font-bold">{spec.short}</span>
                                      </div>
                                      {/* Tooltip */}
                                      <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#080a08] border border-[#223024] text-xs font-mono p-2 rounded shadow-2xl z-30 flex flex-col items-center gap-0.5 min-w-[125px]">
                                        <span className="text-[#a9d1b0] font-bold font-serif text-center whitespace-nowrap">{spec.name}</span>
                                        <span className="text-[9px] text-[#5a6b5e] uppercase tracking-wider">{fullItemName.replace('super_bonemeal:', '').replace('minecraft:', '')}</span>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#223024]" />
                                      </div>
                                    </div>
                                  );
                                } else {
                                  cells.push(
                                    <div key={`${r}-${c}`} className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-[#040504] border border-[#121612] rounded-lg shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.85)] opacity-25 shrink-0" />
                                  );
                                }
                              }
                            }
                          }

                          return cells;
                        })()}
                      </div>

                      {/* Arrow */}
                      <div className="text-[#3a4f3e] font-bold text-base sm:text-lg select-none animate-pulse shrink-0">→</div>

                      {/* Large Output Slot */}
                      <div className="relative group shrink-0 hover:z-30">
                        <div className={`w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 border-2 rounded-xl flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-300 ${outputSpec.bgClass} ${outputSpec.borderClass} ${outputSpec.textClass} ${outputSpec.glowClass} shrink-0`}>
                          <span className="text-xs sm:text-sm font-mono font-bold tracking-tight">{outputSpec.short}</span>
                        </div>
                        <span className="absolute bottom-0.5 right-0.5 bg-[#121613] border border-[#303d33] px-1 py-0.5 text-[8px] sm:text-[9px] font-mono text-[#a9d1b0] font-bold rounded shadow-md z-10 select-none">
                          x{recipe.outputCount}
                        </span>
                        {/* Tooltip */}
                        <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#080a08] border border-[#223024] text-xs font-mono p-2 rounded shadow-2xl z-20 flex flex-col items-center gap-0.5 min-w-[120px]">
                          <span className="text-[#a9d1b0] font-bold font-serif text-center whitespace-nowrap">{outputSpec.name}</span>
                          <span className="text-[9px] text-[#5a6b5e] uppercase tracking-wider">{item.id}</span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#223024]" />
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>

                {/* 2. Textual Specifications (Split cleanly on wider screens, stacked on small mobile) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#121813]/60">
                  {/* Ingredients */}
                  <div>
                    <h6 className="text-[10px] font-mono uppercase tracking-wider text-[#5a6b5e] mb-1.5 font-bold">Ingredients Inventory</h6>
                    <ul className="text-xs text-[#829285] space-y-1 font-mono list-disc pl-4">
                      {recipe.ingredients.map((ing, idx) => {
                        let cleanText = ing;
                        if (ing.includes(' = ')) {
                          const parts = ing.split(' = ');
                          cleanText = `${parts[0].toUpperCase()}: ${getCleanName(parts[1])}`;
                        } else if (ing.startsWith('Input: ')) {
                          cleanText = `INPUT: ${getCleanName(ing.replace('Input: ', ''))}`;
                        } else {
                          cleanText = getCleanName(ing);
                        }

                        return (
                          <li key={idx} className="leading-relaxed">
                            <span className="text-[#c9d1c9]">{cleanText}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Metadata & File Info */}
                  <div className="flex flex-col justify-between text-[9px] font-mono text-[#5a6b5e] space-y-2">
                    <div className="space-y-1.5">
                      <div className="leading-normal">
                        Recipe source file:<br />
                        <span className="text-[#405244] break-all select-all hover:text-[#709978] transition-colors">{recipe.file}</span>
                      </div>
                      
                      {recipe.type === 'minecraft:crafting_shapeless' && (
                        <div className="inline-block bg-[#1b1c1b] border border-[#262c26] px-1.5 py-0.5 rounded text-[8px] text-[#829285] font-bold tracking-wider uppercase">
                          Shapeless Crafting
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
