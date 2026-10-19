import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';
import { Layer } from '../types';

interface CanvasAreaProps {
  canvasW: number;
  canvasH: number;
  mainCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  handCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  selectCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  selectedLayer: Layer | null;
  onSelectLayer: (id: number | null) => void;
  onUpdateLayer: (id: number, updates: Partial<Layer>) => void;
  isPlaying: boolean;
  isDone: boolean;
  progress: number;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  isPlacingText: boolean;
  onPlaceTextAt: (x: number, y: number) => void;
  animStyle: string;
  playbackMode?: 'single' | 'all';
  sceneLabel?: string;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  canvasW,
  canvasH,
  mainCanvasRef,
  handCanvasRef,
  selectCanvasRef,
  selectedLayer,
  onSelectLayer,
  onUpdateLayer,
  isPlaying,
  isDone,
  progress,
  onPlay,
  onPause,
  onRestart,
  isPlacingText,
  onPlaceTextAt,
  animStyle,
  playbackMode = 'single',
  sceneLabel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const interactRef = useRef<{
    type: 'move' | 'resize';
    handle?: string;
    startX: number;
    startY: number;
    orig: { x: number; y: number; w: number; h: number };
  } | null>(null);

  // Resize canvas display dynamically to fit viewport
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const cw = containerRef.current.clientWidth - 48;
      const ch = containerRef.current.clientHeight - 80;
      if (cw <= 0 || ch <= 0) return;

      const s = Math.min(cw / canvasW, ch / canvasH, 1);
      setScale(s);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [canvasW, canvasH]);

  const toCanvasCoords = (e: React.MouseEvent) => {
    if (!selectCanvasRef.current) return { x: 0, y: 0 };
    const rect = selectCanvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const x = Math.round((clientX / rect.width) * canvasW);
    const y = Math.round((clientY / rect.height) * canvasH);
    return { x, y };
  };

  const hitTestHandle = (px: number, py: number, l: Layer): string | null => {
    const handleDist = 12;
    const handles: Record<string, { x: number; y: number }> = {
      nw: { x: l.x, y: l.y },
      n: { x: l.x + l.w / 2, y: l.y },
      ne: { x: l.x + l.w, y: l.y },
      e: { x: l.x + l.w, y: l.y + l.h / 2 },
      se: { x: l.x + l.w, y: l.y + l.h },
      s: { x: l.x + l.w / 2, y: l.y + l.h },
      sw: { x: l.x, y: l.y + l.h },
      w: { x: l.x, y: l.y + l.h / 2 },
    };

    for (const [key, pt] of Object.entries(handles)) {
      if (Math.abs(px - pt.x) <= handleDist && Math.abs(py - pt.y) <= handleDist) {
        return key;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPlaying) return;
    const { x, y } = toCanvasCoords(e);

    if (isPlacingText) {
      onPlaceTextAt(x, y);
      return;
    }

    if (selectedLayer) {
      const handle = hitTestHandle(x, y, selectedLayer);
      if (handle) {
        interactRef.current = {
          type: 'resize',
          handle,
          startX: x,
          startY: y,
          orig: { ...selectedLayer },
        };
        return;
      }

      if (
        x >= selectedLayer.x &&
        x <= selectedLayer.x + selectedLayer.w &&
        y >= selectedLayer.y &&
        y <= selectedLayer.y + selectedLayer.h
      ) {
        interactRef.current = {
          type: 'move',
          startX: x,
          startY: y,
          orig: { ...selectedLayer },
        };
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPlaying || !selectCanvasRef.current) return;
    const { x, y } = toCanvasCoords(e);

    if (!interactRef.current) {
      if (selectedLayer) {
        const handle = hitTestHandle(x, y, selectedLayer);
        if (handle) {
          selectCanvasRef.current.style.cursor = 'nwse-resize';
        } else if (
          x >= selectedLayer.x &&
          x <= selectedLayer.x + selectedLayer.w &&
          y >= selectedLayer.y &&
          y <= selectedLayer.y + selectedLayer.h
        ) {
          selectCanvasRef.current.style.cursor = 'move';
        } else {
          selectCanvasRef.current.style.cursor = isPlacingText ? 'crosshair' : 'default';
        }
      }
      return;
    }

    if (!selectedLayer) return;
    const { type, handle, startX, startY, orig } = interactRef.current;
    const dx = x - startX;
    const dy = y - startY;

    if (type === 'move') {
      onUpdateLayer(selectedLayer.id, {
        x: Math.round(orig.x + dx),
        y: Math.round(orig.y + dy),
      });
    } else if (type === 'resize' && handle) {
      let nx = orig.x;
      let ny = orig.y;
      let nw = orig.w;
      let nh = orig.h;

      if (handle.includes('e')) nw = Math.max(20, orig.w + dx);
      if (handle.includes('s')) nh = Math.max(20, orig.h + dy);
      if (handle.includes('w')) {
        nx = orig.x + dx;
        nw = Math.max(20, orig.w - dx);
      }
      if (handle.includes('n')) {
        ny = orig.y + dy;
        nh = Math.max(20, orig.h - dy);
      }

      if (e.shiftKey) {
        const ar = orig.w / orig.h;
        if (nw / nh > ar) nh = nw / ar;
        else nw = nh * ar;
      }

      onUpdateLayer(selectedLayer.id, {
        x: Math.round(nx),
        y: Math.round(ny),
        w: Math.round(nw),
        h: Math.round(nh),
      });
    }
  };

  const handleMouseUp = () => {
    interactRef.current = null;
  };

  return (
    <main
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center relative p-6 overflow-hidden bg-[var(--bg)] select-none"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Canvas Wrapper */}
      <div
        ref={wrapperRef}
        style={{
          width: `${canvasW * scale}px`,
          height: `${canvasH * scale}px`,
        }}
        className="relative rounded-md shadow-2xl bg-white overflow-hidden transition-all duration-75"
      >
        {/* Main Drawing Canvas */}
        <canvas
          ref={mainCanvasRef}
          width={canvasW}
          height={canvasH}
          className="absolute inset-0 w-full h-full block"
        />

        {/* Hand Canvas */}
        <canvas
          ref={handCanvasRef}
          width={canvasW}
          height={canvasH}
          className="absolute inset-0 w-full h-full pointer-events-none block"
        />

        {/* Interactive Selection Canvas */}
        <canvas
          ref={selectCanvasRef}
          width={canvasW}
          height={canvasH}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="absolute inset-0 w-full h-full block"
        />

        {/* Style Badge bottom left */}
        <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 bg-white/90 backdrop-blur-md border border-[var(--border-hi)] rounded-full text-[10px] text-[var(--muted-hi)] font-medium pointer-events-none shadow-xs capitalize">
          {animStyle.replace('spec-', '').replace('outline', 'outline ')}
        </div>

        {/* Done Badge top right */}
        {isDone && (
          <div className="absolute top-2.5 right-2.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-[11px] font-bold flex items-center gap-1 shadow-md animate-pulse">
            <Check className="w-3.5 h-3.5" />
            <span>Done</span>
          </div>
        )}
      </div>

      {/* Floating Playbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-[var(--border-hi)] rounded-full px-4 py-2 flex items-center gap-3.5 min-w-[340px] shadow-lg z-30">
        {playbackMode === 'all' && sceneLabel && (
          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-700 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0">
            {sceneLabel}
          </span>
        )}

        <button
          type="button"
          onClick={onRestart}
          className="w-7 h-7 rounded-full border border-[var(--border-hi)] hover:border-[var(--accent)] hover:bg-[var(--accent-lo)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--accent)] transition cursor-pointer"
          title="Restart animation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          className="w-9 h-9 rounded-full bg-[var(--accent)] hover:bg-neutral-800 text-white flex items-center justify-center shadow-md transition transform active:scale-95 cursor-pointer"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white ml-0.5" />
          )}
        </button>

        {/* Progress track */}
        <div
          className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden cursor-pointer relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickRatio = (e.clientX - rect.left) / rect.width;
            if (window.setProgress) window.setProgress(clickRatio);
          }}
        >
          <div
            style={{ width: `${Math.round(progress * 100)}%` }}
            className="h-full bg-[var(--accent)] transition-all duration-75"
          />
        </div>

        {/* Percentage display */}
        <span className="text-[11px] font-semibold text-[var(--muted-hi)] tabular-nums min-w-[32px] text-right">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </main>
  );
};
