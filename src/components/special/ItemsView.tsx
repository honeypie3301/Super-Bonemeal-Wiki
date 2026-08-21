import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Shield, Zap, Flame, Compass, HelpCircle, 
  Dna, Swords, Hammer, Award, Star, ListFilter, AlertCircle, Sparkles, Sprout, Coins, Layers,
  Users, Store, Check, ArrowRight, RefreshCw, Box
} from 'lucide-react';
import UpdatedFrame from '../UpdatedFrame';
import FancyRecipeView from './FancyRecipeView';

interface TradeOffer {
  merchantName: string;
  profession: string;
  level: string;
  workstation?: string;
  costCount: number;
  costItem: string;
  costLabel: string;
  yieldCount: number;
  yieldItem: string;
  yieldLabel: string;
  maxUses: number;
  restockNote: string;
  badgeColor: string;
  badgeBg: string;
}

interface ItemData {
  id: string;
  name: string;
  category: 'utility' | 'currency';
  desc: string;
  isUpdated?: boolean;
  burnTime?: string;
  stats?: { label: string; value: string }[];
  recipes?: string[];
  notes?: string[];
}

export default function ItemsView() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('super_bonemeal');
  const [activeTradeIndex, setActiveTradeIndex] = useState<number>(0);

  const categories = [
    { id: 'all', name: 'All Items & Tools', icon: Package },
    { id: 'utility', name: 'Fertilizers & Tools', icon: Sprout },
    { id: 'currency', name: 'Trading & Economy', icon: Coins }
  ];

  const tradeOffers: TradeOffer[] = [
    {
      merchantName: "Farmer Villager",
      profession: "Farmer",
      level: "Apprentice (Level 2)",
      workstation: "Composter",
      costCount: 1,
      costItem: "minecraft:emerald",
      costLabel: "Emerald",
      yieldCount: 2,
      yieldItem: "super_bonemeal:super_bonemeal",
      yieldLabel: "Super Bone Meal",
      maxUses: 10,
      restockNote: "Restocks up to 2 times per day when accessing assigned Composter workstation.",
      badgeColor: "text-[#4ade80]",
      badgeBg: "bg-[#0e2417] border-[#1b5e35]"
    },
    {
      merchantName: "Wandering Trader",
      profession: "Nomad Merchant",
      level: "Natural Wilderness Spawn",
      workstation: "None (Nomadic)",
      costCount: 2,
      costItem: "minecraft:emerald",
      costLabel: "Emeralds",
      yieldCount: 1,
      yieldItem: "super_bonemeal:super_bonemeal",
      yieldLabel: "Super Bone Meal",
      maxUses: 4,
      restockNote: "Finite stock. Wandering Trader despawns after 40–60 minutes without restocking.",
      badgeColor: "text-[#38bdf8]",
      badgeBg: "bg-[#0c1f2e] border-[#1e4a6d]"
    }
  ];

  const items: ItemData[] = [
    {
      id: "super_bonemeal",
      name: "Super Bone Meal",
      category: "utility",
      isUpdated: true,
      desc: "A concentrated, highly potent bone meal formulation capable of accelerating botanical growth across a massive 50x50 radius or instantly maturing crops and saplings through rapid-fire fertilizer pulses.",
      stats: [
        { label: "Coverage Radius", value: "50x50 Block Area (2,500 blocks)" },
        { label: "Instant Pulse Burst", value: "10 Pulses in 1 Tick" },
        { label: "Meadow Natural Density", value: "10% Random Distribution" },
        { label: "Smart Filter", value: "Skips Short Grass (Prevents Tall Grass clutter)" },
        { label: "Particle Burst", value: "100–200 Happy Villager Particles" },
        { label: "Stack Limit", value: "64 Items" },
        { label: "Survival Consumption", value: "Consumes 1 item per use (Infinite in Creative)" },
        { label: "Wandering Trader Trade", value: "2 Emeralds → 1 Super Bone Meal (Max 4)" },
        { label: "Farmer Villager Trade", value: "1 Emerald → 2 Super Bone Meal (Apprentice Lvl 2)" }
      ],
      notes: [
        "Precision Growth Strike: Right-clicking directly onto saplings (#minecraft:saplings, #c:saplings), crops (#minecraft:crops), moss blocks, sugar cane, or bamboo applies 10 consecutive growth bursts in a single tick, instantly forcing full maturity or tree growth.",
        "50x50 Terrain Fertilization: Right-clicking open terrain scans a 50x2x50 area around the player, generating wildflowers and vegetation on dirt and grass surfaces.",
        "Smart Meadow Filter: The procedure checks whether a target block is already Short Grass; if so, it skips it to prevent chaotic clutter into Tall Grass, maintaining a clean and aesthetically pleasing meadow.",
        "Trading Integration: Legitimate Survival acquisition is fully supported through wandering traders (2 Emeralds for 1 Super Bone Meal) and Level 2 apprentice farmer villagers (1 Emerald for 2 Super Bone Meal)."
      ]
    },
    {
      id: "emerald",
      name: "Emerald (Trading Currency)",
      category: "currency",
      desc: "The universal trade currency of Minecraft villagers. Used to buy Super Bone Meal from Wandering Traders or earned by selling crops to Farmer Villagers.",
      stats: [
        { label: "Registry Name", value: "minecraft:emerald" },
        { label: "Wandering Trader Rate", value: "2 Emeralds → 1 Super Bone Meal" },
        { label: "Farmer Apprentice Rate", value: "1 Emerald → 2 Super Bone Meal" },
        { label: "Rarity", value: "Uncommon" }
      ],
      notes: [
        "Wandering Traders offer up to 4 Super Bone Meal trades per appearance.",
        "Apprentice Farmer Villagers (Level 2) offer up to 10 trades before requiring restock at their composter."
      ]
    }
  ];

  // Sync with Table of Contents clicks
  useEffect(() => {
    const handleHeadingClick = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      const targetId = customEvent.detail.id;
      
      const matched = items.find(item => {
        const normalizedTarget = targetId.toLowerCase().replace(/-/g, '_');
        const normalizedId = item.id.toLowerCase();
        
        if (normalizedTarget === normalizedId) return true;
        if (normalizedTarget.includes(normalizedId)) return true;
        return false;
      });

      if (matched) {
        setSelectedItemId(matched.id);
      }
    };
    window.addEventListener('wiki-scroll-to-heading', handleHeadingClick);
    return () => window.removeEventListener('wiki-scroll-to-heading', handleHeadingClick);
  }, [items]);

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedItem = items.find(i => i.id === selectedItemId) || filteredItems[0] || items[0];

  return (
    <div className="space-y-6 select-text">
      
      {/* Search & Categories Header */}
      <div className="p-4 bg-[#140c12] border border-[#2b1725] rounded-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#a88a96]" />
          <input 
            type="text" 
            placeholder="Search items, mechanics, or trades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#0c070a] border border-[#261521] text-[#e8d0da] rounded-md focus:outline-none focus:border-[#f472b6] placeholder-[#6b4759]"
          />
        </div>
        
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 scrollbar-thin">
          <span className="text-[10px] font-mono text-[#a88a96] uppercase tracking-wider mr-2 hidden lg:inline">Filters:</span>
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  const firstInCat = items.find(i => cat.id === 'all' || i.category === cat.id);
                  if (firstInCat) setSelectedItemId(firstInCat.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-mono border transition-all cursor-pointer shrink-0 ${
                  isSelected 
                    ? 'bg-[#291321] border-[#6b2a4f] text-[#f9a8d4]' 
                    : 'bg-[#0f090d] border-[#22121c] text-[#a88a96] hover:text-[#fce7f3] hover:bg-[#180e15]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Items Catalog */}
        <div className="lg:col-span-5 space-y-2">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#a88a96] mb-2 flex items-center justify-between">
            <span>Item Directory ({filteredItems.length})</span>
            {searchQuery && <span className="text-[#f472b6] font-bold lowercase">Search active</span>}
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5 max-h-[500px] overflow-y-auto pr-1.5 scrollbar-thin">
            {filteredItems.map(item => {
              const isSelected = item.id === selectedItemId;
              return (
                <UpdatedFrame key={item.id} id={`item_btn_${item.id}`} isUpdated={!!item.isUpdated}>
                  <button
                    onClick={() => setSelectedItemId(item.id)}
                    className={`w-full text-left px-3.5 py-3 rounded-lg border transition-all shrink-0 cursor-pointer flex flex-col ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#291321]/60 to-[#140c12] border-[#6b2a4f] text-[#fce7f3] font-semibold'
                        : 'bg-[#0f090d] hover:bg-[#180e15] text-[#c4adb7] border-[#22121c]'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-serif text-xs text-[#fce7f3]">{item.name}</span>
                      <span className="text-[9px] font-mono uppercase opacity-75 text-[#f472b6]">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#a88a96] mt-1 line-clamp-1">{item.desc}</p>
                  </button>
                </UpdatedFrame>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-xs text-[#a88a96] border border-dashed border-[#291623] rounded-lg">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-[#63334e]" />
                No items match your search query or active filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Profiler & Dedicated Trading UI */}
        {selectedItem && (
          <div className="lg:col-span-7 p-6 bg-[#110a0e] border border-[#261521] rounded-xl space-y-6 relative overflow-hidden shadow-lg">
            {/* Ambient Background Grid Glow */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-pink-950/20 blur-3xl rounded-full pointer-events-none" />

            {/* Profile Header */}
            <div className="pb-3 border-b border-[#24131f] flex justify-between items-start">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-[#a88a96]">ITEM SPECIFICATION</span>
                <h3 className="font-serif text-xl font-bold text-[#fce7f3] mt-0.5">{selectedItem.name}</h3>
                <span className="inline-block text-[9px] font-mono uppercase text-[#f472b6] bg-[#1d0e17] border border-[#3d1a2f] px-1.5 py-0.5 rounded mt-1.5">
                  Category: {selectedItem.category}
                </span>
              </div>
              
              {selectedItem.burnTime && (
                <div className="text-right">
                  <span className="text-[9px] font-mono uppercase text-[#a88a96]">BURN TIME</span>
                  <div className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                    <Flame className="w-3.5 h-3.5" />
                    {selectedItem.burnTime}
                  </div>
                </div>
              )}
            </div>

            {/* Core Description */}
            <div className="space-y-2">
              <h4 className="text-[9px] font-mono text-[#a88a96] uppercase tracking-wider">Functional Overview</h4>
              <p className="text-xs sm:text-sm text-[#e8d0da] leading-relaxed">{selectedItem.desc}</p>
            </div>

            {/* Stats Attributes Table */}
            {selectedItem.stats && selectedItem.stats.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-[9px] font-mono text-[#a88a96] uppercase tracking-wider">Operational Parameters</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedItem.stats.map((stat, sIdx) => (
                    <div key={sIdx} className="p-2.5 bg-[#0a0609] border border-[#20101b] rounded-md font-mono text-[11px] flex justify-between items-center">
                      <span className="text-[#a88a96]">{stat.label}</span>
                      <span className="text-[#f9a8d4] font-bold">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DEDICATED VILLAGER TRADING EXCHANGE CARD */}
            <UpdatedFrame id="trading_exchange_card" isUpdated={true}>
              <div className="p-4 sm:p-5 bg-[#140c12] border border-[#36172a] rounded-xl space-y-4 shadow-md relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#281320]">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#f472b6]" />
                    <h4 className="font-serif text-sm font-bold text-[#fce7f3]">Villager & Trader Economy</h4>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 bg-[#25101e] text-[#f9a8d4] border border-[#4d1f3b] rounded">
                    Survival Acquisition
                  </span>
                </div>

                {/* Trade Selector Switcher */}
                <div className="grid grid-cols-2 gap-2">
                  {tradeOffers.map((offer, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTradeIndex(idx)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        activeTradeIndex === idx
                          ? 'bg-[#291321] border-[#6b2a4f] shadow-inner'
                          : 'bg-[#0f090d] border-[#22121c] hover:bg-[#180e15] opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-serif font-bold text-[#fce7f3] truncate">{offer.merchantName}</span>
                        {activeTradeIndex === idx && <Check className="w-3.5 h-3.5 text-[#f472b6] shrink-0" />}
                      </div>
                      <span className={`text-[9px] font-mono mt-1 ${offer.badgeColor}`}>
                        {offer.level}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Active Trading Interface */}
                {(() => {
                  const currentTrade = tradeOffers[activeTradeIndex];
                  return (
                    <div className="p-4 bg-[#0a0508] border border-[#24111d] rounded-xl space-y-4">
                      {/* Trade Visual Slots Banner */}
                      <div className="flex items-center justify-center gap-3 sm:gap-6 py-3 px-2 bg-[#12080f] border border-[#2b1422] rounded-lg shadow-inner">
                        
                        {/* INPUT: Emeralds */}
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-mono uppercase text-[#a88a96] mb-1 font-bold">Cost</span>
                          <div className="relative group">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#0e2417] border-2 border-[#1b5e35] text-[#4ade80] rounded-xl flex flex-col items-center justify-center shadow-lg group-hover:shadow-[0_0_12px_rgba(74,222,128,0.3)] transition-all">
                              <span className="font-mono text-sm sm:text-base font-bold">Em</span>
                            </div>
                            <span className="absolute bottom-0.5 right-0.5 bg-[#08170e] border border-[#1b5e35] text-[#4ade80] px-1 text-[9px] sm:text-[10px] font-mono font-bold rounded">
                              x{currentTrade.costCount}
                            </span>
                            {/* Tooltip */}
                            <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#12090e] border border-[#3b1c2e] text-[10px] font-mono p-2 rounded shadow-2xl z-30 flex flex-col items-center gap-0.5 whitespace-nowrap">
                              <span className="text-[#4ade80] font-bold">{currentTrade.costLabel}</span>
                              <span className="text-[#a88a96] text-[8px]">{currentTrade.costItem}</span>
                            </div>
                          </div>
                        </div>

                        {/* Trade Arrow */}
                        <div className="flex flex-col items-center text-[#f472b6] animate-pulse">
                          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                          <span className="text-[8px] font-mono text-[#a88a96] mt-0.5 uppercase tracking-wider font-bold">EXCHANGE</span>
                        </div>

                        {/* OUTPUT: Super Bone Meal */}
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-mono uppercase text-[#a88a96] mb-1 font-bold">Yield</span>
                          <div className="relative group">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#2b1020] border-2 border-[#632043] text-[#f472b6] rounded-xl flex flex-col items-center justify-center shadow-lg group-hover:shadow-[0_0_12px_rgba(244,114,182,0.3)] transition-all">
                              <span className="font-mono text-sm sm:text-base font-bold">Sbm</span>
                            </div>
                            <span className="absolute bottom-0.5 right-0.5 bg-[#1c0a15] border border-[#632043] text-[#f9a8d4] px-1 text-[9px] sm:text-[10px] font-mono font-bold rounded">
                              x{currentTrade.yieldCount}
                            </span>
                            {/* Tooltip */}
                            <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#12090e] border border-[#3b1c2e] text-[10px] font-mono p-2 rounded shadow-2xl z-30 flex flex-col items-center gap-0.5 whitespace-nowrap">
                              <span className="text-[#f9a8d4] font-bold">{currentTrade.yieldLabel}</span>
                              <span className="text-[#a88a96] text-[8px]">{currentTrade.yieldItem}</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Trade Parameters List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="p-2 bg-[#140a11] border border-[#261320] rounded flex justify-between items-center">
                          <span className="text-[#a88a96]">Merchant Type:</span>
                          <span className="text-[#fce7f3] font-bold">{currentTrade.merchantName}</span>
                        </div>
                        <div className="p-2 bg-[#140a11] border border-[#261320] rounded flex justify-between items-center">
                          <span className="text-[#a88a96]">Merchant Level:</span>
                          <span className={`${currentTrade.badgeColor} font-bold`}>{currentTrade.level}</span>
                        </div>
                        <div className="p-2 bg-[#140a11] border border-[#261320] rounded flex justify-between items-center">
                          <span className="text-[#a88a96]">Workstation Site:</span>
                          <span className="text-[#f9a8d4] font-bold">{currentTrade.workstation}</span>
                        </div>
                        <div className="p-2 bg-[#140a11] border border-[#261320] rounded flex justify-between items-center">
                          <span className="text-[#a88a96]">Max Stock / Uses:</span>
                          <span className="text-amber-400 font-bold">{currentTrade.maxUses} Trades per cycle</span>
                        </div>
                      </div>

                      {/* Restock & Mechanics Note */}
                      <div className="p-2.5 bg-[#170c14] border border-[#331828] rounded text-[10px] font-mono text-[#c4adb7] leading-relaxed">
                        <span className="text-[#f472b6] font-bold mr-1">RESTOCK PROTOCOL:</span>
                        {currentTrade.restockNote}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </UpdatedFrame>

            {/* Visual Crafting Recipe Block */}
            <FancyRecipeView 
              itemIds={
                selectedItem.id === 'super_bonemeal'
                  ? ['super_bonemeal:super_bonemeal']
                  : [selectedItem.id]
              }
              title="Crafting Recipe Blueprint"
            />

            {/* Tactical Notes */}
            {selectedItem.notes && selectedItem.notes.length > 0 && (
              <div className="p-3.5 bg-[#0a0609] border border-[#291423] rounded-lg space-y-2">
                <h4 className="text-[9px] font-mono text-[#a88a96] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#f472b6]" />
                  Field Mechanics & Operational Log
                </h4>
                <ul className="text-xs text-[#c4adb7] space-y-1.5 list-disc pl-4 leading-relaxed font-mono">
                  {selectedItem.notes.map((note, nIdx) => (
                    <li key={nIdx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
