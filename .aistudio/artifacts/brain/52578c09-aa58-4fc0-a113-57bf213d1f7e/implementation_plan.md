# Multi-Scene Timeline & Video Montage System

Add an interactive bottom timeline filmstrip supporting multiple whiteboard scenes, continuous sequential playback with configurable transitions (cut, pause, whiteboard erase animation), and seamless multi-scene video export into a single consolidated file or individual scene clips.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your confirmed preferences in Phase 1:
> - **Scene Transitions**: Default to Cut with optional pause duration and realistic whiteboard eraser transition (hand wiping the whiteboard clean before beginning the next scene).
> - **Timeline Placement**: Bottom interactive filmstrip integrated above the bottom control bar with live visual scene thumbnails, drag-and-drop reordering, and scene management.
> - **Export Capability**: Support exporting the entire multi-scene animation as a single consolidated video (MP4 / WebM) as well as downloading individual scene video clips.

---

## 1. Overview & Core Concept

Currently, Inkplainer only animates a single canvas scene at a time. In real explainer video workflows, creators need to tell a sequential story across multiple storyboard scenes (e.g., Scene 1: Problem statement -> Scene 2: Solution diagram -> Scene 3: Feature breakdown -> Scene 4: Call to action).

This feature introduces a full **Multi-Scene Storyboard & Timeline Engine**:
- **Scene Model**: Each scene maintains its own independent collection of layers, background canvas texture, animation style, and transition settings.
- **Interactive Filmstrip Timeline**: Positioned above the bottom settings bar with cards for each scene, showing a rendered thumbnail, scene title, layer count, duration, and transition selector.
- **Playback Orchestration**: Allows playing the active scene or seamlessly previewing all scenes in sequence, honoring inter-scene pauses and whiteboard hand-erasing transitions.
- **Unified Video Exporter**: Records all scenes back-to-back into one continuous MP4/WebM file, with an option to download each scene separately.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Scene Management in Timeline**:
   - The user sees a sleek horizontal filmstrip timeline above the bottom controls.
   - Click `+ Add Scene` to append a new blank whiteboard scene or `Duplicate` to clone the current scene and its layers.
   - Click any scene card to switch the main canvas viewport to that scene instantly.
   - Drag or use quick arrow controls to reorder scenes (Scene 1, Scene 2, Scene 3).

2. **Transition & Scene Timing Settings**:
   - Each scene card or transition separator displays a transition chip: **Cut**, **Whiteboard Erase**, or **Crossfade**, plus a **Pause Duration** slider (0s to 5s).
   - "Whiteboard Erase" animates a whiteboard eraser tool wiping the canvas clean before starting the next scene, providing the classic explainer video aesthetic.

3. **Multi-Scene Playback**:
   - In the playbar, the user can toggle between **"Play Active Scene"** and **"Play All Scenes"**.
   - During "Play All Scenes", the master progress bar tracks total timeline progress across all scenes, automatically advancing the active scene card and transitioning smoothly.

4. **Consolidated Video Export**:
   - Open **Export Video** modal to choose between **"Export All Scenes (Single Video)"** or **"Export Current Scene"**.
   - The recorder plays and records each scene sequentially with transitions rendered live into the video canvas, producing a single downloaded `.webm` or `.mp4` file.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Scene Data Independence vs Global Canvas Settings**
  - *Chosen Approach*: Aspect ratio and resolution (e.g. 16:9 1080p) are project-global so all scenes match video dimensions. Layer configurations, drawings, and canvas backgrounds can vary per scene.
  - *Why*: Ensures seamless video export without resolution or aspect ratio jumps while giving full creative freedom per scene.

- **Decision 2: Whiteboard Erase Transition Implementation**
  - *Chosen Approach*: Procedural eraser wipe using `erase` canvas composite operation with back-and-forth wiping paths and eraser hand sprite.
  - *Why*: Authentic to whiteboard explainer video software (VideoScribe / Doodly) while running fast at 60fps in browser canvas.

- **Decision 3: IndexedDB Multi-Scene Storage**
  - *Chosen Approach*: Extend the existing `ProjectState` schema to hold `scenes: Scene[]` and `activeSceneId: string`. For backwards compatibility, legacy projects with single-scene `layers` automatically migrate to `scenes[0]` on load.
  - *Why*: Prevents breaking existing user projects while supporting unlimited scenes.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              APP STATE                                  │
│  - project: { id, name, ratio, res, scenes: Scene[], activeSceneId }   │
│  - playbackMode: 'single' | 'all'                                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────┐                         ┌───────────────────────┐
│   TIMELINE FILMSTRIP  │                         │      CANVAS AREA      │
│ - Scene Cards & Order │                         │ - Active Scene Layers │
│ - Transition Chips    │                         │ - Interactive Handles │
│ - Add / Clone / Delete│                         │ - Text / Image Tool   │
└──────────┬────────────┘                         └───────────┬───────────┘
           │                                                  │
           └────────────────────────┬─────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   MULTI-SCENE ANIMATION CONTROLLER                      │
│ - Scene Sequence Runner (pre-render -> tick scene -> transition -> next)│
│ - Whiteboard Erase Transition Engine                                   │
│ - Multi-Scene Video Recorder (WebM & MP4 WebCodecs)                     │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model

```ts
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
  transition: SceneTransition;
}

export interface ProjectState {
  canvasW: number;
  canvasH: number;
  _currentRatio: '16:9' | '9:16' | '1:1';
  _currentRes: '720' | '1080' | '1440';
  scenes: Scene[];
  activeSceneId: string;
}
```
