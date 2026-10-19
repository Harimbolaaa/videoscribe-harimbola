import React from 'react';

interface BottomBarProps {
  hand: string;
  onSelectHand: (hand: string) => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  handSpeed: number;
  onChangeHandSpeed: (handSpeed: number) => void;
  ratio: '16:9' | '9:16' | '1:1';
  onSelectRatio: (ratio: '16:9' | '9:16' | '1:1') => void;
  res: '720' | '1080' | '1440';
  onSelectRes: (res: '720' | '1080' | '1440') => void;
  canvasW: number;
  canvasH: number;
}

const HAND_OPTIONS = [
  { id: 'custom1', label: 'Hand 1' },
  { id: 'custom2', label: 'Hand 2' },
  { id: 'custom3', label: 'Hand 3' },
  { id: 'custom4', label: 'Hand 4' },
  { id: 'custom5', label: 'Cartoon' },
  { id: 'custom6', label: 'Pixel Art' },
  { id: 'ghost', label: 'Ghost (None)' },
];

export const BottomBar: React.FC<BottomBarProps> = ({
  hand,
  onSelectHand,
  speed,
  onChangeSpeed,
  handSpeed,
  onChangeHandSpeed,
  ratio,
  onSelectRatio,
  res,
  onSelectRes,
  canvasW,
  canvasH,
}) => {
  return (
    <div className="h-[96px] min-h-[96px] bg-white border-t border-[var(--border)] flex items-stretch px-4 z-40 shrink-0 select-none text-xs">
      {/* SECTION 1: HAND STYLE */}
      <div className="flex-1 flex flex-col justify-center pr-4 border-r border-[var(--border)]">
        <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          <span>Hand Style</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {HAND_OPTIONS.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => onSelectHand(h.id)}
              className={`py-1 px-1.5 rounded-md border text-[10px] truncate text-center cursor-pointer transition ${
                hand === h.id
                  ? 'border-[var(--accent)] bg-[var(--accent-lo)] font-semibold text-[var(--text)]'
                  : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-hi)] text-[var(--muted-hi)]'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: SPEED SLIDERS */}
      <div className="flex-1 flex flex-col justify-center px-4 border-r border-[var(--border)] space-y-2">
        <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          <span>Animation Speed</span>
        </div>

        {/* Reveal speed */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--muted-hi)] w-20">Reveal Speed</span>
          <input
            id="speed-slider"
            type="range"
            min="1"
            max="100"
            value={speed}
            onChange={(e) => onChangeSpeed(Number(e.target.value))}
            className="flex-1"
          />
          <span id="speed-val" className="text-[10px] font-semibold text-[var(--text)] tabular-nums w-6 text-right">
            {speed}
          </span>
        </div>

        {/* Hand speed */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--muted-hi)] w-20">Hand Speed</span>
          <input
            id="hand-speed-slider"
            type="range"
            min="1"
            max="20"
            value={handSpeed}
            onChange={(e) => onChangeHandSpeed(Number(e.target.value))}
            className="flex-1"
          />
          <span id="hand-speed-val" className="text-[10px] font-semibold text-[var(--text)] tabular-nums w-6 text-right">
            {handSpeed}
          </span>
        </div>
      </div>

      {/* SECTION 3: CANVAS SIZE & RATIO */}
      <div className="flex-1 flex flex-col justify-center pl-4 space-y-1.5">
        <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          <span>Aspect Ratio & Resolution</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Ratio */}
          <div className="flex gap-1 bg-[var(--panel)] p-0.5 rounded-lg border border-[var(--border)]">
            {(['16:9', '9:16', '1:1'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onSelectRatio(r)}
                className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition ${
                  ratio === r ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--muted-hi)] hover:text-[var(--text)]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Resolution */}
          <div className="flex gap-1 bg-[var(--panel)] p-0.5 rounded-lg border border-[var(--border)]">
            {(['720', '1080', '1440'] as const).map((rs) => (
              <button
                key={rs}
                type="button"
                onClick={() => onSelectRes(rs)}
                className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition ${
                  res === rs ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--muted-hi)] hover:text-[var(--text)]'
                }`}
              >
                {rs}p
              </button>
            ))}
          </div>

          <span className="text-[10px] text-[var(--muted)] font-medium tabular-nums ml-auto">
            {canvasW} × {canvasH}
          </span>
        </div>
      </div>
    </div>
  );
};
