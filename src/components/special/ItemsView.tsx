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
    { id: 'all', name: 'All Items', icon: Package },
    { id: 'utility', name: 'Fertilizers', icon: Sprout }
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
      restockNote: "Level 2 trade. Price multiplier 0.05, 7 XP.",
      badgeColor: "text-[#4ade80]",
      badgeBg: "bg-[#0e2417] border-[#1b5e35]"
    },
    {
      merchantName: "Wandering Trader",
      profession: "Wandering Trader",
      level: "Generic Trade",
      workstation: "None",
      costCount: 2,
      costItem: "minecraft:emerald",
      costLabel: "Emeralds",
      yieldCount: 1,
      yieldItem: "super_bonemeal:super_bonemeal",
      yieldLabel: "Super Bone Meal",
      maxUses: 4,
      restockNote: "Generic trade. Price multiplier 0.04, 5 XP.",
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
      desc: "Tired of vanilla bonemeal only growing a tiny patch of grass? Super Bonemeal expands your gardening power to a massive 50x50 area, allowing you to transform landscapes in a single click.",
      stats: [
        { label: "Registry Name", value: "super_bonemeal:super_bonemeal" },
        { label: "Rarity", value: "Uncommon" },
        { label: "Creative Tab", value: "Functional Blocks" },
        { label: "Max Stack Size", value: "64" },
        { label: "Area Dimensions", value: "50x2x50 blocks (x-25..+24, y-1..y, z-25..+24)" },
        { label: "Area Growth Chance", value: "10% per block (!Blocks.SHORT_GRASS)" },
        { label: "Targeted Growth Calls", value: "10 cycles per use" },
        { label: "Particles", value: "200 HAPPY_VILLAGER (dx: 6, dy: 1.6, dz: 6, speed: 1)" },
        { label: "Crafting Yield", value: "4 Bone Blocks + 5 Bone Meal -> 2 Super Bone Meal" },
        { label: "Archaeology Loot", value: "10% chance (0-3 items)" },
        { label: "Chest Loot", value: "6% chance (1-5 items)" },
        { label: "Fishing Loot", value: "25% chance (1-2 items)" }
      ],
      notes: [
        "Right-clicking a block with tag #minecraft:saplings, #minecraft:crops, #c:saplings, #snowrealmagic:plants, or Blocks.MOSS_BLOCK executes 10 bone meal growth calls (growCrop/growWaterPlant) and triggers levelEvent 2005.",
        "Right-clicking any other block scans coordinates from x-25 to x+24, y-1 to y, and z-25 to z+24. If the block is not Blocks.SHORT_GRASS and Math.random() < 0.1, it executes bone meal growth and levelEvent 2005.",
        "Emits 200 Happy Villager particles at the clicked position on execution.",
        "Consumes 1 item from the stack unless the player is in Creative mode (instabuild).",
        "Crafted shapelessly using 4 Bone Blocks and 5 Bone Meals.",
        "Wandering Traders offer 1 Super Bone Meal for 2 Emeralds (max 4 trades).",
        "Apprentice Farmer Villagers offer 2 Super Bone Meals for 1 Emerald (max 10 trades)."
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
      <div className="p-4 bg-[#14110d] border border-[#2b2219] rounded-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8c7e6c]" />
          <input 
            type="text" 
            placeholder="Search items, mechanics, or trades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#0d0b09] border border-[#261f18] text-[#ede4d4] rounded-md focus:outline-none focus:border-[#d4b28c] placeholder-[#6e5e4e]"
          />
        </div>
        
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 scrollbar-thin">
          <span className="text-[10px] font-mono text-[#8c7e6c] uppercase tracking-wider mr-2 hidden lg:inline">Filters:</span>
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
                    ? 'bg-[#2a2017] border-[#6e5539] text-[#dfc9ab]' 
                    : 'bg-[#120f0c] border-[#261e16] text-[#8c7e6c] hover:text-[#fbf7f0] hover:bg-[#1a1410]'
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
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#8c7e6c] mb-2 flex items-center justify-between">
            <span>Item Directory ({filteredItems.length})</span>
            {searchQuery && <span className="text-[#d4b28c] font-bold lowercase">Search active</span>}
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
                        ? 'bg-gradient-to-r from-[#2a2017]/60 to-[#14110d] border-[#6e5539] text-[#fbf7f0] font-semibold'
                        : 'bg-[#120f0c] hover:bg-[#1a1410] text-[#b8a994] border-[#261e16]'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-serif text-xs text-[#fbf7f0]">{item.name}</span>
                      <span className="text-[9px] font-mono uppercase opacity-75 text-[#d4b28c]">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8c7e6c] mt-1 line-clamp-1">{item.desc}</p>
                  </button>
                </UpdatedFrame>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-xs text-[#8c7e6c] border border-dashed border-[#2e241c] rounded-lg">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-[#614d3a]" />
                No items match your search query or active filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Profiler & Dedicated Trading UI */}
        {selectedItem && (
          <div className="lg:col-span-7 p-6 bg-[#13100d] border border-[#261f18] rounded-xl space-y-6 relative overflow-hidden shadow-lg">
            {/* Ambient Background Grid Glow */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#2a2118]/20 blur-3xl rounded-full pointer-events-none" />

            {/* Profile Header */}
            <div className="pb-3 border-b border-[#261e17] flex justify-between items-start">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-[#8c7e6c]">ITEM SPECIFICATION</span>
                <h3 className="font-serif text-xl font-bold text-[#fbf7f0] mt-0.5">{selectedItem.name}</h3>
                <span className="inline-block text-[9px] font-mono uppercase text-[#d4b28c] bg-[#1e1812] border border-[#403324] px-1.5 py-0.5 rounded mt-1.5">
                  Category: {selectedItem.category}
                </span>
              </div>
              
              {selectedItem.burnTime && (
                <div className="text-right">
                  <span className="text-[9px] font-mono uppercase text-[#8c7e6c]">BURN TIME</span>
                  <div className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                    <Flame className="w-3.5 h-3.5" />
                    {selectedItem.burnTime}
                  </div>
                </div>
              )}
            </div>

            {/* Core Description */}
            <div className="space-y-2">
              <h4 className="text-[9px] font-mono text-[#8c7e6c] uppercase tracking-wider">Functional Overview</h4>
              <p className="text-xs sm:text-sm text-[#ede4d4] leading-relaxed">{selectedItem.desc}</p>
            </div>

            {/* Stats Attributes Table */}
            {selectedItem.stats && selectedItem.stats.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-[9px] font-mono text-[#8c7e6c] uppercase tracking-wider">Item Properties</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedItem.stats.map((stat, sIdx) => (
                    <div key={sIdx} className="p-2.5 bg-[#0d0b09] border border-[#221b14] rounded-md font-mono text-[11px] flex justify-between items-center">
                      <span className="text-[#8c7e6c]">{stat.label}</span>
                      <span className="text-[#dfc9ab] font-bold">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DEDICATED VILLAGER TRADING EXCHANGE CARD */}
            <UpdatedFrame id="trading_exchange_card" isUpdated={true}>
              <div className="p-4 sm:p-5 bg-[#14110d] border border-[#3a2d21] rounded-xl space-y-4 shadow-md relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#2b2118]">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#d4b28c]" />
                    <h4 className="font-serif text-sm font-bold text-[#fbf7f0]">Villager & Trader Trades</h4>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 bg-[#261e16] text-[#dfc9ab] border border-[#4e3d2c] rounded">
                    Survival Trading
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
                          ? 'bg-[#2a2017] border-[#6e5539] shadow-inner'
                          : 'bg-[#120f0c] border-[#261e16] hover:bg-[#1a1410] opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-serif font-bold text-[#fbf7f0] truncate">{offer.merchantName}</span>
                        {activeTradeIndex === idx && <Check className="w-3.5 h-3.5 text-[#d4b28c] shrink-0" />}
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
                    <div className="p-4 bg-[#0d0b09] border border-[#261d16] rounded-xl space-y-4">
                      {/* Trade Visual Slots Banner */}
                      <div className="flex items-center justify-center gap-3 sm:gap-6 py-3 px-2 bg-[#14100d] border border-[#2d2218] rounded-lg shadow-inner">
                        
                        {/* INPUT: Emeralds */}
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-mono uppercase text-[#8c7e6c] mb-1 font-bold">Cost</span>
                          <div className="relative group">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#0e2417] border-2 border-[#1b5e35] text-[#4ade80] rounded-xl flex flex-col items-center justify-center shadow-lg group-hover:shadow-[0_0_12px_rgba(74,222,128,0.3)] transition-all">
                              <span className="font-mono text-sm sm:text-base font-bold">Em</span>
                            </div>
                            <span className="absolute bottom-0.5 right-0.5 bg-[#08170e] border border-[#1b5e35] text-[#4ade80] px-1 text-[9px] sm:text-[10px] font-mono font-bold rounded">
                              x{currentTrade.costCount}
                            </span>
                            {/* Tooltip */}
                            <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#14100d] border border-[#3d3023] text-[10px] font-mono p-2 rounded shadow-2xl z-30 flex flex-col items-center gap-0.5 whitespace-nowrap">
                              <span className="text-[#4ade80] font-bold">{currentTrade.costLabel}</span>
                              <span className="text-[#8c7e6c] text-[8px]">{currentTrade.costItem}</span>
                            </div>
                          </div>
                        </div>

                        {/* Trade Arrow */}
                        <div className="flex flex-col items-center text-[#d4b28c]">
                          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                          <span className="text-[8px] font-mono text-[#8c7e6c] mt-0.5 uppercase tracking-wider font-bold">TRADE</span>
                        </div>

                        {/* OUTPUT: Super Bone Meal */}
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-mono uppercase text-[#8c7e6c] mb-1 font-bold">Yield</span>
                          <div className="relative group">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#261e16] border-2 border-[#6e5539] text-[#d4b28c] rounded-xl flex flex-col items-center justify-center shadow-lg group-hover:shadow-[0_0_12px_rgba(212,178,140,0.3)] transition-all">
                              <span className="font-mono text-sm sm:text-base font-bold">Sbm</span>
                            </div>
                            <span className="absolute bottom-0.5 right-0.5 bg-[#1a140f] border border-[#6e5539] text-[#dfc9ab] px-1 text-[9px] sm:text-[10px] font-mono font-bold rounded">
                              x{currentTrade.yieldCount}
                            </span>
                            {/* Tooltip */}
                            <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-all absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#14100d] border border-[#3d3023] text-[10px] font-mono p-2 rounded shadow-2xl z-30 flex flex-col items-center gap-0.5 whitespace-nowrap">
                              <span className="text-[#dfc9ab] font-bold">{currentTrade.yieldLabel}</span>
                              <span className="text-[#8c7e6c] text-[8px]">{currentTrade.yieldItem}</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Trade Parameters List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="p-2 bg-[#15110d] border border-[#261320] rounded flex justify-between items-center">
                          <span className="text-[#8c7e6c]">Merchant:</span>
                          <span className="text-[#fbf7f0] font-bold">{currentTrade.merchantName}</span>
                        </div>
                        <div className="p-2 bg-[#15110d] border border-[#261320] rounded flex justify-between items-center">
                          <span className="text-[#8c7e6c]">Trade Level:</span>
                          <span className={`${currentTrade.badgeColor} font-bold`}>{currentTrade.level}</span>
                        </div>
                        <div className="p-2 bg-[#15110d] border border-[#261320] rounded flex justify-between items-center">
                          <span className="text-[#8c7e6c]">Workstation:</span>
                          <span className="text-[#dfc9ab] font-bold">{currentTrade.workstation}</span>
                        </div>
                        <div className="p-2 bg-[#15110d] border border-[#261320] rounded flex justify-between items-center">
                          <span className="text-[#8c7e6c]">Max Trades:</span>
                          <span className="text-amber-400 font-bold">{currentTrade.maxUses} uses</span>
                        </div>
                      </div>

                      {/* Details Note */}
                      <div className="p-2.5 bg-[#18130f] border border-[#382b1f] rounded text-[10px] font-mono text-[#b8a994] leading-relaxed">
                        <span className="text-[#d4b28c] font-bold mr-1">TRADE PARAMETERS:</span>
                        {currentTrade.restockNote}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </UpdatedFrame>

            {/* DEDICATED LOOT TABLES BREAKDOWN CARD (v1.4.0) */}
            <UpdatedFrame id="loot_tables_v140_card" isUpdated={true}>
              <div className="p-4 sm:p-5 bg-[#14110d] border border-[#3a2d21] rounded-xl space-y-3 shadow-md relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#2b2118]">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-[#d4b28c]" />
                    <h4 className="font-serif text-sm font-bold text-[#fbf7f0]">Loot Tables</h4>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 bg-[#261e16] text-[#dfc9ab] border border-[#4e3d2c] rounded">
                    Drops
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* Archaeology */}
                  <div className="p-3 bg-[#0d0b09] border border-[#261d16] rounded-lg space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-[#dfc9ab] font-bold text-xs">
                      <span>Archaeology</span>
                      <span className="text-[9px] bg-[#1e1812] px-1.5 py-0.5 border border-[#3d3023] rounded text-emerald-400">10% Chance</span>
                    </div>
                    <p className="text-[10px] text-[#8c7e6c] leading-tight">Brushing suspicious sand or gravel.</p>
                    <div className="text-[10px] text-amber-300 font-bold">Count: 0–3 items</div>
                  </div>

                  {/* Structure Chests */}
                  <div className="p-3 bg-[#0d0b09] border border-[#261d16] rounded-lg space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-[#dfc9ab] font-bold text-xs">
                      <span>Chests</span>
                      <span className="text-[9px] bg-[#1e1812] px-1.5 py-0.5 border border-[#3d3023] rounded text-sky-400">6% Chance</span>
                    </div>
                    <p className="text-[10px] text-[#8c7e6c] leading-tight">Naturally generated chests.</p>
                    <div className="text-[10px] text-amber-300 font-bold">Count: 1–5 items</div>
                  </div>

                  {/* Fishing */}
                  <div className="p-3 bg-[#0d0b09] border border-[#261d16] rounded-lg space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-[#dfc9ab] font-bold text-xs">
                      <span>Fishing</span>
                      <span className="text-[9px] bg-[#1e1812] px-1.5 py-0.5 border border-[#3d3023] rounded text-amber-400">25% Chance</span>
                    </div>
                    <p className="text-[10px] text-[#8c7e6c] leading-tight">Fishing gameplay catches.</p>
                    <div className="text-[10px] text-amber-300 font-bold">Count: 1–2 items</div>
                  </div>
                </div>
              </div>
            </UpdatedFrame>

            {/* Visual Crafting Recipe Block */}
            <FancyRecipeView 
              itemIds={['super_bonemeal:super_bonemeal']}
              title="Crafting Recipe"
            />

            {/* Tactical Notes */}
            {selectedItem.notes && selectedItem.notes.length > 0 && (
              <div className="p-3.5 bg-[#0d0b09] border border-[#291423] rounded-lg space-y-2">
                <h4 className="text-[9px] font-mono text-[#8c7e6c] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#d4b28c]" />
                  Procedure & Mechanic Details
                </h4>
                <ul className="text-xs text-[#b8a994] space-y-1.5 list-disc pl-4 leading-relaxed font-mono">
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
