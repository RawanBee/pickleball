/** 2010 World Cup ball texture (served from `public/jabulani.png`). */
const ballTexture = new Image();
ballTexture.decoding = "async";
ballTexture.src = `${import.meta.env.BASE_URL}jabulani.png`;

export function isBallTextureReady(): boolean {
  return ballTexture.complete && ballTexture.naturalWidth > 0;
}

export function getBallTexture(): HTMLImageElement {
  return ballTexture;
}
