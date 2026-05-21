import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareSheet } from './ShareSheet';
import { saveBookmark } from '../lib/bookmarks';
import type { Photo } from '../types';

function mkPhoto(): Photo {
  return {
    id: 'p1',
    createdAt: new Date(2024, 0, 2, 3, 4, 5).getTime(),
    width: 10,
    height: 10,
    blob: new Blob(['data'], { type: 'image/jpeg' }),
  };
}

const realShare = (navigator as Navigator & { share?: unknown }).share;
const realCanShare = (navigator as Navigator & { canShare?: unknown }).canShare;

afterEach(() => {
  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: realShare,
  });
  Object.defineProperty(navigator, 'canShare', {
    configurable: true,
    value: realCanShare,
  });
});

describe('<ShareSheet />', () => {
  describe('when file sharing IS supported', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'canShare', {
        configurable: true,
        value: () => true,
      });
    });

    it('shows the standard Share label and calls navigator.share with the file', async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: share,
      });

      const user = userEvent.setup();
      const onSave = vi.fn();
      const toast = vi.fn();
      render(
        <ShareSheet photo={mkPhoto()} onSaveToDevice={onSave} toast={toast} />,
      );

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /^share…/i }),
        ).toBeInTheDocument(),
      );
      await user.click(screen.getByRole('button', { name: /^share…/i }));

      expect(share).toHaveBeenCalledOnce();
      const arg = share.mock.calls[0]?.[0];
      expect(arg?.files?.[0]).toBeInstanceOf(File);
      expect(arg?.files?.[0]?.name).toBe('slickshot-20240102-030405.jpg');
      expect(arg?.title).toBe('Slickshot photo');
      expect(toast).toHaveBeenCalledWith('Shared');
      expect(onSave).not.toHaveBeenCalled();
    });

    it('renders a chip per bookmark and forwards its preset to navigator.share', async () => {
      saveBookmark({ label: 'Mom', title: 'Mom!', text: 'Pic of the day' });
      const share = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: share,
      });

      const user = userEvent.setup();
      render(
        <ShareSheet
          photo={mkPhoto()}
          onSaveToDevice={() => {}}
          toast={() => {}}
        />,
      );

      const chip = await screen.findByRole('button', { name: 'Mom' });
      await user.click(chip);

      expect(share).toHaveBeenCalledOnce();
      const arg = share.mock.calls[0]?.[0];
      expect(arg?.title).toBe('Mom!');
      expect(arg?.text).toBe('Pic of the day');
      expect(arg?.files?.[0]).toBeInstanceOf(File);
    });

    it('does not show the unsupported hint', () => {
      render(
        <ShareSheet
          photo={mkPhoto()}
          onSaveToDevice={() => {}}
          toast={() => {}}
        />,
      );
      expect(
        screen.queryByText(/can't share files directly/i),
      ).not.toBeInTheDocument();
    });
  });

  describe('when file sharing is NOT supported', () => {
    beforeEach(() => {
      delete (navigator as { share?: unknown }).share;
      delete (navigator as { canShare?: unknown }).canShare;
    });

    it('falls back to downloading on Share tap and copies the bookmark caption', async () => {
      saveBookmark({ label: 'Mom', text: 'Pic of the day' });
      // jsdom has a Clipboard implementation we can spy on directly.
      const writeText = vi
        .spyOn(navigator.clipboard, 'writeText')
        .mockResolvedValue(undefined);
      const user = userEvent.setup();
      const onSave = vi.fn();
      const toast = vi.fn();
      render(
        <ShareSheet photo={mkPhoto()} onSaveToDevice={onSave} toast={toast} />,
      );

      // Banner explaining the fallback should be visible.
      expect(
        screen.getByText(/can't share files directly/i),
      ).toBeInTheDocument();
      // Share button label switches to "(download)".
      const shareBtn = screen.getByRole('button', {
        name: /share \(download\)/i,
      });
      await user.click(shareBtn);
      expect(onSave).toHaveBeenCalledOnce();
      expect(writeText).not.toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith(
        'Sharing not supported. Download starting…',
      );

      // Bookmark chip also downloads, but additionally copies the caption.
      onSave.mockClear();
      toast.mockClear();
      await user.click(screen.getByRole('button', { name: 'Mom' }));
      await waitFor(() =>
        expect(writeText).toHaveBeenCalledWith('Pic of the day'),
      );
      await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
      expect(toast).toHaveBeenCalledWith('Caption copied. Download starting…');
    });
  });

  it('Save button always triggers onSaveToDevice', async () => {
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: () => true,
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn(),
    });
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <ShareSheet photo={mkPhoto()} onSaveToDevice={onSave} toast={() => {}} />,
    );
    await user.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledOnce();
  });
});
