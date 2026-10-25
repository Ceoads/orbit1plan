import { it, expect } from 'vitest';
import { isStorageUrlFresh } from './storageUrl';
it('keeps valid URLs and refreshes expired or unrecognizable URLs', () => {
  const url = (exp: number) => `https://storage.example/object/sign/notes/file?token=x.${btoa(JSON.stringify({ exp }))}.x`;
  expect(isStorageUrlFresh(url(3600), 1000000)).toBe(true);
  expect(isStorageUrlFresh(url(1001), 1000000)).toBe(false);
  expect(isStorageUrlFresh('invalid', 1000000)).toBe(false);
});