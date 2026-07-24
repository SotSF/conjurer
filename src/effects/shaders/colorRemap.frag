#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_normalized_uv;
uniform sampler2D u_texture;

uniform float u_hue_shift;
uniform float u_saturation;
uniform float u_invert;
uniform float u_posterize;
uniform Palette u_palette;
uniform float u_palette_mix;
uniform float u_mask_lo;
uniform float u_mask_hi;

// // For debugging
// #define u_hue_shift 0.5
// #define u_saturation 1.
// #define u_invert 0.
// #define u_posterize 0.
// #define u_palette Palette(vec3(0.5), vec3(0.5), vec3(1.), vec3(0., 0.33, 0.67))
// #define u_palette_mix 0.
// #define u_mask_lo 0.
// #define u_mask_hi 0.

// rgb -> hsv. Not provided by conjurer_common (which only has the hsv->rgb `hsv()` helper).
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

void main() {
    vec4 sampled = texture2D(u_texture, v_normalized_uv);
    vec3 rgb = sampled.rgb;

    // Perceptual luminance of the ORIGINAL pixel. Drives both the palette lookup (gradient-map
    // mode) and the mask/blend weight, so the transform can be gated or faded by brightness.
    float luminance = dot(rgb, vec3(0.299, 0.587, 0.114));

    // --- Hue rotation + saturation, done in HSV so brightness/shape are preserved ---
    // u_hue_shift is a fraction of a full turn (1.0 = 360deg). Black has v==0, so rotating its
    // hue is a no-op -- shadows never pick up false color.
    vec3 hsvColor = rgb2hsv(rgb);
    hsvColor.x = fract(hsvColor.x + u_hue_shift);
    hsvColor.y = clamp(hsvColor.y * u_saturation, 0.0, 1.0);
    vec3 color = hsv(hsvColor.x, hsvColor.y, hsvColor.z);

    // --- Solarize / tone-reversal: blend toward the per-channel inverse ---
    color = mix(color, 1.0 - color, u_invert);

    // --- Posterize: quantize each channel to N discrete levels (0 or 1 = off) ---
    if (u_posterize >= 2.0) {
        color = floor(clamp(color, 0.0, 1.0) * u_posterize) / (u_posterize - 1.0);
        color = clamp(color, 0.0, 1.0);
    }

    // --- Gradient map: remap the original luminance through an arbitrary palette ---
    vec3 mapped = palette(luminance, u_palette);
    color = mix(color, mapped, u_palette_mix);

    // --- Luminance mask: how strongly the transform applies to this pixel ---
    // Defaults (lo=hi=0) leave pure black untouched but transform everything else fully. Raising
    // the band turns this into a "apply by brightness" fade instead of a hard black-guard.
    float hi = max(u_mask_hi, u_mask_lo + 1e-4);
    float weight = smoothstep(u_mask_lo, hi, luminance);

    gl_FragColor = vec4(mix(rgb, color, weight), sampled.a);
}
