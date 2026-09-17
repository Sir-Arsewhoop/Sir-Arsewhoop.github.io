# Personal homepage — design

- **Date:** 2026-09-17
- **Status:** approved, ready for implementation planning
- **Repo:** `D:\Documents\Claude\Projects\homepage`

## Goal

A personal landing page and writing archive, hosted on GitHub Pages behind a custom
domain. Adding an entry is one markdown file dropped into a directory; nothing else
is touched. The deliverable is a framework and a style guide, not a finished site —
it must be extendable later without a rewrite.

## Constraints

1. **Neglect is the expected operating condition.** The site may go untouched for
   years. It must not visibly decay, and nothing in the build chain may expire
   unattended.
2. **The owner is error-prone on web work.** Prefer mechanisms that fail loudly at
   preview time over ones that fail silently in production.
3. **Aesthetic:** the restraint of `a6mzero.com` — hairline rules, eyebrow labels,
   mono metadata, no motion. Explicitly *not* the vector animations of `jelly-ui.com`,
   whose component look-and-feel is wanted without its site design.
4. **Palette:** gruvbox (morhetz), which the owner nominated via Zed's theme of the
   same name.
5. **Publishing must require no local toolchain.** Adding a post must be possible
   entirely from github.com's web editor, on any device, with no checkout, no Ruby
   and no build step run by the owner. Local tooling may exist as a convenience but
   must never sit on the publish path.

## Decisions

### D1 — GitHub Pages' built-in Jekyll, no Actions workflow

Chosen over Eleventy and Astro. Both alternatives need a GitHub Actions workflow,
and Actions are the component most likely to break while unattended: actions get
deprecated, Node versions get sunset, lockfiles reference yanked packages. The
built-in Jekyll path has no workflow file, no `node_modules` and no lockfile —
GitHub owns the build, so an unattended site keeps building.

Rejected "no generator, hand-written HTML": maximally durable but loses the
drop-a-markdown-file requirement, which is the point of the project.

A Jekyll theme is only `_layouts` + `_includes` + CSS. With `theme:` omitted from
`_config.yml` and our own layouts supplied, nothing is inherited and the rendered
HTML is entirely ours. The generator choice constrains plumbing, not appearance.

**This decision also satisfies constraint 5.** The build runs on GitHub's servers on
push to the source branch, so committing from the web editor publishes the site with
no local toolchain involved. GitHub's own guidance: "If you do not need any control
over the build process for your site, we recommend that you publish your site when
changes are pushed to a specific branch." Branch-based publishing is current, not
deprecated, and Actions are documented as the escape hatch for builds other than
Jekyll.

An Actions-based build would also publish on push, so it does not fail constraint 5
outright — it fails constraint 1. When a workflow breaks, Pages keeps serving the
last successful build: the site looks correct, the new post silently never appears,
and the only evidence is in a tab the owner has no reason to open. Known rot
mechanisms, all observed in practice: runner Node runtimes sunset beneath pinned
action majors; runner images retired (`ubuntu-20.04`) or silently moved
(`ubuntu-latest`); workflow commands deprecated then disabled (`set-output`,
`save-state`); `GITHUB_TOKEN` default permissions narrowed, requiring explicit
`pages: write` and `id-token: write`; registry packages yanked. Expect one
intervention every two to three years. With branch-based publishing there is no
workflow to rot.

### D2 — Plugins limited to GitHub's allowlist

`jekyll-feed`, `jekyll-seo-tag`, `jekyll-sitemap`. All three are on the GitHub Pages
allowlist and maintained by Jekyll core, so RSS, meta tags and `sitemap.xml` are
GitHub's maintenance burden rather than ours. No other plugins — anything off the
allowlist would force us onto Actions and forfeit D1.

### D3 — Jelly UI loaded from its CDN, with defined-state fallbacks

The owner chose the CDN `<script type="module">` over vendoring or a CSS-only
imitation. The risk accepted is that `jelly-ui.com` may lapse or ship a breaking
major while the site is unattended.

That risk is mitigated, not re-litigated: every Jelly element used gets a
`:not(:defined)` fallback rule in our stylesheet. `:defined` is the standard CSS
mechanism for un-upgraded custom elements — if `package.js` never loads, the
elements stay permanently undefined, our flat gruvbox styling applies, and the page
reads as intentional rather than broken. The fallback costs a handful of CSS rules
and no JavaScript.

The reading experience — masthead, index, article text, navigation — is plain HTML
and CSS with no Jelly element in the critical path. Jelly is enhancement only.

### D4 — Accent driven by a CSS custom property, not the `accent` attribute

Verified by reading the shipped bundle at `https://jelly-ui.com/dist/jelly.js`:
every component resolves `--jelly-accent`, which itself defaults to
`var(--jelly-color-background-accent)`. Setting `--jelly-color-background-accent` in
our own `prefers-color-scheme` media query therefore retints all Jelly components
per mode. The `accent` attribute takes a single value and cannot express a
light/dark pair, so it is not used.

To be confirmed empirically during implementation with a smoke page that renders a
Jelly element in both schemes.

### D5 — Gruvbox, with one deliberate deviation for contrast

Values taken from `morhetz/gruvbox`, `colors/gruvbox.vim`:

```
dark0_hard #1d2021   dark0 #282828   dark1 #3c3836   dark2 #504945
light0 #fbf1c7   light1 #ebdbb2   light2 #d5c4a1   light4 #a89984
gray #928374
bright_yellow #fabd2f   bright_orange #fe8019
faded_yellow  #b57614   faded_orange  #af3a03
```

Measured contrast against the body background:

| Pairing | Ratio | Verdict |
| --- | --- | --- |
| `#ebdbb2` on `#282828` | 10.8:1 | AAA |
| `#fabd2f` on `#282828` | 8.7:1 | AAA |
| `#3c3836` on `#fbf1c7` | 10.2:1 | AAA |
| `#b57614` on `#fbf1c7` | 3.3:1 | **fails AA** |
| `#af3a03` on `#fbf1c7` | 5.4:1 | AA |
| `#928374` on `#fbf1c7` | 3.2:1 | **fails AA** |
| `#928374` on `#282828` | 4.0:1 | **fails AA** |

Light mode therefore uses `faded_orange #af3a03` as its accent where gruvbox's own
symmetry would suggest `faded_yellow #b57614`. The substitution is within the same
warm family and preserves the palette's character while keeping link text
accessible.

### D6 — Semantic token layer

`tokens.css` maps gruvbox hexes onto semantic names once, for each scheme. No other
stylesheet names a hex. Retheming later is one file.

```css
:root {                      /* light */
  --bg:     #fbf1c7;  --bg-sunk: #f2e5bc;  --bg-lift: #ebdbb2;
  --ink:    #3c3836;  --ink-muted: #665c54;
  --rule:   #d5c4a1;  --accent:  #af3a03;  --on-accent: #fbf1c7;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg:   #282828;  --bg-sunk: #1d2021;  --bg-lift: #3c3836;
    --ink:  #ebdbb2;  --ink-muted: #a89984;
    --rule: #504945;  --accent:  #fabd2f;  --on-accent: #282828;
  }
}
```

Eight tokens, no more. `--ink-faint` (`#928374`, gruvbox `gray`) and `--accent-quiet`
were both in an earlier draft of this section and are cut: measured at 3.2:1/4.0:1 and
3.3:1 respectively, neither can legally carry text, and a token that looks like a text
colour but is not one is exactly the trap this project cannot afford. A third ink level
or a second accent can be added later — the contrast test will refuse a failing value.

`--on-accent` is the text colour for content sitting on `--accent` (Jelly buttons,
chips). It happens to equal `--bg` in both schemes; it is defined separately so the
relationship is asserted rather than assumed.

Jelly's own tokens are mapped onto these same semantic names in the same two blocks,
per D4.

### D7 — Typography

| Role | Face | Fallback |
| --- | --- | --- |
| Display / headings | Newsreader | Georgia, serif |
| Body | system sans stack | — (no webfont) |
| Meta, tags, code | JetBrains Mono | ui-monospace, Menlo, monospace |

Two webfonts maximum, both from Google Fonts, both with fallbacks that hold the
layout if the font host is unreachable. Body text uses no webfont, so the primary
reading experience never waits on a third party.

## Repo layout

```
homepage/
├── _config.yml
├── CNAME
├── Gemfile
├── index.html
├── styleguide.md
├── about.md
├── _posts/
│   └── 2026-09-17-hello.md
├── _layouts/
│   ├── default.html
│   ├── post.html
│   └── page.html
├── _includes/
│   ├── head.html
│   ├── masthead.html
│   ├── post-meta.html
│   └── index-list.html
├── assets/
│   ├── css/
│   │   ├── tokens.css
│   │   └── site.css
│   └── favicon.svg
├── docs/superpowers/specs/
└── README.md
```

## Content model

The frontmatter contract. Adding an entry touches exactly one file:

```yaml
---
title: "A thing I made"
date: 2026-09-17
tags: [hardware, esp32]
summary: "One line, shown on the index."
---
```

Titles and summaries are quoted in the template by default. Neither needs quoting in
YAML most of the time, but the one case that breaks a build — a colon in the text —
is common in post titles, and an unquoted title is the likeliest cause of a post
silently failing to publish. Quoting unconditionally costs nothing and removes the
class of error.

- `title` and `date` required. `date` is also encoded in the filename
  (`_posts/YYYY-MM-DD-slug.md`) per Jekyll's convention.
- `tags` and `summary` optional; the index degrades cleanly when absent.
- `draft: true` excludes the entry from the index while still building it, so
  unfinished work can be pushed without appearing.

Standalone pages are a `.md` at repo root with `layout: page`. They do not appear on
the index and are linked from the masthead only.

## Front page

Masthead (wordmark, tagline, nav), then a year-grouped reverse-chronological index:
title, absolute date, tags, optional one-line summary. Each entry links to its own
page. Terse — no excerpt bodies, no thumbnails, no pagination until there is enough
content to need it.

## Style guide page

`/styleguide/` is a real page in the repo, not a throwaway. It is the primary
deliverable of this phase — the brief was "more style guide than full site".

It renders, from the live stylesheet rather than from screenshots:

- every semantic token as a labelled swatch, with its gruvbox source name and hex
- the type scale, each role shown at its actual size with its fallback named
- every element the site uses: headings, body copy, links, lists, blockquote,
  inline code, code block, horizontal rule, table
- every Jelly component in use, shown twice — upgraded, and with the fallback
  styling forced — so the degraded state is inspectable without taking the CDN down

Because it renders from the live stylesheet, it cannot drift from the site. When a
token changes, the style guide changes with it. This is what makes the framework
extendable later: future-you reads one page instead of reverse-engineering CSS.

## Neglect-proofing

Requirements, not decoration — these exist because the site is expected to sit idle:

- **No hero post.** A three-year-old entry never becomes the whole front page.
- **Absolute dates only** (`2026 · 09`). No relative time strings; "3 years ago" is
  what actually makes a site read as abandoned.
- **Year-grouped index.** Gaps between years read as a log, not as a dead blog.
- **No time-sensitive copy** in any template: no "currently", "recently" or "now".
- **Nothing renders the build date**, so the site never advertises how long it has
  been since the last commit.

## Publishing and preview

**Publishing — the supported path, no local toolchain.** Create the file in
github.com's web editor under `_posts/`, paste the template from the README, commit
to the source branch. GitHub builds and redeploys. Works from any device with a
browser. This is the primary path, not a fallback.

**Preview — optional, local only.** The machine has Ruby (installed 2026-09-17),
Git, Node 20, Docker and `gh`. A `Gemfile` pinning the `github-pages` gem makes local
output match GitHub's build, so `bundle exec jekyll serve` gives a preview loop when
working from this machine. Nothing about publishing depends on it. Docker is a
fallback if the native Windows toolchain gives trouble.

### Frontmatter as the real failure mode

With the toolchain off the publish path, the remaining way a post silently fails to
appear is malformed YAML frontmatter typed without a preview — an unquoted title
containing a colon being the classic. GitHub emails a "page build failed" notice,
which is thin protection for a site checked twice a year.

Mitigations, all cheap:

- Only two required fields, `title` and `date`.
- The README's copy-paste template quotes the title by default, so
  `title: "Thing: with a colon"` is the shape the owner's muscle memory learns.
- The README lives in the repo root, one tap from the web editor on the same device.
- `_posts/2026-09-17-hello.md` ships as a working reference to copy.

## Verification

No CI. A GitHub Action is precisely the thing that rots unattended, which would
undercut D1.

There is, however, a local test harness — `node --test test/`, using Node's built-in
runner with zero npm dependencies, so there is no lockfile and nothing to rot. It is
a development tool only and never touches the publish path. It exists because
constraint 2 says the owner is error-prone on web work, and the most valuable thing
it does is make D5 structural: `test/tokens.test.mjs` parses `tokens.css`, computes
WCAG relative luminance, and fails if any ink or accent token drops below its
threshold against its own scheme's background. An inaccessible palette becomes a
failing test rather than a thing to remember.

`test/tokens.test.mjs` reads CSS only and runs anywhere. `test/site.test.mjs` builds
the site first and therefore needs Ruby — which is fine, because like the preview it
is a convenience, not a gate.

On top of the harness, a checklist in `README.md` for future-you:

1. Add the post, run `bundle exec jekyll serve`.
2. Check both colour schemes (OS toggle, or devtools emulation).
3. Check at 380px width.
4. Confirm the entry appears on the index under the right year.
5. Push.

## Out of scope

Comments, analytics, search, pagination, tag archive pages, webmentions, a projects
grid, manual dark/light toggle. Each is additive later; none is needed for a
framework.

## Open items

- Wordmark, tagline and domain are placeholders in `_config.yml` and `CNAME` pending
  the owner's values. All three are single lines in one file.
- D4 to be confirmed with a smoke page during implementation.
