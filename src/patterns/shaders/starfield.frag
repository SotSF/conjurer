// Used with permission. Based on the work of:
// Author: WAHa_06x36  (https://www.shadertoy.com/user/WAHa_06x36)
// License: Creative Commons Attribution-NonCommercial-ShareAlike
// License URL: http://creativecommons.org/licenses/by-nc-sa/3.0/
// Source: https://www.shadertoy.com/view/MtKBWw

#ifdef GL_ES
precision mediump float;
#endif

// float u_time_factor = 1.0;
// float u_time_offset = 0.0;
// float u_meander_rate = 0.0;
// float u_saturation = 1.0;
// float u_intensity = 1.0;

uniform float u_time_factor;
uniform float u_time_offset;
uniform float u_meander_rate;
uniform float u_saturation;
uniform float u_intensity;

uniform vec2 u_resolution;
uniform float u_time;
varying vec2 v_uv;

vec3 hsv(float h, float s, float v) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(vec3(h) + K.xyz) * 6.0 - K.www);
    return v * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), s);
}

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    // vec2 st = (2.0 * gl_FragCoord.xy - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    vec2 st = v_uv;
    // st -= 0.15;
    // Convert from canopy space to cartesian
    float theta = st.x * 2.0 * 3.1415926;
    float r = st.y * 0.88888888 + 0.111111111;
    float x = r * cos(theta) * 0.5 + 0.5;
    float y = r * sin(theta) * 0.5 + 0.5;
    st = vec2(x, y) * 2.0 - 1.0;

    vec3 v = vec3(st, 1.0 - length(st) * 0.2);

    float ta = u_time * 0.1 * u_meander_rate;
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
