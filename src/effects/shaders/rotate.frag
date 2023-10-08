#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform sampler2D u_texture;

uniform float u_speed;
uniform float u_offset;

varying vec2 v_uv;

void main() {
    vec2 uv = v_uv;
    uv = cartesianToCanopyProjection(uv);
    uv.x = fract(uv.x + u_speed * u_time * 0.01 + u_offset);
    uv = canopyToNormalizedProjection(uv);
    gl_FragColor = texture2D(u_texture, uv);
}
