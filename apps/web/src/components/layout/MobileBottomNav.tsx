import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, BookOpen, Settings, Sparkles, Palette } from 'lucide-react';
import { useAdventureSessionStore } from '../../store/adventure-session.store.js';
import { AIProviderStatus } from '../../types/index.js';

interface MobileBottomNavProps {
  aiStatus?: AIProviderStatus;
  onOpenSettings: () => void;
  onOpenObjectiveBasis?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  aiStatus,
  onOpenSettings,
}) => {
  const location = useLocation();
  const session = useAdventureSessionStore((s) => s.session);
  const isAdventureActive = session?.status === 'in_progress';
  const isStudioTab = location.pathname === '/studio' || location.pathname === '/plates';
  const isJournalNotesTab = location.pathname === '/journal';

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-paper-white/95 backdrop-blur-md border-t border-border-subtle shadow-lg md:hidden pb-safe transition-transform"
    >
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {/* Explore / Setup */}
        <Link
          to="/setup"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            location.pathname === '/setup'
              ? 'text-forest-deep font-bold bg-forest-deep/10'
              : 'text-text-muted hover:text-forest-deep'
          }`}
        >
          <Compass className={`w-5 h-5 ${location.pathname === '/setup' ? 'text-forest-deep stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Explore</span>
        </Link>

        {/* Quest / Active Adventure */}
        <Link
          to={isAdventureActive ? '/adventure' : '/setup'}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] relative ${
            location.pathname === '/adventure'
              ? 'text-forest-deep font-bold bg-forest-deep/10'
              : 'text-text-muted hover:text-forest-deep'
          }`}
        >
          <div className="relative">
            <Sparkles className={`w-5 h-5 ${location.pathname === '/adventure' ? 'text-forest-deep stroke-[2.5]' : ''}`} />
            {isAdventureActive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-paper-white animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            {isAdventureActive ? 'Quest' : 'Adventure'}
          </span>
        </Link>

        {/* Field Journal */}
        <Link
          to="/journal"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            isJournalNotesTab
              ? 'text-forest-deep font-bold bg-forest-deep/10'
              : 'text-text-muted hover:text-forest-deep'
          }`}
        >
          <BookOpen className={`w-5 h-5 ${isJournalNotesTab ? 'text-forest-deep stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Journal</span>
        </Link>

        {/* Field Studio */}
        <Link
          to="/studio"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            isStudioTab
              ? 'text-forest-deep font-bold bg-forest-deep/10'
              : 'text-text-muted hover:text-forest-deep'
          }`}
          title="Field Studio: Botanical Specimen Art & Folios"
        >
          <Palette className={`w-5 h-5 ${isStudioTab ? 'text-forest-deep stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Studio</span>
        </Link>

        {/* AI & Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] text-text-muted hover:text-forest-deep relative"
          title="AI Diagnostics & Settings"
        >
          <div className="relative">
            <Settings className="w-5 h-5" />
            <span
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                aiStatus?.status === 'available' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Settings</span>
        </button>
      </div>
    </nav>
  );
};
