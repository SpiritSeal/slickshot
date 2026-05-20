import { expect, test } from '@playwright/test';

test.describe('Camera capture + share flow', () => {
  test('captures a photo with the fake camera, appears in gallery, share invokes navigator.share', async ({
    page,
  }) => {
    // Hook navigator.share BEFORE the page script runs so the install
    // sticks for the lifetime of the page.
    await page.addInitScript(() => {
      const w = window as unknown as {
        __shareCalls: unknown[];
        navigator: Navigator & {
          share: (data: ShareData) => Promise<void>;
          canShare: (data: ShareData) => boolean;
        };
      };
      w.__shareCalls = [];
      Object.defineProperty(navigator, 'canShare', {
        configurable: true,
        value: () => true,
      });
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (data: ShareData) => {
          w.__shareCalls.push({
            title: data.title,
            text: data.text,
            fileNames: (data.files ?? []).map((f) => f.name),
          });
        },
      });
    });

    await page.goto('/');

    // Camera should start with the fake video stream (via Chromium flags).
    const video = page.locator('.camera__video');
    await expect(video).toBeVisible();

    // Wait until the video element actually has frames.
    await page.waitForFunction(() => {
      const v = document.querySelector('.camera__video') as HTMLVideoElement | null;
      return !!v && v.readyState >= 2 && v.videoWidth > 0;
    }, undefined, { timeout: 15_000 });

    await page.getByRole('button', { name: /take photo/i }).click();

    // Capture lands us on the photo viewer with a share sheet.
    await expect(page.locator('.viewer__image')).toBeVisible();

    // Generic share.
    await page.getByRole('button', { name: /^share/i }).first().click();

    const shareCalls = await page.evaluate(
      () => (window as unknown as { __shareCalls: unknown[] }).__shareCalls,
    );
    expect(shareCalls.length).toBeGreaterThan(0);
    const first = shareCalls[0] as { title?: string; fileNames?: string[] };
    expect(first.title).toBe('Slickshot photo');
    expect(first.fileNames?.[0]).toMatch(/^slickshot-\d{8}-\d{6}\.jpg$/);

    // Go back to the gallery — the photo should be there.
    await page.getByRole('button', { name: /back to gallery/i }).click();
    await expect(page.locator('.grid__tile')).toHaveCount(1);
  });

  test('bookmark chip on the share sheet forwards its preset to navigator.share', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __shareCalls: unknown[] };
      w.__shareCalls = [];
      Object.defineProperty(navigator, 'canShare', {
        configurable: true,
        value: () => true,
      });
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (data: ShareData) => {
          w.__shareCalls.push({
            title: data.title,
            text: data.text,
            fileNames: (data.files ?? []).map((f) => f.name),
          });
        },
      });
      // Pre-seed a bookmark so it shows on the share sheet.
      localStorage.setItem(
        'slickshot.bookmarks',
        JSON.stringify([
          { id: 'bm-mom', label: 'Mom', title: 'Hi Mom', text: 'Pic of the day' },
        ]),
      );
    });

    await page.goto('/');
    await page.waitForFunction(() => {
      const v = document.querySelector('.camera__video') as HTMLVideoElement | null;
      return !!v && v.readyState >= 2 && v.videoWidth > 0;
    }, undefined, { timeout: 15_000 });
    await page.getByRole('button', { name: /take photo/i }).click();
    await expect(page.locator('.viewer__image')).toBeVisible();

    await page.getByRole('button', { name: 'Mom' }).click();
    const shareCalls = await page.evaluate(
      () => (window as unknown as { __shareCalls: unknown[] }).__shareCalls,
    );
    expect(shareCalls.length).toBe(1);
    const first = shareCalls[0] as { title?: string; text?: string };
    expect(first.title).toBe('Hi Mom');
    expect(first.text).toBe('Pic of the day');
  });
});
