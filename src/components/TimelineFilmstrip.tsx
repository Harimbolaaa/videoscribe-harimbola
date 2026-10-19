import React, { useState } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Film,
  Layers as LayersIcon,
  Eraser,
  Scissors,
  Sparkles,
  Clock,
  Play,
} from 'lucide-react';
import { Scene, SceneTransition } from '../types';

interface TimelineFilmstripProps {
  scenes: Scene[];
  activeSceneId: string;
  onSelectScene: (id: string) => void;
  onAddScene: () => void;
  onDuplicateScene: (id: string) => void;
  onDeleteScene: (id: string) => void;
  onMoveScene: (index: number, direction: 'left' | 'right') => void;
  onUpdateScene: (id: string, updates: Partial<Scene>) => void;
  playbackMode: 'single' | 'all';
  onTogglePlaybackMode: (mode: 'single' | 'all') => void;
  isPlayingAll: boolean;
  currentPlayingSceneIndex?: number;
}

export const TimelineFilmstrip: React.FC<TimelineFilmstripProps> = ({
  scenes,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onDuplicateScene,
  onDeleteScene,
  onMoveScene,
  onUpdateScene,
  playbackMode,
  onTogglePlaybackMode,
  isPlayingAll,
  currentPlayingSceneIndex,
}) => {
  const [editingTransitionSceneId, setEditingTransitionSceneId] = useState<string | null>(null);

  const getTransitionIcon = (type: SceneTransition['type']) => {
    switch (type) {
      case 'erase':
        return <Eraser className="w-3 h-3 text-amber-600" />;
      case 'crossfade':
        return <Sparkles className="w-3 h-3 text-indigo-600" />;
      default:
        return <Scissors className="w-3 h-3 text-neutral-600" />;
    }
  };

  return (
    <div className="bg-white border-t border-[var(--border)] px-3 py-2 flex flex-col gap-1.5 select-none shrink-0 z-30 shadow-xs">
      {/* Filmstrip Header */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-[11px] text-[var(--text)]">
            <Film className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Timeline Storyboard</span>
            <span className="text-[9.5px] font-bold text-[var(--muted-hi)] bg-[var(--surface-2)] px-1.5 py-0.2 rounded-full">
              {scenes.length} {scenes.length === 1 ? 'Scene' : 'Scenes'}
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-[var(--border)] mx-1" />

          {/* Playback Mode Switch */}
          <div className="flex bg-[var(--panel)] p-0.5 rounded-lg border border-[var(--border)] text-[10px]">
            <button
              type="button"
              onClick={() => onTogglePlaybackMode('single')}
              className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                playbackMode === 'single'
                  ? 'bg-white text-[var(--text)] shadow-xs font-semibold'
                  : 'text-[var(--muted-hi)] hover:text-[var(--text)]'
              }`}
            >
              Current Scene
            </button>
            <button
              type="button"
              onClick={() => onTogglePlaybackMode('all')}
              className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${
                playbackMode === 'all'
                  ? 'bg-[var(--accent)] text-white shadow-xs font-semibold'
                  : 'text-[var(--muted-hi)] hover:text-[var(--text)]'
              }`}
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>Play All Montage</span>
            </button>
          </div>
        </div>

        {/* Add Scene Button */}
        <button
          type="button"
          onClick={onAddScene}
          className="flex items-center gap-1 px-2.5 py-1 bg-[var(--panel)] hover:bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border-hi)] rounded-lg text-[10.5px] font-semibold transition cursor-pointer hover:border-[var(--accent)]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Scene</span>
        </button>
      </div>

      {/* Horizontal Filmstrip Cards */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 px-1 scrollbar-thin">
        {scenes.map((scene, idx) => {
          const isActive = scene.id === activeSceneId;
          const isPlayingThis = isPlayingAll && currentPlayingSceneIndex === idx;

          return (
            <React.Fragment key={scene.id}>
              {/* Scene Card */}
              <div
                onClick={() => onSelectScene(scene.id)}
                className={`w-[160px] min-w-[160px] rounded-xl border flex flex-col p-1.5 transition cursor-pointer relative group ${
                  isPlayingThis
                    ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500 shadow-md'
                    : isActive
                    ? 'border-[var(--accent)] bg-[var(--accent-lo)] ring-1 ring-[var(--accent)] shadow-sm'
                    : 'border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--border-hi)] hover:bg-white'
                }`}
              >
                {/* Scene Header */}
                <div className="flex items-center justify-between text-[10px] mb-1 px-0.5">
                  <div className="flex items-center gap-1 truncate font-semibold text-[var(--text)]">
                    <span className="text-[9px] text-[var(--muted)]">#{idx + 1}</span>
                    <input
                      type="text"
                      value={scene.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdateScene(scene.id, { name: e.target.value })}
                      className="bg-transparent border-none outline-none font-medium text-[10px] text-[var(--text)] w-[85px] truncate"
                    />
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveScene(idx, 'left');
                      }}
                      className="p-0.5 hover:bg-neutral-200 rounded disabled:opacity-20 cursor-pointer"
                      title="Move left"
                    >
                      <ChevronLeft className="w-3 h-3 text-[var(--muted-hi)]" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === scenes.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveScene(idx, 'right');
                      }}
                      className="p-0.5 hover:bg-neutral-200 rounded disabled:opacity-20 cursor-pointer"
                      title="Move right"
                    >
                      <ChevronRight className="w-3 h-3 text-[var(--muted-hi)]" />
                    </button>
                  </div>
                </div>

                {/* Thumbnail Canvas Preview */}
                <div className="w-full h-[64px] bg-white rounded-lg border border-[var(--border)] overflow-hidden flex items-center justify-center relative shadow-xs">
                  {scene.thumbnailDataURL ? (
                    <img
                      src={scene.thumbnailDataURL}
                      alt={scene.name}
                      className="w-full h-full object-contain"
                    />
                  ) : scene.layers.length > 0 ? (
                    <div className="flex items-center justify-center gap-1 text-[9.5px] text-[var(--muted)]">
                      <LayersIcon className="w-3 h-3" />
                      <span>{scene.layers.length} layers</span>
                    </div>
                  ) : (
                    <span className="text-[9.5px] text-[var(--muted)] italic">Blank Canvas</span>
                  )}

                  {/* Playing pill */}
                  {isPlayingThis && (
                    <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-500 text-white rounded text-[8px] font-bold animate-pulse">
                      PLAYING
                    </div>
                  )}
                </div>

                {/* Footer info & card actions */}
                <div className="flex items-center justify-between text-[9px] text-[var(--muted)] mt-1 px-0.5">
                  <div className="flex items-center gap-1">
                    <LayersIcon className="w-2.5 h-2.5" />
                    <span>{scene.layers.length}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateScene(scene.id);
                      }}
                      className="p-1 hover:text-[var(--accent)] hover:bg-neutral-100 rounded cursor-pointer"
                      title="Duplicate scene"
                    >
                      <Copy className="w-2.5 h-2.5" />
                    </button>
                    {scenes.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete scene "${scene.name}"?`)) {
                            onDeleteScene(scene.id);
                          }
                        }}
                        className="p-1 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer"
                        title="Delete scene"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Inter-Scene Transition Connector */}
              {idx < scenes.length - 1 && (
                <div className="flex flex-col items-center justify-center shrink-0 px-0.5 relative">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingTransitionSceneId(
                        editingTransitionSceneId === scene.id ? null : scene.id
                      )
                    }
                    className="p-1.5 bg-[var(--panel)] hover:bg-[var(--surface-2)] border border-[var(--border-hi)] hover:border-[var(--accent)] rounded-lg text-[9.5px] flex items-center gap-1 cursor-pointer transition shadow-xs"
                    title="Click to edit transition"
                  >
                    {getTransitionIcon(scene.transition?.type || 'erase')}
                    <span className="font-semibold capitalize text-[9px] text-[var(--text)]">
                      {scene.transition?.type === 'erase'
                        ? 'Erase'
                        : scene.transition?.type === 'crossfade'
                        ? 'Dissolve'
                        : 'Cut'}
                    </span>
                    <span className="text-[8.5px] text-[var(--muted)] font-mono tabular-nums">
                      {scene.transition?.pauseSec ?? 1}s
                    </span>
                  </button>

                  {/* Transition Config Popover */}
                  {editingTransitionSceneId === scene.id && (
                    <div className="absolute top-10 z-40 bg-white border border-[var(--border-hi)] rounded-xl p-3 shadow-xl w-[210px] space-y-2.5 text-xs animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
                        <span className="font-semibold text-[11px] text-[var(--text)]">Scene Transition</span>
                        <button
                          type="button"
                          onClick={() => setEditingTransitionSceneId(null)}
                          className="text-[var(--muted)] hover:text-[var(--text)] text-[11px]"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Transition type selection */}
                      <div className="space-y-1">
                        <div className="text-[9.5px] text-[var(--muted-hi)] font-medium">Effect</div>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { id: 'erase', label: 'Erase' },
                            { id: 'cut', label: 'Cut' },
                            { id: 'crossfade', label: 'Fade' },
                          ].map((tr) => (
                            <button
                              key={tr.id}
                              type="button"
                              onClick={() => {
                                onUpdateScene(scene.id, {
                                  transition: {
                                    ...(scene.transition || { durationSec: 1, pauseSec: 1 }),
                                    type: tr.id as any,
                                  },
                                });
                              }}
                              className={`py-1 text-center rounded border text-[9.5px] font-medium cursor-pointer ${
                                (scene.transition?.type || 'erase') === tr.id
                                  ? 'border-[var(--accent)] bg-[var(--accent-lo)] font-bold text-[var(--accent)]'
                                  : 'border-[var(--border)] bg-[var(--panel)]'
                              }`}
                            >
                              {tr.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Pause Duration */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9.5px] text-[var(--muted-hi)]">
                          <span>Hold / Pause Before Next</span>
                          <span className="font-semibold text-[var(--text)] tabular-nums">
                            {scene.transition?.pauseSec ?? 1}s
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="4"
                          step="0.5"
                          value={scene.transition?.pauseSec ?? 1}
                          onChange={(e) => {
                            onUpdateScene(scene.id, {
                              transition: {
                                ...(scene.transition || { durationSec: 1, type: 'erase' }),
                                pauseSec: Number(e.target.value),
                              },
                            });
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
