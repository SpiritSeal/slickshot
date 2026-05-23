export type SharePreset = {
  title?: string;
  text?: string;
};

export function photoFilename(createdAt: number): string {
  const d = new Date(createdAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `slickshot-${stamp}.jpg`;
}

export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, {
    type: blob.type || 'image/jpeg',
    lastModified: Date.now(),
  });
}

export function canShareFiles(file: File): boolean {
  if (typeof navigator === 'undefined') return false;
  if (!('share' in navigator)) return false;
  if (typeof navigator.canShare !== 'function') return false;
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export type ShareOutcome =
  | { kind: 'shared' }
  | { kind: 'cancelled' }
  | { kind: 'unsupported' }
  | { kind: 'error'; message: string };

export async function sharePhoto(
  file: File,
  preset: SharePreset = {},
): Promise<ShareOutcome> {
  if (!('share' in navigator)) return { kind: 'unsupported' };
  if (!canShareFiles(file)) return { kind: 'unsupported' };
  try {
    await navigator.share({
      files: [file],
      title: preset.title,
      text: preset.text,
    });
    return { kind: 'shared' };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { kind: 'cancelled' };
    }
    const message = err instanceof Error ? err.message : 'Share failed';
    return { kind: 'error', message };
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return true;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  return false;
}

export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
      return false;
    }
    const item = new ClipboardItem({ [blob.type || 'image/jpeg']: blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
}
