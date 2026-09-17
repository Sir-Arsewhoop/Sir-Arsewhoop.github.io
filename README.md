# Homepage

A Jekyll site on GitHub Pages. GitHub builds it server-side on every push to `main`
— there is no GitHub Actions workflow and no local toolchain required. **You do not
need anything installed to publish.**

## Adding a post

From github.com's web editor, on any device with a browser:

1. Go to the `_posts/` directory → **Add file** → **Create new file**.
2. Name it `_posts/YYYY-MM-DD-slug.md`. The date in the filename is what orders it.
3. Paste this, then write below the second `---`:

   ```yaml
   ---
   title: "A thing I made"
   date: 2026-09-17
   tags: [hardware, esp32]
   summary: "One line, shown on the index."
   ---
   ```

4. **Commit changes** to `main`. GitHub rebuilds; the post appears in a minute or so.

`tags` and `summary` are optional. `title` and `date` are not.

**Keep the quotes around `title` and `summary`.** An unquoted title containing a
colon — `title: Hello: a post` — is invalid YAML, fails the build, and the post
silently never appears. The quotes make that impossible. `_posts/2026-09-17-hello.md`
is a working example to copy.

Add `draft: true` to keep a post off the front page while still building its own
page, so you can push something half-finished and look at it.

### If a post does not appear

GitHub emails a "page build failed" notice to the account address. The build log is
also at **Actions → pages build and deployment** in this repo. It is almost always
the frontmatter — most often an unquoted title.

## Pointing a domain at it

There is no `CNAME` file in this repo, deliberately. A `CNAME` containing a domain
you do not control sets that as the Pages custom domain, and `sir-arsewhoop.github.io`
then 301-redirects to it — the site goes dark until someone notices. `CNAME.example`
is an inert template.

When you have the domain:

1. **Settings → Pages → Custom domain**, enter it, Save. GitHub writes the real
   `CNAME` file into the repo for you — you do not create it by hand.
2. Point DNS at GitHub: four `A` records at the apex, or a `CNAME` record to
   `sir-arsewhoop.github.io` for a `www` subdomain. GitHub's custom-domain docs
   carry the current apex IPs — look them up rather than copying them from anywhere,
   including here.
3. Tick **Enforce HTTPS** once the certificate is issued (can take a few minutes).
4. Change `url:` in `_config.yml` to match. Until you do, every page emits
   `<link rel="canonical" href="https://example.com/">`, which is wrong and is the
   one placeholder that matters to search engines.

## Standalone pages

A `.md` at the repo root with `layout: page` and a `permalink`. See `about.md`.
Pages do not appear on the index; link them from `_includes/masthead.html`.

## Changing how it looks

- `assets/css/tokens.css` — the eight colour tokens, light and dark. **The only file
  in the repo allowed to contain a colour literal.**
- `assets/css/site.css` — everything else. Always `var(--token)`, never a hex.
- `/styleguide/` — every token and element rendered live. Read this first.

## Working locally (optional)

Not needed to publish. Useful for changing the design.

Jekyll runs in a container, because Ruby's native-gem toolchain does not build on
this machine — `racc` fails, since RubyInstaller's MSYS2 component is absent and the
standalone `C:\msys64` mangles the paths Ruby's generated Makefile expects.
**Docker Desktop must be running**, not merely installed: the CLI answers
`docker --version` on its own even when the daemon is down, and the symptom is a
bare exit code 127.

```bash
npm run serve
```

Serves at http://localhost:4000 and rebuilds as you edit.

```bash
npm test
```

No npm dependencies, nothing to install. `tokens.test.mjs` reads CSS only and runs
anywhere. `site.test.mjs` builds the site first, so it needs Docker. The first run
pulls `ruby:3.3`; later runs reuse the `homepage-bundle` volume.

If you ever get a working native Ruby, set `JEKYLL_BUILD="bundle exec jekyll build
--quiet"` and the harness uses it instead of the container.

## Before pushing a design change

1. `npm test`
2. Look at both colour schemes — toggle your OS theme.
3. Look at it at 380px wide.
4. Check the new post appears on the front page under the right year.

## Rules worth keeping

- **No GitHub Actions workflow.** Branch-based publishing has nothing to rot. A
  workflow breaks silently every couple of years and your posts stop appearing while
  the site still looks fine.
- **Plugins only from GitHub's allowlist** — currently `jekyll-feed`,
  `jekyll-seo-tag`, `jekyll-sitemap`. Anything else builds locally and silently does
  nothing on Pages.
- **No relative dates, nowhere.** No "3 years ago", no "last updated", and nothing
  that renders the build date. The site should read the same whenever it is visited.
- **Jelly UI is enhancement only.** It loads from someone else's CDN. Every
  `<jelly-*>` element needs a `:not(:defined)` fallback in `site.css`, and every
  Jelly theme token it touches needs bridging in `tokens.css` — a default
  `<jelly-chip>` paints from `--jelly-color-background-neutral`, so an unbridged
  token renders off-palette while every test still passes. Both lists are asserted.

The reasoning behind all of this is in `docs/superpowers/specs/`.
