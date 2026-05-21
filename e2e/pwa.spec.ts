import { expect, test } from '@playwright/test';

test.describe('PWA shell', () => {
  test('serves the manifest, sw.js and icons', async ({ page, request }) => {
    const manifestResp = await request.get('/manifest.webmanifest');
    expect(manifestResp.ok()).toBeTruthy();
    const manifest = await manifestResp.json();
    expect(manifest.name).toBe('Slickshot');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    const swResp = await request.get('/sw.js');
    expect(swResp.ok()).toBeTruthy();

    const iconResp = await request.get('/icon-192.png');
    expect(iconResp.ok()).toBeTruthy();
    expect(Number(iconResp.headers()['content-length'] ?? 0)).toBeGreaterThan(
      0,
    );

    await page.goto('/');
    const linkRel = await page.locator('link[rel="manifest"]').count();
    expect(linkRel).toBeGreaterThan(0);
  });
});
