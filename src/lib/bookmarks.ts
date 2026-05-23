import type { Bookmark, ShareRoute } from '../types';

const KEY = 'slickshot.bookmarks';

export function isShareRoute(value: unknown): value is ShareRoute {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  switch (r.kind) {
    case 'web-share':
      return (
        (r.title === undefined || typeof r.title === 'string') &&
        (r.text === undefined || typeof r.text === 'string')
      );
    case 'apple-shortcut':
      return (
        typeof r.shortcutName === 'string' &&
        r.shortcutName.length > 0 &&
        (r.passImageVia === 'clipboard' || r.passImageVia === 'none')
      );
    case 'android-intent':
      return (
        typeof r.package === 'string' &&
        r.package.length > 0 &&
        typeof r.action === 'string' &&
        r.action.length > 0 &&
        typeof r.mimeType === 'string' &&
        r.mimeType.length > 0 &&
        (r.text === undefined || typeof r.text === 'string') &&
        (r.passImageVia === 'clipboard' || r.passImageVia === 'none')
      );
    case 'url-scheme':
      return (
        typeof r.template === 'string' &&
        r.template.length > 0 &&
        (r.recipient === undefined || typeof r.recipient === 'string') &&
        (r.text === undefined || typeof r.text === 'string') &&
        (r.passImageVia === 'clipboard' ||
          r.passImageVia === 'download' ||
          r.passImageVia === 'none')
      );
    default:
      return false;
  }
}

function isBookmark(value: unknown): value is Bookmark {
  if (!value || typeof value !== 'object') return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.id === 'string' &&
    typeof b.label === 'string' &&
    isShareRoute(b.route)
  );
}

function read(): Bookmark[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBookmark);
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
      route: input.route,
    };
    if (idx >= 0) items[idx] = updated;
    else items.push(updated);
    write(items);
    return updated;
  }
  const created: Bookmark = {
    id: crypto.randomUUID(),
    label: input.label,
    route: input.route,
  };
  items.push(created);
  write(items);
  return created;
}

export function deleteBookmark(id: string): void {
  write(read().filter((b) => b.id !== id));
}
