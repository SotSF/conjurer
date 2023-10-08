// Used with permission. Based on the work of:
// Author: WAHa_06x36  (https://www.shadertoy.com/user/WAHa_06x36)
// License: Creative Commons Attribution-NonCommercial-ShareAlike
// License URL: http://creativecommons.org/licenses/by-nc-sa/3.0/
// Source: https://www.shadertoy.com/view/MtKBWw

#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform float u_time_factor;
uniform float u_time_offset;
uniform float u_meander_factor;
uniform float u_meander_offset;
uniform float u_saturation;
uniform float u_intensity;

// // For debugging
// #define u_time_factor 1.0
// #define u_time_offset 0.0
// #define u_meander_factor 0.
// #define u_meander_offset 1.0
// #define u_saturation 1.0
// #define u_intensity 1.0

void main() {
    vec2 st = v_uv;

    vec3 v = vec3(st, 1.0 - length(st) * 0.2);

    float ta = u_time * 0.1 * u_meander_factor + u_meander_offset;
    mat3 m = mat3(0.0, 1.0, 0.0, - sin(ta), 0.0, cos(ta), cos(ta), 0.0, sin(ta));
    m *= m * m;
    m *= m;
    v = m * v;

    float a = (atan(v.y, v.x) / 3.141592 / 2.0 + 0.5);
    float slice = floor(a * 1000.0);
    float phase = rand(vec2(slice, 0.0));
    float dist = rand(vec2(slice, 1.0)) * 3.0;
    float hue = rand(vec2(slice, 2.0));

    float time = u_time_factor * u_time + u_time_offset;

    float z = dist / length(v.xy) * v.z;
    float Z = mod(z + phase + time * 0.6, 1.0);
    float d = sqrt(z * z + dist * dist);

    float c = exp(- Z * 8.0 + 0.3) / (d * d + 1.0);
    gl_FragColor = vec4(hsv(hue, u_saturation * 0.6 * (1.0 - clamp(2.0 * c - 1.0, 0.0, 1.0)), clamp(u_intensity * 2.0 * c, 0.0, 1.0)), 1.0);
}
