import React, { useState } from 'react';
import { X, Video, Image as ImageIcon, Film, Layers as LayersIcon, Download } from 'lucide-react';
import { Scene } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartExport: (
    format: 'webm' | 'mp4',
    quality: 'high' | 'medium' | 'low',
    exportPNG: boolean,
    scope: 'all' | 'single',
    targetSceneId?: string
  ) => void;
  isRecording: boolean;
  progress: number;
  statusText: string;
  scenes?: Scene[];
  activeSceneId?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onStartExport,
  isRecording,
  progress,
  statusText,
  scenes = [],
  activeSceneId = '',
}) => {
  const [format, setFormat] = useState<'webm' | 'mp4'>('webm');
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [exportPNG, setExportPNG] = useState(false);
  const [scope, setScope] = useState<'all' | 'single'>(scenes.length > 1 ? 'all' : 'single');
  const [targetSceneId, setTargetSceneId] = useState<string>(activeSceneId || scenes[0]?.id || '');

  if (!isOpen) return null;

  const hasWebCodecs = typeof VideoEncoder !== 'undefined';
  const hasMultipleScenes = scenes.length > 1;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl border border-[var(--border-hi)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 px-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text)]">Export Video & Montage</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isRecording}
            className="w-7 h-7 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] flex items-center justify-center text-[var(--muted-hi)] disabled:opacity-30 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Multi-Scene Scope Selection */}
          {hasMultipleScenes && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--muted-hi)] uppercase tracking-wider flex items-center justify-between">
                <span>Export Scope</span>
                <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                  {scenes.length} Scenes in Storyboard
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() => setScope('all')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    scope === 'all'
                      ? 'border-[var(--accent)] bg-[var(--accent-lo)] ring-1 ring-[var(--accent)]'
                      : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-hi)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span className="font-semibold text-xs text-[var(--text)]">Full Montage (All)</span>
                  </div>
                  <div className="text-[9.5px] text-[var(--muted)] mt-1">
                    Export all {scenes.length} scenes in 1 continuous video with transitions
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() => setScope('single')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    scope === 'single'
                      ? 'border-[var(--accent)] bg-[var(--accent-lo)] ring-1 ring-[var(--accent)]'
                      : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-hi)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <LayersIcon className="w-3.5 h-3.5 text-neutral-600" />
                    <span className="font-semibold text-xs text-[var(--text)]">Individual Scene</span>
                  </div>
                  <div className="text-[9.5px] text-[var(--muted)] mt-1">
                    Export only a single selected scene clip
                  </div>
                </button>
              </div>

              {scope === 'single' && (
                <div className="mt-2 p-2 bg-[var(--surface-1)] border border-[var(--border)] rounded-xl flex items-center gap-2">
                  <span className="text-[10px] font-medium text-[var(--muted-hi)] whitespace-nowrap">Choose Scene:</span>
                  <select
                    value={targetSceneId || activeSceneId}
                    onChange={(e) => setTargetSceneId(e.target.value)}
                    disabled={isRecording}
                    className="w-full text-xs font-semibold bg-white border border-[var(--border)] rounded-lg px-2 py-1 outline-none cursor-pointer"
                  >
                    {scenes.map((s, idx) => (
                      <option key={s.id} value={s.id}>
                        Scene #{idx + 1} — {s.name} ({s.layers.length} layers)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Format selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--muted-hi)] uppercase tracking-wider">Video Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isRecording}
                onClick={() => setFormat('webm')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  format === 'webm'
                    ? 'border-[var(--accent)] bg-[var(--accent-lo)] ring-1 ring-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-hi)]'
                }`}
              >
                <div className="font-semibold text-xs text-[var(--text)]">WebM (Recommended)</div>
                <div className="text-[9.5px] text-[var(--muted)] mt-0.5">Fast, compatible with web & editing</div>
              </button>

              <button
                type="button"
                disabled={!hasWebCodecs || isRecording}
                onClick={() => setFormat('mp4')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer relative ${
                  format === 'mp4'
                    ? 'border-[var(--accent)] bg-[var(--accent-lo)] ring-1 ring-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-hi)]'
                } ${!hasWebCodecs ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="font-semibold text-xs text-[var(--text)]">MP4 (H.264)</div>
                <div className="text-[9.5px] text-[var(--muted)] mt-0.5">
                  {hasWebCodecs ? 'Direct universal MP4' : 'Unavailable in this browser'}
                </div>
              </button>
            </div>
          </div>

          {/* Quality selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--muted-hi)] uppercase tracking-wider">Quality Preset</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={isRecording}
                  onClick={() => setQuality(q)}
                  className={`py-2 text-center rounded-lg border text-xs font-medium capitalize transition cursor-pointer ${
                    quality === q
                      ? 'border-[var(--accent)] bg-[var(--accent-lo)] font-semibold text-[var(--text)]'
                      : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-hi)] text-[var(--muted-hi)]'
                  }`}
                >
                  {q} ({q === 'high' ? '8' : q === 'medium' ? '4' : '2'} Mbps)
                </button>
              ))}
            </div>
          </div>

          {/* Export PNG Checkbox */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--panel)] border border-[var(--border)]">
            <input
              type="checkbox"
              id="export-png-check"
              checked={exportPNG}
              disabled={isRecording}
              onChange={(e) => setExportPNG(e.target.checked)}
              className="rounded cursor-pointer"
            />
            <label htmlFor="export-png-check" className="text-xs font-medium text-[var(--text)] cursor-pointer flex-1">
              Also export final whiteboard frame as PNG image
            </label>
            <ImageIcon className="w-4 h-4 text-[var(--muted)]" />
          </div>

          {/* Individual Scene Clips Download Strip (Convenience Feature) */}
          {hasMultipleScenes && !isRecording && (
            <div className="pt-2 border-t border-[var(--border)]">
              <div className="text-[10px] font-bold text-[var(--muted-hi)] uppercase tracking-wider mb-2">
                Quick Download Individual Scene Clip:
              </div>
              <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                {scenes.map((s, idx) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border)] text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[9px] font-bold text-[var(--muted)]">#{idx + 1}</span>
                      <span className="font-semibold text-[var(--text)] truncate">{s.name}</span>
                      <span className="text-[9.5px] text-[var(--muted)]">({s.layers.length} layers)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onStartExport(format, quality, exportPNG, 'single', s.id)}
                      className="px-2 py-1 bg-white hover:bg-[var(--surface-2)] border border-[var(--border-hi)] rounded text-[10px] font-semibold text-[var(--text)] flex items-center gap-1 cursor-pointer transition"
                    >
                      <Download className="w-2.5 h-2.5" />
                      <span>Record</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recording Status / Progress Bar */}
          {isRecording ? (
            <div className="p-4 rounded-xl bg-neutral-100 border border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--text)]">
                <span>{statusText || 'Recording animation...'}</span>
                <span className="tabular-nums">{Math.round(progress * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.round(progress * 100)}%` }}
                  className="h-full bg-[var(--accent)] transition-all duration-150"
                />
              </div>
              <p className="text-[9.5px] text-[var(--muted)]">
                Please keep this browser window active while recording.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onStartExport(format, quality, exportPNG, scope, targetSceneId || activeSceneId)}
              className="w-full py-3 bg-[var(--accent)] hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-md transition transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              <Video className="w-4 h-4 fill-white" />
              <span>
                {scope === 'all'
                  ? `Start Recording Entire Montage (${scenes.length} Scenes)`
                  : 'Start Recording Selected Scene'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
