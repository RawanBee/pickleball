import type { FingerState } from "./types";

const SMOOTH = 0.22;

/** Base exit speed per touch (added to ball velocity). */
const TOUCH_SHOT_BASE = 20;
const TOUCH_FINGER_SPEED_THRESHOLD = 5;
const TOUCH_FINGER_SPEED_BONUS_SCALE = 0.35;
const TOUCH_FINGER_SPEED_BONUS_MAX = 14;

export function createFingerSmoother() {
  let px = 0;
  let py = 0;
  let prevX = 0;
  let prevY = 0;
  let initialized = false;

  return function smooth(raw: { x: number; y: number; active: boolean }): FingerState {
    if (!raw.active) {
      initialized = false;
      return {
        x: raw.x,
        y: raw.y,
        velocity: { vx: 0, vy: 0 },
        isActive: false,
      };
    }

    if (!initialized) {
      px = raw.x;
      py = raw.y;
      prevX = raw.x;
      prevY = raw.y;
      initialized = true;
      return {
        x: px,
        y: py,
        velocity: { vx: 0, vy: 0 },
        isActive: true,
      };
    }

    prevX = px;
    prevY = py;
    px += (raw.x - px) * SMOOTH;
    py += (raw.y - py) * SMOOTH;

    const vx = px - prevX;
    const vy = py - prevY;

    return {
      x: px,
      y: py,
      velocity: { vx, vy },
      isActive: true,
    };
  };
}

/**
 * Impulse for one discrete “touch shot”: direction from finger motion if moving,
 * otherwise from finger => ball (ball pushed away from the finger).
 */
export function shotDeltaForTouch(
  fingerVx: number,
  fingerVy: number,
  fingerX: number,
  fingerY: number,
  ballX: number,
  ballY: number
): { x: number; y: number } {
  const speed = Math.hypot(fingerVx, fingerVy);
  let nx: number;
  let ny: number;
  if (speed >= TOUCH_FINGER_SPEED_THRESHOLD) {
    nx = fingerVx / speed;
    ny = fingerVy / speed;
  } else {
    const dx = ballX - fingerX;
    const dy = ballY - fingerY;
    const d = Math.hypot(dx, dy);
    if (d < 1e-6) {
      nx = 1;
      ny = 0;
    } else {
      nx = dx / d;
      ny = dy / d;
    }
  }
  const bonus =
    speed >= TOUCH_FINGER_SPEED_THRESHOLD
      ? Math.min(speed * TOUCH_FINGER_SPEED_BONUS_SCALE, TOUCH_FINGER_SPEED_BONUS_MAX)
      : 0;
  const mag = TOUCH_SHOT_BASE + bonus;
  return { x: nx * mag, y: ny * mag };
}
