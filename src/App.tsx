import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Topbar } from './components/Topbar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { CanvasArea } from './components/CanvasArea';
import { BottomBar } from './components/BottomBar';
import { ProjectsModal } from './components/ProjectsModal';
import { ExportModal } from './components/ExportModal';
import { SlicerModal } from './components/SlicerModal';
import { TimelineFilmstrip } from './components/TimelineFilmstrip';
import { Layer, BgSetting, TextProps, Project, Preset, Scene, SceneTransition } from './types';
import { animator } from './engine/animator';
import { preloadHandImages } from './engine/hands';
import {
  openDB,
  getAllProjects,
  saveProjectToDB,
  deleteProjectFromDB,
  getEstimatedStorageUsage,
} from './engine/db';
import { recordWebMVideo, recordMP4Video, exportCanvasPNG } from './engine/export';

const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'quick-reveal',
    name: 'Quick Reveal',
    builtIn: true,
    style: 'scanner',
    hand: 'ghost',
    stroke: 'default',
    colorStyle: 'filled',
    detectAlg: 'classic',
    detectSens: 50,
    desc: 'Fast clean reveal with no visible hand',
  },
  {
    id: 'sketch-artist',
    name: 'Sketch Artist',
    builtIn: true,
    style: 'contour',
    hand: 'custom1',
    stroke: 'charcoal',
    colorStyle: 'filled',
    detectAlg: 'classic',
    detectSens: 50,
    desc: 'Contour with charcoal stroke feel',
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    builtIn: true,
    style: 'outlineonly',
    hand: 'ghost',
    stroke: 'blueprint',
    colorStyle: 'filled',
    detectAlg: 'classic',
    detectSens: 50,
    desc: 'Technical drafting lines',
  },
  {
    id: 'illustrated',
    name: 'Illustrated',
    builtIn: true,
    style: 'illustfill',
    hand: 'custom1',
    stroke: 'default',
    colorStyle: 'watercolor',
    detectAlg: 'classic',
    detectSens: 50,
    desc: 'Illustrated look with watercolor fills',
  },
];

export function App() {
  // Project Info
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState('Bright Sketch');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [storageEstimate, setStorageEstimate] = useState('0 MB');

  // Canvas Resolution & Ratio
  const [ratio, setRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [res, setRes] = useState<'720' | '1080' | '1440'>('720');
  const [canvasW, setCanvasW] = useState(1280);
  const [canvasH, setCanvasH] = useState(720);
  const [canvasBg, setCanvasBg] = useState<BgSetting>({ type: 'solid', val: 'white' });

  // Layers
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);

  // Animation Style & Hand
  const [activeSidebarTab, setActiveSidebarTab] = useState<'animation' | 'drawing'>('animation');
  const [animStyle, setAnimStyle] = useState('chunkjump');
  const [hand, setHand] = useState('custom1');
  const [speed, setSpeed] = useState(40);
  const [handSpeed, setHandSpeed] = useState(6);
  const [zigzag, setZigzag] = useState(true);
  const [chunks, setChunks] = useState(30);
  const [specChunks, setSpecChunks] = useState(35);
  const [smoothGlide, setSmoothGlide] = useState(true);

  // Drawing settings
  const [outlineStroke, setOutlineStroke] = useState('default');
  const [colorStyle, setColorStyle] = useState('filled');
  const [outlineDetect, setOutlineDetect] = useState(50);
  const [outlineAlgorithm, setOutlineAlgorithm] = useState('classic');
  const [imageReveal, setImageReveal] = useState(true);
  const [revealStyle, setRevealStyle] = useState('fade');
  const [outlineOverlayVisible, setOutlineOverlayVisible] = useState(true);
  const [outlineOverlayOpacity, setOutlineOverlayOpacity] = useState(100);
  const [outlineOverlayThickness, setOutlineOverlayThickness] = useState(2);
  const [outlineOverlayColor, setOutlineOverlayColor] = useState('#000000');
  const [outlineOnlyColorRegion, setOutlineOnlyColorRegion] = useState(false);
  const [outlineOnlyRealImage, setOutlineOnlyRealImage] = useState(false);
  const [textAnimDir, setTextAnimDir] = useState('ltr');
  const [textDrawStyle, setTextDrawStyle] = useState('reveal');

  // Presets
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const stored = localStorage.getItem('inkplainer_custom_presets');
      if (stored) return [...DEFAULT_PRESETS, ...JSON.parse(stored)];
    } catch {}
    return DEFAULT_PRESETS;
  });

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isWorking, setIsWorking] = useState(false);

  // Undo / Redo
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // Modals
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSlicerOpen, setIsSlicerOpen] = useState(false);
  const [isPlacingText, setIsPlacingText] = useState(false);

  // Video Export Progress
  const [isRecording, setIsRecording] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');

  // Refs for canvases
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const handCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Preload hands once
  useEffect(() => {
    preloadHandImages();
    openDB().then(() => refreshProjectsList());
  }, []);

  // Update canvas dimensions based on ratio & res
  useEffect(() => {
    let w = 1280, h = 720;
    if (ratio === '16:9') {
      if (res === '720') { w = 1280; h = 720; }
      else if (res === '1080') { w = 1920; h = 1080; }
      else { w = 2560; h = 1440; }
    } else if (ratio === '9:16') {
      if (res === '720') { w = 720; h = 1280; }
      else if (res === '1080') { w = 1080; h = 1920; }
      else { w = 1440; h = 2560; }
    } else {
      if (res === '720') { w = 720; h = 720; }
      else if (res === '1080') { w = 1080; h = 1080; }
      else { w = 1440; h = 1440; }
    }
    setCanvasW(w);
    setCanvasH(h);
    animator.updateConfig(w, h, canvasBg, smoothGlide);
  }, [ratio, res, canvasBg, smoothGlide]);

  // Connect canvases to Animator
  useEffect(() => {
    animator.setCanvases(mainCanvasRef.current, handCanvasRef.current, selectCanvasRef.current);
    animator.setCallbacks(
      (p) => setProgress(p),
      () => {
        setIsDone(true);
        setIsPlaying(false);
      },
      (p) => setIsPlaying(p)
    );
  }, []);

  // Sync Animator state with layers
  useEffect(() => {
    if (!isPlaying) {
      animator.redrawStatic(layers, selectedLayerId);
    }
  }, [layers, selectedLayerId, canvasBg, isPlaying]);

  // Auto-save debounced
  const saveTimeoutRef = useRef<any>(null);
  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const savedLayers = layers.map(({ img, ...rest }) => {
          let dataUrl = '';
          if (img) {
            if ('src' in img && (img as HTMLImageElement).src) {
              dataUrl = (img as HTMLImageElement).src;
            } else if (typeof (img as HTMLCanvasElement).toDataURL === 'function') {
              dataUrl = (img as HTMLCanvasElement).toDataURL('image/png');
            }
          }
          return {
            ...rest,
            imageDataURL: dataUrl || rest.imageDataURL || '',
          };
        });

        const projectState = {
          canvasW,
          canvasH,
          canvasBg,
          _currentRatio: ratio,
          _currentRes: res,
          layers: savedLayers,
          selectedLayerId,
          groups: [],
          animStyle,
          hand,
          zigzag,
          outlineDetect,
          outlineAlgorithm,
          outlineStrokeStyle: outlineStroke,
          colorStyle,
        };

        const id = await saveProjectToDB({
          id: projectId || undefined,
          name: projectName,
          state: projectState,
        });

        if (!projectId) setProjectId(id);
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        refreshProjectsList();
      } catch (err) {
        console.error('Auto-save error:', err);
      }
    }, 1200);
  }, [
    projectId,
    projectName,
    layers,
    selectedLayerId,
    canvasW,
    canvasH,
    canvasBg,
    ratio,
    res,
    animStyle,
    hand,
    zigzag,
    outlineDetect,
    outlineAlgorithm,
    outlineStroke,
    colorStyle,
  ]);

  useEffect(() => {
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const refreshProjectsList = async () => {
    try {
      const list = await getAllProjects();
      setProjectsList(list);
      const est = await getEstimatedStorageUsage();
      setStorageEstimate(est);
    } catch (e) {
      console.error(e);
    }
  };

  // Undo Snapshot
  const pushUndoSnapshot = () => {
    const snapshot = {
      layers: JSON.parse(JSON.stringify(layers.map((l) => ({ ...l, img: undefined })))),
      selectedLayerId,
      animStyle,
      hand,
      canvasBg,
    };
    setUndoStack((prev) => [...prev.slice(-25), snapshot]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0 || isPlaying) return;
    const current = {
      layers: JSON.parse(JSON.stringify(layers.map((l) => ({ ...l, img: undefined })))),
      selectedLayerId,
      animStyle,
      hand,
      canvasBg,
    };
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [...s, current]);

    // Restore layer images
    const restoredLayers = prev.layers.map((pl: any) => {
      const existing = layers.find((l) => l.id === pl.id);
      return { ...pl, img: existing?.img || new Image() };
    });

    setLayers(restoredLayers);
    setSelectedLayerId(prev.selectedLayerId);
    setAnimStyle(prev.animStyle);
    setHand(prev.hand);
    setCanvasBg(prev.canvasBg);
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || isPlaying) return;
    const current = {
      layers: JSON.parse(JSON.stringify(layers.map((l) => ({ ...l, img: undefined })))),
      selectedLayerId,
      animStyle,
      hand,
      canvasBg,
    };
    const next = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, current]);

    const restoredLayers = next.layers.map((nl: any) => {
      const existing = layers.find((l) => l.id === nl.id);
      return { ...nl, img: existing?.img || new Image() };
    });

    setLayers(restoredLayers);
    setSelectedLayerId(next.selectedLayerId);
    setAnimStyle(next.animStyle);
    setHand(next.hand);
    setCanvasBg(next.canvasBg);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) animator.pause();
        else animator.play();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLayerId && !isPlaying) {
          e.preventDefault();
          handleDeleteLayer(selectedLayerId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Layer Actions
  const handleAddImageLayers = (files: FileList | File[]) => {
    pushUndoSnapshot();
    Array.from(files).forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const id = Date.now() + i;
          const scale = Math.min(canvasW / img.width, canvasH / img.height) * 0.8;
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const offset = (layers.length % 5) * 20;
          const x = Math.round((canvasW - w) / 2) + offset;
          const y = Math.round((canvasH - h) / 2) + offset;

          const newLayer: Layer = {
            id,
            name: file.name.replace(/\.[^/.]+$/, '') || `Layer ${layers.length + 1}`,
            img,
            x,
            y,
            w,
            h,
            baseW: w,
            baseH: h,
            resizePct: 100,
            animStyle: animStyle || 'chunkjump',
            hand: hand || 'custom1',
            animOrder: null,
            opacity: 1,
            visible: true,
            groupId: null,
            speed: 40,
            handSpeed: 6,
            chunks: 30,
            specChunks: 35,
            hasPngAlpha: true,
            outlineDetect,
            outlineAlgorithm,
            outlineStrokeStyle: outlineStroke,
            colorStyle,
          };

          setLayers((prev) => [...prev, newLayer]);
          setSelectedLayerId(id);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddTextLayer = (props: TextProps, targetX?: number, targetY?: number) => {
    pushUndoSnapshot();
    const probe = document.createElement('canvas');
    const pctx = probe.getContext('2d')!;
    pctx.font = `${props.bold ? 'bold ' : ''}${props.italic ? 'italic ' : ''}${props.size}px '${props.font}', sans-serif`;

    const lines = props.text.split('\n');
    let maxW = 0;
    lines.forEach((l) => {
      const m = pctx.measureText(l);
      if (m.width > maxW) maxW = m.width;
    });

    const lineH = props.size * props.lineHeight;
    const pad = 30;
    const w = Math.round(maxW + pad * 2);
    const h = Math.round(lines.length * lineH + pad * 2);

    const tc = document.createElement('canvas');
    tc.width = w;
    tc.height = h;
    const tctx = tc.getContext('2d')!;

    tctx.font = `${props.bold ? 'bold ' : ''}${props.italic ? 'italic ' : ''}${props.size}px '${props.font}', sans-serif`;
    tctx.fillStyle = props.color;
    tctx.textAlign = props.align;
    tctx.textBaseline = 'middle';

    const textX = props.align === 'center' ? w / 2 : props.align === 'right' ? w - pad : pad;
    const startY = pad + lineH / 2;

    lines.forEach((line, idx) => {
      tctx.fillText(line, textX, startY + idx * lineH);
    });

    const img = new Image();
    img.src = tc.toDataURL('image/png');
    img.onload = () => {
      const id = Date.now();
      const posX = targetX !== undefined ? Math.max(0, targetX - w / 2) : Math.round((canvasW - w) / 2);
      const posY = targetY !== undefined ? Math.max(0, targetY - h / 2) : Math.round((canvasH - h) / 2);

      const newLayer: Layer = {
        id,
        name: props.text.slice(0, 18) || 'Text Layer',
        img,
        x: Math.round(posX),
        y: Math.round(posY),
        w,
        h,
        baseW: w,
        baseH: h,
        resizePct: 100,
        animStyle: 'spec-text',
        hand: hand || 'custom1',
        animOrder: null,
        opacity: 1,
        visible: true,
        groupId: null,
        speed: 40,
        handSpeed: 6,
        chunks: 30,
        specChunks: 35,
        hasPngAlpha: true,
        kind: 'text',
        textProps: props,
        textAnimDir,
        textDrawStyle,
      };

      setLayers((prev) => [...prev, newLayer]);
      setSelectedLayerId(id);
      setIsPlacingText(false);
    };
  };

  const handleUpdateLayer = (id: number, updates: Partial<Layer>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const handleDeleteLayer = (id: number) => {
    pushUndoSnapshot();
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(layers.length > 1 ? layers[0].id : null);
    }
  };

  const handleReorderLayers = (startIndex: number, endIndex: number) => {
    pushUndoSnapshot();
    setLayers((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  const handleGenerate = () => {
    if (layers.length === 0) return;
    setIsWorking(true);
    setIsDone(false);
    setTimeout(() => {
      animator.generate(layers);
      setIsWorking(false);
    }, 50);
  };

  // Projects Management
  const handleNewProject = () => {
    setProjectId(null);
    setProjectName('New Canvas');
    setLayers([]);
    setSelectedLayerId(null);
    setAnimStyle('chunkjump');
    setCanvasBg({ type: 'solid', val: 'white' });
    setIsProjectsOpen(false);
  };

  const handleSelectProject = (id: number) => {
    const proj = projectsList.find((p) => p.id === id);
    if (!proj || !proj.state) return;

    setProjectId(id);
    setProjectName(proj.name);
    setCanvasW(proj.state.canvasW || 1280);
    setCanvasH(proj.state.canvasH || 720);
    setCanvasBg(proj.state.canvasBg || { type: 'solid', val: 'white' });
    setAnimStyle(proj.state.animStyle || 'chunkjump');
    setHand(proj.state.hand || 'custom1');

    // Restore layers
    const loadedLayers = (proj.state.layers || []).map((l: any) => {
      const img = new Image();
      if (l.imageDataURL) img.src = l.imageDataURL;
      return { ...l, img };
    });

    setLayers(loadedLayers);
    setSelectedLayerId(proj.state.selectedLayerId || null);
    setIsProjectsOpen(false);
  };

  const handleDeleteProject = async (id: number) => {
    await deleteProjectFromDB(id);
    if (projectId === id) {
      handleNewProject();
    }
    refreshProjectsList();
  };

  // Presets Application
  const handleApplyPreset = (preset: Preset) => {
    pushUndoSnapshot();
    setAnimStyle(preset.style);
    setHand(preset.hand);
    setOutlineStroke(preset.stroke);
    setColorStyle(preset.colorStyle);
    setOutlineAlgorithm(preset.detectAlg);
    setOutlineDetect(preset.detectSens);
    if (['illustfill', 'outlinefill', 'outlineonly', 'spec-text'].includes(preset.style)) {
      setActiveSidebarTab('drawing');
    } else {
      setActiveSidebarTab('animation');
    }
  };

  const handleSavePreset = (name: string) => {
    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      name,
      builtIn: false,
      style: animStyle,
      hand,
      stroke: outlineStroke,
      colorStyle,
      detectAlg: outlineAlgorithm,
      detectSens: outlineDetect,
    };
    const updated = [...presets.filter((p) => !p.builtIn), newPreset];
    localStorage.setItem('inkplainer_custom_presets', JSON.stringify(updated));
    setPresets([...DEFAULT_PRESETS, ...updated]);
  };

  const handleDeletePreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id && !p.builtIn);
    localStorage.setItem('inkplainer_custom_presets', JSON.stringify(updated));
    setPresets([...DEFAULT_PRESETS, ...updated]);
  };

  // Video Export execution
  const handleStartExport = async (fmt: 'webm' | 'mp4', q: 'high' | 'medium' | 'low', expPNG: boolean) => {
    if (!mainCanvasRef.current || !handCanvasRef.current) return;
    setIsRecording(true);
    setExportProgress(0);
    setExportStatusText('Preparing video export...');

    try {
      const opts = {
        format: fmt,
        quality: q,
        exportPNG: expPNG,
        onProgress: (p: number, text: string) => {
          setExportProgress(p);
          setExportStatusText(text);
        },
        isCompleteCheck: () => animator.state.done === true,
        getProgress: () => animator.state._animProgress || 0,
        triggerRestart: () => handleGenerate(),
      };

      if (fmt === 'mp4') {
        await recordMP4Video(mainCanvasRef.current, handCanvasRef.current, canvasW, canvasH, opts);
      } else {
        await recordWebMVideo(mainCanvasRef.current, handCanvasRef.current, canvasW, canvasH, opts);
      }

      if (expPNG && mainCanvasRef.current) {
        exportCanvasPNG(mainCanvasRef.current);
      }

      setIsRecording(false);
      setIsExportOpen(false);
    } catch (err: any) {
      console.error(err);
      setIsRecording(false);
      setExportStatusText(`Export failed: ${err.message || 'Error'}`);
    }
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg)]">
      {/* Top Bar */}
      <Topbar
        projectName={projectName}
        onRenameProject={setProjectName}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0 && !isPlaying}
        canRedo={redoStack.length > 0 && !isPlaying}
        undoCount={undoStack.length}
        redoCount={redoStack.length}
        canvasW={canvasW}
        canvasH={canvasH}
        animStyle={animStyle}
        isWorking={isWorking}
        isRecording={isRecording}
        lastSavedTime={lastSavedTime}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Control Sidebar */}
        <LeftSidebar
          selectedLayer={selectedLayer}
          animStyle={animStyle}
          onSelectAnimStyle={(st) => {
            setAnimStyle(st);
            if (selectedLayerId) handleUpdateLayer(selectedLayerId, { animStyle: st });
          }}
          zigzag={zigzag}
          onToggleZigzag={() => {
            setZigzag(!zigzag);
            if (selectedLayerId) handleUpdateLayer(selectedLayerId, { zigzag: !zigzag });
          }}
          chunks={chunks}
          onChangeChunks={(c) => {
            setChunks(c);
            if (selectedLayerId) handleUpdateLayer(selectedLayerId, { chunks: c });
          }}
          specChunks={specChunks}
          onChangeSpecChunks={(sc) => {
            setSpecChunks(sc);
            if (selectedLayerId) handleUpdateLayer(selectedLayerId, { specChunks: sc });
          }}
          smoothGlide={smoothGlide}
          onToggleSmoothGlide={() => setSmoothGlide(!smoothGlide)}
          outlineStroke={outlineStroke}
          onSelectOutlineStroke={(stk) => {
            setOutlineStroke(stk);
            if (selectedLayerId) handleUpdateLayer(selectedLayerId, { outlineStrokeStyle: stk });
          }}
          colorStyle={colorStyle}
          onSelectColorStyle={(cs) => {
            setColorStyle(cs);
            if (selectedLayerId) handleUpdateLayer(selectedLayerId, { colorStyle: cs });
          }}
          outlineDetect={outlineDetect}
          onChangeOutlineDetect={(od) => {
            setOutlineDetect(od);
            if (selectedLayerId) handleUpdateLayer(selectedLayerId, { outlineDetect: od });
          }}
          outlineAlgorithm={outlineAlgorithm}
          onSelectOutlineAlgorithm={(alg) => {
            setOutlineAlgorithm(alg);
            if (selectedLayerId) handleUpdateLayer(selectedLayerId, { outlineAlgorithm: alg });
          }}
          imageReveal={imageReveal}
          onToggleImageReveal={() => setImageReveal(!imageReveal)}
          revealStyle={revealStyle}
          onSelectRevealStyle={setRevealStyle}
          outlineOverlayVisible={outlineOverlayVisible}
          onToggleOutlineOverlayVisible={() => setOutlineOverlayVisible(!outlineOverlayVisible)}
          outlineOverlayOpacity={outlineOverlayOpacity}
          onChangeOutlineOverlayOpacity={setOutlineOverlayOpacity}
          outlineOverlayThickness={outlineOverlayThickness}
          onChangeOutlineOverlayThickness={setOutlineOverlayThickness}
          outlineOverlayColor={outlineOverlayColor}
          onChangeOutlineOverlayColor={setOutlineOverlayColor}
          outlineOnlyColorRegion={outlineOnlyColorRegion}
          onToggleOutlineOnlyColorRegion={() => {
            setOutlineOnlyColorRegion(!outlineOnlyColorRegion);
            if (!outlineOnlyColorRegion) setOutlineOnlyRealImage(false);
          }}
          outlineOnlyRealImage={outlineOnlyRealImage}
          onToggleOutlineOnlyRealImage={() => {
            setOutlineOnlyRealImage(!outlineOnlyRealImage);
            if (!outlineOnlyRealImage) setOutlineOnlyColorRegion(false);
          }}
          textAnimDir={textAnimDir}
          onSelectTextAnimDir={(dir) => {
            setTextAnimDir(dir);
            if (selectedLayerId) handleUpdateLayer(selectedLayerId, { textAnimDir: dir });
          }}
          textDrawStyle={textDrawStyle}
          onSelectTextDrawStyle={(ds) => {
            setTextDrawStyle(ds);
            if (selectedLayerId) handleUpdateLayer(selectedLayerId, { textDrawStyle: ds });
          }}
          onGenerate={handleGenerate}
          activeSidebarTab={activeSidebarTab}
          onSwitchSidebarTab={setActiveSidebarTab}
          presets={presets}
          onApplyPreset={handleApplyPreset}
          onSavePreset={handleSavePreset}
          onDeletePreset={handleDeletePreset}
        />

        {/* Center Canvas Workspace */}
        <CanvasArea
          canvasW={canvasW}
          canvasH={canvasH}
          mainCanvasRef={mainCanvasRef}
          handCanvasRef={handCanvasRef}
          selectCanvasRef={selectCanvasRef}
          selectedLayer={selectedLayer}
          onSelectLayer={setSelectedLayerId}
          onUpdateLayer={handleUpdateLayer}
          isPlaying={isPlaying}
          isDone={isDone}
          progress={progress}
          onPlay={() => animator.play()}
          onPause={() => animator.pause()}
          onRestart={handleGenerate}
          isPlacingText={isPlacingText}
          onPlaceTextAt={(x, y) => {
            handleAddTextLayer(
              {
                text: 'New Whiteboard Text',
                font: 'Caveat',
                size: 56,
                color: '#111111',
                bold: false,
                italic: false,
                align: 'center',
                lineHeight: 1.2,
                letterSpacing: 0,
              },
              x,
              y
            );
          }}
          animStyle={animStyle}
        />

        {/* Right Sidebar */}
        <RightSidebar
          layers={layers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onAddImageLayers={handleAddImageLayers}
          onAddTextLayer={(props) => handleAddTextLayer(props)}
          onUpdateLayer={handleUpdateLayer}
          onDeleteLayer={handleDeleteLayer}
          onReorderLayers={handleReorderLayers}
          onOpenSlicer={() => setIsSlicerOpen(true)}
          isPlacingText={isPlacingText}
          onTogglePlacingText={() => setIsPlacingText(!isPlacingText)}
          canvasBg={canvasBg}
          onChangeCanvasBg={setCanvasBg}
        />
      </div>

      {/* Bottom Bar */}
      <BottomBar
        hand={hand}
        onSelectHand={(h) => {
          setHand(h);
          if (selectedLayerId) handleUpdateLayer(selectedLayerId, { hand: h });
        }}
        speed={speed}
        onChangeSpeed={(s) => {
          setSpeed(s);
          if (selectedLayerId) handleUpdateLayer(selectedLayerId, { speed: s });
        }}
        handSpeed={handSpeed}
        onChangeHandSpeed={(hs) => {
          setHandSpeed(hs);
          if (selectedLayerId) handleUpdateLayer(selectedLayerId, { handSpeed: hs });
        }}
        ratio={ratio}
        onSelectRatio={setRatio}
        res={res}
        onSelectRes={setRes}
        canvasW={canvasW}
        canvasH={canvasH}
      />

      {/* Modals */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        projects={projectsList}
        currentProjectId={projectId}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
        storageEstimate={storageEstimate}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onStartExport={handleStartExport}
        isRecording={isRecording}
        progress={exportProgress}
        statusText={exportStatusText}
      />

      <SlicerModal
        isOpen={isSlicerOpen}
        onClose={() => setIsSlicerOpen(false)}
        layer={selectedLayer}
        onApplySlices={(newSlices) => {
          pushUndoSnapshot();
          if (selectedLayerId) {
            handleDeleteLayer(selectedLayerId);
          }
          const created: Layer[] = newSlices.map((s, idx) => ({
            id: Date.now() + idx,
            name: s.name,
            img: s.img,
            x: s.x,
            y: s.y,
            w: s.w,
            h: s.h,
            baseW: s.w,
            baseH: s.h,
            resizePct: 100,
            animStyle: animStyle || 'chunkjump',
            hand: hand || 'custom1',
            animOrder: idx + 1,
            opacity: 1,
            visible: true,
            groupId: null,
            speed: 40,
            handSpeed: 6,
            chunks: 30,
            specChunks: 35,
            hasPngAlpha: true,
          }));
          setLayers((prev) => [...prev, ...created]);
        }}
      />
    </div>
  );
}
export default App;
