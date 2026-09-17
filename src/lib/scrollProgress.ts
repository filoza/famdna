// Shared, mutable scroll-progress value (0–1 across the whole page).
// Kept out of React state deliberately — it updates every scroll frame via
// Lenis, and background/GSAP consumers read it imperatively in their own
// rAF loops instead of triggering React re-renders.
export const scrollProgress = { current: 0 };
