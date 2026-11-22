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

  // Warm laboratory enamel ground
  ctx.fillStyle = '#ECEAE3';
  ctx.fillRect(0, 0, width, height);

  // Subtle calibration dot grid
  ctx.fillStyle = 'rgba(20, 22, 21, 0.05)';
  for (let x = 24; x < width; x += 28) {
    for (let y = 24; y < height; y += 28) {
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  // Outer machined border
  ctx.strokeStyle = '#141615';
  ctx.lineWidth = 3;
  ctx.strokeRect(26, 26, width - 52, height - 52);

  // Header band
  ctx.fillStyle = '#141615';
  ctx.font = '800 30px Archivo, sans-serif';
  ctx.fillText('SKALA', 60, 82);

  ctx.fillStyle = '#5A605C';
  ctx.font = '500 15px "JetBrains Mono", monospace';
  ctx.fillText('/ INSTRUMENT METROLOGICZNY · DANE LCA', 176, 80);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#A44B27';
  ctx.font = '700 16px "JetBrains Mono", monospace';
  ctx.fillText(METRICS[activeMetric].fullName.toUpperCase(), width - 60, 80);
  ctx.textAlign = 'left';

  // Header divider
  ctx.strokeStyle = '#141615';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 104);
  ctx.lineTo(width - 60, 104);
  ctx.stroke();

  // Big Ratio Headline
  ctx.fillStyle = '#5A605C';
  ctx.font = '600 14px "JetBrains Mono", monospace';
  ctx.fillText(`ZMIERZONY STOSUNEK (${METRICS[activeMetric].shortLabel.toUpperCase()})`, 60, 142);

  ctx.fillStyle = '#A44B27';
  ctx.font = '800 72px Archivo, sans-serif';
  ctx.fillText(ratio.label, 60, 214);

  // Two side-by-side specimen boxes
  const boxY = 248;
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
    ctx.fillStyle = '#F4F2EC';
    ctx.fillRect(x, boxY, boxW, boxH);
    ctx.strokeStyle = isHeavier ? '#A44B27' : '#141615';
    ctx.lineWidth = isHeavier ? 3 : 1.5;
    ctx.strokeRect(x, boxY, boxW, boxH);

    ctx.fillStyle = '#5A605C';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText(
      freq > 1 ? `${freq}× (${item.unit})` : `1× (${item.unit})`,
      x + 24,
      boxY + 34,
    );

    ctx.fillStyle = '#141615';
    ctx.font = '700 22px Archivo, sans-serif';
    const titleLines = wrapLines(ctx, item.name, boxW - 48, 2);
    titleLines.forEach((line, idx) => {
      ctx.fillText(line, x + 24, boxY + 66 + idx * 26);
    });

    ctx.fillStyle = isHeavier ? '#A44B27' : '#141615';
    ctx.font = '800 40px Archivo, sans-serif';
    ctx.fillText(formatMetricValue(val, activeMetric), x + 24, boxY + 148);

    ctx.fillStyle = '#344E61';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText(`ŹRÓDŁO: ${sourceBadge}`, x + 24, boxY + 172);
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
