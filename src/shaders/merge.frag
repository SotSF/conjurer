#ifdef GL_ES
precision mediump float;
#endif

uniform float u_alpha1;
uniform float u_alpha2;
uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

varying vec2 v_uv;

void main() {

    gl_FragColor = u_alpha1 * texture2D(u_texture1, v_uv) + u_alpha2 * texture2D(u_texture2, v_uv);
}
