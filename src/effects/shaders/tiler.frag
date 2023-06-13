#include <conjurer_common>
#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265358979323846

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_texture;

uniform float u_tiling;
uniform float u_cell_scale;
uniform float u_rotation;
uniform float u_rotation_rate;
uniform float u_cell_rotation;
uniform float u_cell_rotation_rate;

// // For debugging
// #define u_tiling 3.
// #define u_cell_scale 0.75
// #define u_rotation 0.25
// #define u_rotation_rate 0.
// #define u_cell_rotation 0.12
// #define u_cell_rotation_rate 0.

void main(void) {
    // vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 st = v_uv;

    // canopy to centered cartesian space
    st = canopyToCartesianProjection(st);

    // rotate the global space
    st = rotate2DCentered(st, PI * u_rotation_rate * u_time + PI * u_rotation);

    // tile space
    st = tileCentered(st, u_tiling);

    // shrink the space
    st /= u_cell_scale;

    // rotate the cell space
    st = rotate2DCentered(st, PI * u_cell_rotation_rate * u_time + PI * u_cell_rotation);

    // centered cartesian to polar
    st = cartesianToPolarProjection(st);

    vec4 sampled = texture2D(u_texture, st);
    // when we get close to an edge (out of pounds of the texture) use black instead
    vec3 color = mix(sampled.xyz, vec3(0.), step(1., max(abs(st.x), abs(st.y))));

    gl_FragColor = vec4(color, 1.0);
}
