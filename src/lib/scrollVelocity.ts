// Shared, mutable scroll-velocity value (Lenis's own instantaneous
// velocity, roughly px/frame) — read imperatively inside useFrame so the
// vortex's spin speed can react in real time without React re-renders.
export const scrollVelocity = { current: 0 };
