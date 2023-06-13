#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265358979323846

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;

uniform float u_time_factor;
uniform float u_time_offset;
uniform float u_hue_start;
uniform float u_hue_width;
uniform float u_duty_cycle;
uniform float u_scale;
uniform float u_wave_period;
uniform float u_wave_amplitude;
uniform float u_waviness;
uniform float u_spiral_factor;
uniform float u_number_colors;

// // For debugging
// #define u_time_factor 0.6
// #define u_time_offset 0.0
// #define u_hue_start 0.2
// #define u_hue_width 0.6
// #define u_duty_cycle .3
// #define u_scale 1.
// #define u_wave_period 0.25
// #define u_wave_amplitude 0.25
// #define u_waviness 1.
// #define u_spiral_factor 0.
// #define u_number_colors 5.

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

float triangleWave(in float x) {
    return 2. / PI * asin(sin(x));
}

float plot(vec2 st, float pct) {
    return smoothstep(pct - 0.02, pct, st.y) -
        smoothstep(pct, pct + 0.02, st.y);
}

void main() {
    vec2 st = v_uv;
    // vec2 st = gl_FragCoord.xy / u_resolution.xy;

    // offset the x coordinate based on the y coordinate to create a spiral
    float inverseY = 1. - st.y;
    st.x += 1. - u_spiral_factor * inverseY * inverseY;

    // vary the shape of the wave over x
    float sinusoid = sin(st.x * PI * 2. / u_wave_period) * u_wave_amplitude;
    float triangle = triangleWave(st.x * PI * 2. / u_wave_period) * u_wave_amplitude;
    st.y += mix(triangle, sinusoid, u_waviness);

    // move the cells over time
    st.y += u_time_offset - u_time * u_time_factor;
    // scale the cells
    st.y *= u_scale;

    // divide the infinite domain into color cells
    float color_cell = floor(mod(st.y, u_number_colors));
    // transform to color cell space
    st.y = fract(st.y);

    // create duty cells based on the duty cycle
    st.y *= 1. / u_duty_cycle;

    // keep track of what duty cell we are in
    float duty_cell = floor(st.y);

    // calculate color based on color cell
    float hue = u_hue_start + u_hue_width * color_cell / u_number_colors;
    vec3 hsv = vec3(hue, 1., st.y);
    vec3 color = HSVtoRGB(hsv);

    // make the wavefront white
    color = mix(color, vec3(1.), st.y * st.y);

    // only display this color if this is the first duty cell in the duty cycle
    color = mix(color, vec3(0.0), step(1., duty_cell));

    // do additional blending if we are the second duty cell in the duty cycle
    color = mix(color, vec3(duty_cell + 1. - pow(st.y, 5.)), step(1., duty_cell));

    gl_FragColor = vec4(color, 1.0);
}
