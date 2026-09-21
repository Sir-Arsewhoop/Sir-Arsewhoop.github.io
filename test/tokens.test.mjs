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
  // Syntax highlighting. Code is body-sized text, so these carry the same
  // contrast obligation as any other text colour — see the --syn-* assertion
  // below. Comments are not listed: they reuse --ink-muted deliberately,
  // because gruvbox gray measures 4.0:1 and cannot carry text.
  '--syn-keyword', '--syn-string', '--syn-name', '--syn-number',
];

// --- the guarantees --------------------------------------------------------

for (const [scheme, tokens] of SCHEMES) {
  test(`${scheme}: defines exactly the agreed tokens, no more`, () => {
    assert.deepEqual(Object.keys(tokens).sort(), [...REQUIRED].sort());
  });

  test(`${scheme}: every syntax token clears AA against --bg`, () => {
    for (const [name, value] of Object.entries(tokens)) {
      if (!name.startsWith('--syn-')) continue;
      const ratio = contrast(value, tokens['--bg']);
      assert.ok(
        ratio >= 4.5,
        `${name} (${value}) on --bg (${tokens['--bg']}) is ${ratio.toFixed(2)}:1, needs 4.5:1`,
      );
    }
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

test('the Jelly bridge covers every token that affects what we render', () => {
  // A Jelly token left unbridged silently keeps Jelly's own default and renders
  // off-palette. That is not visible to any assertion about our own CSS — a
  // default <jelly-chip> paints its body on a canvas from
  // --jelly-color-background-neutral, so omitting that one produced a blue-grey
  // pill on a gruvbox page and nothing failed. This list is the guard.
  const REQUIRED_BRIDGE = [
    '--jelly-color-background-default',
    '--jelly-color-background-surface',
    '--jelly-color-background-muted',
    '--jelly-color-background-neutral',
    '--jelly-color-background-accent',
    '--jelly-color-foreground-default',
    '--jelly-color-foreground-muted',
    '--jelly-color-foreground-on-neutral',
    '--jelly-color-foreground-on-accent',
    '--jelly-color-border-default',
    '--jelly-color-border-focus',
  ];
  for (const token of REQUIRED_BRIDGE) {
    assert.match(
      css,
      new RegExp(`${token}:\\s*var\\(--[a-z-]+\\)`),
      `${token} is not bridged to one of our tokens`,
    );
  }
});

test('the favicon agrees with the palette in both schemes', () => {
  // assets/favicon.svg is the one file that must duplicate colour literals: an
  // external SVG referenced from <link rel="icon"> cannot see the page's custom
  // properties. So assert the copies match rather than trusting them to.
  const svg = readFileSync('assets/favicon.svg', 'utf8');
  const at = svg.indexOf('@media');
  assert.ok(at > 0, 'favicon.svg must carry its own prefers-color-scheme rule');

  const fill = (block, selector) =>
    block.match(new RegExp(`${selector}\\s*\\{[^}]*fill:\\s*(#[0-9a-fA-F]{6})`))?.[1]?.toLowerCase();

  const [[, light], [, dark]] = SCHEMES;
  const pairs = [
    ['light', svg.slice(0, at), light],
    ['dark', svg.slice(at), dark],
  ];
  for (const [scheme, block, tokens] of pairs) {
    assert.equal(fill(block, 'rect'), tokens['--bg'], `${scheme}: favicon ground is not --bg`);
    assert.equal(fill(block, 'path'), tokens['--accent'], `${scheme}: favicon glyph is not --accent`);
  }
});

test('the favicon glyph is large enough to read at 16px', () => {
  // The glyph is scaled about the tile centre. Below roughly 1.1 the shape
  // collapses at favicon size — the original 1.0 version had a 3px head and was
  // unidentifiable. See the comment in assets/favicon.svg.
  const svg = readFileSync('assets/favicon.svg', 'utf8');
  const scale = Number(svg.match(/scale\(([\d.]+)\)/)?.[1]);
  assert.ok(scale >= 1.1, `favicon glyph scale is ${scale}, needs at least 1.1 to read at 16px`);
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
