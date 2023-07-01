#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;

uniform float u_time_factor;
uniform float u_time_offset;
uniform float u_period;
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

// For debugging
#define u_time_factor 1.
#define u_time_offset 0.
#define u_period 5.
#define u_iterations 20.

#define u_repetition_period 10.
#define u_fade_fraction 0.2
#define u_thickness 0.05
#define u_spacing 0.22
#define u_global_elevation 0.05
#define u_wave_frequency 5.
#define u_wave_amplitude 0.5
#define u_wave_elevation_factor 1.5
#define u_color vec4(0.2627, 0.1765, 0.9255, 1.0)

float circle(vec2 _st, float _radius, float _smoothEdges) {
    vec2 dist = _st - vec2(0.5);
    return 1.0 - smoothstep(_radius - _smoothEdges, _radius, length(dist));
}

void main() {
    vec2 st = v_uv;

    float time = u_time * u_time_factor + u_time_offset;

    float intensity = 0.;
    for (float offset = 0.; offset < u_iterations; offset ++) {

        float iterationTime = time + (offset / u_iterations) * u_period;
        float timeCell = floor(iterationTime / u_period);
        float progress = mod(iterationTime, u_period) / u_period;
        float radius = rand(timeCell + offset + .5) * .05 + .05;
        // radius *= (1. - progress);

        // move circle cell from bottom to top
        float bottomY = - .5 - radius - rand(timeCell + offset + .3);
        float topY = .5 + radius + rand(timeCell + offset + .4);
        float y = st.y - mix(bottomY, topY, progress);

        // start circle cell randomly on the x axis
        float randomOffset = rand(timeCell + offset + .1);
        float startX = st.x + randomOffset;

        // move circle cell from side to side
        float moveX = (rand(timeCell + offset + .2) - 0.5) * 0.9;
        float x = startX + moveX * progress;
        x = mod(x, 1.);

        intensity += circle(vec2(x, y), radius, 0.01);
    }
    vec3 color = vec3(intensity);

    gl_FragColor = vec4(color, 1.);
}
