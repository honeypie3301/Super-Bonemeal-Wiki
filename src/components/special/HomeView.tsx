/**
 * =========================================================================================
 * CRITICAL WIKI MAINTENANCE REMINDERS:
 * 1. STRICT FACTUAL ACCURACY / NO NARRATIVE TONES:
 *    - Never use speculative, sensationalized, roleplay, or fictional narrative phrasing.
 *    - Rely strictly on verified source code implementations, exact values, and game mechanics.
 * 2. MOD UPDATES vs. WIKI MAINTENANCE NOTE:
 *    - When updating mod versions or release notes, ONLY edit the Wiki Maintenance Note 
 *      in HomeView.tsx. Do NOT modify the core wiki text unless the mod mechanics themselves changed.
 * 3. MANDATORY UNDERLINE RULE:
 *    - Underline ONLY the exact sentence: "<u>The wiki is always updated before a new version releases.</u>"
 * 4. <UpdatedFrame> RULE:
 *    - Wrap newly added or updated wiki content, cards, or sections in <UpdatedFrame id="..." isUpdated={true}>.
 * =========================================================================================
 */
import React from 'react';
import { 
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
    <div className="space-y-8 max-w-[1000px] mx-auto text-[#ede4d4]">
      
      {/* 1. LOGO HERO BANNER WITH SECRET INTERACTIVE DIAL PICKER */}
      <UpdatedFrame id="home_hero_dial_picker" isUpdated={true}>
        <div className="relative overflow-hidden rounded-xl bg-[#14110d] border border-[#2b2219] p-4 sm:p-8 text-center shadow-lg space-y-2">
          <TitleDialPicker />
          <p className="text-xs sm:text-sm font-mono tracking-[0.2em] text-[#d4b28c] uppercase">
            Official Wiki for Super Bone Meal
          </p>
        </div>
      </UpdatedFrame>

      {/* 2. WIKI MAINTENANCE NOTE (UPDATED FRAME) */}
      <UpdatedFrame id="home_maintenance_notice_v140_verified" isUpdated={true}>
        <div className="p-5 bg-gradient-to-r from-[#211a13] via-[#19140f] to-[#120f0b] border border-[#8c7355]/50 rounded-xl space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-[#dfc9ab] font-mono text-xs uppercase font-bold tracking-wider">
            <Info className="w-4 h-4 text-[#dfc9ab] animate-pulse" />
            <span>Wiki Maintenance Note</span>
          </div>
          
          <div className="p-3 bg-[#2a2118]/70 border border-[#6b5842]/50 rounded-lg text-[#fbf7f0] text-sm font-medium leading-relaxed">
            <u>The wiki is always updated before a new version releases.</u> If something in-game doesn't match what's documented here, please make sure your mod build is up to date.
          </div>

          <div className="text-xs text-[#cfc2ae] space-y-1.5 font-mono pt-1">
            <div className="text-[#dfc9ab] font-semibold uppercase text-[11px] tracking-wider">Recent Highlights (v1.4.0):</div>
            <ul className="list-disc list-inside space-y-1.5 text-[#b8a994] pl-1">
              <li><strong className="text-[#f7f3ea]">Loot Tables:</strong> Added drops in Archaeology (10% chance, 0–3 items), Chests (6% chance, 1–5 items), and Fishing (25% chance, 1–2 items).</li>
              <li><strong className="text-[#f7f3ea]">Shapeless Crafting Recipe:</strong> 4 Bone Blocks + 5 Bone Meals in any crafting layout yields 2 Super Bone Meals.</li>
              <li><strong className="text-[#f7f3ea]">Targeted Plant Growth:</strong> Right-clicking moss blocks (<code className="text-[#dfc9ab]">Blocks.MOSS_BLOCK</code>), saplings (<code className="text-[#dfc9ab]">#minecraft:saplings</code>, <code className="text-[#dfc9ab]">#c:saplings</code>), crops (<code className="text-[#dfc9ab]">#minecraft:crops</code>), or snow plants (<code className="text-[#dfc9ab]">#snowrealmagic:plants</code>) applies 10 bone meal growth calls in 1 tick.</li>
              <li><strong className="text-[#f7f3ea]">Area Fertilization:</strong> Right-clicking other blocks runs a 50x2x50 volume check with a 10% chance per non-short grass block.</li>
              <li><strong className="text-[#f7f3ea]">Villager & Wandering Trader Trades:</strong> Wandering Trader offers 1 Super Bone Meal for 2 Emeralds (max 4). Apprentice Farmer offers 2 Super Bone Meals for 1 Emerald (max 10).</li>
            </ul>
          </div>
        </div>
      </UpdatedFrame>

      {/* 3. WELCOME & OVERVIEW */}
      <div className="p-6 bg-[#16130f] border border-[#2d241b] rounded-xl space-y-4 shadow-md">
        <p className="text-sm sm:text-base leading-relaxed text-[#ede4d4]">
          Super Bone Meal is a utility mod that expands crop and vegetation fertilization to a 50x2x50 area and accelerates plant growth with 10 instant bone meal cycles.
        </p>
        <p className="text-xs sm:text-sm leading-relaxed text-[#b8a994] border-l-2 border-[#c5a880] pl-4">
          Super Bone Meal (<code className="text-[#dfc9ab]">super_bonemeal:super_bonemeal</code>) provides two primary functions: a 50x2x50 volume fertilization loop for open terrain, and a 10-cycle growth application for targeted crops, saplings, moss blocks, and snow plants.
        </p>
      </div>

      {/* 4. NAVIGATION CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* CARD 1: 50x50 AREA GROWTH */}
        <div className="p-5 bg-[#14110d] border border-[#261f17] border-t-2 border-t-[#c5a880] rounded-xl space-y-3 flex flex-col justify-between hover:border-[#4d3e2f] transition-all">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#fbf7f0] font-serif text-base font-semibold">
              <Sparkles className="w-4 h-4 text-[#d4b28c]" />
              <span>50x2x50 Area Growth</span>
            </div>
            <p className="text-xs text-[#b8a994] leading-relaxed">
              Right-clicking ground executes a 50x2x50 coordinate loop (x-25 to x+24, y-1 to y, z-25 to z+24) evaluating 5,000 positions.
            </p>
            <p className="text-xs text-[#8c7e6c]">
              Each non-short grass block has a 10% chance to receive a bone meal call.
            </p>
          </div>
          <a href="#/wiki/items" className="inline-flex items-center gap-1.5 text-xs font-mono text-[#dfc9ab] hover:text-[#fbf7f0] uppercase tracking-wider font-semibold pt-2">
            <span>View Mechanics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* CARD 2: TARGETED PLANT GROWTH */}
        <div className="p-5 bg-[#14110d] border border-[#261f17] border-t-2 border-t-[#c5a880] rounded-xl space-y-3 flex flex-col justify-between hover:border-[#4d3e2f] transition-all">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#fbf7f0] font-serif text-base font-semibold">
              <Sprout className="w-4 h-4 text-[#d4b28c]" />
              <span>Targeted Plant Growth</span>
            </div>
            <p className="text-xs text-[#b8a994] leading-relaxed">
              Right-clicking saplings, crops, moss blocks, or snow plants calls bone meal growth 10 times in 1 tick.
            </p>
          </div>
          <a href="#/wiki/items" className="inline-flex items-center gap-1.5 text-xs font-mono text-[#dfc9ab] hover:text-[#fbf7f0] uppercase tracking-wider font-semibold pt-2">
            <span>Item Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* CARD 3: VILLAGER & TRADER TRADES */}
        <div className="p-5 bg-[#14110d] border border-[#261f17] border-t-2 border-t-[#c5a880] rounded-xl space-y-3 flex flex-col justify-between hover:border-[#4d3e2f] transition-all">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#fbf7f0] font-serif text-base font-semibold">
              <Users className="w-4 h-4 text-[#d4b28c]" />
              <span>Villager Trades</span>
            </div>
            <p className="text-xs text-[#b8a994] leading-relaxed">
              Available from Apprentice Farmer Villagers (1 Emerald for 2) and Wandering Traders (2 Emeralds for 1).
            </p>
          </div>
          <a href="#/wiki/items" className="inline-flex items-center gap-1.5 text-xs font-mono text-[#dfc9ab] hover:text-[#fbf7f0] uppercase tracking-wider font-semibold pt-2">
            <span>View Trades</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>

      {/* 5. QUICK DIRECTORY LINKS */}
      <div className="p-6 bg-[#110e0b] border border-[#221b14] rounded-xl space-y-4">
        <div className="text-xs font-mono text-[#8c7e6c] uppercase tracking-widest font-semibold">
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
              className="p-3 bg-[#15110d] border border-[#271f16] hover:border-[#c5a880]/60 hover:bg-[#1d1711] rounded-lg transition-all flex flex-col items-center gap-2 group"
            >
              <item.icon className="w-4 h-4 text-[#d4b28c] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono text-[#ede4d4] group-hover:text-[#fbf7f0]">{item.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center pt-6 border-t border-[#261e16] text-[11px] font-mono text-[#8c7e6c] uppercase tracking-widest">
        Created by honeypie_3301 using MCreator
      </div>

    </div>
  );
}
