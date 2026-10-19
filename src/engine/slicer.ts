export interface SliceResult {
  img: HTMLImageElement;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function sliceGrid(
  sourceImg: HTMLImageElement | HTMLCanvasElement,
  layerX: number,
  layerY: number,
  layerW: number,
  layerH: number,
  baseName: string,
  cols: number,
  rows: number
): Promise<SliceResult[]> {
  const cellW = layerW / cols;
  const cellH = layerH / rows;
  const results: Promise<SliceResult>[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sx = (c / cols) * sourceImg.width;
      const sy = (r / rows) * sourceImg.height;
      const sw = sourceImg.width / cols;
      const sh = sourceImg.height / rows;

      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(sourceImg, sx, sy, sw, sh, 0, 0, sw, sh);
      }

      const x = Math.round(layerX + c * cellW);
      const y = Math.round(layerY + r * cellH);
      const w = Math.round(cellW);
      const h = Math.round(cellH);

      const p = new Promise<SliceResult>((resolve) => {
        const outImg = new Image();
        outImg.onload = () => {
          resolve({
            img: outImg,
            name: `${baseName} (R${r + 1}C${c + 1})`,
            x,
            y,
            w,
            h,
          });
        };
        outImg.src = canvas.toDataURL('image/png');
      });
      results.push(p);
    }
  }

  return Promise.all(results);
}

export interface RectSlice {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function sliceRectangles(
  sourceImg: HTMLImageElement | HTMLCanvasElement,
  layerX: number,
  layerY: number,
  layerW: number,
  layerH: number,
  baseName: string,
  rects: RectSlice[]
): Promise<SliceResult[]> {
  const scaleX = sourceImg.width / layerW;
  const scaleY = sourceImg.height / layerH;

  const promises = rects.map((rect, idx) => {
    const sx = (rect.x - layerX) * scaleX;
    const sy = (rect.y - layerY) * scaleY;
    const sw = Math.max(1, rect.w * scaleX);
    const sh = Math.max(1, rect.h * scaleY);

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(sourceImg, sx, sy, sw, sh, 0, 0, sw, sh);
    }

    return new Promise<SliceResult>((resolve) => {
      const outImg = new Image();
      outImg.onload = () => {
        resolve({
          img: outImg,
          name: `${baseName} (Slice ${idx + 1})`,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: Math.round(rect.w),
          h: Math.round(rect.h),
        });
      };
      outImg.src = canvas.toDataURL('image/png');
    });
  });

  return Promise.all(promises);
}
