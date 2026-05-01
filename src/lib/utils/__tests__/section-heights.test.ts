import { describe, it, expect, beforeEach } from 'vitest';
import { getSectionHeight, setSectionHeight } from '../section-heights';

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

describe('getSectionHeight', () => {
  it('returns defaultHeight when key is absent', () => {
    expect(getSectionHeight(storage, 'tag-1', 384)).toBe(384);
  });

  it('returns stored height when present', () => {
    storage.setItem('vidz:section-height:tag-1', '500');
    expect(getSectionHeight(storage, 'tag-1', 384)).toBe(500);
  });

  it('returns defaultHeight when stored value is not a number', () => {
    storage.setItem('vidz:section-height:tag-1', 'bad');
    expect(getSectionHeight(storage, 'tag-1', 384)).toBe(384);
  });

  it('isolates keys by id', () => {
    storage.setItem('vidz:section-height:tag-1', '300');
    storage.setItem('vidz:section-height:tag-2', '600');
    expect(getSectionHeight(storage, 'tag-1', 384)).toBe(300);
    expect(getSectionHeight(storage, 'tag-2', 384)).toBe(600);
  });
});

describe('setSectionHeight', () => {
  it('persists height so getSectionHeight retrieves it', () => {
    setSectionHeight(storage, 'tag-1', 450);
    expect(getSectionHeight(storage, 'tag-1', 384)).toBe(450);
  });

  it('overwrites an existing value', () => {
    setSectionHeight(storage, 'tag-1', 300);
    setSectionHeight(storage, 'tag-1', 550);
    expect(getSectionHeight(storage, 'tag-1', 384)).toBe(550);
  });
});
