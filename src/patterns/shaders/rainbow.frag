// Used with permission. Based on the work of:
// Author: WAHa_06x36  (https://www.shadertoy.com/user/WAHa_06x36)
// License: Creative Commons Attribution-NonCommercial-ShareAlike
// License URL: http://creativecommons.org/licenses/by-nc-sa/3.0/
// Source: https://www.shadertoy.com/view/4tsSR7

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform float u_time_factor;
uniform float u_time_offset;

// // For debugging
// #define u_time_factor 1.0
// #define u_time_offset 0.0

vec3 spectral_colour(float l) // RGB <0,1> <- lambda l <400,700> [nm]
{
    float r = 0.0, g = 0.0, b = 0.0;
    if ((l >= 400.0) && (l < 410.0)) {
        float t = (l - 400.0) / (410.0 - 400.0);
        r = + (0.33 * t) - (0.20 * t * t);
    } else if ((l >= 410.0) && (l < 475.0)) {
        float t = (l - 410.0) / (475.0 - 410.0);
        r = 0.14 - (0.13 * t * t);
    } else if ((l >= 545.0) && (l < 595.0)) {
        float t = (l - 545.0) / (595.0 - 545.0);
        r = + (1.98 * t) - (t * t);
    } else if ((l >= 595.0) && (l < 650.0)) {
        float t = (l - 595.0) / (650.0 - 595.0);
        r = 0.98 + (0.06 * t) - (0.40 * t * t);
    } else if ((l >= 650.0) && (l < 700.0)) {
        float t = (l - 650.0) / (700.0 - 650.0);
        r = 0.65 - (0.84 * t) + (0.20 * t * t);
    }
    if ((l >= 415.0) && (l < 475.0)) {
        float t = (l - 415.0) / (475.0 - 415.0);
        g = + (0.80 * t * t);
    } else if ((l >= 475.0) && (l < 590.0)) {
        float t = (l - 475.0) / (590.0 - 475.0);
        g = 0.8 + (0.76 * t) - (0.80 * t * t);
    } else if ((l >= 585.0) && (l < 639.0)) {
        float t = (l - 585.0) / (639.0 - 585.0);
        g = 0.82 - (0.80 * t);
    }
    if ((l >= 400.0) && (l < 475.0)) {
        float t = (l - 400.0) / (475.0 - 400.0);
        b = + (2.20 * t) - (1.50 * t * t);
    } else if ((l >= 475.0) && (l < 560.0)) {
        float t = (l - 475.0) / (560.0 - 475.0);
        b = 0.7 - (t) + (0.30 * t * t);
    }

    return vec3(r, g, b);
}

void main() {
    vec2 st = v_uv;

    float time = u_time * u_time_factor + u_time_offset;

    st *= 2.0;
    for (int i = 0; i < 8; i ++) {
        vec2 newp = vec2(st.y + cos(st.x + time) - sin(st.y * cos(time * 0.2)), st.x - sin(st.y - time) - cos(st.x * sin(time * 0.3)));
        st = newp;
    }

    gl_FragColor = vec4(spectral_colour(st.y * 50.0 + 500.0 + sin(time * 0.6)), 1.0);
}
