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

// Visual spec helper for Minecraft & Mod items
function getItemVisualSpec(rawId: string): VisualSpec {
  if (!rawId) {
    return {
      short: '',
      name: '',
      bgClass: 'bg-[#120f0c]',
      textClass: 'text-[#8c7e6c]',
      borderClass: 'border-[#261e16]',
      glowClass: 'shadow-none'
    };
  }
  
  const cleanId = rawId.replace('super_bonemeal:', '').replace('the_backwoods:', '').replace('minecraft:', '').toLowerCase();
  const displayName = cleanId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Mapping for mod materials and ingredients
  const mapping: Record<string, { short: string; bg: string; text: string; border: string; glow: string }> = {
    // Super Bone Meal items
    'super_bonemeal': { short: 'Sbm', bg: 'bg-[#251c14]', text: 'text-[#d4b28c]', border: 'border-[#6e5539]', glow: 'group-hover:shadow-[0_0_12px_rgba(212,178,140,0.3)]' },
    'super_bone_meal': { short: 'Sbm', bg: 'bg-[#251c14]', text: 'text-[#d4b28c]', border: 'border-[#6e5539]', glow: 'group-hover:shadow-[0_0_12px_rgba(212,178,140,0.3)]' },
    'bone_block': { short: 'Bb', bg: 'bg-[#1e1914]', text: 'text-[#fbf7f0]', border: 'border-[#4c3d2e]', glow: 'group-hover:shadow-[0_0_10px_rgba(252,231,243,0.15)]' },
    'bone_meal': { short: 'Bm', bg: 'bg-[#221c16]', text: 'text-[#ede4d4]', border: 'border-[#483a2d]', glow: '' },
    'emerald': { short: 'Em', bg: 'bg-[#0e2417]', text: 'text-[#4ade80]', border: 'border-[#1b5e35]', glow: 'group-hover:shadow-[0_0_10px_rgba(74,222,128,0.2)]' },

    // Wood & organic elements
    'oak_sapling': { short: 'Os', bg: 'bg-[#122416]', text: 'text-[#4ade80]', border: 'border-[#1e4828]', glow: '' },
    'spruce_sapling': { short: 'Ss', bg: 'bg-[#0f2117]', text: 'text-[#34d399]', border: 'border-[#1b432a]', glow: '' },
    'birch_sapling': { short: 'Bs', bg: 'bg-[#1a291a]', text: 'text-[#86efac]', border: 'border-[#2d4c2d]', glow: '' },
    'jungle_sapling': { short: 'Js', bg: 'bg-[#152e18]', text: 'text-[#22c55e]', border: 'border-[#1f5624]', glow: '' },
    'acacia_sapling': { short: 'As', bg: 'bg-[#291e12]', text: 'text-[#f97316]', border: 'border-[#543b1a]', glow: '' },
    'dark_oak_sapling': { short: 'Dos', bg: 'bg-[#1f1712]', text: 'text-[#c2410c]', border: 'border-[#442d1e]', glow: '' },
    'mangrove_propagule': { short: 'Mp', bg: 'bg-[#1f1a14]', text: 'text-[#a16207]', border: 'border-[#42331f]', glow: '' },
    'cherry_sapling': { short: 'Cs', bg: 'bg-[#261b14]', text: 'text-[#d4b28c]', border: 'border-[#594230]', glow: 'group-hover:shadow-[0_0_10px_rgba(244,114,182,0.2)]' },
    'sugar_cane': { short: 'Sc', bg: 'bg-[#132918]', text: 'text-[#4ade80]', border: 'border-[#22542a]', glow: '' },
    'bamboo': { short: 'Ba', bg: 'bg-[#172913]', text: 'text-[#84cc16]', border: 'border-[#2b4c19]', glow: '' },
    'wheat_seeds': { short: 'Ws', bg: 'bg-[#242111]', text: 'text-[#eab308]', border: 'border-[#4e4518]', glow: '' },
    'moss_block': { short: 'Mb', bg: 'bg-[#122616]', text: 'text-[#22c55e]', border: 'border-[#1e4d25]', glow: '' }
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

  // Fallback styling: neutral luxurious beige slate
  return {
    short: abbrev,
    name: displayName,
    bgClass: 'bg-[#191410]',
    textClass: 'text-[#dfc9ab]',
    borderClass: 'border-[#3a2e22]',
    glowClass: 'group-hover:shadow-[0_0_8px_rgba(223,201,171,0.2)]'
  };
}

// Helper to sanitize internal names for display
function getCleanName(rawId: string): string {
  if (!rawId) return '';
  let name = rawId.replace('super_bonemeal:', '').replace('the_backwoods:', '').replace('minecraft:', '');
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Map the display item IDs from ItemsView.tsx to their real Minecraft registry names
const itemIdMapping: Record<string, string> = {
  'super_bonemeal': 'super_bonemeal:super_bonemeal',
  'super_bone_meal': 'super_bonemeal:super_bonemeal',
};

export default function FancyRecipeView({ itemIds, title }: FancyRecipeViewProps) {
  const [activeRecipeIndex, setActiveRecipeIndex] = useState<Record<string, number>>({});

  // Gather all recipes for the given item IDs
  const itemsWithRecipes = itemIds
    .map(id => {
      const cleanId = id.replace('super_bonemeal:', '').replace('the_backwoods:', '').replace('minecraft:', '');
      const mappedId = itemIdMapping[cleanId] || (id.includes(':') ? id : `super_bonemeal:${id}`);
      
      const recipes = recipeDetails[mappedId] || recipeDetails[`super_bonemeal:${cleanId}`] || recipeDetails[id] || [];
      return { id: mappedId, name: getCleanName(mappedId), recipes };
    })
    .filter(item => item.recipes && item.recipes.length > 0);

  if (itemsWithRecipes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 mt-4 select-text">
      {title && (
        <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#d4b28c] mb-3 flex items-center gap-1.5 font-bold">
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
          const isSmithing = recipe.type.includes('smithing');
          const isBrewing = recipe.type.includes('brewing') || recipe.type.includes('brew');

          const outputSpec = getItemVisualSpec(item.id);

          return (
            <div 
              key={item.id} 
              className="bg-[#14100d] border border-[#292118] rounded-xl p-4 sm:p-5 relative transition-all hover:border-[#453728]"
            >
              {/* Subtle background glow wrapper to contain blur without clipping card tooltips */}
              <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#2a2118]/20 blur-2xl rounded-full" />
              </div>

              {/* Recipe Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#24111d]/70">
                <div>
                  <span className="text-[10px] font-mono text-[#8c7e6c] uppercase tracking-wider">
                    {recipe.type.replace('minecraft:', '').replace('_', ' ').toUpperCase()}
                  </span>
                  <h5 className="font-serif text-sm font-bold text-[#fbf7f0] mt-0.5">
                    {item.name} <span className="text-xs text-[#c8b8a2] font-normal font-sans">(Yield: x{recipe.outputCount})</span>
                  </h5>
                </div>

                {isMultiRecipe && (
                  <button
                    onClick={() => {
                      const nextIdx = (currentIndex + 1) % recipes.length;
                      setActiveRecipeIndex(prev => ({ ...prev, [item.id]: nextIdx }));
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-[#1d1711] border border-[#3d3023] text-[#d4b28c] rounded hover:text-[#dfc9ab] hover:border-[#614d38] transition-all cursor-pointer select-none"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Recipe {currentIndex + 1}/{recipes.length}
                  </button>
                )}
              </div>

              {/* Responsive Visual-First Stacked Layout */}
              <div className="flex flex-col gap-4">
                {/* 1. Visual Assembly Stage */}
                <div className="w-full py-4 px-4 sm:px-6 bg-[#0d0b09]/60 rounded-lg border border-[#241c14] relative z-10 flex justify-center items-center">
                  <div className="w-full max-w-sm flex justify-center items-center">
                    {isSmelting ? (
                    <div className="flex items-center gap-3 sm:gap-4 flex-nowrap justify-center w-full">
                      {/* Furnace Input Slot */}
                      {(() => {
                        const rawInput = recipe.ingredients.find(i => i.startsWith('Input: '))?.replace('Input: ', '') || recipe.ingredients[0] || '';
                        const spec = getItemVisualSpec(rawInput);
                        return (
                          <div className="relative group shrink-0 hover:z-30">
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 border rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 cursor-help ${spec.bgClass} ${spec.borderClass} ${spec.textClass} ${spec.glowClass} hover:border-[#d4b28c] shrink-0`}>
                              <span className="text-[9px] sm:text-[10px] font-mono font-bold">{spec.short}</span>
                            </div>
                            {/* Tooltip */}
                            <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#14100d] border border-[#3d3023] text-xs font-mono p-2 rounded shadow-2xl z-25 flex flex-col items-center gap-0.5 min-w-[120px]">
                              <span className="text-[#dfc9ab] font-bold font-serif text-center whitespace-nowrap">{spec.name}</span>
                              <span className="text-[9px] text-[#8c7e6c] uppercase tracking-wider">{rawInput}</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3d3023]" />
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
                      <div className="text-[#6e5539] font-bold text-sm sm:text-base select-none shrink-0">→</div>

                      {/* Furnace Output Slot */}
                      <div className="relative group shrink-0 hover:z-30">
                        <div className={`w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 border-2 rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 ${outputSpec.bgClass} ${outputSpec.borderClass} ${outputSpec.textClass} ${outputSpec.glowClass} shrink-0`}>
                          <span className="text-xs sm:text-sm font-mono font-bold">{outputSpec.short}</span>
                        </div>
                        <span className="absolute bottom-0.5 right-0.5 bg-[#1a140f] border border-[#473829] px-1 text-[8px] sm:text-[9px] font-mono text-amber-400 font-bold rounded">
                          x{recipe.outputCount}
                        </span>
                        {/* Tooltip */}
                        <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#14100d] border border-[#3d3023] text-xs font-mono p-2 rounded shadow-2xl z-25 flex flex-col items-center gap-0.5 min-w-[120px]">
                          <span className="text-[#dfc9ab] font-bold font-serif text-center whitespace-nowrap">{outputSpec.name}</span>
                          <span className="text-[9px] text-[#8c7e6c] uppercase tracking-wider">{item.id}</span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3d3023]" />
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
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 border rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 cursor-help ${spec.bgClass} ${spec.borderClass} ${spec.textClass} ${spec.glowClass} hover:border-[#d4b28c] shrink-0`}>
                              <span className="text-[9px] sm:text-[10px] font-mono font-bold">{spec.short}</span>
                            </div>
                            {/* Tooltip */}
                            <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#14100d] border border-[#3d3023] text-xs font-mono p-2 rounded shadow-2xl z-25 flex flex-col items-center gap-0.5 min-w-[120px]">
                              <span className="text-[#dfc9ab] font-bold font-serif text-center whitespace-nowrap">{spec.name}</span>
                              <span className="text-[9px] text-[#8c7e6c] uppercase tracking-wider">{rawInput}</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3d3023]" />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Stonecutter icon */}
                      <div className="flex flex-col items-center text-[#8c7e6c] shrink-0">
                        <Scissors className="w-4 h-4 sm:w-5 sm:h-5 -rotate-95" />
                        <span className="text-[7px] sm:text-[8px] font-mono text-[#8c7e6c] mt-0.5 uppercase tracking-wider">CUT</span>
                      </div>

                      {/* Arrow */}
                      <div className="text-[#6e5539] font-bold text-sm sm:text-base select-none shrink-0">→</div>

                      {/* Output Slot */}
                      <div className="relative group shrink-0 hover:z-30">
                        <div className={`w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 border-2 rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 ${outputSpec.bgClass} ${outputSpec.borderClass} ${outputSpec.textClass} ${outputSpec.glowClass} shrink-0`}>
                          <span className="text-xs sm:text-sm font-mono font-bold">{outputSpec.short}</span>
                        </div>
                        <span className="absolute bottom-0.5 right-0.5 bg-[#1a140f] border border-[#473829] px-1 text-[8px] sm:text-[9px] font-mono text-[#dfc9ab] font-bold rounded">
                          x{recipe.outputCount}
                        </span>
                        {/* Tooltip */}
                        <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#14100d] border border-[#3d3023] text-xs font-mono p-2 rounded shadow-2xl z-25 flex flex-col items-center gap-0.5 min-w-[120px]">
                          <span className="text-[#dfc9ab] font-bold font-serif text-center whitespace-nowrap">{outputSpec.name}</span>
                          <span className="text-[9px] text-[#8c7e6c] uppercase tracking-wider">{item.id}</span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3d3023]" />
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
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 border rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 cursor-help ${spec.bgClass} ${spec.borderClass} ${spec.textClass} ${spec.glowClass} hover:border-[#d4b28c] shrink-0`}>
                              <span className="text-[9px] sm:text-[10px] font-mono font-bold">{spec.short}</span>
                            </div>
                            {/* Tooltip */}
                            <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#14100d] border border-[#3d3023] text-xs font-mono p-2 rounded shadow-2xl z-20 flex flex-col items-center gap-0.5 min-w-[120px]">
                              <span className="text-[#dfc9ab] font-bold font-serif text-center whitespace-nowrap">{spec.name}</span>
                              <span className="text-[9px] text-[#8c7e6c] uppercase tracking-wider">Base: {rawInput}</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3d3023]" />
                            </div>
                          </div>
                        );
                      })()}

                      <div className="text-[#8c7e6c] font-bold text-xs sm:text-sm shrink-0">+</div>

                      {/* Upgrade Material */}
                      {(() => {
                        const rawInput = recipe.ingredients[1] || '';
                        const spec = getItemVisualSpec(rawInput);
                        return (
                          <div className="relative group shrink-0 hover:z-30">
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 border rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 cursor-help ${spec.bgClass} ${spec.borderClass} ${spec.textClass} ${spec.glowClass} hover:border-[#d4b28c] shrink-0`}>
                              <span className="text-[9px] sm:text-[10px] font-mono font-bold">{spec.short}</span>
                            </div>
                            {/* Tooltip */}
                            <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#14100d] border border-[#3d3023] text-xs font-mono p-2 rounded shadow-2xl z-20 flex flex-col items-center gap-0.5 min-w-[120px]">
                              <span className="text-[#dfc9ab] font-bold font-serif text-center whitespace-nowrap">{spec.name}</span>
                              <span className="text-[9px] text-[#8c7e6c] uppercase tracking-wider">Upgrade: {rawInput}</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3d3023]" />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Arrow */}
                      <div className="text-[#6e5539] font-bold text-sm sm:text-base select-none shrink-0">→</div>

                      {/* Result */}
                      <div className="relative group shrink-0 hover:z-30">
                        <div className={`w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 border-2 rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 ${outputSpec.bgClass} ${outputSpec.borderClass} ${outputSpec.textClass} ${outputSpec.glowClass} shrink-0`}>
                          <span className="text-xs sm:text-sm font-mono font-bold">{outputSpec.short}</span>
                        </div>
                        <span className="absolute bottom-0.5 right-0.5 bg-[#1a140f] border border-[#473829] px-1 text-[8px] sm:text-[9px] font-mono text-[#d4b28c] font-bold rounded">
                          x{recipe.outputCount}
                        </span>
                        {/* Tooltip */}
                        <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#14100d] border border-[#3d3023] text-xs font-mono p-2 rounded shadow-2xl z-20 flex flex-col items-center gap-0.5 min-w-[120px]">
                          <span className="text-[#dfc9ab] font-bold font-serif text-center whitespace-nowrap">{outputSpec.name}</span>
                          <span className="text-[9px] text-[#8c7e6c] uppercase tracking-wider">{item.id}</span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3d3023]" />
                        </div>
                      </div>
                    </div>
                  ) : isBrewing ? (
                    <div className="flex items-center gap-3 sm:gap-4 flex-nowrap justify-center w-full">
                      {/* Agent */}
                      {(() => {
                        const rawInput = recipe.ingredients[0] || '';
                        const spec = getItemVisualSpec(rawInput);
                        return (
                          <div className="relative group shrink-0 hover:z-30">
                            <div className="text-[8px] font-mono text-[#8c7e6c] uppercase tracking-wider mb-1 text-center font-semibold">Agent</div>
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 border rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 cursor-help ${spec.bgClass} ${spec.borderClass} ${spec.textClass} ${spec.glowClass} hover:border-[#d4b28c] shrink-0`}>
                              <span className="text-[9px] sm:text-[10px] font-mono font-bold">{spec.short}</span>
                            </div>
                            {/* Tooltip */}
                            <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#14100d] border border-[#3d3023] text-xs font-mono p-2 rounded shadow-2xl z-20 flex flex-col items-center gap-0.5 min-w-[120px]">
                              <span className="text-[#dfc9ab] font-bold font-serif text-center whitespace-nowrap">{spec.name}</span>
                              <span className="text-[9px] text-[#8c7e6c] uppercase tracking-wider">{rawInput}</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3d3023]" />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Sparkly / bubble indicator */}
                      <div className="flex flex-col items-center text-[#d4b28c] animate-pulse shrink-0 mt-4">
                        <Sparkles className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-amber-400/20 text-[#d4b28c]" />
                        <span className="text-[7px] sm:text-[8px] font-mono text-[#d4b28c]/80 mt-0.5 uppercase tracking-wider">BREW</span>
                      </div>

                      {/* Reagent / Base bottle */}
                      {(() => {
                        const rawInput = recipe.ingredients[1] || '';
                        const spec = getItemVisualSpec(rawInput);
                        return (
                          <div className="relative group shrink-0 hover:z-30">
                            <div className="text-[8px] font-mono text-[#8c7e6c] uppercase tracking-wider mb-1 text-center font-semibold">Base</div>
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 border rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 cursor-help ${spec.bgClass} ${spec.borderClass} ${spec.textClass} ${spec.glowClass} hover:border-[#d4b28c] shrink-0`}>
                              <span className="text-[9px] sm:text-[10px] font-mono font-bold">{spec.short}</span>
                            </div>
                            {/* Tooltip */}
                            <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#14100d] border border-[#3d3023] text-xs font-mono p-2 rounded shadow-2xl z-20 flex flex-col items-center gap-0.5 min-w-[120px]">
                              <span className="text-[#dfc9ab] font-bold font-serif text-center whitespace-nowrap">{spec.name}</span>
                              <span className="text-[9px] text-[#8c7e6c] uppercase tracking-wider">{rawInput}</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3d3023]" />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Arrow */}
                      <div className="text-[#6e5539] font-bold text-sm sm:text-base select-none shrink-0 mt-4">→</div>

                      {/* Output Potion Result */}
                      <div className="relative group shrink-0 hover:z-30">
                        <div className="text-[8px] font-mono text-[#8c7e6c] uppercase tracking-wider mb-1 text-center font-semibold">Product</div>
                        <div className={`w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 border-2 rounded-lg flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-200 ${outputSpec.bgClass} ${outputSpec.borderClass} ${outputSpec.textClass} ${outputSpec.glowClass} shrink-0`}>
                          <span className="text-xs sm:text-sm font-mono font-bold">{outputSpec.short}</span>
                        </div>
                        <span className="absolute bottom-0.5 right-0.5 bg-[#1a140f] border border-[#473829] px-1 text-[8px] sm:text-[9px] font-mono text-[#dfc9ab] font-bold rounded">
                          x{recipe.outputCount}
                        </span>
                        {/* Tooltip */}
                        <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#14100d] border border-[#3d3023] text-xs font-mono p-2 rounded shadow-2xl z-25 flex flex-col items-center gap-0.5 min-w-[120px]">
                          <span className="text-[#dfc9ab] font-bold font-serif text-center whitespace-nowrap">{outputSpec.name}</span>
                          <span className="text-[9px] text-[#8c7e6c] uppercase tracking-wider">{item.id}</span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3d3023]" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Default / Standard 3x3 Grid
                    <div className="flex items-center gap-3 sm:gap-4 flex-nowrap justify-center w-full">
                      {/* 3x3 Grid Layout */}
                      <div className="grid grid-cols-3 gap-1 bg-[#120f0c] p-2 rounded-xl border border-[#2d241a] shadow-[inset_0_2px_10px_rgba(0,0,0,0.9)] shrink-0">
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
                                      <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 border rounded-lg flex flex-col items-center justify-center p-0.5 shadow-inner transition-all duration-200 cursor-help ${spec.bgClass} ${spec.borderClass} ${spec.textClass} ${spec.glowClass} hover:border-[#d4b28c] shrink-0`}>
                                        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-mono font-bold">{spec.short}</span>
                                      </div>
                                      {/* Tooltip */}
                                      <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#14100d] border border-[#3d3023] text-xs font-mono p-2 rounded shadow-2xl z-30 flex flex-col items-center gap-0.5 min-w-[125px]">
                                        <span className="text-[#dfc9ab] font-bold font-serif text-center whitespace-nowrap">{spec.name}</span>
                                        <span className="text-[9px] text-[#8c7e6c] uppercase tracking-wider">{ingredient.replace('super_bonemeal:', '').replace('minecraft:', '')}</span>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3d3023]" />
                                      </div>
                                    </div>
                                  );
                                } else {
                                  cells.push(
                                    <div key={idx} className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-[#0d0b09] border border-[#1d1711] rounded-lg shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.85)] opacity-25 shrink-0" />
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
                                      <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 border rounded-lg flex flex-col items-center justify-center p-0.5 shadow-inner transition-all duration-200 cursor-help ${spec.bgClass} ${spec.borderClass} ${spec.textClass} ${spec.glowClass} hover:border-[#d4b28c] shrink-0`}>
                                        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-mono font-bold">{spec.short}</span>
                                      </div>
                                      {/* Tooltip */}
                                      <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#14100d] border border-[#3d3023] text-xs font-mono p-2 rounded shadow-2xl z-30 flex flex-col items-center gap-0.5 min-w-[125px]">
                                        <span className="text-[#dfc9ab] font-bold font-serif text-center whitespace-nowrap">{spec.name}</span>
                                        <span className="text-[9px] text-[#8c7e6c] uppercase tracking-wider">{fullItemName.replace('super_bonemeal:', '').replace('minecraft:', '')}</span>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3d3023]" />
                                      </div>
                                    </div>
                                  );
                                } else {
                                  cells.push(
                                    <div key={`${r}-${c}`} className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-[#0d0b09] border border-[#1d1711] rounded-lg shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.85)] opacity-25 shrink-0" />
                                  );
                                }
                              }
                            }
                          }

                          return cells;
                        })()}
                      </div>

                      {/* Arrow */}
                      <div className="text-[#6e5539] font-bold text-base sm:text-lg select-none animate-pulse shrink-0">→</div>

                      {/* Large Output Slot */}
                      <div className="relative group shrink-0 hover:z-30">
                        <div className={`w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 border-2 rounded-xl flex flex-col items-center justify-center p-1 shadow-inner transition-all duration-300 ${outputSpec.bgClass} ${outputSpec.borderClass} ${outputSpec.textClass} ${outputSpec.glowClass} shrink-0`}>
                          <span className="text-xs sm:text-sm font-mono font-bold tracking-tight">{outputSpec.short}</span>
                        </div>
                        <span className="absolute bottom-0.5 right-0.5 bg-[#1a140f] border border-[#473829] px-1 py-0.5 text-[8px] sm:text-[9px] font-mono text-[#dfc9ab] font-bold rounded shadow-md z-10 select-none">
                          x{recipe.outputCount}
                        </span>
                        {/* Tooltip */}
                        <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#14100d] border border-[#3d3023] text-xs font-mono p-2 rounded shadow-2xl z-20 flex flex-col items-center gap-0.5 min-w-[120px]">
                          <span className="text-[#dfc9ab] font-bold font-serif text-center whitespace-nowrap">{outputSpec.name}</span>
                          <span className="text-[9px] text-[#8c7e6c] uppercase tracking-wider">{item.id}</span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3d3023]" />
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>

                {/* 2. Textual Specifications (Split cleanly on wider screens, stacked on small mobile) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#24111d]/70">
                  {/* Ingredients */}
                  <div>
                    <h6 className="text-[10px] font-mono uppercase tracking-wider text-[#8c7e6c] mb-1.5 font-bold">Ingredients Inventory</h6>
                    <ul className="text-xs text-[#b8a994] space-y-1 font-mono list-disc pl-4">
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
                            <span className="text-[#fbf7f0]">{cleanText}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Metadata & File Info */}
                  <div className="flex flex-col justify-between text-[9px] font-mono text-[#8c7e6c] space-y-2">
                    <div className="space-y-1.5">
                      <div className="leading-normal">
                        Recipe source file:<br />
                        <span className="text-[#7a6247] break-all select-all hover:text-[#d4b28c] transition-colors">{recipe.file}</span>
                      </div>
                      
                      {recipe.type === 'minecraft:crafting_shapeless' && (
                        <div className="inline-block bg-[#211a14] border border-[#3d3023] px-1.5 py-0.5 rounded text-[8px] text-[#dfc9ab] font-bold tracking-wider uppercase">
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
