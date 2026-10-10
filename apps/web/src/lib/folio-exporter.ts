/**
 * FieldQuest Naturalist Atelier — Folio Exporter
 * Pure HTML5 Canvas 2D composite generator (Zero external dependencies).
 * Renders an archival Victorian specimen study card containing:
 * - Vintage parchment texture and double ornamental border
 * - Taxonomic header and plate identification
 * - Specimen illustration
 * - Latin/botanical description
 * - 3 morphological diagnostic key cards
 * - Naturalist archival field log and verification seal
 */

export interface FolioExportOptions {
  id: string;
  plateNumber: string;
  title: string;
  subtitle?: string;
  imageSrc: string;
  description: string;
  details: Array<{ title: string; description: string }>;
  authorOrModel?: string;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lineCount++;
      if (lineCount >= maxLines) {
        ctx.fillText(line.trim() + '...', x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export async function exportCompositeSpecimenFolio(options: FolioExportOptions): Promise<void> {
  const width = 1200;
  const height = 1580;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Vintage Parchment Base
  ctx.fillStyle = '#F5F2E8';
  ctx.fillRect(0, 0, width, height);

  // Subtle paper grain noise simulation
  ctx.fillStyle = 'rgba(23, 61, 50, 0.015)';
  for (let i = 0; i < 4000; i++) {
    const px = Math.random() * width;
    const py = Math.random() * height;
    ctx.fillRect(px, py, 1.5, 1.5);
  }

  // 2. Ornate Double Victorian Border
  ctx.strokeStyle = '#173D32';
  ctx.lineWidth = 3;
  ctx.strokeRect(32, 32, width - 64, height - 64);

  ctx.strokeStyle = 'rgba(113, 134, 107, 0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Corner Accents
  ctx.fillStyle = '#173D32';
  const corners = [
    [32, 32],
    [width - 32, 32],
    [32, height - 32],
    [width - 32, height - 32],
  ];
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. Top Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#71866B';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "DM Sans", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('FIELDQUEST BOTANICAL ATELIER · ARCHIVAL SPECIMEN FOLIO', width / 2, 74);
  ctx.letterSpacing = '0px';

  // Plate Number
  ctx.fillStyle = '#173D32';
  ctx.font = 'italic 16px "Fraunces", Georgia, serif';
  ctx.fillText(options.plateNumber.toUpperCase(), width / 2, 102);

  // Title
  ctx.font = 'bold 28px "Fraunces", Georgia, serif';
  ctx.fillStyle = '#173D32';
  ctx.fillText(options.title, width / 2, 138);

  // Subtitle / Taxonomic Context
  if (options.subtitle) {
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "DM Sans", sans-serif';
    ctx.fillStyle = '#66756A';
    ctx.fillText(options.subtitle, width / 2, 162);
  }

  // 4. Load & Render Specimen Image
  const imgY = options.subtitle ? 180 : 165;
  const imgBoxWidth = width - 110;
  const imgBoxHeight = 670;
  const imgX = 55;

  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => {
      // If error, continue with placeholder box
      resolve();
    };
    img.src = options.imageSrc;
  });

  // Image Frame Card
  ctx.fillStyle = '#FFFEFA';
  roundRect(ctx, imgX, imgY, imgBoxWidth, imgBoxHeight, 16);
  ctx.fill();
  ctx.strokeStyle = '#DDE3D5';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (img.width && img.height) {
    // Preserve aspect ratio inside image frame
    const hRatio = imgBoxWidth / img.width;
    const vRatio = imgBoxHeight / img.height;
    const ratio = Math.min(hRatio, vRatio) * 0.96;
    const drawW = img.width * ratio;
    const drawH = img.height * ratio;
    const drawX = imgX + (imgBoxWidth - drawW) / 2;
    const drawY = imgY + (imgBoxHeight - drawH) / 2;

    ctx.save();
    roundRect(ctx, imgX + 6, imgY + 6, imgBoxWidth - 12, imgBoxHeight - 12, 12);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  // 5. Specimen Description Section
  const descY = imgY + imgBoxHeight + 28;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#173D32';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "DM Sans", sans-serif';
  ctx.fillText('NATURALIST OBSERVATIONS & FIELD DESCRIPTION:', 60, descY);

  ctx.fillStyle = '#4D5C52';
  ctx.font = '13.5px -apple-system, BlinkMacSystemFont, "DM Sans", sans-serif';
  wrapText(ctx, options.description, 60, descY + 22, width - 120, 20, 3);

  // 6. Three Morphological Diagnostic Key Cards
  const cardsY = descY + 70;
  const cardGap = 18;
  const totalCardsWidth = width - 120;
  const cardWidth = (totalCardsWidth - cardGap * 2) / 3;
  const cardHeight = 150;

  options.details.slice(0, 3).forEach((d, idx) => {
    const cx = 60 + idx * (cardWidth + cardGap);
    
    // Card Background
    ctx.fillStyle = '#EBE7D8';
    roundRect(ctx, cx, cardsY, cardWidth, cardHeight, 12);
    ctx.fill();
    ctx.strokeStyle = '#D3D8C8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Card Index Badge
    ctx.fillStyle = '#173D32';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "DM Sans", sans-serif';
    ctx.fillText(`KEY 0${idx + 1}`, cx + 14, cardsY + 22);

    // Card Title
    ctx.fillStyle = '#173D32';
    ctx.font = 'bold 13px "Fraunces", Georgia, serif';
    wrapText(ctx, d.title, cx + 14, cardsY + 44, cardWidth - 28, 16, 2);

    // Card Description
    ctx.fillStyle = '#5A685D';
    ctx.font = '11.5px -apple-system, BlinkMacSystemFont, "DM Sans", sans-serif';
    wrapText(ctx, d.description, cx + 14, cardsY + 84, cardWidth - 28, 16, 3);
  });

  // 7. Archival Stamp & Footer Ledger
  const footerY = height - 90;
  ctx.strokeStyle = '#DDE3D5';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, footerY);
  ctx.lineTo(width - 60, footerY);
  ctx.stroke();

  // Left Footer: Verification
  ctx.fillStyle = '#71866B';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "DM Sans", sans-serif';
  ctx.fillText('VERIFIED MORPHOLOGICAL RECORD', 60, footerY + 24);

  ctx.fillStyle = '#66756A';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "DM Sans", sans-serif';
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  ctx.fillText(`Recorded: ${dateStr} · FieldQuest Offline Vault`, 60, footerY + 42);

  // Right Footer: Sovereign Watermark
  ctx.textAlign = 'right';
  ctx.fillStyle = '#173D32';
  ctx.font = 'italic 12px "Fraunces", Georgia, serif';
  ctx.fillText('Living Observation Over Screen Scrolling', width - 60, footerY + 24);

  ctx.fillStyle = '#71866B';
  ctx.font = '10.5px -apple-system, BlinkMacSystemFont, "DM Sans", sans-serif';
  ctx.fillText('100% Client-Side Render · Zero Cloud Telemetry', width - 60, footerY + 42);

  // 8. Trigger Download
  const dataUrl = canvas.toDataURL('image/png');
  const downloadLink = document.createElement('a');
  downloadLink.href = dataUrl;
  downloadLink.download = `fieldquest-${options.id}-specimen-folio.png`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
