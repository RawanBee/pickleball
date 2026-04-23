import Matter from "matter-js";

const { Engine, World, Bodies, Body } = Matter;

export type PhysicsHandles = {
  engine: Matter.Engine;
  ball: Matter.Body;
  wallThickness: number;
};

const BALL_R = 22;
const FINGER_R = 36;
/** Same overlap band as kicks — finger “touches” the ball inside this distance. */
const TOUCH_DIST = BALL_R + FINGER_R * 0.85;

export function createPhysics(width: number, height: number): PhysicsHandles {
  const engine = Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
  const world = engine.world;

  const t = 80;
  const walls = [
    Bodies.rectangle(width / 2, -t / 2, width + t * 2, t, { isStatic: true }),
    Bodies.rectangle(width / 2, height + t / 2, width + t * 2, t, { isStatic: true }),
    Bodies.rectangle(-t / 2, height / 2, t, height + t * 2, { isStatic: true }),
    Bodies.rectangle(width + t / 2, height / 2, t, height + t * 2, { isStatic: true }),
  ];

  const ball = Bodies.circle(width / 2, height / 2, BALL_R, {
    restitution: 0.92,
    friction: 0,
    frictionAir: 0,
    density: 0.0012,
    label: "ball",
    slop: 0.02,
  });

  Body.setVelocity(ball, { x: 0, y: 0 });

  World.add(world, [...walls, ball]);

  return {
    engine,
    ball,
    wallThickness: t,
  };
}

export function isFingerOnBall(
  ball: Matter.Body,
  fingerX: number,
  fingerY: number
): boolean {
  const dist = Matter.Vector.magnitude(
    Matter.Vector.sub(ball.position, { x: fingerX, y: fingerY })
  );
  return dist <= TOUCH_DIST;
}

/** One-shot impulse when a touch is registered (caller handles edge detection). */
export function applyTouchImpulse(
  handles: PhysicsHandles,
  deltaV: { x: number; y: number }
): void {
  const { ball } = handles;
  Body.setVelocity(ball, {
    x: ball.velocity.x + deltaV.x,
    y: ball.velocity.y + deltaV.y,
  });
}

export function separateBallFromFinger(
  handles: PhysicsHandles,
  fingerX: number,
  fingerY: number
): void {
  const { ball } = handles;
  const delta = Matter.Vector.sub(ball.position, { x: fingerX, y: fingerY });
  const dist = Matter.Vector.magnitude(delta);
  const min = BALL_R + FINGER_R * 0.9;
  if (dist > 0 && dist < min) {
    const n = Matter.Vector.normalise(delta);
    const push = Matter.Vector.mult(n, min - dist + 0.5);
    Body.setPosition(ball, Matter.Vector.add(ball.position, push));
  }
}

export { BALL_R, FINGER_R };
