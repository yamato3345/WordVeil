import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePreferences, defaultPreferences, readPreferences, applyTheme } from '../src/features/preferences/preferences.ts';

test('missing or corrupt saved preferences fall back safely', () => {
  for (const raw of [null, '', '{bad json', 'null', 'false', '42']) {
    assert.deepEqual(parsePreferences(raw), defaultPreferences);
  }
});

test('restores appearance, disabled capture and a Unicode profile', () => {
  const preferences = { theme: 'dark', captureWords: false, profile: { name: 'Олександр', bio: 'Вивчаю англійську', nativeLanguage: 'uk', dailyGoal: 25 } };
  assert.deepEqual(parsePreferences(JSON.stringify(preferences)), preferences);
});

test('invalid stored fields cannot escape supported preferences', () => {
  const result = parsePreferences(JSON.stringify({ theme: 'invalid', captureWords: 'false', profile: { name: 'x'.repeat(100), bio: 'a'.repeat(300), nativeLanguage: 'invalid', dailyGoal: -1 } }));
  assert.equal(result.theme, 'system');
  assert.equal(result.captureWords, true);
  assert.equal(result.profile.name.length, 60);
  assert.equal(result.profile.bio.length, 240);
  assert.equal(result.profile.dailyGoal, 10);
  assert.equal(result.profile.nativeLanguage, 'uk');
});

test('unavailable storage does not prevent startup', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Storage blocked'); } });
  assert.deepEqual(readPreferences(), defaultPreferences);
  delete globalThis.localStorage;
});

test('system theme resolves both ways and explicit appearance overrides it', () => {
  globalThis.document = { documentElement: { dataset: {}, style: {} } };
  let dark = true;
  globalThis.matchMedia = () => ({ matches: dark });
  applyTheme('system');
  assert.equal(document.documentElement.dataset.theme, 'dark');
  assert.equal(document.documentElement.style.colorScheme, 'dark');
  dark = false;
  applyTheme('system');
  assert.equal(document.documentElement.dataset.theme, 'light');
  applyTheme('dark');
  assert.equal(document.documentElement.dataset.theme, 'dark');
  delete globalThis.document;
  delete globalThis.matchMedia;
});
