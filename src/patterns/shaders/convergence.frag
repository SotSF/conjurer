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
uniform float u_waves;
uniform float u_trails;
uniform float u_wave_size;
uniform float u_wave_travel_distance;
uniform float u_wave_fade;
uniform float u_stagger;
uniform float u_spread_factor;
uniform Palette u_palette;

// For debugging
#define u_time_factor 1.
#define u_time_offset 0.
#define u_period 3.
#define u_waves 30.
#define u_trails 3.
#define u_wave_size 0.06
#define u_wave_travel_distance 1.06
#define u_wave_fade 1.
#define u_stagger 0.25
#define u_spread_factor .5
#define u_palette Palette(vec3(0.261, 0.446, 0.315), vec3(0.843, 0.356, 0.239), vec3(0.948, 1.474, 1.361), vec3(3.042, 5.630, 5.424))

void main() {
    vec2 st = v_uv;

    vec2 polar = canopyToPolarProjection(st);
    float polarTheta = polar.x;
    float polarRadialDistance = polar.y;

    vec2 cartesian = canopyToCartesianProjection(st) + 0.5;

    float time = u_time * u_time_factor + u_time_offset;

    vec3 color = vec3(0);
    for (float offset = 0.; offset < u_waves; offset ++) {
        float iterationTime = time + (offset / u_waves) * u_period * u_stagger;
        // float iterationTime = time;
        float timeCell = floor(iterationTime / u_period);

        // compute a percentage progress
        float progress = mod(iterationTime, u_period) / u_period;
        // slowdown progress in the middle of the period
        // progress = pow(  progress - 0.5, 2.) + 0.5;
        // computes the distance that the leading edge has traveled, goes up to u_wave_travel_distance
        float waveLeadingEdge = progress * u_wave_travel_distance;

        // rotate the space for this iteration
        float angle = offset / u_waves * 2. * PI * u_spread_factor;
        vec2 rotated = rotate2D(cartesian, angle);

        float intensity = 0.;
        // draw wave up to leading edge
        intensity += 1. - step(waveLeadingEdge, rotated.y);
        // remove wave up to the trailing edge
        intensity -= 1. - smoothstep(waveLeadingEdge - u_wave_size, waveLeadingEdge - u_wave_size * (1. - u_wave_fade), rotated.y);

        // color the wave
        vec3 waveColor = palette(rand(timeCell + offset * 0.01), u_palette);
        color = mix(color, waveColor, intensity);

        // leave behind trailing leaves at this specified interval that fade out over time
        for (float trailIndex = 0.; trailIndex < u_trails; trailIndex ++) {
            float trailDistance = (trailIndex + 1.) / (u_trails + 1.);

            intensity = 0.;
            float trailingWaveLeadingEdge = waveLeadingEdge - trailDistance * u_wave_travel_distance;
            // draw wave up to leading edge
            intensity += 1. - step(trailingWaveLeadingEdge, rotated.y);
            // remove wave up to the trailing edge
            intensity -= 1. - smoothstep(trailingWaveLeadingEdge - u_wave_size, trailingWaveLeadingEdge - u_wave_size * (1. - u_wave_fade), rotated.y);
            intensity *= 1. - progress;
            // color the wave
            color = mix(color, waveColor, intensity);
        }
    }

    gl_FragColor = vec4(color, 1.);
}
