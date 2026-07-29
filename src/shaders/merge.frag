#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;
uniform float u_opacity1;
uniform float u_opacity2;

varying vec2 v_normalized_uv;

void main() {
    vec2 uv = v_normalized_uv;
    gl_FragColor = u_opacity1 * texture2D(u_texture1, uv) +
        u_opacity2 * texture2D(u_texture2, uv);
}
