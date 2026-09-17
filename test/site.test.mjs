import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Jekyll runs in a container. Ruby's native-gem toolchain does not build on
// this Windows machine (racc fails: RubyInstaller's MSYS2 component is absent
// and a standalone msys64 mangles the paths Ruby's Makefile expects), so the
// build happens in ruby:3.3 instead. Gems are cached in a named volume, so
// only the first run pays for `bundle install`.
//
// Set JEKYLL_BUILD to override — e.g. `JEKYLL_BUILD="bundle exec jekyll build
// --quiet"` on a machine with a working native Ruby.
//
// Nothing here is on the publish path. GitHub builds the real site server-side.
const IN_CONTAINER = [
  'run', '--rm',
  '-v', `${process.cwd()}:/srv`,
  '-w', '/srv',
  '-v', 'homepage-bundle:/usr/local/bundle',
  'ruby:3.3',
  'sh', '-c', 'bundle install --quiet && bundle exec jekyll build --quiet',
];

if (process.env.JEKYLL_BUILD) {
  execFileSync(process.env.JEKYLL_BUILD, { stdio: 'inherit', shell: true });
} else {
  // One build for the whole file. `node --test` runs each test FILE in its own
  // process, so keeping every built-site assertion here means Jekyll runs once
  // rather than once per test.
  execFileSync('docker', IN_CONTAINER, { stdio: 'inherit' });
}

/** Read a file from the built site. Path is relative to `_site/`. */
export function read(path) {
  return readFileSync(`_site/${path}`, 'utf8');
}

const SITE = read('index.html');

test('the site builds and the front page carries the wordmark', () => {
  assert.match(SITE, /Placeholder Wordmark/);
});

test('the document declares its language', () => {
  assert.match(SITE, /<html lang="en">/);
});

test('the page links both stylesheets tokens-first, and a favicon', () => {
  const tokensAt = SITE.indexOf('tokens.css');
  const siteAt = SITE.indexOf('site.css');
  assert.ok(tokensAt > -1, 'tokens.css is not linked');
  assert.ok(siteAt > -1, 'site.css is not linked');
  assert.ok(tokensAt < siteAt, 'tokens.css must be linked before site.css');
  assert.match(SITE, /rel="icon"[^>]*favicon\.svg/);
});

test('webfonts declare a fallback that holds the layout', () => {
  const css = readFileSync('assets/css/site.css', 'utf8');
  assert.match(css, /--font-display:[^;]*\bGeorgia\b/);
  assert.match(css, /--font-mono:[^;]*\bui-monospace\b/);
});
