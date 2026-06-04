export type CameraPreviewsApi = {
  update: () => void;
};

function syncPreviewAspect(canvas: HTMLCanvasElement, video: HTMLVideoElement): void {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (vw > 0 && vh > 0) {
    canvas.style.aspectRatio = `${vw / 2} / ${vh}`;
  }
}

function drawHalf(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  sx: number,
  sWidth: number
): void {
  syncPreviewAspect(canvas, video);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (cssW < 1 || cssH < 1) return;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const bufW = Math.round(cssW * dpr);
  const bufH = Math.round(cssH * dpr);
  if (canvas.width !== bufW || canvas.height !== bufH) {
    canvas.width = bufW;
    canvas.height = bufH;
  }

  const videoH = video.videoHeight || 480;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.save();
  ctx.translate(cssW, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, sx, 0, sWidth, videoH, 0, 0, cssW, cssH);
  ctx.restore();
}

export function createCameraPreviews(
  video: HTMLVideoElement,
  leftPanel: HTMLElement,
  rightPanel: HTMLElement
): CameraPreviewsApi {
  const leftCanvas = leftPanel.querySelector("canvas") as HTMLCanvasElement;
  const rightCanvas = rightPanel.querySelector("canvas") as HTMLCanvasElement;

  function update(): void {
    if (video.readyState < 2) return;

    const videoW = video.videoWidth || 640;
    const halfW = videoW / 2;

    drawHalf(leftCanvas, video, halfW, halfW);
    drawHalf(rightCanvas, video, 0, halfW);
  }

  return { update };
}
