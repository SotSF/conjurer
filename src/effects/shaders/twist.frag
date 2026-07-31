#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform sampler2D u_texture;

uniform float u_amount;

void main() {
    vec2 p = v_uv;
    float r = length(p);
    float theta = atan(p.y, p.x);

    // Shift angle proportional to radius: positive = counterclockwise spiral.
    theta += u_amount * PI * r;

    vec2 twisted = vec2(cos(theta), sin(theta)) * r;
    gl_FragColor = texture2D(u_texture, cartesianToNormalizedProjection(twisted));
}
