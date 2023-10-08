#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
varying vec2 v_normalized_uv;
uniform sampler2D u_texture;

uniform float u_radius;
uniform float u_inverse;

// // For debugging
// #define u_radius 0.5
// #define u_inverse 0.0

void main() {
    vec2 st = v_uv;
    st = cartesianToCanopyProjection(st);

    float circle = 1.0 - step(u_radius, st.y);
    float inverse = 1.0 - circle;
    float intensity = mix(circle, inverse, u_inverse);

    vec4 sampled = texture2D(u_texture, v_normalized_uv);
    vec3 masked = sampled.xyz * intensity;

    gl_FragColor = vec4(masked, 1.0);
}
