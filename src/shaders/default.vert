varying vec2 v_uv;
varying vec2 v_normalized_uv;

void main() {
  // Pass the uv coordinates to the fragment shader as a varying
  // v_uv.x, v_uv.y are in the range [-1, 1]
  // -1.0, -1.0 is the bottom left corner of the screen
  // 1.0, 1.0 is the top right corner of the screen
  v_uv = position.xy;
  v_normalized_uv = v_uv * 0.5 + 0.5;
  gl_Position = vec4(position, 1.0);
}
