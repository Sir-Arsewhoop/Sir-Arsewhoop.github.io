import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

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

const POST = read('2026/hello/index.html');

test('a post renders its title, absolute date and tags', () => {
  assert.match(POST, /Hello, world: a first post/);
  assert.match(POST, /17 September 2026/);
  assert.match(POST, /meta/);
  assert.match(POST, /example/);
});

test('a post shows a reading time', () => {
  assert.match(POST, /\d+ min/);
});

test('no page uses a relative time string', () => {
  for (const html of [SITE, POST]) {
    assert.doesNotMatch(
      html,
      /\b\d+\s+(seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s+ago\b/i,
    );
  }
});

test('the masthead carries the wordmark and tagline and links home', () => {
  assert.match(POST, /A placeholder tagline/);
  assert.match(POST, /<a href="\/">Placeholder Wordmark<\/a>/);
});

test('the index groups entries under year headings, newest first', () => {
  const years = [...SITE.matchAll(/class="index-year[^"]*"[^>]*>(\d{4})</g)].map((m) => m[1]);
  assert.deepEqual(years, ['2026', '2024']);
});

test('the index lists published posts', () => {
  assert.match(SITE, /Hello, world: a first post/);
  assert.match(SITE, /An older entry/);
});

test('a post marked draft is excluded from the index but still builds', () => {
  assert.doesNotMatch(SITE, /A draft nobody should see/);
  // It still has a page, so a direct link works for previewing.
  assert.match(read('2026/a-draft/index.html'), /A draft nobody should see/);
});

test('the index uses absolute dates', () => {
  assert.match(SITE, /2026 · 09/);
});

test('Jelly loads as a module from its CDN', () => {
  assert.match(
    SITE,
    /<script type="module" src="https:\/\/jelly-ui\.com\/package\.js"><\/script>/,
  );
});

test('every Jelly element used has a :not(:defined) fallback', () => {
  const css = readFileSync('assets/css/site.css', 'utf8');
  const used = new Set(
    [...SITE.matchAll(/<(jelly-[a-z-]+)/g)].map((m) => m[1]),
  );
  assert.ok(used.size > 0, 'no Jelly elements are used, so this test proves nothing');
  for (const element of used) {
    assert.match(
      css,
      new RegExp(`${element}:not\\(:defined\\)`),
      `${element} has no :not(:defined) fallback — a dead CDN would break it`,
    );
  }
});

test('the reading experience does not depend on a Jelly element', () => {
  // Strip every Jelly element and its content, then check the page still has
  // its masthead, its headings and its links.
  const withoutJelly = SITE.replace(/<jelly-[a-z-]+[\s\S]*?<\/jelly-[a-z-]+>/g, '');
  assert.match(withoutJelly, /Placeholder Wordmark/);
  assert.match(withoutJelly, /Hello, world: a first post/);
  assert.match(withoutJelly, /class="index-year/);
});

test('no template renders the build clock', () => {
  // `site.time` is Jekyll's build timestamp. Rendering it anywhere tells a
  // visitor how long the site has sat untouched — the one thing the spec's
  // neglect-proofing section forbids outright. Checked against the Liquid
  // source, not the output: by the time it reaches HTML it is just a date and
  // is indistinguishable from a legitimate one.
  for (const dir of ['_layouts', '_includes']) {
    for (const file of readdirSync(dir)) {
      const source = readFileSync(`${dir}/${file}`, 'utf8')
        // Liquid comments never reach the output, so a template documenting
        // this very rule must not trip it.
        .replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, '');
      assert.doesNotMatch(
        source,
        /site\.time/,
        `${dir}/${file} renders the build clock`,
      );
    }
  }
});
