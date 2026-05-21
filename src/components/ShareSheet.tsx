import { useEffect, useState } from 'react';
import { listBookmarks } from '../lib/bookmarks';
import {
  blobToFile,
  canShareFiles,
  copyTextToClipboard,
  photoFilename,
  sharePhoto,
} from '../lib/share';
import type { Bookmark, Photo } from '../types';

type Props = {
  photo: Photo;
  onSaveToDevice: () => void;
  toast: (msg: string) => void;
};

export function ShareSheet({ photo, onSaveToDevice, toast }: Props) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setBookmarks(listBookmarks());
  }, []);

  useEffect(() => {
    const file = blobToFile(photo.blob, photoFilename(photo.createdAt));
    setCanShare(canShareFiles(file));
  }, [photo]);

  const runShare = async (preset?: Bookmark) => {
    const file = blobToFile(photo.blob, photoFilename(photo.createdAt));
    if (canShareFiles(file)) {
      const outcome = await sharePhoto(file, {
        title: preset?.title ?? 'Slickshot photo',
        text: preset?.text,
      });
      if (outcome.kind === 'shared') toast('Shared');
      else if (outcome.kind === 'error')
        toast(`Share failed: ${outcome.message}`);
      return;
    }
    // Fallback: copy caption (if any) + trigger download.
    if (preset?.text) {
      const ok = await copyTextToClipboard(preset.text);
      if (ok) toast('Caption copied. Download starting…');
      else toast('Sharing not supported. Download starting…');
    } else {
      toast('Sharing not supported. Download starting…');
    }
    onSaveToDevice();
  };

  return (
    <div className="sharesheet">
      <div className="sharesheet__row">
        <button
          type="button"
          className="btn btn--primary btn--share"
          onClick={() => runShare()}
        >
          <ShareIcon />
          <span>{canShare ? 'Share…' : 'Share (download)'}</span>
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onSaveToDevice}
        >
          <DownloadIcon />
          <span>Save</span>
        </button>
      </div>

      {bookmarks.length > 0 && (
        <div className="sharesheet__bookmarks">
          <div className="sharesheet__label">Quick share</div>
          <div className="chiprow">
            {bookmarks.map((b) => (
              <button
                key={b.id}
                type="button"
                className="chip"
                onClick={() => runShare(b)}
                title={[b.title, b.text].filter(Boolean).join(' · ')}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!canShare && (
        <p className="sharesheet__hint">
          This browser can't share files directly. Tap Share to download the
          photo and copy any caption to the clipboard.
        </p>
      )}
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
