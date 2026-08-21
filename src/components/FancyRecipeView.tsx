import React, { useState } from 'react';
import { RecipeSpec } from '../types';
import { RotateCw } from 'lucide-react';

interface FancyRecipeViewProps {
  recipe: RecipeSpec;
}

export const FancyRecipeView: React.FC<FancyRecipeViewProps> = ({ recipe }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <div className="my-4 p-4 sm:p-5 rounded-xl bg-[#0d070b] border border-[#261420] font-sans">
      {/* Top Header Row */}
      <div className="flex items-start justify-between pb-2">
        <div>
          <div className="text-[10px] font-mono font-semibold tracking-widest text-[#8c607a] uppercase mb-0.5">
            {recipe.type}
          </div>
          <h3 className="font-serif font-bold text-base sm:text-lg text-[#fce7f3] flex items-center gap-2">
            <span>{recipe.title}</span>
            <span className="text-xs font-mono font-normal text-[#a88098]">
              (Yield: x{recipe.yieldCount})
            </span>
          </h3>
        </div>

        {/* Recipe Cycle Button */}
        <button className="px-2.5 py-1 bg-[#180d14] border border-[#2e1726] hover:border-[#f472b6]/40 rounded-lg text-xs font-mono text-[#a88098] hover:text-[#fce7f3] flex items-center gap-1.5 transition-colors cursor-pointer">
          <RotateCw className="w-3.5 h-3.5" />
          <span>{recipe.recipeNumber || 'Recipe 1/1'}</span>
        </button>
      </div>

      {/* Center Recipe Crafting Interface (Exact Backwoods Style) */}
      <div className="bg-[#070406] border border-[#1a0e16] rounded-xl p-5 sm:p-8 my-3 flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8">
        {/* 3x3 Grid Box */}
        <div className="bg-[#120a10] border border-[#261420] rounded-xl p-2.5 sm:p-3 grid grid-cols-3 gap-2 shadow-inner">
          {recipe.grid.map((slot, idx) => (
            <div
              key={idx}
              className={`
                relative w-11 h-11 sm:w-13 sm:h-13 rounded-lg flex items-center justify-center font-mono font-bold text-xs transition-all duration-150
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
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-30 px-2 py-1 bg-[#0d080b] border border-[#f472b6] rounded text-[11px] font-mono text-[#fce7f3] whitespace-nowrap shadow-md">
                      {slot.name}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Crafting Arrow */}
        <div className="text-[#8c607a] font-mono text-xl font-bold px-1 sm:px-2">
          →
        </div>

        {/* Output Slot Container */}
        <div className="relative">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#2e1425] border border-[#f472b6]/70 flex items-center justify-center shadow-lg">
            <span className="font-mono text-sm sm:text-base font-bold text-[#f472b6]">
              {recipe.output.code}
            </span>
          </div>

          {/* Bottom Right Count Tag */}
          <div className="absolute -bottom-1 -right-1 bg-[#0d080b] border border-[#52213f] rounded px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#f472b6] shadow-md">
            x{recipe.output.count}
          </div>
        </div>
      </div>

      {/* Bottom Information Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#1f0f1b]">
        {/* Left Column: Ingredients Inventory */}
        <div>
          <div className="text-[10px] font-mono font-semibold tracking-widest text-[#8c607a] uppercase mb-1.5">
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
          <span className="text-[10px] font-mono tracking-widest text-[#8c607a] block mb-0.5">
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
