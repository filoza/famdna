// Shared, mutable state bridging the GSAP-driven intro (IntroSequence) and
// the Three.js particle system (ParticleField) — read imperatively inside
// useFrame rather than via React state, since it updates every frame.
export const introState = {
  progress: 0, // 0–1 across the pinned intro's own scroll range
  dockFade: 1, // 1 = column fully visible, 0 = collapsed into the dock point
  done: false, // true once the intro timeline completes and unpins
};
