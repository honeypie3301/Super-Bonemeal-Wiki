import React from 'react';
import { UpdatedFrame } from '../UpdatedFrame';
import { TradeView } from '../TradeView';
import { TRADES_DATA } from '../../data/wikiData';
import { ShoppingBag } from 'lucide-react';

export const TradesView: React.FC = () => {
  return (
    <div className="space-y-6 w-full">
      {/* Breadcrumb Header */}
      <div className="text-[10px] font-mono tracking-widest text-[#8c607a] uppercase flex items-center gap-2">
        <span>WIKI</span>
        <span>/</span>
        <span>FLORA & FAUNA</span>
        <span>/</span>
        <span className="text-[#f472b6] font-semibold">MERCHANT & VILLAGER TRADES</span>
      </div>

      {/* Title */}
      <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#fce7f3] tracking-tight">
        Merchant & Villager Trades
      </h1>

      <UpdatedFrame id="trades_frame">
        <div className="space-y-5">
          <p className="text-xs font-sans text-[#a88098] leading-relaxed">
            Super Bone Meal is integrated directly into NeoForge villager trade events via <code className="text-[#f472b6]">SuperBonemealModTrades.java</code>. You do not need to rely solely on crafting with Bone Blocks!
          </p>

          <TradeView trades={TRADES_DATA} />

          <div className="p-4 rounded-xl bg-[#130b10] border border-[#261420] space-y-2 text-xs font-mono">
            <h3 className="font-bold text-[#fce7f3] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#f472b6]" />
              Trading Strategy Tips
            </h3>
            <ul className="space-y-1 text-[#a88098] pl-2">
              <li>• Level 2 Farmer Villagers offer the best value: 1 Emerald yields 2 Super Bone Meal (up to 20 Super Bone Meal per restock).</li>
              <li>• Wandering Traders stock 4 single units per visit for 2 Emeralds each.</li>
            </ul>
          </div>
        </div>
      </UpdatedFrame>
    </div>
  );
};
