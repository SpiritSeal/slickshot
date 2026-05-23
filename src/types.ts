export type Photo = {
  id: string;
  blob: Blob;
  createdAt: number;
  width: number;
  height: number;
};

export type ShareRoute =
  | { kind: 'web-share'; title?: string; text?: string }
  | {
      kind: 'apple-shortcut';
      shortcutName: string;
      passImageVia: 'clipboard' | 'none';
    }
  | {
      kind: 'android-intent';
      package: string;
      action: string;
      mimeType: string;
      text?: string;
      passImageVia: 'clipboard' | 'none';
    }
  | {
      kind: 'url-scheme';
      template: string;
      recipient?: string;
      text?: string;
      passImageVia: 'clipboard' | 'download' | 'none';
    };

export type ShareRouteKind = ShareRoute['kind'];

export type Bookmark = {
  id: string;
  label: string;
  route: ShareRoute;
};
