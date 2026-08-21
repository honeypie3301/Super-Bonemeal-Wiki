import React from 'react';
import { TradeSpec } from '../types';
import { ArrowRight, Coins, UserCheck } from 'lucide-react';

interface TradeViewProps {
  trades: TradeSpec[];
}

export const TradeView: React.FC<TradeViewProps> = ({ trades }) => {
  return (
    <div className="space-y-4 my-6">
      {trades.map((trade, idx) => (
        <div
          key={idx}
          className="p-6 sm:p-8 rounded-xl bg-[#130b10] border border-[#2e1726]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2e1726]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#24111d] border border-[#52213f] flex items-center justify-center text-[#f472b6]">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-[#fce7f3]">
                  {trade.profession}
                </h3>
                <p className="text-[10px] font-mono text-[#8c607a]">
                  Level {trade.level}: {trade.levelTitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#f472b6] bg-[#24111d] px-2.5 py-1 rounded border border-[#52213f]">
              <Coins className="w-3 h-3" />
              <span>{trade.maxTrades} Max Uses/Day</span>
            </div>
          </div>

          {/* Trade Offer Layout */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 p-4 bg-[#0d080b] rounded-lg border border-[#261420]">
            {/* Payment */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#180d14] border border-[#3b1c31] flex items-center justify-center relative">
                <div className="w-7 h-7 bg-emerald-700 rounded rotate-45 border border-emerald-400 flex items-center justify-center">
                  <span className="-rotate-45 font-mono text-[9px] font-bold text-emerald-100">EM</span>
                </div>
                {trade.cost.count > 1 && (
                  <span className="absolute bottom-0.5 right-1.5 text-xs font-mono font-bold text-[#f472b6]">
                    {trade.cost.count}
                  </span>
                )}
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-[#fce7f3]">
                  {trade.cost.count}x {trade.cost.item}
                </span>
                <p className="text-[10px] font-mono text-[#8c607a]">Merchant Cost</p>
              </div>
            </div>

            {/* Exchange Arrow */}
            <ArrowRight className="w-5 h-5 text-[#f472b6] shrink-0" />

            {/* Offer Receive */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#2b1422] border border-[#52213f] flex items-center justify-center relative">
                <span className="font-mono text-xs font-bold text-[#f472b6]">SBM</span>
                <span className="absolute bottom-0.5 right-1.5 text-xs font-mono font-bold text-[#f472b6]">
                  {trade.result.count}
                </span>
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-[#fce7f3]">
                  {trade.result.count}x {trade.result.item}
                </span>
                <p className="text-[10px] font-mono text-[#8c607a]">
                  +{trade.xpGain} Merchant XP
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
