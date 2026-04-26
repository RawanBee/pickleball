import "./style.css";
import { createGame } from "./game";
import { createHandTracker } from "./handTracking";
import { HUD_BELOW_PITCH } from "./layout";

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

  /** Pitch is 16:9; canvas adds `HUD_BELOW_PITCH` below the pitch. */
  const PITCH_ASPECT = 16 / 9;
  const MAX_PITCH_W = 1280;

  let fitDebounce = 0;
  let fitRaf = 0;

  function fitCanvas() {
    const wrap = canvas.parentElement;
    if (!wrap) return;

    const vv = window.visualViewport;
    const wrapRect = wrap.getBoundingClientRect();
    const wrapTop = wrapRect.top;
    const marginBottom = 16;
    const visibleBottom =
      vv != null ? vv.offsetTop + vv.height : window.innerHeight;
    const viewportAvail = Math.max(0, visibleBottom - wrapTop - marginBottom);

    const ch = wrap.clientHeight;
    const availH = Math.max(
      80,
      ch >= viewportAvail - 2
        ? Math.min(ch - 8, viewportAvail)
        : viewportAvail
    );

    const cw = wrap.clientWidth;
    const fromHeight =
      Math.max(0, availH - HUD_BELOW_PITCH) * PITCH_ASPECT;

    let pitchW = Math.floor(Math.min(cw, fromHeight, MAX_PITCH_W));
    if (!Number.isFinite(pitchW) || pitchW < 1) pitchW = 1;

    const pitchH = Math.round(pitchW / PITCH_ASPECT);
    game.resize(pitchW, pitchH);
  }

  function scheduleFit() {
    window.clearTimeout(fitDebounce);
    fitDebounce = window.setTimeout(() => {
      cancelAnimationFrame(fitRaf);
      fitRaf = requestAnimationFrame(() => {
        fitCanvas();
        fitRaf = requestAnimationFrame(fitCanvas);
      });
    }, 32);
  }

  function onOrientationChange() {
    scheduleFit();
    window.setTimeout(scheduleFit, 120);
    window.setTimeout(scheduleFit, 340);
  }

  fitCanvas();
  window.addEventListener("resize", scheduleFit);
  window.visualViewport?.addEventListener("resize", scheduleFit);
  window.addEventListener("orientationchange", onOrientationChange);
  window.screen.orientation?.addEventListener("change", onOrientationChange);
  const ro = new ResizeObserver(() => scheduleFit());
  ro.observe(canvas.parentElement!);

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
  scheduleFit();

  let raf = 0;
  function loop(t: number) {
    const sample = tracker.detect();
    game.setFingerFromVideo(sample, video.videoWidth, video.videoHeight);
    game.step(t);
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  window.addEventListener("beforeunload", () => {
    window.clearTimeout(fitDebounce);
    cancelAnimationFrame(fitRaf);
    window.removeEventListener("resize", scheduleFit);
    window.visualViewport?.removeEventListener("resize", scheduleFit);
    window.removeEventListener("orientationchange", onOrientationChange);
    window.screen.orientation?.removeEventListener("change", onOrientationChange);
    ro.disconnect();
    cancelAnimationFrame(raf);
    tracker.dispose();
    game.dispose();
    const stream = video.srcObject as MediaStream | null;
    stream?.getTracks().forEach((tr) => tr.stop());
  });
}
