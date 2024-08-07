// From https://www.shadertoy.com/view/3dlfWH, credit to https://www.shadertoy.com/user/darknoon

#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform Palette u_palette;


void main() {
    vec2 uv = v_uv;
    
    float r = length(uv);
    float a = atan(uv.y, uv.x);
    
    float ring = 1.5 + 0.8 * sin(PI * 0.25 * u_time);
    
    float kr = 0.5 - 0.5 * cos(7. * PI * r); 
    vec3 kq = 0.5 - 0.5 * sin(ring*vec3(30., 29.3, 28.6) * r - 6.0 * u_time + PI * vec3(-0.05, 0.5, 1.0));
    vec3 c = kr * (0.1 + kq * (1. - 0.5* palette(a / PI, u_palette))) * (0.5 + 0.5 * sin(11.*a + 22.5*r));

    gl_FragColor = vec4(mix(vec3(0.0, 0.0, 0.2), c, 0.85), 1.0);
}
