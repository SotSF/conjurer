#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform float u_time_factor;
uniform float u_time_offset;
uniform float u_iterations;
uniform float u_repetition_period;
uniform float u_fade_fraction;
uniform float u_thickness;
uniform float u_spacing;
uniform float u_global_elevation;
uniform float u_wave_frequency;
uniform float u_wave_amplitude;
uniform float u_wave_elevation_factor;
uniform vec4 u_color;

// // For debugging
// #define u_time_factor 1.
// #define u_time_offset 0.
// #define u_iterations 5.
// #define u_repetition_period 5.
// #define u_fade_fraction 0.2
// #define u_thickness 0.05
// #define u_spacing 0.22
// #define u_global_elevation 0.05
// #define u_wave_frequency 5.
// #define u_wave_amplitude 0.5
// #define u_wave_elevation_factor 1.5
// #define u_color vec4(0.2627, 0.1765, 0.9255, 1.0)

float plot2(float y, float pct) {
    float plotted = smoothstep(pct - u_thickness, pct, y) -
        smoothstep(pct, pct + u_thickness, y);

    return plotted;
}

float construct(vec2 st, float offset) {
    float time = u_time * u_time_factor + u_time_offset;
    float x = st.x + 1. - mod(time - offset, u_repetition_period);
    float wave_component = (1. + st.y * u_wave_elevation_factor) * (u_wave_amplitude * u_spacing * sin(st.x * 2. * PI * u_wave_frequency));
    return exp(x * 10.) * 0.5 + wave_component;
}

void main() {
    vec2 st = v_uv;

    st = cartesianToCanopyProjection(st);

    float time = u_time * u_time_factor + u_time_offset;

    float intensity = 0.;
    for (float offset = 0.; offset < u_iterations; offset ++) {

        // value between 0 and 1 that represents how far along the current iteration we are
        float progress = mod(time - offset, u_repetition_period) / u_repetition_period;

        // this value decreases when getting close to the end of the iteration
        float fade_factor = st.x - (progress * u_repetition_period - (u_repetition_period * (1. - u_fade_fraction)));
        fade_factor = clamp(fade_factor, 0., 1.);

        // elevates this line smoothly from the base offset to the next offset
        float elevation = st.y - u_spacing * mix(offset, offset + 1., st.x) + u_global_elevation;

        float constructed = construct(st, offset);

        // "plot" the line
        intensity += fade_factor * plot2(elevation, constructed);
    }

    gl_FragColor = vec4(intensity * u_color.xyz, 1.);
}
