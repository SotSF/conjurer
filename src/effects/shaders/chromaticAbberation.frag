#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;

uniform sampler2D u_texture;
uniform vec4 u_color;
uniform float u_intensity;
uniform float u_mag_r;
uniform float u_mag_g;
uniform float u_mag_b;

varying vec2 v_uv;

void main() {
    gl_FragColor = vec4(
        texture2D(u_texture, v_uv + vec2(u_mag_r * 0.01, 0.0)).r,
        texture2D(u_texture, v_uv + vec2(u_mag_g * 0.01, 0.0)).g,
        texture2D(u_texture, v_uv + vec2(u_mag_b * 0.01, 0.0)).b,
        1.0
    );
}
