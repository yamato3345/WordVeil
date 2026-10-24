import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { extractClipboardWord } from '../src/features/word-selection/globalSelection/clipboardWord.ts';

const source = readFileSync(new URL('../src/features/word-selection/globalSelection/GlobalWordsSelection.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;

function harness(invoke) {
  let cleanup;
  let nextTimer = 0;
  const timers = new Map();
  const listeners = new Map();
  const selected = [];
  const exports = {};
  const window = {
    setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name) { listeners.delete(name); },
  };
  vm.runInNewContext(compiled, {
    exports, window, Date,
    require(name) {
      if (name === 'react') return { useRef: value => ({ current: value }), useEffect: fn => { cleanup = fn(); } };
      if (name === '@tauri-apps/api/event') return { listen: async (name, fn) => { listeners.set(name, fn); return () => listeners.delete(name); } };
      if (name === '@tauri-apps/api/core') return { invoke };
      if (name === './clipboardWord') return { extractClipboardWord };
      return { CLIPBOARD_CAPTURE_COOLDOWN_MS: 700, CLIPBOARD_POLL_INTERVAL_MS: 600, CLIPBOARD_CTRL_C_READ_DELAY_MS: 110 };
    },
  });
  exports.GlobalWordsSelection({ active: true, onWordSelected: word => selected.push(word) });
  return {
    selected, listeners, timers,
    cleanup: () => cleanup(),
    async tick(delay) {
      const entry = [...timers].find(([, timer]) => timer.delay === delay);
      assert.ok(entry, `Missing ${delay}ms timer`);
      timers.delete(entry[0]);
      await entry[1].fn();
      await flush();
    },
  };
}
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

test('extracts whole Unicode words and ignores phrases, URLs and oversized input', () => {
  for (const [raw, expected] of [['hello', 'hello'], ['«привіт!»', 'привіт'], ['п’ять', 'п’ять'], ["don't", "don't"], ['mother-in-law', 'mother-in-law'], ['hello world', ''], ['https://example.com', ''], ['123', ''], ['a'.repeat(257), ''], ['e\u0301', 'e\u0301']]) {
    assert.equal(extractClipboardWord(raw), expected);
  }
});

test('initial clipboard is a baseline; changes and explicit repeated copies work', async () => {
  let raw = 'old';
  const h = harness(async () => raw);
  await flush();
  assert.deepEqual(h.selected, []);
  raw = 'привіт';
  await h.tick(600);
  assert.deepEqual(h.selected, ['привіт']);
  h.listeners.get('copy')();
  await h.tick(110);
  assert.deepEqual(h.selected, ['привіт', 'привіт']);
  h.cleanup();
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.size, 0);
});

test('a result arriving after unmount never opens the overlay or schedules polling', async () => {
  let resolve;
  const h = harness(() => new Promise(done => { resolve = done; }));
  h.cleanup();
  resolve('hello');
  await flush();
  assert.deepEqual(h.selected, []);
  assert.equal(h.timers.size, 0);
});

test('failed reads recover and pending copies do not overlap an in-flight read', async () => {
  let calls = 0;
  let resolve;
  const h = harness(() => {
    calls++;
    if (calls === 1) return Promise.reject(new Error('unavailable'));
    if (calls === 2) return new Promise(done => { resolve = done; });
    return Promise.resolve('word');
  });
  await flush();
  const poll = h.tick(600);
  await flush();
  h.listeners.get('copy')();
  await h.tick(110);
  assert.equal(calls, 2);
  resolve('word');
  await poll;
  await flush();
  assert.equal(calls, 3);
  assert.deepEqual(h.selected, ['word']);
  h.cleanup();
});

test('overlay decodes text without scheduling WebView hide timers', () => {
  const html = readFileSync(new URL('../public/overlay.html', import.meta.url), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const timers = new Map();
  let nextId = 0;
  const value = { textContent: '' };
  const window = { location: { search: '?word=100%25' } };
  vm.runInNewContext(script, {
    window, URLSearchParams, console,
    document: { getElementById: () => value },
    setTimeout(fn) { const id = ++nextId; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  assert.equal(value.textContent, '100%');
  window.__WORDVEIL_SET_WORD('привіт');
  assert.equal(value.textContent, 'привіт');
  assert.equal(timers.size, 0);
});

test('external copies of the same word each display the overlay', async () => {
  const h = harness(async () => 'hello');
  await flush();
  for (let i = 0; i < 3; i++) {
    h.listeners.get('clipboard-copy')();
    await h.tick(110);
  }
  assert.deepEqual(h.selected, ['hello', 'hello', 'hello']);
  await h.tick(600);
  assert.equal(h.selected.length, 3);
  h.cleanup();
});
