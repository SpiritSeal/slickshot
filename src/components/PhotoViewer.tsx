import { useEffect, useState } from 'react';
import { deletePhoto, getPhoto } from '../lib/db';
import { saveBlobToDevice } from '../lib/download';
import { photoFilename } from '../lib/share';
import type { Photo } from '../types';
import { ShareSheet } from './ShareSheet';

type Props = {
  photoId: string;
  onBack: () => void;
  onDeleted: () => void;
  toast: (msg: string) => void;
};

export function PhotoViewer({ photoId, onBack, onDeleted, toast }: Props) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    void getPhoto(photoId).then((p) => {
      if (cancelled || !p) {
        if (!p && !cancelled) onBack();
        return;
      }
      setPhoto(p);
      const u = URL.createObjectURL(p.blob);
      revoked = u;
      setUrl(u);
    });
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [photoId, onBack]);

  const handleDelete = async () => {
    if (!photo) return;
    const confirmed = window.confirm('Delete this photo?');
    if (!confirmed) return;
    await deletePhoto(photo.id);
    onDeleted();
  };

  const handleSave = () => {
    if (!photo) return;
    saveBlobToDevice(photo.blob, photoFilename(photo.createdAt));
    toast('Saved to device');
  };

  if (!photo || !url) {
    return (
      <div className="screen screen--dark">
        <header className="topbar topbar--dark">
          <button
            type="button"
            className="iconbtn"
            onClick={onBack}
            aria-label="Back"
          >
            <BackIcon />
          </button>
          <h1 className="topbar__title">Loading…</h1>
          <span className="iconbtn iconbtn--placeholder" aria-hidden />
        </header>
      </div>
    );
  }

  return (
    <div className="screen screen--dark">
      <header className="topbar topbar--dark">
        <button
          type="button"
          className="iconbtn"
          onClick={onBack}
          aria-label="Back to gallery"
        >
          <BackIcon />
        </button>
        <h1 className="topbar__title">
          {new Date(photo.createdAt).toLocaleString()}
        </h1>
        <button
          type="button"
          className="iconbtn iconbtn--danger"
          onClick={handleDelete}
          aria-label="Delete photo"
        >
          <TrashIcon />
        </button>
      </header>

      <div className="viewer">
        <img className="viewer__image" src={url} alt="" />
      </div>

      <ShareSheet photo={photo} onSaveToDevice={handleSave} toast={toast} />
    </div>
  );
}

function BackIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
