#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265358979323846

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;

uniform float u_segments;
uniform float u_stutter_frequency;
uniform float u_go_nuts;
uniform float u_saturation_start;
uniform float u_hue_start;
uniform float u_hue_width;

// // For debugging
// #define u_segments 10.5
// #define u_stutter_frequency .8
// #define u_go_nuts 0.0
// #define u_saturation_start 1.0
// #define u_hue_start 0.05
// #define u_hue_width 0.55

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

float random(in float x) {
    return fract(sin(x) * 43758.5453123);
}

float random(in vec2 _st) {
    return fract(sin(dot(_st.xy, vec2(12.98, 78.233))) *
        43758.5453123);
}

void main() {
    vec2 st = v_uv;
    // vec2 st = gl_FragCoord.xy / u_resolution.xy;

    st.x *= 100.;
    st.y *= u_segments;

    float timeCell = 1. + floor(u_time * u_stutter_frequency);
    float translate = sin(u_time * 4. * random(timeCell)) * 10.;

    if (mod(floor(st.y), 2.0) == 1.0) {
        st.x += translate;
    } else {
        st.x -= translate;
    }

    if (u_go_nuts >= 1.0) {
        st = (st - vec2(5.0)) * (abs(sin(u_time * 0.2)) * 5.);
        st.x += u_time * 3.0;
    }

    vec2 ipos = floor(st);  // integer
    vec2 fpos = fract(st);  // fraction

    float intensity = step(0.5, random(ipos + timeCell));

    float hue = random(ipos) * u_hue_width + u_hue_start;
    vec3 color = HSVtoRGB(vec3(hue, u_saturation_start, 1.0));

    gl_FragColor = vec4(intensity * color, 1.0);
}
