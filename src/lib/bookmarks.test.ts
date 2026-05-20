import { describe, expect, it } from 'vitest';
import { deleteBookmark, listBookmarks, saveBookmark } from './bookmarks';

describe('bookmarks store', () => {
  it('returns an empty list when nothing has been saved', () => {
    expect(listBookmarks()).toEqual([]);
  });

  it('adds a bookmark with a generated id', () => {
    const created = saveBookmark({ label: 'Mom', text: 'Pic of the day' });
    expect(created.id).toMatch(/[0-9a-f-]{36}/i);
    expect(created.label).toBe('Mom');
    expect(listBookmarks()).toHaveLength(1);
    expect(listBookmarks()[0]).toEqual(created);
  });

  it('updates a bookmark when an id is provided', () => {
    const created = saveBookmark({ label: 'Mom' });
    const updated = saveBookmark({
      id: created.id,
      label: 'Mom & Dad',
      title: 'Hi',
    });
    expect(updated.id).toBe(created.id);
    const all = listBookmarks();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual({
      id: created.id,
      label: 'Mom & Dad',
      title: 'Hi',
      text: undefined,
    });
  });

  it('deletes a bookmark by id without affecting the others', () => {
    const a = saveBookmark({ label: 'A' });
    const b = saveBookmark({ label: 'B' });
    deleteBookmark(a.id);
    const remaining = listBookmarks();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.id).toBe(b.id);
  });

  it('persists across listBookmarks calls (localStorage backed)', () => {
    saveBookmark({ label: 'Friend', text: 'hi!' });
    const a = listBookmarks();
    const b = listBookmarks();
    expect(a).toEqual(b);
    expect(a[0]?.label).toBe('Friend');
  });

  it('ignores malformed entries in storage', () => {
    localStorage.setItem(
      'slickshot.bookmarks',
      JSON.stringify([
        { id: 'ok', label: 'good' },
        { id: 123, label: 'bad-id' },
        { label: 'missing-id' },
        null,
        'string',
      ]),
    );
    const items = listBookmarks();
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('ok');
  });

  it('returns an empty list when storage contains invalid JSON', () => {
    localStorage.setItem('slickshot.bookmarks', '{not json');
    expect(listBookmarks()).toEqual([]);
  });
});
