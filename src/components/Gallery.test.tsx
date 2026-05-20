import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Gallery } from './Gallery';
import type { Photo } from '../types';

function mkPhoto(id: string, createdAt = Date.now()): Photo {
  return {
    id,
    createdAt,
    width: 4,
    height: 3,
    blob: new Blob([id], { type: 'image/jpeg' }),
  };
}

describe('<Gallery />', () => {
  it('renders a loading state until loaded is true', () => {
    render(
      <Gallery
        photos={[]}
        loaded={false}
        onBack={() => {}}
        onOpenPhoto={() => {}}
        onOpenBookmarks={() => {}}
      />,
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders the empty state and routes the CTA through onBack', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <Gallery
        photos={[]}
        loaded
        onBack={onBack}
        onOpenPhoto={() => {}}
        onOpenBookmarks={() => {}}
      />,
    );
    expect(screen.getByText(/no photos yet/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /take your first shot/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('renders a tile per photo and reports the tapped id', async () => {
    const user = userEvent.setup();
    const onOpenPhoto = vi.fn();
    render(
      <Gallery
        photos={[mkPhoto('a'), mkPhoto('b'), mkPhoto('c')]}
        loaded
        onBack={() => {}}
        onOpenPhoto={onOpenPhoto}
        onOpenBookmarks={() => {}}
      />,
    );
    const tiles = screen.getAllByRole('button', { name: /open photo/i });
    expect(tiles).toHaveLength(3);
    await user.click(tiles[1]);
    expect(onOpenPhoto).toHaveBeenCalledWith('b');
  });
});
