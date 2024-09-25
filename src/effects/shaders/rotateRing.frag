#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform sampler2D u_texture;

uniform float u_inner_radius;
uniform float u_outer_radius;
uniform float u_speed;
uniform float u_offset;

varying vec2 v_uv;

void main() {
    vec2 uv = v_uv;
    uv = cartesianToCanopyProjection(uv);
    float scale = step(u_inner_radius, uv.y) * (1. - step(u_outer_radius, uv.y));
    uv.x = fract(uv.x + (u_speed * u_time * 0.01 + u_offset) * scale);
    uv = canopyToNormalizedProjection(uv);
    gl_FragColor = texture2D(u_texture, uv);
}
