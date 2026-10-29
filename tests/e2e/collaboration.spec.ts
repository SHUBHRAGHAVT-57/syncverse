import { expect, test } from '@playwright/test';
test('two independent browsers merge concurrent edits and restore changes after reload', async ({ browser }) => {
  const first = await browser.newContext();
  const second = await browser.newContext();
  const a = await first.newPage();
  const b = await second.newPage();
  try {
    await a.goto('/');
    await a.getByRole('button', { name:/Create a document/i }).click();
    const url = a.url();
    await b.goto(url);
    await expect(a.getByTestId('editor')).toBeVisible();
    await expect(b.getByTestId('editor')).toBeVisible();
    await expect(a.getByText('Live', {exact:true})).toBeVisible();
    await expect(b.getByText('Live', {exact:true})).toBeVisible();
    await a.locator('.cm-content').fill('Shared hello from browser A');
    await expect(b.locator('.cm-content')).toContainText('Shared hello from browser A');
    await b.locator('.cm-content').press('End');
    await b.locator('.cm-content').press('Enter');
    await b.locator('.cm-content').type('And hello from browser B');
    await expect(a.locator('.cm-content')).toContainText('And hello from browser B');
    await a.reload();
    await expect(a.locator('.cm-content')).toContainText('Shared hello from browser A');
    await expect(a.locator('.cm-content')).toContainText('And hello from browser B');
    await a.getByRole('button',{name:'Preview'}).click();
    await expect(a.locator('.markdown-preview')).toContainText('And hello from browser B');
  } finally { await first.close(); await second.close(); }
});
test('new users can change display name and document titles sync between sessions', async ({ browser }) => {
  const aContext = await browser.newContext();
  const bContext = await browser.newContext();
  const a = await aContext.newPage();
  const b = await bContext.newPage();
  try {
    await a.goto('/');
    await a.getByRole('button',{name:/Create a document/i}).click();
    await b.goto(a.url());
    await a.getByRole('button',{name:'Rename document'}).click();
    await a.getByRole('textbox',{name:'Document title'}).fill('Launch notes');
    await a.getByRole('textbox',{name:'Document title'}).press('Enter');
    await expect(b.getByRole('button',{name:'Rename document'})).toContainText('Launch notes');
    await a.getByRole('button',{name:/Edit display name/}).click();
    await a.getByRole('textbox',{name:'DISPLAY NAME'}).fill('Morgan');
    await a.getByRole('button',{name:'Save profile'}).click();
    await expect(a.getByText('Morgan')).toBeVisible();
  } finally { await aContext.close(); await bContext.close(); }
});

test('offline edits converge with online edits after reconnecting', async ({ browser }) => {
  test.setTimeout(65000);
  const onlineContext = await browser.newContext();
  const offlineContext = await browser.newContext();
  const online = await onlineContext.newPage();
  const offline = await offlineContext.newPage();
  try {
    await online.goto('/');
    await online.getByRole('button', { name: /Create a document/i }).click();
    await offline.goto(online.url());
    await expect(online.getByText('Live', { exact: true })).toBeVisible();
    await expect(offline.getByText('Live', { exact: true })).toBeVisible();

    const onlineEditor = online.locator('.cm-content');
    const offlineEditor = offline.locator('.cm-content');
    await onlineEditor.fill('Shared starting point');
    await expect(offlineEditor).toContainText('Shared starting point');

    await offline.getByRole('button', { name: 'Pause sync' }).click();
    await expect(offline.getByText('Offline', { exact: true })).toBeVisible();

    await offlineEditor.press('End');
    await offlineEditor.press('Enter');
    await offlineEditor.type('Change authored while offline');

    await onlineEditor.press('End');
    await onlineEditor.press('Enter');
    await onlineEditor.type('Change authored while online');

    await offline.getByRole('button', { name: 'Resume sync' }).click();
    await expect(offline.getByText('Live', { exact: true })).toBeVisible({ timeout: 25000 });
    await expect(onlineEditor).toContainText('Change authored while offline', { timeout: 25000 });
    await expect(offlineEditor).toContainText('Change authored while online', { timeout: 25000 });

    await offline.reload();
    await expect(offline.locator('.cm-content')).toContainText('Change authored while offline');
    await expect(offline.locator('.cm-content')).toContainText('Change authored while online');
  } finally {
    await onlineContext.close();
    await offlineContext.close();
  }
});
