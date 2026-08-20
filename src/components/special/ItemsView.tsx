import React from 'react';
import { UpdatedFrame } from '../UpdatedFrame';
import { FancyRecipeView } from '../FancyRecipeView';
import { SUPER_BONEMEAL_RECIPE } from '../../data/wikiData';
import { Zap, Compass, Tag } from 'lucide-react';

export const ItemsView: React.FC = () => {
  return (
    <div className="space-y-6 w-full">
      {/* Breadcrumb Header */}
      <div className="text-[10px] font-mono tracking-widest text-[#8c607a] uppercase flex items-center gap-2">
        <span>WIKI</span>
        <span>/</span>
        <span>ITEMS & GEAR</span>
        <span>/</span>
        <span className="text-[#f472b6] font-semibold">ITEMS</span>
      </div>

      {/* Title */}
      <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#fce7f3] tracking-tight">
        Items
      </h1>

      <UpdatedFrame id="item_super_bonemeal_frame">
        <div className="space-y-6">
          {/* Main Item Header Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#180d14] border border-[#2e1726]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#2b1422] border border-[#52213f] flex items-center justify-center shrink-0">
                <span className="font-mono text-base font-bold text-[#f472b6]">SBM</span>
              </div>
              <div>
                <h2 className="font-serif font-bold text-xl text-[#fce7f3] flex items-center gap-2">
                  Super Bone Meal
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2a1320] border border-[#4d1f3b] text-[#f472b6] font-bold">
                    UNCOMMON
                  </span>
                </h2>
                <p className="text-xs font-mono text-[#f472b6] mt-0.5">
                  super_bonemeal:super_bonemeal
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono w-full sm:w-auto">
              <div className="p-2.5 rounded-md bg-[#130b10] border border-[#261420]">
                <span className="text-[#8c607a] block">Max Stack</span>
                <span className="text-[#fce7f3] font-bold">64</span>
              </div>
              <div className="p-2.5 rounded-md bg-[#130b10] border border-[#261420]">
                <span className="text-[#8c607a] block">Creative Tab</span>
                <span className="text-[#fce7f3] font-bold">Items / Transport</span>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-lg bg-[#130b10] border border-[#261420] space-y-1">
              <span className="text-[#8c607a] text-[10px] uppercase flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#f472b6]" /> Procedure
              </span>
              <p className="text-[#fce7f3] font-bold truncate">SuperBonemealRightclickedOnBlock</p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#130b10] border border-[#261420] space-y-1">
              <span className="text-[#8c607a] text-[10px] uppercase flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-[#f472b6]" /> AoE Radius
              </span>
              <p className="text-[#fce7f3] font-bold">50x50 Radius (2,500 Blocks)</p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#130b10] border border-[#261420] space-y-1">
              <span className="text-[#8c607a] text-[10px] uppercase flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#f472b6]" /> Targeted Growth
              </span>
              <p className="text-[#fce7f3] font-bold">10x Loop (Instant Max Stage)</p>
            </div>
          </div>

          {/* Crafting Grid (Exact Backwoods Recipe Template View) */}
          <FancyRecipeView recipe={SUPER_BONEMEAL_RECIPE} />
        </div>
      </UpdatedFrame>
    </div>
  );
};
