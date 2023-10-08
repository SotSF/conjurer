#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_texture;
varying vec2 v_uv;

uniform float u_theta;
uniform float u_mag_r;
uniform float u_mag_g;
uniform float u_mag_b;

#define SCALE_FACTOR 0.01

void main() {
    vec2 st = v_uv;
    // TODO: probably has some bugs
    st = cartesianToCanopyProjection(st);

    vec2 dir = vec2(cos(u_theta), sin(u_theta)) * SCALE_FACTOR;

    vec2 rCoordinate = canopyToNormalizedProjection(st + u_mag_r * dir);
    vec2 gCoordinate = canopyToNormalizedProjection(st + u_mag_g * dir);
    vec2 bCoordinate = canopyToNormalizedProjection(st + u_mag_b * dir);

    gl_FragColor = vec4(texture2D(u_texture, rCoordinate).r, texture2D(u_texture, gCoordinate).g, texture2D(u_texture, bCoordinate).b, 1.0);
}
