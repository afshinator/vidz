import { describe, it, expect } from 'vitest';
import { clampHeight, expandedHeight } from '../height-utils';

describe('clampHeight', () => {
  it('returns value unchanged when within bounds', () => {
    expect(clampHeight(300, 220, 800)).toBe(300);
  });

  it('clamps to min when below', () => {
    expect(clampHeight(100, 220, 800)).toBe(220);
  });

  it('clamps to max when above', () => {
    expect(clampHeight(900, 220, 800)).toBe(800);
  });

  it('returns min when value equals min', () => {
    expect(clampHeight(220, 220, 800)).toBe(220);
  });

  it('returns max when value equals max', () => {
    expect(clampHeight(800, 220, 800)).toBe(800);
  });
});

describe('expandedHeight', () => {
  it('subtracts topOffset and padding from windowHeight', () => {
    expect(expandedHeight(900, 200, 32)).toBe(668);
  });

  it('uses default padding of 32 when not specified', () => {
    expect(expandedHeight(900, 200)).toBe(668);
  });

  it('never returns less than the minimum floor of 220', () => {
    expect(expandedHeight(300, 290, 32)).toBe(220);
  });

  it('handles zero topOffset', () => {
    expect(expandedHeight(900, 0, 32)).toBe(868);
  });
});
