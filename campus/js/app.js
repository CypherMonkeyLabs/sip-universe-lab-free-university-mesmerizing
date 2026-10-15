import { esc, illustration, citeLinks } from "./draw.js";
import { mountFlow } from "./flow.js";
import {
  loadSettings, getSettings, saveSettings, applySettings, onSettings,
  playTone, narrate, stopNarration, fillVoiceSelect,
} from "./audio.js";
import { tryFieldRoute, bindChrome, noteBadge, searchField } from "./field.js";
import { loadJSON } from "./store.js";
import { mountSpotlight } from "./diagrams.js";
import * as tools from "./tools.js";
import { mountTopology } from "./topology.js";
import { paradeHTML, bindParade, animateStats, burst } from "./fx.js";
import { chartsHTML, paintRoughTotals, trackMinutesChart, bindChartTips, animateCharts } from "./charts.js";
import { mountHero } from "./hero.js";
import { iconHTML } from "./icons.js";
import { applyLang } from "./i18n.js";

const view = document.querySelector("#view");
const titleEl = document.querySelector("#view-title");
const announcer = document.querySelector("#announcer");
const rail = document.querySelector("#rail");
const bottom = document.querySelector("#bottom");
const pill = document.querySelector("#progress-pill");
const PROG = "sip-universe-progress";

const NAV = [
  { href: "#/", label: "Home", group: "Learn", mobile: "Home" },
  { href: "#/tracks", label: "Tracks", group: "Learn", mobile: "Tracks" },
  { href: "#/labs", label: "Labs", group: "Learn" },
  { href: "#/guide", label: "Field guide", group: "Learn" },
  { href: "#/boss", label: "Boss incidents", group: "Learn" },
  { href: "#/interview", label: "Interview", group: "Learn" },
  { href: "#/play", label: "Practice", group: "Learn" },
  { href: "#/tools/ladder", label: "Ladders", group: "Tools", mobile: "Tools" },
  { href: "#/tools/dissector", label: "Dissector", group: "Tools" },
  { href: "#/tools/sdp", label: "SDP negotiator", group: "Tools" },
  { href: "#/tools/sandbox", label: "Normalization", group: "Tools" },
  { href: "#/tools/capture", label: "Capture bench", group: "Tools" },
  { href: "#/play/builder", label: "Flow builder", group: "Tools" },
  { href: "#/explorer", label: "Flow explorer", group: "Tools" },
  { href: "#/topology", label: "3D topology", group: "Tools", mobile: "Map" },
  { href: "#/atlas", label: "Diagrams", group: "Field" },
  { href: "#/flows", label: "Flows", group: "Field" },
  { href: "#/charts", label: "Charts", group: "Field" },
  { href: "#/ports", label: "Ports", group: "Field" },
  { href: "#/glossary", label: "Glossary", group: "Field" },
  { href: "#/ecosystem", label: "Ecosystem", group: "Field" },
  { href: "#/certs", label: "Certifications", group: "Field" },
  { href: "#/career", label: "Career", group: "Field" },
  { href: "#/roadmap", label: "Roadmap", group: "Field" },
  { href: "#/downloads", label: "Cheat codes", group: "Field" },
  { href: "#/badges", label: "Badges", group: "Field" },
  { href: "#/faults", label: "Faults", group: "Field" },
];

let catalog = null;
let cleanup = () => {};
let routeGen = 0;

function progress() {
  try { return JSON.parse(localStorage.getItem(PROG) || "{\"lessons\":{}}"); }
  catch { return { lessons: {} }; }
}
function saveProgress(next) { localStorage.setItem(PROG, JSON.stringify(next)); updatePill(); }
function lessonKey(track, lesson) { return `${track}/${lesson}`; }
function mark(track, lesson, patch) {
  const data = progress();
  const key = lessonKey(track, lesson);
  data.lessons[key] = { ...(data.lessons[key] || {}), ...patch };
  saveProgress(data);
  if (patch.read) noteBadge("read");
  if (patch.quizN && patch.quiz / patch.quizN >= 0.8) noteBadge("quiz");
  if (patch.lab) noteBadge("lab");
}
function updatePill() {
  const data = progress();
  const done = Object.values(data.lessons).filter((row) => row.read || (row.quizN && row.quiz / row.quizN >= 0.8)).length;
  const total = catalog ? catalog.stats.lessons : 0;
  pill.textContent = total ? `${done}/${total} read` : `${done} read`;
}

function markPrime(path) {
  document.querySelectorAll(".prime a").forEach((link) => {
    const href = link.getAttribute("href");
    const on = path === href || (href !== "#/" && path.startsWith(href));
    if (on) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function parseHash() {
  const raw = location.hash || "#/";
  const q = raw.indexOf("?");
  const path = q === -1 ? raw : raw.slice(0, q);
  const params = new URLSearchParams(q === -1 ? "" : raw.slice(q + 1));
  return { path, params };
}

function setTitle(text) {
  titleEl.tabIndex = -1;
  titleEl.textContent = text;
  document.title = text === "SIP Universe" ? text : `${text} · SIP Universe`;
  announcer.textContent = text;
  titleEl.focus();
}

function paintNav(path) {
  const groups = ["Learn", "Tools", "Field"];
  rail.innerHTML = groups.map((group) => {
    const links = NAV.filter((item) => item.group === group).map((item) => {
      const current = path === item.href ? ' aria-current="page"' : "";
      return `<a href="${item.href}"${current}>${esc(item.label)}</a>`;
    }).join("");
    return `<h2>${group}</h2>${links}`;
  }).join("");
  markPrime(path);
  const mobile = [
    { href: "#/", label: "Home" },
    { href: "#/tracks", label: "Tracks" },
    { href: "#/play", label: "Play" },
    { href: "#/topology", label: "Map" },
  ];
  bottom.innerHTML = mobile.map((item) => {
    const current = path === item.href || (item.href === "#/play" && path.startsWith("#/play")) ? ' aria-current="page"' : "";
    return `<a href="${item.href}"${current}>${esc(item.label)}</a>`;
  }).join("") + `<button type="button" id="open-more">More</button>`;
  bottom.querySelector("#open-more").addEventListener("click", () => {
    const list = document.querySelector("#more-list");
    list.innerHTML = NAV.filter((item) => !["#/", "#/tracks", "#/topology"].includes(item.href) && item.href !== "#/tools/ladder")
      .map((item) => `<a href="${item.href}">${esc(item.label)}</a>`).join("")
      + `<button type="button" id="more-settings">Settings</button>`;
    list.querySelector("#more-settings").addEventListener("click", openSettings);
    document.querySelector("#more").showModal();
  });
}

function trackFile(id) {
  const track = catalog.tracks.find((item) => item.id === id);
  return track ? track.file : null;
}

function crumbs(parts) {
  return `<p class="crumbs">${parts.map((part, i) => i === parts.length - 1 ? esc(part[0]) : `<a href="${part[1]}">${esc(part[0])}</a> / `).join("")}</p>`;
}

function mountCheck(host, check, onPass) {
  if (!check) return;
  host.innerHTML += `<form class="quiz" data-check>
    <p>${esc(check.q)}</p>
    ${check.choices.map((choice, i) => `<label class="choice"><input type="radio" name="check" value="${i}"> <span>${esc(choice)}</span></label>`).join("")}
    <button type="submit" class="primary">Check</button>
    <p class="why" hidden></p>
  </form>`;
  host.querySelector("[data-check]").addEventListener("submit", (event) => {
    event.preventDefault();
    const picked = host.querySelector('input[name="check"]:checked');
    const why = host.querySelector(".why");
    if (!picked) { why.hidden = false; why.textContent = "Pick an answer first."; return; }
    const ok = Number(picked.value) === check.answer;
    playTone(ok ? "ok" : "bad");
    why.hidden = false;
    why.innerHTML = `${ok ? "Correct." : "Not quite."} ${esc(check.why || "")} ${check.cite ? `<a href="${esc(check.cite.url)}">${esc(check.cite.label)}</a>` : ""}`;
    if (ok && onPass) onPass();
  });
}

async function renderHome() {
  setTitle("SIP Universe");
  const stats = catalog.stats;
  view.innerHTML = `
    <div id="hero-host">
      <p class="hero-kicker">SIP · SDP · RTP</p>
      <h2>SIP Universe</h2>
      <p data-i18n="heroLead">Call path, ladders, and borders.</p>
      <div class="ticker" aria-hidden="true"><span>INVITE</span><span>180</span><span>200</span><span>ACK</span></div>
      <div class="stat-row">
        <div class="stat"><b data-count="${stats.tracks}">0</b> tracks</div>
        <div class="stat"><b data-count="${stats.lessons}">0</b> lessons</div>
        <div class="stat"><b data-count="${stats.quizzes}">0</b> quiz items</div>
        <div class="stat"><b data-count="${stats.cards}">0</b> flashcards</div>
        <div class="stat"><b data-count="${stats.labs}">0</b> labs</div>
        <div class="stat"><b data-count="${stats.glossary}">0</b> glossary terms</div>
      </div>
      <div class="row-actions">
        <a class="btn primary" href="#/track/foundations" data-i18n="start">Start at the protocol</a>
        <a class="btn" href="#/atlas" data-i18n="openAtlas">Open the diagrams</a>
        <button type="button" class="btn" id="play-architect" data-i18n="listen">Play the architect clip</button>
      </div>
    </div>
    <div class="home-after">
      ${paradeHTML()}
      <section class="architect" id="architect">
        <h2 data-i18n="audioTitle">Architect notes</h2>
        <p>Two short clips. Signal and Border walk the campus: how to view it, practise, and share it. Spoken with eSpeak NG 1.51. A low pad sits under the voices.</p>
        <audio id="architect-use" controls preload="none" src="audio/architect-use.mp3"></audio>
        <audio id="architect-share" controls preload="none" src="audio/architect-share.mp3"></audio>
        <p class="fine">Scripts: <a href="audio/scripts/architect-use.md">how to view</a> · <a href="audio/scripts/architect-share.md">how to practise and share</a>.</p>
        <p><a href="https://github.com/cipher0x9/sip-universe-lab-free-university-mesmerizing">Rate, comment, or help on the repository</a> · <a href="https://cyphermonkeylabs.com/#contact" rel="noopener noreferrer">Contact</a></p>
      </section>
      <h2>Signal, in motion</h2>
      <div id="home-atlas"></div>
      <h2>Charts from the catalog</h2>
      <div id="home-charts"></div>
      <h2>Tracks</h2>
      <div class="card-grid">${catalog.tracks.map(trackCard).join("")}</div>
      <h2>Benches</h2>
      <div class="card-grid">
        ${bench("Ladders", "Play, pause, step, and inspect a call.", "#/tools/ladder", "call-flows")}
        ${bench("Dissector", "Headers, compact forms, and structural warnings.", "#/tools/dissector", "sip-core")}
        ${bench("SDP negotiator", "Offer/answer codec, direction, and port 0.", "#/tools/sdp", "sdp")}
        ${bench("Normalization", "CUBE SIP profile and Acme header-rule subsets.", "#/tools/sandbox", "cisco")}
        ${bench("Capture bench", "Synthetic debug ccsip output, one message at a time.", "#/tools/capture", "troubleshoot")}
        ${bench("Flow builder", "Assemble your own ladder.", "#/play/builder", "routing")}
        ${bench("Flow explorer", "Click the edge and read the citation.", "#/explorer", "ecosystem")}
        ${bench("3D topology", "Enterprise SBC, CUCM, Teams, Webex, and CCaaS paths.", "#/topology", "sbc")}
      </div>
      <p class="fine">Example messages are synthetic. Addresses use the documentation ranges in <a href="https://www.rfc-editor.org/rfc/rfc5737">RFC 5737</a>. Phone numbers use 555. Start in Foundations if you can subnet and have not lived in RFC 3261.</p>
    </div>`;
  const stopHero = await mountHero(view.querySelector("#hero-host"));
  const ports = await loadJSON("data/ports.json");
  const charts = view.querySelector("#home-charts");
  if (charts) charts.innerHTML = chartsHTML(catalog, ports);
  paintRoughTotals(view, catalog);
  animateStats(view);
  animateCharts(view);
  mountSpotlight(view.querySelector("#home-atlas"));
  const stopParade = bindParade(view);
  const stopTips = bindChartTips(view);
  const playBtn = view.querySelector("#play-architect");
  const onPlay = () => {
    view.querySelector("#architect")?.scrollIntoView({ behavior: "smooth", block: "start" });
    const audio = view.querySelector("#architect-use");
    if (audio) audio.play().catch(() => {});
  };
  playBtn?.addEventListener("click", onPlay);
  return () => {
    stopHero();
    stopParade();
    stopTips();
    playBtn?.removeEventListener("click", onPlay);
  };
}

function trackCard(track) {
  const data = progress();
  const done = track.lessons.filter((lesson) => {
    const row = data.lessons[lessonKey(track.id, lesson.id)];
    return row && (row.read || (row.quizN && row.quiz / row.quizN >= 0.8));
  }).length;
  const pct = Math.round((done / track.lessons.length) * 100);
  const ring = (188.4 * pct / 100).toFixed(1);
  return `<a class="card" href="#/track/${esc(track.id)}">
    <div class="card-top">${iconHTML(track.id)}
      <svg class="ring" viewBox="0 0 72 72" aria-label="${pct} percent">
        <circle class="ring-track" cx="36" cy="36" r="30"></circle>
        <circle class="ring-val" cx="36" cy="36" r="30" stroke-dasharray="${ring} 188.4"></circle>
        <text x="36" y="41">${pct}</text>
      </svg>
    </div>
    <span class="kicker">${esc(track.level)} · ${track.lessons.length} lessons</span>
    <h3>${esc(track.title)}</h3>
    <p>${esc(track.summary)}</p>
    <span class="fine">${done} of ${track.lessons.length} in progress or done</span>
  </a>`;
}
function bench(title, copy, href, icon) {
  return `<a class="card" href="${href}">${iconHTML(icon || "foundations")}<span class="kicker">Bench</span><h3>${esc(title)}</h3><p>${esc(copy)}</p></a>`;
}

function renderTracks() {
  setTitle("Tracks");
  view.innerHTML = `<p class="lede">Sixteen tracks, from the first Via header to cloud PSTN interconnects. Open one. Lessons load on their own.</p>
    <div class="card-grid">${catalog.tracks.map(trackCard).join("")}</div>`;
  return () => {};
}

async function renderTrack(id) {
  const file = trackFile(id);
  if (!file) return notFound();
  const track = await loadJSON(file);
  setTitle(track.title);
  const minutes = track.lessons.reduce((sum, lesson) => sum + (lesson.minutes || 0), 0);
  view.innerHTML = `${crumbs([["Tracks", "#/tracks"], [track.title]])}
    ${iconHTML(track.id)}
    ${paradeHTML()}
    <p class="lede">${esc(track.summary)}</p>
    <div class="stat-row">
      <div class="stat"><b data-count="${track.lessons.length}">0</b> lessons</div>
      <div class="stat"><b data-count="${minutes}">0</b> minutes</div>
      <div class="stat"><b data-count="${track.order || 0}">0</b> order</div>
    </div>
    <h2>Minutes in this track</h2>
    ${trackMinutesChart(track)}
    <ol class="lesson-index">${track.lessons.map((lesson) => `<li><a href="#/lesson/${esc(track.id)}/${esc(lesson.id)}">${esc(lesson.title)}</a> <span class="fine">${lesson.minutes} min</span></li>`).join("")}</ol>`;
  animateStats(view);
  return bindParade(view);
}

async function renderLesson(trackId, lessonId) {
  const file = trackFile(trackId);
  if (!file) return notFound();
  const track = await loadJSON(file);
  const lesson = track.lessons.find((item) => item.id === lessonId);
  if (!lesson) return notFound();
  const index = track.lessons.findIndex((item) => item.id === lessonId);
  const prev = track.lessons[index - 1];
  const next = track.lessons[index + 1];
  setTitle(lesson.title);
  const toc = (lesson.sections || []).map((section, i) => `<a href="#sec-${i}">${esc(section.h)}</a>`).join("");
  view.innerHTML = `${crumbs([["Tracks", "#/tracks"], [track.title, `#/track/${track.id}`], [lesson.title]])}
    <div class="read-layout">
      <article class="read-pane">
        <p class="lede">${esc(lesson.summary)}</p>
        <div class="meta"><span class="chip">${esc(lesson.level || track.level)}</span><span class="chip">${lesson.minutes} min</span></div>
        ${lesson.objectives ? `<h2>You will be able to</h2><ul>${lesson.objectives.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : ""}
        ${illustration(lesson.illustration)}
        <h2>Read</h2>
        ${(lesson.sections || []).map((section, i) => `<section id="sec-${i}"><h3>${esc(section.h)}</h3>${(section.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("")}${citeLinks(section.cites)}</section>`).join("")}
        <h2 id="lesson-ladder">Ladder</h2>
        <p class="fine">Swipe sideways on a small screen. Inspect shows the synthetic message for the highlighted hop.</p>
        <div id="lesson-flow"></div>
        <h2 id="lesson-quiz-h">Check yourself</h2>
        <div id="lesson-quiz"></div>
        <h2>Flashcards</h2>
        <div id="lesson-cards"></div>
        <h2>Lab</h2>
        <div id="lesson-lab"></div>
        <h2>Fault and fix</h2>
        <div id="lesson-fault"></div>
        <div class="pager">
          ${prev ? `<a class="btn" href="#/lesson/${esc(track.id)}/${esc(prev.id)}">Previous</a>` : ""}
          ${next ? `<a class="btn" href="#/lesson/${esc(track.id)}/${esc(next.id)}">Next</a>` : ""}
          <button type="button" id="mark-read">Mark lesson read</button>
        </div>
      </article>
      <aside class="read-toc" aria-label="On this page">
        <h2>On this page</h2>
        ${toc}
        <a href="#lesson-ladder">Ladder</a>
        <a href="#lesson-quiz-h">Quiz</a>
      </aside>
    </div>`;
  view.querySelector("#mark-read").addEventListener("click", () => { mark(track.id, lesson.id, { read: true }); playTone("ok"); });
  const stopFlow = mountFlow(view.querySelector("#lesson-flow"), lesson.flow);
  mountQuiz(view.querySelector("#lesson-quiz"), lesson.quiz, (score, total) => mark(track.id, lesson.id, { quiz: score, quizN: total, read: score / total >= 0.8 }));
  mountCards(view.querySelector("#lesson-cards"), lesson.cards);
  const stopLab = await mountLab(view.querySelector("#lesson-lab"), lesson, () => mark(track.id, lesson.id, { lab: true }));
  mountFault(view.querySelector("#lesson-fault"), lesson.fault, () => mark(track.id, lesson.id, { fault: true }));
  narrate(`${lesson.title}. ${lesson.summary}`);
  return () => { stopFlow(); if (stopLab) stopLab(); stopNarration(); };
}

function mountQuiz(host, questions, onDone) {
  host.innerHTML = (questions || []).map((item, qi) => `
    <fieldset class="quiz"><legend>${esc(item.q)}</legend>
      ${item.choices.map((choice, i) => `<label class="choice"><input type="radio" name="q${qi}" value="${i}"> <span>${esc(choice)}</span></label>`).join("")}
      <p class="why" hidden></p>
    </fieldset>`).join("") + `<button type="button" class="primary" id="grade">Grade quiz</button><p id="grade-score" aria-live="polite"></p>`;
  host.querySelector("#grade").addEventListener("click", () => {
    let score = 0;
    questions.forEach((item, qi) => {
      const picked = host.querySelector(`input[name="q${qi}"]:checked`);
      const why = host.querySelectorAll(".why")[qi];
      const ok = picked && Number(picked.value) === item.answer;
      if (ok) score += 1;
      why.hidden = false;
      why.innerHTML = `${ok ? "Correct." : `Answer: ${esc(item.choices[item.answer])}.`} ${esc(item.why)} ${item.cite ? `<a href="${esc(item.cite.url)}">${esc(item.cite.label)}</a>` : ""}`;
      host.querySelectorAll(`input[name="q${qi}"]`).forEach((input) => {
        const label = input.closest(".choice");
        label.classList.toggle("is-right", Number(input.value) === item.answer);
        label.classList.toggle("is-wrong", picked && input === picked && !ok);
      });
    });
    playTone(score === questions.length ? "ok" : "bad");
    if (score === questions.length) burst();
    host.querySelector("#grade-score").textContent = `${score} of ${questions.length}`;
    onDone(score, questions.length);
  });
}

function mountCards(host, cards) {
  let index = 0;
  let flipped = false;
  const queue = [...(cards || [])];
  const draw = () => {
    const card = queue[index];
    if (!card) { host.innerHTML = `<p>No cards.</p>`; return; }
    host.innerHTML = `<div class="flash">
      <p class="fine">Card ${index + 1} of ${queue.length}</p>
      <div class="flash-face"><p>${esc(flipped ? card.back : card.front)}</p></div>
      <div class="row-actions">
        <button type="button" id="flip">Flip</button>
        <button type="button" id="next-card">Next</button>
      </div>
      ${flipped && card.cite ? `<p><a href="${esc(card.cite.url)}">${esc(card.cite.label)}</a></p>` : ""}
    </div>`;
    host.querySelector("#flip").addEventListener("click", () => { flipped = !flipped; playTone("click"); draw(); });
    host.querySelector("#next-card").addEventListener("click", () => { index = (index + 1) % queue.length; flipped = false; playTone("click"); draw(); });
  };
  draw();
}

function mountFault(host, fault, onPass) {
  if (!fault) { host.innerHTML = `<p>No fault in this lesson.</p>`; return; }
  host.innerHTML = `<article class="fault">
    <h3>${esc(fault.title)}</h3>
    <p>${esc(fault.symptom)}</p>
    <pre>${esc(fault.log)}</pre>
    <form>
      ${fault.choices.map((choice, i) => `<label class="choice"><input type="radio" name="fault" value="${i}"> <span>${esc(choice)}</span></label>`).join("")}
      <button type="submit" class="primary">Diagnose</button>
      <div class="why" hidden></div>
    </form>
  </article>`;
  host.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const picked = host.querySelector('input[name="fault"]:checked');
    const why = host.querySelector(".why");
    if (!picked) return;
    const ok = Number(picked.value) === fault.answer;
    playTone(ok ? "ok" : "bad");
    why.hidden = false;
    why.innerHTML = `<p>${ok ? "That matches the trace." : "Look again at the trace."} ${esc(fault.why || "")}</p>
      <p><strong>Cause.</strong> ${esc(fault.cause)}</p>
      <p><strong>Fix.</strong> ${esc(fault.fix)}</p>${citeLinks(fault.cites)}`;
    if (ok) onPass();
  });
}

async function mountLab(host, lesson, onPass) {
  const lab = lesson.lab;
  if (!lab) { host.innerHTML = `<p>No lab.</p>`; return () => {}; }
  host.innerHTML = `<article class="lab"><h3>${esc(lab.title)}</h3><p>${esc(lab.prompt || "")}</p>
    ${lab.steps ? `<ol>${lab.steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>` : ""}
    ${lab.config ? `<pre>${esc(lab.config)}</pre>` : ""}
    <div id="lab-tool"></div>
    <div id="lab-check"></div>
  </article>`;
  const tool = host.querySelector("#lab-tool");
  let stop = () => {};
  if (lab.kind === "ladder") stop = mountFlow(tool, lab.flow || lesson.flow);
  if (["dissect", "sdp", "sandbox", "capture"].includes(lab.kind)) {
    if (lab.kind === "dissect") tools.mountDissector(tool, lab.message || "");
    if (lab.kind === "sdp") tools.mountSdp(tool, lab.offer || "", lab.answer || "");
    if (lab.kind === "sandbox") tools.mountSandbox(tool, lab.rules || "", lab.message || "", lab.dialect || "cube");
    if (lab.kind === "capture") tools.mountCapture(tool, lab.message || "");
  }
  mountCheck(host.querySelector("#lab-check"), lab.check, onPass);
  return stop;
}

function notFound() {
  setTitle("Page not found");
  view.innerHTML = `<p>That path is not a track, lesson, or bench. <a href="#/">Return home</a> or open <a href="#/tracks">the tracks</a>.</p>`;
  return () => {};
}

async function renderSearch(params) {
  const q = (params.get("q") || "").trim();
  setTitle(q ? `Search: ${q}` : "Search");
  const needle = q.toLowerCase();
  const hits = [];
  if (needle) {
    for (const track of catalog.tracks) {
      for (const lesson of track.lessons) {
        const hay = `${lesson.title} ${lesson.summary} ${(lesson.tags || []).join(" ")} ${track.title}`.toLowerCase();
        if (hay.includes(needle)) hits.push({ track, lesson });
      }
    }
  }
  let guideHits = [];
  try {
    const guide = await loadJSON("data/fieldguide.json");
    guideHits = searchField(guide, q);
  } catch { guideHits = []; }
  const lessonWord = hits.length === 1 ? "lesson" : "lessons";
  const guideWord = guideHits.length === 1 ? "guide section" : "guide sections";
  view.innerHTML = `<p class="lede">${q ? `${hits.length} ${lessonWord} and ${guideHits.length} ${guideWord} match “${esc(q)}”.` : "Type a header, status code, product, or RFC number."}</p>
    ${guideHits.length ? `<h2>Field guide</h2><ul>${guideHits.map((hit) => `<li><a href="${esc(hit.href)}">${esc(hit.title)}</a><br><span class="fine">${esc(hit.summary)}</span></li>`).join("")}</ul>` : ""}
    <h2>Lessons</h2>
    <ul>${hits.map(({ track, lesson }) => `<li><a href="#/lesson/${esc(track.id)}/${esc(lesson.id)}">${esc(lesson.title)}</a> <span class="fine">${esc(track.title)}</span><br><span class="fine">${esc(lesson.summary)}</span></li>`).join("")}</ul>`;
  return () => {};
}

async function renderTool(name) {
  const samples = await loadJSON("data/samples.json");
  const map = {
    ladder: ["SIP ladders", "Step a synthetic call. Inspect prints the message for that hop."],
    dissector: ["SIP dissector", "Paste a request or response. Compact header names are expanded using RFC 3261 and the extensions called out in the lesson."],
    sdp: ["SDP offer/answer", "The negotiator follows the order and port rules in RFC 3264 and flags profile mismatches."],
    sandbox: ["Normalization sandbox", "A teaching subset of CUBE SIP profiles and Oracle header rules. It is not the vendor parser."],
    capture: ["Capture bench", "Paste synthetic debug ccsip messages output. Timestamp prefixes are stripped, then each SIP message is dissected."],
  };
  if (!map[name]) return notFound();
  setTitle(map[name][0]);
  view.innerHTML = `${crumbs([["Tools", "#/tools"], [map[name][0]]])}<p class="lede">${map[name][1]}</p><div id="tool-host"></div>`;
  const host = view.querySelector("#tool-host");
  if (name === "ladder") {
    const flows = samples.flows;
    host.innerHTML = `<label class="stack">Flow <select id="flow-pick">${flows.map((flow, i) => `<option value="${i}">${esc(flow.title)}</option>`).join("")}</select></label><div id="flow-host"></div>`;
    let stop = () => {};
    const draw = () => { stop(); stop = mountFlow(host.querySelector("#flow-host"), flows[Number(host.querySelector("#flow-pick").value)]); };
    host.querySelector("#flow-pick").addEventListener("change", draw);
    draw();
    return () => stop();
  }
  if (name === "dissector") tools.mountDissector(host, samples.messages.invite);
  if (name === "sdp") tools.mountSdp(host, samples.sdp.offer, samples.sdp.answer);
  if (name === "sandbox") tools.mountSandbox(host, samples.sandbox.rules, samples.sandbox.message, "cube");
  if (name === "capture") tools.mountCapture(host, samples.capture);
  return () => {};
}

function renderTools() {
  setTitle("Tools");
  view.innerHTML = `<p class="lede">The benches are the same engines embedded in the labs.</p><div class="card-grid">
    ${bench("Ladders", "Play, pause, step, inspect.", "#/tools/ladder")}
    ${bench("Dissector", "Start line, headers, warnings.", "#/tools/dissector")}
    ${bench("SDP negotiator", "Codecs, direction, port 0.", "#/tools/sdp")}
    ${bench("Normalization", "CUBE and Acme subsets.", "#/tools/sandbox")}
    ${bench("Capture bench", "debug ccsip text.", "#/tools/capture")}
    ${bench("3D topology", "Failure toggles.", "#/topology")}
  </div>`;
  return () => {};
}

async function renderTopology() {
  setTitle("SBC topology");
  view.innerHTML = `<p class="lede">A teaching map of an enterprise SBC between the PSTN, CUCM, and cloud voice. Failure toggles change the drawing. They do not touch a live network.</p><div id="topo-host"></div>`;
  return mountTopology(view.querySelector("#topo-host"));
}

async function renderGlossary() {
  const data = await loadJSON("data/glossary.json");
  setTitle("Glossary");
  view.innerHTML = `<p class="lede">${data.terms.length} terms. Definitions are short on purpose; the citation is the authority.</p>
    <label class="stack">Filter <input id="gloss-q" type="search"></label>
    <div id="gloss-list"></div>`;
  const list = view.querySelector("#gloss-list");
  const draw = () => {
    const q = view.querySelector("#gloss-q").value.toLowerCase();
    const terms = data.terms.filter((term) => `${term.term} ${term.def}`.toLowerCase().includes(q));
    list.innerHTML = terms.map((term) => `<section class="panel"><h2>${esc(term.term)}</h2><p>${esc(term.def)}</p>${citeLinks(term.cites)}</section>`).join("");
  };
  view.querySelector("#gloss-q").addEventListener("input", draw);
  draw();
  return () => {};
}

async function renderEcosystem() {
  const data = await loadJSON("data/ecosystem.json");
  setTitle("Ecosystem");
  view.innerHTML = `${iconHTML("ecosystem")}<p class="lede">${esc(data.summary)}</p>
    <h2>Neighboring systems</h2>
    <div class="card-grid">${data.sisters.map((item) => `<article class="card"><h3>${esc(item.name)}</h3><p>${esc(item.blurb)}</p>${citeLinks(item.cites)}</article>`).join("")}</div>
    <h2>Where SIP shows up in the UC stack</h2>
    ${data.bridges.map((item) => `<section class="panel"><h3>${esc(item.name)}</h3><p>${esc(item.blurb)}</p>${citeLinks(item.cites)}</section>`).join("")}
    ${illustration(data.map)}
    <h2>Timeline</h2>
    <div class="scroll"><table><thead><tr><th scope="col">RFC</th><th scope="col">Date</th><th scope="col">Title</th><th scope="col">Status note</th></tr></thead><tbody>
      ${data.timeline.map((row) => `<tr><td><a href="${esc(row.url)}">${esc(row.rfc)}</a></td><td>${esc(row.date || "see RFC")}</td><td>${esc(row.title)}</td><td>${esc(row.note || "")}</td></tr>`).join("")}
    </tbody></table></div>`;
  return () => {};
}

async function renderCerts() {
  const data = await loadJSON("data/certs.json");
  setTitle("Certifications and courses");
  view.innerHTML = `<p class="lede">${esc(data.summary)}</p>` + data.items.map((item) => `
    <article class="panel"><h2>${esc(item.name)}</h2><p><strong>${esc(item.status)}</strong></p><p>${esc(item.note)}</p>
    <p><a href="${esc(item.url)}">${esc(item.url)}</a></p></article>`).join("");
  return () => {};
}

async function renderInterview() {
  const data = await loadJSON("data/interview.json");
  setTitle("Interview drills");
  view.innerHTML = `<p class="lede">Answer out loud, then open the citation. These are drills, not a dump of a vendor’s exam.</p>` +
    data.items.map((item, i) => `<article class="panel"><h2>${i + 1}. ${esc(item.q)}</h2><p class="fine">${esc(item.level)}</p><button type="button" data-i="${i}">Show a cited answer</button><div class="why" hidden></div></article>`).join("");
  view.querySelectorAll("button[data-i]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = data.items[Number(button.dataset.i)];
      const why = button.parentElement.querySelector(".why");
      why.hidden = false;
      why.innerHTML = `<p>${esc(item.a)}</p>${citeLinks(item.cites)}`;
    });
  });
  return () => {};
}

async function renderBoss(id) {
  const data = await loadJSON("data/boss.json");
  if (!id) {
    setTitle("Boss incidents");
    view.innerHTML = `<p class="lede">Synthetic logs. The failure mode is real; the trace was written for the lab.</p><div class="card-grid">${data.incidents.map((item) => `<a class="card" href="#/boss/${esc(item.id)}"><span class="kicker">${item.steps.length} steps</span><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p></a>`).join("")}</div>`;
    return () => {};
  }
  const incident = data.incidents.find((item) => item.id === id);
  if (!incident) return notFound();
  setTitle(incident.title);
  let step = 0;
  const host = view;
  const draw = () => {
    const current = incident.steps[step];
    host.innerHTML = `${crumbs([["Boss incidents", "#/boss"], [incident.title]])}<p class="lede">${esc(incident.summary)}</p>
      <article class="fault"><h2>Step ${step + 1} of ${incident.steps.length}</h2><p>${esc(current.prompt)}</p><pre>${esc(current.log)}</pre>
      <form>${current.choices.map((choice, i) => `<label class="choice"><input type="radio" name="b" value="${i}"> <span>${esc(choice)}</span></label>`).join("")}
      <button type="submit" class="primary">Commit</button><div class="why" hidden></div></form></article>`;
    host.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      const picked = host.querySelector('input[name="b"]:checked');
      if (!picked) return;
      const ok = Number(picked.value) === current.answer;
      playTone(ok ? "ok" : "bad");
      const why = host.querySelector(".why");
      why.hidden = false;
      why.innerHTML = `<p>${esc(current.why)}</p>${citeLinks(current.cites)}
        ${ok && step < incident.steps.length - 1 ? `<button type="button" id="next-step" class="primary">Next evidence</button>` : ""}
        ${ok && step === incident.steps.length - 1 ? `<p class="ok-line">Incident closed. ${esc(incident.epilogue || "")}</p>` : ""}`;
      const next = why.querySelector("#next-step");
      if (next) next.addEventListener("click", () => { step += 1; draw(); });
    });
  };
  draw();
  return () => {};
}

async function renderFaults() {
  setTitle("Fault index");
  const blocks = [];
  for (const track of catalog.tracks) {
    const full = await loadJSON(track.file);
    for (const lesson of full.lessons) {
      if (!lesson.fault) continue;
      blocks.push(`<article class="panel"><h2>${esc(lesson.fault.title)}</h2><p>${esc(lesson.fault.symptom)}</p><p><a href="#/lesson/${esc(track.id)}/${esc(lesson.id)}">Open in ${esc(lesson.title)}</a></p></article>`);
    }
  }
  view.innerHTML = `<p class="lede">${blocks.length} faults. Each one lives inside its lesson with the log and the fix.</p>${blocks.join("")}`;
  return () => {};
}

async function renderLabs() {
  const data = await loadJSON("data/labs.json");
  setTitle("Labs");
  view.innerHTML = `<p class="lede">Featured benches, plus a lab inside every lesson. ${catalog.stats.labs} lesson labs are in the tracks.</p>
    <div class="card-grid">${data.labs.map((lab) => `<a class="card" href="${esc(lab.href)}"><span class="kicker">${esc(lab.kind)}</span><h3>${esc(lab.title)}</h3><p>${esc(lab.prompt)}</p></a>`).join("")}</div>`;
  return () => {};
}

async function render() {
  const gen = ++routeGen;
  cleanup();
  cleanup = () => {};
  stopNarration();
  const { path, params } = parseHash();
  document.body.classList.toggle("is-home", path === "#/" || path === "");
  paintNav(path);
  view.setAttribute("aria-busy", "true");
  let stop = () => {};
  try {
    const extra = await tryFieldRoute(path, view, { setTitle, catalog });
    if (extra) stop = extra;
    else if (path === "#/" || path === "") stop = await renderHome();
    else if (path === "#/tracks") stop = await renderTracks();
    else if (path === "#/labs") stop = await renderLabs();
    else if (path === "#/tools") stop = await renderTools();
    else if (path === "#/topology") stop = await renderTopology();
    else if (path === "#/glossary") stop = await renderGlossary();
    else if (path === "#/ecosystem") stop = await renderEcosystem();
    else if (path === "#/certs") stop = await renderCerts();
    else if (path === "#/interview") stop = await renderInterview();
    else if (path === "#/faults") stop = await renderFaults();
    else if (path === "#/search") stop = await renderSearch(params);
    else if (path === "#/boss") stop = await renderBoss();
    else {
      let match = path.match(/^#\/track\/([\w-]+)\/?$/);
      if (match) stop = await renderTrack(match[1]);
      else if ((match = path.match(/^#\/lesson\/([\w-]+)\/([\w-]+)\/?$/))) stop = await renderLesson(match[1], match[2]);
      else if ((match = path.match(/^#\/tools\/([\w-]+)\/?$/))) stop = await renderTool(match[1]);
      else if ((match = path.match(/^#\/boss\/([\w-]+)\/?$/))) stop = await renderBoss(match[1]);
      else if (path === "#/track" || path === "#/lesson" || path === "#/tools/") location.hash = path.startsWith("#/tools") ? "#/tools" : "#/tracks";
      else stop = notFound();
    }
  } catch (err) {
    setTitle("Could not load this view");
    view.innerHTML = `<p>The file did not load. If you are offline, open a track you visited once before.</p><p class="fine">${esc(err.message)}</p><button type="button" id="retry" class="primary">Retry</button>`;
    view.querySelector("#retry").addEventListener("click", () => render());
    stop = () => {};
  }
  if (gen !== routeGen) { if (typeof stop === "function") stop(); return; }
  cleanup = typeof stop === "function" ? stop : () => {};
  view.removeAttribute("aria-busy");
  titleEl.setAttribute("tabindex", "-1");
  applyLang(getSettings().lang || document.documentElement.lang || "en");
}

function openSettings() {
  const dialog = document.querySelector("#settings");
  const settings = getSettings();
  dialog.querySelectorAll('input[name="theme"]').forEach((input) => { input.checked = input.value === settings.theme; });
  dialog.querySelectorAll('input[name="font"]').forEach((input) => { input.checked = input.value === settings.font; });
  dialog.querySelector('[name="sfx"]').checked = settings.sfx;
  dialog.querySelector('[name="narration"]').checked = settings.narration;
  dialog.querySelector('[name="motion"]').checked = settings.motion === "reduce";
  dialog.querySelector('[name="rate"]').value = settings.rate;
  dialog.querySelector("#rate-val").textContent = settings.rate;
  fillVoiceSelect(dialog.querySelector("#voice"));
  dialog.showModal();
}

function bindSettings() {
  const form = document.querySelector("#settings-form");
  const read = () => saveSettings({
    theme: form.querySelector('input[name="theme"]:checked').value,
    font: form.querySelector('input[name="font"]:checked').value,
    sfx: form.querySelector('[name="sfx"]').checked,
    narration: form.querySelector('[name="narration"]').checked,
    voiceURI: form.querySelector("#voice").value,
    rate: Number(form.querySelector("#rate").value),
    motion: form.querySelector('[name="motion"]').checked ? "reduce" : "full",
  });
  form.addEventListener("change", read);
  form.querySelector("#rate").addEventListener("input", () => {
    form.querySelector("#rate-val").textContent = form.querySelector("#rate").value;
    read();
  });
  document.querySelector("#open-settings").addEventListener("click", openSettings);
}

async function boot() {
  loadSettings();
  applySettings();
  bindSettings();
  onSettings(() => { if ((location.hash || "#/") === "#/" || location.hash === "#/topology") render(); });
  document.querySelector("#search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    location.hash = `#/search?q=${encodeURIComponent(document.querySelector("#q").value)}`;
  });
  document.querySelector("#more").addEventListener("click", (event) => {
    if (event.target.tagName === "A") document.querySelector("#more").close();
  });
  try {
    catalog = await loadJSON("data/catalog.json");
  } catch (err) {
    setTitle("SIP Universe");
    view.innerHTML = `<p>The catalog did not load. On disk, embedded-data.js has to load before this script. Over HTTP, data/catalog.json has to answer.</p><p class="fine">${esc(err.message)}</p>`;
    return;
  }
  updatePill();
  bindChrome(catalog);
  window.addEventListener("hashchange", render);
  if (!location.hash) location.hash = "#/";
  else render();
  window.setTimeout(() => {
    if (location.protocol === "file:") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").then(() => {
        window.setTimeout(() => {
          catalog.tracks.forEach((track) => { fetch(track.file).catch(() => {}); });
          ["data/glossary.json", "data/boss.json", "data/interview.json", "data/ecosystem.json", "data/certs.json", "data/labs.json", "data/samples.json", "data/ports.json", "data/fieldguide.json", "data/daily.json", "downloads/manifest.json"].forEach((path) => {
            fetch(path).catch(() => {});
          });
        }, 8000);
      }).catch(() => {});
    }
  }, 4000);
}

boot();
