#ifdef GL_ES
precision mediump float;
#endif

uniform float u_alpha1;
uniform float u_alpha2;
uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

varying vec2 v_normalized_uv;

void main() {
    vec2 uv = v_normalized_uv;
    gl_FragColor = u_alpha1 * texture2D(u_texture1, uv) + u_alpha2 * texture2D(u_texture2, uv);
}
