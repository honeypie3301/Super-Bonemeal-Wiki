import React from 'react';
import { Info, ArrowRight, Sparkles, Zap, UserCheck } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (slug: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 w-full">
      {/* Breadcrumb Header */}
      <div className="text-[10px] font-mono tracking-widest text-[#8c607a] uppercase flex items-center gap-2">
        <span>WIKI</span>
        <span>/</span>
        <span>CORE GUIDE</span>
        <span>/</span>
        <span className="text-[#f472b6] font-semibold">HOME</span>
      </div>

      {/* Article Title */}
      <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#fce7f3] tracking-tight">
        Home
      </h1>

      {/* Center Banner Frame */}
      <div className="bg-[#140b11] border border-[#2e1726] rounded-xl p-8 text-center space-y-2">
        <h2 className="font-serif text-4xl sm:text-5xl font-extrabold tracking-widest uppercase text-[#fce7f3]">
          SUPER BONE MEAL
        </h2>
        <p className="text-xs sm:text-sm font-mono tracking-[0.2em] uppercase text-[#a88098]">
          OFFICIAL SURVIVAL & FARMING FIELD GUIDE
        </p>
      </div>

      {/* Mandatory Wiki Maintenance Notice Box */}
      <div className="border border-amber-900/60 bg-[#160d13] p-6 sm:p-8 rounded-xl text-xs space-y-3">
        <div className="flex items-center gap-2 font-mono font-bold text-amber-400 tracking-wider uppercase text-xs">
          <Info className="w-4 h-4 shrink-0 text-amber-400" />
          <span>WIKI MAINTENANCE NOTE</span>
        </div>

        <div className="text-[#d8c2ce] space-y-2 leading-relaxed">
          <p>
            <u className="text-amber-300 font-semibold underline-offset-4">
              The wiki is always updated before a new version releases.
            </u>{' '}
            If something in-game doesn't match what's documented here, please make sure your mod build is up to date.
          </p>

          <div className="pt-3 border-t border-[#2e1726] space-y-2 font-sans">
            <p className="font-mono text-[11px] font-bold text-[#f472b6] uppercase tracking-wider">
              RECENT VERSION HIGHLIGHTS:
            </p>
            <ul className="space-y-1.5 pl-1 text-xs text-[#c29eb5]">
              <li className="flex items-start gap-2">
                <span className="text-[#f472b6] font-bold">•</span>
                <span>
                  <strong className="text-[#fce7f3]">Shaped Recipe:</strong> Craft 2 Super Bone Meal using 5 Bone Meal in a plus shape and 4 Bone Blocks in the corners of a 3x3 grid.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#f472b6] font-bold">•</span>
                <span>
                  <strong className="text-[#fce7f3]">Villager & Trader Economy:</strong> Level 2 Apprentice Farmer Villagers and Wandering Traders sell Super Bone Meal for Emeralds.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div
          onClick={() => onNavigate('mechanics_aoe')}
          className="p-6 sm:p-8 rounded-xl bg-[#140b11] border border-[#2e1726] hover:border-[#f472b6]/50 transition-colors cursor-pointer space-y-2 group"
        >
          <div className="w-8 h-8 rounded-md bg-[#24111d] border border-[#52213f] flex items-center justify-center text-[#f472b6]">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="font-serif font-bold text-sm text-[#fce7f3] group-hover:text-[#f472b6] transition-colors flex items-center justify-between">
            <span>50x50 Area Effect</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#8c607a] group-hover:text-[#f472b6] transition-colors" />
          </h3>
          <p className="text-xs text-[#a88098] leading-relaxed">
            Applies bone meal across 2,500 surrounding blocks with a single right-click on terrain.
          </p>
        </div>

        <div
          onClick={() => onNavigate('items')}
          className="p-6 sm:p-8 rounded-xl bg-[#140b11] border border-[#2e1726] hover:border-[#f472b6]/50 transition-colors cursor-pointer space-y-2 group"
        >
          <div className="w-8 h-8 rounded-md bg-[#24111d] border border-[#52213f] flex items-center justify-center text-[#f472b6]">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-serif font-bold text-sm text-[#fce7f3] group-hover:text-[#f472b6] transition-colors flex items-center justify-between">
            <span>Crafting Recipe</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#8c607a] group-hover:text-[#f472b6] transition-colors" />
          </h3>
          <p className="text-xs text-[#a88098] leading-relaxed">
            Crafted with 5 Bone Meal and 4 Bone Blocks in a 3x3 grid to yield 2 Super Bone Meal.
          </p>
        </div>

        <div
          onClick={() => onNavigate('villager_trades')}
          className="p-6 sm:p-8 rounded-xl bg-[#140b11] border border-[#2e1726] hover:border-[#f472b6]/50 transition-colors cursor-pointer space-y-2 group"
        >
          <div className="w-8 h-8 rounded-md bg-[#24111d] border border-[#52213f] flex items-center justify-center text-[#f472b6]">
            <UserCheck className="w-4 h-4" />
          </div>
          <h3 className="font-serif font-bold text-sm text-[#fce7f3] group-hover:text-[#f472b6] transition-colors flex items-center justify-between">
            <span>Villager Trades</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#8c607a] group-hover:text-[#f472b6] transition-colors" />
          </h3>
          <p className="text-xs text-[#a88098] leading-relaxed">
            Purchase Super Bone Meal from Level 2 Apprentice Farmers and Wandering Traders.
          </p>
        </div>
      </div>
    </div>
  );
};
