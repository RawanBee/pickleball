/** Strip below the pitch (refs + score), not part of the playable field. */
export const HUD_BELOW_PITCH = 108;

export function totalCanvasHeight(fieldHeight: number): number {
  return fieldHeight + HUD_BELOW_PITCH;
}
