import { esc } from "./draw.js";

export const NAV = [
  { href: "#/", label: "Home", group: "Learn", icon: "home", desc: "The call-path opening screen." },
  { href: "#/tracks", label: "Tracks", group: "Learn", icon: "tracks", desc: "Sixteen tracks, from signaling to design drills." },
  { href: "#/labs", label: "Labs", group: "Learn", icon: "labs", desc: "Benches that sit inside the lessons." },
  { href: "#/guide", label: "Field guide", group: "Learn", icon: "guide", desc: "Checklists for trunks, faults, and cutovers." },
  { href: "#/boss", label: "Boss incidents", group: "Learn", icon: "boss", desc: "Synthetic logs. The fix cites a document." },
  { href: "#/interview", label: "Interview", group: "Learn", icon: "interview", desc: "Spoken drills. Not a dump of a vendor exam." },
  { href: "#/play", label: "Practice", group: "Learn", icon: "play", i18n: "play", desc: "Games and the flow builder." },
  { href: "#/tools/ladder", label: "Ladders", group: "Tools", icon: "ladder", desc: "Play, pause, and step a call." },
  { href: "#/tools/dissector", label: "Dissector", group: "Tools", icon: "dissector", desc: "Headers and structural warnings." },
  { href: "#/tools/sdp", label: "SDP negotiator", group: "Tools", icon: "sdp", desc: "Codec, direction, and port 0." },
  { href: "#/tools/sandbox", label: "Normalization", group: "Tools", icon: "sandbox", desc: "A CUBE and Acme header-rule subset." },
  { href: "#/tools/capture", label: "Capture bench", group: "Tools", icon: "capture", desc: "Synthetic debug ccsip, one message at a time." },
  { href: "#/play/builder", label: "Flow builder", group: "Tools", icon: "builder", desc: "Assemble your own ladder." },
  { href: "#/explorer", label: "Flow explorer", group: "Tools", icon: "explorer", desc: "Click an edge and read the citation." },
  { href: "#/topology", label: "3D topology", group: "Tools", icon: "topology", desc: "A teaching map. It does not touch a live network." },
  { href: "#/atlas", label: "Diagrams", group: "Field", icon: "diagrams", i18n: "diagrams", desc: "Stacks, ladders, and borders." },
  { href: "#/flows", label: "Flows", group: "Field", icon: "flows", i18n: "flows", desc: "Animated call, signal, and media sequences." },
  { href: "#/charts", label: "Charts", group: "Field", icon: "charts", i18n: "charts", desc: "Counts from the catalog and the ports table." },
  { href: "#/ports", label: "Ports", group: "Field", icon: "ports", desc: "RFC defaults and the cloud ranges read for this edition." },
  { href: "#/glossary", label: "Glossary", group: "Field", icon: "glossary", desc: "Short definitions. The citation is the authority." },
  { href: "#/ecosystem", label: "Ecosystem", group: "Field", icon: "ecosystem", i18n: "ecosystem", desc: "Neighbors that hang off the SIP session." },
  { href: "#/certs", label: "Certifications", group: "Field", icon: "certs", desc: "Status checked against the linked vendor pages." },
  { href: "#/career", label: "Careers", group: "Field", icon: "career", i18n: "careers", desc: "Practice seats. Not a hiring promise." },
  { href: "#/roadmap", label: "Roadmap", group: "Field", icon: "roadmap", desc: "What this edition checked, and what it did not." },
  { href: "#/downloads", label: "Cheat Codes", group: "Field", icon: "cheats", i18n: "cheats", desc: "One-page sheets and the printable flashcard deck." },
  { href: "#/badges", label: "Badges", group: "Field", icon: "badges", desc: "Marks stored in this browser." },
  { href: "#/faults", label: "Faults", group: "Field", icon: "faults", desc: "The symptom index. Each fault lives in its lesson." },
  { href: "#/regions", label: "Regions", group: "Field", icon: "regions", i18n: "regions", desc: "Cited facts, plus examples marked as examples." },
];

export function iconHTML(name) {
  const id = `ico-${String(name || "home").replace(/[^a-z0-9-]/g, "") || "home"}`;
  return `<svg class="menu-ico" aria-hidden="true" width="22" height="22"><use href="#${id}"></use></svg>`;
}

export function navCurrent(path, href) {
  if (href === "#/tracks") {
    return path === "#/tracks" || path.startsWith("#/track/") || path.startsWith("#/lesson/")
      || path === "#/labs" || path.startsWith("#/guide") || path.startsWith("#/boss") || path.startsWith("#/interview");
  }
  if (href === "#/") return path === "#/" || path === "";
  if (href === "#/downloads") return path === "#/downloads";
  return path === href || path.startsWith(`${href}/`);
}

export function menuRows(path, query) {
  const needle = query.trim().toLowerCase();
  const items = NAV.filter((item) => {
    if (!needle) return true;
    return `${item.label} ${item.desc} ${item.group}`.toLowerCase().includes(needle);
  });
  if (!items.length) {
    return `<p class="menu-empty">No menu page matches that.</p>`;
  }
  if (needle) {
    return items.map((item) => row(item, path)).join("");
  }
  return ["Learn", "Tools", "Field"].map((group) => {
    const links = items.filter((item) => item.group === group).map((item) => row(item, path)).join("");
    return `<h2>${group}</h2>${links}`;
  }).join("");
}

function row(item, path) {
  const current = navCurrent(path, item.href) ? ' aria-current="page"' : "";
  const i18n = item.i18n ? ` data-i18n="${item.i18n}"` : "";
  return `<a class="menu-item" href="${item.href}"${current}>${iconHTML(item.icon)}<span class="menu-copy"><strong${i18n}>${esc(item.label)}</strong><small>${esc(item.desc)}</small></span></a>`;
}
