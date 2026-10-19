# ✏️ Inkplainer (React)

**Free, open-source whiteboard animation maker rewritten in React + TypeScript + Vite.**

Turn images and text into hand-drawn explainer videos with multiple animation styles, layer editing, and video export. Runs entirely in your browser with local IndexedDB persistence.

## Features

- **Multiple animation styles** — Chunk Jump, Scanner, Contour, Outline Chunks, plus 7 subject-aware Specialized styles (Human, Animal, Portrait, Vehicle, Building, Landscape, Spiral)
- **Advanced drawing control** — 5 stroke styles (Default, Charcoal, Sketch, Fountain, Blueprint), 4 outline detection algorithms (Classic, Adaptive, Morph Shell, Canny+), 3 coloring styles, and image reveal animations
- **Layer system** — stack images and text layers, set animation order, animate them in sequence or in parallel
- **Smooth, adjustable hand movement** — continuous hand gliding across the canvas with toggleable speed and styles
- **Slicer tool** — cut any image into regions using Grid or Custom Rectangles; each region becomes its own independently animated layer
- **Text layers** — place styled text directly on the canvas with font picker, size, bold/italic, alignment, line-height, letter spacing, and color swatches
- **Export as MP4 or WebM** — record and download at 720p, 1080p, or 1440p; also export still PNG frame
- **Auto-save projects** — browser IndexedDB storage with project list and auto-save indicator
- **Private by design** — all processing happens locally on your device

## Development & Build

```bash
# Start development server
npm run dev

# Type check
npm run lint

# Build for production
npm run build
```

## License

Apache 2.0 — see [LICENSE](LICENSE) for details.
