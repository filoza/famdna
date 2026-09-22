// Shared, mutable state bridging the GSAP-driven pinned intro
// (IntroSequence) and the Three.js particle system (ParticleField) — read
// imperatively inside useFrame rather than via React state, since it
// updates every scroll frame.
export const introState = {
  progress: 0, // 0–1 across the pinned intro's own scroll range
  done: false, // true once the intro timeline completes and unpins —
  // stays true permanently once set (the intro triggers exactly once;
  // scrolling back up does not re-arm or replay it).
  endScrollY: 0, // absolute window.scrollY (px) where the pin ends — set
  // directly by ScrollTrigger's own onRefresh, so post-intro scroll
  // progress is never a guess that can drift out of sync.
};
