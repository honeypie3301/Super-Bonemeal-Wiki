/**
 * AI ASSISTANT MAINTENANCE NOTICE:
 * Whenever you update any wiki content or implement commit changes:
 * 1. Update the "Recent Highlights" list in the Wiki Maintenance Note below AND in `/src/data/wikiArticles.ts`.
 * 2. Keep the underline strictly on: "The wiki is always updated before a new version releases."
 * 3. Wrap newly added/changed components across the wiki in `<UpdatedFrame id="..." isUpdated={true}>`.
 */
import React from 'react';
import { 
  Compass, 
  BookOpen, 
  ArrowRight,
  Info,
  Clock,
  Sparkles,
  Sprout,
  Users,
  Layers
} from 'lucide-react';
import UpdatedFrame from '../UpdatedFrame';
import TitleDialPicker from '../TitleDialPicker';

export default function HomeView() {
  return (
    <div className="space-y-8 max-w-[1000px] mx-auto text-[#e8d0da]">
      
      {/* 1. LOGO HERO BANNER WITH SECRET INTERACTIVE DIAL PICKER */}
      <UpdatedFrame id="home_hero_dial_picker" isUpdated={true}>
        <div className="relative overflow-hidden rounded-xl bg-[#120c10] border border-[#2b1723] p-4 sm:p-8 text-center shadow-lg space-y-2">
          <TitleDialPicker />
          <p className="text-xs sm:text-sm font-mono tracking-[0.2em] text-[#f472b6] uppercase">
            Official Agrarian & Flora Acceleration Field Guide
          </p>
        </div>
      </UpdatedFrame>

      {/* 2. WIKI MAINTENANCE NOTE (UPDATED FRAME) */}
      <UpdatedFrame id="home_maintenance_notice" isUpdated={true}>
        <div className="p-5 bg-gradient-to-r from-[#1f1019] via-[#140b10] to-[#10080d] border border-pink-500/40 rounded-xl space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-pink-400 font-mono text-xs uppercase font-bold tracking-wider">
            <Info className="w-4 h-4 text-pink-400 animate-pulse" />
            <span>Wiki Maintenance Note</span>
          </div>
          
          <div className="p-3 bg-pink-950/30 border border-pink-500/30 rounded-lg text-pink-200 text-sm font-medium leading-relaxed">
            <u>The wiki is always updated before a new version releases.</u> If something in-game doesn't match what's documented here, please make sure your mod build is up to date.
          </div>

          <div className="text-xs text-[#d1b0c1] space-y-1.5 font-mono pt-1">
            <div className="text-[#f9a8d4] font-semibold uppercase text-[11px] tracking-wider">Recent Highlights:</div>
            <ul className="list-disc list-inside space-y-1.5 text-[#c4adb7] pl-1">
              <li><strong className="text-pink-300">Wandering Trader Trades:</strong> Wandering Traders now offer Super Bone Meal for purchase (exchange 2 Emeralds for 1 Super Bone Meal, up to 4 trades per trader).</li>
              <li><strong className="text-pink-300">Farmer Villager Trades:</strong> Level 2 (Apprentice) Farmer Villagers now trade 2 Super Bone Meal for 1 Emerald (up to 10 trades per apprentice farmer).</li>
            </ul>
          </div>
        </div>
      </UpdatedFrame>

      {/* 3. WELCOME & OVERVIEW */}
      <div className="p-6 bg-[#160e13] border border-[#2d1825] rounded-xl space-y-4 shadow-md">
        <p className="text-sm sm:text-base leading-relaxed text-[#f0dfe7]">
          <strong className="text-[#fce7f3]">Super Bone Meal</strong> is a Minecraft utility mod designed to eliminate tedious botanical farming and transform barren landscapes into lush, vibrant meadows with a single click.
        </p>
        <p className="text-xs sm:text-sm leading-relaxed text-[#c4adb7] italic border-l-2 border-[#f472b6] pl-4">
          By harnessing a concentrated 50x50 area effect and a dedicated single-tick 10-pulse precision strike for crops and saplings, Super Bone Meal allows builders and survivalists to instantly mature forests, crops, bamboo, and sugar cane without tedious grinding.
        </p>
      </div>

      {/* 4. NAVIGATION CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* CARD 1: 50x50 CARPET GROWTH */}
        <div className="p-5 bg-[#120b0f] border border-[#261520] border-t-2 border-t-[#f472b6] rounded-xl space-y-3 flex flex-col justify-between hover:border-[#422136] transition-all">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#fce7f3] font-serif text-base font-semibold">
              <Sparkles className="w-4 h-4 text-[#f472b6]" />
              <span>50x50 Carpet Growth</span>
            </div>
            <p className="text-xs text-[#c4adb7] leading-relaxed">
              Right-click open terrain to fertilize a massive 2,500-block zone with diverse wildflowers and plants.
            </p>
            <p className="text-xs text-[#a88a96] italic">
              Features a smart filter that skips existing short grass to prevent chaotic tall grass clutter.
            </p>
          </div>
          <a href="#/wiki/items" className="inline-flex items-center gap-1.5 text-xs font-mono text-[#f472b6] hover:text-[#f9a8d4] uppercase tracking-wider font-semibold pt-2">
            <span>Explore Mechanics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* CARD 2: PRECISION CROP STRIKE */}
        <div className="p-5 bg-[#120b0f] border border-[#261520] border-t-2 border-t-[#f472b6] rounded-xl space-y-3 flex flex-col justify-between hover:border-[#422136] transition-all">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#fce7f3] font-serif text-base font-semibold">
              <Sprout className="w-4 h-4 text-[#f472b6]" />
              <span>Instant Crop Growth</span>
            </div>
            <p className="text-xs text-[#c4adb7] leading-relaxed">
              Direct clicks on saplings, crops, bamboo, or sugar cane trigger 10 rapid growth pulses in 1 tick for instant maturity.
            </p>
          </div>
          <a href="#/wiki/items" className="inline-flex items-center gap-1.5 text-xs font-mono text-[#f472b6] hover:text-[#f9a8d4] uppercase tracking-wider font-semibold pt-2">
            <span>Item Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* CARD 3: VILLAGER ECONOMY */}
        <div className="p-5 bg-[#120b0f] border border-[#261520] border-t-2 border-t-[#f472b6] rounded-xl space-y-3 flex flex-col justify-between hover:border-[#422136] transition-all">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#fce7f3] font-serif text-base font-semibold">
              <Users className="w-4 h-4 text-[#f472b6]" />
              <span>Trading Economy</span>
            </div>
            <p className="text-xs text-[#c4adb7] leading-relaxed">
              Acquire Super Bone Meal legitimately in Survival mode through Apprentice Farmer Villagers and Wandering Traders.
            </p>
          </div>
          <a href="#/wiki/items" className="inline-flex items-center gap-1.5 text-xs font-mono text-[#f472b6] hover:text-[#f9a8d4] uppercase tracking-wider font-semibold pt-2">
            <span>View Trades</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>

      {/* 5. QUICK DIRECTORY LINKS */}
      <div className="p-6 bg-[#0f090d] border border-[#22131c] rounded-xl space-y-4">
        <div className="text-xs font-mono text-[#a88a96] uppercase tracking-widest font-semibold">
          Wiki Quick Reference
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          {[
            { label: 'Items & Mechanics', href: '#/wiki/items', icon: Sprout },
            { label: 'Crafting & Recipes', href: '#/wiki/items', icon: Layers },
            { label: 'Version History', href: '#/wiki/versions', icon: Clock }
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
              className="p-3 bg-[#150d12] border border-[#26161f] hover:border-[#f472b6]/50 hover:bg-[#1d1019] rounded-lg transition-all flex flex-col items-center gap-2 group"
            >
              <item.icon className="w-4 h-4 text-[#f472b6] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono text-[#e8d0da] group-hover:text-[#f9a8d4]">{item.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center pt-6 border-t border-[#26161f] text-[11px] font-mono text-[#a88a96] uppercase tracking-widest">
        Created by honeypie_3301 using MCreator
      </div>

    </div>
  );
}
