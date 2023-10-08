#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_texture;
uniform float u_intensity;

varying vec2 v_uv;

// goal: display a given texture in canopy space
void main() {
    vec2 st = v_uv;

    // example input coordinate [1,0] = right middle of viewport
    // viewport space [1,0] **in this case** corresponds to canopy space [1,0.5]
    vec2 canopyCoordinates = cartesianToNormalizedProjection(st);

    // canopy space [1,0.5] is cartesian space [0.6,0] (canopyToCartesianProjection)
    vec2 cartesianCoordinates = canopyToCartesianProjection(canopyCoordinates);

    // cartesian space [0.6,0] is texture space [0.75,0.5]
    vec2 textureCoordinates = cartesianToNormalizedProjection(cartesianCoordinates);

    vec4 sampled = texture2D(u_texture, textureCoordinates);
    vec4 black = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 color = mix(black, sampled, u_intensity);

    gl_FragColor = color;
}
