import React, { useEffect } from 'react';
import { Moon, Eye, Volume2, Wind, Sparkles, SunMedium } from 'lucide-react';
import { playSensoryChime } from '../../lib/audio.js';

interface ScreenDownOverlayProps {
  elapsedSeconds: number;
  onWake: () => void;
}

export const ScreenDownOverlay: React.FC<ScreenDownOverlayProps> = ({
  elapsedSeconds,
  onWake,
}) => {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleWake = () => {
    playSensoryChime();
    onWake();
  };

  // Keyboard shortcut to wake (Escape, Space, or Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleWake();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0d1612] text-paper-white flex flex-col items-center justify-between p-6 sm:p-10 select-none animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label="Screen-down sensory immersion mode"
    >
      {/* Top Header */}
      <div className="w-full max-w-lg flex items-center justify-between text-xs text-moss-green/90 border-b border-forest-deep/60 pb-4">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-leaf-accent animate-pulse" />
          <span className="font-semibold tracking-wide uppercase text-[11px]">
            Screen-Down Sensory Mode
          </span>
        </div>
        <div className="font-mono text-sm tracking-wider text-paper-white/90 bg-forest-deep/50 px-3 py-1 rounded-full border border-forest-deep">
          ⏱️ {timeFormatted}
        </div>
      </div>

      {/* Center Sensory Focus & Calming Animation */}
      <div className="text-center max-w-md space-y-6 my-auto py-6">
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-950/60 animate-ping opacity-40" />
          <div className="relative w-20 h-20 rounded-full bg-forest-deep border-2 border-leaf-accent/50 flex items-center justify-center shadow-lg shadow-black/40">
            <Wind className="w-9 h-9 text-leaf-accent" />
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-leaf-accent/80 block">
            Off the glass • In the living world
          </span>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-paper-white leading-tight">
            Slip your phone into your pocket.
          </h2>
          <p className="text-xs sm:text-sm text-paper-white/80 leading-relaxed max-w-sm mx-auto">
            Look up. Feel the ambient temperature and air movement on your skin. Listen for three distinct layers of living sound in your surroundings.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 text-xs text-moss-green/90 max-w-xs mx-auto">
          <div className="p-2.5 rounded-xl bg-forest-deep/40 border border-forest-deep/70 flex flex-col items-center gap-1">
            <Volume2 className="w-4 h-4 text-leaf-accent" />
            <span className="text-[11px] font-semibold">Listen</span>
          </div>
          <div className="p-2.5 rounded-xl bg-forest-deep/40 border border-forest-deep/70 flex flex-col items-center gap-1">
            <Eye className="w-4 h-4 text-leaf-accent" />
            <span className="text-[11px] font-semibold">Observe</span>
          </div>
          <div className="p-2.5 rounded-xl bg-forest-deep/40 border border-forest-deep/70 flex flex-col items-center gap-1">
            <Sparkles className="w-4 h-4 text-leaf-accent" />
            <span className="text-[11px] font-semibold">Reflect</span>
          </div>
        </div>
      </div>

      {/* Bottom Wake Button */}
      <div className="w-full max-w-sm text-center pt-4 border-t border-forest-deep/60 space-y-2">
        <button
          type="button"
          onClick={handleWake}
          className="w-full py-3.5 px-6 rounded-2xl bg-forest-deep hover:bg-forest-dark text-paper-white text-sm font-semibold border-2 border-leaf-accent/40 shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 group active:scale-95"
        >
          <SunMedium className="w-4 h-4 text-leaf-accent group-hover:rotate-45 transition-transform" />
          <span>Wake Screen & Resume Field Mission</span>
        </button>
        <p className="text-[10px] text-text-muted">
          Press Space or Esc anytime to wake
        </p>
      </div>
    </div>
  );
};
