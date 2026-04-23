import Matter from "matter-js";
import {
  createCelebration,
  resetBall,
  startCelebration,
  updateCelebration,
  type CelebrationState,
} from "./celebration";
import { whichSideGoal } from "./goals";
import { createFingerSmoother, shotDeltaForTouch } from "./fingerInput";
import type { HandSample } from "./handTracking";
import {
  applyTouchImpulse,
  createPhysics,
  isFingerOnBall,
  separateBallFromFinger,
  type PhysicsHandles,
} from "./physicsWorld";
import {
  drawBall,
  drawField,
  drawFinger,
  drawGoalBanner,
  drawParticles,
} from "./render";
import type { FingerState } from "./types";

export type GameApi = {
  resize: (w: number, h: number) => void;
  setFingerFromVideo: (s: HandSample, videoWidth: number, videoHeight: number) => void;
  step: (now: number) => void;
  dispose: () => void;
};

export function createGame(
  canvas: HTMLCanvasElement,
  opts: { onGoalSound: () => void }
): GameApi {
  const ctx = canvas.getContext("2d")!;
  let width = canvas.width;
  let height = canvas.height;

  let physics: PhysicsHandles = createPhysics(width, height);
  const celebration: CelebrationState = createCelebration();
  const smoothFinger = createFingerSmoother();
  let finger: FingerState = {
    x: 0,
    y: 0,
    velocity: { vx: 0, vy: 0 },
    isActive: false,
  };

  let lastNow = performance.now();
  let goalGlow = 0;
  /** True while finger overlaps ball; reset when overlap ends — next overlap = new shot. */
  let fingerBallContact = false;
  /** After a side goal, false until the ball is no longer in either goal zone (avoid repeat triggers). */
  let sideGoalArmed = true;

  function setFingerFromVideo(s: HandSample, vw: number, vh: number): void {
    if (!s.active) {
      finger = smoothFinger({ x: 0, y: 0, active: false });
      return;
    }
    const sx = (s.x / Math.max(1, vw)) * width;
    const sy = (s.y / Math.max(1, vh)) * height;
    finger = smoothFinger({ x: sx, y: sy, active: true });
  }

  function resize(w: number, h: number): void {
    width = w;
    height = h;
    canvas.width = w;
    canvas.height = h;
    Matter.World.clear(physics.engine.world, false);
    Matter.Engine.clear(physics.engine);
    physics = createPhysics(w, h);
    fingerBallContact = false;
    sideGoalArmed = true;
  }

  function step(now: number): void {
    const dt = Math.min(48, now - lastNow);
    lastNow = now;

    updateCelebration(celebration, dt, now, width, height);
    if (celebration.active) {
      goalGlow += dt * 0.06;
    } else {
      goalGlow = Math.max(0, goalGlow - dt * 0.02);
    }

    Matter.Engine.update(physics.engine, dt);

    if (finger.isActive) {
      const ball = physics.ball;
      const onBall = isFingerOnBall(ball, finger.x, finger.y);
      if (onBall && !fingerBallContact) {
        const impulse = shotDeltaForTouch(
          finger.velocity.vx,
          finger.velocity.vy,
          finger.x,
          finger.y,
          ball.position.x,
          ball.position.y
        );
        applyTouchImpulse(physics, impulse);
      }
      fingerBallContact = onBall;
      separateBallFromFinger(physics, finger.x, finger.y);
    } else {
      fingerBallContact = false;
    }

    const b = physics.ball.position;
    const side = whichSideGoal(b.x, b.y, width, height);
    if (side && sideGoalArmed) {
      startCelebration(celebration, b.x, b.y, now);
      resetBall(physics.ball, width, height);
      opts.onGoalSound();
      sideGoalArmed = false;
    }
    const b2 = physics.ball.position;
    if (!whichSideGoal(b2.x, b2.y, width, height)) {
      sideGoalArmed = true;
    }

    drawField(ctx, width, height, celebration.shake);
    drawBall(ctx, physics.ball, celebration.active ? goalGlow : 0);
    drawFinger(ctx, finger);
    drawParticles(ctx, celebration);
    drawGoalBanner(ctx, width, height, celebration, now);
  }

  return {
    resize,
    setFingerFromVideo,
    step,
    dispose: () => {
      Matter.World.clear(physics.engine.world, false);
      Matter.Engine.clear(physics.engine);
    },
  };
}
