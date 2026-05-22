import { describe, expect, it } from 'vitest';
import {
  deleteBookmark,
  isShareRoute,
  listBookmarks,
  saveBookmark,
} from './bookmarks';
import type { ShareRoute } from '../types';

const webShare: ShareRoute = {
  kind: 'web-share',
  title: 'Hi',
  text: 'Pic of the day',
};
const appleShortcut: ShareRoute = {
  kind: 'apple-shortcut',
  shortcutName: 'Send to Mom',
  passImageVia: 'clipboard',
};
const androidIntent: ShareRoute = {
  kind: 'android-intent',
  package: 'com.whatsapp',
  action: 'android.intent.action.SEND',
  mimeType: 'image/jpeg',
  text: 'hi',
  passImageVia: 'clipboard',
};
const urlScheme: ShareRoute = {
  kind: 'url-scheme',
  template: 'https://wa.me/{recipient}?text={text}',
  recipient: '15551234567',
  text: 'hello',
  passImageVia: 'clipboard',
};

describe('bookmarks store', () => {
  it('returns an empty list when nothing has been saved', () => {
    expect(listBookmarks()).toEqual([]);
  });

  it('adds a bookmark with a generated id', () => {
    const created = saveBookmark({ label: 'Mom', route: webShare });
    expect(created.id).toMatch(/[0-9a-f-]{36}/i);
    expect(created.label).toBe('Mom');
    expect(created.route).toEqual(webShare);
    expect(listBookmarks()).toEqual([created]);
  });

  it('updates a bookmark when an id is provided', () => {
    const created = saveBookmark({ label: 'Mom', route: webShare });
    const updated = saveBookmark({
      id: created.id,
      label: 'Mom & Dad',
      route: appleShortcut,
    });
    expect(updated.id).toBe(created.id);
    expect(updated.route).toEqual(appleShortcut);
    expect(listBookmarks()).toEqual([updated]);
  });

  it('deletes a bookmark by id without affecting the others', () => {
    const a = saveBookmark({ label: 'A', route: webShare });
    const b = saveBookmark({ label: 'B', route: appleShortcut });
    deleteBookmark(a.id);
    expect(listBookmarks()).toEqual([b]);
  });

  it.each([
    ['web-share', webShare],
    ['apple-shortcut', appleShortcut],
    ['android-intent', androidIntent],
    ['url-scheme', urlScheme],
  ] as const)('round-trips a %s route', (_, route) => {
    const created = saveBookmark({ label: 'X', route });
    expect(listBookmarks()[0]).toEqual(created);
  });

  it('drops entries that lack a valid route', () => {
    localStorage.setItem(
      'slickshot.bookmarks',
      JSON.stringify([
        { id: 'a', label: 'no route' },
        { id: 'b', label: 'unknown kind', route: { kind: 'something-else' } },
        {
          id: 'c',
          label: 'missing shortcut name',
          route: { kind: 'apple-shortcut', passImageVia: 'clipboard' },
        },
        { id: 'd', label: 'legacy', title: 'Hi', text: 'Pic' },
        {
          id: 'e',
          label: 'good',
          route: { kind: 'web-share', title: 'ok' },
        },
        null,
        'string',
      ]),
    );
    const items = listBookmarks();
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('e');
  });

  it('returns an empty list when storage contains invalid JSON', () => {
    localStorage.setItem('slickshot.bookmarks', '{not json');
    expect(listBookmarks()).toEqual([]);
  });
});

describe('isShareRoute', () => {
  it('accepts each valid variant', () => {
    expect(isShareRoute(webShare)).toBe(true);
    expect(isShareRoute(appleShortcut)).toBe(true);
    expect(isShareRoute(androidIntent)).toBe(true);
    expect(isShareRoute(urlScheme)).toBe(true);
  });

  it('rejects malformed input', () => {
    expect(isShareRoute(null)).toBe(false);
    expect(isShareRoute({})).toBe(false);
    expect(isShareRoute({ kind: 'web-share', title: 42 })).toBe(false);
    expect(isShareRoute({ kind: 'apple-shortcut', shortcutName: '' })).toBe(
      false,
    );
    expect(
      isShareRoute({
        kind: 'apple-shortcut',
        shortcutName: 'X',
        passImageVia: 'invalid',
      }),
    ).toBe(false);
    expect(
      isShareRoute({
        kind: 'url-scheme',
        template: '',
        passImageVia: 'clipboard',
      }),
    ).toBe(false);
  });
});
