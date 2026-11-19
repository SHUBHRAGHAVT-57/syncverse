import { expect, test } from '@playwright/test';

const redoShortcut = process.platform === 'darwin' ? 'Meta+Shift+z' : 'Control+y';

test('preview switching preserves undo and redo history', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a document', exact: true }).click();
  const editor = page.locator('.cm-content');
  const write = page.getByRole('button', { name: 'Write', exact: true });
  const preview = page.getByRole('button', { name: 'Preview', exact: true });
  await editor.fill('A draft worth keeping');
  await editor.press('ControlOrMeta+z');
  await expect(editor.locator('.cm-placeholder')).toBeVisible();
  await editor.press(redoShortcut);
  await expect(editor).toHaveText('A draft worth keeping');

  await preview.click();
  await expect(page.locator('.markdown-preview')).toHaveText('A draft worth keeping');
  await expect(editor).toBeHidden();
  await write.click();
  await editor.press('ControlOrMeta+z');
  await expect(editor.locator('.cm-placeholder')).toBeVisible();

  await preview.click();
  await expect(page.locator('.preview-empty')).toBeVisible();
  await write.click();
  await editor.press(redoShortcut);
  await expect(editor).toHaveText('A draft worth keeping');
  await expect(write).toHaveAttribute('aria-pressed', 'true');
  await expect(preview).toHaveAttribute('aria-pressed', 'false');
  await preview.click();
  await expect(write).toHaveAttribute('aria-pressed', 'false');
  await expect(preview).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('textbox', { name: 'Collaborative Markdown editor' })).toHaveCount(0);
});

test('preview switching preserves the selected text for continued editing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a document', exact: true }).click();
  const editor = page.locator('.cm-content');
  await editor.fill('One shared draft');
  await editor.press('Home');
  for (let i = 0; i < 4; i++) await editor.press('ArrowRight');
  for (let i = 0; i < 6; i++) await editor.press('Shift+ArrowRight');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.locator('.markdown-preview')).toHaveText('One shared draft');
  await page.getByRole('button', { name: 'Write', exact: true }).click();
  await editor.pressSequentially('careful');
  await expect(editor).toHaveText('One careful draft');
});

for (const preview of [false, true]) {
  test(`local undo preserves peer edits${preview ? ' received during preview' : ' with an exhausted undo stack'}`, async ({ browser }) => {
    const first = await browser.newContext();
    const second = await browser.newContext();
    try {
      const a = await first.newPage();
      const b = await second.newPage();
      await a.goto('/');
      await a.getByRole('button', { name: 'Create a document', exact: true }).click();
      await b.goto(a.url());
      await expect(a.locator('.status-label')).toHaveText('Live');
      await expect(b.locator('.status-label')).toHaveText('Live');
      const aEditor = a.locator('.cm-content');
      const bEditor = b.locator('.cm-content');
      await aEditor.fill('Local draft');
      await expect(bEditor).toContainText('Local draft');
      if (preview) await a.getByRole('button', { name: 'Preview', exact: true }).click();
      await bEditor.press('ControlOrMeta+End');
      await bEditor.press('Enter');
      await bEditor.pressSequentially('Remote addition');
      if (preview) {
        await expect(a.locator('.markdown-preview')).toContainText('Remote addition');
        await a.getByRole('button', { name: 'Write', exact: true }).click();
      }
      await expect(aEditor).toContainText('Remote addition');
      await aEditor.press('ControlOrMeta+z');
      await expect(aEditor).not.toContainText('Local draft');
      await expect(aEditor).toContainText('Remote addition');
      await expect(bEditor).not.toContainText('Local draft');
      await expect(bEditor).toContainText('Remote addition');
      await aEditor.press('ControlOrMeta+z');
      await expect(aEditor).toContainText('Remote addition');
      await expect(bEditor).toContainText('Remote addition');
      await aEditor.press(redoShortcut);
      await expect(aEditor).toContainText('Local draft');
      await expect(aEditor).toContainText('Remote addition');
      await expect(bEditor).toContainText('Local draft');
    } finally {
      await first.close();
      await second.close();
    }
  });
}
