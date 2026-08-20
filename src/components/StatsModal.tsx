import React from 'react';
import { X, Terminal, Cpu, CheckCircle2 } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0d080b] border border-[#2e1726] p-6 text-xs font-mono space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2e1726]">
          <div className="flex items-center gap-2 text-[#f472b6] font-bold">
            <Terminal className="w-5 h-5" />
            <span className="text-sm tracking-wider uppercase">MOD SPECIFICATIONS</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8c607a] hover:text-[#fce7f3] hover:bg-[#210f1a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Specs List */}
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-[#130b10] border border-[#261420] space-y-1">
            <div className="flex items-center justify-between text-[#8c607a] text-[10px] uppercase">
              <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-[#f472b6]" /> Runtime Target</span>
              <span className="text-[#fce7f3] font-bold">NeoForge 1.21.1</span>
            </div>
            <p className="text-[#a88098]">Target Platform: Java 21 / NeoForge Mod Loader</p>
          </div>

          <div className="p-3 rounded-lg bg-[#130b10] border border-[#261420] space-y-2">
            <span className="text-[#8c607a] text-[10px] uppercase block">Loaded Mod Elements</span>
            <ul className="space-y-1 text-[#a88098] text-[11px]">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#f472b6]" /> Item: Super Bonemeal (<code className="text-[#fce7f3]">super_bonemeal</code>)</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#f472b6]" /> Procedure: SuperBonemealRightclickedOnBlock</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#f472b6]" /> Recipe: SuperBonemealRecipe (9 Bone Blocks)</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#f472b6]" /> Trade: SuperBoneMealTrade (Farmer & Wandering Trader)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#2e1726] text-center text-[10px] text-[#5c3c4f]">
          SUPER BONE MEAL WIKI • LICENSED UNDER GNU GPL v3
        </div>
      </div>
    </div>
  );
};
