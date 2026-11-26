// Size the image box to the photo's own shape so nothing is cropped.
// Very wide or very tall photos are clamped and letterboxed instead.
export function imageAspect(width: number, height: number): number {
  if (!(width > 0) || !(height > 0)) return 16 / 9;
  return Math.min(3, Math.max(0.75, width / height));
}
