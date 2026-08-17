# Publishing a live demo with GitHub Pages

How the live link for this project was made, written so it can be repeated on any
other repository.

Live example: <https://nematullah9812.github.io/scientific-calculator-pro/>

---

## What GitHub Pages is

Free static hosting attached to every GitHub repo. You point it at a branch (or a
folder), GitHub serves whatever HTML/CSS/JS is in there over HTTPS at a permanent
URL. No server, no account, no cost.

The URL pattern is fixed:

| Repo | URL |
| --- | --- |
| `USER/some-project` | `https://USER.github.io/some-project/` |
| `USER/USER.github.io` | `https://USER.github.io/` (root site) |

Two hard limits worth knowing up front:

- **Static only.** HTML, CSS, JS, images. No PHP, no Node backend, no database.
  Anything needing a server has to go to Vercel / Render / Fly instead.
- **1 GB repo, 100 GB/month bandwidth, ~10 builds/hour.** Irrelevant for a portfolio.

---

## Method A — the branch method (used here)

Best when the thing you want to serve is not the same as your source tree, or
when the build output is a single file.

```bash
# 1. build your site first, if it needs building
npm run build            # produces dist/

# 2. stage exactly what should be public
rm -rf /tmp/ghp && mkdir /tmp/ghp
cp -r dist/* /tmp/ghp/
touch /tmp/ghp/.nojekyll        # see "Gotchas" below

# 3. put it on an orphan branch (no shared history with main)
git checkout --orphan gh-pages
git rm -rf --cached . >/dev/null 2>&1
git clean -fdx -e .git
cp -r /tmp/ghp/. .
git add -A
git commit -m "Deploy live demo to GitHub Pages"
git push origin gh-pages

# 4. back to your real branch
git checkout main
```

`--orphan` matters: the `gh-pages` branch gets its own history and never mixes
build artifacts into `main`.

Then turn Pages on — Settings → Pages → Source: *Deploy from a branch* →
`gh-pages` / `/ (root)`. Or via the API:

```bash
curl -X POST -H "Authorization: token $GH_TOKEN" \
  https://api.github.com/repos/USER/REPO/pages \
  -d '{"source":{"branch":"gh-pages","path":"/"}}'
```

Check build status until it says `built` (usually 30–90 s):

```bash
curl -s -H "Authorization: token $GH_TOKEN" \
  https://api.github.com/repos/USER/REPO/pages \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['status'],d['html_url'])"
```

## Method B — the `/docs` folder

Simplest option if your site is plain HTML with no build step. Drop `index.html`
into a `docs/` folder on `main`, then Settings → Pages → Source: `main` / `/docs`.
Nothing else to do; every push republishes.

## Method C — GitHub Actions

Right choice when the site must be rebuilt on every push. Settings → Pages →
Source: **GitHub Actions**, then add `.github/workflows/pages.yml`:

```yaml
name: Deploy to Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## Gotchas that actually bite

**Asset paths 404 on a project site.** Your site lives under `/REPO/`, not `/`.
A root-absolute path like `/assets/app.js` resolves to `USER.github.io/assets/app.js`
and dies. Fixes:

- Vite: set `base: '/REPO/'` in `vite.config.js`
- Create React App: `"homepage": "https://USER.github.io/REPO"` in `package.json`
- Next.js: `basePath: '/REPO'` plus `output: 'export'`
- Or sidestep it entirely by using relative paths / a single inlined file

*This project never hit that problem* — `vite-plugin-singlefile` inlines every
asset into one `index.html`, so there are no external paths to break. That is why
deployment here was a straight file copy.

**Jekyll eats folders starting with `_`.** Pages runs Jekyll by default, which
ignores `_next`, `_app`, etc. An empty `.nojekyll` file at the root disables it.
Always add it.

**Client-side routing 404s on refresh.** `/about` has no matching file. Copy
`index.html` to `404.html`, or use hash routing.

**`git checkout --orphan` refuses to run with unstaged changes.** Commit or stash
first. On this repo the snapshot layer keeps stripping exec bits off `gradlew`,
which shows as an unstaged diff — `chmod +x` clears it.

**Private repos need a paid plan** for Pages. Public is free.

**Cached HTML.** Pages sets a ~10 min CDN cache. Hard-refresh, or check with
`curl -I` rather than trusting the browser.

---

## Checklist for the next repo

1. Is it static? If not → Vercel/Render, not Pages.
2. Fix the base path for the `/REPO/` subdirectory.
3. Add `.nojekyll`.
4. Pick a method: single file → A, plain HTML → B, needs rebuilding → C.
5. Enable Pages, wait for `built`.
6. Verify with `curl -sI URL` → expect `200`.
7. Set the repo **homepage** field so the link shows in the sidebar:
   ```bash
   curl -X PATCH -H "Authorization: token $GH_TOKEN" \
     https://api.github.com/repos/USER/REPO \
     -d '{"homepage":"https://USER.github.io/REPO/"}'
   ```
8. Put the link at the top of the README.

---

## Not to be confused with

The temporary `*.e2b.app` preview URL from a sandboxed dev server is a
development convenience and disappears when the session ends. It is not hosting.
GitHub Pages is the permanent, portfolio-safe link.
