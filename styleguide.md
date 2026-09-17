---
layout: page
title: "Style guide"
permalink: /styleguide/
---

Everything on this page renders from the live stylesheet. If a token changes, this
page changes with it — it cannot drift from the site the way a screenshot would.

## Colour

Eight tokens, defined once in `assets/css/tokens.css` and redefined under
`prefers-color-scheme: dark`. No other file in the repo contains a colour literal.
Toggle your OS between light and dark to see both.

Every value below is asserted by `test/tokens.test.mjs`: ink tokens clear 4.5:1
against `--bg`, `--ink` clears 7:1, `--accent` clears 4.5:1, and `--on-accent`
clears 4.5:1 against `--accent`. A palette change that breaks legibility fails the
test rather than shipping.

<ul class="swatches">
  <li class="swatch"><span class="swatch__chip" style="background: var(--bg)"></span><code>--bg</code><span class="swatch__note">page background</span></li>
  <li class="swatch"><span class="swatch__chip" style="background: var(--bg-sunk)"></span><code>--bg-sunk</code><span class="swatch__note">recessed: code, pre</span></li>
  <li class="swatch"><span class="swatch__chip" style="background: var(--bg-lift)"></span><code>--bg-lift</code><span class="swatch__note">raised: chips</span></li>
  <li class="swatch"><span class="swatch__chip" style="background: var(--ink)"></span><code>--ink</code><span class="swatch__note">body text</span></li>
  <li class="swatch"><span class="swatch__chip" style="background: var(--ink-muted)"></span><code>--ink-muted</code><span class="swatch__note">metadata, summaries</span></li>
  <li class="swatch"><span class="swatch__chip" style="background: var(--rule)"></span><code>--rule</code><span class="swatch__note">hairlines, borders</span></li>
  <li class="swatch"><span class="swatch__chip" style="background: var(--accent)"></span><code>--accent</code><span class="swatch__note">links, focus rings</span></li>
  <li class="swatch"><span class="swatch__chip" style="background: var(--on-accent)"></span><code>--on-accent</code><span class="swatch__note">text on --accent</span></li>
</ul>

## Type

Three roles. Body text uses no webfont, so reading never waits on a third party.

<p class="eyebrow">Eyebrow — JetBrains Mono, uppercase, tracked</p>

# Display — Newsreader

## Second level

### Third level

Body copy is the system sans stack. It should feel unremarkable, which is the point:
the display face and the mono metadata do the work, and the reading column stays out
of the way. The measure is capped at 34rem so a line never runs long enough to lose
your place on the return sweep.

<p class="meta"><span>2026 · 09</span><span>metadata row</span><span>3 min</span></p>

## Elements

A [link in running text](#), some `inline code`, and **bold** and _italic_.

> A blockquote, for the times a quotation earns its own space.

```js
// A fenced code block.
const tokens = readFileSync('assets/css/tokens.css', 'utf8');
```

| Column | Column |
| --- | --- |
| Table cell | Table cell |
| Table cell | Table cell |

---

## Favicon

<p class="favicon-row">
  <img src="{{ '/assets/favicon.svg' | relative_url }}" width="16" height="16" alt="favicon at 16px">
  <img src="{{ '/assets/favicon.svg' | relative_url }}" width="32" height="32" alt="favicon at 32px">
  <img src="{{ '/assets/favicon.svg' | relative_url }}" width="64" height="64" alt="favicon at 64px">
  <span class="swatch__note">16 · 32 · 64</span>
</p>

A keyhole, or a chess pawn. The ambiguity is deliberate — escape rooms read the
first, games read the second, and neither needs explaining.

`assets/favicon.svg` is the only file besides `tokens.css` that contains colour
literals, because an external SVG referenced from `<link rel="icon">` cannot see the
page's custom properties. `test/tokens.test.mjs` asserts the duplicated values match
the palette in both schemes, so the icon cannot drift.

**The glyph fills 78% of the tile height, and that number is load-bearing.** An
earlier version used 56%. At 16px — the only size most people ever see — that left a
head barely 3px across, and the shape collapsed into an unreadable blob. Clearance
that looks composed at 64px is wasted resolution at favicon size. A test fails if the
scale drops below 1.1.

Some clearance still earns its place: past roughly 90% the glyph looks cramped inside
the rounded corners at the large sizes used for bookmarks and PWA icons. 78% is the
compromise.

## Jelly components

Loaded from `jelly-ui.com` and enhancement only. Each is shown twice: as it upgrades,
and with the upgrade suppressed so you can inspect the fallback without taking the CDN
down.

Note that a default `<jelly-chip>` paints its body on a `<canvas>` from
`--jelly-color-background-neutral`. Any Jelly token left unbridged in `tokens.css`
silently keeps Jelly's own blue-grey default, so the bridge list is asserted by test.

**Upgraded**

<p class="meta"><jelly-chip>hardware</jelly-chip><jelly-chip>esp32</jelly-chip></p>

**Fallback, as it renders if `package.js` never loads**

<p class="meta force-undefined"><span class="as-chip">hardware</span><span class="as-chip">esp32</span></p>
