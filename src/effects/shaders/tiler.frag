#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265358979323846

varying vec2 v_uv;
uniform float u_time;
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
    vec2 st = v_uv;

    // cartesian to half cartesian space
    st *= 0.5;

    // rotate the global space
    st = rotate2DCentered(st, PI * u_rotation_rate * u_time + PI * u_rotation);

    // tile space
    st = tileCentered(st, u_tiling);

    // shrink the space
    st /= u_cell_scale;

    // rotate the cell space
    st = rotate2DCentered(st, PI * u_cell_rotation_rate * u_time + PI * u_cell_rotation);

    // half cartesian to cartesian
    st *= 2.;

    // cartesian to normalized space
    st = cartesianToNormalizedProjection(st);

    vec4 sampled = texture2D(u_texture, st);
    // when we get close to an edge (out of pounds of the texture) use black instead
    vec3 color = mix(sampled.xyz, vec3(0.), step(1., max(abs(st.x), abs(st.y))));

    gl_FragColor = vec4(color, 1.0);
}
