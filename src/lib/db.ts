import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Photo } from '../types';

interface SlickshotDB extends DBSchema {
  photos: {
    key: string;
    value: Photo;
    indexes: { 'by-createdAt': number };
  };
}

let dbPromise: Promise<IDBPDatabase<SlickshotDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SlickshotDB>('slickshot', 1, {
      upgrade(db) {
        const store = db.createObjectStore('photos', { keyPath: 'id' });
        store.createIndex('by-createdAt', 'createdAt');
      },
    });
  }
  return dbPromise;
}

export async function addPhoto(input: {
  blob: Blob;
  width: number;
  height: number;
}): Promise<Photo> {
  const photo: Photo = {
    id: crypto.randomUUID(),
    blob: input.blob,
    width: input.width,
    height: input.height,
    createdAt: Date.now(),
  };
  const db = await getDB();
  await db.put('photos', photo);
  return photo;
}

export async function listPhotos(): Promise<Photo[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('photos', 'by-createdAt');
  return all.reverse();
}

export async function getPhoto(id: string): Promise<Photo | undefined> {
  const db = await getDB();
  return db.get('photos', id);
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('photos', id);
}

// Test-only: close & drop the cached connection so the IDB instance can be
// re-created from scratch (and so deleteDatabase isn't blocked by it).
export async function __resetForTests(): Promise<void> {
  if (dbPromise) {
    try {
      const db = await dbPromise;
      db.close();
    } catch {
      // ignore — promise may have rejected already
    }
    dbPromise = null;
  }
}
