export interface TextProps {
  text: string;
  font: string;
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
}

export interface Layer {
  id: number;
  name: string;
  img: HTMLImageElement | HTMLCanvasElement;
  imageDataURL?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  baseW: number;
  baseH: number;
  resizePct: number;
  animStyle: string;
  hand: string;
  animOrder: number | null;
  opacity: number;
  visible: boolean;
  groupId: string | null;
  speed: number;
  handSpeed: number;
  chunks: number;
  specChunks: number;
  hasPngAlpha: boolean;
  kind?: 'image' | 'text';
  textProps?: TextProps;
  outlineDetect?: number;
  outlineAlgorithm?: string;
  outlineStrokeStyle?: string;
  colorStyle?: string;
  outlineColor?: string;
  outlineThickness?: number;
  textAnimDir?: string;
  textDrawStyle?: string;
  zigzag?: boolean;
}

export interface LayerGroup {
  id: string;
  name: string;
  layerIds: number[];
  collapsed: boolean;
  visible: boolean;
}

export interface BgSetting {
  type: 'solid' | 'gradient' | 'custom';
  val?: string;
  key?: string;
}

export interface SceneTransition {
  type: 'cut' | 'erase' | 'crossfade';
  durationSec: number;
  pauseSec: number;
}

export interface Scene {
  id: string;
  name: string;
  layers: Layer[];
  canvasBg: BgSetting;
  animStyle: string;
  hand: string;
  zigzag?: boolean;
  speed?: number;
  handSpeed?: number;
  transition: SceneTransition;
  thumbnailDataURL?: string;
}

export interface ProjectState {
  canvasW: number;
  canvasH: number;
  canvasBg: BgSetting;
  _currentRatio: string;
  _currentRes: string;
  layers: any[];
  selectedLayerId: number | null;
  groups: LayerGroup[];
  animStyle: string;
  hand: string;
  zigzag: boolean;
  outlineDetect: number;
  outlineAlgorithm: string;
  outlineStrokeStyle: string;
  colorStyle: string;
  scenes?: any[];
  activeSceneId?: string;
}

export interface Project {
  id?: number;
  name: string;
  createdAt: string;
  modifiedAt: string;
  state: ProjectState;
}

export interface Preset {
  id: string;
  name: string;
  builtIn: boolean;
  style: string;
  hand: string;
  stroke: string;
  colorStyle: string;
  detectAlg: string;
  detectSens: number;
  desc?: string;
}
