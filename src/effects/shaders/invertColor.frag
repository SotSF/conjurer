#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_normalized_uv;
uniform sampler2D u_texture;

uniform float u_amount;

void main() {
    vec4 sampled = texture2D(u_texture, v_normalized_uv);
    vec3 inverted = 1.0 - sampled.rgb;
    gl_FragColor = vec4(mix(sampled.rgb, inverted, u_amount), sampled.a);
}
