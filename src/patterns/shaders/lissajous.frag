#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform sampler2D u_texture;

uniform float u_count;
uniform float u_space;
uniform float u_a0;
uniform float u_a1;
uniform float u_b0;
uniform float u_b1;
uniform Palette u_palette;
uniform float u_toggleColor;

void main() {
    vec2 uv = v_uv;

    // Convert from canopy space to cartesian
    float theta = uv.x * 2.0 * 3.1415926;
    float r = uv.y * 0.88888888 + 0.111111111;
    float x = r * cos(theta) * 0.5 + 0.5;
    float y = r * sin(theta) * 0.5 + 0.5;
    uv = vec2(x, y) * 2.0 - 1.0;

    vec3 col = vec3(0.);
    for (float i = 0.; i < u_count; i ++) {
        float x = u_a0 * sin(u_a1 * (u_time + (i * u_space)));
        float y = u_b0 * sin(u_b1 * (u_time + (i * u_space)));
        vec2 xy = vec2(x, y);
        float d = distance(uv, xy);
        float l = length(uv);
        float m1 = 0.0001;
        float m = pow(m1, d);
        col = u_toggleColor > 0. ? col + palette(u_time, u_palette) * m : col + (palette(l + d + u_time, u_palette) * m);
    }

    gl_FragColor = vec4(col, 1.);
}
