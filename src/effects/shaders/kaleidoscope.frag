#include <conjurer_common>
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform sampler2D u_texture;

uniform float u_reflectCount;
uniform float u_angleOffset;

void main() {
    vec2 uv = v_uv;
    vec2 rt = canopyToPolarProjection(uv);
    float offset = radians(u_angleOffset);
    float angleOfRotation = PI * 2. / u_reflectCount;
    float theta = mod(rt.x,angleOfRotation) + offset; // find comparable theta within AngleOfRotation
    vec2 xy = vec2(rt.y * cos(theta), rt.y * sin(theta));
    xy = cartesianToCanopyProjection(xy);
    vec4 sampled = texture2D(u_texture, xy); // want to sample within the first slice of angleOfRotation
    gl_FragColor = sampled;
}
