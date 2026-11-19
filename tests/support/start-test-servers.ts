import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FullConfig } from '@playwright/test';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';

const app = fileURLToPath(new URL('../../', import.meta.url));

async function startRelay(endpoint: URL): Promise<() => Promise<void>> {
  const port = endpoint.port || '80';
  const env: NodeJS.ProcessEnv = { ...process.env, HOST: endpoint.hostname, PORT: port };
  // An empty YPERSISTENCE still enables LevelDB in y-websocket.
  delete env.YPERSISTENCE;

  // Own the Node process directly and close it if the Playwright runner exits.
  const entry = `process.once('disconnect', () => process.exit(0)); require('./node_modules/y-websocket/bin/server.cjs');`;
  const relay = spawn(process.execPath, ['--input-type=commonjs', '-e', entry], {
    cwd: app,
    env,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    windowsHide: true,
  });
  async function stop() {
    if (!relay.pid || relay.exitCode !== null || relay.signalCode !== null) return;
    const exited = once(relay, 'exit');
    relay.kill();
    await exited;
  }

  const readyMessage = `running at '${endpoint.hostname}' on port ${port}`;
  let output = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await new Promise<void>((accept, reject) => {
      timer = setTimeout(() => reject(new Error(`Relay failed to start at ${endpoint}:\n${output}`)), 15000);
      relay.once('error', reject);
      relay.once('exit', () => reject(new Error(`Relay exited before startup at ${endpoint}:\n${output}`)));
      relay.stderr?.on('data', chunk => { output += String(chunk); });
      relay.stdout?.on('data', chunk => {
        output += String(chunk);
        if (output.includes(readyMessage)) accept();
      });
    });
  } catch (error) {
    await stop();
    throw error;
  } finally {
    clearTimeout(timer);
  }
  return stop;
}

export default async function startTestServers(config: FullConfig) {
  const { relayUrl, suite } = config.metadata;
  const web = new URL(config.projects[0].use.baseURL!);
  let frontend: ViteDevServer | undefined;
  let stopRelay: (() => Promise<void>) | undefined;
  async function stop() {
    await Promise.all([frontend?.close(), stopRelay?.()]);
  }

  try {
    // The recovery test manages its own persistent relay and restarts.
    if (suite === 'e2e') stopRelay = await startRelay(new URL(relayUrl));
    frontend = await createServer({
      root: app,
      configLoader: 'runner',
      cacheDir: resolve(app, 'test-results', `${suite}-vite-cache`),
      define: { 'import.meta.env.VITE_SYNCVERSE_WS_URL': JSON.stringify(relayUrl) },
      server: { host: web.hostname, port: Number(web.port || '80'), strictPort: true },
    });
    await frontend.listen();
    return stop;
  } catch (error) {
    await stop();
    throw error;
  }
}
