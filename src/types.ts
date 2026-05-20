export type Photo = {
  id: string;
  blob: Blob;
  createdAt: number;
  width: number;
  height: number;
};

export type Bookmark = {
  id: string;
  label: string;
  title?: string;
  text?: string;
};
