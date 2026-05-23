import { saveBlobToDevice } from './download';
import { openUrl } from './nav';
import {
  blobToFile,
  canShareFiles,
  copyImageToClipboard,
  photoFilename,
  sharePhoto,
  type ShareOutcome,
} from './share';
import type { Photo, ShareRoute } from '../types';

function fillTemplate(
  template: string,
  vars: Record<string, string | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined ? '' : encodeURIComponent(value);
  });
}

async function runWebShare(
  route: Extract<ShareRoute, { kind: 'web-share' }>,
  photo: Photo,
): Promise<ShareOutcome> {
  const file = blobToFile(photo.blob, photoFilename(photo.createdAt));
  if (!canShareFiles(file)) return { kind: 'unsupported' };
  return sharePhoto(file, { title: route.title, text: route.text });
}

async function runAppleShortcut(
  route: Extract<ShareRoute, { kind: 'apple-shortcut' }>,
  photo: Photo,
): Promise<ShareOutcome> {
  if (route.passImageVia === 'clipboard') {
    const ok = await copyImageToClipboard(photo.blob);
    if (!ok) {
      return {
        kind: 'error',
        message: 'Could not copy image to clipboard',
      };
    }
  }
  openUrl(
    `shortcuts://run-shortcut?name=${encodeURIComponent(route.shortcutName)}`,
  );
  return { kind: 'shared' };
}

async function runAndroidIntent(
  route: Extract<ShareRoute, { kind: 'android-intent' }>,
  photo: Photo,
): Promise<ShareOutcome> {
  if (route.passImageVia === 'clipboard') {
    const ok = await copyImageToClipboard(photo.blob);
    if (!ok) {
      return {
        kind: 'error',
        message: 'Could not copy image to clipboard',
      };
    }
  }
  const parts = [
    `action=${route.action}`,
    `package=${route.package}`,
    `type=${route.mimeType}`,
  ];
  if (route.text) {
    parts.push(`S.android.intent.extra.TEXT=${encodeURIComponent(route.text)}`);
  }
  openUrl(`intent://send/#Intent;${parts.join(';')};end`);
  return { kind: 'shared' };
}

async function runUrlScheme(
  route: Extract<ShareRoute, { kind: 'url-scheme' }>,
  photo: Photo,
): Promise<ShareOutcome> {
  if (route.passImageVia === 'clipboard') {
    const ok = await copyImageToClipboard(photo.blob);
    if (!ok) {
      return {
        kind: 'error',
        message: 'Could not copy image to clipboard',
      };
    }
  } else if (route.passImageVia === 'download') {
    saveBlobToDevice(photo.blob, photoFilename(photo.createdAt));
  }
  const url = fillTemplate(route.template, {
    text: route.text,
    recipient: route.recipient,
  });
  openUrl(url);
  return { kind: 'shared' };
}

export async function dispatchRoute(
  route: ShareRoute,
  photo: Photo,
): Promise<ShareOutcome> {
  switch (route.kind) {
    case 'web-share':
      return runWebShare(route, photo);
    case 'apple-shortcut':
      return runAppleShortcut(route, photo);
    case 'android-intent':
      return runAndroidIntent(route, photo);
    case 'url-scheme':
      return runUrlScheme(route, photo);
  }
}

export function describeRoute(route: ShareRoute): string {
  switch (route.kind) {
    case 'web-share':
      return (
        [route.title, route.text].filter(Boolean).join(' · ') || 'Web Share'
      );
    case 'apple-shortcut':
      return `Apple Shortcut · ${route.shortcutName}`;
    case 'android-intent':
      return `Android Intent · ${route.package}`;
    case 'url-scheme':
      return `URL · ${route.template}`;
  }
}
