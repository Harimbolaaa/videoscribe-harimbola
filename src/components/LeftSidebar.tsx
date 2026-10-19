import React, { useState } from 'react';
import { ChevronDown, Sparkles, Play, Sliders } from 'lucide-react';
import { Layer, Preset } from '../types';

interface LeftSidebarProps {
  selectedLayer: Layer | null;
  animStyle: string;
  onSelectAnimStyle: (style: string) => void;
  zigzag: boolean;
  onToggleZigzag: () => void;
  chunks: number;
  onChangeChunks: (val: number) => void;
  specChunks: number;
  onChangeSpecChunks: (val: number) => void;
  smoothGlide: boolean;
  onToggleSmoothGlide: () => void;
  outlineStroke: string;
  onSelectOutlineStroke: (stroke: string) => void;
  colorStyle: string;
  onSelectColorStyle: (style: string) => void;
  outlineDetect: number;
  onChangeOutlineDetect: (val: number) => void;
  outlineAlgorithm: string;
  onSelectOutlineAlgorithm: (alg: string) => void;
  imageReveal: boolean;
  onToggleImageReveal: () => void;
  revealStyle: string;
  onSelectRevealStyle: (style: string) => void;
  outlineOverlayVisible: boolean;
  onToggleOutlineOverlayVisible: () => void;
  outlineOverlayOpacity: number;
  onChangeOutlineOverlayOpacity: (val: number) => void;
  outlineOverlayThickness: number;
  onChangeOutlineOverlayThickness: (val: number) => void;
  outlineOverlayColor: string;
  onChangeOutlineOverlayColor: (col: string) => void;
  outlineOnlyColorRegion: boolean;
  onToggleOutlineOnlyColorRegion: () => void;
  outlineOnlyRealImage: boolean;
  onToggleOutlineOnlyRealImage: () => void;
  textAnimDir: string;
  onSelectTextAnimDir: (dir: string) => void;
  textDrawStyle: string;
  onSelectTextDrawStyle: (style: string) => void;
  onGenerate: () => void;
  activeSidebarTab: 'animation' | 'drawing';
  onSwitchSidebarTab: (tab: 'animation' | 'drawing') => void;
  presets: Preset[];
  onApplyPreset: (preset: Preset) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
}

const SPEC_INFO: Record<string, { title: string; desc: string }> = {
  'spec-human': { title: 'Human — Top-down anatomy', desc: 'Head first, then shoulders, torso, arms, and legs.' },
  'spec-animal': { title: 'Animal — Head to tail', desc: 'Starts at the left (head) and flows right toward the tail.' },
  'spec-portrait': { title: 'Portrait — Face inward', desc: 'Eyes and nose region first, spiralling outward.' },
  'spec-vehicle': { title: 'Vehicle — Front to rear', desc: 'Draws from the front across the body to the rear.' },
  'spec-building': { title: 'Building — Foundation up', desc: 'Starts at the base and rises floor by floor to the roof.' },
  'spec-landscape': { title: 'Landscape — Sky to ground', desc: 'Top horizon and sky drawn first, then midground.' },
  'spec-spiral': { title: 'Spiral — Centre outward', desc: 'Radiates from the visual centre in an outward spiral.' },
  'spec-text': { title: 'Text — Letter sequence', desc: 'Traces letter clusters in chosen direction.' },
};

const STROKE_HINTS: Record<string, string> = {
  default: 'Clean, uniform whiteboard marker line. Consistent thickness.',
  charcoal: 'Soft, thick, dusty strokes with gritty texture — like life drawing.',
  multipass: 'Exploratory sketch lines with faint overlapping passes.',
  fountain: 'Variable line weight — calligraphic quality, thin on fast curves.',
  blueprint: 'Crisp light-blue technical drafting lines.',
};

const DETECT_ALG_HINTS: Record<string, string> = {
  classic: 'Balanced edge pickup for dark outlines on light backgrounds.',
  adaptive: 'Analyzes small regions independently for local contrast (photos).',
  morph: 'Erodes shapes and uses border difference. Great for cartoons.',
  canny: 'Links edge fragments into continuous lines. Great for vector art.',
};

export const LeftSidebar: React.FC<LeftSidebarProps> = (props) => {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);

  const isOutlineMode = ['illustfill', 'outlinefill', 'outlineonly', 'spec-text'].includes(props.animStyle);

  return (
    <aside className="w-[268px] min-w-[268px] bg-white border-r border-[var(--border)] flex flex-col h-full overflow-y-auto overflow-x-hidden text-xs select-none">
      {/* Context banner */}
      {props.selectedLayer ? (
        <div className="mx-2.5 mt-2.5 p-2 bg-[var(--accent-lo)] border border-[rgba(26,26,26,0.15)] rounded-lg">
          <div className="text-[9px] font-semibold text-[var(--muted-hi)] tracking-wider uppercase">Editing Layer</div>
          <div className="text-[11px] font-medium text-[var(--text)] truncate">{props.selectedLayer.name}</div>
        </div>
      ) : (
        <div className="mx-2.5 mt-2.5 p-2 bg-neutral-50 border border-dashed border-[var(--border-hi)] rounded-lg text-center text-[10px] text-[var(--muted)]">
          Select a layer on the right to edit its animation settings.
        </div>
      )}

      {/* Presets Accordion */}
      <div className="mx-2.5 mt-2 border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface-1)]">
        <div
          onClick={() => setPresetsOpen(!presetsOpen)}
          className="flex items-center justify-between px-2.5 py-2 bg-neutral-100/60 cursor-pointer hover:bg-neutral-100 transition"
        >
          <div className="flex items-center gap-1.5 font-semibold text-[10px] text-[var(--muted-hi)] tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-[var(--accent)]" />
            <span>Settings Presets</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted)] transition-transform duration-200 ${presetsOpen ? 'rotate-180' : ''}`} />
        </div>

        {presetsOpen && (
          <div className="p-2 space-y-2 border-t border-[var(--border)] bg-white">
            <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider">Built-in</div>
            <div className="grid grid-cols-2 gap-1.5">
              {props.presets.filter((p) => p.builtIn).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => props.onApplyPreset(preset)}
                  className="p-1.5 text-left border border-[var(--border)] hover:border-[var(--accent)] rounded-md bg-[var(--panel)] hover:bg-[var(--accent-lo)] transition cursor-pointer"
                >
                  <div className="font-semibold text-[10px] text-[var(--text)]">{preset.name}</div>
                  <div className="text-[8.5px] text-[var(--muted)] truncate">{preset.desc}</div>
                </button>
              ))}
            </div>

            <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider pt-1">Custom</div>
            <div className="space-y-1">
              {props.presets.filter((p) => !p.builtIn).map((preset) => (
                <div key={preset.id} className="flex items-center justify-between p-1 px-2 border border-[var(--border)] rounded bg-[var(--panel)]">
                  <button
                    type="button"
                    onClick={() => props.onApplyPreset(preset)}
                    className="font-medium text-[10px] text-[var(--text)] hover:underline truncate cursor-pointer text-left flex-1"
                  >
                    {preset.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onDeletePreset(preset.id)}
                    className="text-[var(--muted)] hover:text-red-500 text-[10px] ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {showSavePresetInput ? (
              <div className="flex gap-1 pt-1">
                <input
                  type="text"
                  placeholder="Preset name..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="flex-1 px-2 py-1 text-[10px] border border-[var(--border-hi)] rounded bg-[var(--panel)] outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPresetName.trim()) {
                      props.onSavePreset(newPresetName.trim());
                      setNewPresetName('');
                      setShowSavePresetInput(false);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newPresetName.trim()) {
                      props.onSavePreset(newPresetName.trim());
                      setNewPresetName('');
                      setShowSavePresetInput(false);
                    }
                  }}
                  className="px-2 py-1 bg-[var(--accent)] text-white text-[10px] font-medium rounded cursor-pointer"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSavePresetInput(true)}
                className="w-full text-center py-1 text-[9.5px] text-[var(--accent)] hover:underline cursor-pointer pt-1"
              >
                + Save current settings
              </button>
            )}
          </div>
        )}
      </div>

      {/* Smooth Hand Movement toggle */}
      <div className="mx-2.5 my-2 px-2.5 py-2 border-y border-[var(--border)] flex items-center justify-between">
        <span className="text-[11px] font-medium text-[var(--text)]">Smooth hand movement</span>
        <button
          type="button"
          onClick={props.onToggleSmoothGlide}
          className={`w-9 h-5 rounded-full p-0.5 transition cursor-pointer ${
            props.smoothGlide ? 'bg-[var(--accent)]' : 'bg-[var(--surface-2)]'
          }`}
          title="Smooth hand movement between drawing points"
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform ${
              props.smoothGlide ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Tabs Switcher: Animation vs Drawing */}
      <div className="sticky top-0 bg-white z-20 px-2.5 pb-2 border-b border-[var(--border)]">
        <div className="flex bg-[var(--panel)] p-0.5 rounded-lg border border-[var(--border)]">
          <button
            type="button"
            onClick={() => props.onSwitchSidebarTab('animation')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-md font-medium text-xs transition cursor-pointer ${
              props.activeSidebarTab === 'animation'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--muted-hi)] hover:text-[var(--text)]'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Animation</span>
          </button>
          <button
            type="button"
            onClick={() => props.onSwitchSidebarTab('drawing')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-md font-medium text-xs transition cursor-pointer ${
              props.activeSidebarTab === 'drawing'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--muted-hi)] hover:text-[var(--text)]'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Drawing</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ANIMATION */}
      {props.activeSidebarTab === 'animation' && (
        <div className="p-2.5 space-y-3">
          <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider">Basic Styles</div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'chunkjump', label: 'Chunk Jump' },
              { id: 'scanner', label: 'Scanner' },
              { id: 'contour', label: 'Contour' },
              { id: 'outlinechunks', label: 'Outline Chunks' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => props.onSelectAnimStyle(st.id)}
                className={`p-2 text-center rounded-lg border text-[11px] font-medium transition cursor-pointer ${
                  props.animStyle === st.id
                    ? 'border-[var(--accent)] bg-[var(--accent-lo)] text-[var(--accent)] font-semibold shadow-xs'
                    : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-hi)] text-[var(--text)]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {props.animStyle === 'scanner' && (
            <div className="p-2 bg-[var(--panel)] border border-[var(--border)] rounded-lg flex items-center justify-between">
              <span className="text-[11px] text-[var(--text)]">Zigzag scan</span>
              <button
                type="button"
                onClick={props.onToggleZigzag}
                className={`w-8 h-4.5 rounded-full p-0.5 transition cursor-pointer ${
                  props.zigzag ? 'bg-[var(--accent)]' : 'bg-[var(--surface-2)]'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${props.zigzag ? 'translate-x-3.5' : 'translate-x-0'}`} />
              </button>
            </div>
          )}

          {['chunkjump', 'outlinechunks', 'scribble'].includes(props.animStyle) && (
            <div className="p-2.5 bg-[var(--panel)] border border-[var(--border)] rounded-lg space-y-1">
              <div className="flex justify-between items-center text-[10px] text-[var(--muted-hi)]">
                <span>Chunks (more = finer)</span>
                <span className="font-semibold text-[var(--text)] tabular-nums">{props.chunks}</span>
              </div>
              <input
                id="tile-slider"
                type="range"
                min="6"
                max="80"
                value={props.chunks}
                onChange={(e) => props.onChangeChunks(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider pt-2">Specialized Styles</div>
          <div className="text-[9px] text-[var(--muted)] leading-tight -mt-1">Subject-aware drawing order</div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'spec-human', label: 'Human' },
              { id: 'spec-animal', label: 'Animal' },
              { id: 'spec-portrait', label: 'Portrait' },
              { id: 'spec-vehicle', label: 'Vehicle' },
              { id: 'spec-building', label: 'Building' },
              { id: 'spec-landscape', label: 'Landscape' },
              { id: 'spec-spiral', label: 'Spiral' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => props.onSelectAnimStyle(st.id)}
                className={`p-1.5 text-center rounded-lg border text-[10px] font-medium transition cursor-pointer truncate ${
                  props.animStyle === st.id
                    ? 'border-[var(--accent)] bg-[var(--accent-lo)] text-[var(--accent)] font-semibold shadow-xs'
                    : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-hi)] text-[var(--text)]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {props.animStyle.startsWith('spec-') && (
            <div className="p-2.5 bg-[var(--panel)] border border-[var(--border)] rounded-lg space-y-1">
              <div className="flex justify-between items-center text-[10px] text-[var(--muted-hi)]">
                <span>Chunks</span>
                <span className="font-semibold text-[var(--text)] tabular-nums">{props.specChunks}</span>
              </div>
              <input
                id="spec-tile-slider"
                type="range"
                min="6"
                max="80"
                value={props.specChunks}
                onChange={(e) => props.onChangeSpecChunks(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {SPEC_INFO[props.animStyle] && (
            <div className="p-2.5 bg-[var(--accent-lo)] border border-[var(--border-hi)] rounded-lg space-y-0.5">
              <div className="font-semibold text-[10.5px] text-[var(--text)]">{SPEC_INFO[props.animStyle].title}</div>
              <div className="text-[9.5px] text-[var(--muted-hi)] leading-relaxed">{SPEC_INFO[props.animStyle].desc}</div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DRAWING */}
      {props.activeSidebarTab === 'drawing' && (
        <div className="p-2.5 space-y-3">
          <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider">Drawing Modes</div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'outlinefill', label: 'Outline Fill' },
              { id: 'illustfill', label: 'Illust Fill' },
              { id: 'outlineonly', label: 'Outline Only' },
              { id: 'spec-text', label: '✏ Text' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => props.onSelectAnimStyle(st.id)}
                className={`p-2 text-center rounded-lg border text-[11px] font-medium transition cursor-pointer ${
                  props.animStyle === st.id
                    ? 'border-[var(--accent)] bg-[var(--accent-lo)] text-[var(--accent)] font-semibold shadow-xs'
                    : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-hi)] text-[var(--text)]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Stroke Style */}
          <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider pt-1">Stroke Style</div>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'default', icon: '🖊', label: 'Default' },
              { id: 'charcoal', icon: '✏️', label: 'Charcoal' },
              { id: 'multipass', icon: '〰', label: 'Sketch' },
              { id: 'fountain', icon: '🪶', label: 'Fountain' },
              { id: 'blueprint', icon: '📐', label: 'Blueprint' },
            ].map((stk) => (
              <button
                key={stk.id}
                type="button"
                onClick={() => props.onSelectOutlineStroke(stk.id)}
                className={`p-1.5 flex flex-col items-center justify-center rounded-md border text-[9.5px] transition cursor-pointer ${
                  props.outlineStroke === stk.id
                    ? 'border-[var(--accent)] bg-[var(--accent-lo)] font-semibold'
                    : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-hi)]'
                }`}
              >
                <span>{stk.icon}</span>
                <span>{stk.label}</span>
              </button>
            ))}
          </div>
          <div className="text-[9px] text-[var(--muted)] p-1.5 bg-[var(--panel)] rounded border border-[var(--border)] leading-relaxed">
            {STROKE_HINTS[props.outlineStroke] || STROKE_HINTS.default}
          </div>

          {/* Coloring Style */}
          <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider pt-1">Coloring Style</div>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'sparse', label: 'Sparse' },
              { id: 'filled', label: 'Filled' },
              { id: 'watercolor', label: 'Watercolor' },
            ].map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => props.onSelectColorStyle(col.id)}
                className={`py-1 text-center rounded-md border text-[10px] transition cursor-pointer ${
                  props.colorStyle === col.id
                    ? 'border-[var(--accent)] bg-[var(--accent-lo)] font-semibold'
                    : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-hi)]'
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>

          {/* Detection Sensitivity */}
          <div className="p-2 bg-[var(--panel)] border border-[var(--border)] rounded-lg space-y-1">
            <div className="flex justify-between items-center text-[10px] text-[var(--muted-hi)]">
              <span>Detection Sensitivity</span>
              <span className="font-semibold text-[var(--text)] tabular-nums">{props.outlineDetect}</span>
            </div>
            <input
              id="outline-detect-slider"
              type="range"
              min="0"
              max="100"
              value={props.outlineDetect}
              onChange={(e) => props.onChangeOutlineDetect(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-[8.5px] text-[var(--muted)] flex justify-between">
              <span>Strict (0)</span>
              <span>Balanced (50)</span>
              <span>Fine (100)</span>
            </div>
          </div>

          {/* Detection Algorithm */}
          <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider pt-1">Detection Algorithm</div>
          <div className="grid grid-cols-2 gap-1">
            {[
              { id: 'classic', label: 'Classic' },
              { id: 'adaptive', label: 'Adaptive' },
              { id: 'morph', label: 'Morph Shell' },
              { id: 'canny', label: 'Canny+' },
            ].map((alg) => (
              <button
                key={alg.id}
                type="button"
                onClick={() => props.onSelectOutlineAlgorithm(alg.id)}
                className={`py-1 text-center rounded-md border text-[10px] transition cursor-pointer ${
                  props.outlineAlgorithm === alg.id
                    ? 'border-[var(--accent)] bg-[var(--accent-lo)] font-semibold'
                    : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-hi)]'
                }`}
              >
                {alg.label}
              </button>
            ))}
          </div>
          <div className="text-[9px] text-[var(--muted)] p-1.5 bg-[var(--panel)] rounded border border-[var(--border)] leading-relaxed">
            {DETECT_ALG_HINTS[props.outlineAlgorithm] || DETECT_ALG_HINTS.classic}
          </div>

          {/* Fill & Reveal Options */}
          {['outlinefill', 'illustfill'].includes(props.animStyle) && (
            <div className="p-2.5 bg-[var(--panel)] border border-[var(--border)] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-medium text-[var(--text)]">Reveal original image</span>
                <input
                  type="checkbox"
                  id="image-reveal"
                  checked={props.imageReveal}
                  onChange={props.onToggleImageReveal}
                  className="rounded cursor-pointer"
                />
              </div>

              {props.imageReveal && (
                <div className="space-y-1">
                  <div className="text-[9.5px] text-[var(--muted-hi)]">Reveal Animation:</div>
                  <select
                    value={props.revealStyle}
                    onChange={(e) => props.onSelectRevealStyle(e.target.value)}
                    className="w-full bg-white border border-[var(--border-hi)] rounded px-2 py-1 text-[10.5px] outline-none"
                  >
                    <option value="instant">Instant</option>
                    <option value="fade">Fade</option>
                    <option value="dissolve">Dissolve</option>
                    <option value="wipe">Wipe</option>
                    <option value="iris">Iris</option>
                    <option value="scanlines">Scanlines</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Text Draw Options */}
          {props.animStyle === 'spec-text' && (
            <div className="p-2.5 bg-[var(--panel)] border border-[var(--border)] rounded-lg space-y-2">
              <div className="text-[10px] font-semibold text-[var(--text)]">Text Draw Options</div>
              <div className="space-y-1">
                <div className="text-[9px] text-[var(--muted-hi)]">Direction:</div>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { id: 'ltr', label: 'Left → Right' },
                    { id: 'rtl', label: 'Right → Left' },
                    { id: 'ttb', label: 'Top → Bottom' },
                    { id: 'btt', label: 'Bottom → Top' },
                  ].map((dir) => (
                    <button
                      key={dir.id}
                      type="button"
                      onClick={() => props.onSelectTextAnimDir(dir.id)}
                      className={`py-1 text-center rounded border text-[9.5px] cursor-pointer ${
                        props.textAnimDir === dir.id ? 'border-[var(--accent)] bg-white font-semibold' : 'border-[var(--border)]'
                      }`}
                    >
                      {dir.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <div className="text-[9px] text-[var(--muted-hi)]">Fill Style:</div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'reveal', label: 'Reveal' },
                    { id: 'outline', label: 'Outline' },
                    { id: 'both', label: 'Both' },
                  ].map((fs) => (
                    <button
                      key={fs.id}
                      type="button"
                      onClick={() => props.onSelectTextDrawStyle(fs.id)}
                      className={`py-1 text-center rounded border text-[9.5px] cursor-pointer ${
                        props.textDrawStyle === fs.id ? 'border-[var(--accent)] bg-white font-semibold' : 'border-[var(--border)]'
                      }`}
                    >
                      {fs.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sticky Bottom Generate Button */}
      <div className="mt-auto sticky bottom-0 bg-white border-t border-[var(--border)] p-2.5 z-30">
        <button
          type="button"
          id="btn-generate"
          onClick={props.onGenerate}
          className="w-full py-2.5 px-4 bg-[var(--accent)] hover:bg-neutral-800 text-white font-semibold text-[13px] rounded-xl shadow-md transition transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Generate Animation</span>
        </button>
      </div>
    </aside>
  );
};
