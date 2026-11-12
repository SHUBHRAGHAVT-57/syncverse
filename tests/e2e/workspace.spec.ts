import { expect, test } from '@playwright/test';

for (const width of [320, 375, 760]) {
  test(`profile remains editable from workspace and room at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto('/');
    const profile = page.getByRole('button', { name: 'Edit display name', exact: true });
    await expect(profile).toBeInViewport({ ratio: 1 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await profile.click();
    await page.getByRole('textbox', { name: 'DISPLAY NAME', exact: true }).fill('Mobile writer');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await page.getByRole('button', { name: 'Create a document' }).click();
    await expect(page.getByTestId('editor')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy document link' })).toBeVisible();
    await profile.click();
    await expect(page.getByRole('textbox', { name: 'DISPLAY NAME', exact: true })).toHaveValue('Mobile writer');
    await page.getByRole('textbox', { name: 'DISPLAY NAME', exact: true }).fill('Room writer');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Back to workspace' }).click();
    await profile.click();
    await expect(page.getByRole('textbox', { name: 'DISPLAY NAME', exact: true })).toHaveValue('Room writer');
  });
}

test('long document titles stay within the room and recent cards on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a document' }).click();
  await page.getByRole('button', { name: 'Rename document' }).click();
  const title = page.getByRole('textbox', { name: 'Document title', exact: true });
  await title.fill('A'.repeat(100));
  await title.press('Enter');
  await expect(page.getByRole('heading', { name: 'A'.repeat(100), exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Back to workspace' }).click();
  await expect(page.getByRole('heading', { name: 'A'.repeat(100), exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('recent documents update across tabs after additions, removal, and storage clear', async ({ page, context }) => {
  await page.goto('/');
  const other = await context.newPage();
  await other.goto('/');
  const addRecent = () => other.evaluate(() => localStorage.setItem('syncverse:recent:v1', JSON.stringify([
    { id: 'e3db3fa7-1d94-4ed6-80f3-30a328bad138', title: 'Shared notes', updatedAt: 1000 },
  ])));
  await addRecent();
  await expect(page.getByRole('heading', { name: 'Shared notes', exact: true })).toBeVisible();
  await other.reload();
  await other.getByRole('button', { name: 'Remove Shared notes from recent documents' }).click();
  await expect(page.getByRole('heading', { name: 'Shared notes', exact: true })).toHaveCount(0);
  await addRecent();
  await expect(page.getByRole('heading', { name: 'Shared notes', exact: true })).toBeVisible();
  await other.evaluate(() => localStorage.clear());
  await expect(page.getByRole('heading', { name: 'Shared notes', exact: true })).toHaveCount(0);
});

test('profile changes reach other tabs without replacing an unsaved name draft', async ({ page, context }) => {
  await page.goto('/');
  const other = await context.newPage();
  await other.goto('/');
  await page.getByTitle('Edit display name').click();
  await page.getByRole('textbox', { name: 'DISPLAY NAME', exact: true }).fill('My unsaved draft');
  await other.getByTitle('Edit display name').click();
  await other.getByRole('textbox', { name: 'DISPLAY NAME', exact: true }).fill('Morgan');
  await other.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByTitle('Edit display name')).toContainText('Morgan');
  await expect(page.getByRole('textbox', { name: 'DISPLAY NAME', exact: true })).toHaveValue('My unsaved draft');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByTitle('Edit display name').click();
  await expect(page.getByRole('textbox', { name: 'DISPLAY NAME', exact: true })).toHaveValue('Morgan');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await other.evaluate(() => localStorage.removeItem('syncverse:profile:v1'));
  await expect(page.getByTitle('Edit display name')).toContainText('Guest creator');
  await other.getByTitle('Edit display name').click();
  await other.getByRole('textbox', { name: 'DISPLAY NAME', exact: true }).fill('Casey');
  await other.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByTitle('Edit display name')).toContainText('Casey');
  await other.evaluate(() => localStorage.clear());
  await expect(page.getByTitle('Edit display name')).toContainText('Guest creator');
});

test('document-first workspace keeps creation visible and search recoverable', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('sans-serif');
  await expect(page.getByRole('button', { name: 'Create a document' })).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole('heading', { name: 'Your first draft starts here' })).toBeVisible();
  await page.evaluate(() => localStorage.setItem('syncverse:recent:v1', JSON.stringify([
    { id: 'e3db3fa7-1d94-4ed6-80f3-30a328bad138', title: 'Research notes', updatedAt: 1000 },
    { id: 'e3db3fa7-1d94-4ed6-80f3-30a328bad139', title: 'Meeting draft', updatedAt: 2000 },
  ])));
  await page.reload();
  const search = page.getByRole('searchbox', { name: 'Search documents' });
  await search.fill('research');
  await expect(page.getByRole('heading', { name: 'Research notes', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Meeting draft', exact: true })).toHaveCount(0);
  await search.fill('unmatched');
  await expect(page.getByRole('heading', { name: 'No matching documents' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(search).toHaveValue('');
  await expect(page.getByRole('heading', { name: 'Meeting draft', exact: true })).toBeVisible();
  const remove = page.getByRole('button', { name: 'Remove Research notes from recent documents' });
  await expect(remove).toBeVisible();
  await remove.click();
  await expect(page.getByRole('heading', { name: 'Research notes', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /^Meeting draft Markdown/ }).click();
  await expect(page).toHaveURL(/room=e3db3fa7-1d94-4ed6-80f3-30a328bad139/);
  await expect(page.getByRole('button', { name: 'Write', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

// A document opened from the end of a long recent list must begin at its controls.
test('opening a document resets the library scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('syncverse:recent:v1', JSON.stringify(
    Array.from({ length: 20 }, (_, index) => ({
      id: `e3db3fa7-1d94-4ed6-80f3-${String(index).padStart(12, '0')}`,
      title: `Draft ${index}`, updatedAt: index,
    })),
  )));
  await page.reload();
  await page.getByRole('button', { name: /^Draft 0 Markdown/ }).click();
  await expect(page.getByRole('button', { name: 'Back to workspace' })).toBeInViewport({ ratio: 1 });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
