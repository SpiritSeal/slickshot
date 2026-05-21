import { useCallback, useEffect, useState } from 'react';
import { CameraView } from './components/CameraView';
import { Gallery } from './components/Gallery';
import { PhotoViewer } from './components/PhotoViewer';
import { BookmarksScreen } from './components/BookmarksScreen';
import { Toast } from './components/Toast';
import { useToast } from './components/useToast';
import { listPhotos } from './lib/db';
import type { Photo } from './types';

type Screen =
  | { name: 'camera' }
  | { name: 'gallery' }
  | { name: 'viewer'; photoId: string }
  | { name: 'bookmarks' };

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'camera' });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { toast, message } = useToast();

  const refreshPhotos = useCallback(async () => {
    const list = await listPhotos();
    setPhotos(list);
  }, []);

  useEffect(() => {
    refreshPhotos().finally(() => setLoaded(true));
  }, [refreshPhotos]);

  const handleCaptured = useCallback(
    async (photo: Photo) => {
      await refreshPhotos();
      setScreen({ name: 'viewer', photoId: photo.id });
    },
    [refreshPhotos],
  );

  const handleDeleted = useCallback(async () => {
    await refreshPhotos();
    setScreen({ name: 'gallery' });
    toast('Photo deleted');
  }, [refreshPhotos, toast]);

  return (
    <div className="app">
      {screen.name === 'camera' && (
        <CameraView
          onCaptured={handleCaptured}
          onOpenGallery={() => setScreen({ name: 'gallery' })}
          onOpenBookmarks={() => setScreen({ name: 'bookmarks' })}
          galleryCount={photos.length}
        />
      )}

      {screen.name === 'gallery' && (
        <Gallery
          photos={photos}
          loaded={loaded}
          onBack={() => setScreen({ name: 'camera' })}
          onOpenPhoto={(id) => setScreen({ name: 'viewer', photoId: id })}
          onOpenBookmarks={() => setScreen({ name: 'bookmarks' })}
        />
      )}

      {screen.name === 'viewer' && (
        <PhotoViewer
          photoId={screen.photoId}
          onBack={() => setScreen({ name: 'gallery' })}
          onDeleted={handleDeleted}
          toast={toast}
        />
      )}

      {screen.name === 'bookmarks' && (
        <BookmarksScreen
          onBack={() => setScreen({ name: 'camera' })}
          toast={toast}
        />
      )}

      <Toast message={message} />
    </div>
  );
}
