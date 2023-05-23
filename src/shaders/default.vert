varying vec2 v_uv;

void main() {
  // Pass the uv coordinates to the fragment shader
  // x, y are in the range [0, 1]
  // 0.0, 0.0 is the bottom left corner of the screen
  // 1.0, 1.0 is the top right corner of the screen
  v_uv = position.xy / 2. + 0.5;
  gl_Position = vec4(position, 1.0);
}
