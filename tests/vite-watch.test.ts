import { test } from 'node:test';
import assert from 'node:assert/strict';
import viteConfig from '../vite.config.ts';

test('Vite ignores the local relay data directory and its locked LevelDB files', () => {
  const ignored = viteConfig.server?.watch?.ignored;
  assert.ok(Array.isArray(ignored), 'Expected an explicit ignored watch-path list');
  assert.ok(ignored.includes('**/.syncverse-data'), 'Exclude the directory itself');
  assert.ok(ignored.includes('**/.syncverse-data/**'), 'Exclude the LevelDB LOCK file and other children');
});
