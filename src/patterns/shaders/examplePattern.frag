#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform Palette u_palette;

void main() {
    vec2 st = v_uv;
    vec3 color = palette(st.y + u_time, u_palette);

    gl_FragColor = vec4(color, 1.0);
}
