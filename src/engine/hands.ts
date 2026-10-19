export interface HandImageConfig {
  path: string;
  width: number;
  height: number;
  tipX: number;
  tipY: number;
}

export interface HandConfig {
  name: string;
  images: Record<string, HandImageConfig>;
}

export const CUSTOM_HANDS: Record<string, HandConfig> = {
  'custom1': {
    name: 'Custom Hand 1',
    images: {
      '720': { path: '/images/hand1-720p.png', width: 432, height: 768, tipX: 229, tipY: 0 },
      '1080': { path: '/images/hand1-1080p.png', width: 648, height: 1152, tipX: 325, tipY: 1 },
      '1440': { path: '/images/hand1-1440p.png', width: 864, height: 1536, tipX: 448, tipY: 1 },
      '720v': { path: '/images/hand1vertical-720p.png', width: 720, height: 1280, tipX: 0, tipY: 0 },
      '1080v': { path: '/images/hand1vertical-1080p.png', width: 1080, height: 1920, tipX: 0, tipY: 0 },
      '1440v': { path: '/images/hand1vertical-1440p.png', width: 1440, height: 2560, tipX: 0, tipY: 0 },
    }
  },
  'custom2': {
    name: 'Custom Hand 2',
    images: {
      '720': { path: '/images/hand2-720p.png', width: 432, height: 768, tipX: 166, tipY: 0 },
      '1080': { path: '/images/hand2-1080p.png', width: 648, height: 1152, tipX: 249, tipY: 0 },
      '1440': { path: '/images/hand2-1440p.png', width: 864, height: 1536, tipX: 345, tipY: 0 },
      '720v': { path: '/images/hand2vertical-720p.png', width: 720, height: 1280, tipX: 0, tipY: 0 },
      '1080v': { path: '/images/hand2vertical-1080p.png', width: 1080, height: 1920, tipX: 0, tipY: 0 },
      '1440v': { path: '/images/hand2vertical-1440p.png', width: 1440, height: 2560, tipX: 0, tipY: 0 },
    }
  },
  'custom3': {
    name: 'Custom Hand 3',
    images: {
      '720': { path: '/images/hand3-720p.png', width: 432, height: 768, tipX: 117, tipY: 0 },
      '1080': { path: '/images/hand3-1080p.png', width: 648, height: 1152, tipX: 196, tipY: 0 },
      '1440': { path: '/images/hand3-1440p.png', width: 864, height: 1536, tipX: 266, tipY: 1 },
      '720v': { path: '/images/hand3vertical-720p.png', width: 720, height: 1280, tipX: 1, tipY: 0 },
      '1080v': { path: '/images/hand3vertical-1080p.png', width: 1080, height: 1920, tipX: 0, tipY: 0 },
      '1440v': { path: '/images/hand3vertical-1440p.png', width: 1440, height: 2560, tipX: 0, tipY: 0 },
    }
  },
  'custom4': {
    name: 'Custom Hand 4',
    images: {
      '720': { path: '/images/hand4-720p.png', width: 432, height: 768, tipX: 81, tipY: 628 },
      '1080': { path: '/images/hand4-1080p.png', width: 648, height: 1152, tipX: 140, tipY: 904 },
      '1440': { path: '/images/hand4-1440p.png', width: 864, height: 1536, tipX: 175, tipY: 1214 },
      '720v': { path: '/images/hand4vertical-720p.png', width: 432, height: 768, tipX: 81, tipY: 628 },
      '1080v': { path: '/images/hand4vertical-1080p.png', width: 450, height: 750, tipX: 225, tipY: 150 },
      '1440v': { path: '/images/hand4vertical-1440p.png', width: 864, height: 1536, tipX: 175, tipY: 1213 },
    }
  },
  'custom5': {
    name: 'Cartoon',
    images: {
      '720': { path: '/images/hand5-720p.png', width: 180, height: 320, tipX: 0, tipY: 49 },
      '1080': { path: '/images/hand5-1080p.png', width: 270, height: 480, tipX: 1, tipY: 75 },
      '1440': { path: '/images/hand5-1440p.png', width: 360, height: 640, tipX: 1, tipY: 101 },
      '720v': { path: '/images/hand5vertical-720p.png', width: 180, height: 320, tipX: 0, tipY: 49 },
      '1080v': { path: '/images/hand5vertical-1080p.png', width: 270, height: 480, tipX: 1, tipY: 75 },
      '1440v': { path: '/images/hand5vertical-1440p.png', width: 360, height: 640, tipX: 1, tipY: 101 },
    }
  },
  'custom6': {
    name: 'Pixel Art',
    images: {
      '720': { path: '/images/hand6-720p.png', width: 180, height: 320, tipX: 19, tipY: 94 },
      '1080': { path: '/images/hand6-1080p.png', width: 270, height: 480, tipX: 29, tipY: 141 },
      '1440': { path: '/images/hand6-1440p.png', width: 360, height: 640, tipX: 34, tipY: 176 },
      '720v': { path: '/images/hand6vertical-720p.png', width: 180, height: 320, tipX: 19, tipY: 94 },
      '1080v': { path: '/images/hand6vertical-1080p.png', width: 270, height: 480, tipX: 29, tipY: 141 },
      '1440v': { path: '/images/hand6vertical-1440p.png', width: 360, height: 640, tipX: 34, tipY: 176 },
    }
  }
};

const handImagesCache: Record<string, Record<string, HTMLImageElement>> = {};

export function preloadHandImages(): void {
  for (const [handId, handConfig] of Object.entries(CUSTOM_HANDS)) {
    if (!handImagesCache[handId]) {
      handImagesCache[handId] = {};
    }
    for (const [resKey, imgData] of Object.entries(handConfig.images)) {
      if (!handImagesCache[handId][resKey]) {
        const img = new Image();
        img.src = imgData.path;
        handImagesCache[handId][resKey] = img;
      }
    }
  }
}

export function getResolutionKey(w: number, h: number): string {
  const maxDim = Math.max(w, h);
  const isPortrait = h > w;
  let baseRes = '720';
  if (maxDim <= 1280) baseRes = '720';
  else if (maxDim <= 1920) baseRes = '1080';
  else baseRes = '1440';

  return isPortrait ? `${baseRes}v` : baseRes;
}

export function drawHandSprite(
  ctx: CanvasRenderingContext2D,
  tipX: number,
  tipY: number,
  style: string,
  canvasW: number,
  canvasH: number,
  smoothGlide: boolean = true,
  glideStateHolder: any = null
): void {
  if (style === 'ghost') return;

  let drawX = tipX;
  let drawY = tipY;

  if (smoothGlide && glideStateHolder) {
    const MAX_GLIDE_PX = 34;
    if (glideStateHolder._handGX == null) {
      glideStateHolder._handGX = tipX;
      glideStateHolder._handGY = tipY;
    } else {
      const dx = tipX - glideStateHolder._handGX;
      const dy = tipY - glideStateHolder._handGY;
      const dist = Math.hypot(dx, dy);
      if (dist <= MAX_GLIDE_PX) {
        glideStateHolder._handGX = tipX;
        glideStateHolder._handGY = tipY;
      } else {
        const t = MAX_GLIDE_PX / dist;
        glideStateHolder._handGX += dx * t;
        glideStateHolder._handGY += dy * t;
      }
    }
    drawX = glideStateHolder._handGX;
    drawY = glideStateHolder._handGY;
  }

  const effectiveStyle = CUSTOM_HANDS[style] ? style : 'custom1';
  const handConfig = CUSTOM_HANDS[effectiveStyle];
  if (!handConfig) return;

  const resKey = getResolutionKey(canvasW, canvasH);
  const imgConfig = handConfig.images[resKey] || handConfig.images['720'];
  const cached = handImagesCache[effectiveStyle]?.[resKey] || handImagesCache[effectiveStyle]?.['720'];

  if (cached && cached.complete && cached.naturalWidth > 0 && imgConfig) {
    ctx.save();
    const imgX = drawX - imgConfig.tipX;
    const imgY = drawY - imgConfig.tipY;
    ctx.drawImage(cached, imgX, imgY, imgConfig.width, imgConfig.height);
    ctx.restore();
  } else if (cached && !cached.complete) {
    // Attempt fallback or wait
  }
}

export function drawWhiteboardEraser(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  canvasW: number,
  canvasH: number,
  handStyle = 'custom1'
): void {
  ctx.save();
  const scale = Math.sqrt((canvasW * canvasH) / (1280 * 720));

  // Optionally draw hand holding eraser behind/above it
  if (handStyle !== 'ghost') {
    ctx.save();
    drawHandSprite(ctx, x - 15 * scale, y - 30 * scale, handStyle, canvasW, canvasH, false);
    ctx.restore();
  }

  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  const w = 110;
  const h = 54;
  const rx = -w / 2;
  const ry = -h / 2;

  // Soft shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;

  // 1. Bottom felt pad (thick gray-white felt)
  ctx.fillStyle = '#f3f4f6';
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(rx, ry + 36, w, 18, [0, 0, 5, 5]);
  } else {
    ctx.rect(rx, ry + 36, w, 18);
  }
  ctx.fill();
  ctx.restore();

  // Felt texture lines
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 1;
  for (let fx = rx + 6; fx < rx + w - 4; fx += 7) {
    ctx.beginPath();
    ctx.moveTo(fx, ry + 40);
    ctx.lineTo(fx + 2, ry + 52);
    ctx.stroke();
  }

  // 2. Blue accent foam middle band
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(rx, ry + 31, w, 6);

  // 3. Ergonomic molded plastic grip (charcoal black)
  const grad = ctx.createLinearGradient(0, ry, 0, ry + 31);
  grad.addColorStop(0, '#374151');
  grad.addColorStop(0.3, '#1f2937');
  grad.addColorStop(0.8, '#111827');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(rx, ry, w, 32, [8, 8, 2, 2]);
  } else {
    ctx.rect(rx, ry, w, 32);
  }
  ctx.fill();

  // Grip indents
  ctx.fillStyle = '#0b0f19';
  [-28, -14, 0, 14, 28].forEach((gx) => {
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(gx - 3, ry + 6, 6, 18, 3);
    } else {
      ctx.rect(gx - 3, ry + 6, 6, 18);
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(gx - 3, ry + 6, 1.5, 18);
    ctx.fillStyle = '#0b0f19';
  });

  // Top highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(rx + 2, ry + 2, w - 4, 8, [6, 6, 0, 0]);
  } else {
    ctx.rect(rx + 2, ry + 2, w - 4, 8);
  }
  ctx.stroke();

  // Realistic dry-erase ink marks on felt
  ctx.fillStyle = 'rgba(37, 99, 235, 0.28)';
  ctx.beginPath();
  ctx.arc(rx + 16, ry + 46, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(220, 38, 38, 0.22)';
  ctx.beginPath();
  ctx.arc(rx + w - 18, ry + 47, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
