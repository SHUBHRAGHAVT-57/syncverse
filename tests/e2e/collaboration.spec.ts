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
