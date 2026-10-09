import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, BookOpen, Settings, Leaf, Sparkles, Palette } from 'lucide-react';
import { AIProviderStatus } from '../../types/index.js';
import { useAdventureSessionStore } from '../../store/adventure-session.store.js';

interface NavbarProps {
  aiStatus?: AIProviderStatus;
  onOpenSettings: () => void;
  onOpenObjectiveBasis?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  aiStatus,
  onOpenSettings,
}) => {
  const location = useLocation();
  const session = useAdventureSessionStore((s) => s.session);
  const isAdventureActive = session?.status === 'in_progress';
  const isStudioTab = location.pathname === '/studio' || location.pathname === '/plates';
  const isJournalNotesTab = location.pathname === '/journal';

  return (
    <header className="sticky top-0 z-40 bg-paper-white/95 backdrop-blur-md border-b border-border-subtle shadow-xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-forest-deep text-leaf-accent flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 shrink-0">
            <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <span className="font-editorial text-lg sm:text-xl font-bold tracking-tight text-forest-deep flex items-center gap-1.5">
              FieldQuest
              <span className="text-[9px] sm:text-[10px] font-sans font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-forest-deep/10 text-forest-deep">
                PWA
              </span>
            </span>
            <p className="text-[11px] text-text-muted hidden md:block -mt-0.5">
              Your neighbourhood is more interesting than your feed
            </p>
          </div>
        </Link>

        {/* Center Navigation Links (Desktop/Tablet >= md) */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            to="/setup"
            className={`px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors ${
              location.pathname === '/setup'
                ? 'bg-forest-deep text-paper-white shadow-xs'
                : 'text-forest-deep hover:bg-parchment-warm'
            }`}
          >
            <Compass className="w-4 h-4 text-leaf-accent" />
            <span>Explore</span>
          </Link>

          {isAdventureActive && (
            <Link
              to="/adventure"
              className={`px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors ${
                location.pathname === '/adventure'
                  ? 'bg-forest-deep text-paper-white shadow-xs'
                  : 'text-forest-deep hover:bg-parchment-warm'
              }`}
            >
              <div className="relative">
                <Sparkles className="w-4 h-4 text-leaf-accent" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span>Active Quest</span>
            </Link>
          )}

          <Link
            to="/journal"
            className={`px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors ${
              isJournalNotesTab
                ? 'bg-forest-deep text-paper-white shadow-xs'
                : 'text-forest-deep hover:bg-parchment-warm'
            }`}
          >
            <BookOpen className="w-4 h-4 text-moss-green" />
            <span>Field Journal</span>
          </Link>

          <Link
            to="/studio"
            className={`px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors ${
              isStudioTab
                ? 'bg-forest-deep text-paper-white shadow-xs'
                : 'text-forest-deep hover:bg-parchment-warm'
            }`}
            title="Field Studio: Illustrate, style, and archive botanical specimens"
          >
            <Palette className="w-4 h-4 text-leaf-accent" />
            <span>Field Studio</span>
          </Link>
        </nav>

        {/* Right Controls: AI Badge & Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* AI Status Badge */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border border-border-subtle bg-parchment-warm/60 hover:bg-parchment-warm transition-colors cursor-pointer"
            title="Click to view AI & Storage Settings"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                aiStatus?.status === 'available'
                  ? 'bg-emerald-500'
                  : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span className="text-forest-deep font-semibold hidden xs:inline text-[11px] sm:text-xs">
              {aiStatus?.provider === 'ollama' && aiStatus.available
                ? 'Local AI (Qwen)'
                : 'Demo Mode'}
            </span>
            <span className="text-forest-deep font-semibold xs:hidden text-[11px]">
              {aiStatus?.provider === 'ollama' && aiStatus.available ? 'Local AI' : 'Demo'}
            </span>
          </button>

          {/* Desktop Settings Trigger (hidden on mobile, accessible via mobile bottom nav) */}
          <button
            onClick={onOpenSettings}
            className="hidden md:flex p-2 rounded-xl text-forest-deep hover:bg-parchment-warm transition-colors border border-border-subtle cursor-pointer items-center justify-center"
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
