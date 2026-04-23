import Matter from "matter-js";
import { getBallTexture, isBallTextureReady } from "./ballTexture";
import type { CelebrationState } from "./celebration";
import { GOAL_OPENING_HALF } from "./goals";
import { BALL_R } from "./physicsWorld";
import type { FingerState } from "./types";

export function drawField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  shake: number
): void {
  const ox = (Math.random() - 0.5) * shake;
  const oy = (Math.random() - 0.5) * shake;
  ctx.setTransform(1, 0, 0, 1, ox, oy);

  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, "#1a4d2e");
  g.addColorStop(1, "#0f331f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  const step = 48;
  for (let x = 0; x <= width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  ctx.beginPath();
  ctx.moveTo(width / 2, 16);
  ctx.lineTo(width / 2, height - 16);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 64, 0, Math.PI * 2);
  ctx.stroke();

  const y0 = height / 2 - GOAL_OPENING_HALF;
  const y1 = height / 2 + GOAL_OPENING_HALF;
  const postXL = 12;
  const postXR = width - 12;
  const edgeIn = 4;
  const pad = 20;

  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(postXL, pad);
  ctx.lineTo(postXL, y0);
  ctx.moveTo(postXL, y1);
  ctx.lineTo(postXL, height - pad);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(edgeIn, y0);
  ctx.lineTo(postXL + 8, y0);
  ctx.moveTo(edgeIn, y1);
  ctx.lineTo(postXL + 8, y1);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(postXR, pad);
  ctx.lineTo(postXR, y0);
  ctx.moveTo(postXR, y1);
  ctx.lineTo(postXR, height - pad);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(width - edgeIn, y0);
  ctx.lineTo(postXR - 8, y0);
  ctx.moveTo(width - edgeIn, y1);
  ctx.lineTo(postXR - 8, y1);
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(0, y0, 26, y1 - y0);
  ctx.fillRect(width - 26, y0, 26, y1 - y0);
}

export function drawBall(
  ctx: CanvasRenderingContext2D,
  ball: Matter.Body,
  goalGlow: number
): void {
  const { x, y } = ball.position;
  const ang = ball.angle;

  const pulse = goalGlow > 0 ? 1 + 0.08 * Math.sin(goalGlow * 0.02) : 1;
  const r = BALL_R * pulse;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  if (isBallTextureReady()) {
    ctx.drawImage(getBallTexture(), -r, -r, r * 2, r * 2);
  } else {
    const grd = ctx.createRadialGradient(-6, -6, 4, 0, 0, r);
    grd.addColorStop(0, "#fff8e7");
    grd.addColorStop(0.35, "#f4d03f");
    grd.addColorStop(1, "#b7950b");
    ctx.fillStyle = grd;
    ctx.fillRect(-r, -r, r * 2, r * 2);
  }
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  if (goalGlow > 0) {
    ctx.shadowColor = "rgba(255, 230, 140, 0.75)";
    ctx.shadowBlur = 18;
  }
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function drawFinger(
  ctx: CanvasRenderingContext2D,
  finger: FingerState | null
): void {
  if (!finger?.isActive) return;
  ctx.save();
  ctx.fillStyle = "rgba(120, 220, 255, 0.35)";
  ctx.strokeStyle = "rgba(200, 250, 255, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(finger.x, finger.y, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  celebration: CelebrationState
): void {
  for (const p of celebration.particles) {
    ctx.fillStyle = `hsla(${p.hue}, 85%, 58%, ${Math.max(0, p.life)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4 + (1 - p.life) * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawGoalBanner(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  celebration: CelebrationState,
  now: number
): void {
  if (!celebration.active) return;
  const t = celebration.until - now;
  if (t > 1800) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, height * 0.35, width, 90);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 42px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GOAL!", width / 2, height * 0.35 + 58);
    ctx.restore();
  }
}
