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
uniform float u_refresh_period;
uniform float u_bar_fade_factor;
uniform float u_bar_likelihood;

// // For debugging
// #define u_palette Palette(vec3(0.261, 0.446, 0.315), vec3(0.843, 0.356, 0.239), vec3(0.948, 1.474, 1.361), vec3(3.042, 5.630, 5.424))
// #define u_time_factor 1.0
// #define u_time_offset 0.0
// #define u_bars 20.
// #define u_segments 10.
// #define u_refresh_period 3.
// #define u_bar_fade_factor 0.25
// #define u_bar_likelihood 0.5

vec3 RGBtoHCV(in vec3 RGB) {
    float Epsilon = 1e-9;
    // Based on work by Sam Hocevar and Emil Persson
    vec4 P = (RGB.g < RGB.b) ? vec4(RGB.bg, - 1.0, 2.0 / 3.0) : vec4(RGB.gb, 0.0, - 1.0 / 3.0);
    vec4 Q = (RGB.r < P.x) ? vec4(P.xyw, RGB.r) : vec4(RGB.r, P.yzx);
    float C = Q.x - min(Q.w, Q.y);
    float H = abs((Q.w - Q.y) / (6.0 * C + Epsilon) + Q.z);
    return vec3(H, C, Q.x);
}

vec3 HUEtoRGB(in float H) {
    float R = abs(H * 6.0 - 3.0) - 1.0;
    float G = 2.0 - abs(H * 6.0 - 2.0);
    float B = 2.0 - abs(H * 6.0 - 4.0);
    return clamp(vec3(R, G, B), vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));
}

vec3 HSVtoRGB(in vec3 HSV) {
    vec3 RGB = HUEtoRGB(HSV.x);
    return ((RGB - 1.0) * HSV.y + 1.0) * HSV.z;
}

void main() {
    vec2 st = v_uv;

    st.x *= u_bars;
    st.y *= u_segments;

    float time = 0.1 * u_time * u_time_factor + u_time_offset;

    float timeCell = 1. + floor(u_time / u_refresh_period);
    float translate = sin(time * 4. * rand(timeCell)) * 10.;

    if (mod(floor(st.y), 2.0) == 1.0) {
        st.x += translate;
    } else {
        st.x -= translate;
    }

    // create a grid that repeats every u_bars in x
    vec2 ipos = floor(vec2(mod(st.x, u_bars), mod(st.y, u_bars)));  // integer
    vec2 fpos = fract(st);  // fraction

    float intensity = step(1. - u_bar_likelihood, rand(ipos + timeCell));
    intensity *= 1. - u_bar_fade_factor * abs((fpos.x - 0.5) * 2.0);

    // float hue = rand(ipos) * u_hue_width + u_hue_start;
    vec3 color = palette(rand(ipos), u_palette);

    gl_FragColor = vec4(intensity * color, 1.0);
}
