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
uniform float u_trailing_waves;
uniform float u_wave_size;
uniform float u_wave_travel;
uniform float u_wave_fade;
uniform float u_stagger;
uniform float u_spread_factor;
uniform Palette u_palette;

// // For debugging
// #define u_time_factor 1.
// #define u_time_offset 0.
// #define u_period 3.
// #define u_waves 10.
// #define u_trailing_waves 2.
// #define u_wave_size 0.05
// #define u_wave_travel 1.
// #define u_wave_fade 1.
// #define u_stagger 0.
// #define u_spread_factor 1.
// #define u_palette Palette(vec3(0.261, 0.446, 0.315), vec3(0.843, 0.356, 0.239), vec3(0.948, 1.474, 1.361), vec3(3.042, 5.630, 5.424))

float wave(vec2 st, float edge, float size, float intensityFactor) {
    float intensity = 0.;
    // draw wave up to leading edge
    intensity += 1. - step(edge, st.y);
    // fade wave up to the trailing edge
    intensity -= 1. - smoothstep(edge - size, edge - size * (1. - u_wave_fade), st.y);
    // fade the wave by an additional factor
    intensity *= intensityFactor;
    return intensity;
}

void main() {
    vec2 st = v_uv;

    vec2 cartesian = canopyToHalfCartesianProjection(st) + 0.5;

    float time = u_time * u_time_factor + u_time_offset;

    vec3 color = vec3(0);
    for (float offset = 0.; offset < u_waves; offset ++) {
        float iterationTime = time + (offset / u_waves) * u_period * u_stagger;
        // float iterationTime = time;
        float timeCell = floor(iterationTime / u_period);
        float nextTimeCell = timeCell + 1.;

        // compute a percentage progress
        float progress = mod(iterationTime, u_period) / u_period;
        // the (non-normalized) distance that the wave travels
        float u_wave_travel_distance = (1. + u_wave_size) * u_wave_travel;
        // computes the distance that the leading edge has traveled, goes up to u_wave_travel_distance
        float waveLeadingEdge = progress * u_wave_travel_distance;

        // rotate the space for this iteration
        float angle = offset / u_waves * 2. * PI * u_spread_factor;
        vec2 rotated = rotate2D(cartesian, angle);

        float waveIntensity = wave(rotated, waveLeadingEdge, u_wave_size, 1.);

        vec3 waveColor = palette(rand(timeCell + offset * 0.01), u_palette);
        vec3 nextWaveColor = palette(rand(nextTimeCell + offset * 0.01), u_palette);
        waveColor = mix(waveColor, nextWaveColor, progress);

        // color the wave according to the wave intensity
        color = mix(color, waveColor, waveIntensity);

        // draw waves in front and in back of primary wave at this specified interval that fade out over time
        for (float leadIndex = 0.; leadIndex < u_trailing_waves; leadIndex ++) {
            float distance = (leadIndex + 1.) / (u_trailing_waves + 1.);
            float fadeFactor = abs(2. * (1. - distance) - 1.);

            float leadingWaveEdge = waveLeadingEdge + distance * u_wave_travel_distance;
            float leadingWaveIntensity = wave(rotated, leadingWaveEdge, u_wave_size, fadeFactor);

            float trailingWaveEdge = waveLeadingEdge - distance * u_wave_travel_distance;
            float trailingWaveIntensity = wave(rotated, trailingWaveEdge, u_wave_size, fadeFactor);

            float intensity = max(leadingWaveIntensity, trailingWaveIntensity);

            // color the wave
            color = mix(color, waveColor, intensity);
        }
    }

    gl_FragColor = vec4(color, 1.);
}
