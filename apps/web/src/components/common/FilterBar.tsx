import { useRef, useEffect, useState, useCallback, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface FilterItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: ReactNode;
  badge?: string;
  description?: string;
}

export interface FilterBarProps<T extends string = string> {
  /** List of filter items */
  items: FilterItem<T>[];
  /** Currently selected filter item ID */
  selectedId: T | null | undefined;
  /** Selection callback */
  onSelect: (id: T) => void;
  /** Optional "All" button definition */
  allOption?: {
    id: T;
    label: string;
    count?: number;
    icon?: ReactNode;
  };
  /** Optional leading label or icon */
  label?: ReactNode;
  /** Visual presentation mode */
  variant?: 'pills' | 'tabs';
  /** Pill button sizing */
  size?: 'sm' | 'md';
  /** Outer container CSS classes */
  className?: string;
  /** Scroll track CSS classes */
  trackClassName?: string;
  /** Whether to show navigation chevrons when content overflows (defaults to true) */
  showArrows?: boolean;
}

/**
 * Hook to manage horizontal scroll state, overflow detection, and smooth navigation.
 */
export function useHorizontalScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Allow small epsilon for subpixel rendering
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(el);
      Array.from(el.children).forEach(child => resizeObserver?.observe(child));
    }

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      resizeObserver?.disconnect();
    };
  }, [checkScroll]);

  const scrollBy = useCallback((delta: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  }, []);

  return { scrollRef, canScrollLeft, canScrollRight, scrollBy, checkScroll };
}

/**
 * Reusable botanical FilterBar component supporting tabs and pill filters with
 * overflow indicators, soft edge fading, auto-centering active items, and smooth scroll buttons.
 */
export function FilterBar<T extends string = string>({
  items,
  selectedId,
  onSelect,
  allOption,
  label,
  variant = 'pills',
  size = 'md',
  className = '',
  trackClassName = '',
  showArrows = true,
}: FilterBarProps<T>) {
  const { scrollRef, canScrollLeft, canScrollRight, scrollBy, checkScroll } = useHorizontalScroll();
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  // Auto-scroll the active button into view horizontally inside the track only (never scrolls the window)
  useEffect(() => {
    if (activeItemRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const button = activeItemRef.current;

      const buttonLeft = button.offsetLeft;
      const buttonRight = buttonLeft + button.offsetWidth;
      const containerScroll = container.scrollLeft;
      const containerWidth = container.clientWidth;

      if (buttonLeft < containerScroll) {
        container.scrollTo({ left: Math.max(0, buttonLeft - 16), behavior: 'smooth' });
      } else if (buttonRight > containerScroll + containerWidth) {
        container.scrollTo({ left: buttonRight - containerWidth + 16, behavior: 'smooth' });
      }
    }
    setTimeout(checkScroll, 100);
  }, [selectedId, checkScroll]);

  const allItems: FilterItem<T>[] = allOption
    ? [
        {
          id: allOption.id,
          label: allOption.label,
          count: allOption.count,
          icon: allOption.icon,
        },
        ...items,
      ]
    : items;

  if (variant === 'tabs') {
    return (
      <div className={`relative w-full border-b border-border-subtle ${className}`}>
        {/* Left Arrow & Fade */}
        {showArrows && canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pr-2 pointer-events-none">
            <div className="w-10 h-full bg-gradient-to-r from-parchment-warm via-parchment-warm/90 to-transparent" />
            <button
              type="button"
              onClick={() => scrollBy(-180)}
              className="absolute left-1 p-1 rounded-full bg-paper-white/95 border border-border-subtle shadow-xs text-forest-deep hover:bg-parchment-warm transition-all cursor-pointer pointer-events-auto"
              aria-label="Scroll tabs left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Tabs */}
        <div
          ref={scrollRef}
          role="tablist"
          className={`flex items-center overflow-x-auto scrollbar-none gap-1 sm:gap-2 whitespace-nowrap scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 ${trackClassName}`}
        >
          {label && <div className="shrink-0 mr-2">{label}</div>}

          {allItems.map(item => {
            const isSelected = selectedId === item.id;
            return (
              <button
                key={item.id}
                ref={isSelected ? activeItemRef : undefined}
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelect(item.id)}
                className={`py-2.5 sm:py-3 px-3 sm:px-4 font-editorial text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'border-forest-deep text-forest-deep'
                    : 'border-transparent text-text-muted hover:text-forest-deep hover:border-border-subtle'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span
                    className={`text-[11px] font-sans px-1.5 py-0.5 rounded-full transition-colors ${
                      isSelected
                        ? 'bg-forest-deep/15 text-forest-deep font-bold'
                        : 'bg-forest-deep/5 text-text-muted'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Arrow & Fade */}
        {showArrows && canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-end pl-2 pointer-events-none">
            <div className="w-10 h-full bg-gradient-to-l from-parchment-warm via-parchment-warm/90 to-transparent" />
            <button
              type="button"
              onClick={() => scrollBy(180)}
              className="absolute right-1 p-1 rounded-full bg-paper-white/95 border border-border-subtle shadow-xs text-forest-deep hover:bg-parchment-warm transition-all cursor-pointer pointer-events-auto"
              aria-label="Scroll tabs right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Pills variant
  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1 text-[11px] rounded-lg'
      : 'px-3 sm:px-3.5 py-1.5 text-xs rounded-xl';

  return (
    <div className={`relative flex items-center w-full group/filter ${className}`}>
      {/* Optional Leading Label */}
      {label && <div className="shrink-0 mr-2.5 flex items-center">{label}</div>}

      {/* Left Scroll Button (Flex sibling so it never obscures the first pill) */}
      {showArrows && canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-180)}
          className="shrink-0 mr-1 p-1 rounded-full bg-paper-white border border-border-subtle shadow-xs text-forest-deep hover:bg-parchment-warm transition-all cursor-pointer hover:scale-105 active:scale-95"
          aria-label="Scroll filter left"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Relative Track Wrapper */}
      <div className="relative flex-1 min-w-0 flex items-center overflow-hidden">
        {/* Horizontal Scroll Track */}
        <div
          ref={scrollRef}
          role="group"
          aria-label="Filter options"
          className={`flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1 scroll-smooth w-full ${trackClassName}`}
        >
          {allItems.map(item => {
            const isSelected = selectedId === item.id;
            return (
              <button
                key={item.id}
                ref={isSelected ? activeItemRef : undefined}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`${sizeClasses} font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                  isSelected
                    ? 'bg-forest-deep text-paper-white shadow-xs border border-forest-deep scale-[1.02]'
                    : 'bg-paper-white text-forest-deep border border-border-subtle hover:bg-parchment-warm hover:border-moss-green/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] font-sans px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                      isSelected
                        ? 'bg-paper-white/20 text-paper-white'
                        : 'bg-forest-deep/10 text-forest-deep'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Scroll Button */}
      {showArrows && canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(180)}
          className="shrink-0 ml-1 p-1 rounded-full bg-paper-white border border-border-subtle shadow-xs text-forest-deep hover:bg-parchment-warm transition-all cursor-pointer hover:scale-105 active:scale-95"
          aria-label="Scroll filter right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
