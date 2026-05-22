import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoViewer } from './PhotoViewer';
import { addPhoto, getPhoto } from '../lib/db';

describe('<PhotoViewer />', () => {
  it('loads the requested photo by id and renders its blob URL', async () => {
    const photo = await addPhoto({
      blob: new Blob(['x'], { type: 'image/jpeg' }),
      width: 4,
      height: 3,
    });
    render(
      <PhotoViewer
        photoId={photo.id}
        onBack={() => {}}
        onDeleted={() => {}}
        toast={() => {}}
      />,
    );

    const img = await waitFor(() => {
      const el = document.querySelector('.viewer__image');
      if (!el) throw new Error('not yet');
      return el as HTMLImageElement;
    });
    expect(img.getAttribute('src')).toMatch(/^blob:/);
  });

  it('calls onBack if the photo is missing', async () => {
    const onBack = vi.fn();
    render(
      <PhotoViewer
        photoId="missing"
        onBack={onBack}
        onDeleted={() => {}}
        toast={() => {}}
      />,
    );
    await waitFor(() => expect(onBack).toHaveBeenCalled());
  });

  it('deletes after confirmation and notifies the parent', async () => {
    const photo = await addPhoto({
      blob: new Blob(['x'], { type: 'image/jpeg' }),
      width: 4,
      height: 3,
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onDeleted = vi.fn();
    const user = userEvent.setup();
    render(
      <PhotoViewer
        photoId={photo.id}
        onBack={() => {}}
        onDeleted={onDeleted}
        toast={() => {}}
      />,
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /delete photo/i }),
      ).toBeEnabled(),
    );

    await user.click(screen.getByRole('button', { name: /delete photo/i }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(await getPhoto(photo.id)).toBeUndefined();
  });

  it('does NOT delete when confirmation is declined', async () => {
    const photo = await addPhoto({
      blob: new Blob(['x'], { type: 'image/jpeg' }),
      width: 4,
      height: 3,
    });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onDeleted = vi.fn();
    const user = userEvent.setup();
    render(
      <PhotoViewer
        photoId={photo.id}
        onBack={() => {}}
        onDeleted={onDeleted}
        toast={() => {}}
      />,
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /delete photo/i }),
      ).toBeEnabled(),
    );

    await user.click(screen.getByRole('button', { name: /delete photo/i }));
    expect(onDeleted).not.toHaveBeenCalled();
    expect(await getPhoto(photo.id)).toBeDefined();
  });
});
