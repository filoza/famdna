// Shared value bridging the particle shader's liquid-distortion intensity
// (Stage 2) to the ChromaticAberration postprocessing effect, which lives
// in a sibling component and can't read the shader's uniforms directly.
export const liquidIntensity = { current: 0 };
