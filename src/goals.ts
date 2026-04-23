/** Inset of inner touchline from canvas edge (matches field markings). */
export const FIELD_TOUCHLINE_INSET = 16;

const R_GOAL_AREA_ALONG = 18.32 / 68;
const R_GOAL_AREA_DEPTH = 5.5 / 105;

export function innerFieldWidth(fieldWidth: number): number {
  return fieldWidth - 2 * FIELD_TOUCHLINE_INSET;
}

export function innerFieldHeight(fieldHeight: number): number {
  return fieldHeight - 2 * FIELD_TOUCHLINE_INSET;
}

/** Half-height of goal mouth — matches 6-yard box span along the touchline. */
export function goalOpeningHalf(fieldHeight: number): number {
  return (innerFieldHeight(fieldHeight) * R_GOAL_AREA_ALONG) / 2;
}

/** Depth of goal mouth from goal line — matches 6-yard box depth into the pitch. */
export function goalDepth(fieldWidth: number): number {
  return innerFieldWidth(fieldWidth) * R_GOAL_AREA_DEPTH;
}

/**
 * Ball radius scaled to goal opening (similar to old 22px vs opening-half 58).
 * Clamped so tiny / huge views stay playable.
 */
export function pitchBallRadius(fieldHeight: number): number {
  const oh = goalOpeningHalf(fieldHeight);
  const r = oh * 0.38;
  return Math.max(12, Math.min(34, r));
}

/**
 * Returns which goal was scored, or null.
 * Uses ball center; physics leaves a vertical gap in the side walls for this band.
 */
export function whichSideGoal(
  bx: number,
  by: number,
  width: number,
  height: number
): "left" | "right" | null {
  const cy = height / 2;
  const half = goalOpeningHalf(height);
  const depth = goalDepth(width);
  const y0 = cy - half;
  const y1 = cy + half;
  if (by < y0 || by > y1) return null;
  if (bx < depth) return "left";
  if (bx > width - depth) return "right";
  return null;
}
