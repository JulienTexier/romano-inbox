import { imageAspect } from '../src/imageAspect';

describe('imageAspect', () => {
  it('uses the photo shape', () => {
    expect(imageAspect(1200, 800)).toBeCloseTo(1.5);
    expect(imageAspect(900, 1000)).toBeCloseTo(0.9);
  });

  it('clamps very wide and very tall photos', () => {
    expect(imageAspect(4000, 500)).toBe(3);
    expect(imageAspect(500, 2000)).toBe(0.75);
  });

  it('falls back to 16:9 without dimensions', () => {
    expect(imageAspect(0, 0)).toBeCloseTo(16 / 9);
    expect(imageAspect(NaN, 100)).toBeCloseTo(16 / 9);
  });
});
