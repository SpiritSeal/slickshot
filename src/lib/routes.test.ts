import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatchRoute, describeRoute } from './routes';
import { openUrl } from './nav';
import type { Photo, ShareRoute } from '../types';

vi.mock('./nav', () => ({
  openUrl: vi.fn(),
}));

function makePhoto(): Photo {
  return {
    id: 'p1',
    blob: new Blob(['fake-jpg'], { type: 'image/jpeg' }),
    createdAt: new Date('2024-01-02T03:04:05Z').getTime(),
    width: 640,
    height: 480,
  };
}

let hrefAssignments: string[] = [];

beforeEach(() => {
  hrefAssignments = [];
  vi.mocked(openUrl).mockImplementation((url: string) => {
    hrefAssignments.push(url);
  });
});

describe('dispatchRoute', () => {
  it('apple-shortcut: copies image to clipboard and opens shortcuts:// URL', async () => {
    const writeSpy = vi
      .spyOn(navigator.clipboard, 'write')
      .mockResolvedValue(undefined);
    const route: ShareRoute = {
      kind: 'apple-shortcut',
      shortcutName: 'Send to Mom',
      passImageVia: 'clipboard',
    };
    const outcome = await dispatchRoute(route, makePhoto());
    expect(outcome).toEqual({ kind: 'shared' });
    expect(writeSpy).toHaveBeenCalledOnce();
    expect(hrefAssignments).toEqual([
      'shortcuts://run-shortcut?name=Send%20to%20Mom',
    ]);
  });

  it('apple-shortcut: skips clipboard when passImageVia is none', async () => {
    const writeSpy = vi.spyOn(navigator.clipboard, 'write');
    const route: ShareRoute = {
      kind: 'apple-shortcut',
      shortcutName: 'No image',
      passImageVia: 'none',
    };
    const outcome = await dispatchRoute(route, makePhoto());
    expect(outcome).toEqual({ kind: 'shared' });
    expect(writeSpy).not.toHaveBeenCalled();
    expect(hrefAssignments).toEqual([
      'shortcuts://run-shortcut?name=No%20image',
    ]);
  });

  it('apple-shortcut: returns an error when clipboard write fails', async () => {
    vi.spyOn(navigator.clipboard, 'write').mockRejectedValue(
      new Error('denied'),
    );
    const route: ShareRoute = {
      kind: 'apple-shortcut',
      shortcutName: 'X',
      passImageVia: 'clipboard',
    };
    const outcome = await dispatchRoute(route, makePhoto());
    expect(outcome).toMatchObject({ kind: 'error' });
    expect(hrefAssignments).toEqual([]);
  });

  it('android-intent: builds intent:// URL with package, action, type, and text', async () => {
    vi.spyOn(navigator.clipboard, 'write').mockResolvedValue(undefined);
    const route: ShareRoute = {
      kind: 'android-intent',
      package: 'com.whatsapp',
      action: 'android.intent.action.SEND',
      mimeType: 'image/jpeg',
      text: 'hello world',
      passImageVia: 'clipboard',
    };
    const outcome = await dispatchRoute(route, makePhoto());
    expect(outcome).toEqual({ kind: 'shared' });
    expect(hrefAssignments).toHaveLength(1);
    const url = hrefAssignments[0]!;
    expect(url.startsWith('intent://send/#Intent;')).toBe(true);
    expect(url).toContain('action=android.intent.action.SEND');
    expect(url).toContain('package=com.whatsapp');
    expect(url).toContain('type=image/jpeg');
    expect(url).toContain('S.android.intent.extra.TEXT=hello%20world');
    expect(url.endsWith(';end')).toBe(true);
  });

  it('url-scheme: fills template placeholders and copies image to clipboard', async () => {
    const writeSpy = vi
      .spyOn(navigator.clipboard, 'write')
      .mockResolvedValue(undefined);
    const route: ShareRoute = {
      kind: 'url-scheme',
      template: 'https://wa.me/{recipient}?text={text}',
      recipient: '15551234567',
      text: 'hey friend',
      passImageVia: 'clipboard',
    };
    const outcome = await dispatchRoute(route, makePhoto());
    expect(outcome).toEqual({ kind: 'shared' });
    expect(writeSpy).toHaveBeenCalledOnce();
    expect(hrefAssignments).toEqual([
      'https://wa.me/15551234567?text=hey%20friend',
    ]);
  });

  it('url-scheme: omits missing placeholders', async () => {
    const route: ShareRoute = {
      kind: 'url-scheme',
      template: 'sms:{recipient}?body={text}',
      text: 'note',
      passImageVia: 'none',
    };
    const outcome = await dispatchRoute(route, makePhoto());
    expect(outcome).toEqual({ kind: 'shared' });
    expect(hrefAssignments).toEqual(['sms:?body=note']);
  });

  it('url-scheme: triggers a download when passImageVia is download', async () => {
    const route: ShareRoute = {
      kind: 'url-scheme',
      template: 'mailto:?body={text}',
      text: 'caption',
      passImageVia: 'download',
    };
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const outcome = await dispatchRoute(route, makePhoto());
    expect(outcome).toEqual({ kind: 'shared' });
    expect(appendSpy).toHaveBeenCalled();
    const anchor = appendSpy.mock.calls
      .map((c) => c[0])
      .find((n) => n instanceof HTMLAnchorElement) as HTMLAnchorElement;
    expect(anchor).toBeTruthy();
    expect(anchor.download).toMatch(/^slickshot-\d{8}-\d{6}\.jpg$/);
  });

  it('web-share: returns unsupported when navigator.share is unavailable', async () => {
    const route: ShareRoute = {
      kind: 'web-share',
      title: 'X',
      text: 'Y',
    };
    const outcome = await dispatchRoute(route, makePhoto());
    expect(outcome).toEqual({ kind: 'unsupported' });
  });

  it('web-share: calls navigator.share with title, text, and file', async () => {
    const shareCalls: ShareData[] = [];
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: () => true,
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        shareCalls.push(data);
      },
    });
    const route: ShareRoute = {
      kind: 'web-share',
      title: 'Photo',
      text: 'caption',
    };
    const outcome = await dispatchRoute(route, makePhoto());
    expect(outcome).toEqual({ kind: 'shared' });
    expect(shareCalls).toHaveLength(1);
    expect(shareCalls[0]!.title).toBe('Photo');
    expect(shareCalls[0]!.text).toBe('caption');
    expect(shareCalls[0]!.files?.[0]?.name).toMatch(
      /^slickshot-\d{8}-\d{6}\.jpg$/,
    );
  });
});

describe('describeRoute', () => {
  it('summarises each kind', () => {
    expect(describeRoute({ kind: 'web-share', title: 'A', text: 'B' })).toBe(
      'A · B',
    );
    expect(describeRoute({ kind: 'web-share' })).toBe('Web Share');
    expect(
      describeRoute({
        kind: 'apple-shortcut',
        shortcutName: 'Send to Mom',
        passImageVia: 'clipboard',
      }),
    ).toBe('Apple Shortcut · Send to Mom');
    expect(
      describeRoute({
        kind: 'android-intent',
        package: 'com.whatsapp',
        action: 'android.intent.action.SEND',
        mimeType: 'image/jpeg',
        passImageVia: 'clipboard',
      }),
    ).toBe('Android Intent · com.whatsapp');
    expect(
      describeRoute({
        kind: 'url-scheme',
        template: 'sms:?body={text}',
        passImageVia: 'none',
      }),
    ).toBe('URL · sms:?body={text}');
  });
});
