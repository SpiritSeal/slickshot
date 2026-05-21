import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { addPhoto } from './lib/db';

// jsdom doesn't implement getUserMedia. Make sure the CameraView falls through
// to its file-input fallback path so App can render at all.
beforeAll(() => {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockRejectedValue(new Error('no camera in jsdom')),
    },
  });
});

describe('<App /> screen navigation', () => {
  it('renders the camera screen on first paint', async () => {
    render(<App />);
    expect(await screen.findByText(/slickshot/i)).toBeInTheDocument();
  });

  it('navigates camera → gallery → camera', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText(/slickshot/i);
    await user.click(
      await screen.findByRole('button', { name: /open gallery/i }),
    );
    expect(
      await screen.findByRole('heading', { name: /gallery/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /back to camera/i }));
    expect(await screen.findByText('Slickshot')).toBeInTheDocument();
  });

  it('navigates to the bookmarks screen and back', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole('button', { name: /manage bookmarks/i }),
    );
    expect(
      await screen.findByRole('heading', { name: /bookmarks/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^back$/i }));
    expect(await screen.findByText('Slickshot')).toBeInTheDocument();
  });

  it('shows a badge on the gallery button when photos exist', async () => {
    await addPhoto({
      blob: new Blob(['x'], { type: 'image/jpeg' }),
      width: 1,
      height: 1,
    });
    await addPhoto({
      blob: new Blob(['y'], { type: 'image/jpeg' }),
      width: 1,
      height: 1,
    });
    render(<App />);
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
  });
});
