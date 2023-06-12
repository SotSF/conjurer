// Used with permission. Based on the work of:
// Author: WAHa_06x36  (https://www.shadertoy.com/user/WAHa_06x36)
// License: Creative Commons Attribution-NonCommercial-ShareAlike
// License URL: http://creativecommons.org/licenses/by-nc-sa/3.0/
// Source: https://www.shadertoy.com/view/4dfGDr

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;

uniform float u_time_factor;
uniform float u_time_offset;
uniform float u_max_space;
uniform float u_max_depth_spacing;
uniform float u_nucleus_size;
uniform float u_permanent_gap;
uniform float u_gap_factor;

// // For debugging
// #define u_time_factor 1.
// #define u_time_offset 0.
// #define u_max_space 0.
// #define u_max_depth_spacing 0.0
// #define u_nucleus_size 0.5
// #define u_permanent_gap .0
// #define u_gap_factor 1.

vec3 palette(float i) {
    if (i < 4.0) {
        if (i < 2.0) {
            if (i < 1.0)
                return vec3(0.0, 0.0, 0.0);
            else
                return vec3(1.0, 3.0, 1.0);
        } else {
            if (i < 3.0)
                return vec3(1.0, 3.0, 53.0);
            else
                return vec3(28.0, 2.0, 78.0);
        }
    } else if (i < 8.0) {
        if (i < 6.0) {
            if (i < 5.0)
                return vec3(80.0, 2.0, 110.0);
            else
                return vec3(143.0, 3.0, 133.0);
        } else {
            if (i < 7.0)
                return vec3(181.0, 3.0, 103.0);
            else
                return vec3(229.0, 3.0, 46.0);
        }
    } else {
        if (i < 10.0) {
            if (i < 9.0)
                return vec3(252.0, 73.0, 31.0);
            else
                return vec3(253.0, 173.0, 81.0);
        } else if (i < 12.0) {
            if (i < 11.0)
                return 0.8 * vec3(254.0, 244.0, 139.0);
            else
                return 0.8 * vec3(239.0, 254.0, 203.0);
        } else {
            return 0.8 * vec3(242.0, 255.0, 236.0);
        }
    }
}

vec4 colour(float c) {
    c *= 12.0;
    vec3 col1 = palette(c) / 256.0;
    vec3 col2 = palette(c + 1.0) / 256.0;
    return vec4(mix(col1, col2, c - floor(c)), 1.0);
}

float periodic(float x, float period, float dutycycle) {
    x /= period;
    x = abs(x - floor(x) - 0.5) - dutycycle * 0.5;
    return x * period;
}

float pcount(float x, float period) {
    return floor(x / period);
}

float distfunc(vec3 pos, in float time) {
    vec3 gridpos = pos - floor(pos) - 0.5;
    float r = length(pos.xy);
    float a = atan(pos.y, pos.x);
    a += time * 0.3 * sin(pcount(r, 3.0) + 1.0) * sin(pcount(pos.z, 1.0) * 13.73);
    return min(max(max(u_max_depth_spacing * 0.2 + periodic(r, 3.0, 0.2), u_max_space * 0.2 + periodic(pos.z, 1.0, 0.7 + 0.3 * cos(time / 3.0))), u_permanent_gap * 0.3 + u_gap_factor * periodic(a * r, 3.141592 * 2.0 / 6.0 * r, 0.7 + 0.3 * cos(time / 3.0))), 0.25);
}

vec4 mainVR(in vec3 pos, in vec3 dir, in float time) {
    vec3 ray_dir = - dir;
    vec3 ray_pos = pos;

    float a = cos(time) * 0.0 * 0.4;
    ray_dir = ray_dir * mat3(cos(a), 0.0, sin(a), 0.0, 1.0, 0.0, - sin(a), 0.0, cos(a));

    float i = 192.0;
    for (int j = 0; j < 192; j ++) {
        float dist = distfunc(ray_pos, time);
        ray_pos += dist * ray_dir;

        if (abs(dist) < 0.001) {
            i = float(j);
            break;
        }
    }

    float c = i / 192.0;
    return colour(c);
}

void main() {

    // vec2 st = gl_FragCoord.xy / u_resolution.xy;
    // st = st * 2.0 - 1.;

    vec2 st = v_uv;
    st -= 0.15;
    // Convert from canopy space to cartesian
    float theta = st.x * 2.0 * 3.1415926;
    float r = st.y * 0.88888888 + 0.111111111;
    float x = r * cos(theta) * 0.5 + 0.5;
    float y = r * sin(theta) * 0.5 + 0.5;
    st = vec2(x, y) * 2.0 - 1.0;

    float time = u_time_factor * u_time + u_time_offset;

    vec3 ray_dir = normalize(vec3(st, u_nucleus_size));

    // controls the viewpoint
    vec3 ray_pos = vec3(0.0, - 0., time * 0.1);
    // spins the viewpoint around the center
    // vec3 ray_pos = vec3(0.0 + 0.6 * sin(u_time * 0.5), - .0 + 0.6 * cos(u_time * 0.5), u_time * 1.0);

    gl_FragColor = mainVR(ray_pos, - ray_dir, time);
}
