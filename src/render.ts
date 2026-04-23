import Matter from "matter-js";
import { getBallTexture, isBallTextureReady } from "./ballTexture";
import type { CelebrationState } from "./celebration";
import {
  FIELD_TOUCHLINE_INSET,
  goalDepth,
  goalOpeningHalf,
  innerFieldHeight,
  innerFieldWidth,
} from "./goals";
import type { FingerState } from "./types";

/** Referee leg stroke ends here (local Y); keep in sync with `drawReferees` foot placement. */
const REFEREE_LEG_END_Y = 11;

/** FIFA-ish ratios vs full pitch length (105m) and width (68m); used for horizontal goal layout. */
const R_PEN_DEPTH = 16.5 / 105;
const R_PEN_ALONG = 40.32 / 68;
const R_CENTER_R = 9.15 / 68;
const R_PEN_SPOT = 11 / 105;
const R_PEN_ARC = 9.15 / 105;
const R_CORNER_ARC = 1 / 105;

/** Appends one penalty-area D arc to the current path (caller strokes). */
function addPenaltyDArcToPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  boxEdgeX: number,
  side: "left" | "right"
): void {
  const dx = boxEdgeX - cx;
  const sq = R * R - dx * dx;
  if (sq <= 0) return;
  const dy = Math.sqrt(sq);
  const a0 = Math.atan2(-dy, dx);
  const a1 = Math.atan2(dy, dx);
  if (side === "left") {
    ctx.arc(cx, cy, R, a0, a1, false);
  } else {
    ctx.arc(cx, cy, R, a1, a0, false);
  }
}

export function drawField(
  ctx: CanvasRenderingContext2D,
  width: number,
  fieldHeight: number,
  canvasHeight: number,
  shake: number,
  dpr: number
): void {
  const ox = (Math.random() - 0.5) * shake;
  const oy = (Math.random() - 0.5) * shake;
  ctx.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr);

  const fh = fieldHeight;

  const g = ctx.createLinearGradient(0, 0, 0, fh);
  g.addColorStop(0, "#1a4d2e");
  g.addColorStop(1, "#0f331f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, fh);

  const m = FIELD_TOUCHLINE_INSET;
  const iw = innerFieldWidth(width);
  const ih = innerFieldHeight(fh);
  const cy = fh / 2;
  const oh = goalOpeningHalf(fh);
  const gaDepth = goalDepth(width);

  const penDepth = iw * R_PEN_DEPTH;
  const penHalfY = (ih * R_PEN_ALONG) / 2;
  const centerR = ih * R_CENTER_R;
  const penArcR = iw * R_PEN_ARC;
  const spotLeftX = m + iw * R_PEN_SPOT;
  const spotRightX = width - m - iw * R_PEN_SPOT;
  const boxOuterLeftX = m + penDepth;
  const boxOuterRightX = width - m - penDepth;
  const cornerR = Math.max(7, Math.min(iw, ih) * R_CORNER_ARC);

  const line = "rgba(255,255,255,0.38)";
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.lineJoin = "miter";
  ctx.strokeRect(m, m, iw, ih);

  ctx.beginPath();
  ctx.moveTo(width / 2, m);
  ctx.lineTo(width / 2, fh - m);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(width / 2, cy, centerR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath();
  ctx.arc(width / 2, cy, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = line;
  ctx.strokeRect(m, cy - oh, gaDepth, oh * 2);
  ctx.strokeRect(m, cy - penHalfY, penDepth, penHalfY * 2);
  ctx.strokeRect(width - m - gaDepth, cy - oh, gaDepth, oh * 2);
  ctx.strokeRect(width - m - penDepth, cy - penHalfY, penDepth, penHalfY * 2);

  ctx.beginPath();
  ctx.arc(spotLeftX, cy, 2.8, 0, Math.PI * 2);
  ctx.arc(spotRightX, cy, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  addPenaltyDArcToPath(ctx, spotLeftX, cy, penArcR, boxOuterLeftX, "left");
  ctx.stroke();

  ctx.beginPath();
  addPenaltyDArcToPath(ctx, spotRightX, cy, penArcR, boxOuterRightX, "right");
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(m, m, cornerR, 0, Math.PI / 2, false);
  ctx.moveTo(width - m, m + cornerR);
  ctx.arc(width - m, m, cornerR, Math.PI / 2, Math.PI, false);
  ctx.moveTo(width - m - cornerR, fh - m);
  ctx.arc(width - m, fh - m, cornerR, Math.PI, (3 * Math.PI) / 2, false);
  ctx.moveTo(m + cornerR, fh - m);
  ctx.arc(m, fh - m, cornerR, (3 * Math.PI) / 2, Math.PI * 2, false);
  ctx.stroke();

  const y0 = cy - oh;
  const y1 = cy + oh;
  const postXL = m;
  const postXR = width - m;
  const netD = gaDepth;

  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(postXL, m);
  ctx.lineTo(postXL, y0);
  ctx.moveTo(postXL, y1);
  ctx.lineTo(postXL, fh - m);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(postXL, y0);
  ctx.lineTo(postXL + netD, y0);
  ctx.moveTo(postXL, y1);
  ctx.lineTo(postXL + netD, y1);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(postXR, m);
  ctx.lineTo(postXR, y0);
  ctx.moveTo(postXR, y1);
  ctx.lineTo(postXR, fh - m);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(postXR, y0);
  ctx.lineTo(postXR - netD, y0);
  ctx.moveTo(postXR, y1);
  ctx.lineTo(postXR - netD, y1);
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(0, y0, netD, y1 - y0);
  ctx.fillRect(width - netD, y0, netD, y1 - y0);

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
  const skin = "#e8bc9a";

  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(0, 3, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const waistY = -12;

  const shirtH = 18;
  ctx.fillStyle = shirt;
  ctx.fillRect(-9, -30, 18, shirtH);
  ctx.strokeStyle = "#05070a";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-9, -30, 18, shirtH);

  ctx.fillStyle = stripe;
  ctx.fillRect(-2, -28, 4, 14);

  const headCy = -48;
  const headR = 14;

  ctx.fillStyle = skin;
  ctx.fillRect(-3, -36, 6, 7);

  ctx.beginPath();
  ctx.arc(0, headCy, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#05070a";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,200,190,0.55)";
  ctx.beginPath();
  ctx.arc(-7, headCy + 2, 3.2, 0, Math.PI * 2);
  ctx.arc(7, headCy + 2, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(-5, headCy - 2, 3.2, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(5, headCy - 2, 3.2, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1a22";
  ctx.beginPath();
  ctx.arc(-4, headCy - 1, 1.6, 0, Math.PI * 2);
  ctx.arc(6, headCy - 1, 1.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#2a1810";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(0, headCy + 4, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(9, headCy - 2);
  ctx.lineTo(15, headCy + 1);
  ctx.stroke();

  const sy = -31;
  const lax0 = -12;
  const lay0 = -10;
  const lax1 = -17;
  const lay1 = -58;
  const rax0 = 12;
  const ray0 = -10;
  const rax1 = 17;
  const ray1 = -58;

  const lax = lax0 + (lax1 - lax0) * t;
  const lay = lay0 + (lay1 - lay0) * t;
  const rax = rax0 + (rax1 - rax0) * t;
  const ray = ray0 + (ray1 - ray0) * t;

  ctx.strokeStyle = shirt;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-7, sy);
  ctx.lineTo(lax, lay);
  ctx.moveTo(7, sy);
  ctx.lineTo(rax, ray);
  ctx.stroke();

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(lax, lay, 3.2, 0, Math.PI * 2);
  ctx.arc(rax, ray, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#0a0c10";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-1, waistY);
  ctx.lineTo(-4, REFEREE_LEG_END_Y);
  ctx.moveTo(1, waistY);
  ctx.lineTo(4, REFEREE_LEG_END_Y);
  ctx.stroke();

  ctx.restore();
}

export function drawReferees(
  ctx: CanvasRenderingContext2D,
  width: number,
  canvasHeight: number,
  celebration: CelebrationState,
  now: number
): void {
  const scoreH = 46;
  const footY = canvasHeight - scoreH - REFEREE_LEG_END_Y - 2;
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
  const baseR = ball.circleRadius ?? 18;
  const r = baseR * pulse;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  if (isBallTextureReady()) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
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
