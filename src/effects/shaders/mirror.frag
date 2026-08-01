#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform sampler2D u_texture;

uniform float u_mirrorCount;
uniform float u_angle;

void main() {
    vec2 p = v_uv;

    // Angle 0 = vertical mirror line (left ↔ right). Offset by π/2 so the
    // fold across +x after rotation matches that default.
    float axis = u_angle * PI + 0.5 * PI;
    p = rotate2DCentered(p, -axis);

    float n = max(2.0, floor(u_mirrorCount + 0.5));
    float seg = (2.0 * PI) / n;

    float r = length(p);
    float theta = atan(p.y, p.x); // [-PI, PI]
    theta = mod(theta + 2.0 * PI, 2.0 * PI); // [0, 2PI)

    float sector = floor(theta / seg);
    float a = theta - sector * seg; // [0, seg)

    // Odd sectors reflect across the shared edge so adjacent copies are
    // mirrors rather than rotations. For n=2 this is a single diametral
    // mirror; for n=4 it fills four quadrants from one source quadrant.
    if (mod(sector, 2.0) >= 1.0) {
        a = seg - a;
    }

    vec2 folded = vec2(cos(a), sin(a)) * r;
    folded = rotate2DCentered(folded, axis);

    gl_FragColor = texture2D(u_texture, cartesianToNormalizedProjection(folded));
}
