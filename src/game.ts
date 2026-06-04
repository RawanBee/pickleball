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
  COLOR_BLUE,
  COLOR_ORANGE,
  drawBall,
  drawField,
  drawFinger,
  drawGoalBanner,
  drawParticles,
  drawReferees,
  drawScoreboard,
  drawWinBanner,
  type MatchWinner,
} from "./render";
import { totalCanvasHeight } from "./layout";
import type { FingerState } from "./types";

const WIN_SCORE = 5;

const INACTIVE_FINGER: FingerState = {
  x: 0,
  y: 0,
  velocity: { vx: 0, vy: 0 },
  isActive: false,
};

export type GameApi = {
  resize: (w: number, h: number) => void;
  setFingerFromVideo: (
    samples: HandSample[],
    videoWidth: number,
    videoHeight: number
  ) => void;
  step: (now: number) => void;
  dispose: () => void;
};

function processFingerKick(
  physics: PhysicsHandles,
  finger: FingerState,
  contactFlag: { value: boolean },
  ballOnHalf: boolean
): void {
  if (!finger.isActive) {
    contactFlag.value = false;
    return;
  }
  const ball = physics.ball;
  const onBall = isFingerOnBall(ball, finger.x, finger.y);
  if (onBall && !contactFlag.value && ballOnHalf) {
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
  contactFlag.value = onBall;
  separateBallFromFinger(physics, finger.x, finger.y);
}

export function createGame(
  canvas: HTMLCanvasElement,
  opts: { onGoalSound: () => void }
): GameApi {
  const ctx = canvas.getContext("2d", { alpha: true })!;
  let width = canvas.width;
  let fieldHeight = canvas.height;
  let height = canvas.height;
  let dpr = 1;

  let physics: PhysicsHandles = createPhysics(width, fieldHeight);
  const celebration: CelebrationState = createCelebration();
  const smoothLeft = createFingerSmoother();
  const smoothRight = createFingerSmoother();
  let leftFinger: FingerState = { ...INACTIVE_FINGER };
  let rightFinger: FingerState = { ...INACTIVE_FINGER };

  let lastNow = performance.now();
  let goalGlow = 0;
  const leftContact = { value: false };
  const rightContact = { value: false };
  let sideGoalArmed = true;
  let scoreBlue = 0;
  let scoreOrange = 0;
  let winner: MatchWinner = null;

  function mapSampleToField(s: HandSample, vw: number, vh: number) {
    return {
      x: (s.x / Math.max(1, vw)) * width,
      y: (s.y / Math.max(1, vh)) * fieldHeight,
      active: true as const,
    };
  }

  function setFingerFromVideo(samples: HandSample[], vw: number, vh: number): void {
    const active = samples
      .filter((s) => s.active)
      .map((s) => mapSampleToField(s, vw, vh))
      .sort((a, b) => a.x - b.x);

    if (active.length === 0) {
      leftFinger = smoothLeft({ x: 0, y: 0, active: false });
      rightFinger = smoothRight({ x: 0, y: 0, active: false });
      return;
    }

    if (active.length === 1) {
      const one = active[0]!;
      if (one.x < width / 2) {
        leftFinger = smoothLeft(one);
        rightFinger = smoothRight({ x: 0, y: 0, active: false });
      } else {
        leftFinger = smoothLeft({ x: 0, y: 0, active: false });
        rightFinger = smoothRight(one);
      }
      return;
    }

    const left = active[0]!;
    const right = active[active.length - 1]!;
    leftFinger = smoothLeft(left);
    rightFinger = smoothRight(right);
  }

  function resize(w: number, pitchHeight: number): void {
    width = w;
    fieldHeight = pitchHeight;
    height = totalCanvasHeight(pitchHeight);
    dpr = Math.min(2.5, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${height}px`;
    Matter.World.clear(physics.engine.world, false);
    Matter.Engine.clear(physics.engine);
    physics = createPhysics(w, fieldHeight);
    leftContact.value = false;
    rightContact.value = false;
    sideGoalArmed = true;
  }

  function resetMatch(): void {
    scoreBlue = 0;
    scoreOrange = 0;
    winner = null;
    resetBall(physics.ball, width, fieldHeight);
    sideGoalArmed = true;
    leftContact.value = false;
    rightContact.value = false;
  }

  function step(now: number): void {
    const dt = Math.min(48, now - lastNow);
    lastNow = now;

    const celebrationEnded = updateCelebration(
      celebration,
      dt,
      now,
      width,
      fieldHeight
    );
    if (celebrationEnded && winner) {
      resetMatch();
    }

    if (celebration.active) {
      goalGlow += dt * 0.06;
    } else {
      goalGlow = Math.max(0, goalGlow - dt * 0.02);
    }

    Matter.Engine.update(physics.engine, dt);

    const ball = physics.ball;
    const mid = width / 2;
    const ballOnLeftHalf = ball.position.x < mid;
    const ballOnRightHalf = ball.position.x >= mid;

    processFingerKick(physics, leftFinger, leftContact, ballOnLeftHalf);
    processFingerKick(physics, rightFinger, rightContact, ballOnRightHalf);

    if (!winner) {
      const b = ball.position;
      const side = whichSideGoal(b.x, b.y, width, fieldHeight);
      if (side && sideGoalArmed) {
        if (side === "left") scoreOrange += 1;
        else scoreBlue += 1;

        if (scoreBlue >= WIN_SCORE) winner = "blue";
        else if (scoreOrange >= WIN_SCORE) winner = "orange";

        startCelebration(celebration, b.x, b.y, now, side);
        resetBall(physics.ball, width, fieldHeight);
        opts.onGoalSound();
        sideGoalArmed = false;
      }
      const b2 = physics.ball.position;
      if (!whichSideGoal(b2.x, b2.y, width, fieldHeight)) {
        sideGoalArmed = true;
      }
    }

    drawField(ctx, width, fieldHeight, height, celebration.shake, dpr);
    drawReferees(ctx, width, height, celebration, now);
    drawScoreboard(ctx, width, height, scoreBlue, scoreOrange);
    drawBall(ctx, physics.ball, celebration.active ? goalGlow : 0);
    drawFinger(ctx, leftFinger, COLOR_BLUE);
    drawFinger(ctx, rightFinger, COLOR_ORANGE);
    drawParticles(ctx, celebration);
    drawGoalBanner(ctx, width, fieldHeight, celebration, now);
    drawWinBanner(ctx, width, fieldHeight, winner, celebration, now);
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
