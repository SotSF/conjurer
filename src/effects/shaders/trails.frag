#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_normalized_uv;
uniform sampler2D u_texture;

uniform sampler2D u_lastframetex;

uniform float u_amount;

void main() {
    vec4 sampled = texture2D(u_texture, v_normalized_uv);
    vec4 lastframe = texture2D(u_lastframetex, v_normalized_uv);

    gl_FragColor = vec4(sampled.rgb + u_amount * lastframe.rgb, 1.0);
}
