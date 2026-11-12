import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectionState } from '../src/lib/connection-status.ts';

test('an unconfigured relay remains local-only', () => {
  assert.equal(connectionState(null), 'local');
});
test('connecting and connected-but-unsynced sockets do not claim Live', () => {
  assert.equal(connectionState({ wsconnecting: true, wsconnected: false, synced: false }), 'connecting');
  assert.equal(connectionState({ wsconnecting: false, wsconnected: true, synced: false }), 'connecting');
});
test('Live requires both transport connection and initial document synchronization', () => {
  assert.equal(connectionState({ wsconnecting: false, wsconnected: true, synced: true }), 'live');
});
test('disconnection takes priority over a stale synchronization flag', () => {
  assert.equal(connectionState({ wsconnecting: false, wsconnected: false, synced: true }), 'offline');
  assert.equal(connectionState({ wsconnecting: false, wsconnected: false, synced: false }), 'offline');
});
