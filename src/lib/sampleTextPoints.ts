// Samples a text string's rendered pixels into a flat list of normalized
// 2D points (roughly -aspect..aspect on X, -1..1 on Y). Client-only (needs
// a canvas) — call this from an effect, never at module scope.
export function sampleTextPoints(text: string): Array<[number, number]> {
  const W = 600;
  const H = 220;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  ctx.fillStyle = "#fff";
  ctx.font = "700 110px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, H / 2);

  const { data } = ctx.getImageData(0, 0, W, H);
  const points: Array<[number, number]> = [];
  const step = 2;
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const alpha = data[(y * W + x) * 4 + 3];
      if (alpha > 128) {
        points.push([(x / W - 0.5) * 7, -(y / H - 0.5) * (7 * (H / W))]);
      }
    }
  }
  return points;
}
