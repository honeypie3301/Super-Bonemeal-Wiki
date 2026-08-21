import React from 'react';
import { UpdatedFrame } from '../UpdatedFrame';
import { Zap, Layers, CheckCircle, Code } from 'lucide-react';

export const MechanicsView: React.FC = () => {
  return (
    <div className="space-y-8 w-full">
      {/* Breadcrumb Header */}
      <div className="text-[10px] font-mono tracking-widest text-[#8c607a] uppercase flex items-center gap-2">
        <span>WIKI</span>
        <span>/</span>
        <span>MECHANICS</span>
        <span>/</span>
        <span className="text-[#f472b6] font-semibold">50X50 AOE & GROWTH LOGIC</span>
      </div>

      {/* Title */}
      <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#fce7f3] tracking-tight">
        Mechanics
      </h1>

      <UpdatedFrame id="mechanics_aoe_frame">
        <div className="space-y-6">
          {/* Section 1: Targeted Growth Branch */}
          <div className="space-y-3">
            <h2 className="font-serif font-bold text-lg text-[#fce7f3] flex items-center gap-2 border-b border-[#2e1726] pb-2">
              <Layers className="w-5 h-5 text-[#f472b6]" />
              1. Targeted Plant Right-Click (10x Brute-Force Loop)
            </h2>
            <p className="text-xs font-sans text-[#a88098] leading-relaxed">
              When right-clicking directly on a block that matches saplings, crops, moss, or snow plants, the procedure executes an intensive 10-iteration loop calling <code className="text-[#f472b6]">BoneMealItem.growCrop()</code> or <code className="text-[#f472b6]">growWaterPlant()</code>.
            </p>

            <div className="p-6 sm:p-8 rounded-xl bg-[#130b10] border border-[#261420] space-y-2 text-xs font-mono">
              <span className="text-[10px] text-[#f472b6] uppercase font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Tag Compatibility List
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[#fce7f3] pt-1">
                <li className="p-1.5 rounded bg-[#180d14] border border-[#2e1726]">
                  • <code className="text-[#f472b6]">minecraft:moss_block</code>
                </li>
                <li className="p-1.5 rounded bg-[#180d14] border border-[#2e1726]">
                  • Tag <code className="text-[#f472b6]">#minecraft:saplings</code>
                </li>
                <li className="p-1.5 rounded bg-[#180d14] border border-[#2e1726]">
                  • Tag <code className="text-[#f472b6]">#minecraft:crops</code>
                </li>
                <li className="p-1.5 rounded bg-[#180d14] border border-[#2e1726]">
                  • Tag <code className="text-[#f472b6]">#c:saplings</code> (Common Forge/NeoForge)
                </li>
                <li className="p-1.5 rounded bg-[#180d14] border border-[#2e1726]">
                  • Tag <code className="text-[#f472b6]">snowrealmagic:plants</code>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2: 50x50 Radius Branch */}
          <div className="space-y-3 pt-4 border-t border-[#2e1726]">
            <h2 className="font-serif font-bold text-lg text-[#fce7f3] flex items-center gap-2 border-b border-[#2e1726] pb-2">
              <Zap className="w-5 h-5 text-[#f472b6]" />
              2. Terrain 50x50 AoE Ground Right-Click
            </h2>
            <p className="text-xs font-sans text-[#a88098] leading-relaxed">
              When right-clicking on any standard block (such as grass, dirt, stone, or sand), the mod triggers 200 Happy Villager green particle bursts and executes a 3D bounding box loop:
            </p>

            <div className="p-6 sm:p-8 rounded-xl bg-[#130b10] border border-[#261420] space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-[#8c607a] text-[10px] pb-1 border-b border-[#2e1726]">
                <span>Bounding Box Calculation</span>
                <span className="text-[#f472b6] font-bold">50 x 2 x 50 Blocks</span>
              </div>
              <div className="text-[#fce7f3] space-y-1 pt-1">
                <p>sx = player_x - 25;</p>
                <p>sy = player_y - 1;</p>
                <p>sz = player_z - 25;</p>
              </div>
              <p className="text-[11px] text-[#a88098] pt-2">
                For every non-grass block in this 50x50 area, there is a <strong>10% probability</strong> (<code className="text-[#f472b6]">Math.random() &lt; 0.1</code>) per pulse of triggering an instant bone meal growth event!
              </p>
            </div>
          </div>

          {/* Source Code Snippet */}
          <div className="p-6 sm:p-8 rounded-xl bg-[#0d080b] border border-[#261420] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8c607a]">
              <Code className="w-4 h-4 text-[#f472b6]" />
              <span>SuperBonemealRightclickedOnBlockProcedure.java Snippet</span>
            </div>
            <pre className="p-3 rounded bg-[#130b10] text-[11px] font-mono text-[#fce7f3] overflow-x-auto leading-relaxed border border-[#2e1726]">
{`if (world instanceof ServerLevel _level)
    _level.sendParticles(ParticleTypes.HAPPY_VILLAGER, x, y, z, 200, 6, 1.6, 6, 1);

// 10x Loop for Target Saplings/Crops
for (int index0 = 0; index0 < 10; index0++) {
    BoneMealItem.growCrop(new ItemStack(Items.BONE_MEAL), _level, _bp);
}`}
            </pre>
          </div>
        </div>
      </UpdatedFrame>
    </div>
  );
};
