#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_normalized_uv;
uniform sampler2D u_texture;
uniform float u_threshold;

void main() {
    vec4 sampled = texture2D(u_texture, v_normalized_uv);
    float value = dot(sampled.rgb, vec3(0.299, 0.587, 0.114));
    float mask = step(u_threshold, value);
    gl_FragColor = vec4(sampled.rgb * mask, 1.0);
}
