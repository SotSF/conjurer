#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform Palette u_palette;
uniform float u_time_offset;
uniform float u_speed;
uniform float u_tail_length;
uniform bool u_tail_fade;
uniform float u_blade_count;
uniform bool u_bladient;
uniform float u_bladient_modulation;
uniform float u_blade_arc;

vec3 get_color(float offset, float pos_within_blade, float alpha) {
    if (u_bladient) {
        return palette(offset - (1. - alpha) / (u_blade_count * u_bladient_modulation), u_palette);
    } else {
        return palette(offset, u_palette);
    }
}

vec3 draw_blade(int i) {
    vec2 st = cartesianToCanopyProjection(v_uv);
    float offset = float(i) / u_blade_count;
    float pos = st.x + offset + u_blade_arc * st.y / 3.;
    float pos_within_blade = fract(st.x * u_blade_count);
    float alpha = clamp(1. - fract(pos + (u_time + u_time_offset) * u_speed) / u_tail_length, 0., 1.);
    vec3 color = get_color(offset, pos_within_blade, alpha);
    return color * (u_tail_fade ? alpha : step(0.01, alpha));
}

void main() {
    vec3 color = vec3(0.);

    for (int i = 0; i < int(u_blade_count); i++) {
        color += draw_blade(i);
    }

    gl_FragColor = vec4(color, 1.0);
}
