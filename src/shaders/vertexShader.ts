type Varying = "v_uv" | "v_normalized_uv";

export const vertexShader = (varyings: Varying[] = ["v_uv"]) => {
  const includeUV = varyings.includes("v_uv");
  const includeNormalizedUV = varyings.includes("v_normalized_uv");

  // Pass the uv coordinates to the fragment shader as a varying
  // v_uv.x, v_uv.y are in the range [-1, 1]
  // -1.0, -1.0 is the bottom left corner of the screen
  // 1.0, 1.0 is the top right corner of the screen
  return `
${includeUV ? "varying vec2 v_uv;" : ""}
${includeNormalizedUV ? "varying vec2 v_normalized_uv;" : ""}

void main() {
  ${includeUV ? "v_uv = position.xy;" : ""}
  ${includeNormalizedUV ? "v_normalized_uv = position.xy * 0.5 + 0.5;" : ""}
  gl_Position = vec4(position, 1.0);
}
`;
};
