import React, { useEffect, useRef } from 'react';
import { DecisionItem, MetricKey, formatMetricValue } from '../data/evidence';

interface TrueScaleWeightChamberProps {
  lighterItem: DecisionItem;
  heavierItem: DecisionItem;
  lighterSide: 'left' | 'right';
  multiplier: number;
  activeMetric: MetricKey;
}

function formatCount(n: number): string {
  if (n >= 100) return Math.round(n).toLocaleString('pl-PL');
  return n.toLocaleString('pl-PL', {
    minimumFractionDigits: n % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

/**
 * Renders EVERY SINGLE unit weight block at true 1:1 proportion on a HiDPI canvas
 * next to 1 solitary reference block, so 4.7x, 13.6x, 32.6x, 496x, or 1 733x
 * is physically felt by actual count and height.
 */
export const TrueScaleWeightChamber: React.FC<TrueScaleWeightChamberProps> = ({
  lighterItem,
  heavierItem,
  lighterSide,
  multiplier,
  activeMetric,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // For extreme > 25,000x ratios (e.g. 100 AI prompts vs 1 yr SAD on land = 3,000,000x),
  // group into 100x calibrated brass ingots so browser canvas height stays within GPU limits.
  const unitScale = multiplier > 25000 ? 100 : 1;
  const scaledCount = multiplier / unitScale;
  const fullBlocks = Math.floor(scaledCount);
  const fracBlock = scaledCount - fullBlocks;
  const hasFrac = fracBlock >= 0.05;
  const totalSlots = fullBlocks + (hasFrac ? 1 : 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const containerW = Math.max(260, wrap.clientWidth);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Adapt block size & columns to multiplier so small counts look bold & monumental,
      // while 496x–2000x form an unmistakable towering metrology field.
      const isCompact = containerW < 460;
      let cols: number;
      let blockW: number;
      let blockH: number;
      let gap: number;

      if (totalSlots <= 20) {
        cols = isCompact ? 5 : 10;
        blockW = isCompact ? 20 : 28;
        blockH = isCompact ? 13 : 17;
        gap = isCompact ? 5 : 6;
      } else if (totalSlots <= 120) {
        cols = isCompact ? 10 : 20;
        blockW = isCompact ? 11 : 16;
        blockH = isCompact ? 8 : 11;
        gap = isCompact ? 3 : 4;
      } else if (totalSlots <= 2500) {
        cols = isCompact ? 15 : 30;
        blockW = isCompact ? 7 : 10;
        blockH = isCompact ? 5.5 : 7;
        gap = 2.5;
      } else {
        cols = isCompact ? 25 : 50;
        blockW = isCompact ? 4.5 : 6;
        blockH = isCompact ? 4 : 5;
        gap = 1.8;
      }

      const rows = Math.max(1, Math.ceil(totalSlots / cols));
      const padTop = 18;
      const padBottom = 18;
      const axisGutter = isCompact ? 34 : 48;
      const centerDivider = isCompact ? 16 : 28;

      const gridW = cols * blockW + (cols - 1) * gap;
      const singleSideW = Math.max(gridW, isCompact ? 105 : 180);
      const logicalW = containerW;
      const halfW = (logicalW - axisGutter - centerDivider) / 2;

      // Scale block geometry gently if container is narrower than preferred gridW
      const scaleFit = gridW > halfW - 8 ? (halfW - 8) / gridW : 1;
      const bw = blockW * scaleFit;
      const bh = blockH * scaleFit;
      const g = gap * scaleFit;
      const actualGridW = cols * bw + (cols - 1) * g;
      const actualGridH = rows * bh + (rows - 1) * g;

      const logicalH = Math.min(
        4200,
        Math.max(88, padTop + actualGridH + padBottom),
      );

      canvas.width = Math.round(logicalW * dpr);
      canvas.height = Math.round(logicalH * dpr);
      canvas.style.width = `${logicalW}px`;
      canvas.style.height = `${logicalH}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, logicalW, logicalH);

      const leftAreaX = axisGutter;
      const rightAreaX = axisGutter + halfW + centerDivider;
      const lighterAreaX = lighterSide === 'left' ? leftAreaX : rightAreaX;
      const heavierAreaX = lighterSide === 'left' ? rightAreaX : leftAreaX;

      // Vertical center hairline separating the two pans' chambers
      const midX = axisGutter + halfW + centerDivider / 2;
      ctx.strokeStyle = 'rgba(20, 22, 21, 0.22)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(midX, 6);
      ctx.lineTo(midX, logicalH - 6);
      ctx.stroke();
      ctx.setLineDash([]);

      // Left axis hairline (height gauge)
      ctx.strokeStyle = 'rgba(20, 22, 21, 0.25)';
      ctx.beginPath();
      ctx.moveTo(axisGutter - 6, padTop);
      ctx.lineTo(axisGutter - 6, padTop + actualGridH);
      ctx.stroke();

      // Engraved row count ticks along the left gutter
      ctx.font = '500 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#5A605C';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const tickEveryRows =
        rows <= 6 ? 1 : rows <= 20 ? 5 : rows <= 60 ? 10 : Math.ceil(rows / 8);

      for (let r = 0; r < rows; r++) {
        const isLast = r === rows - 1;
        if (r === 0 || (r + 1) % tickEveryRows === 0 || isLast) {
          const yCenter = padTop + r * (bh + g) + bh / 2;
          const countAtRow = Math.min(totalSlots, (r + 1) * cols) * unitScale;
          ctx.strokeStyle = '#141615';
          ctx.beginPath();
          ctx.moveTo(axisGutter - 10, yCenter);
          ctx.lineTo(axisGutter - 6, yCenter);
          ctx.stroke();
          ctx.fillText(
            countAtRow >= 1000
              ? `${(countAtRow / 1000).toFixed(countAtRow % 1000 === 0 ? 0 : 1)}k`
              : String(Math.round(countAtRow)),
            axisGutter - 13,
            yCenter,
          );
        }
      }

      // Draw ALL individual unit blocks on the lighter side (centered in its column)
      const startX = lighterAreaX + (halfW - actualGridW) / 2;

      for (let i = 0; i < totalSlots; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const isFrac = hasFrac && i === fullBlocks;
        const w = isFrac ? Math.max(2.5, bw * fracBlock) : bw;
        const x = startX + c * (bw + g);
        const y = padTop + r * (bh + g);

        ctx.fillStyle = isFrac ? '#C97B57' : '#A44B27';
        ctx.fillRect(x, y, w, bh);

        if (bw >= 6) {
          ctx.strokeStyle = '#141615';
          ctx.lineWidth = 0.65;
          ctx.strokeRect(x + 0.3, y + 0.3, Math.max(1, w - 0.6), Math.max(1, bh - 0.6));
        }
      }

      // Draw ONE solitary reference block on the heavier side (exact same unit size if 1:1!)
      const refW = Math.max(bw, 10);
      const refH = Math.max(bh, 8);
      const refX = heavierAreaX + (halfW - refW) / 2;
      const refY = padTop;

      ctx.fillStyle = '#141615';
      ctx.fillRect(refX, refY, refW, refH);
      ctx.strokeStyle = '#A44B27';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(refX - 2, refY - 2, refW + 4, refH + 4);

      // Clean "1×" label directly under the solitary reference block
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#141615';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('1×', refX + refW / 2, refY + refH + 8);

      // Avoid unused var warning
      void singleSideW;
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [totalSlots, fullBlocks, fracBlock, hasFrac, lighterSide, unitScale]);

  return (
    <div className="weight-chamber" aria-live="polite">
      <div className="weight-chamber-header">
        <div className="weight-chamber-title-group">
          <span className="mono weight-chamber-kicker">
            KOMORA ODWAŻNIKÓW W REALNEJ PROPORCJI 1:1
          </span>
          <span className="weight-chamber-caption">
            {unitScale === 1 ? (
              <>
                Każdy miedziany bloczek = <strong>1× {lighterItem.shortLabel}</strong> (
                {formatMetricValue(lighterItem.metrics[activeMetric], activeMetric)}) ·
                Razem: <strong>{formatCount(multiplier)} bloczków</strong> wobec{' '}
                <strong>1× {heavierItem.shortLabel}</strong>
              </>
            ) : (
              <>
                Skala ekstremalna ({formatCount(multiplier)}×): 1 sztabka ={' '}
                <strong>100× {lighterItem.shortLabel}</strong> (łącznie{' '}
                {fullBlocks.toLocaleString('pl-PL')} sztabek po 100 szt.) wobec{' '}
                <strong>1× {heavierItem.shortLabel}</strong>
              </>
            )}
          </span>
        </div>
      </div>

      <div ref={wrapRef} className="weight-chamber-canvas-wrap">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Wizualizacja 1:1 proporcji: ${formatCount(multiplier)} bloczków ${
            lighterItem.shortLabel
          } obok 1 bloczka ${heavierItem.shortLabel}`}
        />
      </div>
    </div>
  );
};
