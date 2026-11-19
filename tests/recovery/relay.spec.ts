import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const app = fileURLToPath(new URL('../../', import.meta.url));

test('relay restart recovers pending edits and persisted content without an existing browser cache', async ({ browser }, testInfo) => {
  test.setTimeout(90000);
  // Own the relay process and a disposable database; never interrupt a developer's relay.
  await new Promise<void>((accept, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(1234, '127.0.0.1', () => probe.close(() => accept()));
  });
  const data = await mkdtemp(join(tmpdir(), 'syncverse-relay-'));
  const contexts = [await browser.newContext(), await browser.newContext()];
  let relay: ChildProcess | undefined;
  let relayLog = '';

  async function startRelay() {
    relay = spawn(process.execPath, [join(app, 'node_modules/y-websocket/bin/server.cjs')], {
      cwd: app,
      windowsHide: true,
      env: { ...process.env, HOST: '127.0.0.1', PORT: '1234', YPERSISTENCE: data },
    });
    relay.stdout?.on('data', chunk => { relayLog += String(chunk); });
    relay.stderr?.on('data', chunk => { relayLog += String(chunk); });
    let startupError: Error | undefined;
    relay.once('error', error => { startupError = error; });
    await expect.poll(async () => {
      if (startupError) throw startupError;
      if (relay!.exitCode !== null) throw new Error(`Relay exited: ${relayLog}`);
      try { return (await fetch('http://127.0.0.1:1234')).ok; }
      catch { return false; }
    }).toBe(true);
  }

  async function stopRelay() {
    if (relay && relay.exitCode === null && relay.signalCode === null) {
      const stopped = once(relay, 'exit');
      relay.kill();
      await stopped;
    }
    relay = undefined;
  }

  try {
    await startRelay();
    const a = await contexts[0].newPage();
    const b = await contexts[1].newPage();
    await a.goto('/');
    await a.getByRole('button', { name: 'Create a document', exact: true }).click();
    const url = a.url();
    await b.goto(url);
    await expect(a.locator('.status-label')).toHaveText('Live');
    await expect(b.locator('.status-label')).toHaveText('Live');
    const aEditor = a.locator('.cm-content');
    const bEditor = b.locator('.cm-content');
    await aEditor.fill('Before relay restart');
    await expect(bEditor).toContainText('Before relay restart');

    await stopRelay();
    for (const page of [a, b]) await expect(page.locator('.sync-status')).toContainText('Edits pending sync');
    await aEditor.press('ControlOrMeta+End');
    await aEditor.press('Enter');
    await aEditor.pressSequentially('Offline edit from A');
    await bEditor.press('ControlOrMeta+End');
    await bEditor.press('Enter');
    await bEditor.pressSequentially('Offline edit from B');
    await b.getByRole('button', { name: 'Rename document' }).click();
    await b.getByRole('textbox', { name: 'Document title', exact: true }).fill('Recovery notes');
    await b.getByRole('textbox', { name: 'Document title', exact: true }).press('Enter');

    await startRelay();
    for (const page of [a, b]) await expect(page.locator('.status-label')).toHaveText('Live', { timeout: 25000 });
    for (const editor of [aEditor, bEditor]) {
      await expect(editor).toContainText('Before relay restart');
      await expect(editor).toContainText('Offline edit from A');
      await expect(editor).toContainText('Offline edit from B');
    }
    await expect(a.getByRole('button', { name: 'Rename document' })).toHaveText('Recovery notes');

    // With both original clients gone, a fresh context can only restore from LevelDB.
    await Promise.all(contexts.map(context => context.close()));
    await stopRelay();
    await startRelay();
    const fresh = await browser.newContext();
    contexts.push(fresh);
    const restored = await fresh.newPage();
    await restored.goto(url);
    await expect(restored.locator('.status-label')).toHaveText('Live');
    await expect(restored.getByRole('button', { name: 'Rename document' })).toHaveText('Recovery notes');
    for (const text of ['Before relay restart', 'Offline edit from A', 'Offline edit from B']) {
      await expect(restored.locator('.cm-content')).toContainText(text);
    }
  } finally {
    await Promise.all(contexts.map(context => context.close()));
    await stopRelay();
    await testInfo.attach('relay-log', { body: relayLog, contentType: 'text/plain' });
    const target = resolve(data);
    if (dirname(target) !== resolve(tmpdir()) || !target.startsWith(join(resolve(tmpdir()), 'syncverse-relay-'))) {
      throw new Error(`Refusing to remove unexpected recovery directory: ${target}`);
    }
    await rm(target, { recursive: true, force: true });
  }
});
