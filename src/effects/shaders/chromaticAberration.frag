#ifdef GL_ES
precision mediump float;
#endif

#include <common>

uniform sampler2D u_texture;
uniform float u_theta;
uniform float u_mag_r;
uniform float u_mag_g;
uniform float u_mag_b;

varying vec2 v_uv;

#define SCALE_FACTOR 0.01

void main() {
    vec2 dir = vec2(cos(u_theta), sin(u_theta)) * SCALE_FACTOR;
    gl_FragColor = vec4(
        texture2D(u_texture, v_uv + u_mag_r * dir).r,
        texture2D(u_texture, v_uv + u_mag_g * dir).g,
        texture2D(u_texture, v_uv + u_mag_b * dir).b,
        1.0
    );
}
