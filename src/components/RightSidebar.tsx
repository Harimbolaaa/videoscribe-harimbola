import React, { useRef, useState } from 'react';
import {
  Upload,
  Type,
  Image as ImageIcon,
  Palette,
  Eye,
  EyeOff,
  Trash2,
  Scissors,
  GripVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  ChevronDown,
} from 'lucide-react';
import { Layer, BgSetting, TextProps } from '../types';
import { BG_PRESETS } from '../engine/backgrounds';

interface RightSidebarProps {
  layers: Layer[];
  selectedLayerId: number | null;
  onSelectLayer: (id: number) => void;
  onAddImageLayers: (files: FileList | File[]) => void;
  onAddTextLayer: (props: TextProps) => void;
  onUpdateLayer: (id: number, updates: Partial<Layer>) => void;
  onDeleteLayer: (id: number) => void;
  onReorderLayers: (startIndex: number, endIndex: number) => void;
  onOpenSlicer: () => void;
  isPlacingText: boolean;
  onTogglePlacingText: () => void;
  canvasBg: BgSetting;
  onChangeCanvasBg: (bg: BgSetting) => void;
}

const GOOGLE_FONTS = [
  { id: 'Caveat', name: 'Caveat', desc: 'Handwritten script' },
  { id: 'Patrick Hand', name: 'Patrick Hand', desc: 'Friendly marker' },
  { id: 'Permanent Marker', name: 'Permanent Marker', desc: 'Bold graffiti' },
  { id: 'DM Sans', name: 'DM Sans', desc: 'Clean modern sans' },
  { id: 'Geist', name: 'Geist', desc: 'Technical sans' },
  { id: 'Roboto', name: 'Roboto', desc: 'Classic neutral' },
  { id: 'Merriweather', name: 'Merriweather', desc: 'Readable serif' },
  { id: 'Space Mono', name: 'Space Mono', desc: 'Monospace' },
  { id: 'Nunito', name: 'Nunito', desc: 'Rounded sans' },
];

const SWATCH_COLORS = [
  '#111111', '#dc2626', '#2563eb', '#16a34a',
  '#ca8a04', '#9333ea', '#ea580c', '#ffffff'
];

export const RightSidebar: React.FC<RightSidebarProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onAddImageLayers,
  onAddTextLayer,
  onUpdateLayer,
  onDeleteLayer,
  onReorderLayers,
  onOpenSlicer,
  isPlacingText,
  onTogglePlacingText,
  canvasBg,
  onChangeCanvasBg,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'text' | 'bg'>('image');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text builder state
  const [textContent, setTextContent] = useState('Whiteboard Explainer');
  const [selectedFont, setSelectedFont] = useState('Caveat');
  const [fontSize, setFontSize] = useState(56);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [lineHeight, setLineHeight] = useState(1.2);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [textColor, setTextColor] = useState('#111111');

  // Layer drag state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Expanded layer settings accordion
  const [expandedLayerId, setExpandedLayerId] = useState<number | null>(null);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  const handleCreateTextLayer = () => {
    onAddTextLayer({
      text: textContent,
      font: selectedFont,
      size: fontSize,
      bold: isBold,
      italic: isItalic,
      align: textAlign,
      lineHeight,
      letterSpacing,
      color: textColor,
    });
  };

  return (
    <aside className="w-[300px] min-w-[300px] bg-white border-l border-[var(--border)] flex flex-col h-full overflow-hidden text-xs select-none">
      {/* Top Tabs */}
      <div className="p-2.5 pb-2 border-b border-[var(--border)] bg-white shrink-0">
        <div className="flex bg-[var(--panel)] p-0.5 rounded-lg border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1 rounded-md font-medium text-xs transition cursor-pointer ${
              activeTab === 'image'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--muted-hi)] hover:text-[var(--text)]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1 rounded-md font-medium text-xs transition cursor-pointer ${
              activeTab === 'text'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--muted-hi)] hover:text-[var(--text)]'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Text</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bg')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1 rounded-md font-medium text-xs transition cursor-pointer ${
              activeTab === 'bg'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--muted-hi)] hover:text-[var(--text)]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Canvas</span>
          </button>
        </div>
      </div>

      {/* Main Tab Panels (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {/* TAB: IMAGE */}
        {activeTab === 'image' && (
          <div className="space-y-2.5">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/png,image/jpeg,image/svg+xml,image/gif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onAddImageLayers(e.target.files);
                  e.target.value = '';
                }
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  onAddImageLayers(e.dataTransfer.files);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                dragOver
                  ? 'border-[var(--accent)] bg-[var(--accent-lo)]'
                  : 'border-[var(--border-hi)] hover:border-[var(--accent)] bg-neutral-50/50 hover:bg-neutral-50'
              }`}
            >
              <div className="w-9 h-9 mx-auto mb-2 rounded-lg bg-neutral-100 border border-[var(--border)] flex items-center justify-center">
                <Upload className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <div className="text-[12px] font-medium text-[var(--text)]">
                Drop images here or <span className="text-[var(--accent)] underline">browse</span>
              </div>
              <div className="text-[10px] text-[var(--muted)] mt-1">PNG, JPG, SVG, GIF</div>
            </div>

            {selectedLayer && selectedLayer.kind !== 'text' && (
              <button
                type="button"
                onClick={onOpenSlicer}
                className="w-full py-2 px-3 border border-[var(--border-hi)] hover:border-[var(--accent)] rounded-lg bg-[var(--panel)] hover:bg-[var(--accent-lo)] font-medium text-xs text-[var(--text)] flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Slice Selected Layer into Parts</span>
              </button>
            )}
          </div>
        )}

        {/* TAB: TEXT */}
        {activeTab === 'text' && (
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={onTogglePlacingText}
              className={`w-full py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                isPlacingText
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[var(--accent)] text-white hover:bg-neutral-800'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>{isPlacingText ? 'Click canvas to drop text!' : 'Place Text on Canvas'}</span>
            </button>

            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter text here..."
              rows={2}
              className="w-full p-2 text-xs border border-[var(--border-hi)] rounded-lg bg-[var(--panel)] outline-none focus:border-[var(--accent)] resize-y"
            />

            {/* Font Selector Cards */}
            <div className="space-y-1">
              <div className="text-[9.5px] font-semibold text-[var(--muted-hi)] uppercase tracking-wider">Font Family</div>
              <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1">
                {GOOGLE_FONTS.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFont(f.id)}
                    className={`p-1.5 px-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                      selectedFont === f.id
                        ? 'border-[var(--accent)] bg-[var(--accent-lo)]'
                        : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-hi)]'
                    }`}
                  >
                    <span style={{ fontFamily: f.id }} className="text-sm truncate">
                      {f.name}
                    </span>
                    <span className="text-[9px] text-[var(--muted)]">{f.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Style Tools */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsBold(!isBold)}
                className={`p-1.5 border rounded cursor-pointer ${isBold ? 'bg-[var(--accent)] text-white' : 'border-[var(--border-hi)] bg-[var(--panel)]'}`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsItalic(!isItalic)}
                className={`p-1.5 border rounded cursor-pointer ${isItalic ? 'bg-[var(--accent)] text-white' : 'border-[var(--border-hi)] bg-[var(--panel)]'}`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <div className="w-[1px] h-4 bg-[var(--border-hi)] mx-1" />
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => setTextAlign(align)}
                  className={`p-1.5 border rounded cursor-pointer ${textAlign === align ? 'bg-[var(--accent)] text-white' : 'border-[var(--border-hi)] bg-[var(--panel)]'}`}
                >
                  {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                  {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                  {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>

            {/* Size & Line Height */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-[var(--muted-hi)]">
                <span>Font Size</span>
                <span className="font-semibold text-[var(--text)] tabular-nums">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="14"
                max="200"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Color Swatches */}
            <div className="space-y-1">
              <div className="text-[9.5px] font-semibold text-[var(--muted-hi)] uppercase tracking-wider">Color</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {SWATCH_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setTextColor(col)}
                    style={{ backgroundColor: col }}
                    className={`w-5 h-5 rounded-full border border-black/10 cursor-pointer transition transform hover:scale-110 ${
                      textColor === col ? 'ring-2 ring-[var(--accent)] scale-110' : ''
                    }`}
                  />
                ))}
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-5 h-5 rounded-full border-none p-0 cursor-pointer"
                  title="Custom Color"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateTextLayer}
              className="w-full py-2 px-3 border border-[var(--border-hi)] hover:border-[var(--accent)] rounded-lg bg-[var(--panel)] hover:bg-[var(--surface-2)] font-semibold text-xs text-[var(--text)] transition cursor-pointer"
            >
              + Add Text Layer
            </button>
          </div>
        )}

        {/* TAB: BACKGROUND */}
        {activeTab === 'bg' && (
          <div className="space-y-3">
            <div>
              <div className="text-[9.5px] font-semibold text-[var(--muted-hi)] uppercase tracking-wider mb-1.5">Solid Color</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onChangeCanvasBg({ type: 'solid', val: 'white' })}
                  className={`px-2.5 py-1 rounded-full border text-[10.5px] font-medium cursor-pointer ${
                    canvasBg.type === 'solid' && (canvasBg.val === 'white' || canvasBg.val === '#ffffff')
                      ? 'border-[var(--accent)] bg-[var(--accent-lo)] font-bold'
                      : 'border-[var(--border-hi)] bg-[var(--panel)]'
                  }`}
                >
                  White
                </button>
                <button
                  type="button"
                  onClick={() => onChangeCanvasBg({ type: 'solid', val: '#111111' })}
                  className={`px-2.5 py-1 rounded-full border text-[10.5px] font-medium cursor-pointer ${
                    canvasBg.type === 'solid' && canvasBg.val === '#111111'
                      ? 'border-[var(--accent)] bg-[var(--accent-lo)] font-bold'
                      : 'border-[var(--border-hi)] bg-[var(--panel)]'
                  }`}
                >
                  Black
                </button>
                <button
                  type="button"
                  onClick={() => onChangeCanvasBg({ type: 'solid', val: 'transparent' })}
                  className={`px-2.5 py-1 rounded-full border text-[10.5px] font-medium cursor-pointer ${
                    canvasBg.type === 'solid' && canvasBg.val === 'transparent'
                      ? 'border-[var(--accent)] bg-[var(--accent-lo)] font-bold'
                      : 'border-[var(--border-hi)] bg-[var(--panel)]'
                  }`}
                >
                  Transparent
                </button>
                <div className="flex items-center gap-1 ml-auto">
                  <input
                    type="color"
                    value={canvasBg.type === 'solid' ? (canvasBg.val || '#ffffff') : '#ffffff'}
                    onChange={(e) => onChangeCanvasBg({ type: 'solid', val: e.target.value })}
                    className="w-6 h-6 rounded border-none p-0 cursor-pointer"
                    title="Custom Background Color"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="text-[9.5px] font-semibold text-[var(--muted-hi)] uppercase tracking-wider mb-1.5">Canvas Textures</div>
              <div className="grid grid-cols-2 gap-1.5">
                {BG_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      if (preset.id === 'white') {
                        onChangeCanvasBg({ type: 'solid', val: 'white' });
                      } else {
                        onChangeCanvasBg({ type: 'gradient', key: preset.id });
                      }
                    }}
                    className={`p-1.5 px-2 flex items-center gap-2 rounded-lg border text-left cursor-pointer transition ${
                      (canvasBg.type === 'gradient' && canvasBg.key === preset.id) ||
                      (preset.id === 'white' && canvasBg.type === 'solid' && (canvasBg.val === 'white' || canvasBg.val === '#ffffff'))
                        ? 'border-[var(--accent)] bg-[var(--accent-lo)] font-semibold shadow-xs'
                        : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-hi)]'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: preset.color }}
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-xs"
                    />
                    <span className="text-[10px] text-[var(--text)] truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Layer List (Bottom Half) */}
      <div className="border-t border-[var(--border)] flex flex-col h-[46%] min-h-[180px] bg-white">
        <div className="p-2 px-3 border-b border-[var(--border)] flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[11px] text-[var(--text)]">Layers</span>
            <span className="text-[10px] text-[var(--muted)] font-medium bg-[var(--surface-2)] px-1.5 py-0.2 rounded-full">
              {layers.length}
            </span>
          </div>
          <span className="text-[9px] text-[var(--muted)]">Drag to reorder</span>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
          {layers.length === 0 ? (
            <div className="py-8 text-center text-[10px] text-[var(--muted)] space-y-1">
              <div>No layers added yet</div>
              <div className="text-[9px]">Add images or text above</div>
            </div>
          ) : (
            layers.map((layer, idx) => {
              const isSelected = layer.id === selectedLayerId;
              const isExpanded = expandedLayerId === layer.id;

              return (
                <div
                  key={layer.id}
                  draggable
                  onDragStart={() => setDraggedIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedIdx !== null && draggedIdx !== idx) {
                      onReorderLayers(draggedIdx, idx);
                      setDraggedIdx(null);
                    }
                  }}
                  className={`border rounded-lg transition overflow-hidden ${
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--accent-lo)] shadow-xs'
                      : 'border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--border-hi)]'
                  }`}
                >
                  <div
                    onClick={() => onSelectLayer(layer.id)}
                    className="p-1.5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <GripVertical className="w-3 h-3 text-[var(--muted)] shrink-0 cursor-grab" />

                    {/* Thumbnail */}
                    <div className="w-7 h-7 rounded border border-[var(--border-hi)] alpha-pattern flex items-center justify-center overflow-hidden shrink-0 bg-white">
                      {layer.img && (
                        <img
                          src={'src' in layer.img ? (layer.img as HTMLImageElement).src : (layer.img as HTMLCanvasElement).toDataURL()}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={layer.name}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateLayer(layer.id, { name: e.target.value })}
                        className="w-full bg-transparent border-none text-[10.5px] font-medium text-[var(--text)] outline-none truncate"
                      />
                    </div>

                    {/* Animation Order Input */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[8.5px] text-[var(--muted)] uppercase font-semibold">Ord</span>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={layer.animOrder ?? ''}
                        placeholder="—"
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                          onUpdateLayer(layer.id, { animOrder: isNaN(val as any) ? null : val });
                        }}
                        className="w-7 text-center text-[10px] bg-white border border-[var(--border-hi)] rounded py-0.5 outline-none font-semibold tabular-nums"
                        title="Order of animation (same number = parallel)"
                      />
                    </div>

                    {/* Visibility Toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateLayer(layer.id, { visible: !layer.visible });
                      }}
                      className="p-1 text-[var(--muted-hi)] hover:text-[var(--text)] cursor-pointer"
                      title={layer.visible ? 'Hide layer' : 'Show layer'}
                    >
                      {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-red-500" />}
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLayer(layer.id);
                      }}
                      className="p-1 text-[var(--muted)] hover:text-red-500 cursor-pointer"
                      title="Delete layer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    {/* Expand settings */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedLayerId(isExpanded ? null : layer.id);
                      }}
                      className="p-1 text-[var(--muted)] cursor-pointer"
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Expanded Layer Controls */}
                  {isExpanded && (
                    <div className="p-2 border-t border-[var(--border)] bg-neutral-50/70 space-y-2 text-[10px]">
                      {/* Opacity */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--muted-hi)]">Opacity</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={layer.opacity ?? 1}
                          onChange={(e) => onUpdateLayer(layer.id, { opacity: Number(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="tabular-nums font-semibold w-7 text-right">
                          {Math.round((layer.opacity ?? 1) * 100)}%
                        </span>
                      </div>

                      {/* Scale / Resize */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--muted-hi)]">Scale</span>
                        <input
                          type="range"
                          min="20"
                          max="300"
                          value={layer.resizePct ?? 100}
                          onChange={(e) => {
                            const pct = Number(e.target.value);
                            const baseW = layer.baseW || layer.w;
                            const baseH = layer.baseH || layer.h;
                            onUpdateLayer(layer.id, {
                              resizePct: pct,
                              w: Math.round((baseW * pct) / 100),
                              h: Math.round((baseH * pct) / 100),
                            });
                          }}
                          className="flex-1"
                        />
                        <span className="tabular-nums font-semibold w-7 text-right">
                          {layer.resizePct ?? 100}%
                        </span>
                      </div>

                      {/* Position X, Y, W, H */}
                      <div className="grid grid-cols-4 gap-1 text-[9px] pt-1">
                        <div>
                          <span className="text-[var(--muted)] block">X</span>
                          <input
                            type="number"
                            value={Math.round(layer.x)}
                            onChange={(e) => onUpdateLayer(layer.id, { x: Number(e.target.value) })}
                            className="w-full bg-white border border-[var(--border)] rounded px-1 py-0.5 text-center"
                          />
                        </div>
                        <div>
                          <span className="text-[var(--muted)] block">Y</span>
                          <input
                            type="number"
                            value={Math.round(layer.y)}
                            onChange={(e) => onUpdateLayer(layer.id, { y: Number(e.target.value) })}
                            className="w-full bg-white border border-[var(--border)] rounded px-1 py-0.5 text-center"
                          />
                        </div>
                        <div>
                          <span className="text-[var(--muted)] block">W</span>
                          <input
                            type="number"
                            value={Math.round(layer.w)}
                            onChange={(e) => onUpdateLayer(layer.id, { w: Number(e.target.value) })}
                            className="w-full bg-white border border-[var(--border)] rounded px-1 py-0.5 text-center"
                          />
                        </div>
                        <div>
                          <span className="text-[var(--muted)] block">H</span>
                          <input
                            type="number"
                            value={Math.round(layer.h)}
                            onChange={(e) => onUpdateLayer(layer.id, { h: Number(e.target.value) })}
                            className="w-full bg-white border border-[var(--border)] rounded px-1 py-0.5 text-center"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
