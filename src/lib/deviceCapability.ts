// A quick, conservative check for whether this device can comfortably run
// a several-thousand-particle WebGL scene. False positives (treating a
// capable device as low-end) just mean a plainer background — acceptable.
// False negatives (running heavy WebGL on a weak device) mean jank — not.
export function isLowEndDevice(): boolean {
  if (typeof window === "undefined") return true;

  const cores = navigator.hardwareConcurrency ?? 4;
  if (cores <= 2) return true;

  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === "number" && memory <= 2) return true;

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    if (!gl) return true;
  } catch {
    return true;
  }

  return false;
}
