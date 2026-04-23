import "./style.css";
import { createGame } from "./game";
import { createHandTracker } from "./handTracking";

void bootstrap();

async function bootstrap() {
  const canvas = document.getElementById("game") as HTMLCanvasElement;
  const video = document.getElementById("cam") as HTMLVideoElement;
  const statusEl = document.getElementById("status");

  function setStatus(text: string) {
    if (statusEl) statusEl.textContent = text;
  }

  let audioCtx: AudioContext | null = null;

  function playGoalSound() {
    try {
      audioCtx ??= new AudioContext();
      const ctx = audioCtx;
      const t0 = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);

      for (let i = 0; i < 18; i++) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const f = 280 + Math.random() * 520;
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(f, t0 + i * 0.03);
        g.gain.setValueAtTime(0.0001, t0 + i * 0.03);
        g.gain.exponentialRampToValueAtTime(0.12, t0 + i * 0.03 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.03 + 0.18);
        osc.connect(g);
        g.connect(master);
        osc.start(t0 + i * 0.03);
        osc.stop(t0 + i * 0.03 + 0.2);
      }
    } catch {
      /* ignore */
    }
  }

  const game = createGame(canvas, { onGoalSound: playGoalSound });

  function fitCanvas() {
    const wrap = canvas.parentElement!;
    const maxW = wrap.clientWidth;
    const aspect = 16 / 9;
    const w = Math.min(960, maxW);
    const h = Math.round(w / aspect);
    game.resize(w, h);
  }

  fitCanvas();
  window.addEventListener("resize", fitCanvas);

  async function startCamera() {
    setStatus("Requesting camera…");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    setStatus("Loading hand model…");
  }

  try {
    await startCamera();
  } catch (e) {
    setStatus(
      e instanceof Error ? `Camera error: ${e.message}` : "Camera unavailable"
    );
    return;
  }

  let tracker: Awaited<ReturnType<typeof createHandTracker>>;
  try {
    tracker = await createHandTracker(video);
  } catch (e) {
    setStatus(
      e instanceof Error ? `Hand model error: ${e.message}` : "Hand model failed"
    );
    return;
  }

  setStatus("Show your hand — index finger kicks the ball");

  let raf = 0;
  function loop(t: number) {
    const sample = tracker.detect();
    game.setFingerFromVideo(sample, video.videoWidth, video.videoHeight);
    game.step(t);
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  window.addEventListener("beforeunload", () => {
    cancelAnimationFrame(raf);
    tracker.dispose();
    game.dispose();
    const stream = video.srcObject as MediaStream | null;
    stream?.getTracks().forEach((tr) => tr.stop());
  });
}
