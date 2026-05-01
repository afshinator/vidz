import { describe, it, expect, beforeEach } from 'vitest';
import { getSoundsEnabled, setSoundsEnabled } from '../sound-prefs';

function mockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  } as Storage;
}

let storage: Storage;

beforeEach(() => {
  storage = mockStorage();
});

describe('getSoundsEnabled', () => {
  it('returns true by default when key is absent', () => {
    expect(getSoundsEnabled(storage)).toBe(true);
  });

  it('returns true when stored as "true"', () => {
    storage.setItem('vidz:sounds-enabled', 'true');
    expect(getSoundsEnabled(storage)).toBe(true);
  });

  it('returns false when stored as "false"', () => {
    storage.setItem('vidz:sounds-enabled', 'false');
    expect(getSoundsEnabled(storage)).toBe(false);
  });
});

describe('setSoundsEnabled', () => {
  it('persists true so getSoundsEnabled retrieves it', () => {
    setSoundsEnabled(storage, true);
    expect(getSoundsEnabled(storage)).toBe(true);
  });

  it('persists false so getSoundsEnabled retrieves it', () => {
    setSoundsEnabled(storage, false);
    expect(getSoundsEnabled(storage)).toBe(false);
  });

  it('overwrites previous value', () => {
    setSoundsEnabled(storage, true);
    setSoundsEnabled(storage, false);
    expect(getSoundsEnabled(storage)).toBe(false);
  });
});
