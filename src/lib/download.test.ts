import { describe, expect, it, vi } from 'vitest';
import { saveBlobToDevice } from './download';

describe('saveBlobToDevice', () => {
  it('creates a hidden anchor, clicks it, and revokes the object URL', () => {
    vi.useFakeTimers();
    const createSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:fake-url');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const blob = new Blob(['x'], { type: 'image/jpeg' });
    saveBlobToDevice(blob, 'photo.jpg');

    expect(createSpy).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(revokeSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1500);
    expect(revokeSpy).toHaveBeenCalledWith('blob:fake-url');

    // The anchor should be removed from the DOM after click.
    expect(document.querySelectorAll('a[download]')).toHaveLength(0);

    vi.useRealTimers();
  });
});
