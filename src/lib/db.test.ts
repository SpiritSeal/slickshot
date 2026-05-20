import { describe, expect, it } from 'vitest';
import { addPhoto, deletePhoto, getPhoto, listPhotos } from './db';

function fakeBlob(text = 'pixel-data'): Blob {
  return new Blob([text], { type: 'image/jpeg' });
}

describe('photo store (IndexedDB)', () => {
  it('starts empty', async () => {
    expect(await listPhotos()).toEqual([]);
  });

  it('stores a photo and returns it from getPhoto', async () => {
    const photo = await addPhoto({ blob: fakeBlob(), width: 100, height: 200 });
    expect(photo.id).toBeTruthy();
    expect(photo.createdAt).toBeGreaterThan(0);
    expect(photo.width).toBe(100);
    expect(photo.height).toBe(200);

    const fetched = await getPhoto(photo.id);
    expect(fetched).toBeDefined();
    expect(fetched?.id).toBe(photo.id);
    // fake-indexeddb's structured clone loses the Blob prototype; check shape instead.
    expect(fetched?.blob).toBeDefined();
    expect(fetched?.width).toBe(100);
    expect(fetched?.height).toBe(200);
  });

  it('lists photos newest-first', async () => {
    const a = await addPhoto({ blob: fakeBlob('a'), width: 1, height: 1 });
    // Ensure a distinct timestamp for ordering.
    await new Promise((resolve) => setTimeout(resolve, 5));
    const b = await addPhoto({ blob: fakeBlob('b'), width: 1, height: 1 });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const c = await addPhoto({ blob: fakeBlob('c'), width: 1, height: 1 });

    const list = await listPhotos();
    expect(list.map((p) => p.id)).toEqual([c.id, b.id, a.id]);
  });

  it('deletes a photo by id', async () => {
    const photo = await addPhoto({ blob: fakeBlob(), width: 1, height: 1 });
    await deletePhoto(photo.id);
    expect(await getPhoto(photo.id)).toBeUndefined();
    expect(await listPhotos()).toEqual([]);
  });

  it('returns undefined for a missing photo', async () => {
    expect(await getPhoto('does-not-exist')).toBeUndefined();
  });
});
