import React, { useState } from 'react';
import { Folder, Undo2, Redo2, Video, Edit2, Check } from 'lucide-react';

interface TopbarProps {
  projectName: string;
  onRenameProject: (name: string) => void;
  onOpenProjects: () => void;
  onOpenExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  canvasW: number;
  canvasH: number;
  animStyle: string;
  isWorking: boolean;
  isRecording: boolean;
  lastSavedTime: string | null;
}

export const Topbar: React.FC<TopbarProps> = ({
  projectName,
  onRenameProject,
  onOpenProjects,
  onOpenExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  undoCount,
  redoCount,
  canvasW,
  canvasH,
  animStyle,
  isWorking,
  isRecording,
  lastSavedTime,
}) => {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(projectName);

  const handleFinishRename = () => {
    setEditing(false);
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== projectName) {
      onRenameProject(trimmed);
    } else {
      setNameInput(projectName);
    }
  };

  return (
    <header className="h-[52px] min-h-[52px] bg-white border-b border-[var(--border)] flex items-center px-4 gap-3 z-50 shrink-0 select-none">
      {/* Logo */}
      <div className="flex items-center gap-2 pr-1">
        <div className="w-[30px] height-[30px] bg-[var(--surface-2)] border border-[var(--border-hi)] rounded-lg flex items-center justify-center p-1.5 shadow-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text)]">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </div>
        <span className="font-['Caveat'] text-[21px] font-bold text-[var(--text)] tracking-tight">Inkplainer</span>
      </div>

      <div className="w-[1px] h-[22px] bg-[var(--border-hi)] mx-1 shrink-0" />

      {/* Projects Button */}
      <button
        type="button"
        onClick={onOpenProjects}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent text-[var(--muted-hi)] hover:text-[var(--text)] border border-[var(--border-hi)] hover:border-[var(--accent)] hover:bg-[var(--surface-1)] rounded-lg text-xs font-medium transition cursor-pointer"
        title="Open saved projects"
      >
        <Folder className="w-3.5 h-3.5" />
        <span>Projects</span>
      </button>

      {/* Project Name Editor */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--panel)] border border-[var(--border)] hover:border-[var(--border-hi)] rounded-lg transition text-xs font-medium text-[var(--text)] max-w-[220px]">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishRename();
                if (e.key === 'Escape') {
                  setEditing(false);
                  setNameInput(projectName);
                }
              }}
              className="bg-transparent border-none outline-none text-xs w-[140px] text-[var(--text)]"
            />
            <button
              type="button"
              onClick={handleFinishRename}
              className="text-[var(--success)] hover:opacity-80 cursor-pointer"
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => {
              setNameInput(projectName);
              setEditing(true);
            }}
            className="flex items-center gap-1.5 cursor-pointer truncate"
            title="Click to rename"
          >
            <span className="truncate max-w-[140px]">{projectName}</span>
            <Edit2 className="w-2.5 h-2.5 text-[var(--muted)] opacity-60 hover:opacity-100" />
            <span
              className={`w-1.5 h-1.5 rounded-full ${lastSavedTime ? 'bg-emerald-500' : 'bg-amber-400'} shrink-0`}
              title={lastSavedTime ? `Saved: ${lastSavedTime}` : 'Saving...'}
            />
          </div>
        )}
      </div>

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="w-7 h-7 flex items-center justify-center border border-[var(--border-hi)] rounded-lg bg-transparent text-[var(--muted-hi)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] hover:border-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition relative"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
          {undoCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-[var(--accent)] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
              {undoCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="w-7 h-7 flex items-center justify-center border border-[var(--border-hi)] rounded-lg bg-transparent text-[var(--muted-hi)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] hover:border-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition relative"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-3.5 h-3.5" />
          {redoCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-[var(--accent)] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
              {redoCount}
            </span>
          )}
        </button>
      </div>

      {/* Dimension & Active Style Pills */}
      <div className="hidden md:flex items-center gap-2 ml-2">
        <span className="text-[11px] font-medium text-[var(--muted)] bg-[var(--panel)] border border-[var(--border)] rounded-full px-2.5 py-0.5 tabular-nums">
          {canvasW} × {canvasH}
        </span>
        <span className="text-[11px] font-medium text-[var(--muted-hi)] bg-[var(--panel)] border border-[var(--border)] rounded-full px-2.5 py-0.5 capitalize">
          {animStyle.replace('spec-', '').replace('outline', 'outline ')}
        </span>
      </div>

      {/* Working indicator */}
      {isWorking && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--accent-lo)] border border-[var(--accent-glo)] rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="text-[10.5px] font-medium text-[var(--muted-hi)]">Working…</span>
        </div>
      )}

      {/* Right Actions */}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenExport}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
            isRecording
              ? 'border-red-500 text-red-600 bg-red-50 animate-pulse'
              : 'border-[var(--border-hi)] text-[var(--muted-hi)] hover:border-[var(--accent2)] hover:text-[var(--accent2)] hover:bg-red-50/40'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>{isRecording ? 'Recording...' : 'Export Video'}</span>
        </button>
      </div>
    </header>
  );
};
