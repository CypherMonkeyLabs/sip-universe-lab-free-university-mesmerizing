export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

export function citeLinks(cites) {
  if (!cites || !cites.length) return "";
  return `<ul class="cites">${cites.map((c) => `<li><a href="${esc(c.url)}" rel="noopener noreferrer">${esc(c.label)}</a></li>`).join("")}</ul>`;
}

let figSeq = 0;

function svgFrame(title, caption, inner, w = 760, h = 280) {
  const id = `illu-${++figSeq}`;
  return `<figure class="illus">
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-title ${id}-desc">
      <title id="${id}-title">${esc(title)}</title>
      <desc id="${id}-desc">${esc(caption || title)}</desc>
      <rect width="${w}" height="${h}" class="illus-bg"></rect>
      ${inner}
    </svg>
    <figcaption>${esc(caption || title)}</figcaption>
  </figure>`;
}

export function illustration(spec) {
  if (!spec) return "";
  if (spec.type === "layers") {
    const rows = spec.layers || [];
    const inner = rows.map((layer, i) => {
      const y = 28 + i * 58;
      return `<rect x="36" y="${y}" width="688" height="46" rx="10" class="layer layer-${i % 4}"></rect>
        <text x="52" y="${y + 29}" class="layer-name">${esc(layer.name)}</text>
        <text x="230" y="${y + 29}" class="layer-detail">${esc(layer.detail)}</text>`;
    }).join("");
    return svgFrame(spec.title, spec.caption, inner, 760, Math.max(120, 40 + rows.length * 58));
  }
  if (spec.type === "states") {
    const nodes = spec.nodes || [];
    const inner = nodes.map((node, i) => {
      const x = 40 + i * 160;
      const next = nodes[i + 1];
      const arrow = next ? `<line x1="${x + 108}" y1="92" x2="${x + 150}" y2="92" class="edge"></line>` : "";
      return `${arrow}<rect x="${x}" y="62" width="110" height="60" rx="12" class="state"></rect>
        <text x="${x + 55}" y="97" text-anchor="middle" class="state-label">${esc(node)}</text>`;
    }).join("");
    return svgFrame(spec.title, spec.caption, inner, Math.max(760, 80 + nodes.length * 160), 180);
  }
  if (spec.type === "table") {
    const head = (spec.columns || []).map((c) => `<th scope="col">${esc(c)}</th>`).join("");
    const body = (spec.rows || []).map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("");
    return `<figure class="illus"><figcaption>${esc(spec.title)}</figcaption>
      <div class="scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
      <p class="caption">${esc(spec.caption || "")}</p></figure>`;
  }
  const nodes = spec.nodes || [];
  const edges = spec.edges || [];
  const inner = [
    ...edges.map((edge) => {
      const a = nodes.find((n) => n.id === edge.from);
      const b = nodes.find((n) => n.id === edge.to);
      if (!a || !b) return "";
      return `<line x1="${a.x * 7}" y1="${a.y * 2.2}" x2="${b.x * 7}" y2="${b.y * 2.2}" class="edge ${esc(edge.kind || "")}"></line>
        <text x="${((a.x + b.x) / 2) * 7}" y="${((a.y + b.y) / 2) * 2.2 - 8}" text-anchor="middle" class="edge-label">${esc(edge.label || "")}</text>`;
    }),
    ...nodes.map((node) => `<g>
      <rect x="${node.x * 7 - 54}" y="${node.y * 2.2 - 18}" width="108" height="36" rx="10" class="node"></rect>
      <text x="${node.x * 7}" y="${node.y * 2.2 + 5}" text-anchor="middle" class="node-label">${esc(node.label)}</text>
    </g>`),
  ].join("");
  return svgFrame(spec.title, spec.caption, inner);
}
