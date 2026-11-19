import { devices } from '@playwright/test';
import type { PlaywrightTestConfig } from '@playwright/test';

const host = '127.0.0.1';

function portFromEnv(name: string, fallback: number): number {
  const value = process.env[name] ?? String(fallback);
  const port = Number(value);
  if (!/^\d+$/.test(value) || port < 1 || port > 65535) {
    throw new Error(`${name} must be an integer between 1 and 65535.`);
  }
  return port;
}

export function browserConfig(suite: 'e2e' | 'recovery'): PlaywrightTestConfig {
  const recovery = suite === 'recovery';
  const webPort = portFromEnv('SYNCVERSE_TEST_WEB_PORT', recovery ? 5174 : 5173);
  const relayPort = portFromEnv('SYNCVERSE_TEST_RELAY_PORT', recovery ? 1235 : 1234);
  if (webPort === relayPort) throw new Error('Frontend and relay ports must differ.');
  const baseURL = `http://${host}:${webPort}`;
  const relayUrl = `ws://${host}:${relayPort}`;

  return {
    globalSetup: './tests/support/start-test-servers.ts',
    testDir: `./tests/${suite}`,
    timeout: 30000,
    expect: { timeout: 12000 },
    outputDir: `test-results/${suite}`,
    workers: recovery ? 1 : undefined,
    metadata: { relayUrl, suite },
    use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  };
}
