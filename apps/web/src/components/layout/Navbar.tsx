import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, BookOpen, Settings, Leaf } from 'lucide-react';
import { AIProviderStatus } from '../../types/index.js';

interface NavbarProps {
  aiStatus?: AIProviderStatus;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  aiStatus,
  onOpenSettings,
}) => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 bg-paper-white/95 backdrop-blur-md border-b border-border-subtle shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-forest-deep text-leaf-accent flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <span className="font-editorial text-xl font-bold tracking-tight text-forest-deep flex items-center gap-1.5">
              FieldQuest
              <span className="text-[10px] font-sans font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-forest-deep/10 text-forest-deep">
                PWA
              </span>
            </span>
            <p className="text-[11px] text-text-muted hidden sm:block -mt-0.5">
              Your neighbourhood is more interesting than your feed
            </p>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/setup"
            className={`px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors ${
              location.pathname === '/setup'
                ? 'bg-forest-deep text-paper-white'
                : 'text-forest-deep hover:bg-parchment-warm'
            }`}
          >
            <Compass className="w-4 h-4 text-leaf-accent" />
            <span>Explore</span>
          </Link>

          <Link
            to="/journal"
            className={`px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors ${
              location.pathname === '/journal'
                ? 'bg-forest-deep text-paper-white'
                : 'text-forest-deep hover:bg-parchment-warm'
            }`}
          >
            <BookOpen className="w-4 h-4 text-moss-green" />
            <span>Field Journal</span>
          </Link>
        </nav>

        {/* Right Controls: AI Badge & Settings */}
        <div className="flex items-center gap-2.5">
          {/* AI Status Badge */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-border-subtle bg-parchment-warm/60 hover:bg-parchment-warm transition-colors cursor-pointer"
            title="Click to view AI & Storage Settings"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                aiStatus?.status === 'available'
                  ? 'bg-emerald-500'
                  : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span className="text-forest-deep font-semibold">
              {aiStatus?.provider === 'ollama' && aiStatus.available
                ? 'Local AI (Qwen)'
                : 'Demo Mode'}
            </span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-forest-deep hover:bg-parchment-warm transition-colors border border-border-subtle cursor-pointer"
            aria-label="Settings"
            title="Settings & Privacy"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
