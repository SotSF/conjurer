#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform Palette u_palette;
uniform float u_timeFactor;
uniform float u_period;
uniform float u_jitter;
uniform float u_glow;
uniform float u_threshold;
uniform float u_edgeBlack;
uniform float u_colorShift;
uniform float u_seed;

// Deterministic per-cell 2D offset in [0, 1].
vec2 cellPoint(vec2 cell) {
  float a = rand(cell + u_seed);
  float b = rand(cell + u_seed + 37.19);
  return vec2(a, b);
}

// Worley / cellular noise: distances to the nearest (F1) and second nearest
// (F2) feature points across a 3x3 neighborhood of grid cells. Each feature
// point orbits over time so the cells drift and breathe.
vec2 worley(vec2 st, float t) {
  vec2 baseCell = floor(st);
  vec2 f = fract(st);

  float f1 = 8.0;
  float f2 = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 neighbor = vec2(float(i), float(j));
      vec2 point = cellPoint(baseCell + neighbor);
      // Animate each feature point along a small circular orbit.
      point = 0.5 + u_jitter * 0.5 * sin(t + 6.2831 * point);
      vec2 diff = neighbor + point - f;
      float d = length(diff);
      if (d < f1) {
        f2 = f1;
        f1 = d;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return vec2(f1, f2);
}

void main() {
  vec2 st = v_uv * u_period;
  float t = u_time * u_timeFactor;

  vec2 F = worley(st, t);
  float f1 = F.x;
  float f2 = F.y;

  // Cell interiors glow: brightest at the feature point (f1 -> 0), fading out.
  float core = 1.0 - smoothstep(0.0, u_glow, f1);

  // Only cells whose core is bright enough survive; the rest fall to black,
  // guaranteeing large dark regions between the lit cells.
  core *= step(u_threshold, core);

  // Cell borders (where f2 - f1 is small) are pushed to black to carve crisp
  // dark seams between neighboring cells.
  float edge = smoothstep(0.0, u_edgeBlack, f2 - f1);

  float intensity = core * edge;

  // Palette sampled per cell region plus slow drift over time.
  vec3 col = palette(f1 + f2 * 0.5 + u_time * u_colorShift, u_palette) * intensity;

  gl_FragColor = vec4(col, 1.0);
}
