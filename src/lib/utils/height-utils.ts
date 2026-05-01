export const MIN_SECTION_HEIGHT = 220;
export const DEFAULT_SECTION_HEIGHT = 384;

export function clampHeight(height: number, min: number, max: number): number {
  return Math.min(Math.max(height, min), max);
}

export function expandedHeight(
  windowInnerHeight: number,
  elementTopOffset: number,
  padding = 32,
): number {
  return Math.max(windowInnerHeight - elementTopOffset - padding, MIN_SECTION_HEIGHT);
}
