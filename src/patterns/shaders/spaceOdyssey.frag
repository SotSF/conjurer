#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;
uniform float u_iterations;
uniform float u_exponent;
uniform float u_color_change_rate;

uniform Palette u_palette;

void main() {
    vec2 st = v_uv;
    vec2 st0 = st;
    vec3 finalColor = vec3(0.0);

    for (float i = 0.; i < u_iterations; i++) {
        st = fract(st * 1.5) - 0.5;

        float d = length(st) * exp(-length(st0));
        d = sin(d * 8. + u_time) / 8.;
        d = abs(d);
        d = pow(0.01 / d, u_exponent);

        vec3 col = palette(length(st0) + i * 0.4 + u_time * u_color_change_rate, u_palette);
        finalColor += col * d;
    }


    gl_FragColor = vec4(finalColor, 1.0);
}
