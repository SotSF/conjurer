#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

// the input texture here is in canopy space (basically all of the textures are)
// the output texture is in cartesian space
uniform sampler2D u_texture;

varying vec2 v_uv;

void main() {
    vec2 st = v_uv;
    st = 1. - st * 2.;
    vec2 canopyCoordinate = cartesianToCanopyProjection(st);

    vec4 color = texture2D(u_texture, canopyCoordinate);

    color = mix(color, vec4(0., 0., 0., 1.), step(1., canopyCoordinate.y));
    gl_FragColor = color;
}
