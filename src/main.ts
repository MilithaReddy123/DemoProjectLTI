import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Chart } from 'chart.js';

import { AppModule } from './app/app.module';

// Lightweight plugin: draw pie labels outside with connector lines (reference-style)
Chart.register({
  id: 'pieOutLabels',
  afterDatasetDraw(chart, args, pluginOptions) {
    // cast to any to avoid strict typing issues; we only care if it's a pie chart
    const cfg: any = chart.config;
    if (cfg.type !== 'pie') return;
    const meta = chart.getDatasetMeta(args.index);
    if (!meta?.data?.length) return;

    const opts: any = pluginOptions || {};
    const ctx = chart.ctx;
    const labels = (chart.data.labels || []) as any[];

    const lineLen = Number(opts.lineLength ?? 18);
    const elbowLen = Number(opts.elbowLength ?? 10);
    const fontSize = Number(opts.fontSize ?? 11);
    const lineWidth = Number(opts.lineWidth ?? 1);
    const color = String(opts.color ?? '#444');
    const maxChars = Number(opts.maxChars ?? 14);
    const radiusFactor = Number(opts.radiusFactor ?? 0.85);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.font = `600 ${fontSize}px Arial`;

    meta.data.forEach((arc: any, i: number) => {
      const p = arc.getProps(['x', 'y', 'startAngle', 'endAngle', 'outerRadius'], true);
      const angle = (p.startAngle + p.endAngle) / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const r = p.outerRadius * radiusFactor;

      const x1 = p.x + cos * r;
      const y1 = p.y + sin * r;
      const x2 = p.x + cos * (r + lineLen);
      const y2 = p.y + sin * (r + lineLen);
      const x3 = x2 + (cos >= 0 ? elbowLen : -elbowLen);
      const y3 = y2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.stroke();

      let text = String(labels[i] ?? '');
      const isTwoLine = text === 'Andhra Pradesh';
      if (!isTwoLine && maxChars > 3 && text.length > maxChars) {
        text = text.slice(0, maxChars - 3) + '...';
      }
      ctx.textAlign = cos >= 0 ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      const xText = x3 + (cos >= 0 ? 4 : -4);

      if (isTwoLine) {
        const parts = ['Andhra', 'Pradesh'];
        const lineHeight = fontSize + 2;
        const yStart = y3 - lineHeight / 2;
        parts.forEach((part, idx) => {
          ctx.fillText(part, xText, yStart + idx * lineHeight);
        });
      } else {
        ctx.fillText(text, xText, y3);
      }
    });

    ctx.restore();
  }
});

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
