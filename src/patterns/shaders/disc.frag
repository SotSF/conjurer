#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359

varying vec2 v_uv;

uniform float u_radius;
uniform float u_fuzziness;
uniform vec4 u_color;

// // For debugging
// #define u_radius 0.5
// #define u_fuzziness 0.1
// #define u_color vec4(1.0, 0.0, 0.0, 1.0)

void main() {
    vec2 st = v_uv;

    gl_FragColor = mix(u_color, vec4(0.0, 0.0, 0.0, 1.0), smoothstep(u_radius - u_fuzziness, u_radius + u_fuzziness, st.y));
}
