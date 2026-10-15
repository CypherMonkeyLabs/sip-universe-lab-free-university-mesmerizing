import { esc, citeLinks } from "./draw.js";
import { getSettings, saveSettings, onSettings } from "./audio.js";
import { loadJSON } from "./store.js";
import { ATLAS, figureHTML } from "./diagrams.js";
import { downloadPack } from "./pack.js";
import * as play from "./play.js";
import { CHARTS, chartsHTML, paintRoughTotals, mountMind } from "./charts.js";
import { paradeHTML, bindParade, bindMenuKeys } from "./fx.js";

const BADGE_KEY = "sip-universe-badges";

export const BADGES = [
  { id: "read", name: "First trace", detail: "Mark a lesson read." },
  { id: "quiz", name: "Eighty", detail: "Score at least 80% on a lesson quiz." },
  { id: "lab", name: "Bench", detail: "Pass a lesson lab check." },
  { id: "ports", name: "Port clerk", detail: "Score 6 or more on the ports game." },
  { id: "ports-perfect", name: "Clean matrix", detail: "A perfect ports round." },
  { id: "builder", name: "Ladderwright", detail: "Build a flow with at least four hops." },
  { id: "daily", name: "Today", detail: "Finish the daily challenge." },
  { id: "explorer", name: "Cartographer", detail: "Open five nodes on the flow map." },
  { id: "offline", name: "Pocket campus", detail: "Download the offline zip." },
  { id: "konami", name: "Branch cookie", detail: "The old joystick code. It only changes the mascot." },
];

function badgeState() {
  try { return JSON.parse(localStorage.getItem(BADGE_KEY) || "{}"); }
  catch { return {}; }
}

export function noteBadge(id) {
  const known = BADGES.find((item) => item.id === id);
  if (!known) return false;
  const state = badgeState();
  if (state[id]) return false;
  state[id] = new Date().toISOString();
  localStorage.setItem(BADGE_KEY, JSON.stringify(state));
  const toast = document.querySelector("#toast");
  if (toast) toast.textContent = `Badge: ${known.name}. ${known.detail}`;
  return true;
}

const POSES = [
  { id: "wave", line: "Follow the Via." },
  { id: "point", line: "The branch is the transaction." },
  { id: "think", line: "Port 0 means rejected." },
  { id: "cheer", line: "ACK the 200." },
];

function startMascot() {
  const mascot = document.querySelector("#mascot");
  const line = document.querySelector("#mascot-line");
  if (!mascot || !line) return;
  let index = 0;
  const tick = () => {
    if (document.documentElement.dataset.motion === "reduce") return;
    const pose = POSES[index % POSES.length];
    mascot.dataset.pose = pose.id;
    line.textContent = pose.line;
    index += 1;
  };
  tick();
  window.setInterval(tick, 7000);
}

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

function bindKonami() {
  const buffer = [];
  window.addEventListener("keydown", (event) => {
    const tag = event.target && event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    buffer.push(event.key.length === 1 ? event.key.toLowerCase() : event.key);
    if (buffer.length > KONAMI.length) buffer.shift();
    if (KONAMI.every((key, i) => buffer[i] === key)) {
      buffer.length = 0;
      noteBadge("konami");
      const mascot = document.querySelector("#mascot");
      if (mascot) mascot.dataset.pose = "cheer";
      const egg = document.querySelector("#egg");
      if (egg && !egg.open) egg.showModal();
    }
  });
}

function bindSwatches() {
  const paint = () => {
    const theme = getSettings().theme;
    document.querySelectorAll("[data-set-theme]").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.setTheme === theme ? "true" : "false");
    });
  };
  document.querySelectorAll("[data-set-theme]").forEach((button) => {
    button.addEventListener("click", () => saveSettings({ theme: button.dataset.setTheme }));
  });
  onSettings(paint);
  paint();
}

function bindProgressBar() {
  const bar = document.querySelector("#read-progress");
  if (!bar) return;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
    bar.style.width = `${pct}%`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function bindOffline(catalog) {
  const run = async () => {
    const status = document.querySelector("#pack-status");
    try {
      await downloadPack(catalog);
      noteBadge("offline");
    } catch (err) {
      if (status) status.textContent = err.message;
    }
  };
  document.querySelectorAll("[data-offline]").forEach((button) => {
    button.addEventListener("click", run);
  });
}

export function bindChrome(catalog) {
  startMascot();
  bindKonami();
  bindSwatches();
  bindProgressBar();
  bindOffline(catalog);
  bindMenuKeys(document);
}

function blockHTML(block) {
  if (block.type === "checklist") {
    return `<section class="panel"><h3>${esc(block.title)}</h3><ul class="check">${block.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></section>`;
  }
  if (block.type === "tree") {
    return `<section class="panel"><h3>${esc(block.title)}</h3>${block.nodes.map((node) => `<p><strong>${esc(node.when)}.</strong> ${esc(node.then)}</p>`).join("")}</section>`;
  }
  if (block.type === "note") {
    const tone = block.tone === "unverified" ? "Unverified. " : "";
    return `<p class="callout ${block.tone === "unverified" ? "is-unverified" : ""}">${tone}${esc(block.text)}</p>`;
  }
  if (block.h) {
    return `<section><h3>${esc(block.h)}</h3>${(block.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("")}${citeLinks(block.cites)}</section>`;
  }
  return "";
}

function guideIndex(data, ctx) {
  ctx.setTitle("Field guide");
  return `<p class="lede">${esc(data.summary)} Checked ${esc(data.checked)}.</p>
    <div class="card-grid">${data.sections.map((section) => `<a class="card" href="#/guide/${esc(section.id)}">
      <span class="kicker">${esc(section.kicker)}</span><h3>${esc(section.title)}</h3><p>${esc(section.summary)}</p></a>`).join("")}</div>`;
}

export function searchField(data, q) {
  const needle = q.toLowerCase();
  if (!needle || !data) return [];
  return data.sections.filter((section) => `${section.title} ${section.summary}`.toLowerCase().includes(needle))
    .map((section) => ({ href: `#/guide/${section.id}`, title: section.title, summary: section.summary }));
}

export async function tryFieldRoute(path, view, ctx) {
  if (path === "#/atlas") {
    ctx.setTitle("Diagram atlas");
    const animated = ATLAS.filter((item) => item.animated).length;
    view.innerHTML = `<p class="lede">${ATLAS.length} diagrams, ${animated} of them animated call, signal, or data flows. Reduced motion keeps the drawing and drops the traveling packet.</p>
      <div class="atlas-grid">${ATLAS.map(figureHTML).join("")}</div>`;
    return () => {};
  }
  if (path === "#/flows") {
    ctx.setTitle("Flows");
    const flows = ATLAS.filter((item) => item.animated);
    view.innerHTML = `<p class="lede">${flows.length} animated flows: INVITE, REGISTER, transfer, hold, forking, early media, NAT, TLS, and SRTP among them.</p>
      ${paradeHTML()}
      <div class="atlas-grid">${flows.map(figureHTML).join("")}</div>`;
    return bindParade(view);
  }
  if (path === "#/charts") {
    const ports = await loadJSON("data/ports.json");
    ctx.setTitle("Charts");
    view.innerHTML = `<p class="lede">${CHARTS.length} charts from the catalog, the ports table, and lesson tags. The topic map uses markmap.</p>
      ${paradeHTML()}
      ${chartsHTML(ctx.catalog, ports)}
      <h2>Topic map</h2>
      <div id="mind-host"></div>`;
    paintRoughTotals(view, ctx.catalog);
    const stopMind = mountMind(view.querySelector("#mind-host"));
    const stopParade = bindParade(view);
    return () => { stopParade(); stopMind(); };
  }
  if (path === "#/ports") {
    const data = await loadJSON("data/ports.json");
    ctx.setTitle("Ports and protocols");
    view.innerHTML = `<p class="lede">${esc(data.summary)} Read ${esc(data.checked)}.</p>
      <div class="scroll"><table><thead><tr><th scope="col">Name</th><th scope="col">Port</th><th scope="col">Transport</th><th scope="col">Why it is here</th><th scope="col">Source</th></tr></thead><tbody>
        ${data.rows.map((row) => `<tr><th scope="row">${esc(row.name)}</th><td>${esc(row.port)}</td><td>${esc(row.transport)}</td><td>${esc(row.purpose)} ${esc(row.note)}</td><td><a href="${esc(row.cite.url)}">${esc(row.cite.label)}</a></td></tr>`).join("")}
      </tbody></table></div>
      <h2>Firewall matrix</h2>
      <div class="scroll"><table><thead><tr><th scope="col">Flow</th><th scope="col">From</th><th scope="col">To</th><th scope="col">Transport</th><th scope="col">Ports</th><th scope="col">Source</th></tr></thead><tbody>
        ${data.matrix.map((row) => `<tr><th scope="row">${esc(row.flow)}</th><td>${esc(row.from)}</td><td>${esc(row.to)}</td><td>${esc(row.transport)}</td><td>${esc(row.ports)}</td><td>${esc(row.source)}</td></tr>`).join("")}
      </tbody></table></div>
      <p><a class="btn" href="#/play/ports">Play the ports game</a></p>`;
    return () => {};
  }
  if (path === "#/downloads") {
    const manifest = await loadJSON("downloads/manifest.json");
    ctx.setTitle("Cheat codes");
    view.innerHTML = `<p class="lede">One-page sheets and a printable flashcard deck, generated into this repo. Each file carries the campus footer.</p>
      <div class="card-grid">${manifest.items.map((item) => `<article class="card">
        <span class="kicker">${esc(item.topic)}</span>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.blurb)}</p>
        <p class="fine">
          ${item.html ? `<a href="${esc(item.html)}">HTML</a>` : ""}
          ${item.pdf ? ` · <a href="${esc(item.pdf)}">PDF</a>` : ""}
          ${item.png ? ` · <a href="${esc(item.png)}">PNG</a>` : ""}
          ${item.json ? ` · <a href="${esc(item.json)}">JSON</a>` : ""}
        </p>
      </article>`).join("")}</div>
      <p class="fine">The offline zip is the full campus, including these files. The status line is in the footer.</p>`;
    return () => {};
  }
  if (path === "#/badges") {
    ctx.setTitle("Badges");
    const state = badgeState();
    const earned = BADGES.filter((item) => state[item.id]).length;
    view.innerHTML = `<p class="lede">${earned} of ${BADGES.length} earned in this browser.</p>
      <div class="card-grid">${BADGES.map((item) => `<article class="card ${state[item.id] ? "is-earned" : ""}">
        <span class="kicker">${state[item.id] ? "Earned" : "Locked"}</span>
        <h3>${esc(item.name)}</h3><p>${esc(item.detail)}</p>
        ${state[item.id] ? `<p class="fine">${esc(state[item.id])}</p>` : ""}
      </article>`).join("")}</div>`;
    return () => {};
  }
  if (path === "#/progress") {
    ctx.setTitle("Progress");
    const raw = JSON.parse(localStorage.getItem("sip-universe-progress") || "{\"lessons\":{}}");
    const rows = Object.entries(raw.lessons || {});
    const read = rows.filter(([, row]) => row.read).length;
    const quizzed = rows.filter(([, row]) => row.quizN).length;
    view.innerHTML = `<p class="lede">${read} lessons marked read. ${quizzed} quizzes scored. ${ctx.catalog.stats.lessons} lessons in the catalog.</p>
      <div class="stat-row">
        <div class="stat"><b>${rows.length}</b> touched</div>
        <div class="stat"><b>${read}</b> marked read</div>
        <div class="stat"><b>${quizzed}</b> quizzes scored</div>
        <div class="stat"><b>${BADGES.filter((item) => badgeState()[item.id]).length}</b> badges</div>
      </div>
      <p><a href="#/tracks">Back to the tracks</a></p>`;
    return () => {};
  }
  if (path === "#/play" || path.startsWith("#/play/") || path === "#/explorer") {
    return play.route(path, view, { ...ctx, noteBadge });
  }
  if (path === "#/guide" || path === "#/roadmap" || path === "#/career") {
    const data = await loadJSON("data/fieldguide.json");
    if (path === "#/guide") {
      view.innerHTML = guideIndex(data, ctx);
      return () => {};
    }
    const id = path === "#/roadmap" ? "roadmap" : "career";
    return renderSection(data, id, view, ctx);
  }
  const match = path.match(/^#\/guide\/([\w-]+)$/);
  if (match) {
    const data = await loadJSON("data/fieldguide.json");
    return renderSection(data, match[1], view, ctx);
  }
  return null;
}

function renderSection(data, id, view, ctx) {
  const section = data.sections.find((item) => item.id === id);
  if (!section) return null;
  ctx.setTitle(section.title);
  const trackList = id === "roadmap" && ctx.catalog
    ? `<h2>Track order</h2><ol>${ctx.catalog.tracks.map((track) => `<li><a href="#/track/${esc(track.id)}">${esc(track.title)}</a></li>`).join("")}</ol>`
    : "";
  view.innerHTML = `<p class="crumbs"><a href="#/guide">Field guide</a> / ${esc(section.title)}</p>
    <p class="lede">${esc(section.summary)}</p>
    ${section.blocks.map(blockHTML).join("")}
    ${trackList}`;
  return () => {};
}
