import { expect, test } from '@playwright/test';

test.describe('Bookmarks CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Stub getUserMedia to reject so the camera screen shows its fallback UI
    // immediately — this makes the bookmark icon reachable without any browser
    // permission prompts (and without depending on the fake-camera flag).
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: () => Promise.reject(new Error('no camera in e2e')),
        },
      });
    });
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Slickshot' }),
    ).toBeVisible();
  });

  test('add, edit, and delete a bookmark; persists across reload', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: /manage bookmarks/i })
      .first()
      .click();
    await expect(
      page.getByRole('heading', { name: 'Bookmarks' }),
    ).toBeVisible();
    await expect(page.getByText(/no bookmarks yet/i)).toBeVisible();

    // Add.
    await page
      .getByRole('button', { name: /add your first bookmark/i })
      .click();
    await page.getByLabel(/label/i).fill('Mom');
    await page.getByLabel(/caption/i).fill('Daily pic');
    await page.getByRole('button', { name: /^save$/i }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByText('Mom')).toBeVisible();
    await expect(page.getByText('Daily pic')).toBeVisible();

    // Reload — verify persistence.
    await page.reload();
    await page
      .getByRole('button', { name: /manage bookmarks/i })
      .first()
      .click();
    await expect(page.getByText('Mom')).toBeVisible();

    // Edit.
    await page.getByRole('button', { name: /^Mom/ }).click();
    const label = page.getByLabel(/label/i);
    await label.fill('Mom & Dad');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText('Mom & Dad')).toBeVisible();

    // Delete (auto-accept the confirm dialog).
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /delete mom & dad/i }).click();
    await expect(page.getByText(/no bookmarks yet/i)).toBeVisible();
  });

  test('cancelling the delete confirm keeps the bookmark', async ({ page }) => {
    await page
      .getByRole('button', { name: /manage bookmarks/i })
      .first()
      .click();
    await page
      .getByRole('button', { name: /add your first bookmark/i })
      .click();
    await page.getByLabel(/label/i).fill('Keep me');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText('Keep me')).toBeVisible();

    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: /delete keep me/i }).click();
    await expect(page.getByText('Keep me')).toBeVisible();
  });
});
