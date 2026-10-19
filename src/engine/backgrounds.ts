import { BgSetting } from '../types';

export const BG_PRESETS = [
  { id: 'white', name: 'White', color: '#ffffff' },
  { id: 'notebook', name: 'Notebook', color: '#f4f8fc' },
  { id: 'graph', name: 'Graph', color: '#f0f6fa' },
  { id: 'cream', name: 'Cream', color: '#e8d5a0' },
  { id: 'chalk', name: 'Chalkboard', color: '#1a3328' },
  { id: 'softgrad', name: 'Soft Gradient', color: '#e8f4ff' },
  { id: 'warmwhite', name: 'Warm White', color: '#fafaf7' },
  { id: 'blueprint', name: 'Blueprint', color: '#1a3a5c' },
  { id: 'kraft', name: 'Kraft Paper', color: '#c8973a' },
  { id: 'dark', name: 'Dark', color: '#0f0f11' },
  { id: 'linen', name: 'Linen', color: '#f5ede0' },
];

export const BG_GRADIENTS: Record<string, (ctx: CanvasRenderingContext2D, w: number, h: number) => void> = {
  notebook: (ctx, w, h) => {
    ctx.fillStyle = '#f4f8fc';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c8d8e8';
    ctx.lineWidth = 1;
    for (let y = 22; y < h; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#d0dae4';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(60, 0);
    ctx.lineTo(60, h);
    ctx.stroke();
  },
  graph: (ctx, w, h) => {
    ctx.fillStyle = '#f0f6fa';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#dde8ef';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#c8d8e4';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  },
  cream: (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.5, h * 0.5, w * 0.7);
    g.addColorStop(0, '#ede0c4');
    g.addColorStop(0.4, '#e8d5a0');
    g.addColorStop(1, '#d4b87a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },
  chalk: (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.7);
    g.addColorStop(0, '#2d4a3e');
    g.addColorStop(0.6, '#1a3328');
    g.addColorStop(1, '#0f2318');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },
  softgrad: (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#f5f0ff');
    g.addColorStop(0.5, '#e8f4ff');
    g.addColorStop(1, '#f0fff4');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },
  warmwhite: (ctx, w, h) => {
    ctx.fillStyle = '#fafaf7';
    ctx.fillRect(0, 0, w, h);
  },
  blueprint: (ctx, w, h) => {
    ctx.fillStyle = '#1a3a5c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(26,82,118,0.6)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  },
  kraft: (ctx, w, h) => {
    ctx.fillStyle = '#c8973a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(196,151,58,0.25)';
    ctx.lineWidth = 1;
    for (let i = -h; i < w + h; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
    }
  },
  dark: (ctx, w, h) => {
    ctx.fillStyle = '#0f0f11';
    ctx.fillRect(0, 0, w, h);
  },
  linen: (ctx, w, h) => {
    ctx.fillStyle = '#f5ede0';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let x = 0; x < w; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  },
};

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bg: BgSetting,
  bgCanvas?: HTMLCanvasElement | null,
  isSlotMode?: boolean
): void {
  if (isSlotMode) {
    ctx.clearRect(0, 0, w, h);
    return;
  }

  if (bg.type === 'solid') {
    if (bg.val === 'transparent') {
      ctx.clearRect(0, 0, w, h);
    } else {
      ctx.fillStyle = bg.val === 'white' ? '#ffffff' : (bg.val || '#ffffff');
      ctx.fillRect(0, 0, w, h);
    }
  } else if (bg.type === 'gradient' && bg.key && BG_GRADIENTS[bg.key]) {
    ctx.save();
    BG_GRADIENTS[bg.key](ctx, w, h);
    ctx.restore();
  } else if (bg.type === 'custom' && bg.val) {
    ctx.fillStyle = bg.val;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }

  if (bgCanvas) {
    ctx.drawImage(bgCanvas, 0, 0);
  }
}
