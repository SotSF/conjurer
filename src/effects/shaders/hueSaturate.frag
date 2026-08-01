#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_normalized_uv;
uniform sampler2D u_texture;

uniform float u_hue_shift;
uniform float u_saturation;

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

void main() {
    vec4 sampled = texture2D(u_texture, v_normalized_uv);
    vec3 hsvColor = rgb2hsv(sampled.rgb);
    hsvColor.x = fract(hsvColor.x + u_hue_shift);
    hsvColor.y = clamp(hsvColor.y * u_saturation, 0.0, 1.0);
    gl_FragColor = vec4(hsv(hsvColor.x, hsvColor.y, hsvColor.z), sampled.a);
}
