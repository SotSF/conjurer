#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform float u_count;
uniform float u_offset;
uniform float u_radius;
uniform float u_colorShift;
uniform Palette u_palette;
uniform float u_clockwise;

void main() {
    vec2 uv = v_uv;
    uv = canopyToCartesianProjection(uv);
    float uv_r = sqrt(uv.x * uv.x + uv.y * uv.y);
    float uv_theta = atan(uv.y / uv.x);
    vec3 col = vec3(0.);
    float a = 2. * PI / u_count;

    for (float i = 0.; i < u_count; i ++) {
        vec2 center = vec2(u_offset * cos(a * i), u_offset * sin(a * i));
        float t = u_clockwise > 0. ? - 1. * u_time : u_time;
        vec2 point = center + vec2(u_radius * cos(t * u_colorShift + i * a), u_radius * sin(t * u_colorShift + i * a));
        float d = distance(uv, point);
        float d1 = distance(uv, center);
        vec3 c = palette(t + d + d1 + i, u_palette);
        c = c * smoothstep(0., 1., 0.005 / abs(u_radius - 0.01 / 2. - d1) / (u_radius - 0.01)) * d / 1.5;
        col += d1 <= u_radius ? c : vec3(0.);
    }

    gl_FragColor = vec4(col, 1.);
}
