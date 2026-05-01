const KEY = 'vidz:sounds-enabled';

export function getSoundsEnabled(storage: Storage): boolean {
  const raw = storage.getItem(KEY);
  if (raw === null) return true;
  return raw === 'true';
}

export function setSoundsEnabled(storage: Storage, enabled: boolean): void {
  storage.setItem(KEY, String(enabled));
}
