import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CameraView } from './CameraView';

describe('<CameraView />', () => {
  it('shows the fallback UI when getUserMedia rejects', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
    });

    render(
      <CameraView
        onCaptured={() => {}}
        onOpenGallery={() => {}}
        onOpenBookmarks={() => {}}
        galleryCount={0}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText(/Permission denied/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/open system camera/i)).toBeInTheDocument();
    // The shutter button is disabled when the camera failed.
    expect(screen.getByRole('button', { name: /take photo/i })).toBeDisabled();
  });

  it('shows the camera-not-available message when mediaDevices is missing', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    });
    render(
      <CameraView
        onCaptured={() => {}}
        onOpenGallery={() => {}}
        onOpenBookmarks={() => {}}
        galleryCount={3}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText(/camera not available/i)).toBeInTheDocument(),
    );
    // The gallery button reflects the count.
    expect(
      screen.getByRole('button', { name: /open gallery \(3 photos\)/i }),
    ).toBeInTheDocument();
  });

  it('routes the bookmarks button to onOpenBookmarks', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('nope')) },
    });
    const user = userEvent.setup();
    const onOpenBookmarks = vi.fn();
    render(
      <CameraView
        onCaptured={() => {}}
        onOpenGallery={() => {}}
        onOpenBookmarks={onOpenBookmarks}
        galleryCount={0}
      />,
    );
    await user.click(screen.getByRole('button', { name: /manage bookmarks/i }));
    expect(onOpenBookmarks).toHaveBeenCalledOnce();
  });
});
