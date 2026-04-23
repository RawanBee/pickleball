import Matter from "matter-js";

type Particle = { x: number; y: number; vx: number; vy: number; life: number; hue: number };

export type CelebrationState = {
  active: boolean;
  until: number;
  particles: Particle[];
  shake: number;
};

const DURATION_MS = 2200;

export function createCelebration(): CelebrationState {
  return { active: false, until: 0, particles: [], shake: 0 };
}

export function startCelebration(
  state: CelebrationState,
  centerX: number,
  centerY: number,
  now: number
): void {
  state.active = true;
  state.until = now + DURATION_MS;
  state.shake = 14;
  state.particles = [];
  for (let i = 0; i < 90; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 3 + Math.random() * 9;
    state.particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0.8 + Math.random() * 0.6,
      hue: Math.random() * 60 + 110,
    });
  }
}

export function updateCelebration(
  state: CelebrationState,
  dt: number,
  now: number,
  width: number,
  height: number
): boolean {
  if (!state.active) return false;

  state.shake *= 0.88;

  for (const p of state.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.life -= dt * 0.001;
  }
  state.particles = state.particles.filter((p) => p.life > 0);

  if (now >= state.until) {
    state.active = false;
    state.particles = [];
    state.shake = 0;
    return true;
  }

  void width;
  void height;
  return false;
}

export function resetBall(ball: Matter.Body, width: number, height: number): void {
  Matter.Body.setPosition(ball, { x: width / 2, y: height / 2 });
  Matter.Body.setVelocity(ball, { x: 0, y: 0 });
  Matter.Body.setAngularVelocity(ball, 0);
}

