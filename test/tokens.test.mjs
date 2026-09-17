import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('assets/css/tokens.css', 'utf8');

// --- WCAG 2.1 relative luminance -------------------------------------------

function channel(byte) {
  const c = byte / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const [r, g, b] = hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// --- extract each scheme's literal tokens ----------------------------------

// Only `--name: #hex;` declarations are collected. Mappings written as
// `var(--token)` — the Jelly bridge — are deliberately skipped: they inherit
// their value and so inherit their contrast guarantee too.
function tokensIn(block) {
  return Object.fromEntries(
    [...block.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)]
      .map((m) => [m[1], m[2].toLowerCase()]),
  );
}

const mediaAt = css.indexOf('@media');
assert.ok(mediaAt > 0, 'tokens.css must contain a prefers-color-scheme block');

const SCHEMES = [
  ['light', tokensIn(css.slice(0, mediaAt))],
  ['dark', tokensIn(css.slice(mediaAt))],
];

const REQUIRED = [
  '--bg', '--bg-sunk', '--bg-lift',
  '--ink', '--ink-muted',
  '--rule', '--accent', '--on-accent',
];

// --- the guarantees --------------------------------------------------------

for (const [scheme, tokens] of SCHEMES) {
  test(`${scheme}: defines exactly the eight agreed tokens`, () => {
    assert.deepEqual(Object.keys(tokens).sort(), [...REQUIRED].sort());
  });

  test(`${scheme}: every ink token clears AA against --bg`, () => {
    for (const [name, value] of Object.entries(tokens)) {
      if (!name.startsWith('--ink')) continue;
      const ratio = contrast(value, tokens['--bg']);
      assert.ok(
        ratio >= 4.5,
        `${name} (${value}) on --bg (${tokens['--bg']}) is ${ratio.toFixed(2)}:1, needs 4.5:1`,
      );
    }
  });

  test(`${scheme}: --ink clears AAA against --bg`, () => {
    const ratio = contrast(tokens['--ink'], tokens['--bg']);
    assert.ok(ratio >= 7, `--ink is ${ratio.toFixed(2)}:1, needs 7:1`);
  });

  test(`${scheme}: --accent clears AA against --bg`, () => {
    const ratio = contrast(tokens['--accent'], tokens['--bg']);
    assert.ok(ratio >= 4.5, `--accent is ${ratio.toFixed(2)}:1, needs 4.5:1`);
  });

  test(`${scheme}: --on-accent clears AA against --accent`, () => {
    const ratio = contrast(tokens['--on-accent'], tokens['--accent']);
    assert.ok(ratio >= 4.5, `--on-accent is ${ratio.toFixed(2)}:1, needs 4.5:1`);
  });

  test(`${scheme}: --rule is visible against --bg`, () => {
    const ratio = contrast(tokens['--rule'], tokens['--bg']);
    assert.ok(ratio >= 1.4, `--rule is ${ratio.toFixed(2)}:1, needs 1.4:1`);
  });
}

test('both schemes define the same token names', () => {
  const [[, light], [, dark]] = SCHEMES;
  assert.deepEqual(Object.keys(light).sort(), Object.keys(dark).sort());
});

test('no file outside tokens.css contains a colour literal', () => {
  const others = ['assets/css/site.css'];
  for (const path of others) {
    const source = readFileSync(path, 'utf8')
      // Strip comments first — a comment may legitimately name a gruvbox hex
      // when explaining which token to reach for.
      .replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(
      source,
      /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/,
      `${path} contains a colour literal; use var(--token) instead`,
    );
  }
});
