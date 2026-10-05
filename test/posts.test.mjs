import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// Rules about post SOURCE files. No build, so this runs anywhere, with or
// without Docker — which matters, because every failure these catch is silent:
// Jekyll does not validate frontmatter keys, and kramdown does not complain
// about footnote syntax it fails to recognise. The post just comes out wrong.

const FILES = readdirSync('_posts').filter((f) => f.endsWith('.md'));

/** Split a post into its frontmatter block and its body. */
function parse(file) {
  const src = readFileSync(`_posts/${file}`, 'utf8').replace(/\r\n/g, '\n');
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  assert.ok(m, `${file}: no frontmatter block`);
  return { fm: m[1], body: m[2] };
}

/** Frontmatter keys this site understands. Anything else is a typo. */
const KNOWN_KEYS = new Set([
  'title', 'date', 'tags', 'summary', 'draft', 'layout', 'permalink', 'published',
]);

/** Levenshtein, for "did you mean" on a misspelt key. */
function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return d[a.length][b.length];
}

test('every post has at least one post to check', () => {
  assert.ok(FILES.length > 0, 'no posts found in _posts/');
});

test('no post carries an unrecognised frontmatter key', () => {
  // `daft: true` published a post that was meant to be a draft. Jekyll treats
  // an unknown key as an ordinary page variable and says nothing.
  for (const file of FILES) {
    const { fm } = parse(file);
    for (const line of fm.split('\n')) {
      const key = line.match(/^([A-Za-z_][\w-]*)\s*:/)?.[1];
      if (!key || KNOWN_KEYS.has(key)) continue;
      const near = [...KNOWN_KEYS]
        .map((k) => [k, distance(key.toLowerCase(), k)])
        .sort((a, b) => a[1] - b[1])
        .filter(([, d]) => d <= 2)
        .map(([k]) => k);
      const hint = near.length ? ` — did you mean "${near[0]}"?` : '';
      assert.fail(`${file}: unknown frontmatter key "${key}"${hint}`);
    }
  }
});

test('every post declares a title and a date', () => {
  for (const file of FILES) {
    const { fm } = parse(file);
    assert.match(fm, /^title:\s*\S/m, `${file}: missing title`);
    assert.match(fm, /^date:\s*\d{4}-\d{2}-\d{2}/m, `${file}: missing or malformed date`);
  }
});

test('title and summary are quoted', () => {
  for (const file of FILES) {
    const { fm } = parse(file);
    for (const key of ['title', 'summary']) {
      const value = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1];
      if (value === undefined) continue;
      assert.match(
        value.trim(),
        /^".*"$/,
        `${file}: ${key} must be quoted — an unquoted colon in the text breaks the build`,
      );
    }
  }
});

test('tags are a quoted flow list', () => {
  // Unquoted, YAML 1.1 turns no/on/off/yes into booleans and drops null; the
  // bare-string form splits on whitespace so a two-word tag becomes two.
  for (const file of FILES) {
    const { fm } = parse(file);
    const line = fm.match(/^tags:\s*(.+)$/m)?.[1];
    if (!line) continue;
    assert.match(
      line.trim(),
      /^\[\s*(?:"[^"]*"\s*,\s*)*"[^"]*"\s*\]$/,
      `${file}: tags must look like ["one", "two"] — got ${line.trim()}`,
    );
  }
});

test('draft is an unquoted boolean', () => {
  // The index filters on `p.draft != true`, which is a boolean comparison.
  // Measured: `draft: "true"` and `draft: 1` both publish the post anyway,
  // because a string and an integer are not the boolean true.
  for (const file of FILES) {
    const { fm } = parse(file);
    const value = fm.match(/^draft:\s*(.+)$/m)?.[1];
    if (value === undefined) continue;
    assert.match(
      value.trim(),
      /^(true|false)$/,
      `${file}: draft must be bare true or false — got ${value.trim()}`,
    );
  }
});

test('footnote definitions carry their colon', () => {
  // `[^1]: text` defines a footnote. `[^1] text` defines nothing, and kramdown
  // then renders the markers AND the definition lines as literal text in the
  // middle of the post, with no error. This has happened twice.
  for (const file of FILES) {
    const { body } = parse(file);
    for (const [i, line] of body.split('\n').entries()) {
      const bad = line.match(/^\[\^([^\]]+)\]\s+\S/);
      assert.ok(
        !bad,
        `${file} line ${i + 1}: footnote definition needs a colon — write "[^${bad?.[1]}]: …"`,
      );
    }
  }
});

test('every footnote reference has a definition, and vice versa', () => {
  for (const file of FILES) {
    const { body } = parse(file);
    const defs = new Set([...body.matchAll(/^\[\^([^\]]+)\]:/gm)].map((m) => m[1]));
    const refs = new Set(
      [...body.matchAll(/\[\^([^\]]+)\]/g)]
        .map((m) => m[1])
        .filter((id) => !new RegExp(`^\\[\\^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]:`, 'm').test(body) || defs.has(id)),
    );
    for (const id of refs) {
      if (!defs.has(id)) assert.fail(`${file}: [^${id}] is referenced but never defined`);
    }
    for (const id of defs) {
      const used = new RegExp(`\\[\\^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\](?!:)`).test(body);
      if (!used) assert.fail(`${file}: [^${id}] is defined but never referenced`);
    }
  }
});
