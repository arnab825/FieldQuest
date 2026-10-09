import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Feather } from 'lucide-react';

interface NaturalistNoteViewProps {
  content: string;
  variant?: 'card' | 'inline' | 'preview';
  maxInitialLength?: number;
  className?: string;
}

/**
 * Parses raw text, markdown-like bolding, and structured botanical observation keys
 * into clean, readable, structured field notes.
 */
function formatNaturalistText(text: string): React.ReactNode[] {
  if (!text) return [];

  // Normalize newlines
  const rawClean = text.replace(/\r\n/g, '\n');

  // If text already has explicit newlines
  const paragraphs = rawClean.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  // If text is a single giant run-on paragraph but contains structured keys like "Key: Value",
  // let's intelligently split by known botanical/naturalist key phrases or "Pattern: ", "Property: "
  const processedParagraphs: string[] = [];

  for (const p of paragraphs) {
    // Check if paragraph has multiple colon-separated structured sections
    // e.g. "Intro text... Key Feature: Details. Another Feature: More details."
    const structuredPattern = /([A-Z][A-Za-z0-9\s()/-]{2,30}:)/g;
    const matches = Array.from(p.matchAll(structuredPattern));

    if (matches.length > 1) {
      // Split into logical subsections
      let lastIndex = 0;
      const chunks: string[] = [];

      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const matchIndex = match.index ?? 0;

        if (matchIndex > lastIndex) {
          const prefix = p.substring(lastIndex, matchIndex).trim();
          if (prefix) chunks.push(prefix);
        }

        const nextIndex = i + 1 < matches.length ? (matches[i + 1].index ?? p.length) : p.length;
        const segment = p.substring(matchIndex, nextIndex).trim();
        if (segment) chunks.push(segment);

        lastIndex = nextIndex;
      }

      processedParagraphs.push(...chunks);
    } else {
      processedParagraphs.push(p);
    }
  }

  // Render processed chunks
  return processedParagraphs.map((chunk, idx) => {
    // Check if chunk is a bullet point
    const isBullet = chunk.startsWith('•') || chunk.startsWith('-') || chunk.startsWith('*');
    const cleanChunk = isBullet ? chunk.replace(/^[\s•\-*]+/, '').trim() : chunk;

    // Check if chunk starts with a key/label (e.g., "Central Midrib: Note the main...")
    const colonMatch = cleanChunk.match(/^([A-Z][A-Za-z0-9\s()/-]{2,35}:)\s*(.*)$/);

    if (colonMatch) {
      const label = colonMatch[1];
      const rest = colonMatch[2];

      return (
        <div
          key={idx}
          className="my-1.5 p-2 sm:p-2.5 rounded-lg bg-parchment-warm/50 border border-border-subtle/70 text-xs sm:text-sm text-forest-deep flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2"
        >
          <span className="font-semibold text-moss-green font-editorial tracking-tight shrink-0 bg-forest-deep/5 px-2 py-0.5 rounded-md inline-block w-fit">
            {label}
          </span>
          <span className="text-forest-deep/90 leading-relaxed font-sans">
            {renderInlineMarkdown(rest)}
          </span>
        </div>
      );
    }

    if (isBullet) {
      return (
        <div key={idx} className="flex items-start gap-2 my-1 pl-1 text-xs sm:text-sm text-forest-deep/90 leading-relaxed font-sans">
          <span className="w-1.5 h-1.5 rounded-full bg-moss-green mt-1.5 shrink-0" />
          <div>{renderInlineMarkdown(cleanChunk)}</div>
        </div>
      );
    }

    return (
      <p key={idx} className="my-1.5 text-xs sm:text-sm text-forest-deep/90 leading-relaxed font-sans">
        {renderInlineMarkdown(chunk)}
      </p>
    );
  });
}

/**
 * Handles basic inline formatting like **bold** and *italic*
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Split by bold (**text**)
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-forest-deep">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export const NaturalistNoteView: React.FC<NaturalistNoteViewProps> = ({
  content,
  variant = 'card',
  maxInitialLength = 260,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  const isLong = content.length > maxInitialLength;
  const displayContent = isLong && !isExpanded
    ? content.slice(0, maxInitialLength).trim() + '...'
    : content;

  // Inline variant (used inside mission lists)
  if (variant === 'inline') {
    return (
      <div className={`mt-2 p-3 rounded-xl bg-parchment-warm/70 border border-moss-green/30 ${className}`}>
        <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-border-subtle/50">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-moss-green tracking-wide uppercase">
            <Feather className="w-3.5 h-3.5 text-forest-deep" />
            <span>Field Observation Log</span>
          </div>

          {isLong && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] text-forest-deep font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>{isExpanded ? 'Show Less' : 'Expand Full'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        <div className="space-y-1">
          {formatNaturalistText(displayContent)}
        </div>
      </div>
    );
  }

  // Card variant (used inside Field Notes tab)
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="space-y-1.5">
        {formatNaturalistText(displayContent)}
      </div>

      {isLong && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-forest-deep bg-parchment-warm hover:bg-forest-deep/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Collapse note' : 'Read full observation note'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-moss-green" /> : <ChevronDown className="w-3.5 h-3.5 text-moss-green" />}
          </button>
        </div>
      )}
    </div>
  );
};
