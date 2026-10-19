import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export interface ExportOptions {
  format: 'webm' | 'mp4';
  quality: 'high' | 'medium' | 'low';
  exportPNG: boolean;
  fileNamePrefix?: string;
  onProgress?: (progress: number, statusText: string) => void;
  isCompleteCheck: () => boolean;
  getProgress: () => number;
  triggerRestart: () => void;
}

export function exportCanvasPNG(mainCanvas: HTMLCanvasElement): void {
  const url = mainCanvas.toDataURL('image/png');
  const a = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  a.href = url;
  a.download = `whiteboard-${timestamp}.png`;
  a.click();
}

export async function recordWebMVideo(
  mainCanvas: HTMLCanvasElement,
  handCanvas: HTMLCanvasElement,
  canvasW: number,
  canvasH: number,
  options: ExportOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const qualityMap = { high: 8000000, medium: 4000000, low: 2000000 };
      const bitrate = qualityMap[options.quality] || 4000000;

      const mimes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm;codecs=h264',
        'video/webm',
      ];
      const mime = mimes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';

      const rec = document.createElement('canvas');
      rec.width = canvasW;
      rec.height = canvasH;
      const rctx = rec.getContext('2d');
      if (!rctx) throw new Error('Could not create recorder canvas context');

      const chunks: Blob[] = [];
      const stream = rec.captureStream(30);
      const mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate });

      let isRecording = true;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        a.href = url;
        a.download = `${options.fileNamePrefix || 'whiteboard'}-${timestamp}.webm`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve();
      };

      function syncLoop() {
        if (!isRecording) return;
        rctx.clearRect(0, 0, canvasW, canvasH);
        rctx.drawImage(mainCanvas, 0, 0);
        rctx.drawImage(handCanvas, 0, 0);
        requestAnimationFrame(syncLoop);
      }

      mr.start(100);
      options.onProgress?.(0, 'Recording animation...');
      options.triggerRestart();
      syncLoop();

      const checkInterval = setInterval(() => {
        if (!isRecording) {
          clearInterval(checkInterval);
          return;
        }

        const pct = options.getProgress();
        const done = options.isCompleteCheck();
        options.onProgress?.(pct, done ? 'Finalizing video...' : 'Recording...');

        if (done) {
          clearInterval(checkInterval);
          setTimeout(() => {
            isRecording = false;
            if (mr.state !== 'inactive') {
              mr.stop();
            }
          }, 800);
        }
      }, 200);

    } catch (err) {
      reject(err);
    }
  });
}

export async function recordMP4Video(
  mainCanvas: HTMLCanvasElement,
  handCanvas: HTMLCanvasElement,
  canvasW: number,
  canvasH: number,
  options: ExportOptions
): Promise<void> {
  if (typeof VideoEncoder === 'undefined') {
    throw new Error('WebCodecs is not supported in this browser. Please use WebM export.');
  }

  const qualityMap = { high: 8000000, medium: 4000000, low: 2000000 };
  const bitrate = qualityMap[options.quality] || 4000000;
  const FPS = 30;

  const W = canvasW % 2 === 0 ? canvasW : canvasW + 1;
  const H = canvasH % 2 === 0 ? canvasH : canvasH + 1;

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width: W, height: H },
    fastStart: 'in-memory',
  });

  const isHighRes = W > 1280 || H > 720;
  const h264Codec = isHighRes ? 'avc1.640033' : 'avc1.42001f';

  const encoderConfig: VideoEncoderConfig = {
    codec: h264Codec,
    width: W,
    height: H,
    bitrate,
    framerate: FPS,
    latencyMode: 'quality',
    ...(isHighRes ? { hardwareAcceleration: 'prefer-software' } : {}),
  };

  const support = await VideoEncoder.isConfigSupported(encoderConfig);
  if (!support.supported) {
    throw new Error('H.264 profile not supported by this browser. Please use WebM.');
  }

  const compCanvas = document.createElement('canvas');
  compCanvas.width = W;
  compCanvas.height = H;
  const compCtx = compCanvas.getContext('2d', { alpha: false });
  if (!compCtx) throw new Error('Could not initialize video context');

  let frameIndex = 0;
  let isRecording = true;

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error('VideoEncoder error:', e),
  });

  videoEncoder.configure(encoderConfig);

  options.onProgress?.(0, 'Recording animation...');
  options.triggerRestart();

  const frameIntervalMs = 1000 / FPS;

  return new Promise((resolve, reject) => {
    const captureTimer = setInterval(async () => {
      if (!isRecording) return;

      try {
        compCtx.fillStyle = '#ffffff';
        compCtx.fillRect(0, 0, W, H);
        compCtx.drawImage(mainCanvas, 0, 0);
        compCtx.drawImage(handCanvas, 0, 0);

        const bitmap = await createImageBitmap(compCanvas);
        const timestampMicroseconds = Math.round((frameIndex * 1_000_000) / FPS);
        const keyFrame = frameIndex % (FPS * 2) === 0;

        const videoFrame = new VideoFrame(bitmap, { timestamp: timestampMicroseconds });
        videoEncoder.encode(videoFrame, { keyFrame });
        videoFrame.close();
        bitmap.close();

        frameIndex++;

        const pct = options.getProgress();
        const done = options.isCompleteCheck();
        options.onProgress?.(pct, done ? 'Finalizing MP4...' : 'Encoding frames...');

        if (done && frameIndex > 10) {
          clearInterval(captureTimer);
          isRecording = false;

          options.onProgress?.(1, 'Finalizing MP4 file...');
          await videoEncoder.flush();
          videoEncoder.close();
          muxer.finalize();

          const buffer = target.buffer;
          const blob = new Blob([buffer], { type: 'video/mp4' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const ts = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          a.href = url;
          a.download = `${options.fileNamePrefix || 'whiteboard'}-${ts}.mp4`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);

          resolve();
        }
      } catch (err) {
        clearInterval(captureTimer);
        isRecording = false;
        reject(err);
      }
    }, frameIntervalMs);
  });
}
