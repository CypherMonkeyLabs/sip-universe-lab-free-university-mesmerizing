import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const campus = join(root, "campus");
const out = join(campus, "downloads");
mkdirSync(out, { recursive: true });

const load = (name) => JSON.parse(readFileSync(join(campus, "data", name), "utf8"));
const ports = load("ports.json");
const glossary = load("glossary.json");
const guide = load("fieldguide.json");

const CSP = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:; media-src \'self\' blob: data:; font-src \'self\' data:; connect-src \'self\'; worker-src \'self\' blob:; object-src \'none\'; base-uri \'self\'; form-action \'self\'">';
const FOOT = `Independent educational project, not affiliated with or endorsed by any vendor. Trademarks belong to their owners. MIT code, CC BY-NC-SA content.`;
const CHECKED = "2026-10";
const LINKS = [
  ["CypherMonkey Labs", "https://cyphermonkeylabs.com"],
  ["CypherMonkeyLabs on GitHub", "https://github.com/CypherMonkeyLabs"],
  ["CypherMonkey on Linktree", "https://linktr.ee/cyphermonkey"],
];
const sourceLog = (() => {
  try {
    return JSON.parse(readFileSync(join(root, "data/source-check-log.json"), "utf8")).results || {};
  } catch {
    return {};
  }
})();

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function page({ title, kicker, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  ${CSP}
  <title>${esc(title)} · SIP Universe</title>
  <link rel="icon" href="../favicon.ico" sizes="any">
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <style>
    @font-face {
      font-family: "Campus UI";
      src: local("Segoe UI"), local("system-ui"), local("Helvetica Neue"), local("Arial");
      font-display: swap;
      size-adjust: 100%;
      ascent-override: 90%;
      descent-override: 22%;
      line-gap-override: 0%;
    }
    @page { size: letter; margin: 0.45in; }
    body { font: 13px/1.35 "Campus UI", ui-sans-serif, system-ui, sans-serif; color: #142033; margin: 0; background: #f4f7fb; }
    main { max-width: 980px; margin: 0 auto; padding: 18px 18px 8px; background: white; }
    h1 { font-size: 26px; margin: 0 0 4px; letter-spacing: -0.03em; }
    .kicker { color: #0f6e73; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; margin: 0; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; }
    th, td { text-align: left; vertical-align: top; border-bottom: 1px solid #d5deea; padding: 4px 6px; font-size: 12px; }
    th { background: #e7f6f6; }
    ul { margin: 6px 0 12px; padding-left: 18px; }
    li { margin: 3px 0; }
    a { color: #0f6e73; }
    .go-deeper { margin: 16px 0 8px; padding: 12px 14px; border: 2px solid #134e4a; border-radius: 12px; background: #f0fdfa; color: #042f2e; }
    .go-deeper h2 { margin: 0 0 8px; font-size: 16px; color: #042f2e; }
    .go-deeper a { color: #134e4a; }
    footer { border-top: 2px solid #0f6e73; margin-top: 12px; padding-top: 8px; font-size: 11px; color: #3c5168; }
    .ladder { font-family: ui-monospace, monospace; background: #07111c; color: #d7f6ff; padding: 10px; border-radius: 8px; white-space: pre; }
  </style>
</head>
<body>
<main>
  <p class="kicker">${esc(kicker)}</p>
  <h1>${esc(title)}</h1>
  ${body}
  <footer>
    <p>© 2026 CypherMonkeyLabs 🐒</p>
    <p>${LINKS.map(([label, href]) => `<a href="${href}">${esc(label)}</a>`).join(" · ")}</p>
    <p>${FOOT}</p>
  </footer>
</main>
</body>
</html>`;
}

function decode(value) {
  return String(value).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function citesFromHtml(html) {
  const cites = [];
  const re = /<a href="([^"]+)">([^<]+)<\/a>/g;
  let match = re.exec(html);
  while (match) {
    cites.push({ url: decode(match[1]), label: decode(match[2]) });
    match = re.exec(html);
  }
  return cites;
}

function sourcesBlock(cites) {
  const items = [];
  const seen = new Set();
  for (const cite of cites || []) {
    if (!cite || !cite.label) continue;
    const key = `${cite.label}|${cite.url || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const base = cite.url ? cite.url.split("#")[0] : "";
    const row = base ? sourceLog[base] : null;
    if (cite.url && row && row.ok) {
      items.push(`<li><a href="${esc(cite.url)}">${esc(cite.label)}</a> — last checked ${CHECKED}</li>`);
    } else {
      items.push(`<li>${esc(cite.label)} — confirm</li>`);
    }
  }
  if (!items.length) items.push("<li>confirm</li>");
  return `<section id="go-deeper" class="go-deeper"><h2>Sources and go deeper</h2><ul>${items.join("")}</ul></section>`;
}

function withSources(body, extra = []) {
  return `${body}${sourcesBlock([...extra, ...citesFromHtml(body)])}`;
}

function sectionBlocks(id) {
  const section = guide.sections.find((item) => item.id === id);
  if (!section) return "";
  return section.blocks.map((block) => {
    if (block.type === "checklist") {
      return `<h2>${esc(block.title)}</h2><ul>${block.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
    }
    if (block.type === "tree") {
      return `<h2>${esc(block.title)}</h2><ul>${block.nodes.map((node) => `<li><strong>${esc(node.when)}.</strong> ${esc(node.then)}</li>`).join("")}</ul>`;
    }
    if (block.type === "note") return `<p><strong>${block.tone === "unverified" ? "Unverified. " : ""}</strong>${esc(block.text)}</p>`;
    if (block.h) {
      const cites = (block.cites || []).map((cite) => `<a href="${esc(cite.url)}">${esc(cite.label)}</a>`).join(" · ");
      return `<h2>${esc(block.h)}</h2>${(block.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("")}<p>${cites}</p>`;
    }
    return "";
  }).join("");
}

const sheets = [];

function addSheet(item) {
  const htmlName = `${item.id}.html`;
  writeFileSync(join(out, htmlName), page({ ...item, body: withSources(item.body, item.cites || []) }));
  sheets.push({ ...item, html: `downloads/${htmlName}` });
}

addSheet({
  id: "ports-protocols",
  topic: "Ports",
  title: "Ports and protocols",
  kicker: "Cheat sheet",
  blurb: "RFC defaults and the cloud ranges read on 2026-10-15.",
  body: `<p>Vendor rows were read from the linked pages on ${esc(ports.checked)}. If the page changes, the page wins. RTP has no single IANA port.</p>
    <table><thead><tr><th>Name</th><th>Port</th><th>Transport</th><th>Source</th></tr></thead><tbody>
    ${ports.rows.map((row) => `<tr><td>${esc(row.name)}</td><td>${esc(row.port)}</td><td>${esc(row.transport)}</td><td><a href="${esc(row.cite.url)}">${esc(row.cite.label)}</a></td></tr>`).join("")}
    </tbody></table>`,
});

addSheet({
  id: "call-flows",
  topic: "Flows",
  title: "Call flows to recognize",
  kicker: "Cheat sheet",
  blurb: "The ladders operators trace first, with the RFC for each.",
  body: `<pre class="ladder">Alice        SBC          Bob
  |  INVITE    |            |
  |---------->|            |
  |  100       |  INVITE    |
  |<----------|---------->|
  |            |  180      |
  |  180       |<----------|
  |<----------|            |
  |            |  200 SDP  |
  |  200 SDP   |<----------|
  |<----------|            |
  |  ACK       |            |
  |---------->|            |</pre>
  <ul>
    <li>100 Trying stops the retransmit. It is not ringing. <a href="https://www.rfc-editor.org/rfc/rfc3261#section-21.1.1">RFC 3261</a></li>
    <li>200 OK to INVITE is acknowledged with ACK. A 200 to BYE is not. <a href="https://www.rfc-editor.org/rfc/rfc3261">RFC 3261</a></li>
    <li>183 with SDP can be early media. 180 is alerting. <a href="https://www.rfc-editor.org/rfc/rfc3960">RFC 3960</a></li>
    <li>PRACK acknowledges a reliable 1xx. <a href="https://www.rfc-editor.org/rfc/rfc3262">RFC 3262</a></li>
    <li>200 OK to CANCEL does not end the INVITE. Look for 487. <a href="https://www.rfc-editor.org/rfc/rfc3261#section-9">RFC 3261 §9</a></li>
    <li>REFER asks the transferee to send a new INVITE. <a href="https://www.rfc-editor.org/rfc/rfc3515">RFC 3515</a></li>
  </ul>
  <p>Messages in the campus are synthetic. Addresses use <a href="https://www.rfc-editor.org/rfc/rfc5737">RFC 5737</a>.</p>`,
});

addSheet({
  id: "config-checklist",
  topic: "Config",
  title: "Trunk configuration checklist",
  kicker: "Cheat sheet",
  blurb: "Decisions to write down before opening a vendor GUI.",
  body: sectionBlocks("configuration"),
});

addSheet({
  id: "troubleshooting",
  topic: "Troubleshooting",
  title: "Troubleshooting tree",
  kicker: "Cheat sheet",
  blurb: "Status code, then SDP, then the packets.",
  body: sectionBlocks("troubleshooting"),
});

const coreTerms = ["SIP", "SDP", "Offer/answer", "RTP", "SRTP", "Dialog", "Transaction", "B2BUA", "ICE", "STUN", "TURN", "PRACK", "REFER", "telephone-event", "SIPREC", "PAI", "E911", "Direct Routing"];
const glossaryRows = coreTerms.map((name) => glossary.terms.find((item) => item.term === name)).filter(Boolean);
addSheet({
  id: "glossary",
  topic: "Glossary",
  title: "Core glossary",
  kicker: "Cheat sheet",
  blurb: "Short definitions. The in-app glossary has the full set.",
  cites: glossaryRows.flatMap((term) => term.cites || []),
  body: `<table><thead><tr><th>Term</th><th>In one breath</th></tr></thead><tbody>
    ${glossaryRows.map((term) => `<tr><td>${esc(term.term)}</td><td>${esc(term.def)}</td></tr>`).join("")}
  </tbody></table>`,
});

addSheet({
  id: "migration",
  topic: "Migration",
  title: "Cutover checklist",
  kicker: "Cheat sheet",
  blurb: "Parallel trunk, traced pilot, written rollback.",
  body: sectionBlocks("migration"),
});

addSheet({
  id: "e911",
  topic: "E911",
  title: "Emergency calling checklist",
  kicker: "Cheat sheet",
  blurb: "Protocol plus the FCC page. Not legal advice.",
  body: sectionBlocks("e911"),
});

addSheet({
  id: "trunking",
  topic: "Trunking",
  title: "PSTN and BYOC options",
  kicker: "Cheat sheet",
  blurb: "Who owns the SBC, and which page to open.",
  body: sectionBlocks("trunking"),
});

addSheet({
  id: "security",
  topic: "Security",
  title: "Signaling security checklist",
  kicker: "Cheat sheet",
  blurb: "Transport, identity, and what not to put on a public hop.",
  body: sectionBlocks("security"),
});

const mediaTerms = ["SDP", "Offer/answer", "RTP", "SRTP", "telephone-event"];
addSheet({
  id: "sdp-rtp",
  topic: "Media",
  title: "SDP and RTP reminders",
  kicker: "Cheat sheet",
  blurb: "Offer/answer, port 0, and the G.722 clock exception.",
  body: `<ul>
    <li>Port 0 rejects a media stream. <a href="https://www.rfc-editor.org/rfc/rfc3264">RFC 3264</a></li>
    <li>G.722 RTP clock rate is 8000 even though the audio is 16 kHz. <a href="https://www.rfc-editor.org/rfc/rfc3551#section-4.5.2">RFC 3551 §4.5.2</a></li>
    <li>telephone-event is the IETF digit mechanism in RTP. INFO is not the DTMF spec. <a href="https://www.rfc-editor.org/rfc/rfc4733">RFC 4733</a> · <a href="https://www.rfc-editor.org/rfc/rfc6086">RFC 6086</a></li>
    <li>SRTP is RFC 3711. SDES (RFC 4568) and DTLS-SRTP (RFC 5764) are different keying paths.</li>
  </ul>
  <table><thead><tr><th>Term</th><th>In one breath</th></tr></thead><tbody>
    ${mediaTerms.map((name) => {
      const term = glossary.terms.find((item) => item.term === name);
      return term ? `<tr><td>${esc(term.term)}</td><td>${esc(term.def)}</td></tr>` : "";
    }).join("")}
  </tbody></table>`,
});

const cards = [];
for (const file of ["01-foundations.json", "02-sip-core.json", "03-call-flows.json", "04-routing.json", "05-sdp.json", "06-rtp.json", "07-security.json", "08-nat.json", "09-sbc.json", "10-cisco.json", "11-multivendor.json", "12-cloud.json", "13-troubleshoot.json", "14-operations.json", "15-ecosystem.json", "16-capstone.json"]) {
  const track = JSON.parse(readFileSync(join(campus, "data", "tracks", file), "utf8"));
  for (const lesson of track.lessons) {
    for (const card of lesson.cards || []) {
      cards.push({
        track: track.title,
        lesson: lesson.title,
        front: card.front,
        back: card.back,
        cite: card.cite || null,
      });
    }
  }
}
writeFileSync(join(out, "flashcards.json"), JSON.stringify({ count: cards.length, cards }, null, 1));
const deckBody = cards.map((card, i) => `<article class="card"><p class="kicker">${esc(card.track)} · ${i + 1}</p><h2>${esc(card.front)}</h2><p>${esc(card.back)}</p>${card.cite ? `<p><a href="${esc(card.cite.url)}">${esc(card.cite.label)}</a></p>` : ""}</article>`).join("");
writeFileSync(join(out, "flashcards.html"), page({
  title: "Flashcard deck",
  kicker: `${cards.length} cards`,
  body: withSources(`<style>.card{break-inside:avoid;border:1px solid #d5deea;border-radius:10px;padding:8px 10px;margin:0 0 8px} h2{font-size:15px;margin:0 0 4px}</style>${deckBody}`, cards.map((card) => card.cite).filter(Boolean)),
}));

const items = sheets.map((sheet) => ({
  id: sheet.id,
  topic: sheet.topic,
  title: sheet.title,
  blurb: sheet.blurb,
  html: sheet.html,
  pdf: `downloads/${sheet.id}.pdf`,
  png: `downloads/${sheet.id}.png`,
}));
items.push({
  id: "flashcards",
  topic: "Flashcards",
  title: "Printable flashcard deck",
  blurb: `${cards.length} cards from the lessons, with the citation that was on the card.`,
  html: "downloads/flashcards.html",
  pdf: "downloads/flashcards.pdf",
  json: "downloads/flashcards.json",
});

writeFileSync(join(out, "manifest.json"), JSON.stringify({ generated: "2026-10-16", items }, null, 1));

const chrome = process.env.CHROME || "/opt/google/chrome/chrome";
function render(htmlName, pdfName, pngName) {
  const file = `file://${join(out, htmlName)}`;
  const base = ["--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run", `--user-data-dir=/tmp/sip-chrome-${process.pid}`];
  if (pdfName) {
    const pdf = spawnSync(chrome, [...base, "--no-pdf-header-footer", `--print-to-pdf=${join(out, pdfName)}`, file], { encoding: "utf8", timeout: 90000 });
    if (pdf.status !== 0) throw new Error(`pdf ${htmlName}: ${pdf.stderr || pdf.stdout || pdf.error}`);
  }
  if (pngName) {
    const png = spawnSync(chrome, [...base, "--hide-scrollbars", "--window-size=1100,1500", `--screenshot=${join(out, pngName)}`, file], { encoding: "utf8", timeout: 90000 });
    if (png.status !== 0) throw new Error(`png ${htmlName}: ${png.stderr || png.stdout || png.error}`);
  }
}

for (const sheet of sheets) render(`${sheet.id}.html`, `${sheet.id}.pdf`, `${sheet.id}.png`);
render("flashcards.html", "flashcards.pdf", null);
console.log(JSON.stringify({ sheets: sheets.length, cards: cards.length }, null, 2));
