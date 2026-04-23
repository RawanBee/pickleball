import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

const INDEX_TIP = 8;

export type HandSample = { x: number; y: number; active: boolean };

async function makeLandmarker(delegate: "GPU" | "CPU") {
  const wasm =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
  const vision = await FilesetResolver.forVisionTasks(wasm);
  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate,
    },
    runningMode: "VIDEO",
    numHands: 1,
  });
}

export async function createHandTracker(video: HTMLVideoElement) {
  let landmarker: HandLandmarker;
  try {
    landmarker = await makeLandmarker("GPU");
  } catch {
    landmarker = await makeLandmarker("CPU");
  }

  let lastTs = -1;
  let lastDetectMs = 0;
  const TRACK_INTERVAL_MS = 1000 / 30;
  let lastSample: HandSample = { x: 0, y: 0, active: false };

  function detect(): HandSample {
    if (video.readyState < 2) {
      lastSample = { x: 0, y: 0, active: false };
      return lastSample;
    }

    const nowMs = performance.now();
    if (nowMs - lastDetectMs < TRACK_INTERVAL_MS) {
      return lastSample;
    }
    lastDetectMs = nowMs;

    const ts = video.currentTime * 1000;
    if (ts === lastTs) {
      return lastSample;
    }
    lastTs = ts;

    let result: HandLandmarkerResult;
    try {
      result = landmarker.detectForVideo(video, ts);
    } catch {
      lastSample = { x: 0, y: 0, active: false };
      return lastSample;
    }

    if (!result.landmarks?.length) {
      lastSample = { x: 0, y: 0, active: false };
      return lastSample;
    }

    const tip = result.landmarks[0][INDEX_TIP];
    const w = video.videoWidth || 1;
    const h = video.videoHeight || 1;
    const mirroredX = (1 - tip.x) * w;
    const y = tip.y * h;

    lastSample = { x: mirroredX, y, active: true };
    return lastSample;
  }

  return { detect, dispose: () => landmarker.close() };
}
