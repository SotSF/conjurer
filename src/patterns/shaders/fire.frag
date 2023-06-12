// Based on the work of:
// Author: Trisomie21 (https://www.shadertoy.com/user/Trisomie21)
// License: Creative Commons Attribution-NonCommercial-ShareAlike
// License URL: http://creativecommons.org/licenses/by-nc-sa/3.0/
// Source: https://www.shadertoy.com/view/lsf3RH

#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265358979323846

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;

uniform float u_fire_power;
uniform float u_time_factor;
uniform float u_time_offset;

// // For debugging
// #define u_fire_power 0.8
// #define u_time_factor 1.0
// #define u_time_offset 0.0

float snoise(vec3 uv, float res) {
    const vec3 s = vec3(1e0, 1e2, 1e3);

    uv *= res;

    vec3 uv0 = floor(mod(uv, res)) * s;
    vec3 uv1 = floor(mod(uv + vec3(1.), res)) * s;

    vec3 f = fract(uv);
    f = f * f * (3.0 - 2.0 * f);

    vec4 v = vec4(uv0.x + uv0.y + uv0.z, uv1.x + uv0.y + uv0.z, uv0.x + uv1.y + uv0.z, uv1.x + uv1.y + uv0.z);

    vec4 r = fract(sin(v * 1e-1) * 1e3);
    float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

    r = fract(sin((v + uv1.z - uv0.z) * 1e-1) * 1e3);
    float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

    return mix(r0, r1, f.z) * 2. - 1.;
}

void main() {
    vec2 st = v_uv;
    // vec2 st = gl_FragCoord.xy / u_resolution.xy;

    // Convert from polar coordinates to cartesian
    float theta = st.x * 2.0 * 3.1415926;
    float r = st.y * 0.7 * (2.0 - u_fire_power);
    float x = r * cos(theta) * 0.5 + 0.5;
    float y = r * sin(theta) * 0.5 + 0.5;
    vec2 p = vec2(x, y) * 2.0 - 1.0;

    float color = 3.0 - (3. * length(2. * p));

    vec3 coord = vec3(atan(p.x, p.y) / 6.2832 + .5, length(p) * .4, .5);

    float time = u_time * u_time_factor + u_time_offset;
    for (int i = 1; i <= 7; i ++) {
        float power = pow(2.0, float(i));
        color += (1.5 / power) * snoise(coord + vec3(0., - time * .05, time * .01), power * 16.);
    }
    gl_FragColor = vec4(color, pow(max(color, 0.), 2.) * 0.4, pow(max(color, 0.), 3.) * 0.15, 1.0);
}
