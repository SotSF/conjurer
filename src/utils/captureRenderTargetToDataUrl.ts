import type { WebGLRenderer } from "three";
import type { WebGLRenderTarget } from "three";

const OUTPUT_SIZE = 64;

/**
 * Reads RGBA from a Three.js render target, flips vertically for canvas coords,
 * scales to {@link OUTPUT_SIZE}, returns a PNG data URL (for thumbnails / DB).
 */
export function captureRenderTargetToDataUrl(
  gl: WebGLRenderer,
  renderTarget: WebGLRenderTarget | null,
): string | null {
  if (!renderTarget) return null;
  const w = renderTarget.width;
  const h = renderTarget.height;
  if (w < 1 || h < 1) return null;

  const rowBytes = w * 4;
  const buffer = new Uint8Array(w * h * 4);
  try {
    gl.readRenderTargetPixels(renderTarget, 0, 0, w, h, buffer);
  } catch {
    return null;
  }

  const flipped = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const srcStart = (h - 1 - y) * rowBytes;
    flipped.set(buffer.subarray(srcStart, srcStart + rowBytes), y * rowBytes);
  }

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = w;
  srcCanvas.height = h;
  const sctx = srcCanvas.getContext("2d");
  if (!sctx) return null;
  const imgData = sctx.createImageData(w, h);
  imgData.data.set(flipped);
  sctx.putImageData(imgData, 0, 0);

  const out = document.createElement("canvas");
  out.width = OUTPUT_SIZE;
  out.height = OUTPUT_SIZE;
  const octx = out.getContext("2d");
  if (!octx) return null;
  octx.drawImage(srcCanvas, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  try {
    return out.toDataURL("image/png");
  } catch {
    return null;
  }
}
