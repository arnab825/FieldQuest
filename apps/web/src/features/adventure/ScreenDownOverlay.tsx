import React from 'react';
import { Moon, Eye, Volume2, Wind } from 'lucide-react';

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

  return (
    <div
      onClick={onWake}
      className="fixed inset-0 z-50 bg-forest-dark text-paper-white flex flex-col items-center justify-between p-8 select-none cursor-pointer transition-opacity duration-300"
      title="Tap anywhere to wake screen"
    >
      {/* Top Header */}
      <div className="w-full flex items-center justify-between text-xs text-moss-green/80">
        <div className="flex items-center gap-1.5">
          <Moon className="w-4 h-4 text-leaf-accent" />
          <span>Screen-Down Mode Active</span>
        </div>
        <div className="font-mono text-sm tracking-wider text-paper-white/70">
          {timeFormatted}
        </div>
      </div>

      {/* Center Sensory Focus Prompt */}
      <div className="text-center max-w-sm space-y-6">
        <div className="w-16 h-16 rounded-full bg-forest-deep border border-moss-green/40 mx-auto flex items-center justify-center animate-pulse">
          <Wind className="w-8 h-8 text-leaf-accent" />
        </div>

        <div className="space-y-2">
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-paper-white">
            Slip your phone away.
          </h2>
          <p className="text-xs sm:text-sm text-paper-white/70 leading-relaxed">
            Look up from the glass. Feel the temperature of the air on your skin. Listen for three distinct layers of living sound in your immediate surroundings.
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 pt-4 text-xs text-moss-green">
          <span className="flex items-center gap-1.5">
            <Volume2 className="w-4 h-4" /> Listen
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" /> Observe
          </span>
        </div>
      </div>

      {/* Bottom Wake Prompt */}
      <div className="text-center">
        <p className="text-xs text-leaf-accent/90 font-medium px-4 py-2 rounded-full border border-leaf-accent/30 bg-forest-deep/60">
          Tap anywhere to wake the screen
        </p>
      </div>
    </div>
  );
};
