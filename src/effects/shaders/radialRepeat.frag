#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform sampler2D u_texture;

uniform float u_repeatCount;
uniform float u_angle;

void main() {
    vec2 p = v_uv;

    float axis = u_angle * PI + 0.5 * PI;
    p = rotate2DCentered(p, -axis);

    float n = max(2.0, floor(u_repeatCount + 0.5));
    float seg = (2.0 * PI) / n;

    float r = length(p);
    float theta = atan(p.y, p.x);
    theta = mod(theta + 2.0 * PI, 2.0 * PI);

    // Pure rotational copies of a 1/N wedge — no mirroring.
    float a = mod(theta, seg);

    vec2 folded = vec2(cos(a), sin(a)) * r;
    folded = rotate2DCentered(folded, axis);

    gl_FragColor = texture2D(u_texture, cartesianToNormalizedProjection(folded));
}
