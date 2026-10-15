export function iconHTML(id) {
  const safe = String(id || "foundations").replace(/[^a-z0-9-]/gi, "") || "foundations";
  return `<span class="iso glyph-hold"><canvas class="glyph-view" data-glyph="${safe}" width="256" height="256" aria-hidden="true"></canvas></span>`;
}
