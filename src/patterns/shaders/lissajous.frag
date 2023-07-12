#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;

uniform float u_count;
uniform float u_scale;
uniform float u_a0;
uniform float u_a1;
uniform float u_b0;
uniform float u_b1;
uniform Palette u_palette;

void main() {
    float u_d = 3.14159265 / 2.;
    vec2 uv = v_uv * 2. - u_resolution.xy;
    uv = canopyToCartesianProjection(uv);
    vec3 col = vec3(0.);
    float c = u_count < 1. ? 1. : u_count;
    for (float i = 0.; i < c; i++) {
        uv = uv / u_scale;
        float x = u_a0 * sin(u_a1 * (u_time + i)) + u_d;
        float y = u_b0 * sin(u_b1 * (u_time + i));
        vec2 xy = vec2(x,y);
        float d = distance(uv,xy);
        float d1 = distance(vec2(-1.*uv.x,uv.y), xy);
        float l = length(uv);
        float m1 = 0.05;
        float m = max(pow(m1,d), pow(m1,d1));
        col = col + (palette(m * l + l, u_palette) * m);
    }

    gl_FragColor = vec4(col, 1.);
}