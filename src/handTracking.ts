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
    numHands: 2,
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
  let lastSamples: HandSample[] = [];

  function detect(): HandSample[] {
    if (video.readyState < 2) {
      lastSamples = [];
      return lastSamples;
    }

    const nowMs = performance.now();
    if (nowMs - lastDetectMs < TRACK_INTERVAL_MS) {
      return lastSamples;
    }
    lastDetectMs = nowMs;

    const ts = video.currentTime * 1000;
    if (ts === lastTs) {
      return lastSamples;
    }
    lastTs = ts;

    let result: HandLandmarkerResult;
    try {
      result = landmarker.detectForVideo(video, ts);
    } catch {
      lastSamples = [];
      return lastSamples;
    }

    if (!result.landmarks?.length) {
      lastSamples = [];
      return lastSamples;
    }

    const w = video.videoWidth || 1;
    const h = video.videoHeight || 1;
    const samples: HandSample[] = [];
    for (const hand of result.landmarks) {
      const tip = hand[INDEX_TIP];
      const mirroredX = (1 - tip.x) * w;
      const y = tip.y * h;
      samples.push({ x: mirroredX, y, active: true });
    }
    lastSamples = samples;
    return lastSamples;
  }

  return { detect, dispose: () => landmarker.close() };
}
