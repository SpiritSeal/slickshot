import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { addPhoto } from '../lib/db';
import type { Photo } from '../types';

type Facing = 'environment' | 'user';

type Props = {
  onCaptured: (photo: Photo) => void;
  onOpenGallery: () => void;
  onOpenBookmarks: () => void;
  galleryCount: number;
};

export function CameraView({
  onCaptured,
  onOpenGallery,
  onOpenBookmarks,
  galleryCount,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [facing, setFacing] = useState<Facing>('environment');
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [capturing, setCapturing] = useState(false);

  const stopStream = useCallback(() => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startStream = useCallback(
    async (mode: Facing) => {
      setStarting(true);
      setError(null);
      stopStream();
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setError('Camera not available in this browser.');
        setStarting(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode } },
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Camera access denied.';
        setError(message);
      } finally {
        setStarting(false);
      }
    },
    [stopStream],
  );

  useEffect(() => {
    void startStream(facing);
    return () => {
      stopStream();
    };
  }, [facing, startStream, stopStream]);

  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    setCapturing(true);
    try {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (facing === 'user') {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, w, h);
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92),
      );
      if (!blob) return;
      const photo = await addPhoto({ blob, width: w, height: h });
      onCaptured(photo);
    } finally {
      setCapturing(false);
    }
  }, [facing, onCaptured]);

  const handleFallbackFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      const url = URL.createObjectURL(file);
      try {
        const img = new Image();
        img.src = url;
        await img.decode();
        const photo = await addPhoto({
          blob: file,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        onCaptured(photo);
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    [onCaptured],
  );

  return (
    <div className="camera">
      <div className="camera__topbar">
        <button
          type="button"
          className="iconbtn"
          onClick={onOpenBookmarks}
          aria-label="Manage bookmarks"
          title="Bookmarks"
        >
          <BookmarkIcon />
        </button>
        <h1 className="brand">Slickshot</h1>
        <button
          type="button"
          className="iconbtn"
          onClick={() =>
            setFacing((f) => (f === 'environment' ? 'user' : 'environment'))
          }
          aria-label="Switch camera"
          title="Switch camera"
          disabled={!!error}
        >
          <FlipIcon />
        </button>
      </div>

      <div className="camera__viewport">
        {error ? (
          <div className="camera__fallback">
            <p className="camera__error">{error}</p>
            <p className="camera__hint">
              You can still capture a photo using the system camera.
            </p>
            <label className="btn btn--primary">
              Open system camera
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={handleFallbackFile}
              />
            </label>
          </div>
        ) : (
          <video
            ref={videoRef}
            className={`camera__video ${facing === 'user' ? 'camera__video--mirror' : ''}`}
            autoPlay
            playsInline
            muted
          />
        )}
        {starting && !error && (
          <div className="camera__starting">Starting camera…</div>
        )}
      </div>

      <div className="camera__controls">
        <button
          type="button"
          className="thumbbtn"
          onClick={onOpenGallery}
          aria-label={`Open gallery (${galleryCount} photo${galleryCount === 1 ? '' : 's'})`}
        >
          <GalleryIcon />
          {galleryCount > 0 && (
            <span className="thumbbtn__badge">{galleryCount}</span>
          )}
        </button>

        <button
          type="button"
          className="shutter"
          onClick={handleCapture}
          disabled={!!error || starting || capturing}
          aria-label="Take photo"
        >
          <span className="shutter__inner" />
        </button>

        <div className="camera__placeholder" aria-hidden />
      </div>
    </div>
  );
}

function BookmarkIcon() {
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
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function FlipIcon() {
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
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function GalleryIcon() {
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
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}
