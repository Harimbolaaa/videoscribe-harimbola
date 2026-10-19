import React, { useRef, useState, useEffect } from 'react';
import { X, Scissors, Grid, Square } from 'lucide-react';
import { Layer } from '../types';
import { sliceGrid, sliceRectangles, RectSlice } from '../engine/slicer';

interface SlicerModalProps {
  isOpen: boolean;
  onClose: () => void;
  layer: Layer | null;
  onApplySlices: (newLayers: Array<{ img: HTMLImageElement; name: string; x: number; y: number; w: number; h: number }>) => void;
}

export const SlicerModal: React.FC<SlicerModalProps> = ({
  isOpen,
  onClose,
  layer,
  onApplySlices,
}) => {
  const [mode, setMode] = useState<'grid' | 'rect'>('grid');
  const [cols, setCols] = useState(2);
  const [rows, setRows] = useState(2);
  const [rects, setRects] = useState<RectSlice[]>([]);
  const [drawingRect, setDrawingRect] = useState<{ startX: number; startY: number; currX: number; currY: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen || !layer || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = layer.w;
    canvas.height = layer.h;

    // Draw base layer image
    ctx.drawImage(layer.img, 0, 0, layer.w, layer.h);

    // Overlay grid or rects
    if (mode === 'grid') {
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      const cellW = layer.w / cols;
      const cellH = layer.h / rows;

      for (let c = 1; c < cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellW, 0);
        ctx.lineTo(c * cellW, layer.h);
        ctx.stroke();
      }

      for (let r = 1; r < rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellH);
        ctx.lineTo(layer.w, r * cellH);
        ctx.stroke();
      }
    } else {
      // Draw created rects
      ctx.strokeStyle = '#16a34a';
      ctx.fillStyle = 'rgba(22, 163, 74, 0.15)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);

      rects.forEach((r, i) => {
        const lx = r.x - layer.x;
        const ly = r.y - layer.y;
        ctx.fillRect(lx, ly, r.w, r.h);
        ctx.strokeRect(lx, ly, r.w, r.h);
        ctx.fillStyle = '#16a34a';
        ctx.font = '10px sans-serif';
        ctx.fillText(`Slice ${i + 1}`, lx + 4, ly + 14);
        ctx.fillStyle = 'rgba(22, 163, 74, 0.15)';
      });

      // Active drawing rect
      if (drawingRect) {
        const rx = Math.min(drawingRect.startX, drawingRect.currX);
        const ry = Math.min(drawingRect.startY, drawingRect.currY);
        const rw = Math.abs(drawingRect.currX - drawingRect.startX);
        const rh = Math.abs(drawingRect.currY - drawingRect.startY);

        ctx.strokeStyle = '#dc2626';
        ctx.fillStyle = 'rgba(220, 38, 38, 0.15)';
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
      }
    }
  }, [isOpen, layer, mode, cols, rows, rects, drawingRect]);

  if (!isOpen || !layer) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'rect' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawingRect({ startX: x, startY: y, currX: x, currY: y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawingRect || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawingRect((prev) => (prev ? { ...prev, currX: x, currY: y } : null));
  };

  const handleMouseUp = () => {
    if (!drawingRect || !layer) return;
    const rx = Math.min(drawingRect.startX, drawingRect.currX);
    const ry = Math.min(drawingRect.startY, drawingRect.currY);
    const rw = Math.abs(drawingRect.currX - drawingRect.startX);
    const rh = Math.abs(drawingRect.currY - drawingRect.startY);

    if (rw > 10 && rh > 10) {
      setRects((prev) => [
        ...prev,
        {
          x: layer.x + rx,
          y: layer.y + ry,
          w: rw,
          h: rh,
        },
      ]);
    }
    setDrawingRect(null);
  };

  const handleApply = async () => {
    if (mode === 'grid') {
      const slices = await sliceGrid(layer.img, layer.x, layer.y, layer.w, layer.h, layer.name, cols, rows);
      onApplySlices(slices);
      onClose();
    } else {
      if (rects.length === 0) return;
      const slices = await sliceRectangles(layer.img, layer.x, layer.y, layer.w, layer.h, layer.name, rects);
      onApplySlices(slices);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-[720px] shadow-2xl border border-[var(--border-hi)] flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 px-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text)]">Image Slicer Tool — {layer.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] flex items-center justify-center text-[var(--muted-hi)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Controls */}
          <div className="w-[200px] shrink-0 space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--muted-hi)] uppercase tracking-wider">Mode</label>
              <div className="grid grid-cols-2 gap-1 bg-[var(--panel)] p-0.5 rounded-lg border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setMode('grid')}
                  className={`py-1.5 flex items-center justify-center gap-1 rounded font-medium cursor-pointer transition ${
                    mode === 'grid' ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--muted-hi)]'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('rect')}
                  className={`py-1.5 flex items-center justify-center gap-1 rounded font-medium cursor-pointer transition ${
                    mode === 'rect' ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--muted-hi)]'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Custom</span>
                </button>
              </div>
            </div>

            {mode === 'grid' ? (
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between items-center text-[10px] text-[var(--muted-hi)] mb-1">
                    <span>Columns</span>
                    <span className="font-semibold">{cols}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={cols}
                    onChange={(e) => setCols(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center text-[10px] text-[var(--muted-hi)] mb-1">
                    <span>Rows</span>
                    <span className="font-semibold">{rows}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={rows}
                    onChange={(e) => setRows(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="text-[10px] text-[var(--muted)] pt-1">
                  Total slices: <strong className="text-[var(--text)]">{cols * rows}</strong>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] text-[var(--muted)]">Click and drag rectangles on the image preview to define slice areas.</p>
                <div className="text-[10px] text-[var(--muted-hi)] font-medium">Slices defined: {rects.length}</div>
                {rects.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRects([])}
                    className="w-full py-1 text-center border border-[var(--border)] rounded text-[10px] hover:text-red-500 cursor-pointer"
                  >
                    Clear All Slices
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Canvas Preview */}
          <div className="flex-1 bg-neutral-100 rounded-xl border border-[var(--border)] p-3 flex items-center justify-center overflow-auto min-h-[300px]">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="max-w-full max-h-[360px] object-contain shadow-md rounded bg-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 px-5 border-t border-[var(--border)] flex justify-end gap-2 bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[var(--border-hi)] rounded-xl text-xs font-medium hover:bg-[var(--surface-2)] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 bg-[var(--accent)] hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer"
          >
            Apply Slices
          </button>
        </div>
      </div>
    </div>
  );
};
