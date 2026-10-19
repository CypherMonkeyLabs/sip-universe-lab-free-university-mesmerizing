/**
 * Build the SIP Universe pages at the repository root from campus/data.
 * A source link is kept only when this script opened it (HTTP 2xx).
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, existsSync, rmSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECKED = "2026-10";
const REPO = "https://github.com/CypherMonkeyLabs/sip-universe-lab-free-university-mesmerizing";
const disclaimer = readFileSync(join(root, "assets/disclaimer.html"), "utf8");
const brandNav = readFileSync(join(root, "assets/brand-nav.html"), "utf8");

const CSP = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:; media-src \'self\' blob: data:; font-src \'self\' data:; connect-src \'self\'; worker-src \'self\' blob:; object-src \'none\'; base-uri \'self\'; form-action \'self\'">';

const LABS = [
  ["UC Lab", "https://cyphermonkeylabs.com/uc-lab-free-university-mesmerizing/"],
  ["AI Lab", "https://cyphermonkeylabs.com/ai-lab-free-university-mesmerizing/"],
  ["Webex Lab", "https://cyphermonkeylabs.com/webex-lab-free-university-mesmerizing/"],
  ["Microsoft Voice", "https://cyphermonkeylabs.com/microsoft-voice-cc-lab-free-university-mesmerizing/"],
  ["Amazon Connect", "https://cyphermonkeylabs.com/amazon-connect-lab-free-university-mesmerizing/"],
  ["Genesys Cloud", "https://cyphermonkeylabs.com/genesys-cloud-lab-free-university-mesmerizing/"],
  ["Five9", "https://cyphermonkeylabs.com/five9-lab-free-university-mesmerizing/"],
  ["NICE CXone", "https://cyphermonkeylabs.com/nice-cxone-lab-free-university-mesmerizing/"]
];

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function readJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

function ensure(dir) {
  mkdirSync(dir, { recursive: true });
}

function walkUrls(node, into) {
  if (!node || typeof node !== "object") return;
  if (typeof node.url === "string" && /^https?:\/\//.test(node.url)) into.add(node.url.split("#")[0]);
  for (const value of Object.values(node)) walkUrls(value, into);
}

async function checkUrls(urls) {
  const logPath = join(root, "data/source-check-log.json");
  let prior = {};
  if (existsSync(logPath)) {
    try { prior = JSON.parse(readFileSync(logPath, "utf8")).results || {}; } catch { prior = {}; }
  }
  const pending = [...urls].filter((url) => !prior[url]);
  console.log(`source urls ${urls.size}, cached ${urls.size - pending.length}, to open ${pending.length}`);
  let cursor = 0;
  async function worker() {
    while (cursor < pending.length) {
      const url = pending[cursor];
      cursor += 1;
      const started = Date.now();
      try {
        const response = await fetch(url, {
          redirect: "follow",
          signal: AbortSignal.timeout(12000),
          headers: { "user-agent": "Mozilla/5.0 (compatible; SIPUniverseLab/1.0; +https://cyphermonkeylabs.com)", accept: "text/html,application/xhtml+xml" }
        });
        prior[url] = { status: response.status, ok: response.status >= 200 && response.status < 300, ms: Date.now() - started };
      } catch (error) {
        prior[url] = { status: 0, ok: false, ms: Date.now() - started, error: String(error.name || "error") };
      }
      if (cursor % 40 === 0) console.log(`  opened ${cursor}/${pending.length}`);
    }
  }
  await Promise.all(Array.from({ length: 12 }, worker));
  ensure(join(root, "data"));
  const opened = Object.values(prior).filter((row) => row.ok).length;
  writeFileSync(logPath, JSON.stringify({ checked: CHECKED, opened, total: Object.keys(prior).length, results: prior }, null, 2));
  return prior;
}

function opened(log, url) {
  if (!url) return false;
  const row = log[url.split("#")[0]];
  return Boolean(row && row.ok);
}

function citeItems(cites, log) {
  const items = [];
  const seen = new Set();
  for (const cite of cites || []) {
    if (!cite || !cite.label) continue;
    const key = `${cite.label}|${cite.url || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (cite.url && opened(log, cite.url)) {
      items.push({ label: cite.label, url: cite.url, status: "opened", note: `last checked ${CHECKED}` });
    } else {
      items.push({ label: cite.label, status: "confirm", note: "confirm" });
    }
  }
  return items;
}

function collectCites(node, into = []) {
  if (!node || typeof node !== "object") return into;
  if (typeof node.label === "string" && (typeof node.url === "string" || node.url == null) && (node.url || node.why || node.q || true)) {
    if (node.url && node.label && node.label.length < 180) into.push({ label: node.label, url: node.url });
  }
  if (Array.isArray(node)) node.forEach((item) => collectCites(item, into));
  else Object.values(node).forEach((item) => collectCites(item, into));
  return into;
}

function sourcesHtml(items) {
  const rows = items.length ? items.map((item) => {
    if (item.status === "opened") {
      return `<li><a href="${esc(item.url)}">${esc(item.label)}</a> — last checked ${CHECKED}</li>`;
    }
    return `<li>${esc(item.label)} — confirm</li>`;
  }).join("") : "<li>confirm</li>";
  return `<section id="go-deeper" class="go-deeper"><h2>Sources and go deeper</h2><ul>${rows}</ul></section>`;
}

function footer(depth) {
  const labs = LABS.map(([name, href]) => `<a class="lab-card" style="--c:#7c3aed" href="${esc(href)}"><span class="lab-card-copy"><strong>${esc(name)}</strong><small>Opened on cyphermonkeylabs.com, ${CHECKED}.</small></span></a>`).join("");
  return `<footer class="site-footer lab-footer wrap" data-canon-footer>
${disclaimer}
<p class="footer-brand">CypherMonkey Labs</p>
${brandNav}
<p class="site-copy">© 2026 CypherMonkeyLabs 🐒</p>
<p class="fine">MIT code. CC BY-NC-SA content. <a href="https://cyphermonkeylabs.com/#contact">Report a concern</a>.</p>
<nav class="next-labs" aria-label="Other labs"><p class="next-title">Other labs</p><div class="lab-cards">${labs}</div>
<p>Checked ${CHECKED}: these cards use cyphermonkeylabs.com, which returned HTTP 200. cyphermonkeylabs.github.io returned 301 to that host. cipher0x9.github.io returned 404, so it is not linked.</p></nav>
<p><a href="${depth}index.html">Open app</a> · <a href="${REPO}">View repo</a></p>
</footer>`;
}

function head(title, desc, depth) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
${CSP}
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${esc(desc)}">
<title>${esc(title)}</title>
<script src="${depth}assets/js/theme-boot.js"></script>
<link rel="stylesheet" href="${depth}assets/css/canon.css">
<link rel="stylesheet" href="${depth}assets/css/shell.css">
<link rel="stylesheet" href="${depth}assets/css/wow.css">
<link rel="stylesheet" href="${depth}assets/css/frame.css">
<link rel="stylesheet" href="${depth}assets/css/polish.css">
<link rel="stylesheet" href="${depth}assets/css/footer.css">
<link rel="stylesheet" href="${depth}assets/css/university.css">
<link rel="stylesheet" href="${depth}assets/css/sip.css">
<link rel="icon" href="${depth}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${depth}guide/guide.css">
</head>`;
}

function chrome(depth) {
  return `<a class="skip" href="#main">Skip to content</a>
<div class="canon-banner" data-banner-hold><div class="banner-scroll"><button type="button" class="banner-arrow" data-banner-prev aria-label="Previous sections">‹</button><nav class="section-rail" aria-label="Sections"></nav><button type="button" class="banner-arrow" data-banner-next aria-label="Next sections">›</button></div><p class="identity-line">A student's open lab: learning and sharing, free for everyone.</p></div>
<header class="topbar"><div class="bar-inner"><button type="button" class="header-menu glow-ico" aria-controls="edge-menu" aria-expanded="false"><span class="header-burger" aria-hidden="true"></span><span>Menu</span></button><a class="brand" href="${depth}index.html"><span class="brand-name">SIP Universe<small>Free University</small></span></a>
<form class="nav-search" role="search"><input class="nav-q" type="search" placeholder="Search rooms" aria-label="Search rooms" data-canon-search autocomplete="off"></form>
</div></header>`;
}

function scripts(depth, extra = "") {
  return `<script defer src="${depth}vendor/confetti.browser.js"></script>
<script defer src="${depth}assets/js/canon.js"></script>
<script defer src="${depth}assets/js/polish.js"></script>
<script defer src="${depth}assets/js/university.js"></script>
<script defer src="${depth}assets/js/sip.js"></script>
${extra}
</body></html>`;
}

function page({ title, desc, body, depth = "", home = false, room = "", track = "", extra = "" }) {
  const klass = home ? "v4 home-world" : "v4";
  const attrs = `${room ? ` data-room="${esc(room)}" data-room-title="${esc(title)}"` : ""}${track ? ` data-track="${esc(track)}"` : ""}`;
  return `${head(title, desc, depth)}
<body class="${klass}"${attrs}>
${chrome(depth)}
<main id="main">
${body}
</main>
${footer(depth)}
${scripts(depth, extra)}`;
}

function mascot(mouth, arm) {
  return `<svg viewBox="0 0 80 96" aria-hidden="true"><ellipse cx="40" cy="88" rx="16" ry="5" fill="#1e1b4b" opacity=".25"/>
<circle cx="16" cy="40" r="8" fill="#e8903a"/><circle cx="64" cy="40" r="8" fill="#e8903a"/>
<circle cx="40" cy="40" r="22" fill="#f0b429"/><ellipse cx="40" cy="46" rx="12" ry="10" fill="#fde68a"/>
<circle cx="32" cy="38" r="3" fill="#1c1917"/><circle cx="48" cy="38" r="3" fill="#1c1917"/>
<circle cx="32" cy="38" r="6" fill="none" stroke="#fde047" stroke-width="1.6"/><circle cx="48" cy="38" r="6" fill="none" stroke="#fde047" stroke-width="1.6"/>
<path d="${mouth}" fill="none" stroke="#1c1917" stroke-width="2" stroke-linecap="round"/>
<path d="${arm}" fill="none" stroke="#e8903a" stroke-width="5" stroke-linecap="round"/></svg>`;
}

function ladderSvg(flow) {
  const parties = flow.parties?.length ? flow.parties : ["A", "B"];
  const steps = flow.steps || [];
  const col = 150;
  const top = 78;
  const rowH = 48;
  const width = Math.max(680, parties.length * col + 40);
  const height = top + Math.max(1, steps.length) * rowH + 36;
  const heads = parties.map((name, i) => {
    const x = 70 + i * col;
    return `<text x="${x}" y="34" text-anchor="middle" fill="#f8fafc" font-size="14" font-family="system-ui,sans-serif">${esc(name)}</text><line x1="${x}" y1="48" x2="${x}" y2="${height - 16}" stroke="#334155" stroke-width="2"/>`;
  }).join("");
  const arrows = steps.map((step, i) => {
    const y = top + i * rowH;
    const x1 = 70 + Number(step.from || 0) * col;
    const x2 = 70 + Number(step.to || 0) * col;
    const color = step.kind === "res" ? "#67e8f9" : "#f9a8d4";
    const id = `p${i}`;
    return `<path id="${id}" d="M${x1} ${y} L${x2} ${y}" fill="none" stroke="${color}" stroke-width="2.4"/>
<text x="${(x1 + x2) / 2}" y="${y - 8}" text-anchor="middle" fill="#fde68a" font-size="13" font-family="system-ui,sans-serif">${esc(step.label || "")}</text>
<circle r="5" fill="#fde047"><animateMotion dur="2.2s" begin="${(i * 0.28).toFixed(2)}s" repeatCount="indefinite"><mpath href="#${id}"/></animateMotion></circle>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(flow.title || "Call flow")}">
<rect width="${width}" height="${height}" fill="#0b1020"/>
<text x="16" y="${height - 10}" fill="#94a3b8" font-size="12" font-family="system-ui,sans-serif">${esc(flow.title || "Flow")} · study drawing · cyphermonkeylabs.com</text>
${heads}${arrows}</svg>`;
}

function archSvg({ title, lines, animated }) {
  const body = lines.map((line) => `<text x="36" y="${line.y}" fill="${line.fill || "#f8fafc"}" font-size="16" font-family="system-ui,sans-serif">${esc(line.text)}</text>`).join("");
  const motion = animated ? `<circle r="7" fill="#fde047"><animateMotion dur="5s" repeatCount="indefinite" path="M80 150 H520"/></circle>` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img" aria-label="${esc(title)}">
<rect width="640" height="360" rx="20" fill="#0b1020"/>
<text x="24" y="36" fill="#fde68a" font-size="20" font-family="system-ui,sans-serif">${esc(title)}</text>
${body}
<line x1="80" y1="150" x2="520" y2="150" stroke="#67e8f9" stroke-width="3"/>
${motion}
<text x="24" y="340" fill="#94a3b8" font-size="12" font-family="system-ui,sans-serif">Study drawing · not a vendor poster · cyphermonkeylabs.com</text>
</svg>`;
}

function barChart(title, rows, note) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  const bars = rows.map((row, i) => {
    const h = Math.round((row.value / max) * 180);
    const x = 48 + i * 36;
    return `<rect x="${x}" y="${230 - h}" width="24" height="${h}" fill="${row.color || "#7c3aed"}" rx="4"><title>${esc(row.label)} ${row.value}</title></rect><text x="${x + 12}" y="248" text-anchor="middle" font-size="9" fill="#334155">${esc(row.short || row.label)}</text>`;
  }).join("");
  return `<figure><figcaption><strong>${esc(title)}</strong> ${esc(note)}</figcaption><svg class="chart-svg" viewBox="0 0 ${Math.max(640, 60 + rows.length * 36)} 270" role="img" aria-label="${esc(title)}">${bars}<text x="16" y="20" fill="#1b1340" font-size="14">${esc(title)}</text></svg></figure>`;
}

function quizHtml(questions) {
  const blocks = questions.map((q, index) => {
    const choices = (q.choices || []).map((choice, i) => `<label><input type="radio" name="q${index}" value="${i}"> ${esc(choice)}</label>`).join("<br>");
    return `<fieldset data-answer="${Number(q.answer)}"><legend>${esc(q.q)}</legend>${choices}<p class="why" hidden>${esc(q.why || "")}</p></fieldset>`;
  }).join("");
  return `<section id="quiz"><h2>Quiz</h2><form data-quiz>${blocks}<button type="submit" class="export-btn ex-html">Check</button><p class="quiz-score" aria-live="polite"></p></form></section>`;
}

function diagramPage(title, svg, items, depth) {
  return page({
    title,
    desc: title,
    depth,
    body: `<p class="crumbs"><a href="${depth}index.html">Home</a> / <a href="${depth}diagrams.html">Diagrams</a> / ${esc(title)}</p><h1>${esc(title)}</h1><section id="visual"><h2>Diagram</h2>${svg.replace("<?xml version=\"1.0\" encoding=\"UTF-8\"?>", "")}</section>${sourcesHtml(items)}`
  });
}

function standaloneSheet(title, inner, items) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">${CSP}<title>${esc(title)}</title>
<style>
body{font:16px/1.45 system-ui,sans-serif;margin:24px;color:#1b1340;background:#fff}
h1{font-size:1.6rem} table{border-collapse:collapse;width:100%} td,th{border-bottom:1px solid #ddd;padding:4px 6px;text-align:left;vertical-align:top}
a{color:#5b21b6}
</style></head><body>
${disclaimer}
<h1>${esc(title)}</h1>
${inner}
${sourcesHtml(items)}
<p class="footer-brand">CypherMonkey Labs</p>
${brandNav}
<p>© 2026 CypherMonkeyLabs 🐒</p>
<p><a href="../../index.html">Open app</a> · <a href="${REPO}">View repo</a></p>
</body></html>`;
}

let chromeSeq = 0;
function chromeShot(url, out, pdf) {
  return new Promise((resolve) => {
    const profile = `/tmp/chrome-sip-${process.pid}-${chromeSeq}`;
    chromeSeq += 1;
    const args = [
      "--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage",
      "--hide-scrollbars", "--no-first-run", "--disable-extensions",
      `--user-data-dir=${profile}`,
      "--force-device-scale-factor=1",
      "--default-background-color=FFFFFFFF",
      "--virtual-time-budget=2000"
    ];
    if (pdf) args.push(`--print-to-pdf=${out}`, "--no-pdf-header-footer");
    else args.push(`--screenshot=${out}`, "--window-size=1100,800");
    args.push(url);
    const child = spawn("google-chrome", args, { stdio: "ignore" });
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearInterval(poll);
      clearTimeout(timer);
      child.kill("SIGKILL");
      setTimeout(() => {
        rmSync(profile, { recursive: true, force: true });
      }, 500);
      resolve(ok);
    };
    const ready = () => {
      try {
        return existsSync(out) && statSync(out).size > 800;
      } catch {
        return false;
      }
    };
    const poll = setInterval(() => {
      if (ready()) finish(true);
    }, 300);
    const timer = setTimeout(() => finish(ready()), 20000);
    child.on("error", () => finish(false));
    child.on("exit", () => finish(ready()));
  });
}

async function runPool(jobs, limit) {
  let cursor = 0;
  let rendered = 0;
  let failed = 0;
  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor];
      cursor += 1;
      const ok = await chromeShot(job[0], job[1], job[2]);
      if (ok) rendered += 1;
      else failed += 1;
      if ((rendered + failed) % 20 === 0) console.log(`  render ${rendered} ok, ${failed} failed`);
    }
  }
  await Promise.all(Array.from({ length: limit }, () => worker()));
  return { rendered, failed };
}

const trackFiles = readdirSync(join(root, "campus/data/tracks")).filter((name) => name.endsWith(".json")).sort();
const tracks = trackFiles.map((file, index) => {
  const data = readJson(`campus/data/tracks/${file}`);
  const code = `T${String(index + 1).padStart(2, "0")}`;
  return { ...data, file, code, href: `tracks/${code}-${data.id}.html` };
});
const ecosystem = readJson("campus/data/ecosystem.json");
const glossary = readJson("campus/data/glossary.json");
const ports = readJson("campus/data/ports.json");
const certs = readJson("campus/data/certs.json");
const boss = readJson("campus/data/boss.json");
const interview = readJson("campus/data/interview.json");
const catalog = readJson("campus/data/catalog.json");

const urlSet = new Set();
for (const track of tracks) walkUrls(track, urlSet);
[ecosystem, glossary, ports, certs, boss, interview].forEach((doc) => walkUrls(doc, urlSet));
[
  "https://www.rfc-editor.org/rfc/rfc3261",
  "https://www.rfc-editor.org/rfc/rfc3264",
  "https://www.rfc-editor.org/rfc/rfc3550",
  "https://www.rfc-editor.org/rfc/rfc3711",
  "https://www.rfc-editor.org/rfc/rfc5853",
  "https://www.rfc-editor.org/rfc/rfc6881",
  "https://www.rfc-editor.org/rfc/rfc7092",
  "https://www.rfc-editor.org/rfc/rfc8224",
  "https://www.rfc-editor.org/rfc/rfc8445",
  "https://www.rfc-editor.org/rfc/rfc8489",
  "https://www.rfc-editor.org/rfc/rfc8656",
  "https://www.rfc-editor.org/rfc/rfc8866",
  "https://opensource.org/license/mit",
  "https://creativecommons.org/licenses/by-nc-sa/4.0/"
].forEach((url) => urlSet.add(url));
const log = await checkUrls(urlSet);
const coreSources = sourcesHtml([
  ["RFC 3261", "https://www.rfc-editor.org/rfc/rfc3261"],
  ["RFC 3264", "https://www.rfc-editor.org/rfc/rfc3264"],
  ["RFC 3550", "https://www.rfc-editor.org/rfc/rfc3550"]
].map(([label, url]) => ({ label, url, status: opened(log, url) ? "opened" : "confirm" })));

const rooms = [];
for (const track of tracks) {
  track.lessons.forEach((lesson, index) => {
    const id = `${track.code}-${lesson.id}`;
    rooms.push({
      id,
      code: track.code,
      track,
      lesson,
      index,
      href: `rooms/${id}.html`,
      flowFile: lesson.flow?.steps?.length ? `diagrams/flow-${id}.svg` : ""
    });
  });
}

ensure(join(root, "diagrams"));
ensure(join(root, "diagrams/pages"));
ensure(join(root, "rooms/sources"));
ensure(join(root, "tracks"));
ensure(join(root, "downloads/sheets"));
ensure(join(root, "downloads/templates"));

const diagrams = [];
for (const room of rooms) {
  if (!room.flowFile) continue;
  const svg = ladderSvg({ ...room.lesson.flow, title: room.lesson.flow.title || room.lesson.title });
  writeFileSync(join(root, room.flowFile), svg);
  diagrams.push({
    id: room.id,
    title: room.lesson.flow.title || room.lesson.title,
    file: room.flowFile,
    href: room.href,
    animated: svg.includes("animateMotion"),
    kind: "flow"
  });
}

const arches = [
  { id: "sip-trapezoid", title: "User agent, proxy, registrar", animated: true, cites: [["RFC 3261", "https://www.rfc-editor.org/rfc/rfc3261"]], lines: [{ y: 80, text: "UAC builds the request. UAS builds the response." }, { y: 120, text: "A proxy adds Via and decrements Max-Forwards." }, { y: 200, text: "A registrar writes Contact bindings. It is not a method." }, { y: 240, text: "A redirect server returns 3xx and leaves." }] },
  { id: "offer-answer", title: "Offer then answer", animated: true, cites: [["RFC 3264", "https://www.rfc-editor.org/rfc/rfc3264"], ["RFC 8866", "https://www.rfc-editor.org/rfc/rfc8866"]], lines: [{ y: 80, text: "The offer lists codecs in preference order." }, { y: 120, text: "The answer picks. It does not have to keep that order as a command." }, { y: 200, text: "Port 0 rejects that media line." }, { y: 240, text: "RFC 3264 is the rule set. RFC 8866 is the SDP format." }] },
  { id: "rtp-beside-sip", title: "Signaling beside media", animated: true, cites: [["RFC 3261", "https://www.rfc-editor.org/rfc/rfc3261"], ["RFC 3550", "https://www.rfc-editor.org/rfc/rfc3550"], ["RFC 3711", "https://www.rfc-editor.org/rfc/rfc3711"]], lines: [{ y: 80, text: "SIP carries the invitation." }, { y: 120, text: "RTP carries the voice, on the address in c=." }, { y: 200, text: "A 200 OK does not prove the media path." }, { y: 240, text: "SRTP is the protected media profile in RFC 3711." }] },
  { id: "ice-gather", title: "ICE candidate checklist", animated: true, cites: [["RFC 8445", "https://www.rfc-editor.org/rfc/rfc8445"], ["RFC 8489", "https://www.rfc-editor.org/rfc/rfc8489"], ["RFC 8656", "https://www.rfc-editor.org/rfc/rfc8656"]], lines: [{ y: 80, text: "Gather host, server-reflexive, and relay candidates." }, { y: 120, text: "STUN discovers the reflexive address. TURN relays when needed." }, { y: 200, text: "Checklist pairs are tested. Nomination picks a pair." }, { y: 240, text: "RFC 8445 is ICE. Confirm a vendor timer that the RFC does not set." }] },
  { id: "sbc-b2bua", title: "SBC as a back-to-back user agent", animated: true, cites: [["RFC 5853", "https://www.rfc-editor.org/rfc/rfc5853"], ["RFC 7092", "https://www.rfc-editor.org/rfc/rfc7092"]], lines: [{ y: 80, text: "A pure proxy keeps the Call-ID." }, { y: 120, text: "A B2BUA usually starts a second dialog." }, { y: 200, text: "The border can rewrite Contact and the media address." }, { y: 240, text: "RFC 5853 describes SBC requirements. RFC 7092 classifies B2BUAs." }] },
  { id: "stir-identity", title: "STIR identity on the INVITE", animated: true, cites: [["RFC 8224", "https://www.rfc-editor.org/rfc/rfc8224"]], lines: [{ y: 80, text: "RFC 8224 puts a signed Identity header on the request." }, { y: 120, text: "The verifier checks the signature and the certificate path." }, { y: 200, text: "SHAKEN is a telephone application of that idea in some countries." }, { y: 240, text: "Attestation letters are policy. Confirm the current framework document." }] },
  { id: "troubleshoot-tree", title: "Troubleshooting tree", animated: false, cites: [["RFC 3261", "https://www.rfc-editor.org/rfc/rfc3261"]], lines: [{ y: 80, text: "1. Does the request leave the phone?" }, { y: 120, text: "2. Does a response come back on the same transaction?" }, { y: 200, text: "3. Does SDP agree, and is c= reachable?" }, { y: 240, text: "4. Only then open the vendor debug." }] },
  { id: "cutover", title: "Trunk cutover", animated: true, cites: [["RFC 3261", "https://www.rfc-editor.org/rfc/rfc3261"]], lines: [{ y: 80, text: "Build the new trunk beside the old one." }, { y: 120, text: "Move a test number. Compare the ladder." }, { y: 200, text: "Move the rest only after media and emergency tests." }, { y: 240, text: "Keep a way back. This drawing is a study order, not a change window." }] },
  { id: "webrtc-bridge", title: "Browser media and a SIP trunk", animated: true, cites: [["RFC 3261", "https://www.rfc-editor.org/rfc/rfc3261"], ["RFC 8445", "https://www.rfc-editor.org/rfc/rfc8445"]], lines: [{ y: 80, text: "The browser speaks SDP and media to a gateway." }, { y: 120, text: "The gateway speaks SIP toward the trunk." }, { y: 200, text: "ICE and DTLS-SRTP are the browser side." }, { y: 240, text: "Do not assume the trunk uses the same transport." }] },
  { id: "e911-path", title: "Emergency call path, protocol level", animated: false, cites: [["RFC 6881", "https://www.rfc-editor.org/rfc/rfc6881"]], lines: [{ y: 80, text: "The call is a SIP request with a service URN or an emergency number." }, { y: 120, text: "Location conveyance is a separate document from the invite itself." }, { y: 200, text: "RFC 6881 is a best current practice, not legal advice." }, { y: 240, text: "Test with the provider's test number. Confirm local rules." }] }
];
for (const arch of arches) {
  const svg = archSvg(arch);
  const file = `diagrams/arch-${arch.id}.svg`;
  writeFileSync(join(root, file), svg);
  diagrams.push({ id: arch.id, title: arch.title, file, href: "start.html", animated: arch.animated && svg.includes("animateMotion"), kind: "architecture" });
}

const sisters = ecosystem.sisters || [];
const roomCycle = ecosystem.roomCycle || [];
function sisterParagraph(item) {
  if (!item || !item.name) return "";
  return `<p><strong>${esc(item.name)}</strong> ${esc(item.blurb || "")}</p>`;
}
for (const room of rooms) {
  const lesson = room.lesson;
  const items = citeItems(collectCites(lesson), log);
  ensure(join(root, "rooms/sources", room.id));
  writeFileSync(join(root, `rooms/sources/${room.id}/sources.json`), JSON.stringify({ id: room.id, checked: CHECKED, items }, null, 2));
  const paras = (lesson.sections || []).map((section) => `<h3>${esc(section.h || "")}</h3>${(section.paragraphs || []).map((p) => `<p class="para">${esc(p)}</p>`).join("")}`).join("");
  const take = (lesson.objectives || []).slice(0, 5).map((line) => `<li>${esc(line)}</li>`).join("");
  const svgInline = room.flowFile ? readFileSync(join(root, room.flowFile), "utf8").replace("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n", "") : "<p>This room has no ladder in the source file.</p>";
  const dl = room.flowFile ? `<p><a class="export-btn ex-svg" href="../${room.flowFile}" download>SVG</a> <a class="export-btn ex-html" href="../diagrams/pages/${room.id}.html">HTML</a> <a class="export-btn ex-pptx" href="../${room.flowFile.replace(".svg", ".png")}">PNG</a></p>` : "";
  const lab = lesson.lab || {};
  const steps = (lab.steps || []).map((step) => `<li>${esc(step)}</li>`).join("");
  const fault = lesson.fault || {};
  const current = sisters.length ? sisters[room.index % sisters.length] : null;
  const prior = roomCycle.length ? roomCycle[room.index % roomCycle.length] : null;
  const sisterNotes = [];
  if (prior) sisterNotes.push(sisterParagraph(prior));
  if (current && (!prior || prior.name !== current.name || prior.blurb !== current.blurb)) sisterNotes.push(sisterParagraph(current));
  const sisterHtml = sisterNotes.join("") || "<p>confirm</p>";
  const caution = /cloud|cisco|multivendor|operations/.test(room.track.file) ? "<p>Vendor menus, ports, and license names change. Confirm before relying on a sentence that is not an RFC.</p>" : "";
  const body = `<p class="crumbs"><a href="../index.html">Home</a> / <a href="../${room.track.href}">${esc(room.track.title)}</a> / ${esc(lesson.title)}</p>
<h1>${esc(lesson.title)}</h1>
<p class="lede">${esc(lesson.summary || "")}</p>
<aside class="takeaways"><h2>Takeaways</h2><ul>${take}</ul></aside>
<section id="learn" class="learn-five"><h2>Learn in 5 minutes</h2><ol>${take}</ol></section>
<section id="visual"><h2>Visual</h2>${svgInline}${dl}<p>${esc(lesson.illustration?.caption || room.lesson.flow?.title || "")}</p></section>
<section id="example"><h2>Worked example</h2><p><strong>${esc(lab.title || "Example")}</strong> ${esc(lab.prompt || "")}</p><ol>${steps}</ol>${caution}</section>
<section id="fault"><h2>Fault</h2><p>${esc(fault.symptom || "")}</p><p>${esc(fault.why || "")}</p></section>
${quizHtml(lesson.quiz || [])}
<section id="ecosystem"><h2>Ecosystem</h2><p>Glossary, sister systems, and the integration seam for this room.</p>${sisterHtml}
<p><a href="../glossary.html">Glossary</a> · <a href="../ecosystem.html">Ecosystem map</a> · <a href="../ports.html">Ports</a> · <a href="../drills.html">Troubleshooting</a></p></section>
${sourcesHtml(items)}`;
  writeFileSync(join(root, room.href), page({
    title: lesson.title,
    desc: lesson.summary || lesson.title,
    depth: "../",
    room: room.id,
    track: room.code,
    body
  }));
  if (room.flowFile) {
    const pageHtml = diagramPage(room.lesson.flow.title || lesson.title, svgInline, items, "../");
    writeFileSync(join(root, `diagrams/pages/${room.id}.html`), pageHtml);
  }
}

for (const diagram of diagrams.filter((item) => item.kind === "architecture")) {
  const svg = readFileSync(join(root, diagram.file), "utf8");
  const arch = arches.find((item) => item.id === diagram.id);
  const items = citeItems((arch?.cites || []).map(([label, url]) => ({ label, url })), log);
  writeFileSync(join(root, `diagrams/pages/${diagram.id}.html`), diagramPage(diagram.title, svg, items, "../"));
}

for (const track of tracks) {
  const mine = rooms.filter((room) => room.track === track);
  const rows = mine.map((room) => `<li class="room-row" data-title="${esc(room.lesson.title)} ${esc(track.title)}" data-track="${track.code}"><a href="../${room.href}">${esc(room.lesson.title)}</a><p>${esc(room.lesson.summary || "")}</p></li>`).join("");
  const counts = `<p class="fold-counts"><span><b data-count-up="${mine.length}">${mine.length}</b> rooms</span><span><b>${mine.reduce((sum, room) => sum + (room.lesson.quiz?.length || 0), 0)}</b> quiz items</span></p>`;
  const body = `<p class="crumbs"><a href="../index.html">Home</a> / ${esc(track.title)}</p>
<h1>${esc(track.title)}</h1>
<p class="lede">${esc(track.summary || "")}</p>
<div class="symbol-row" aria-hidden="true"><i>SIP</i><i>SDP</i><i>RTP</i><i>${esc(track.code)}</i></div>
${counts}
<section id="rooms"><h2>Rooms</h2><ol>${rows}</ol></section>
<section id="ecosystem"><h2>Ecosystem</h2><p>${esc(ecosystem.summary || "")}</p><p><a href="../ecosystem.html">Open the map</a></p></section>
${sourcesHtml(citeItems(collectCites(track.lessons[0] || {}), log).slice(0, 8))}`;
  writeFileSync(join(root, track.href), page({
    title: track.title,
    desc: track.summary || track.title,
    depth: "../",
    track: track.code,
    body
  }));
}

function mascots() {
  return `<div class="mascot-row" aria-label="Mascot variations">
<figure class="mascot-card"><figcaption>Wave</figcaption>${mascot("M30 50 Q40 58 50 50", "M58 48 Q74 20 70 40")}</figure>
<figure class="mascot-card"><figcaption>Cheer</figcaption>${mascot("M28 48 Q40 62 52 48", "M18 48 Q8 20 20 28")}</figure>
<figure class="mascot-card"><figcaption>Think</figcaption>${mascot("M32 52 H48", "M55 50 Q70 58 62 70")}</figure>
<figure class="mascot-card"><figcaption>Idle</figcaption>${mascot("M32 52 Q40 56 48 52", "M22 58 Q14 70 24 74")}</figure>
</div>`;
}

const lessons = rooms.length;
const quizzes = rooms.reduce((sum, room) => sum + (room.lesson.quiz?.length || 0), 0);
const cards = rooms.reduce((sum, room) => sum + (room.lesson.cards?.length || 0), 0);
const animated = diagrams.filter((item) => item.animated).length;
const trackCards = tracks.map((track) => `<article class="track-card" data-track="${track.code}" data-title="${esc(track.title)}"><header><div class="tile-art" data-track="${track.code}"></div><h2><a href="${track.href}">${esc(track.title)}</a></h2></header><p>${esc(track.summary || "")}</p><p>${track.lessons.length} rooms</p></article>`).join("");

const home = page({
  title: "SIP Universe Free University",
  desc: "SIP, SDP, RTP/SRTP, NAT, ICE, SBCs, and interop. Independent, free, and learning-only.",
  home: true,
  extra: `<script type="module" src="assets/js/home-hero-loader.js"></script>`,
  body: `<section class="world-hero uni-fold" id="uni-fold" data-world>
<canvas class="world-gl" data-world-canvas width="1440" height="640" aria-hidden="true"></canvas>
<div class="world-ui">
<p class="world-kicker">SIP study · ${tracks.length} tracks · offline</p>
<h1 class="world-title">Learn SIP <span class="grad-text">in color.</span></h1>
<p class="world-lede">From the first INVITE to borders, media, and interop. Every room has a five-minute path, a drawing, a worked example, a quiz, and sources.</p>
<nav class="uni-menu" aria-label="University">
<a href="diagrams.html">Diagrams</a>
<a href="flows.html">Flows</a>
<a href="charts.html">Charts</a>
<a href="downloads.html">Cheat Codes</a>
<a href="play.html">Play</a>
<a href="ecosystem.html">Ecosystem</a>
<a href="tracks/T17-webrtc.html">WebRTC</a>
<a href="tracks/T18-opensource.html">Open core</a>
<a href="tracks/T19-compliance.html">Compliance</a>
<a href="tracks/T20-gaps.html">Gaps</a>
<a href="downloads.html#sheets">Downloads</a>
<a href="careers.html">Careers</a>
</nav>
<div class="fold-counts" aria-label="Live counters">
<span><b data-count-up="${lessons}">${lessons}</b> rooms</span>
<span><b data-count-up="${quizzes}">${quizzes}</b> prompts</span>
<span><b data-count-up="${cards}">${cards}</b> cards</span>
<span><b data-count-up="${diagrams.length}">${diagrams.length}</b> diagrams</span>
<span data-progress data-progress-max="${lessons}">0 rooms opened</span>
</div>
<div class="theme-switch" role="group" aria-label="Theme switcher">
<button type="button" data-set-theme="bloom">Bloom</button>
<button type="button" data-set-theme="aurora">Dark</button>
<button type="button" data-set-theme="neon">Neon</button>
<button type="button" data-set-theme="holographic">Holographic</button>
<button type="button" data-set-theme="cyberpunk">Cyberpunk</button>
<button type="button" data-set-theme="sunset">Sunset</button>
<button type="button" data-set-theme="paper">Light</button>
<button type="button" data-set-theme="contrast">Contrast</button>
</div>
${mascots()}
<p><a class="export-btn ex-html" href="downloads.html">Download cheat codes</a> <a class="export-btn ex-md" href="campus/">Open the benches</a></p>
</div>
</section>
<section id="rooms"><h2>Tracks</h2>
<label>Search <input data-canon-search type="search" aria-label="Search tracks and rooms"></label>
<p data-empty-search hidden>No titles match.</p>
<div class="room-grid">${trackCards}</div>
${rooms.map((room) => `<p class="room-row" data-title="${esc(room.lesson.title)} ${esc(room.track.title)}" data-track="${room.code}"><a href="${room.href}">${esc(room.code)} ${esc(room.lesson.title)}</a></p>`).join("")}
</section>
${coreSources}`
});
writeFileSync(join(root, "index.html"), home);

const atlasCards = diagrams.map((item) => `<article class="track-card" data-title="${esc(item.title)}"><h2>${esc(item.title)}</h2><p>${item.animated ? "Animated flow" : "Study drawing"} · ${esc(item.kind)}</p><img src="${item.file}" alt="" width="320" height="180"><p><a href="${item.file}">SVG</a> · <a href="${item.file.replace(".svg", ".png")}">PNG</a> · <a href="diagrams/pages/${item.id}.html">HTML</a></p></article>`).join("");
writeFileSync(join(root, "diagrams.html"), page({
  title: "Diagram atlas",
  desc: `${diagrams.length} custom SVG diagrams. ${animated} are animated flows.`,
  body: `<h1>Diagram atlas</h1><p class="lede">${diagrams.length} custom SVGs. ${animated} use a moving packet. Count each file once.</p><section id="atlas"><h2>Drawings</h2><div class="room-grid">${atlasCards}</div></section>${sourcesHtml([{ label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261", status: opened(log, "https://www.rfc-editor.org/rfc/rfc3261") ? "opened" : "confirm" }])}`
}));
const flowCards = diagrams.filter((item) => item.animated).map((item) => `<article class="track-card" data-title="${esc(item.title)}"><h2>${esc(item.title)}</h2><img src="${item.file}" alt="" width="320" height="180"><p><a href="${item.href}">Room</a> · <a href="${item.file}">SVG</a></p></article>`).join("");
writeFileSync(join(root, "flows.html"), page({
  title: "Animated flows",
  desc: `${animated} animated call and signal flows.`,
  body: `<h1>Animated flows</h1><p class="lede">${animated} drawings move a packet along the message. Reduced motion in Settings stops extra page motion. The SVG animation is in the file.</p><section id="flows"><h2>Sequences</h2><div class="room-grid">${flowCards}</div></section>${sourcesHtml([{ label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261", status: opened(log, "https://www.rfc-editor.org/rfc/rfc3261") ? "opened" : "confirm" }])}`
}));

const byTrack = tracks.map((track) => ({ label: track.code, short: track.code, value: track.lessons.length, color: "#7c3aed" }));
const quizBy = tracks.map((track) => ({ label: track.code, short: track.code, value: track.lessons.reduce((sum, lesson) => sum + (lesson.quiz?.length || 0), 0), color: "#0891b2" }));
const cardBy = tracks.map((track) => ({ label: track.code, short: track.code, value: track.lessons.reduce((sum, lesson) => sum + (lesson.cards?.length || 0), 0), color: "#db2777" }));
const letters = {};
for (const term of glossary.terms || []) {
  const letter = (term.term || "?").slice(0, 1).toUpperCase();
  letters[letter] = (letters[letter] || 0) + 1;
}
const letterRows = Object.entries(letters).sort((a, b) => a[0].localeCompare(b[0])).map(([label, value]) => ({ label, short: label, value, color: "#d97706" }));
const transport = {};
for (const row of ports.rows || []) {
  const key = row.transport || "?";
  transport[key] = (transport[key] || 0) + 1;
}
const transportRows = Object.entries(transport).map(([label, value]) => ({ label, short: label.slice(0, 6), value, color: "#16a34a" }));
const faultRows = tracks.map((track) => ({ label: track.code, short: track.code, value: track.lessons.filter((lesson) => lesson.fault).length, color: "#ea580c" }));
const chartsBody = `<h1>Charts</h1><p class="lede">These numbers are counts of files in this repository. They are not call volume, revenue, or market share.</p>
<div id="rough-frame"></div>
<section id="charts">
${barChart("Rooms in each track", byTrack, `${lessons} rooms across ${tracks.length} tracks.`)}
${barChart("Quiz items in each track", quizBy, `${quizzes} quiz items stored with the rooms.`)}
${barChart("Flashcards in each track", cardBy, `${cards} cards stored with the rooms.`)}
${barChart("Glossary terms by first letter", letterRows, `${glossary.terms.length} terms in glossary.json.`)}
${barChart("Port rows by transport", transportRows, `${ports.rows.length} rows in ports.json. Checked note: ${esc(ports.checked || CHECKED)}.`)}
${barChart("Fault write-ups in each track", faultRows, "Each room in the source track files includes a fault.")}
</section>
<script src="vendor/d3.min.js"></script>
<section id="d3"><h2>Same room counts, drawn with D3</h2><svg id="d3-lessons" class="chart-svg" viewBox="0 0 640 220" role="img" aria-label="D3 bar chart of rooms per track"></svg></section>
<script type="application/json" id="d3-lesson-rows">${JSON.stringify(byTrack)}</script>
<script src="assets/js/charts-d3.js"></script>
<script type="module" src="assets/js/chart-rough.js"></script>
${sourcesHtml([{ label: "This repository catalog", status: "confirm", note: "confirm" }])}`;
writeFileSync(join(root, "charts.html"), page({ title: "Charts", desc: "Counts from this SIP lab.", body: chartsBody }));

function findLesson(id) {
  return rooms.find((room) => room.lesson.id === id);
}
const sheetSpecs = [
  ["sip-methods", "SIP methods and responses", "methods-and-codes"],
  ["transactions", "Transactions and dialogs", "transactions"],
  ["call-flows", "Call-flow ladders", "two-acks"],
  ["sdp", "SDP offer and answer", "offer-answer-order"],
  ["rtp", "RTP, SRTP, and codecs", "rtp-header"],
  ["nat-ice", "NAT, STUN, TURN, and ICE", "ice"],
  ["security", "TLS and identity", "stir-shaken"],
  ["sbc", "SBCs and trunking", "b2bua-7092"],
  ["troubleshoot", "Wireshark and sngrep", "wireshark"],
  ["e911", "Emergency calling basics", "e911"],
  ["interop", "Interop seams", "teams-signaling"],
  ["ports", "Ports and transports", "prereq-network"],
  ["webrtc-websocket", "WebRTC and SIP over WebSocket", "signaling-planes"],
  ["open-source-core", "Open-source telephony core", "four-roles"],
  ["compliance-study", "Call authentication and compliance", "not-legal-advice"],
  ["ecosystem-gaps", "Ecosystem, maps, and hooks", "glossary-map"]
];
const sheetItems = [];
for (const [slug, title, lessonId] of sheetSpecs) {
  const room = findLesson(lessonId) || rooms.find((item) => item.lesson.title.toLowerCase().includes(title.split(" ")[0].toLowerCase())) || rooms[0];
  const lesson = room.lesson;
  const items = citeItems(collectCites(lesson), log);
  const inner = `<p>${esc(lesson.summary || "")}</p>${(lesson.sections || []).slice(0, 2).map((section) => `<h2>${esc(section.h || "")}</h2>${(section.paragraphs || []).slice(0, 2).map((p) => `<p>${esc(p)}</p>`).join("")}`).join("")}<p>Room: <a href="../../${room.href}">${esc(lesson.title)}</a></p>`;
  const html = standaloneSheet(title, inner, items);
  const htmlPath = `downloads/sheets/${slug}.html`;
  writeFileSync(join(root, htmlPath), html);
  sheetItems.push({ slug, title, html: htmlPath, items });
}

const flash = [];
for (const room of rooms) {
  for (const card of room.lesson.cards || []) {
    flash.push({ front: card.front || card.q || "", back: card.back || card.a || "", href: room.href, room: room.lesson.title });
  }
}
writeFileSync(join(root, "downloads/flashcards.json"), JSON.stringify({ checked: CHECKED, cards: flash }, null, 2));
const flashHtml = standaloneSheet("SIP flashcards", `<p>${flash.length} cards from the written rooms. Know and Again on the site stay in this browser.</p><ol>${flash.map((card) => `<li><strong>${esc(card.front)}</strong> ${esc(card.back)} <a href="../../${card.href}">${esc(card.room)}</a></li>`).join("")}</ol>`, [{ label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261", status: opened(log, "https://www.rfc-editor.org/rfc/rfc3261") ? "opened" : "confirm" }]);
writeFileSync(join(root, "downloads/flashcards.html"), flashHtml);

const templateHtml = standaloneSheet("SIP trunk checklist", `<ol><li>Name the transport the peer documents.</li><li>Name the Request-URI and whether DNS must resolve it.</li><li>Compare the offer codecs with the answer.</li><li>Check c= and the RTP port with a capture.</li><li>Record the emergency test number the provider gave you. This sheet is not legal advice.</li></ol><p>Confirm before relying on a vendor default that is not printed here.</p>`, citeItems([{ label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261" }, { label: "RFC 3264", url: "https://www.rfc-editor.org/rfc/rfc3264" }], log));
writeFileSync(join(root, "downloads/templates/trunk-checklist.html"), templateHtml);
const captureHtml = standaloneSheet("Capture worksheet", `<ol><li>Filter on the signaling port you meant to use.</li><li>Find the Call-ID.</li><li>Mark INVITE, provisional responses, final response, ACK, and BYE.</li><li>Open SDP and write down c= and m=.</li><li>Only then compare with sngrep or the PBX debug.</li></ol>`, citeItems([{ label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261" }], log));
writeFileSync(join(root, "downloads/templates/capture-worksheet.html"), captureHtml);
const interopHtml = standaloneSheet("Interop notes template", `<p>Fill this from the peer's current document. Do not copy a port from memory.</p><table><tr><th>Peer</th><th>Document you opened</th><th>Signaling</th><th>Media</th><th>Confirm</th></tr><tr><td>CUCM</td><td></td><td></td><td></td><td></td></tr><tr><td>Webex Calling</td><td></td><td></td><td></td><td></td></tr><tr><td>Teams Direct Routing</td><td></td><td></td><td></td><td></td></tr><tr><td>Genesys</td><td></td><td></td><td></td><td></td></tr><tr><td>Asterisk / FreeSWITCH / Kamailio / OpenSIPS</td><td></td><td></td><td></td><td></td></tr></table>`, citeItems(collectCites(findLesson("teams-signaling")?.lesson || {}), log).slice(0, 6));
writeFileSync(join(root, "downloads/templates/interop-matrix.html"), interopHtml);

function simpleDocx(title, paragraphs) {
  const body = paragraphs.map((line) => `<w:p><w:r><w:t xml:space="preserve">${esc(line)}</w:t></w:r></w:p>`).join("");
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr/></w:body></w:document>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  return { documentXml, contentTypes, rels, title };
}
function simplePptx(slides) {
  const slideXml = slides.map((lines) => lines.map((line) => esc(line)).join("\n"));
  return slideXml;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function zipStore(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name);
    const data = Buffer.from(file.data);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    chunks.push(local, name, data);
    const cent = Buffer.alloc(46);
    cent.writeUInt32LE(0x02014b50, 0);
    cent.writeUInt16LE(20, 4);
    cent.writeUInt16LE(20, 6);
    cent.writeUInt16LE(0, 10);
    cent.writeUInt32LE(crc, 16);
    cent.writeUInt32LE(data.length, 20);
    cent.writeUInt32LE(data.length, 24);
    cent.writeUInt16LE(name.length, 28);
    cent.writeUInt32LE(offset, 42);
    central.push(cent, name);
    offset += local.length + name.length + data.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, centralBuf, end]);
}
const docxFiles = [
  ["downloads/templates/trunk-checklist.docx", ["SIP trunk checklist", "Independent learning sheet. Confirm vendor defaults.", "1. Transport the peer documents.", "2. Request-URI and DNS.", "3. Offer and answer.", "4. c= and RTP.", "5. Emergency test number. Not legal advice.", "Sources: see the HTML sheet. CypherMonkey Labs. © 2026 CypherMonkeyLabs."]],
  ["downloads/templates/capture-worksheet.docx", ["Capture worksheet", "Call-ID, transaction, then SDP.", "CypherMonkey Labs"]],
  ["downloads/templates/interop-matrix.docx", ["Interop notes", "Fill from the peer document you opened.", "CUCM, Webex, Teams, Genesys, Asterisk, FreeSWITCH, Kamailio, OpenSIPS.", "Confirm before relying."]]
];
for (const [rel, lines] of docxFiles) {
  const pack = simpleDocx(lines[0], lines);
  const buf = zipStore([
    { name: "[Content_Types].xml", data: pack.contentTypes },
    { name: "_rels/.rels", data: pack.rels },
    { name: "word/document.xml", data: pack.documentXml }
  ]);
  writeFileSync(join(root, rel), buf);
}
const pptSlides = tracks.map((track) => [`SIP Universe`, track.title, track.summary || "", "Study label. Confirm vendor pages.", "© 2026 CypherMonkeyLabs"]);
const slideXmls = pptSlides.map((lines, index) => {
  const text = lines.map((line, i) => `<a:p><a:r><a:rPr lang="en-US" sz="${i === 1 ? 2800 : 1600}"/><a:t>${esc(line)}</a:t></a:r></a:p>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${text}</p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
});
const pptFiles = [
  { name: "[Content_Types].xml", data: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${slideXmls.map((_s, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("")}<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/></Types>` },
  { name: "_rels/.rels", data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>` },
  { name: "ppt/presentation.xml", data: `<?xml version="1.0" encoding="UTF-8"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst>${slideXmls.map((_s, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`).join("")}</p:sldIdLst></p:presentation>` },
  { name: "ppt/_rels/presentation.xml.rels", data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${slideXmls.map((_s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join("")}</Relationships>` }
];
slideXmls.forEach((xml, i) => pptFiles.push({ name: `ppt/slides/slide${i + 1}.xml`, data: xml }));
writeFileSync(join(root, "downloads/sip-university-deck.pptx"), zipStore(pptFiles));
void simplePptx;

const glossaryRows = (glossary.terms || []).map((term) => `<article class="track-card" data-title="${esc(term.term)} ${esc(term.def)}"><h2>${esc(term.term)}</h2><p>${esc(term.def)}</p>${sourcesHtml(citeItems(term.cites, log))}</article>`).join("");
writeFileSync(join(root, "glossary.html"), page({ title: "Glossary", desc: "SIP terms from the written rooms.", body: `<h1>Glossary</h1><section id="terms"><h2>Terms</h2>${glossaryRows}</section>` }));

const portRows = (ports.rows || []).map((row) => `<tr><td>${esc(row.name)}</td><td>${esc(row.port)}</td><td>${esc(row.transport)}</td><td>${esc(row.purpose)}</td><td>${esc(row.note || "")}</td><td>${sourcesHtml(citeItems([row.cite].filter(Boolean), log))}</td></tr>`).join("");
writeFileSync(join(root, "ports.html"), page({ title: "Ports", desc: "SIP ports from RFCs, IANA, and cited vendor pages.", body: `<h1>Ports and protocols</h1><p>${esc(ports.summary || "")}</p><section id="ports"><h2>Rows</h2><table class="ports"><tr><th>Name</th><th>Port</th><th>Transport</th><th>Purpose</th><th>Note</th><th>Source</th></tr>${portRows}</table></section>` }));

const certBlocks = (certs.items || []).map((item) => `<article class="track-card"><h2>${esc(item.name)}</h2><p>${esc(item.status || "")}</p><p>${esc(item.note || "")}</p>${sourcesHtml(citeItems([{ label: item.name, url: item.url }], log))}<p>Confirm before you book an exam.</p></article>`).join("");
writeFileSync(join(root, "certs.html"), page({ title: "Certifications", desc: "Certification names with the page that was checked.", body: `<h1>Certifications</h1><p>${esc(certs.summary || "")}</p><section id="certs">${certBlocks}</section>` }));

const drillBlocks = (boss.incidents || []).map((incident) => {
  const step = (incident.steps || [])[0] || {};
  return `<article class="track-card" data-title="${esc(incident.title)}"><h2>${esc(incident.title)}</h2><p>${esc(incident.summary || "")}</p><p>${esc(step.prompt || "")}</p><ol>${(step.choices || []).map((choice) => `<li>${esc(choice)}</li>`).join("")}</ol><p>${esc(step.why || "")}</p>${sourcesHtml(citeItems(step.cites, log))}</article>`;
}).join("");
writeFileSync(join(root, "drills.html"), page({ title: "Troubleshooting cases", desc: "Cited fault drills.", body: `<h1>Troubleshooting cases</h1><section id="cases">${drillBlocks}</section>` }));

const interviewBlocks = (interview.items || []).map((item) => `<article class="track-card" data-title="${esc(item.q)}"><h2>${esc(item.q)}</h2><p>${esc(item.a)}</p>${sourcesHtml(citeItems(item.cites, log))}</article>`).join("");
writeFileSync(join(root, "interviews.html"), page({ title: "Interview prep", desc: "Study questions with citations.", body: `<h1>Interview prep</h1><p>These are study questions. They are not a claim about anyone's job history.</p><section id="interviews">${interviewBlocks}</section>` }));

function ecoArticles(items) {
  return (items || []).map((item) => `<article class="track-card"><h2>${esc(item.name)}</h2><p>${esc(item.blurb || "")}</p>${sourcesHtml(citeItems(item.cites, log))}</article>`).join("");
}
const ecoSisters = ecoArticles(ecosystem.sisters);
const ecoBridges = ecoArticles(ecosystem.bridges);
const ecoConfig = ecoArticles(ecosystem.config);
const ecoTrouble = ecoArticles(ecosystem.troubleshoot);
const ecoHooks = ecoArticles(ecosystem.hooks);
const mind = ecosystem.mind || { content: "SIP session", children: [] };
writeFileSync(join(root, "ecosystem.html"), page({
  title: "Ecosystem",
  desc: "Systems that hang off a SIP session.",
  extra: `<script src="vendor/d3.min.js"></script><script src="vendor/markmap-view.js"></script>`,
  body: `<h1>Ecosystem</h1><p>${esc(ecosystem.summary || "")}</p><p>${esc(ecosystem.disclaimer || "Educational only. Not legal advice.")}</p><section id="mind"><h2>Mind map</h2><svg id="mindmap"></svg><pre id="mind-md" hidden>${esc(JSON.stringify(mind))}</pre></section><section id="sisters"><h2>Sister technologies</h2>${ecoSisters}</section><section id="bridges"><h2>Cross-platform bridges</h2>${ecoBridges}</section><section id="config"><h2>Configuration</h2>${ecoConfig}</section><section id="troubleshoot"><h2>Troubleshooting</h2>${ecoTrouble}</section><section id="hooks"><h2>Integration hooks</h2>${ecoHooks}</section><script src="assets/js/ecosystem-mindmap.js"></script>${sourcesHtml(citeItems([].concat(ecosystem.sisters || [], ecosystem.bridges || [], ecosystem.config || [], ecosystem.troubleshoot || [], ecosystem.hooks || []).flatMap((item) => item.cites || []), log).slice(0, 12))}`
}));

writeFileSync(join(root, "careers.html"), page({
  title: "Careers",
  desc: "Study labels for SIP work. Not job offers.",
  body: `<h1>Careers</h1><p>These are study labels for the rooms, not requisitions and not salaries.</p><section id="paths"><h2>Study paths</h2><ul><li>Trace reader: tracks 1–3, then troubleshooting.</li><li>Media path: SDP, RTP, NAT, ICE.</li><li>Border: SBC, trunking, TLS.</li><li>Interop: CUCM, Webex, Teams, Genesys, and the open servers, after the protocol rooms.</li></ul><p>Confirm a certification page before you treat it as an exam plan. <a href="certs.html">Certifications</a></p></section>${sourcesHtml([{ label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261", status: opened(log, "https://www.rfc-editor.org/rfc/rfc3261") ? "opened" : "confirm" }])}`
}));

writeFileSync(join(root, "regions.html"), page({
  title: "Countries",
  desc: "No invented country dial-plan matrix.",
  body: `<h1>Countries and emergency calling</h1><section id="regions"><h2>What this page will not invent</h2><p>This lab does not publish a country-by-country dial plan or carrier matrix. Emergency numbers and location rules differ. RFC 6881 is a best current practice for emergency services, not legal advice. Confirm the provider and the local rule before you rely on a test number.</p></section>${sourcesHtml(citeItems([{ label: "RFC 6881", url: "https://www.rfc-editor.org/rfc/rfc6881" }], log))}`
}));

writeFileSync(join(root, "start.html"), page({
  title: "Start here",
  desc: "A short path through the SIP rooms.",
  body: `<h1>Start here</h1><section id="path"><h2>Order</h2><ol><li><a href="${rooms[0].href}">${esc(rooms[0].lesson.title)}</a></li><li>Read one ladder in <a href="flows.html">Flows</a>.</li><li>Open SDP, then RTP, then NAT.</li><li>Open a vendor room only after you can name the dialog and the media address.</li></ol><p><span data-progress data-progress-max="${lessons}">0 rooms opened</span></p></section>${sourcesHtml([{ label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261", status: opened(log, "https://www.rfc-editor.org/rfc/rfc3261") ? "opened" : "confirm" }])}`
}));

writeFileSync(join(root, "mastery.html"), page({
  title: "Mastery",
  desc: "A path from fundamentals to interop.",
  body: `<h1>Mastery</h1><section id="path"><h2>Path</h2><ol>${tracks.map((track) => `<li><a href="${track.href}">${esc(track.title)}</a></li>`).join("")}</ol><p>Anything a vendor page did not open is marked confirm and has no link.</p></section>${coreSources}`
}));

const openedLinks = [];
const confirmLabels = [];
for (const [url, row] of Object.entries(log)) {
  if (row.ok) openedLinks.push(url);
}
writeFileSync(join(root, "resources.html"), page({
  title: "Resources",
  desc: "Links this build opened.",
  body: `<h1>Resources</h1><p>A link is listed only when this build opened it in ${CHECKED}. Everything else stays on the room as the word confirm, with no URL.</p><section id="opened"><h2>Opened</h2><ul>${openedLinks.sort().map((url) => `<li><a href="${esc(url)}">${esc(url)}</a> — last checked ${CHECKED}</li>`).join("")}</ul></section>${coreSources}`
}));
void confirmLabels;

const quizBank = rooms.flatMap((room) => (room.lesson.quiz || []).slice(0, 1).map((q) => ({ ...q, href: room.href, title: room.lesson.title })));
writeFileSync(join(root, "quizzes.html"), page({
  title: "Practice quiz",
  desc: "One practice item from each room.",
  body: `<h1>Practice quiz</h1><p>${quizBank.length} items, one from each room. The room page keeps the full set.</p>${quizHtml(quizBank.slice(0, 12))}<section id="more"><h2>More</h2><ul>${quizBank.map((q) => `<li><a href="${q.href}">${esc(q.title)}</a> — ${esc(q.q)}</li>`).join("")}</ul></section>${coreSources}`
}));

writeFileSync(join(root, "flashcards.html"), page({
  title: "Flashcards",
  desc: "Cards from the written rooms.",
  body: `<h1>Flashcards</h1><p>${flash.length} cards. The printable deck is on <a href="downloads/flashcards.html">the sheet</a> (HTML, JSON, and PDF).</p><section id="cards"><h2>Sample</h2><div class="card-grid">${flash.slice(0, 12).map((card) => `<article class="track-card"><h2>${esc(card.front)}</h2><p>${esc(card.back)}</p></article>`).join("")}</div></section>${sourcesHtml([{ label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261", status: opened(log, "https://www.rfc-editor.org/rfc/rfc3261") ? "opened" : "confirm" }])}`
}));

writeFileSync(join(root, "labs.html"), page({
  title: "Hands-on labs",
  desc: "Browser benches for SIP messages. Not a live PBX.",
  body: `<h1>Hands-on labs</h1><section id="benches"><h2>Benches</h2><p>The message dissector, offer/answer negotiator, header sandbox, and border map live in the campus benches. They run in this browser.</p><p><a class="export-btn ex-html" href="campus/">Open the benches</a></p><ul>${rooms.slice(0, 16).map((room) => `<li><a href="${room.href}">${esc(room.lesson.lab?.title || room.lesson.title)}</a></li>`).join("")}</ul></section>${coreSources}`
}));

writeFileSync(join(root, "play.html"), page({
  title: "Play",
  desc: "A short quiz and a port match. Scores stay in this browser.",
  body: `<h1>Play</h1><section id="play"><h2>Five checks</h2>${quizHtml(quizBank.slice(0, 5))}<p>Port match uses the rows on <a href="ports.html">Ports</a>. A high score is not a certification.</p></section>${coreSources}`
}));

writeFileSync(join(root, "help.html"), page({
  title: "Help",
  desc: "How to use the menu, the course, the guide, and downloads.",
  body: `<h1>Help</h1><section id="menu"><h2>Menu</h2><p>Menu is the top-left button. On a phone it is also the left side of the bottom bar: Menu, Learn, Diagrams, Play, Listen, Guide. Escape, Close, or a tap outside puts the drawer away.</p></section>
<section id="course"><h2>Course</h2><p>Home, then a track, then a room. Each room has a five-minute list, a drawing, a worked example, a quiz, an ecosystem note, and sources.</p></section>
<section id="bot"><h2>Guide</h2><p>After the first tour the monkey greets once in the middle, then sits on the right. Drag it. Voice stays off until you turn it on. Read along follows the page. Idle offers stop when you choose Stop offering.</p></section>
<section id="downloads"><h2>Downloads</h2><p>Every diagram has SVG, PNG, and HTML. Sheets have HTML, PDF, and PNG. Cards have HTML, JSON, and PDF. Templates have HTML, DOCX, and PDF. The deck is PPTX. The zip is optional.</p></section>
<p><button type="button" data-replay-onboard>Show the first-open tour</button></p>${coreSources}`
}));

writeFileSync(join(root, "legal.html"), page({
  title: "Legal and credits",
  desc: "Copyright, trademarks, privacy, and removal requests.",
  body: `<h1>Legal and credits</h1>
<section id="copyright"><h2>Copyright</h2><p>Code in this repository is MIT. Curriculum prose, quizzes, flashcards, and diagram captions are CC BY-NC-SA 4.0. See the LICENSE file.</p></section>
<section id="trademarks"><h2>Trademarks</h2><p>Cisco, CUCM, Webex, Microsoft, Teams, Genesys, and other product names are trademarks of their owners. This project is not affiliated with or endorsed by them.</p></section>
<section id="third"><h2>Third-party licences</h2><p>three.js, anime.js, rough.js, markmap-view, and Mermaid (build notes) are MIT. D3 and canvas-confetti are ISC. They stay under those licences in vendor/.</p></section>
<section id="privacy"><h2>Privacy</h2><p>Preferences, quiz progress, and the guide session stay in this browser. The service worker caches same-origin files. There is no tracker and no account.</p></section>
<section id="a11y"><h2>Accessibility</h2><p>Display controls cover font size and font colour. A skip link is on every page. Reduced motion is in Settings.</p></section>
<section id="removal"><h2>Removal</h2><p>Ask for a correction or removal at <a href="https://cyphermonkeylabs.com/#contact">https://cyphermonkeylabs.com/#contact</a>.</p></section>
${sourcesHtml([{ label: "MIT License", url: "https://opensource.org/license/mit", status: opened(log, "https://opensource.org/license/mit") ? "opened" : "confirm" }, { label: "CC BY-NC-SA 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/", status: opened(log, "https://creativecommons.org/licenses/by-nc-sa/4.0/") ? "opened" : "confirm" }])}`
}));

const counts = { tracks: tracks.length, rooms: lessons, quizzes, cards, diagrams: diagrams.length, animated, sheets: sheetItems.length, glossary: glossary.terms.length };
console.log(counts);

console.log("rendering PDF and PNG");
const renderJobs = [];
for (const sheet of sheetItems) {
  renderJobs.push([`file://${join(root, sheet.html)}`, join(root, `downloads/sheets/${sheet.slug}.pdf`), true]);
  renderJobs.push([`file://${join(root, sheet.html)}`, join(root, `downloads/sheets/${sheet.slug}.png`), false]);
}
renderJobs.push([`file://${join(root, "downloads/flashcards.html")}`, join(root, "downloads/flashcards.pdf"), true]);
renderJobs.push([`file://${join(root, "downloads/flashcards.html")}`, join(root, "downloads/flashcards.png"), false]);
for (const name of ["trunk-checklist", "capture-worksheet", "interop-matrix"]) {
  renderJobs.push([`file://${join(root, `downloads/templates/${name}.html`)}`, join(root, `downloads/templates/${name}.pdf`), true]);
}
for (const diagram of diagrams) {
  renderJobs.push([`file://${join(root, diagram.file)}`, join(root, diagram.file.replace(".svg", ".png")), false]);
}
const pool = await runPool(renderJobs, 3);
const rendered = pool.rendered;
const failed = pool.failed;
console.log(`render done ${rendered} ok ${failed} failed`);
const zipArgs = ["-qr", "downloads/sip-university-offline.zip", "index.html", "rooms", "tracks", "diagrams", "assets", "guide", "vendor", "downloads/sheets", "downloads/templates", "downloads/flashcards.html", "downloads/flashcards.json", "downloads/flashcards.pdf", "downloads/flashcards.png", "downloads/sip-university-deck.pptx", "manifest.webmanifest", "sw.js", "favicon.svg", "help.html", "legal.html", "start.html"];
const zipResult = spawnSync("zip", zipArgs, { cwd: root, timeout: 180000 });
console.log("zip", zipResult.status);

const testRows = [];
function remember(rel) {
  const full = join(root, rel);
  const ok = existsSync(full);
  testRows.push({ rel, ok, bytes: ok ? statSync(full).size : 0 });
}
for (const sheet of sheetItems) {
  for (const ext of ["html", "pdf", "png"]) remember(`downloads/sheets/${sheet.slug}.${ext}`);
}
for (const ext of ["html", "json", "pdf"]) remember(`downloads/flashcards.${ext}`);
for (const name of ["trunk-checklist", "capture-worksheet", "interop-matrix"]) {
  for (const ext of ["html", "docx", "pdf"]) remember(`downloads/templates/${name}.${ext}`);
}
remember("downloads/sip-university-deck.pptx");
remember("downloads/sip-university-offline.zip");
for (const diagram of diagrams) {
  remember(diagram.file);
  remember(diagram.file.replace(".svg", ".png"));
  remember(`diagrams/pages/${diagram.id}.html`);
}
const failedTests = testRows.filter((row) => !row.ok);
const testTable = `<table class="ports"><tr><th>File</th><th>Bytes</th><th>Present</th></tr>${testRows.map((row) => `<tr><td>${esc(row.rel)}</td><td>${row.bytes}</td><td>${row.ok ? "yes" : "missing"}</td></tr>`).join("")}</table>`;
const sheetGrid = sheetItems.map((sheet) => `<article class="dl-card"><h2>${esc(sheet.title)}</h2><p><a href="downloads/sheets/${sheet.slug}.html">HTML</a> · <a href="downloads/sheets/${sheet.slug}.pdf">PDF</a> · <a href="downloads/sheets/${sheet.slug}.png">PNG</a></p></article>`).join("");
writeFileSync(join(root, "downloads.html"), page({
  title: "Cheat codes and downloads",
  desc: "Sheets, cards, templates, and diagrams.",
  body: `<p data-repo-links><a class="export-btn ex-html" href="index.html">Open app</a> <a class="export-btn ex-md" href="${REPO}">View repo</a></p>
<h1>Cheat codes</h1>
<p class="lede">${sheetItems.length} sheets. Each one carries the disclaimer, the three lab links, and sources.</p>
<section id="sheets"><h2>Sheets</h2><div class="sheet-grid">${sheetGrid}</div></section>
<section id="deck"><h2>Cards, templates, deck</h2>
<p><a href="downloads/flashcards.html">Flashcards HTML</a> · <a href="downloads/flashcards.json">JSON</a> · <a href="downloads/flashcards.pdf">PDF</a></p>
<p><a href="downloads/templates/trunk-checklist.html">Trunk checklist</a> (HTML, DOCX, PDF) · <a href="downloads/templates/capture-worksheet.html">Capture worksheet</a> · <a href="downloads/templates/interop-matrix.html">Interop matrix</a></p>
<p><a href="downloads/sip-university-deck.pptx">PPTX deck</a> · <a href="downloads/sip-university-offline.zip">Offline zip</a></p>
</section>
<section id="downloads-bonus"><h2>Test table</h2><p>${testRows.length} files checked. ${failedTests.length} missing.</p>${testTable}</section>${coreSources}`
}));

ensure(join(root, "assets/data"));
writeFileSync(join(root, "assets/data/downloads.json"), JSON.stringify({
  groups: [
    { id: "sheets", title: "Cheat sheets", items: sheetItems.map((sheet) => ({ label: sheet.title, blurb: "HTML, PDF, and PNG.", files: ["html", "pdf", "png"].map((ext) => ({ kind: ext.toUpperCase(), href: `downloads/sheets/${sheet.slug}.${ext}`, bytes: existsSync(join(root, `downloads/sheets/${sheet.slug}.${ext}`)) ? statSync(join(root, `downloads/sheets/${sheet.slug}.${ext}`)).size : 0 })) })) },
    { id: "bundle", title: "Offline zip", items: [{ label: "Download everything", blurb: "The generated site, without screenshot history.", files: [{ kind: "ZIP", href: "downloads/sip-university-offline.zip", bytes: 0 }] }] }
  ]
}, null, 2));

const intents = JSON.parse(readFileSync(join(root, "assets/intents.json"), "utf8"));
const facts = rooms.map((room) => ({
  id: room.id,
  text: room.lesson.summary || room.lesson.title,
  room: room.id,
  roomTitle: room.lesson.title,
  cite: (room.lesson.sections?.[0]?.cites?.[0]?.label) || "RFC 3261",
  href: room.href
}));
ensure(join(root, "guide/kb"));
writeFileSync(join(root, "guide/kb/facts-0.json"), JSON.stringify(facts));
writeFileSync(join(root, "guide/kb/rooms.json"), JSON.stringify(rooms.map((room) => ({ id: room.id, title: room.lesson.title, href: room.href }))));
writeFileSync(join(root, "guide/kb/quizzes.json"), JSON.stringify(quizBank.slice(0, 80).map((q, index) => ({ id: `q${index}`, room: q.href, question: q.q, choices: q.choices, answer: q.answer, why: q.why, href: q.href }))));
writeFileSync(join(root, "guide/kb/cards.json"), JSON.stringify(flash.slice(0, 200).map((card, index) => ({ id: `c${index}`, front: card.front, back: card.back, href: card.href }))));
writeFileSync(join(root, "guide/kb/lessons.json"), JSON.stringify(rooms.map((room) => ({ id: room.id, title: room.lesson.title, steps: (room.lesson.objectives || []).map((text) => ({ text, href: room.href })) }))));
writeFileSync(join(root, "guide/kb/tours.json"), JSON.stringify([{ id: "start", title: "SIP tour", steps: [{ text: "Start with what a request is.", href: rooms[0].href }, { text: "Then open a ladder.", href: "flows.html" }] }]));
writeFileSync(join(root, "guide/kb/index.json"), JSON.stringify({
  builtFrom: "SIP rooms",
  counts: { rooms: rooms.length, facts: facts.length, quizzes: Math.min(80, quizBank.length), cards: Math.min(200, flash.length) },
  factFiles: ["facts-0.json"],
  intents: intents.intents,
  synonyms: { invite: "INVITE request", sdp: "session description", rtp: "media packets", sbc: "session border controller", ice: "interactive connectivity establishment" },
  pages: [
    { id: "index", file: "index.html", title: "SIP Universe", lede: "SIP study rooms.", howTo: "Open a track, then a room.", keywords: ["sip", "sdp", "rtp"] }
  ],
  curriculum: rooms.map((room) => ({ room: room.id, title: room.lesson.title, href: room.href, track: room.code, trackName: room.track.title })),
  games: { ports: [], rooms: [] }
}));

writeFileSync(join(root, "docs/KIT.md"), `# SIP signature kit

This lab copies the Webex university chrome and retargets it to SIP.

## Brand links

Only these three belong in the chrome:

- https://cyphermonkeylabs.com
- https://github.com/CypherMonkeyLabs
- https://linktr.ee/cyphermonkey

Contact is https://cyphermonkeylabs.com/#contact

## What was copied

\`assets/css/frame.css\`, \`wow.css\`, \`footer.css\`, \`assets/js/frame.js\`, \`university.js\`, \`phone-nav.js\`, \`onboard.js\`, \`polish.js\`, \`guide/\`, \`sw.js\`, \`scripts/gzip-static.mjs\`.

\`node scripts/build-university.mjs\` rebuilds rooms from \`campus/data\`.

Sibling labs checked on ${CHECKED}: https://cyphermonkeylabs.com/<repo>/ returned HTTP 200 and is the linked host. https://cyphermonkeylabs.github.io/<repo>/ returned 301 to that host. https://cipher0x9.github.io/<repo>/ returned 404, so it is not used as a live link.
`);

writeFileSync(join(root, "docs/PUBLISHING.md"), `# Publishing this lab

The site is the repository root. \`node scripts/gzip-static.mjs\` serves it with gzip.

Mermaid was not executed in this build. The ladders and architecture drawings are hand-built SVG files. three.js, anime.js, rough.js, D3, markmap-view, and canvas-confetti are vendored and used in the browser.

## Installed: progressive web app

\`manifest.webmanifest\` and \`sw.js\` are in the root. \`university.js\` registers the worker on http or https.

## Prepared, not built: Chrome extension

Not done. A Manifest V3 extension would still need its own manifest, icons at 16, 32, 48, and 128, and a privacy note that this lab stores preferences locally. Load an unpacked folder only after Menu, a room, and the guide work.

## Prepared, not built: iOS and Android (Capacitor)

Not done. There is no \`ios/\` or \`android/\` directory. A later wrapper would set \`webDir\` to this root and app id \`com.cyphermonkeylabs.sipuniverse\` (a suggestion, not a registered bundle).

## Built: embed widget

\`embed/widget.js\` links to the lab, the website, the GitHub organization, and Linktree. \`embed/demo.html\` loads it.

\`\`\`html
<script src="embed/widget.js" data-base="./"></script>
\`\`\`
`);

writeFileSync(join(root, "data/build-counts.json"), JSON.stringify({ ...counts, rendered, failed, testRows: testRows.length, missing: failedTests.length, openedSources: openedLinks.length, sourceUrls: Object.keys(log).length }, null, 2));
console.log("wrote counts", counts, "missing", failedTests.length);
