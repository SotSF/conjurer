#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform Palette u_palette;
uniform float u_time_factor;
uniform float u_time_offset;
uniform float u_bars;
uniform float u_segments;
uniform float u_seed;
uniform float u_bar_fade_factor;
uniform float u_bar_likelihood;
uniform float u_tangential_speed;
uniform float u_tangential_offset;
uniform float u_mirrorCount;
uniform float u_angle;

// // For debugging
// #define u_palette Palette(vec3(0.261, 0.446, 0.315), vec3(0.843, 0.356, 0.239), vec3(0.948, 1.474, 1.361), vec3(3.042, 5.630, 5.424))
// #define u_time_factor 1.0
// #define u_time_offset 0.0
// #define u_bars 20.
// #define u_segments 10.
// #define u_seed 0.
// #define u_bar_fade_factor 0.25
// #define u_bar_likelihood 0.5
// #define u_tangential_speed 4.
// #define u_tangential_offset 0.
// #define u_mirrorCount 2.
// #define u_angle 0.

// Same fold as the Mirror effect: remap UV into a mirrored kaleidoscope wedge.
// A count of 1 means no mirroring, so return p untouched rather than folding —
// the atan/cos/sin round trip below is only an identity in exact arithmetic, and
// rounding it would shift cell boundaries. The 1.5 cutoff matches the
// round-to-nearest that picks n, so a count rounding to 1 is off and 2 folds.
vec2 mirrorFold(vec2 p) {
    if (u_mirrorCount < 1.5) return p;

    float axis = u_angle * PI + 0.5 * PI;
    p = rotate2DCentered(p, -axis);

    float n = max(2.0, floor(u_mirrorCount + 0.5));
    float seg = (2.0 * PI) / n;

    float r = length(p);
    float theta = atan(p.y, p.x);
    theta = mod(theta + 2.0 * PI, 2.0 * PI);

    float sector = floor(theta / seg);
    float a = theta - sector * seg;

    if (mod(sector, 2.0) >= 1.0) {
        a = seg - a;
    }

    vec2 folded = vec2(cos(a), sin(a)) * r;
    return rotate2DCentered(folded, axis);
}

void main() {
    vec2 st = cartesianToCanopyProjection(mirrorFold(v_uv));

    st.x *= u_bars;
    st.y *= u_segments;

    float time = 0.1 * u_time * u_time_factor + u_time_offset;

    // Blend between adjacent integer seeds so fractional seed changes morph smoothly
    float seedA = floor(u_seed);
    float seedB = seedA + 1.0;
    float seedT = fract(u_seed);

    // Steady tangential scroll — speed/offset only, no seed-based variation
    float translate = time * u_tangential_speed + u_tangential_offset;

    if (mod(floor(st.y), 2.0) == 1.0) {
        st.x += translate;
    } else {
        st.x -= translate;
    }

    // create a grid that repeats every u_bars in x
    vec2 ipos = floor(vec2(mod(st.x, u_bars), mod(st.y, u_bars)));  // integer
    vec2 fpos = fract(st);  // fraction

    float intensityA = step(1. - u_bar_likelihood, rand(ipos + seedA));
    float intensityB = step(1. - u_bar_likelihood, rand(ipos + seedB));
    float intensity = mix(intensityA, intensityB, seedT);
    intensity *= 1. - u_bar_fade_factor * abs((fpos.x - 0.5) * 2.0);

    vec3 colorA = palette(rand(ipos + seedA), u_palette);
    vec3 colorB = palette(rand(ipos + seedB), u_palette);
    vec3 color = mix(colorA, colorB, seedT);

    gl_FragColor = vec4(intensity * color, 1.0);
}
