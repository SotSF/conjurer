#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_texture;

varying vec2 v_uv;
varying float v_intensity;

void main() {
    vec4 sampled = texture2D(u_texture, v_uv);
    vec4 black = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 color = mix(black, sampled, v_intensity);

    // Circular pixels
    float dist = distance(gl_PointCoord, vec2(0.5));
    float alpha = 1. - step(0.5, dist);
    if (alpha == 0.)
        discard;

    gl_FragColor = color;
}
