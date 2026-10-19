import { Layer, BgSetting, Scene } from '../types';
import { renderBackground } from './backgrounds';
import { drawHandSprite, drawWhiteboardEraser } from './hands';

declare global {
  interface Window {
    AnimationEngine: any;
    state: any;
    ctx: CanvasRenderingContext2D | null;
    _mainCtx: CanvasRenderingContext2D | null;
    hctx: CanvasRenderingContext2D | null;
    sctx: CanvasRenderingContext2D | null;
    offscreen: HTMLCanvasElement | null;
    fillBg: (c: CanvasRenderingContext2D) => void;
    drawHand: (c: CanvasRenderingContext2D, tipX: number, tipY: number, dir?: number, style?: string) => void;
    finishAnim: () => void;
    setProgress: (ratio: number) => void;
    resScale: () => number;
    resPointScale: () => number;
    resSoftBlur: () => number;
    _runGroupAt?: (gpos: number) => void;
    _allLayersDone?: () => void;
  }
}

export function detectContentBounds(oc: HTMLCanvasElement): { x: number; y: number; w: number; h: number } {
  const W = oc.width, H = oc.height;
  const d = oc.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, W, H).data;
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const a = d[i + 3];
      const notWhite = d[i] < 240 || d[i + 1] < 240 || d[i + 2] < 240;
      const hasTrans = a < 250;
      if (a > 20 && (notWhite || hasTrans)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) return { x: 0, y: 0, w: W, h: H };
  const pad = 28;
  const bx = Math.max(0, minX - pad), by = Math.max(0, minY - pad);
  return { x: bx, y: by, w: Math.min(W, maxX + pad) - bx, h: Math.min(H, maxY + pad) - by };
}

export class AnimationController {
  private mainCanvas: HTMLCanvasElement | null = null;
  private handCanvas: HTMLCanvasElement | null = null;
  private selectCanvas: HTMLCanvasElement | null = null;

  public state: any = {
    canvasW: 1280,
    canvasH: 720,
    canvasBg: { type: 'solid', val: '#ffffff' } as BgSetting,
    layers: [] as Layer[],
    activeLayerIndex: 0,
    animStyle: 'chunkjump',
    hand: 'custom1',
    zigzag: true,
    playing: false,
    done: false,
    _animProgress: 0,
    handGlideEnabled: true,
    outlineDetect: 50,
    outlineAlgorithm: 'classic',
    outlineStrokeStyle: 'default',
    colorStyle: 'filled',
    bgCanvas: null as HTMLCanvasElement | null,
    _activeSlots: [] as any[],
    _animGroups: [] as Layer[][],
    _groupPos: 0,
    _animQueue: [] as Layer[],
    _queuePos: 0,
    _slotMode: false,
    _currentSlot: null as any,
    recording: false,
    animFrame: 0,
  };

  public multiScenes: Scene[] = [];
  public currentSceneIndex: number = 0;
  public playbackMode: 'single' | 'all' = 'single';
  public isTransitioning: boolean = false;

  private onProgressCallback: ((progress: number) => void) | null = null;
  private onCompleteCallback: (() => void) | null = null;
  private onPlayingChangeCallback: ((playing: boolean) => void) | null = null;
  private onSceneChangeCallback: ((index: number) => void) | null = null;
  private onAllScenesCompleteCallback: (() => void) | null = null;
  private onTotalProgressCallback: ((prog: number) => void) | null = null;

  private transitionTimer: any = null;
  private transitionRaf: number | null = null;

  constructor() {
    this.initGlobals();
  }

  public setCanvases(
    main: HTMLCanvasElement | null,
    hand: HTMLCanvasElement | null,
    select: HTMLCanvasElement | null
  ) {
    this.mainCanvas = main;
    this.handCanvas = hand;
    this.selectCanvas = select;

    if (main) {
      window.ctx = main.getContext('2d');
      window._mainCtx = window.ctx;
    }
    if (hand) {
      window.hctx = hand.getContext('2d');
    }
    if (select) {
      window.sctx = select.getContext('2d');
    }
  }

  private initGlobals() {
    window.state = this.state;

    window.resScale = () => Math.sqrt((this.state.canvasW * this.state.canvasH) / (1280 * 720));
    window.resPointScale = () => Math.pow(window.resScale(), 0.6);
    window.resSoftBlur = () => Math.max(0, (window.resScale() - 1) * 1.5);

    window.fillBg = (c: CanvasRenderingContext2D) => {
      renderBackground(
        c,
        this.state.canvasW,
        this.state.canvasH,
        this.state.canvasBg,
        this.state.bgCanvas,
        this.state._slotMode
      );
    };

    window.drawHand = (c: CanvasRenderingContext2D, tipX: number, tipY: number, _dir = 1, style = this.state.hand) => {
      const glideHolder = this.state._currentSlot || this.state;
      drawHandSprite(
        c,
        tipX,
        tipY,
        style,
        this.state.canvasW,
        this.state.canvasH,
        this.state.handGlideEnabled,
        glideHolder
      );
    };

    window.setProgress = (ratio: number) => {
      this.state._animProgress = Math.min(Math.max(ratio, 0), 1);
      this.onProgressCallback?.(this.state._animProgress);
      if (this.playbackMode === 'all' && this.multiScenes.length > 0) {
        const total = this.multiScenes.length;
        const overall = (this.currentSceneIndex + this.state._animProgress) / total;
        this.onTotalProgressCallback?.(Math.min(Math.max(overall, 0), 1));
      } else {
        this.onTotalProgressCallback?.(this.state._animProgress);
      }
    };

    window.finishAnim = () => {
      this.finishCurrentSlotOrLayer();
    };

    window._runGroupAt = (gpos: number) => {
      this.runGroupAt(gpos);
    };
    (window as any)._runGroupAtImpl = (gpos: number) => {
      this.runGroupAt(gpos);
    };

    window._allLayersDone = () => {
      this.allLayersDone();
    };
    (window as any)._allLayersDoneImpl = () => {
      this.allLayersDone();
    };
  }

  public setCallbacks(
    onProgress: (progress: number) => void,
    onComplete: () => void,
    onPlayingChange: (playing: boolean) => void
  ) {
    this.onProgressCallback = onProgress;
    this.onCompleteCallback = onComplete;
    this.onPlayingChangeCallback = onPlayingChange;
  }

  public setMultiSceneCallbacks(
    onSceneChange: (index: number) => void,
    onAllScenesComplete: () => void,
    onTotalProgress: (prog: number) => void
  ) {
    this.onSceneChangeCallback = onSceneChange;
    this.onAllScenesCompleteCallback = onAllScenesComplete;
    this.onTotalProgressCallback = onTotalProgress;
  }

  public updateConfig(w: number, h: number, bg: BgSetting, handGlide: boolean) {
    this.state.canvasW = w;
    this.state.canvasH = h;
    this.state.canvasBg = bg;
    this.state.handGlideEnabled = handGlide;
  }

  public redrawStatic(layers: Layer[], selectedId: number | null) {
    if (!this.mainCanvas || !window.ctx) return;
    this.state.layers = layers;

    // Reset bgCanvas
    this.state.bgCanvas = null;
    window.fillBg(window.ctx);

    const visibleLayers = layers.filter((l) => l.visible !== false);
    visibleLayers.forEach((l) => {
      if (!window.ctx) return;
      window.ctx.save();
      window.ctx.globalAlpha = l.opacity ?? 1;
      window.ctx.drawImage(l.img, l.x, l.y, l.w, l.h);
      window.ctx.restore();
    });

    if (this.handCanvas && window.hctx) {
      window.hctx.clearRect(0, 0, this.state.canvasW, this.state.canvasH);
    }

    this.drawSelection(selectedId);
  }

  public drawSelection(selectedId: number | null) {
    if (!this.selectCanvas || !window.sctx) return;
    window.sctx.clearRect(0, 0, this.state.canvasW, this.state.canvasH);
    if (!selectedId) return;

    const layer = this.state.layers.find((l: Layer) => l.id === selectedId);
    if (!layer || layer.visible === false) return;

    const s = window.sctx;
    s.save();
    s.strokeStyle = '#1a1a1a';
    s.lineWidth = 1.5;
    s.setLineDash([4, 4]);
    s.strokeRect(layer.x, layer.y, layer.w, layer.h);

    // 8 resize handles
    const handleSize = 8;
    const half = handleSize / 2;
    const pts = [
      { x: layer.x, y: layer.y },
      { x: layer.x + layer.w / 2, y: layer.y },
      { x: layer.x + layer.w, y: layer.y },
      { x: layer.x + layer.w, y: layer.y + layer.h / 2 },
      { x: layer.x + layer.w, y: layer.y + layer.h },
      { x: layer.x + layer.w / 2, y: layer.y + layer.h },
      { x: layer.x, y: layer.y + layer.h },
      { x: layer.x, y: layer.y + layer.h / 2 },
    ];

    s.setLineDash([]);
    s.fillStyle = '#ffffff';
    s.strokeStyle = '#1a1a1a';
    s.lineWidth = 1.5;

    pts.forEach((pt) => {
      s.fillRect(pt.x - half, pt.y - half, handleSize, handleSize);
      s.strokeRect(pt.x - half, pt.y - half, handleSize, handleSize);
    });

    s.restore();
  }

  public generate(layers: Layer[]) {
    if (layers.length === 0) return;
    this.state.layers = layers;
    this.stop();

    this.state.bgCanvas = null;
    this.state._activeSlots = [];
    this.state._currentSlot = null;
    this.state._slotMode = false;
    this.state._handGX = null;
    this.state._handGY = null;
    window.ctx = window._mainCtx;

    // Group layers by animOrder
    const visible = layers.filter((l) => l.visible !== false);
    const ordered = visible
      .filter((l) => l.animOrder !== null && l.animOrder !== undefined)
      .sort((a, b) => (a.animOrder as number) - (b.animOrder as number));
    const unordered = visible.filter((l) => l.animOrder === null || l.animOrder === undefined);
    const allOrdered = [...ordered, ...unordered];

    const groupMap = new Map<any, Layer[]>();
    allOrdered.forEach((layer) => {
      const key = layer.animOrder ?? `__${layer.id}`;
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(layer);
    });

    this.state._animGroups = [...groupMap.values()];
    this.state._groupPos = 0;

    this.runGroupAt(0);
  }

  public runGroupAt(gpos: number) {
    if (!this.state._animGroups || gpos >= this.state._animGroups.length) {
      this.allLayersDone();
      return;
    }

    this.state._groupPos = gpos;
    const group = this.state._animGroups[gpos];

    if (!this.state.bgCanvas) {
      const bg = document.createElement('canvas');
      bg.width = this.state.canvasW;
      bg.height = this.state.canvasH;
      const bc = bg.getContext('2d')!;
      renderBackground(bc, this.state.canvasW, this.state.canvasH, this.state.canvasBg, null, false);
      this.state.bgCanvas = bg;
    }
    const sharedBg = this.state.bgCanvas;

    const _SLOT_KEYS = window.AnimationEngine?._SLOT_KEYS || [];

    this.state._activeSlots = group.map((layer) => {
      const sc = document.createElement('canvas');
      sc.width = this.state.canvasW;
      sc.height = this.state.canvasH;
      const slot = {
        layer,
        canvas: sc,
        ctx: sc.getContext('2d'),
        offscreen: null as HTMLCanvasElement | null,
        done: false,
        _state: {} as any,
        _saved: {} as any,
      };

      _SLOT_KEYS.forEach((k: string) => {
        slot._state[k] = this.state[k];
      });

      slot._state.animStyle = layer.animStyle || this.state.animStyle || 'scanner';
      slot._state.hand = layer.hand || this.state.hand || 'custom1';
      slot._state.zigzag = layer.zigzag ?? this.state.zigzag ?? true;
      slot._state.textAnimDir = layer.textAnimDir || 'ltr';
      slot._state.textDrawStyle = layer.textDrawStyle || 'reveal';
      slot._state.outlineDetect = layer.outlineDetect ?? this.state.outlineDetect ?? 50;
      slot._state.outlineAlgorithm = layer.outlineAlgorithm || this.state.outlineAlgorithm || 'classic';
      slot._state.outlineStrokeStyle = layer.outlineStrokeStyle || this.state.outlineStrokeStyle || 'default';
      slot._state.colorStyle = layer.colorStyle || this.state.colorStyle || 'filled';

      return slot;
    });

    this.state._activeSlots.forEach((slot) => {
      const _prevStyle = this.state.animStyle;
      this.state.animStyle = slot._state.animStyle;
      this.state.activeLayerIndex = this.state.layers.indexOf(slot.layer);

      this.preRender(sharedBg);
      slot.offscreen = window.offscreen;
      slot._state.contentBounds = { ...this.state.contentBounds };
      this.state.animStyle = _prevStyle;

      if (window.AnimationEngine) {
        window.AnimationEngine._slotIn(slot);
        cancelAnimationFrame(this.state.animFrame);
        this.resetAnimationVars();
        this.setupStyleForCurrentState(slot.layer);
        window.AnimationEngine._slotOut(slot);
      }
    });

    if (window.sctx) {
      window.sctx.clearRect(0, 0, this.state.canvasW, this.state.canvasH);
    }

    window.setProgress(0);
    this.play();
  }

  private preRender(existingBg: HTMLCanvasElement | null) {
    const layer = this.state.layers[this.state.activeLayerIndex];
    if (existingBg) {
      this.state.bgCanvas = existingBg;
    } else {
      const bg = document.createElement('canvas');
      bg.width = this.state.canvasW;
      bg.height = this.state.canvasH;
      const bc = bg.getContext('2d')!;
      renderBackground(bc, this.state.canvasW, this.state.canvasH, this.state.canvasBg, null, false);
      this.state.bgCanvas = bg;
    }

    const off = document.createElement('canvas');
    off.width = this.state.canvasW;
    off.height = this.state.canvasH;
    const oc = off.getContext('2d', { willReadFrequently: true })!;

    if (layer) {
      oc.save();
      oc.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1;
      oc.drawImage(layer.img, layer.x, layer.y, layer.w, layer.h);
      oc.restore();
    }

    window.offscreen = off;
    this.state.contentBounds = detectContentBounds(off);
  }

  private resetAnimationVars() {
    this.state.revealCanvas = null;
    this.state.edgeCanvas = null;
    this.state.ofOutlineCanvas = null;
    this.state.ofColorCanvas = null;
    this.state.ofPhase = 1;
    this.state.ofPerimIdx = 0;
    this.state.ofFillIdx = 0;
    this.state.ofLastDrawn = 0;
    this.state.ofColorGroups = null;
    this.state.ofColorIdx = 0;
    this.state.ofWaypointIdx = 0;
    this.state.ofRevealY = 0;
    this.state.ifOutlineCanvas = null;
    this.state.ifColorCanvas = null;
    this.state.ifInkCanvas = null;
    this.state.ifPhase = 1;
    this.state.ifPerimIdx = 0;
    this.state.ifLastDrawn = 0;
    this.state.ifInkIdx = 0;
    this.state.ifInkLastDrawn = 0;
    this.state.ifInkWaypoints = null;
    this.state.ifInternalIdx = 0;
    this.state.ifInternalLast = 0;
    this.state.ifColorGroups = null;
    this.state.ifColorIdx = 0;
    this.state.ifWaypointIdx = 0;
    this.state.ifRevealY = 0;
    this.state.scribblePhase = 0;
    this.state.contourPhase = 1;
    this.state.noFlashFinish = false;
    this.state.stPhase = 1;
    this.state.stOutlineCanvas = null;
    this.state.stOutlinePts = null;
    this.state.stOutlineIdx = 0;
    this.state.stOutlineLastDrawn = 0;
    this.state.stFillPts = null;
    this.state.curX = 0;
    this.state.curY = 0;
    this.state.scanDir = 1;
    this.state.strokeList = [];
    this.state.strokeIdx = 0;
  }

  private setupStyleForCurrentState(layer?: Layer) {
    if (!window.AnimationEngine) return;
    const style = this.state.animStyle;
    const eng = window.AnimationEngine;

    switch (style) {
      case 'contour':
        eng.setupContour?.();
        break;
      case 'outlinechunks':
        eng.setupOutlineChunks?.();
        break;
      case 'outlinefill':
        eng.setupOutlineFill?.();
        break;
      case 'illustfill':
        eng.setupIllustFill?.();
        break;
      case 'outlineonly':
        eng.setupIllustFill?.();
        this.state.ifOutlineThickness = 2 * window.resScale();
        break;
      case 'chunkjump':
        eng.setupChunkJump?.();
        break;
      case 'scribble':
        eng.setupScribble?.();
        break;
      case 'spec-text':
        eng.setupSpecText?.();
        break;
      case 'spec-human':
        eng.setupSpecialized?.('human');
        break;
      case 'spec-animal':
        eng.setupSpecialized?.('animal');
        break;
      case 'spec-portrait':
        eng.setupSpecialized?.('portrait');
        break;
      case 'spec-vehicle':
        eng.setupSpecialized?.('vehicle');
        break;
      case 'spec-building':
        eng.setupSpecialized?.('building');
        break;
      case 'spec-landscape':
        eng.setupSpecialized?.('landscape');
        break;
      case 'spec-spiral':
        eng.setupSpecialized?.('spiral');
        break;
      default:
        eng.setupScanner?.();
        break;
    }
  }

  private finishCurrentSlotOrLayer() {
    const slot = this.state._currentSlot;
    if (slot) {
      if (this.state.bgCanvas) {
        const bc = this.state.bgCanvas.getContext('2d')!;
        const l = slot.layer;
        if (l) {
          bc.save();
          bc.globalAlpha = l.opacity ?? 1;
          bc.drawImage(l.img, l.x, l.y, l.w, l.h);
          bc.restore();
        }
      }
      slot.done = true;
      if (window.hctx) {
        window.hctx.clearRect(0, 0, this.state.canvasW, this.state.canvasH);
      }
      return;
    }

    // Single layer finish
    this.advanceGroup();
  }

  private advanceGroup() {
    const nextGroup = this.state._groupPos + 1;
    if (nextGroup < (this.state._animGroups?.length || 0)) {
      this.runGroupAt(nextGroup);
    } else {
      this.allLayersDone();
    }
  }

  public allLayersDone() {
    this.state._activeSlots = [];
    this.state._currentSlot = null;
    this.state._slotMode = false;
    window.ctx = window._mainCtx;

    if (window.ctx && this.state.bgCanvas) {
      window.ctx.drawImage(this.state.bgCanvas, 0, 0);
    }
    if (window.hctx) {
      window.hctx.clearRect(0, 0, this.state.canvasW, this.state.canvasH);
    }

    window.setProgress(1);

    if (this.playbackMode === 'all' && this.multiScenes.length > 0) {
      if (this.currentSceneIndex < this.multiScenes.length - 1) {
        this.advanceToNextSceneWithTransition();
        return;
      } else {
        // Montage finished all scenes
        this.state.playing = false;
        this.state.done = true;
        this.onPlayingChangeCallback?.(false);
        this.onCompleteCallback?.();
        this.onAllScenesCompleteCallback?.();
        return;
      }
    }

    this.state.playing = false;
    this.state.done = true;
    this.onPlayingChangeCallback?.(false);
    this.onCompleteCallback?.();
  }

  public playAllScenes(scenes: Scene[], startIndex = 0) {
    if (scenes.length === 0) return;
    this.stop();
    this.multiScenes = scenes;
    this.playbackMode = 'all';
    this.currentSceneIndex = Math.min(Math.max(startIndex, 0), scenes.length - 1);
    this.isTransitioning = false;
    this.startSceneAt(this.currentSceneIndex);
  }

  public startSceneAt(idx: number) {
    if (idx >= this.multiScenes.length) {
      this.allLayersDone();
      return;
    }

    this.currentSceneIndex = idx;
    this.onSceneChangeCallback?.(idx);

    const sc = this.multiScenes[idx];
    this.state.canvasBg = sc.canvasBg || { type: 'solid', val: '#ffffff' };
    this.state.animStyle = sc.animStyle || 'chunkjump';
    this.state.hand = sc.hand || 'custom1';
    this.state.zigzag = sc.zigzag ?? true;
    this.state.speed = sc.speed ?? 40;
    this.state.handSpeed = sc.handSpeed ?? 6;

    if (!sc.layers || sc.layers.length === 0) {
      // Empty scene: draw static background, hold for pause, then advance
      this.state.layers = [];
      this.redrawStatic([], null);
      this.state.playing = true;
      this.onPlayingChangeCallback?.(true);

      const overall = (idx + 1) / this.multiScenes.length;
      this.onTotalProgressCallback?.(overall);

      this.transitionTimer = setTimeout(() => {
        if (this.state.playing && this.playbackMode === 'all') {
          this.advanceToNextSceneWithTransition();
        }
      }, 1000);
      return;
    }

    this.generate(sc.layers);
  }

  private advanceToNextSceneWithTransition() {
    if (this.currentSceneIndex >= this.multiScenes.length - 1) {
      this.allLayersDone();
      return;
    }

    this.isTransitioning = true;
    const curScene = this.multiScenes[this.currentSceneIndex];
    const nextScene = this.multiScenes[this.currentSceneIndex + 1];
    const trans = curScene.transition || { type: 'erase', durationSec: 1.5, pauseSec: 0.5 };
    const pauseMs = Math.max(0, (trans.pauseSec ?? 0.5) * 1000);

    // Initial pause holding completed scene
    this.transitionTimer = setTimeout(() => {
      if (!this.state.playing && this.playbackMode !== 'all') return;

      const finishTransition = () => {
        this.isTransitioning = false;
        if (window.hctx) {
          window.hctx.clearRect(0, 0, this.state.canvasW, this.state.canvasH);
        }
        this.startSceneAt(this.currentSceneIndex + 1);
      };

      if (trans.type === 'erase') {
        this.runEraserTransition(curScene, nextScene, trans.durationSec ?? 1.5, finishTransition);
      } else if (trans.type === 'crossfade') {
        this.runCrossfadeTransition(curScene, nextScene, trans.durationSec ?? 1.2, finishTransition);
      } else {
        // 'cut' transition: clean clear and proceed
        if (window.ctx) {
          renderBackground(
            window.ctx,
            this.state.canvasW,
            this.state.canvasH,
            nextScene.canvasBg || { type: 'solid', val: '#ffffff' },
            null,
            false
          );
        }
        finishTransition();
      }
    }, pauseMs);
  }

  private runEraserTransition(
    curScene: Scene,
    nextScene: Scene,
    durationSec: number,
    onComplete: () => void
  ) {
    if (!this.mainCanvas || !window.ctx || !this.handCanvas || !window.hctx) {
      onComplete();
      return;
    }

    const W = this.state.canvasW;
    const H = this.state.canvasH;
    const ctx = window.ctx;
    const hctx = window.hctx;

    // Snapshot of completed previous scene
    const snap = document.createElement('canvas');
    snap.width = W;
    snap.height = H;
    const sctx = snap.getContext('2d')!;
    sctx.drawImage(this.mainCanvas, 0, 0);

    const startTime = performance.now();
    const durationMs = Math.max(500, durationSec * 1000);
    const eraseRadius = 80 * window.resScale();

    // Eraser wipe motion parameters (back & forth zig-zag)
    const totalSwings = 8;
    let prevX: number | null = null;
    let prevY: number | null = null;

    const tickEraser = (now: number) => {
      if (!this.state.playing && this.playbackMode !== 'all') return;

      const elapsed = now - startTime;
      const t = Math.min(elapsed / durationMs, 1);

      // Y moves from top to bottom
      const ey = -20 + t * (H + 60);
      // X swings sinusoidally across the canvas
      const swingPhase = t * Math.PI * totalSwings;
      const ex = W / 2 + Math.sin(swingPhase) * (W * 0.44);
      const angle = Math.cos(swingPhase) * 0.22;

      if (prevX === null) {
        prevX = ex;
        prevY = ey;
      }

      // Erase on snapshot canvas
      sctx.save();
      sctx.globalCompositeOperation = 'destination-out';
      sctx.beginPath();
      sctx.arc(ex, ey, eraseRadius, 0, Math.PI * 2);
      sctx.fill();
      sctx.lineWidth = eraseRadius * 2;
      sctx.lineCap = 'round';
      sctx.beginPath();
      sctx.moveTo(prevX, prevY);
      sctx.lineTo(ex, ey);
      sctx.stroke();

      // Everything well above current Y is guaranteed erased
      const clearH = Math.max(0, ey - eraseRadius - 20);
      if (clearH > 0) {
        sctx.clearRect(0, 0, W, clearH);
      }
      sctx.restore();

      prevX = ex;
      prevY = ey;

      // Draw nextScene background on mainCanvas
      renderBackground(
        ctx,
        W,
        H,
        nextScene.canvasBg || { type: 'solid', val: '#ffffff' },
        null,
        false
      );
      // Overlay remaining unerased parts of previous scene
      ctx.drawImage(snap, 0, 0);

      // Draw whiteboard felt eraser + hand on handCanvas
      hctx.clearRect(0, 0, W, H);
      drawWhiteboardEraser(
        hctx,
        ex,
        ey,
        angle,
        W,
        H,
        curScene.hand || this.state.hand || 'custom1'
      );

      // Update total progress during transition
      if (this.multiScenes.length > 0) {
        const overall = (this.currentSceneIndex + 1) / this.multiScenes.length;
        this.onTotalProgressCallback?.(overall);
      }

      if (t < 1) {
        this.transitionRaf = requestAnimationFrame(tickEraser);
      } else {
        // Eraser wipe complete!
        hctx.clearRect(0, 0, W, H);
        renderBackground(
          ctx,
          W,
          H,
          nextScene.canvasBg || { type: 'solid', val: '#ffffff' },
          null,
          false
        );
        onComplete();
      }
    };

    this.transitionRaf = requestAnimationFrame(tickEraser);
  }

  private runCrossfadeTransition(
    curScene: Scene,
    nextScene: Scene,
    durationSec: number,
    onComplete: () => void
  ) {
    if (!this.mainCanvas || !window.ctx) {
      onComplete();
      return;
    }

    const W = this.state.canvasW;
    const H = this.state.canvasH;
    const ctx = window.ctx;

    const snap = document.createElement('canvas');
    snap.width = W;
    snap.height = H;
    const sctx = snap.getContext('2d')!;
    sctx.drawImage(this.mainCanvas, 0, 0);

    const startTime = performance.now();
    const durationMs = Math.max(400, durationSec * 1000);

    const tickFade = (now: number) => {
      if (!this.state.playing && this.playbackMode !== 'all') return;

      const elapsed = now - startTime;
      const t = Math.min(elapsed / durationMs, 1);

      renderBackground(
        ctx,
        W,
        H,
        nextScene.canvasBg || { type: 'solid', val: '#ffffff' },
        null,
        false
      );

      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.drawImage(snap, 0, 0);
      ctx.restore();

      if (window.hctx) {
        window.hctx.clearRect(0, 0, W, H);
      }

      if (t < 1) {
        this.transitionRaf = requestAnimationFrame(tickFade);
      } else {
        renderBackground(
          ctx,
          W,
          H,
          nextScene.canvasBg || { type: 'solid', val: '#ffffff' },
          null,
          false
        );
        onComplete();
      }
    };

    this.transitionRaf = requestAnimationFrame(tickFade);
  }

  public play() {
    if (this.state.done) {
      if (this.playbackMode === 'all' && this.multiScenes.length > 0) {
        this.playAllScenes(this.multiScenes, 0);
      } else {
        this.generate(this.state.layers);
      }
      return;
    }
    this.state.playing = true;
    this.onPlayingChangeCallback?.(true);
    this.tick();
  }

  public pause() {
    this.state.playing = false;
    cancelAnimationFrame(this.state.animFrame);
    if (this.transitionTimer) clearTimeout(this.transitionTimer);
    if (this.transitionRaf) cancelAnimationFrame(this.transitionRaf);
    this.onPlayingChangeCallback?.(false);
  }

  public stop() {
    this.state.playing = false;
    this.state.done = false;
    this.isTransitioning = false;
    cancelAnimationFrame(this.state.animFrame);
    if (this.transitionTimer) clearTimeout(this.transitionTimer);
    if (this.transitionRaf) cancelAnimationFrame(this.transitionRaf);
    this.onPlayingChangeCallback?.(false);
  }

  private tick = () => {
    if (!this.state.playing) return;

    if (this.state._activeSlots && this.state._activeSlots.length > 0) {
      const allDone = this.state._activeSlots.every((s: any) => s.done);
      if (!allDone) {
        window.AnimationEngine?._tickAllSlots?.();
        if (this.state.playing) {
          this.state.animFrame = requestAnimationFrame(this.tick);
        }
        return;
      } else {
        // Group completed
        this.advanceGroup();
        return;
      }
    }

    // Fallback single mode
    if (!window.offscreen) return;
    const speed = 40;
    const eng = window.AnimationEngine;
    if (eng) {
      eng.tickScanner?.(speed);
    }

    if (this.state.playing) {
      this.state.animFrame = requestAnimationFrame(this.tick);
    }
  };
}

export const animator = new AnimationController();
