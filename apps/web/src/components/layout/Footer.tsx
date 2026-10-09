import React from 'react';
import { Leaf, ShieldCheck, Database, Heart } from 'lucide-react';

interface FooterProps {
  onOpenObjectiveBasis?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenObjectiveBasis }) => {
  return (
    <footer className="mt-auto border-t border-border-subtle bg-paper-white/70 pt-8 pb-24 md:py-10 text-xs text-text-muted">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-forest-deep text-leaf-accent flex items-center justify-center">
                <Leaf className="w-3.5 h-3.5" />
              </div>
              <span className="font-editorial text-base font-bold text-forest-deep">FieldQuest</span>
            </div>
            <p className="text-forest-deep/80 max-w-sm leading-relaxed">
              An open-source, offline-first nature exploration Progressive Web App. Spend less time on your feeds and more time discovering living ecosystems in your neighbourhood.
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-forest-deep/70">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-moss-green" /> 100% Private (No Trackers)
              </span>
              <span className="inline-flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-moss-green" /> Local IndexedDB Storage
              </span>
            </div>
          </div>

          {/* Naturalist Ethics */}
          <div className="space-y-2">
            <h4 className="font-semibold text-forest-deep uppercase tracking-wider text-[11px]">
              Naturalist Ethics
            </h4>
            <ul className="space-y-1.5 text-[11px] leading-relaxed">
              <li>• Leave No Trace: Observe without disturbing</li>
              <li>• Never pluck wild flowers or peel tree bark</li>
              <li>• Respect nesting birds and animal shelters</li>
              <li>• Never taste or ingest unknown wild plants or fungi</li>
            </ul>
          </div>

          {/* Open Source */}
          <div className="space-y-2">
            <h4 className="font-semibold text-forest-deep uppercase tracking-wider text-[11px]">
              Open-Weight AI
            </h4>
            <p className="text-[11px] leading-relaxed">
              Designed for local Ollama inference (<code className="bg-parchment-warm px-1 py-0.5 rounded text-forest-deep">qwen2.5:3b</code>) with deterministic curated fallback.
            </p>
            <p className="text-[11px] text-forest-deep/80">
              Licensed under MIT License.
            </p>
          </div>
        </div>

        <div className="border-t border-border-subtle pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex flex-wrap items-center gap-3">
            <p>© 2026 FieldQuest Contributors. Built for real-world exploration.</p>
            {onOpenObjectiveBasis && (
              <>
                <span className="text-border-subtle">•</span>
                <button
                  type="button"
                  onClick={onOpenObjectiveBasis}
                  className="text-forest-deep hover:underline font-semibold cursor-pointer"
                >
                  Our Philosophy & Science
                </button>
              </>
            )}
          </div>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-emerald-700 fill-emerald-700" /> for the outdoors.
          </p>
        </div>
      </div>
    </footer>
  );
};
