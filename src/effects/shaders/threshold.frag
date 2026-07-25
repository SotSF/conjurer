#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_normalized_uv;
uniform sampler2D u_texture;
uniform float u_threshold;
uniform float u_softness;

void main() {
    vec4 sampled = texture2D(u_texture, v_normalized_uv);
    float value = dot(sampled.rgb, vec3(0.299, 0.587, 0.114));

    // Softness 0 = hard cut; higher values widen a smooth band around the threshold.
    float halfSoft = max(u_softness, 1e-5) * 0.5;
    float mask = smoothstep(u_threshold - halfSoft, u_threshold + halfSoft, value);

    gl_FragColor = vec4(sampled.rgb * mask, 1.0);
}
