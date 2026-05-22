import type { Bookmark } from '../types';

const KEY = 'slickshot.bookmarks';

function read(): Bookmark[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b): b is Bookmark =>
        b && typeof b.id === 'string' && typeof b.label === 'string',
    );
  } catch {
    return [];
  }
}

function write(items: Bookmark[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function listBookmarks(): Bookmark[] {
  return read();
}

export function saveBookmark(
  input: Omit<Bookmark, 'id'> & { id?: string },
): Bookmark {
  const items = read();
  if (input.id) {
    const idx = items.findIndex((b) => b.id === input.id);
    const updated: Bookmark = {
      id: input.id,
      label: input.label,
      title: input.title,
      text: input.text,
    };
    if (idx >= 0) items[idx] = updated;
    else items.push(updated);
    write(items);
    return updated;
  }
  const created: Bookmark = {
    id: crypto.randomUUID(),
    label: input.label,
    title: input.title,
    text: input.text,
  };
  items.push(created);
  write(items);
  return created;
}

export function deleteBookmark(id: string): void {
  write(read().filter((b) => b.id !== id));
}
