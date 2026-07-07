#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform Palette u_palette;
uniform float u_n;
uniform float u_m;
uniform float u_L;
uniform float u_offsetX;
uniform float u_offsetY;

void main() {
    vec2 st = v_uv;

    st = st + vec2(u_offsetX, u_offsetY);

    // https://paulbourke.net/geometry/chladni/
    float g = cos(u_n * PI * st.x / u_L) * cos(u_m * PI * st.y / u_L)
             - cos(u_m * PI * st.x / u_L) * cos(u_n * PI * st.y / u_L);

    // vec3 color = palette(g, u_palette) * (1.0 - abs(g));
    vec3 color = vec3(1.0 - smoothstep(0.0, 0.2, abs(g)));

    gl_FragColor = vec4(color, 1.0);
}
