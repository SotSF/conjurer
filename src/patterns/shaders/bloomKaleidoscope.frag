#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform float u_reflectCount;
uniform float u_zoom;
uniform float u_timeFactor;
uniform float u_waveFreq;
uniform float u_ringFreq;
uniform float u_colorShift;

uniform float u_bloomRadius;
uniform float u_bloomThreshold;
uniform float u_bloomStrength;

uniform Palette u_palette;

float luminance(vec3 c) {
  return max(c.r, max(c.g, c.b));
}

vec3 kaleidoscopeColor(vec2 uv) {
  // Work in centered cartesian space (v_uv is in [-1, 1])
  vec2 p = uv * u_zoom;
  float r = length(p);

  // Fold the angle into a repeating mirrored kaleidoscope wedge.
  float n = max(1.0, u_reflectCount);
  float seg = (2.0 * PI) / n;

  float theta = atan(p.y, p.x) + PI; // [0, 2PI)
  float a = mod(theta, seg);
  a = min(a, seg - a); // [0, seg/2]

  float aNorm = a / (seg * 0.5 + 1e-6); // [0, 1]

  float t = u_time * u_timeFactor + u_colorShift;

  float core = exp(-r * 0.9);

  // Spokes + rings, shaped into something palette-friendly.
  float spoke = abs(cos(aNorm * PI + t * 0.9));
  spoke = pow(spoke, 1.8);

  float ring = 0.5 + 0.5 * sin(r * u_ringFreq - t * 1.1);
  ring = pow(ring, 1.5);

  float wave = 0.5 + 0.5 * cos(r * u_waveFreq + aNorm * 6.2831853 + t * 0.4);
  wave = pow(wave, 2.0);

  float pat = spoke * (0.25 + 0.75 * ring) * (0.4 + 0.6 * wave);

  // Use pat + folded-angle to drive the palette lookup.
  float paletteT = pat * 2.0 + aNorm * 0.65 + t * 0.06;
  vec3 col = palette(paletteT, u_palette);

  // Extra edge glow near the mirrored wedge boundaries.
  float edgeSigma = seg * 0.12;
  float edgeGlow = exp(-(a * a) / (2.0 * edgeSigma * edgeSigma + 1e-6));
  col += col * edgeGlow * (0.6 + 0.7 * ring) * (0.35 + 0.65 * core);

  // Carve out negative space, but not too aggressively.
  // (Hard threshold keeps true zero-valued pixels for contrast.)
  float patShaped = pow(pat, 1.45);
  float mask = step(0.48, patShaped);

  return col * mask * (0.35 + 1.65 * core);
}

void main() {
  vec2 uv = v_uv;

  vec3 base = kaleidoscopeColor(uv);

  // Bloom-like glow: threshold bright samples in a small neighborhood.
  float br = u_bloomRadius;
  float diag = br * 0.70710678; // br / sqrt(2)

  vec3 bloom = vec3(0.0);
  vec3 s;
  float m;

  s = kaleidoscopeColor(uv + vec2(br, 0.0));
  m = smoothstep(u_bloomThreshold, 1.0, luminance(s));
  bloom += s * m;

  s = kaleidoscopeColor(uv + vec2(-br, 0.0));
  m = smoothstep(u_bloomThreshold, 1.0, luminance(s));
  bloom += s * m;

  s = kaleidoscopeColor(uv + vec2(0.0, br));
  m = smoothstep(u_bloomThreshold, 1.0, luminance(s));
  bloom += s * m;

  s = kaleidoscopeColor(uv + vec2(0.0, -br));
  m = smoothstep(u_bloomThreshold, 1.0, luminance(s));
  bloom += s * m;

  s = kaleidoscopeColor(uv + vec2(diag, diag));
  m = smoothstep(u_bloomThreshold, 1.0, luminance(s));
  bloom += s * m;

  s = kaleidoscopeColor(uv + vec2(-diag, diag));
  m = smoothstep(u_bloomThreshold, 1.0, luminance(s));
  bloom += s * m;

  s = kaleidoscopeColor(uv + vec2(diag, -diag));
  m = smoothstep(u_bloomThreshold, 1.0, luminance(s));
  bloom += s * m;

  s = kaleidoscopeColor(uv + vec2(-diag, -diag));
  m = smoothstep(u_bloomThreshold, 1.0, luminance(s));
  bloom += s * m;

  bloom /= 8.0;

  vec3 outColor = base + bloom * u_bloomStrength;

  // Guard against negative palette values before tone mapping.
  outColor = max(outColor, vec3(0.0));

  // Simple tone mapping to keep bloom “punchy” without blowing out.
  outColor = outColor / (1.0 + outColor);

  gl_FragColor = vec4(outColor, 1.0);
}

