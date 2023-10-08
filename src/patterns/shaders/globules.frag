// Used with permission. Based on the work of:
// Author: WAHa_06x36  (https://www.shadertoy.com/user/WAHa_06x36)
// License: Creative Commons Attribution-NonCommercial-ShareAlike
// License URL: http://creativecommons.org/licenses/by-nc-sa/3.0/
// Source: https://www.shadertoy.com/view/WlGXR1
// This is a modified version of the original source code.

#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform float u_time_factor;
uniform float u_time_offset;

// // For debugging
// #define u_time_factor 1.
// #define u_time_offset 0.

vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}
vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

// Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

  //  x0 = x0 - 0. + 0.0 * C
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
    float n_ = 1.0 / 7.0; // N=7
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,N*N)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = - step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

//Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

// Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    vec4 m2 = m * m;
    vec4 m4 = m2 * m2;

    vec4 pdotx = vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3));

    vec4 temp = m2 * m * pdotx;
    vec3 grad = - 8.0 * (temp.x * x0 + temp.y * x1 + temp.z * x2 + temp.w * x3);
    grad += m4.x * p0 + m4.y * p1 + m4.z * p2 + m4.w * p3;

    return 42.0 * vec4(grad, dot(m4, pdotx));
}

mat3 fromEuler(vec3 ang) {
    vec2 a1 = vec2(sin(ang.x), cos(ang.x));
    vec2 a2 = vec2(sin(ang.y), cos(ang.y));
    vec2 a3 = vec2(sin(ang.z), cos(ang.z));
    return mat3(vec3(a1.y * a3.y + a1.x * a2.x * a3.x, a1.y * a2.x * a3.x + a3.y * a1.x, - a2.y * a3.x), vec3(- a2.y * a1.x, a1.y * a2.y, a2.x), vec3(a3.y * a1.x * a2.x + a1.y * a3.x, a1.x * a3.x - a1.y * a3.y * a2.x, a2.y * a3.y));
}

vec4 mainVR(in vec3 pos, in vec3 dir) {
    float stepSize = 0.2;
    dir = normalize(dir);

    vec3 planeNormal = vec3(0.0, 0.0, 1.0);

    float time = u_time_offset + u_time * u_time_factor;
    vec3 travel = vec3(0.0, 0.0, time * 2.4);
    pos += travel;
    vec3 startPos = pos;

    if (dot(dir, startPos) > 0.0) {
        pos += dir / dot(dir, planeNormal) * stepSize * (- 1.0 + fract(- (dot(startPos, planeNormal)) / stepSize));
    } else {
        pos += dir / dot(dir, planeNormal) * stepSize * fract(- (dot(startPos, planeNormal)) / stepSize);
    }

    vec3 col = vec3(0.0);

    for (float i = 0.0; i < 42.0; i ++) {
        pos += dir * stepSize / abs(dot(dir, planeNormal));
        vec4 n = snoise(pos * 0.3 + vec3(0.5, 0.5, 0.5));
        float p = n.w + sin(time * 3.0) * 0.05 + 0.5;
        float dist = length(startPos - pos);
        float ampl = 1.0 / (abs(dot(dir, planeNormal)) + 0.1);
        //float ampl = 1.0 / (abs(dot(dir, n.xyz)) + 0.0);
        float glow = 1.0 / (p * p + 0.0003 * ampl) * ampl * ampl;
        float distanceFadeout = 1.0 / exp(0.6 * dist + 0.5);
        float nearbyFadeout = 1.0 - exp(- 0.3 * dist);
        float c = glow * nearbyFadeout * distanceFadeout;
        col += abs(vec3(dir.x, dir.y, dir.z)) * c * 0.01;
    }
    return vec4(col, 1.0);
}

void main() {
    vec2 st = v_uv;

    vec2 mouse = vec2(0.5);

    vec3 ang = vec3(0.0, - (mouse.y - 0.5) * 3.14159265 * 1.0, mouse.x * 3.1415926535 * 2.0);

    vec3 dir = normalize(vec3(st.xy, - 1.0 + length(st) * 0.25)) * fromEuler(ang);

    gl_FragColor = mainVR(vec3(0.0), dir);
}
