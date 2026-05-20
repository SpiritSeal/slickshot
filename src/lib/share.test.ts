import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  blobToFile,
  canShareFiles,
  copyTextToClipboard,
  photoFilename,
  sharePhoto,
} from './share';

const realShare = (navigator as Navigator & { share?: unknown }).share;
const realCanShare = (navigator as Navigator & { canShare?: unknown }).canShare;

afterEach(() => {
  Object.defineProperty(navigator, 'share', { configurable: true, value: realShare });
  Object.defineProperty(navigator, 'canShare', {
    configurable: true,
    value: realCanShare,
  });
  // Restore clipboard (vi.spyOn restoration handled by restoreMocks).
});

describe('photoFilename', () => {
  it('formats a filename with the local timestamp', () => {
    const t = new Date(2024, 0, 2, 3, 4, 5).getTime();
    expect(photoFilename(t)).toBe('slickshot-20240102-030405.jpg');
  });

  it('zero-pads single-digit components', () => {
    const t = new Date(2024, 8, 9, 1, 2, 3).getTime(); // September
    expect(photoFilename(t)).toBe('slickshot-20240909-010203.jpg');
  });
});

describe('blobToFile', () => {
  it('wraps a blob as a File with the requested name and inherited type', () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' });
    const file = blobToFile(blob, 'shot.jpg');
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('shot.jpg');
    expect(file.type).toBe('image/jpeg');
  });

  it('falls back to image/jpeg when the blob has no type', () => {
    const blob = new Blob(['x']);
    const file = blobToFile(blob, 'shot.jpg');
    expect(file.type).toBe('image/jpeg');
  });
});

describe('canShareFiles', () => {
  const file = new File(['x'], 'shot.jpg', { type: 'image/jpeg' });

  it('returns false when navigator.share is missing', () => {
    delete (navigator as { share?: unknown }).share;
    expect(canShareFiles(file)).toBe(false);
  });

  it('returns false when canShare is unavailable', () => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn() });
    delete (navigator as { canShare?: unknown }).canShare;
    expect(canShareFiles(file)).toBe(false);
  });

  it('delegates to navigator.canShare when present', () => {
    const canShare = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn() });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: canShare });
    expect(canShareFiles(file)).toBe(true);
    expect(canShare).toHaveBeenCalledWith({ files: [file] });
  });

  it('returns false if canShare throws', () => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn() });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: () => {
        throw new Error('nope');
      },
    });
    expect(canShareFiles(file)).toBe(false);
  });
});

describe('sharePhoto', () => {
  const file = new File(['x'], 'shot.jpg', { type: 'image/jpeg' });

  it('returns unsupported when share is unavailable', async () => {
    delete (navigator as { share?: unknown }).share;
    const outcome = await sharePhoto(file, { title: 't' });
    expect(outcome).toEqual({ kind: 'unsupported' });
  });

  it('invokes navigator.share with the file plus preset metadata', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: () => true,
    });
    const outcome = await sharePhoto(file, { title: 'hi', text: 'world' });
    expect(outcome).toEqual({ kind: 'shared' });
    expect(share).toHaveBeenCalledWith({ files: [file], title: 'hi', text: 'world' });
  });

  it('treats user cancel (AbortError) as cancelled', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancel', 'AbortError'));
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: () => true,
    });
    const outcome = await sharePhoto(file);
    expect(outcome).toEqual({ kind: 'cancelled' });
  });

  it('returns an error outcome when share rejects with a non-abort error', async () => {
    const share = vi.fn().mockRejectedValue(new Error('boom'));
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: () => true,
    });
    const outcome = await sharePhoto(file);
    expect(outcome).toEqual({ kind: 'error', message: 'boom' });
  });
});

describe('copyTextToClipboard', () => {
  it('returns true for empty text without touching the clipboard', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    expect(await copyTextToClipboard('')).toBe(true);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('writes text via navigator.clipboard.writeText', async () => {
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);
    expect(await copyTextToClipboard('hi')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hi');
  });

  it('returns false if writeText rejects', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new Error('denied'),
    );
    expect(await copyTextToClipboard('hi')).toBe(false);
  });

  it('returns false when writeText is missing on the clipboard object', async () => {
    // Simulate environments where navigator.clipboard exists but lacks writeText.
    const original = navigator.clipboard.writeText;
    Object.defineProperty(navigator.clipboard, 'writeText', {
      configurable: true,
      value: undefined,
    });
    try {
      expect(await copyTextToClipboard('hi')).toBe(false);
    } finally {
      Object.defineProperty(navigator.clipboard, 'writeText', {
        configurable: true,
        writable: true,
        value: original,
      });
    }
  });
});
