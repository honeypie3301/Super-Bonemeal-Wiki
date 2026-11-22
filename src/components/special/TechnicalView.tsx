import React from 'react';
import {
  ShieldCheck,
  Tag,
  Server
} from 'lucide-react';

export default function TechnicalView() {
  const compatibilityTags = [
    {
      tag: 'minecraft:moss_block',
      scope: 'Vanilla Block',
      effect: 'Triggers 10× targeted bonemeal passes instead of 50×2×50 area sweep.'
    },
    {
      tag: 'minecraft:saplings',
      scope: 'Vanilla Tag',
      effect: 'Rapidly grows vanilla saplings to full tree stage on single right-click.'
    },
    {
      tag: 'minecraft:crops',
      scope: 'Vanilla Tag',
      effect: 'Forces 10 consecutive crop growth rolls on farmland crops.'
    },
    {
      tag: 'c:saplings',
      scope: 'NeoForge Common Tag',
      effect: 'Ensures modded saplings using NeoForge common tags receive instant targeted growth.'
    },
    {
      tag: 'snowrealmagic:plants',
      scope: 'Snow! Real Magic! Tag',
      effect: 'Detects snowlogged plants from Snow! Real Magic! for 10× targeted growth.'
    }
  ];

  return (
    <div className="space-y-8 max-w-[1000px] mx-auto text-ink-muted select-text">

      {/* Block Tag & Cross-Mod Compatibility */}
      <div className="p-6 bg-surface border border-line rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent-text font-semibold">
          <Tag className="w-4 h-4" />
          <span>Block &amp; Mod Compatibility Tags</span>
        </div>
        <div className="space-y-2.5">
          {compatibilityTags.map((row) => (
            <div key={row.tag} className="p-3.5 bg-surface-alt border border-line rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <code className="text-xs font-mono font-semibold text-accent-text">{row.tag}</code>
                <p className="text-xs text-ink-muted">{row.effect}</p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-surface border border-line text-ink-subtle shrink-0 self-start sm:self-center">
                {row.scope}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Runtime Side & Licensing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-surface border border-line rounded-xl space-y-2.5">
          <div className="flex items-center gap-2 text-ink font-display font-semibold text-base">
            <Server className="w-4 h-4 text-accent-text" />
            <span>Environment &amp; Side Safety</span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Both <code className="font-mono text-ink">neoforge</code> and <code className="font-mono text-ink">minecraft</code> dependencies specify <code className="font-mono text-accent-text">side="BOTH"</code>. Growth checks guard server execution via <code className="font-mono text-ink">!_level.isClientSide()</code> and spawn particles through <code className="font-mono text-ink">ServerLevel</code>.
          </p>
        </div>

        <div className="p-5 bg-surface border border-line rounded-xl space-y-2.5">
          <div className="flex items-center gap-2 text-ink font-display font-semibold text-base">
            <ShieldCheck className="w-4 h-4 text-accent-text" />
            <span>License &amp; Distribution</span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Licensed under <strong className="text-ink">GNU General Public License version 3 (GPLv3)</strong>. Assets include <code className="font-mono text-ink">logo.png</code>, <code className="font-mono text-ink">icon.png</code>, and <code className="font-mono text-ink">item/super_bone_meal.png</code>.
          </p>
        </div>
      </div>

    </div>
  );
}
