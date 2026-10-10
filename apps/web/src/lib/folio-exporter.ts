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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Print or Save as PDF exclusively for a specific specimen card.
 * Uses an isolated headless print frame so the rest of the website is never included.
 */
export async function printSingleSpecimenFolio(options: FolioExportOptions): Promise<void> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const detailsHtml = options.details
    .slice(0, 3)
    .map(
      (d, idx) => `
      <div style="flex: 1; padding: 10px 12px; border-radius: 8px; border: 1px solid #DDE3D5; background: #F5F2E8;">
        <div style="font-size: 9px; font-weight: bold; color: #173D32; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">Diagnostic Key 0${idx + 1}</div>
        <div style="font-family: Georgia, serif; font-size: 11.5px; font-weight: bold; color: #173D32; margin-bottom: 3px;">${escapeHtml(d.title)}</div>
        <div style="font-size: 10px; color: #4D5C52; line-height: 1.35;">${escapeHtml(d.description)}</div>
      </div>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>FieldQuest — ${escapeHtml(options.plateNumber)}: ${escapeHtml(options.title)}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #173D32;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .plate-card {
            border: 2px solid #173D32;
            padding: 18px 20px;
            background: #FDFBF7;
            height: 96vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          .plate-header {
            text-align: center;
            border-bottom: 1px solid #DDE3D5;
            padding-bottom: 10px;
          }
          .atelier-tag {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 2px;
            color: #71866B;
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          .plate-num {
            font-family: Georgia, serif;
            font-style: italic;
            font-size: 12.5px;
            color: #173D32;
          }
          .plate-title {
            font-family: Georgia, serif;
            font-size: 20px;
            font-weight: bold;
            color: #173D32;
            margin: 3px 0 2px 0;
          }
          .plate-subtitle {
            font-size: 10.5px;
            color: #66756A;
          }
          .img-frame {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 10px 0;
            border: 1px solid #DDE3D5;
            border-radius: 10px;
            background: #FFFEFA;
            overflow: hidden;
            max-height: 460px;
          }
          .specimen-img {
            max-width: 100%;
            max-height: 440px;
            object-fit: contain;
          }
          .plate-desc {
            margin-bottom: 10px;
          }
          .desc-label {
            font-size: 9.5px;
            font-weight: bold;
            color: #173D32;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 3px;
          }
          .desc-text {
            font-size: 11px;
            color: #4D5C52;
            line-height: 1.4;
          }
          .keys-grid {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
          }
          .plate-footer {
            border-top: 1px solid #DDE3D5;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 9px;
            color: #66756A;
          }
          .footer-brand {
            font-weight: bold;
            color: #71866B;
          }
        </style>
      </head>
      <body>
        <div class="plate-card">
          <div class="plate-header">
            <div class="atelier-tag">FieldQuest Botanical Atelier · Archival Specimen Folio</div>
            <div class="plate-num">${escapeHtml(options.plateNumber.toUpperCase())}</div>
            <h1 class="plate-title">${escapeHtml(options.title)}</h1>
            ${options.subtitle ? `<div class="plate-subtitle">${escapeHtml(options.subtitle)}</div>` : ''}
          </div>

          <div class="img-frame">
            <img class="specimen-img" id="folio-img" src="${options.imageSrc}" alt="${escapeHtml(options.title)}" />
          </div>

          <div class="plate-desc">
            <div class="desc-label">Naturalist Field Observations:</div>
            <p class="desc-text">${escapeHtml(options.description)}</p>
          </div>

          <div class="keys-grid">
            ${detailsHtml}
          </div>

          <div class="plate-footer">
            <div>
              <div class="footer-brand">VERIFIED MORPHOLOGICAL RECORD</div>
              <div>Recorded: ${dateStr} · FieldQuest Offline Vault</div>
            </div>
            <div style="text-align: right;">
              <div style="font-family: Georgia, serif; font-style: italic; color: #173D32;">Living Observation Over Screen Scrolling</div>
              <div>100% Client-Side Render · Zero Cloud Data</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  const imgEl = doc.getElementById('folio-img') as HTMLImageElement | null;
  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Print folio error:', e);
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  };

  if (imgEl && !imgEl.complete) {
    imgEl.onload = () => triggerPrint();
    imgEl.onerror = () => triggerPrint();
  } else {
    setTimeout(triggerPrint, 200);
  }
}

