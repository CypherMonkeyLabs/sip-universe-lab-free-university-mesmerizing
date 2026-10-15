const SPECS = {
  foundations: [[0, 0, 0, 1.4, 1.4, 2.4], [1.6, 0, 0.2, 0.8, 0.8, 1.1], [-0.2, 0, 1.6, 0.7, 0.7, 0.7]],
  "sip-core": [[0, 0, 0, 1.6, 1.2, 0.45], [0.15, 0.5, 0.15, 1.3, 1, 0.45], [0.3, 1, 0.3, 1, 0.8, 0.45], [0.45, 1.5, 0.45, 0.7, 0.6, 0.4]],
  "call-flows": [[0, 0, 0, 0.45, 0.45, 2.2], [2.2, 0, 0, 0.45, 0.45, 2.2], [0.2, 1.5, 0.2, 1.8, 0.28, 0.22], [0.2, 0.7, 0.2, 1.8, 0.28, 0.22]],
  routing: [[0.4, 0, 0.4, 1.5, 1.5, 0.35], [0.9, 0.4, 0.2, 0.35, 1.2, 1.4], [0.2, 0.4, 0.9, 1.2, 0.35, 1.4]],
  sdp: [[0, 0, 0, 1.7, 0.35, 1.3], [0.3, 0.2, 0.8, 1.5, 0.3, 1.1], [0.6, 0.4, 1.5, 1.2, 0.28, 0.9]],
  rtp: [[0, 0, 0.2, 0.55, 0.7, 0.7], [0.8, 0, 0, 0.55, 0.7, 1.3], [1.6, 0, 0.3, 0.55, 0.7, 0.9], [2.4, 0, 0.1, 0.55, 0.7, 1.6]],
  security: [[0.2, 0, 0.2, 1.6, 1.4, 0.4], [0.45, 0.45, 0.45, 1.1, 0.95, 1.5], [0.75, 1.9, 0.75, 0.5, 0.4, 0.45]],
  nat: [[0, 0, 0, 1.1, 1.3, 1.5], [1.5, 0, 0.4, 1.1, 1.3, 1.5], [0.7, 0.3, 1.3, 0.7, 0.35, 0.35]],
  sbc: [[0, 0, 0.6, 0.5, 1.4, 1.8], [2, 0, 0.6, 0.5, 1.4, 1.8], [0.5, 0.7, 0.3, 1.5, 0.4, 0.7]],
  cisco: [[0.3, 0, 0.3, 1.8, 1.8, 0.7], [0.7, 0.75, 0.7, 1, 1, 0.9], [1.05, 1.7, 1.05, 0.35, 0.35, 0.55]],
  multivendor: [[0, 0, 0, 0.8, 0.8, 0.8], [1.5, 0, 0.4, 0.8, 0.8, 1.2], [0.5, 0, 1.6, 0.8, 0.8, 1.5], [1.7, 0.2, 1.5, 0.6, 0.6, 0.6]],
  cloud: [[0.2, 0, 0.6, 0.7, 0.7, 0.9], [1, 0.35, 0.3, 0.9, 0.8, 0.7], [1.7, 0.15, 1, 0.75, 0.7, 0.85], [0.8, 0.7, 1.2, 0.6, 0.55, 0.5]],
  troubleshoot: [[0.8, 0, 0.8, 0.7, 0.7, 0.35], [0.95, 0.4, 0.95, 0.4, 0.4, 1.5], [0.2, 1.5, 0.5, 1.5, 0.28, 0.22]],
  operations: [[0.15, 0, 0.15, 2, 2, 0.3], [0.7, 0.35, 0.7, 0.9, 0.9, 0.35], [1.0, 0.75, 1.0, 0.28, 0.28, 0.9]],
  ecosystem: [[0.9, 0, 0.9, 0.7, 0.7, 0.7], [0, 0, 0.2, 0.55, 0.55, 0.55], [1.8, 0, 0.3, 0.55, 0.55, 0.9], [0.3, 0, 1.7, 0.55, 0.55, 1.1], [1.6, 0, 1.6, 0.5, 0.5, 0.5]],
  capstone: [[0.85, 0, 0.85, 0.8, 0.8, 1.6], [0.2, 0.9, 0.85, 2.1, 0.35, 0.35], [0.85, 0.9, 0.2, 0.35, 2.1, 0.35]],
};

const TONES = [
  ["var(--cc-accent-1)", "color-mix(in srgb, var(--cc-accent-1) 62%, #05060c)", "color-mix(in srgb, var(--cc-accent-2) 70%, #05060c)"],
  ["var(--cc-accent-2)", "color-mix(in srgb, var(--cc-accent-2) 60%, #05060c)", "color-mix(in srgb, var(--cc-accent-3) 68%, #05060c)"],
  ["var(--cc-accent-3)", "color-mix(in srgb, var(--cc-accent-3) 58%, #05060c)", "color-mix(in srgb, var(--cc-accent-4) 70%, #05060c)"],
  ["var(--cc-accent-4)", "color-mix(in srgb, var(--cc-accent-4) 55%, #05060c)", "color-mix(in srgb, var(--cc-accent-1) 66%, #05060c)"],
];

function project(x, y, z) {
  return [120 + (x - z) * 26, 138 - y * 24 + (x + z) * 13];
}

function face(points, fill) {
  const d = points.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + " Z";
  return `<path d="${d}" fill="${fill}" stroke="rgba(5,8,16,0.55)" stroke-width="1.1" stroke-linejoin="round"></path>`;
}

function prism(x, y, z, w, d, h, tone) {
  const colors = TONES[tone % TONES.length];
  const a = project(x, y, z);
  const b = project(x + w, y, z);
  const c = project(x + w, y, z + d);
  const dp = project(x, y, z + d);
  const a2 = project(x, y + h, z);
  const b2 = project(x + w, y + h, z);
  const c2 = project(x + w, y + h, z + d);
  const d2 = project(x, y + h, z + d);
  return face([b, c, c2, b2], colors[1]) + face([a, dp, d2, a2], colors[2]) + face([a2, b2, c2, d2], colors[0]);
}

export function iconHTML(id) {
  const parts = SPECS[id] || SPECS.foundations;
  const body = parts.map((part, i) => prism(part[0], part[1], part[2], part[3], part[4], part[5], i + (id.length % 3))).join("");
  const safe = String(id).replace(/[^a-z0-9-]/gi, "") || "icon";
  return `<span class="iso" data-iso="${safe}" aria-hidden="true"><svg viewBox="0 0 240 210">
    <defs>
      <radialGradient id="glow-${safe}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="var(--cc-accent-1)" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="var(--cc-accent-2)" stop-opacity="0"/>
      </radialGradient>
      <filter id="soft-${safe}" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="14" stdDeviation="6" flood-color="#02040a" flood-opacity="0.55"/>
      </filter>
    </defs>
    <ellipse cx="120" cy="168" rx="62" ry="16" fill="url(#glow-${safe})"></ellipse>
    <g filter="url(#soft-${safe})">${body}</g>
  </svg></span>`;
}
