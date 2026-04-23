/** Half-height of the goal opening (full opening = 2 × this). */
export const GOAL_OPENING_HALF = 58;

/** Ball center past this x (from left / from right) counts as in the net, with y in the mouth. */
export const GOAL_DEPTH = 22;

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
  const y0 = cy - GOAL_OPENING_HALF;
  const y1 = cy + GOAL_OPENING_HALF;
  if (by < y0 || by > y1) return null;
  if (bx < GOAL_DEPTH) return "left";
  if (bx > width - GOAL_DEPTH) return "right";
  return null;
}
