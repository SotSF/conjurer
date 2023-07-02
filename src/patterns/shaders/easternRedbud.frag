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
#define u_iterations 1.

float circle(vec2 _st, vec2 center, float _radius, float _smoothEdges) {
    vec2 dist = _st - center;
    return 1.0 - smoothstep(_radius - _smoothEdges, _radius, length(dist));
}

void main() {
    vec2 st = v_uv;

    vec2 polar = canopyToPolarProjection(st);
    float polarTheta = polar.x;
    float polarRadius = polar.y;

    vec2 cartesian = canopyToCartesianProjection(st);

    float time = u_time * u_time_factor + u_time_offset;

    float intensity = 0.;
    for (float offset = 0.; offset < u_iterations; offset ++) {

        float iterationTime = time + (offset / u_iterations) * u_period;
        float timeCell = floor(iterationTime / u_period);
        float progress = mod(iterationTime, u_period) / u_period;

        float radius = rand(timeCell + offset + .5) * .05 + .02;
        // radius *= (1. - progress);

        // move circle cell from bottom to top
        // float bottomY = - .5 - radius - rand(timeCell + offset + .3);
        float bottomY = - radius;
        // float topY = .5 + radius + rand(timeCell + offset + .4);
        float topY = 1. + radius;
        float y = mix(bottomY, topY, progress);

        // start circle cell randomly on the x axis
        float randomOffset = rand(timeCell + offset + .1);
        float startX = randomOffset;

        // move circle cell from side to side
        float moveX = (rand(timeCell + offset + .2) - 0.5) * 0.9;
        float x = startX + moveX * progress;
        x = mod(x, 1.);
        // x = 0.5;

        intensity += circle(st, vec2(x, y), radius, 0.01);

        // float trailingImages = 4.;
        // for (float trailingImage = 0.; trailingImage < trailingImages; trailingImage ++) {
        //     float trailingImageY = (trailingImage) / (trailingImages);
        //     intensity += step(trailingImageY, yProgress) * circle(vec2(x, st.y + .5 - trailingImageY), vec2(0.5), radius, 0.01);
        // }

    }
    intensity = circle(cartesian, vec2(- 0.25, 0.25), 0.1, 0.01);
    vec3 color = vec3(intensity);
    // color = vec3();

    gl_FragColor = vec4(color, 1.);
}
