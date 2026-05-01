const KEY_PREFIX = 'vidz:section-height:';

export function getSectionHeight(storage: Storage, id: string, defaultHeight: number): number {
  const raw = storage.getItem(KEY_PREFIX + id);
  if (raw === null) return defaultHeight;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? defaultHeight : parsed;
}

export function setSectionHeight(storage: Storage, id: string, height: number): void {
  storage.setItem(KEY_PREFIX + id, String(height));
}
