#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_normalized_uv;

uniform sampler2D u_texture;
uniform sampler2D u_lastframetex;

uniform float u_amount;
uniform float u_scale;
uniform float u_rotation;

void main() {
    vec4 sampled = texture2D(u_texture, v_normalized_uv);

    // Sample the previous frame through the inverse transform so its image
    // appears scaled and rotated around the center in the current frame.
    vec2 centered = v_normalized_uv - vec2(0.5);
    float angle = radians(u_rotation);
    float cosine = cos(angle);
    float sine = sin(angle);
    vec2 feedbackUv = vec2(
        cosine * centered.x + sine * centered.y,
        -sine * centered.x + cosine * centered.y
    ) / u_scale + vec2(0.5);

    float inBounds =
        step(0.0, feedbackUv.x) * step(feedbackUv.x, 1.0) *
        step(0.0, feedbackUv.y) * step(feedbackUv.y, 1.0);
    vec3 lastFrame = texture2D(u_lastframetex, feedbackUv).rgb * inBounds;

    gl_FragColor = vec4(sampled.rgb + u_amount * lastFrame, 1.0);
}
