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

float circle(vec2 _st, float _radius, float _fuzziness) {
    float dist = length(_st);
    return smoothstep(_radius - _fuzziness, _radius + _fuzziness, dist);
}

void main() {
    vec2 st = v_uv;

    vec4 black = vec4(0.0, 0.0, 0.0, 1.0);

    gl_FragColor = mix(u_color, black, circle(st, u_radius, u_fuzziness));

}
