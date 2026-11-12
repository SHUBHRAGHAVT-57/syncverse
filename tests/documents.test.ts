import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanTitle, connectionUrl, isRoomId, parseRecents, roomFromSearch, updateRecents } from '../src/lib/documents.ts';
const FIRST = 'e3db3fa7-1d94-4ed6-80f3-30a328bad138';
const SECOND = 'e3db3fa7-1d94-4ed6-80f3-30a328bad139';
test('validates UUID v4 room capabilities, including malformed inputs', () => {
  assert.equal(isRoomId(FIRST), true);
  assert.equal(isRoomId('e3db3fa7-1d94-1ed6-80f3-30a328bad138'), false);
  assert.equal(isRoomId('abc'), false);
  assert.equal(isRoomId({}), false);
});
test('reads room links safely', () => {
  assert.equal(roomFromSearch('?room='+FIRST), FIRST);
  assert.equal(roomFromSearch('?q=123'), null);
  assert.equal(roomFromSearch('?room=%3Cscript%3E'), 'invalid');
  assert.equal(roomFromSearch('?room='), 'invalid');
});
test('normalizes whitespace, limits titles and supplies fallback', () => {
  assert.equal(cleanTitle('  My  shared\n document  '), 'My shared document');
  assert.equal(cleanTitle('   '), 'Untitled document');
  assert.equal(cleanTitle('x'.repeat(200)).length, 100);
});
test('malformed shared titles remain safe to render and export', () => {
  for (const value of [undefined, null, 123, false, [], { text: 'Remote title' }]) {
    assert.equal(cleanTitle(value), 'Untitled document');
  }
});
test('rejects corrupt and malformed local history', () => {
  assert.deepEqual(parseRecents('{broken'), []);
  assert.deepEqual(parseRecents('{}'), []);
  assert.deepEqual(parseRecents(JSON.stringify([{ id:'oops', title:'bad', updatedAt:0 }])), []);
});
test('deduplicates, keeps most recent first, and caps history length', () => {
  const first = { id:FIRST, title:'First', updatedAt:20 };
  const second = { id:SECOND, title:'Second', updatedAt:10 };
  let result = updateRecents([second,first],{ id:SECOND,title:'  New  Name ',updatedAt:30 });
  assert.deepEqual(result.map(d=>d.id),[SECOND,FIRST]);
  assert.equal(result[0].title,'New Name');
  result = parseRecents(JSON.stringify([first, first, second]));
  assert.equal(result.length,2);
});
test('limits websocket URLs and does not create insecure production defaults', () => {
  assert.equal(connectionUrl('localhost', undefined),'ws://localhost:1234');
  assert.equal(connectionUrl('app.example.com', undefined),null);
  assert.equal(connectionUrl('example.com','https://example.com'),null);
  assert.equal(connectionUrl('example.com','javascript:alert(1)'),null);
  assert.equal(connectionUrl('example.com','wss://collab.example.com'),'wss://collab.example.com');
});
test('rejects relay URLs that break room routing or WebSocket construction', () => {
  for (const endpoint of [
    'wss://relay.example.com?token=example',
    'wss://relay.example.com?',
    'wss://relay.example.com#fragment',
    'wss://relay.example.com#',
    'wss://user:password@relay.example.com',
  ]) {
    assert.equal(connectionUrl('app.example.com', endpoint), null, endpoint);
  }
  assert.equal(connectionUrl('app.example.com', ' wss://relay.example.com/sync/// '), 'wss://relay.example.com/sync');
});
test('canonicalizes history room IDs and keeps the newest duplicate', () => {
  const result = parseRecents(JSON.stringify([
    { id: FIRST.toUpperCase(), title: 'Old', updatedAt: 10 },
    { id: SECOND, title: 'Second', updatedAt: 20 },
    { id: FIRST, title: '  Latest  title ', updatedAt: 30 },
  ]));
  assert.deepEqual(result, [
    { id: FIRST, title: 'Latest title', updatedAt: 30 },
    { id: SECOND, title: 'Second', updatedAt: 20 },
  ]);
});
test('opening a history item cannot create a second case-sensitive relay room', () => {
  const result = updateRecents([{ id: FIRST.toUpperCase(), title: 'Old', updatedAt: 10 }], {
    id: FIRST.toUpperCase(), title: 'New', updatedAt: 20,
  });
  assert.deepEqual(result, [{ id: FIRST, title: 'New', updatedAt: 20 }]);
});
test('history rejects out-of-range dates and bounds stored titles', () => {
  const result = parseRecents(JSON.stringify([
    { id: FIRST, title: 'Invalid date', updatedAt: 1e20 },
    { id: SECOND, title: 'x'.repeat(200), updatedAt: 20 },
  ]));
  assert.deepEqual(result, [{ id: SECOND, title: 'x'.repeat(100), updatedAt: 20 }]);
});
test('history keeps the newest 30 entries even when stored out of order', () => {
  const items = Array.from({ length: 35 }, (_, index) => ({
    id: `e3db3fa7-1d94-4ed6-80f3-${String(index).padStart(12, '0')}`,
    title: `Document ${index}`, updatedAt: index,
  }));
  const result = parseRecents(JSON.stringify(items));
  assert.equal(result.length, 30);
  assert.equal(result[0].updatedAt, 34);
  assert.equal(result[29].updatedAt, 5);
});
