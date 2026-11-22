import {
  DecisionItem,
  METRICS,
  MetricKey,
  SOURCES,
  formatMetricValue,
  formatRatio,
} from '../data/evidence';

interface ShareCardInput {
  leftItem: DecisionItem;
  rightItem: DecisionItem;
  leftFreq: number;
  rightFreq: number;
  activeMetric: MetricKey;
  verdictText: string;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

export function downloadMetrologyShareCard({
  leftItem,
  rightItem,
  leftFreq,
  rightFreq,
  activeMetric,
  verdictText,
}: ShareCardInput): void {
  const width = 1200;
  const height = 630;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const leftVal = leftItem.metrics[activeMetric] * leftFreq;
  const rightVal = rightItem.metrics[activeMetric] * rightFreq;
  const ratio = formatRatio(leftVal, rightVal);
  const leftSource = SOURCES[leftItem.primarySourceId];
  const rightSource = SOURCES[rightItem.primarySourceId];

  // Crisp architectural gallery white ground
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Subtle top accent bar
  ctx.fillStyle = '#1D4ED8';
  ctx.fillRect(0, 0, width, 8);

  // Header
  ctx.fillStyle = '#0E1116';
  ctx.font = '800 30px "Bricolage Grotesque", sans-serif';
  ctx.fillText('SKALA', 60, 74);

  ctx.fillStyle = '#64748B';
  ctx.font = '500 15px "Hanken Grotesk", sans-serif';
  ctx.fillText('Porównanie wpływu środowiskowego · Dane LCA', 176, 72);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#1D4ED8';
  ctx.font = '700 15px "Hanken Grotesk", sans-serif';
  ctx.fillText(METRICS[activeMetric].fullName.toUpperCase(), width - 60, 72);
  ctx.textAlign = 'left';

  ctx.strokeStyle = '#E2E5EB';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 96);
  ctx.lineTo(width - 60, 96);
  ctx.stroke();

  // Big Ratio Headline
  ctx.fillStyle = '#64748B';
  ctx.font = '600 14px "Hanken Grotesk", sans-serif';
  ctx.fillText(`ZMIERZONA PROPORCJA (${METRICS[activeMetric].shortLabel.toUpperCase()})`, 60, 136);

  ctx.fillStyle = '#0E1116';
  ctx.font = '800 74px "Bricolage Grotesque", sans-serif';
  ctx.fillText(ratio.label, 60, 210);

  // Two side-by-side specimen cards
  const boxY = 246;
  const boxW = 524;
  const boxH = 186;
  const drawCard = (
    x: number,
    item: DecisionItem,
    freq: number,
    val: number,
    isHeavier: boolean,
    sourceBadge: string,
  ) => {
    ctx.fillStyle = isHeavier ? '#FEF2F2' : '#F5F6F8';
    ctx.fillRect(x, boxY, boxW, boxH);
    ctx.fillStyle = isHeavier ? '#DC2626' : '#CBD5E1';
    ctx.fillRect(x, boxY, boxW, 4);

    ctx.fillStyle = '#64748B';
    ctx.font = '600 13px "Hanken Grotesk", sans-serif';
    ctx.fillText(
      freq > 1 ? `${freq}× (${item.unit})` : `1× (${item.unit})`,
      x + 24,
      boxY + 36,
    );

    ctx.fillStyle = '#0E1116';
    ctx.font = '700 22px "Bricolage Grotesque", sans-serif';
    const titleLines = wrapLines(ctx, item.name, boxW - 48, 2);
    titleLines.forEach((line, idx) => {
      ctx.fillText(line, x + 24, boxY + 68 + idx * 26);
    });

    ctx.fillStyle = isHeavier ? '#DC2626' : '#0E1116';
    ctx.font = '800 40px "Bricolage Grotesque", sans-serif';
    ctx.fillText(formatMetricValue(val, activeMetric), x + 24, boxY + 148);

    ctx.fillStyle = '#1D4ED8';
    ctx.font = '600 13px "Hanken Grotesk", sans-serif';
    ctx.fillText(`Źródło: ${sourceBadge}`, x + 24, boxY + 172);
  };

  drawCard(60, leftItem, leftFreq, leftVal, ratio.heavier === 'left', leftSource.shortBadge);
  drawCard(
    width - 60 - boxW,
    rightItem,
    rightFreq,
    rightVal,
    ratio.heavier === 'right',
    rightSource.shortBadge,
  );

  // Verdict text
  ctx.fillStyle = '#141615';
  ctx.font = '500 19px Archivo, sans-serif';
  const verdictLines = wrapLines(ctx, verdictText, width - 120, 3);
  verdictLines.forEach((line, idx) => {
    ctx.fillText(line, 60, 476 + idx * 28);
  });

  // Footer colophon
  ctx.strokeStyle = 'rgba(20, 22, 21, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 562);
  ctx.lineTo(width - 60, 562);
  ctx.stroke();

  ctx.fillStyle = '#5A605C';
  ctx.font = '500 13px "JetBrains Mono", monospace';
  ctx.fillText('piotrowskiadam.github.io/skala-ethics-comparison', 60, 588);
  ctx.textAlign = 'right';
  ctx.fillText('ZWERYFIKOWANE DANE LCA · ZERO GREENWASHINGU', width - 60, 588);

  const link = document.createElement('a');
  link.download = `skala-${leftItem.id}-vs-${rightItem.id}-${activeMetric}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
