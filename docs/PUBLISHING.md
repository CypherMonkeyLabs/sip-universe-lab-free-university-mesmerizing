# Publishing this lab

The site is the repository root. `node scripts/gzip-static.mjs` serves it with gzip.

Mermaid was not executed in this build. The ladders and architecture drawings are hand-built SVG files. three.js, anime.js, rough.js, D3, markmap-view, and canvas-confetti are vendored and used in the browser.

## Installed: progressive web app

`manifest.webmanifest` and `sw.js` are in the root. `university.js` registers the worker on http or https.

## Prepared, not built: Chrome extension

Not done. A Manifest V3 extension would still need its own manifest, icons at 16, 32, 48, and 128, and a privacy note that this lab stores preferences locally. Load an unpacked folder only after Menu, a room, and the guide work.

## Prepared, not built: iOS and Android (Capacitor)

Not done. There is no `ios/` or `android/` directory. A later wrapper would set `webDir` to this root and app id `com.cyphermonkeylabs.sipuniverse` (a suggestion, not a registered bundle).

## Built: embed widget

`embed/widget.js` links to the lab, the website, the GitHub organization, and Linktree. `embed/demo.html` loads it.

```html
<script src="embed/widget.js" data-base="./"></script>
```
