#include <conjurer_common>
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform sampler2D u_texture;

uniform float u_reflectCount;

void main() {
    vec2 uv = v_uv;
    uv = canopyToCartesianProjection(uv);
    vec3 sampled = vec3(0.);
    vec2 uv0 = uv;
    float angleOfRotation = PI * 2. / u_reflectCount;

    float d = 0.9;
    for (float i = 0.; i < u_reflectCount; i++) {
        uv.x = uv0.x * cos(angleOfRotation * i) - uv0.y * sin(angleOfRotation * i);
        uv.y = uv0.x * sin(angleOfRotation * i) + uv0.y * cos(angleOfRotation * i);
        sampled += texture2D(u_texture, cartesianToCanopyProjection(uv)).rgb * pow(0.9, u_reflectCount);
    }
    gl_FragColor = vec4(sampled, 1.);
}
