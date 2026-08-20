import React, { useState } from 'react';
import { RecipeSpec } from '../types';
import { RotateCw } from 'lucide-react';

interface FancyRecipeViewProps {
  recipe: RecipeSpec;
}

export const FancyRecipeView: React.FC<FancyRecipeViewProps> = ({ recipe }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <div className="my-4 p-5 sm:p-6 rounded-xl bg-[#0d070b] border border-[#261420] text-sans">
      {/* Top Header Row */}
      <div className="flex items-start justify-between pb-2">
        <div>
          <div className="text-[10px] font-mono font-semibold tracking-widest text-[#8c607a] uppercase mb-1">
            {recipe.type}
          </div>
          <h3 className="font-serif font-bold text-lg text-[#fce7f3] flex items-center gap-2">
            <span>{recipe.title}</span>
            <span className="text-xs font-mono font-normal text-[#a88098]">
              (Yield: x{recipe.yieldCount})
            </span>
          </h3>
        </div>

        {/* Recipe Cycle Button */}
        <button className="px-3 py-1.5 bg-[#180d14] border border-[#2e1726] hover:border-[#f472b6]/40 rounded-lg text-xs font-mono text-[#a88098] hover:text-[#fce7f3] flex items-center gap-1.5 transition-colors cursor-pointer">
          <RotateCw className="w-3.5 h-3.5" />
          <span>{recipe.recipeNumber || 'Recipe 1/1'}</span>
        </button>
      </div>

      {/* Center Recipe Crafting Interface (Exact Backwoods Style) */}
      <div className="bg-[#070406] border border-[#1a0e16] rounded-xl p-6 sm:p-10 my-4 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
        {/* 3x3 Grid Box */}
        <div className="bg-[#120a10] border border-[#261420] rounded-2xl p-3 grid grid-cols-3 gap-2.5 shadow-inner">
          {recipe.grid.map((slot, idx) => (
            <div
              key={idx}
              className={`
                relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-mono font-bold text-xs transition-all duration-150
                ${
                  slot
                    ? 'bg-[#2a1322] border border-[#592244] text-[#f472b6] shadow-sm hover:border-[#f472b6] cursor-pointer'
                    : 'bg-[#10080e] border border-[#1f0f1b]'
                }
              `}
              onMouseEnter={() => slot && setActiveTooltip(`${idx}-${slot.name}`)}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              {slot && (
                <>
                  <span>{slot.code}</span>
                  {activeTooltip === `${idx}-${slot.name}` && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 px-2.5 py-1 bg-[#0d080b] border border-[#f472b6] rounded text-[11px] font-mono text-[#fce7f3] whitespace-nowrap shadow-md">
                      {slot.name}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Crafting Arrow */}
        <div className="text-[#8c607a] font-mono text-lg font-bold">
          →
        </div>

        {/* Output Slot Container */}
        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#2e1425] border border-[#f472b6]/70 flex items-center justify-center shadow-lg">
            <span className="font-mono text-base font-bold text-[#f472b6]">
              {recipe.output.code}
            </span>
          </div>

          {/* Bottom Right Count Tag */}
          <div className="absolute -bottom-1 -right-1 bg-[#0d080b] border border-[#52213f] rounded-md px-2 py-0.5 text-[10px] font-mono font-bold text-[#f472b6] shadow-md">
            x{recipe.output.count}
          </div>
        </div>
      </div>

      {/* Bottom Information Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#1f0f1b]">
        {/* Left Column: Ingredients Inventory */}
        <div>
          <div className="text-[10px] font-mono font-semibold tracking-widest text-[#8c607a] uppercase mb-2">
            INGREDIENTS INVENTORY
          </div>
          <ul className="space-y-1 text-xs font-mono text-[#fce7f3]">
            {recipe.ingredientsList.map((ing, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="text-[#f472b6] font-bold">•</span>
                <span className="text-[#f472b6] font-bold">{ing.key}:</span>
                <span className="text-[#c29eb5]">{ing.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Recipe Source File */}
        <div className="sm:text-right">
          <span className="text-[10px] font-mono tracking-widest text-[#8c607a] block mb-1">
            Recipe source file:
          </span>
          <code className="text-xs font-mono text-[#c29eb5]">
            {recipe.recipeFile}
          </code>
        </div>
      </div>
    </div>
  );
};
