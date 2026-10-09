import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface NaturalistNoteViewProps {
  content: string;
  variant?: 'card' | 'inline' | 'preview';
  maxInitialLength?: number;
  className?: string;
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

/**
 * Parses raw observation text, AI naturalist guidelines, and structured field notes
 * into an authentic, highly readable, botanical field journal layout.
 */
function formatNaturalistText(text: string): React.ReactNode {
  if (!text) return null;

  const rawClean = text.replace(/\r\n/g, '\n').trim();
  const rawLines = rawClean.split('\n');

  // Group into logical blocks (headers, subheadings, bullet items, key-values, paragraphs)
  const blocks: Array<{
    type: 'header' | 'subheading' | 'bullet' | 'key-value' | 'paragraph';
    title?: string;
    content: string;
  }> = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    // 1. Bracketed section headers e.g. [Soundscape Stratification]
    const bracketMatch = line.match(/^\[(.*?)\]\s*(.*)$/);
    if (bracketMatch) {
      blocks.push({
        type: 'header',
        title: bracketMatch[1],
        content: bracketMatch[2].replace(/^[\s•\-*]+/, '').trim(),
      });
      continue;
    }

    // 2. Markdown headers #, ##, ###
    const mdHeaderMatch = line.match(/^#{1,4}\s+(.*)$/);
    if (mdHeaderMatch) {
      blocks.push({
        type: 'subheading',
        content: mdHeaderMatch[1].trim(),
      });
      continue;
    }

    // 3. Bullet points e.g. • Reticulate (Netted): Secondary veins...
    const bulletMatch = line.match(/^[\s•\-*]+\s*(.*)$/);
    if (bulletMatch) {
      const bulletBody = bulletMatch[1].trim();
      blocks.push({
        type: 'bullet',
        content: bulletBody,
      });
      continue;
    }

    // 4. Category headings ending in a colon e.g. "Branching Pattern:" or "Leaf Margins (Edges):"
    const isHeadingColon = line.endsWith(':') && line.length < 80;
    if (isHeadingColon) {
      blocks.push({
        type: 'subheading',
        content: line.replace(/:$/, ''),
      });
      continue;
    }

    // 5. Standalone Key: Value observation line e.g. "Central Midrib: Note the main..."
    const colonMatch = line.match(/^([A-Z][A-Za-z0-9\s()/-]{2,35}):\s*(.*)$/);
    if (colonMatch && colonMatch[2].trim()) {
      blocks.push({
        type: 'key-value',
        title: colonMatch[1],
        content: colonMatch[2].trim(),
      });
      continue;
    }

    // 6. Regular narrative paragraph
    blocks.push({
      type: 'paragraph',
      content: line,
    });
  }

  return (
    <div className="space-y-2 text-xs sm:text-sm text-forest-deep/90 leading-relaxed font-sans">
      {blocks.map((block, idx) => {
        if (block.type === 'header') {
          return (
            <div key={idx} className="pt-2 pb-1 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-moss-green bg-moss-green/10 border border-moss-green/25 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                <span>🌿</span>
                <span>{block.title}</span>
              </span>
              {block.content && (
                <span className="text-xs text-text-muted">
                  {renderInlineMarkdown(block.content)}
                </span>
              )}
            </div>
          );
        }

        if (block.type === 'subheading') {
          return (
            <div key={idx} className="pt-2 pb-0.5 flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full bg-moss-green shrink-0" />
              <h5 className="font-editorial font-bold text-xs sm:text-sm text-forest-deep">
                {block.content}
              </h5>
            </div>
          );
        }

        if (block.type === 'bullet') {
          // Check if bullet item has "Key: Value" or "**Key:** Value"
          const bulletColonMatch = block.content.match(/^([A-Z][A-Za-z0-9\s()/-]{2,35}):\s*(.*)$/);
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-2 my-1">
              <span className="w-1.5 h-1.5 rounded-full bg-moss-green mt-1.5 shrink-0" />
              <div className="leading-relaxed">
                {bulletColonMatch ? (
                  <>
                    <strong className="font-semibold text-forest-deep">
                      {bulletColonMatch[1]}:{' '}
                    </strong>
                    <span>{renderInlineMarkdown(bulletColonMatch[2])}</span>
                  </>
                ) : (
                  renderInlineMarkdown(block.content)
                )}
              </div>
            </div>
          );
        }

        if (block.type === 'key-value') {
          return (
            <div
              key={idx}
              className="my-1.5 p-2 sm:p-2.5 rounded-xl bg-parchment-warm/40 border border-border-subtle/70 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 shadow-2xs"
            >
              <span className="font-semibold text-forest-deep font-editorial tracking-tight shrink-0 bg-forest-deep/5 px-2 py-0.5 rounded-md inline-block w-fit text-xs">
                {block.title}:
              </span>
              <span className="leading-relaxed font-sans text-forest-deep/90">
                {renderInlineMarkdown(block.content)}
              </span>
            </div>
          );
        }

        return (
          <p key={idx} className="my-1.5 leading-relaxed font-sans">
            {renderInlineMarkdown(block.content)}
          </p>
        );
      })}
    </div>
  );
}

export const NaturalistNoteView: React.FC<NaturalistNoteViewProps> = ({
  content,
  variant: _variant = 'card',
  maxInitialLength = 360,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  const isLong = content.length > maxInitialLength;
  const displayContent = isLong && !isExpanded
    ? content.slice(0, maxInitialLength).trim() + '...'
    : content;

  return (
    <div className={`relative ${className}`}>
      {formatNaturalistText(displayContent)}

      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2.5 text-xs font-semibold text-forest-deep hover:text-forest-dark flex items-center gap-1 cursor-pointer transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-moss-green" />
              <span>Show Less</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-moss-green" />
              <span>Read Full Botanical Field Note</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
