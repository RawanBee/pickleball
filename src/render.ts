import Matter from "matter-js";
import { getBallTexture, isBallTextureReady } from "./ballTexture";
import type { CelebrationState } from "./celebration";
import { GOAL_OPENING_HALF } from "./goals";
import { BALL_R } from "./physicsWorld";
import type { FingerState } from "./types";

export function drawField(
  ctx: CanvasRenderingContext2D,
  width: number,
  fieldHeight: number,
  canvasHeight: number,
  shake: number
): void {
  const ox = (Math.random() - 0.5) * shake;
  const oy = (Math.random() - 0.5) * shake;
  ctx.setTransform(1, 0, 0, 1, ox, oy);

  const fh = fieldHeight;

  const g = ctx.createLinearGradient(0, 0, 0, fh);
  g.addColorStop(0, "#1a4d2e");
  g.addColorStop(1, "#0f331f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, fh);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  const step = 48;
  for (let x = 0; x <= width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, fh);
    ctx.stroke();
  }
  for (let y = 0; y <= fh; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 16, width - 32, fh - 32);

  ctx.beginPath();
  ctx.moveTo(width / 2, 16);
  ctx.lineTo(width / 2, fh - 16);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(width / 2, fh / 2, 64, 0, Math.PI * 2);
  ctx.stroke();

  const y0 = fh / 2 - GOAL_OPENING_HALF;
  const y1 = fh / 2 + GOAL_OPENING_HALF;
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
  ctx.lineTo(postXL, fh - pad);
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
  ctx.lineTo(postXR, fh - pad);
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

  const hudH = canvasHeight - fh;
  const hudG = ctx.createLinearGradient(0, fh, 0, canvasHeight);
  hudG.addColorStop(0, "#243d34");
  hudG.addColorStop(0.55, "#1e332c");
  hudG.addColorStop(1, "#182a25");
  ctx.fillStyle = hudG;
  ctx.fillRect(0, fh, width, hudH);
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, fh);
  ctx.lineTo(width, fh);
  ctx.stroke();
}

function smoothstep01(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function drawOneReferee(
  ctx: CanvasRenderingContext2D,
  footX: number,
  footY: number,
  flip: boolean,
  armRaise: number
): void {
  const t = smoothstep01(armRaise);
  ctx.save();
  ctx.translate(footX, footY);
  if (flip) ctx.scale(-1, 1);

  const shirt = "#141820";
  const stripe = "#f2c12e";

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 3, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#0a0c10";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-2, -2);
  ctx.lineTo(-10, 28);
  ctx.moveTo(2, -2);
  ctx.lineTo(10, 28);
  ctx.stroke();

  ctx.fillStyle = "#0d1118";
  ctx.fillRect(-13, -6, 26, 14);

  ctx.fillStyle = shirt;
  ctx.fillRect(-14, -38, 28, 34);
  ctx.strokeStyle = "#05070a";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-14, -38, 28, 34);

  ctx.fillStyle = stripe;
  ctx.fillRect(-3, -36, 6, 30);

  ctx.fillStyle = "#e8bc9a";
  ctx.fillRect(-5, -44, 10, 8);

  ctx.beginPath();
  ctx.arc(0, -52, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#05070a";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(6, -48);
  ctx.lineTo(13, -45);
  ctx.stroke();

  const sy = -40;
  const lax0 = -18;
  const lay0 = -8;
  const lax1 = -22;
  const lay1 = -56;
  const rax0 = 18;
  const ray0 = -8;
  const rax1 = 22;
  const ray1 = -56;

  const lax = lax0 + (lax1 - lax0) * t;
  const lay = lay0 + (lay1 - lay0) * t;
  const rax = rax0 + (rax1 - rax0) * t;
  const ray = ray0 + (ray1 - ray0) * t;

  ctx.strokeStyle = shirt;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-10, sy);
  ctx.lineTo(lax, lay);
  ctx.moveTo(10, sy);
  ctx.lineTo(rax, ray);
  ctx.stroke();

  ctx.fillStyle = "#e8bc9a";
  ctx.beginPath();
  ctx.arc(lax, lay, 3.5, 0, Math.PI * 2);
  ctx.arc(rax, ray, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawReferees(
  ctx: CanvasRenderingContext2D,
  width: number,
  canvasHeight: number,
  celebration: CelebrationState,
  now: number
): void {
  const footY = canvasHeight - 42;
  const leftX = 76;
  const rightX = width - 76;

  let leftRaise = 0;
  let rightRaise = 0;
  if (celebration.active && celebration.goalSide) {
    const u = Math.min(1, (now - celebration.startedAt) / 280);
    if (celebration.goalSide === "left") leftRaise = u;
    else rightRaise = u;
  }

  drawOneReferee(ctx, leftX, footY, false, leftRaise);
  drawOneReferee(ctx, rightX, footY, true, rightRaise);
}

export function drawScoreboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  canvasHeight: number,
  scoreLeft: number,
  scoreRight: number
): void {
  const h = 46;
  const top = canvasHeight - h;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, top, width, h);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.lineTo(width, top);
  ctx.stroke();

  const xl = width * 0.22;
  const xr = width * 0.78;
  const yLabel = top + 14;
  const yNum = top + 32;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(200, 230, 210, 0.85)";
  ctx.font = "600 10px system-ui, sans-serif";
  ctx.letterSpacing = "0.12em";
  ctx.fillText("LEFT GOAL", xl, yLabel);
  ctx.fillText("RIGHT GOAL", xr, yLabel);
  ctx.letterSpacing = "0";

  ctx.font = "bold 30px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(String(scoreLeft), xl, yNum);
  ctx.fillText(String(scoreRight), xr, yNum);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "600 20px system-ui, sans-serif";
  ctx.fillText("·", width / 2, yNum);

  ctx.restore();
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
