import React from 'react';
import {
  Sprout,
  Sparkles,
  Coins,
  Cpu,
  BookOpen,
  Clock,
  ArrowRight,
  Info,
  Package
} from 'lucide-react';
import UpdatedFrame from '../UpdatedFrame';
import TitleDialPicker from '../TitleDialPicker';
import { useTheme } from '../../context/ThemeContext';

export default function HomeView() {
  const { theme } = useTheme();
  const isStarlight = theme === 'starlight';

  return (
    <div className="space-y-8 max-w-[1000px] mx-auto text-ink-muted">

      {/* 1. LOGO HERO BANNER WITH INTERACTIVE DIAL PICKER */}
      <UpdatedFrame id="sb_home_hero_dial_picker" isUpdated={true}>
        <div className="relative overflow-hidden rounded-xl bg-surface border border-line p-8 text-center shadow-xs space-y-2 transition-colors">
          <TitleDialPicker />
          <p className="text-xs sm:text-sm font-mono tracking-[0.2em] text-accent-text uppercase">
            Official Landscape &amp; Crop Expansion Guide
          </p>
        </div>
      </UpdatedFrame>

      {/* 2. WIKI MAINTENANCE & MOD RELEASE HIGHLIGHTS */}
      <UpdatedFrame id="sb_home_maintenance_notice" isUpdated={true}>
        <div
          className={`p-5 rounded-xl space-y-3.5 transition-all duration-200 ${
            isStarlight
              ? 'bg-gradient-to-r from-[#18181b]/95 via-[#111114]/95 to-[#09090b]/95 border-2 border-zinc-300 shadow-[0_0_24px_rgba(228,228,231,0.5),inset_0_0_12px_rgba(255,255,255,0.08)]'
              : 'bg-surface border border-accent-border shadow-xs'
          }`}
        >
          <div
            className={`flex items-center gap-2 font-mono text-xs uppercase font-bold tracking-wider ${
              isStarlight ? 'text-zinc-200' : 'text-accent-text'
            }`}
          >
            <Info
              className={`w-4 h-4 ${
                isStarlight ? 'text-zinc-100 animate-pulse' : 'text-accent-text'
              }`}
            />
            <span>Wiki Maintenance Note</span>
          </div>

          <div
            className={`p-4 sm:p-5 rounded-lg text-base sm:text-lg md:text-xl font-display font-semibold leading-relaxed text-center flex items-center justify-center transition-all ${
              isStarlight
                ? 'bg-zinc-900/90 border border-zinc-300/80 text-zinc-100 shadow-[0_0_18px_rgba(255,255,255,0.15)]'
                : 'bg-accent-soft border border-accent-border text-accent-text'
            }`}
          >
            <u>The wiki is always updated before a new version releases.</u>
          </div>

          <div className="text-xs text-ink-muted space-y-2 font-mono pt-1">
            <div
              className={`font-semibold uppercase text-[11px] tracking-wider ${
                isStarlight ? 'text-zinc-300' : 'text-ink'
              }`}
            >
              Recent Version Highlights (v1.4.0):
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-ink-muted pl-1">
              <li>
                <strong className={isStarlight ? 'text-zinc-100 font-bold' : 'text-accent-text font-semibold'}>
                  Villager &amp; Wandering Trader Economy:
                </strong>{' '}
                Added Level 2 Farmer Villager trades (1 Emerald for 2 Super Bone Meal) and Wandering Trader generic offers (2 Emeralds for 1 Super Bone Meal).
              </li>
              <li>
                <strong className={isStarlight ? 'text-zinc-100 font-bold' : 'text-accent-text font-semibold'}>
                  World Loot Table Integration:
                </strong>{' '}
                Added 3 custom loot tables across Archaeology (10% weight, 0–3 count), Chests (6% weight, 1–5 count), and Fishing (25% weight, 1–2 count).
              </li>
              <li>
                <strong className={isStarlight ? 'text-zinc-100 font-bold' : 'text-accent-text font-semibold'}>
                  Smart Dual-Mode Growth Logic:
                </strong>{' '}
                Clicking directly on moss, crops, or saplings triggers 10 concentrated growth passes; clicking terrain transforms a 50×2×50 volume (5,000 blocks) with a 10% roll per block.
              </li>
              <li>
                <strong className={isStarlight ? 'text-zinc-100 font-bold' : 'text-accent-text font-semibold'}>
                  Cross-Mod Tag Compatibility:
                </strong>{' '}
                Detects <code className="text-ink">minecraft:saplings</code>, <code className="text-ink">minecraft:crops</code>, <code className="text-ink">c:saplings</code>, and <code className="text-ink">snowrealmagic:plants</code>.
              </li>
            </ul>
          </div>
        </div>
      </UpdatedFrame>

      {/* 3. WELCOME & OVERVIEW */}
      <div className="p-6 bg-surface border border-line rounded-xl space-y-4 transition-colors">
        <p className="text-sm sm:text-base leading-relaxed text-ink">
          <strong className="font-semibold text-ink">Super Bonemeal</strong> is a NeoForge 1.21.1 utility mod that expands vanilla bonemeal from a single-block fertilizer into a <strong className="font-semibold text-accent-text">50×50 landscape transformer</strong> and an instant <strong className="font-semibold text-accent-text">10× targeted plant accelerator</strong>.
        </p>
        <p className="text-xs sm:text-sm leading-relaxed text-ink-muted italic border-t border-b border-line-soft py-3.5">
          Tired of vanilla bonemeal only growing a tiny patch of grass? Craft Super Bone Meal from Bone Blocks and Bone Meal, trade for it with Farmers and Wandering Traders, or uncover it through archaeology, chests, and fishing to revitalize entire biomes in a single click.
        </p>
      </div>

      {/* 4. NAVIGATION CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* CARD 1: CRAFTING & ITEM */}
        <div className="p-5 bg-surface border border-line rounded-xl space-y-3 flex flex-col justify-between hover:border-accent/50 transition-colors">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ink font-display text-base font-semibold">
              <Sparkles className="w-4 h-4 text-accent-text shrink-0" />
              <span>Items &amp; Crafting</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Combine <strong className="text-ink font-semibold">4× Bone Blocks</strong> and <strong className="text-ink font-semibold">5× Bone Meal</strong> in a shapeless grid to craft <strong className="text-ink font-semibold">2× Super Bone Meal</strong>.
            </p>
          </div>
          <a href="#/wiki/items" className="inline-flex items-center gap-1.5 text-xs font-mono text-accent-text hover:underline underline-offset-4 uppercase tracking-wider font-semibold pt-2">
            <span>View Recipe</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* CARD 2: GROWTH MECHANICS */}
        <div className="p-5 bg-surface border border-line rounded-xl space-y-3 flex flex-col justify-between hover:border-accent/50 transition-colors">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ink font-display text-base font-semibold">
              <Sprout className="w-4 h-4 text-accent-text shrink-0" />
              <span>Growth Mechanics</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Explore the dual-branch <code className="text-ink">useOn</code> procedure: 10× focused plant growth vs. 50×2×50 area transformation with 200 villager particles.
            </p>
          </div>
          <a href="#/wiki/mechanics" className="inline-flex items-center gap-1.5 text-xs font-mono text-accent-text hover:underline underline-offset-4 uppercase tracking-wider font-semibold pt-2">
            <span>Inspect Logic</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* CARD 3: TRADES & LOOT */}
        <div className="p-5 bg-surface border border-line rounded-xl space-y-3 flex flex-col justify-between hover:border-accent/50 transition-colors">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ink font-display text-base font-semibold">
              <Coins className="w-4 h-4 text-accent-text shrink-0" />
              <span>Trades &amp; Loot</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Check Farmer and Wandering Trader emerald exchange rates, exact drop weights across 3 loot tables, and recipe unlock criteria.
            </p>
          </div>
          <a href="#/wiki/acquisition" className="inline-flex items-center gap-1.5 text-xs font-mono text-accent-text hover:underline underline-offset-4 uppercase tracking-wider font-semibold pt-2">
            <span>View Tables</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>

      {/* 5. QUICK DIRECTORY LINKS */}
      <div className="p-6 bg-surface border border-line rounded-xl space-y-4 transition-colors">
        <div className="text-xs font-mono text-ink-subtle uppercase tracking-widest font-semibold">
          Wiki Quick Reference
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
          {[
            { label: 'Mechanics', href: '#/wiki/mechanics', icon: Sprout },
            { label: 'Items', href: '#/wiki/items', icon: Package },
            { label: 'Crafting', href: '#/wiki/items', icon: Sparkles },
            { label: 'Trades & Loot', href: '#/wiki/acquisition', icon: Coins },
            { label: 'Mod Specs', href: '#/wiki/technical', icon: Cpu },
            { label: 'Versions', href: '#/wiki/versions', icon: Clock }
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
              className="p-3 bg-surface-alt border border-line hover:border-accent/60 hover:bg-surface rounded-lg transition-colors flex flex-col items-center gap-2 group"
            >
              <item.icon className="w-4 h-4 text-accent-text group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono text-ink group-hover:text-accent-text">{item.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center pt-6 border-t border-line text-[11px] font-mono text-ink-subtle uppercase tracking-widest">
        Created by honeypie_3301 using MCreator • GPLv3
      </div>

    </div>
  );
}
