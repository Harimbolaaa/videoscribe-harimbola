import React from 'react';
import { X, Plus, Folder, Trash2 } from 'lucide-react';
import { Project } from '../types';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  currentProjectId: number | null;
  onSelectProject: (id: number) => void;
  onNewProject: () => void;
  onDeleteProject: (id: number) => void;
  storageEstimate: string;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  storageEstimate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-[560px] shadow-2xl border border-[var(--border-hi)] flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 px-5 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">My Projects</h2>
            <div className="text-[11px] text-[var(--muted)]">{storageEstimate} used</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] flex items-center justify-center text-[var(--muted-hi)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action: New Project */}
        <div className="p-3 px-5 border-b border-[var(--border)]">
          <button
            type="button"
            onClick={onNewProject}
            className="w-full py-2.5 px-4 bg-[var(--accent)] hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {projects.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--muted)]">
              No saved projects yet. Projects auto-save as you work!
            </div>
          ) : (
            projects.map((proj) => {
              const isCurrent = proj.id === currentProjectId;
              const formattedDate = new Date(proj.modifiedAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={proj.id}
                  onClick={() => proj.id && onSelectProject(proj.id)}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                    isCurrent
                      ? 'border-[var(--accent)] bg-[var(--accent-lo)] ring-1 ring-[var(--accent)]'
                      : 'border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--border-hi)] hover:bg-white'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0">
                    <Folder className="w-4 h-4 text-[var(--text)]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-[var(--text)] truncate">{proj.name}</div>
                    <div className="text-[10px] text-[var(--muted)]">
                      Modified {formattedDate} · {proj.state?.layers?.length || 0} layers
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (proj.id && confirm(`Delete project "${proj.name}"?`)) {
                        onDeleteProject(proj.id);
                      }
                    }}
                    className="w-7 h-7 rounded-lg border border-[var(--border)] hover:border-red-500 hover:bg-red-50 flex items-center justify-center text-[var(--muted)] hover:text-red-600 transition cursor-pointer"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
