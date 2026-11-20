import React, { useState } from 'react';
import {
  Sprout,
  Target,
  Maximize2,
  Sparkles,
  CheckCircle2,
  Filter,
  Layers,
  Code2
} from 'lucide-react';
import UpdatedFrame from '../UpdatedFrame';

export default function MechanicsView() {
  const [selectedMode, setSelectedMode] = useState<'targeted' | 'area'>('targeted');

  const targetedTriggers = [
    {
      id: 'minecraft:moss_block',
      kind: 'Block Match',
      detail: 'Direct comparison against Blocks.MOSS_BLOCK to spread moss, azalea, and moss carpet rapidly.'
    },
    {
      id: 'minecraft:saplings',
      kind: 'Vanilla Block Tag',
      detail: 'Matches all vanilla tree saplings (Oak, Spruce, Birch, Jungle, Acacia, Dark Oak, Cherry, Mangrove propagules).'
    },
    {
      id: 'minecraft:crops',
      kind: 'Vanilla Block Tag',
      detail: 'Matches farmland crops such as Wheat, Carrots, Potatoes, Beetroots, Melon/Pumpkin stems, and Torchflowers.'
    },
    {
      id: 'c:saplings',
      kind: 'NeoForge Common Tag',
      detail: 'Provides universal compatibility with saplings added by third-party biome and forestry mods.'
    },
    {
      id: 'snowrealmagic:plants',
      kind: 'Mod Compatibility Tag',
      detail: 'Explicitly supports Snow! Real Magic! snowlogged plant blocks for targeted growth.'
    }
  ];

  return (
    <div className="space-y-8 max-w-[1000px] mx-auto text-ink-muted select-text">

      {/* Header Overview */}
      <div className="p-6 bg-surface border border-line rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-accent-text uppercase tracking-wider font-semibold">
          <Sprout className="w-4 h-4" />
          <span>SuperBonemealRightclickedOnBlockProcedure</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-ink">
          Dual-Branch Growth Engine
        </h2>
        <p className="text-sm text-ink-muted leading-relaxed">
          When a player right-clicks any block with <strong className="text-ink">Super Bone Meal</strong> (<code className="text-accent-text font-mono text-xs">useOn</code>), the item emits a massive <strong className="text-ink">200-particle</strong> burst of <code className="font-mono text-xs text-ink">HAPPY_VILLAGER</code> sparkles and evaluates the target block to choose between <strong className="text-accent-text">Focused 10× Boost</strong> or <strong className="text-accent-text">50×2×50 Area Transformation</strong>.
        </p>
      </div>

      {/* Interactive Mode Switcher */}
      <UpdatedFrame id="sb_mechanics_mode_switcher" isUpdated={true}>
        <div className="p-6 bg-surface border border-line rounded-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">
                Execution Branch Inspector
              </h3>
              <p className="text-xs font-mono text-ink-subtle mt-0.5">
                Select a branch to inspect exact coordinates, loops, and probabilities
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMode('targeted')}
                className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 border transition-colors cursor-pointer ${
                  selectedMode === 'targeted'
                    ? 'bg-accent-soft text-accent-text border-accent-border'
                    : 'bg-surface-alt text-ink-muted border-line hover:text-ink'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Branch 1: Targeted (10×)</span>
              </button>
              <button
                onClick={() => setSelectedMode('area')}
                className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 border transition-colors cursor-pointer ${
                  selectedMode === 'area'
                    ? 'bg-accent-soft text-accent-text border-accent-border'
                    : 'bg-surface-alt text-ink-muted border-line hover:text-ink'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Branch 2: Area (50×2×50)</span>
              </button>
            </div>
          </div>

          {selectedMode === 'targeted' ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-surface-alt border border-line rounded-lg">
                  <div className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider">Iterations</div>
                  <div className="text-xl font-display font-bold text-accent-text mt-1">10 Passes</div>
                  <div className="text-xs text-ink-muted mt-1">Loops 10 times on the clicked block position</div>
                </div>
                <div className="p-4 bg-surface-alt border border-line rounded-lg">
                  <div className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider">Growth API</div>
                  <div className="text-sm font-mono font-bold text-ink mt-1">growCrop / growWaterPlant</div>
                  <div className="text-xs text-ink-muted mt-1">Triggers levelEvent 2005 on each server-side success</div>
                </div>
                <div className="p-4 bg-surface-alt border border-line rounded-lg">
                  <div className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider">Surrounding Blocks</div>
                  <div className="text-xl font-display font-bold text-good-text mt-1">Untouched</div>
                  <div className="text-xs text-ink-muted mt-1">Does not trigger the 50×50 terrain sweep</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-ink-subtle font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-text" />
                  <span>Matching Block &amp; Tag Conditions</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {targetedTriggers.map((item) => (
                    <div key={item.id} className="p-3.5 bg-surface-alt border border-line rounded-lg space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono font-semibold text-accent-text">{item.id}</code>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-line text-ink-subtle">
                          {item.kind}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-surface-alt border border-line rounded-lg">
                  <div className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider">Scan Volume</div>
                  <div className="text-xl font-display font-bold text-accent-text mt-1">50 × 2 × 50</div>
                  <div className="text-xs text-ink-muted mt-1">5,000 total block coordinates checked</div>
                </div>
                <div className="p-4 bg-surface-alt border border-line rounded-lg">
                  <div className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider">Origin Offset</div>
                  <div className="text-sm font-mono font-bold text-ink mt-1">(x-25, y-1, z-25)</div>
                  <div className="text-xs text-ink-muted mt-1">Spans x-25..x+24, y-1..y, z-25..z+24</div>
                </div>
                <div className="p-4 bg-surface-alt border border-line rounded-lg">
                  <div className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider">Trigger Chance</div>
                  <div className="text-xl font-display font-bold text-good-text mt-1">10% / Block</div>
                  <div className="text-xs text-ink-muted mt-1">Evaluates Math.random() &lt; 0.1 per position</div>
                </div>
                <div className="p-4 bg-surface-alt border border-line rounded-lg">
                  <div className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider">Block Exclusion</div>
                  <div className="text-sm font-mono font-bold text-warn-text mt-1">SHORT_GRASS</div>
                  <div className="text-xs text-ink-muted mt-1">Skips existing short grass blocks</div>
                </div>
              </div>

              <div className="p-4 bg-surface-alt border border-line rounded-lg space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-ink">
                  <Filter className="w-3.5 h-3.5 text-accent-text" />
                  <span>Why Short Grass Is Excluded</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Before rolling the 10% bonemeal chance at each coordinate in the 50×2×50 volume, the procedure explicitly checks{' '}
                  <code className="text-ink font-mono">!(world.getBlockState(pos).getBlock() == Blocks.SHORT_GRASS)</code>.
                  This prevents existing short grass tufts from converting into 2-block-tall grass everywhere, keeping newly bonemealed meadows natural and walkable while still growing grass, flowers, kelp, and seagrass on dirt, grass blocks, and underwater floors.
                </p>
              </div>
            </div>
          )}
        </div>
      </UpdatedFrame>

      {/* Shared Side Effects: Particles & Consumption */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-surface border border-line rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-ink font-display font-semibold text-base">
            <Sparkles className="w-4 h-4 text-accent-text" />
            <span>Particle Burst Telemetry</span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Every activation on a server world (<code className="font-mono text-ink">ServerLevel</code>) broadcasts a wide green sparkle cloud using <code className="font-mono text-accent-text">ParticleTypes.HAPPY_VILLAGER</code>:
          </p>
          <ul className="text-xs font-mono space-y-1.5 text-ink-muted bg-surface-alt p-3.5 rounded-lg border border-line">
            <li>• Count: <span className="text-ink">200 particles</span></li>
            <li>• Spread (dX, dY, dZ): <span className="text-ink">6.0 × 1.6 × 6.0</span></li>
            <li>• Speed: <span className="text-ink">1.0</span></li>
            <li>• Growth Feedback: <span className="text-ink">LevelEvent 2005 (Bonemeal)</span></li>
          </ul>
        </div>

        <div className="p-5 bg-surface border border-line rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-ink font-display font-semibold text-base">
            <Layers className="w-4 h-4 text-accent-text" />
            <span>Stack Consumption &amp; Return Value</span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Item consumption is evaluated at the end of <code className="font-mono text-ink">SuperBonemealRightclickedOnBlockProcedure.execute(...)</code> after growth passes complete:
          </p>
          <ul className="text-xs font-mono space-y-1.5 text-ink-muted bg-surface-alt p-3.5 rounded-lg border border-line">
            <li>• Survival / Adventure: <span className="text-ink">itemstack.shrink(1)</span></li>
            <li>• Creative Mode (<span className="text-ink">instabuild</span>): <span className="text-good-text">Not consumed</span></li>
            <li>• Null entity guard: <span className="text-ink">Early return if entity == null</span></li>
            <li>• Item useOn result: <span className="text-ink">InteractionResult.SUCCESS</span></li>
          </ul>
        </div>
      </div>

      {/* Procedure Summary */}
      <div className="p-5 bg-surface border border-line rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ink-subtle font-semibold">
          <Code2 className="w-4 h-4 text-accent-text" />
          <span>Execution Order Reference</span>
        </div>
        <ol className="list-decimal list-inside text-xs text-ink-muted space-y-1.5 font-mono">
          <li>Verify <code className="text-ink">entity != null</code>.</li>
          <li>Spawn 200 <code className="text-ink">HAPPY_VILLAGER</code> particles at <code className="text-ink">(x, y, z)</code>.</li>
          <li>Check if clicked block is <code className="text-ink">MOSS_BLOCK</code> or matches <code className="text-ink">minecraft:saplings</code>, <code className="text-ink">minecraft:crops</code>, <code className="text-ink">c:saplings</code>, or <code className="text-ink">snowrealmagic:plants</code>.</li>
          <li>If matched: run 10 bonemeal ticks on <code className="text-ink">(x, y, z)</code>. Otherwise: sweep 50×2×50 from <code className="text-ink">(x-25, y-1, z-25)</code> with 10% chance per non-<code className="text-ink">SHORT_GRASS</code> block.</li>
          <li>Shrink item stack by 1 unless player has <code className="text-ink">instabuild</code>.</li>
        </ol>
      </div>

    </div>
  );
}
