import { useEffect, useMemo } from 'react';
import type { Photo } from '../types';

type Props = {
  photos: Photo[];
  loaded: boolean;
  onBack: () => void;
  onOpenPhoto: (id: string) => void;
  onOpenBookmarks: () => void;
};

export function Gallery({ photos, loaded, onBack, onOpenPhoto, onOpenBookmarks }: Props) {
  const thumbs = useMemo(
    () => photos.map((p) => ({ id: p.id, url: URL.createObjectURL(p.blob), createdAt: p.createdAt })),
    [photos],
  );

  useEffect(() => {
    return () => {
      thumbs.forEach((t) => URL.revokeObjectURL(t.url));
    };
  }, [thumbs]);

  return (
    <div className="screen">
      <header className="topbar">
        <button type="button" className="iconbtn" onClick={onBack} aria-label="Back to camera">
          <BackIcon />
        </button>
        <h1 className="topbar__title">Gallery</h1>
        <button
          type="button"
          className="iconbtn"
          onClick={onOpenBookmarks}
          aria-label="Manage bookmarks"
        >
          <BookmarkIcon />
        </button>
      </header>

      {!loaded ? (
        <div className="screen__empty">Loading…</div>
      ) : photos.length === 0 ? (
        <div className="screen__empty">
          <p>No photos yet.</p>
          <button type="button" className="btn btn--primary" onClick={onBack}>
            Take your first shot
          </button>
        </div>
      ) : (
        <div className="grid">
          {thumbs.map((t) => (
            <button
              key={t.id}
              type="button"
              className="grid__tile"
              onClick={() => onOpenPhoto(t.id)}
              aria-label={`Open photo from ${new Date(t.createdAt).toLocaleString()}`}
            >
              <img src={t.url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
