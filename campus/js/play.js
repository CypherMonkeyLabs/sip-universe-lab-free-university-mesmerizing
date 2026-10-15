import { esc, citeLinks } from "./draw.js";
import { ladderSVG } from "./flow.js";
import { loadJSON } from "./store.js";

function cardSvg({ title, lines }) {
  const body = lines.map((line, i) => `<text x="48" y="${230 + i * 40}" fill="#e8f6ff" font-size="26" font-family="ui-sans-serif,system-ui,sans-serif">${esc(line)}</text>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#07111c"/>
  <rect x="28" y="28" width="1144" height="574" rx="28" fill="none" stroke="#3ddcff" stroke-width="3"/>
  <text x="48" y="96" fill="#ffb020" font-size="22" font-family="ui-sans-serif,system-ui,sans-serif">SIP Universe</text>
  <text x="48" y="148" fill="#ffffff" font-size="42" font-family="ui-sans-serif,system-ui,sans-serif">${esc(title)}</text>
  ${body}
  <text x="48" y="560" fill="#9fd8ea" font-size="22" font-family="ui-sans-serif,system-ui,sans-serif">https://cyphermonkeylabs.com</text>
</svg>`;
}

function download(filename, contents, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function shareResult(title, lines) {
  download("sip-universe-result.svg", cardSvg({ title, lines }), "image/svg+xml");
}

async function load(path) {
  return loadJSON(path);
}

export async function route(path, view, ctx) {
  if (path === "#/play") return hub(view, ctx);
  if (path === "#/play/ports") return portsGame(view, ctx);
  if (path === "#/play/builder") return builder(view, ctx);
  if (path === "#/play/daily") return daily(view, ctx);
  if (path === "#/explorer") return explorer(view, ctx);
  return null;
}

function hub(view, ctx) {
  ctx.setTitle("Practice");
  view.innerHTML = `<p class="lede">Short drills with the same facts as the lessons. Scores stay in this browser.</p>
    <div class="card-grid">
      <a class="card" href="#/play/ports"><span class="kicker">Game</span><h3>Ports mastery</h3><p>Eight questions from the checked port table.</p></a>
      <a class="card" href="#/play/builder"><span class="kicker">Sandbox</span><h3>Build a call flow</h3><p>Add parties and hops. The ladder is the same engine as the lessons.</p></a>
      <a class="card" href="#/explorer"><span class="kicker">Map</span><h3>Flow explorer</h3><p>Click a node. Read the protocol and the citation.</p></a>
      <a class="card" href="#/play/daily"><span class="kicker">Daily</span><h3>Daily challenge</h3><p>Three questions chosen from the date. Same set until tomorrow UTC.</p></a>
      <a class="card" href="#/badges"><span class="kicker">Badges</span><h3>Badges</h3><p>Earned only when you do the thing.</p></a>
    </div>`;
  return () => {};
}

function shuffle(list, seed) {
  const copy = [...list];
  let s = seed || 1;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function portsGame(view, ctx) {
  const data = await load("data/ports.json");
  const round = shuffle(data.quiz, Date.now() % 100000).slice(0, 8);
  let index = 0;
  let score = 0;
  ctx.setTitle("Ports mastery");
  const draw = () => {
    const item = round[index];
    if (!item) {
      const perfect = score === round.length;
      if (score >= 6) ctx.noteBadge("ports");
      if (perfect) ctx.noteBadge("ports-perfect");
      view.innerHTML = `<p class="lede">${score} of ${round.length}.</p>
        <div class="row-actions">
          <button type="button" class="primary" id="again">Play again</button>
          <button type="button" id="share-ports">Download result card</button>
          <a class="btn" href="#/ports">Open the table</a>
        </div>`;
      view.querySelector("#again").addEventListener("click", () => { location.hash = "#/play/ports"; });
      view.querySelector("#share-ports").addEventListener("click", () => {
        shareResult("Ports mastery", [`${score} of ${round.length}`, new Date().toISOString().slice(0, 10)]);
      });
      return;
    }
    view.innerHTML = `<p class="fine">Question ${index + 1} of ${round.length}. Score ${score}.</p>
      <form class="quiz" id="port-q"><p>${esc(item.q)}</p>
        ${item.choices.map((choice) => `<label class="choice"><input type="radio" name="p" value="${esc(choice)}"> <span>${esc(choice)}</span></label>`).join("")}
        <button type="submit" class="primary">Lock in</button>
        <p class="why" hidden></p>
      </form>`;
    view.querySelector("#port-q").addEventListener("submit", (event) => {
      event.preventDefault();
      const picked = view.querySelector('input[name="p"]:checked');
      const why = view.querySelector(".why");
      if (!picked) return;
      const ok = picked.value === item.answer;
      if (ok) score += 1;
      why.hidden = false;
      why.innerHTML = `${ok ? "Correct." : `Answer: ${esc(item.answer)}.`} ${esc(item.why)} ${citeLinks([item.cite])}`;
      view.querySelectorAll("input").forEach((input) => { input.disabled = true; });
      const next = document.createElement("button");
      next.type = "button";
      next.className = "primary";
      next.textContent = index === round.length - 1 ? "See score" : "Next";
      next.addEventListener("click", () => { index += 1; draw(); });
      why.after(next);
    });
  };
  draw();
  return () => {};
}

async function builder(view, ctx) {
  ctx.setTitle("Build a call flow");
  const flow = {
    title: "Your call",
    parties: ["Alice", "SBC", "Bob"],
    steps: [
      { from: 0, to: 1, label: "INVITE", kind: "req", note: "Offer leaves Alice.", message: "" },
      { from: 1, to: 2, label: "INVITE", kind: "req", note: "The B2BUA starts its own INVITE.", message: "" },
    ],
  };
  view.innerHTML = `<p class="lede">Add a party or a hop. Labels are methods and status codes you choose. Nothing is sent to a network.</p>
    <div class="tool-grid">
      <form id="hop-form" class="panel">
        <label class="stack">New party <input name="party" placeholder="Carrier"></label>
        <button type="button" id="add-party">Add party</button>
        <label class="stack">From <select name="from"></select></label>
        <label class="stack">To <select name="to"></select></label>
        <label class="stack">Label <input name="label" value="180"></label>
        <label class="stack">Kind
          <select name="kind"><option value="req">Request</option><option value="res">Response</option><option value="err">Error</option></select>
        </label>
        <button type="submit" class="primary">Add hop</button>
      </form>
      <div>
        <div id="built"></div>
        <div class="row-actions">
          <button type="button" id="share-flow">Download ladder card</button>
          <button type="button" id="clear-flow">Reset</button>
        </div>
      </div>
    </div>`;
  const form = view.querySelector("#hop-form");
  const host = view.querySelector("#built");
  const fill = () => {
    for (const name of ["from", "to"]) {
      const select = form.querySelector(`[name="${name}"]`);
      const current = select.value;
      select.innerHTML = flow.parties.map((party, i) => `<option value="${i}">${esc(party)}</option>`).join("");
      if (current) select.value = current;
    }
    host.innerHTML = `<div class="scroll">${ladderSVG(flow, flow.steps.length - 1)}</div>`;
  };
  view.querySelector("#add-party").addEventListener("click", () => {
    const name = form.party.value.trim();
    if (!name) return;
    flow.parties.push(name.slice(0, 24));
    form.party.value = "";
    fill();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const from = Number(form.from.value);
    const to = Number(form.to.value);
    if (from === to) return;
    flow.steps.push({
      from, to, label: form.label.value.trim().slice(0, 16) || "INVITE", kind: form.kind.value, note: "", message: "",
    });
    if (flow.steps.length >= 4) ctx.noteBadge("builder");
    fill();
  });
  view.querySelector("#share-flow").addEventListener("click", () => {
    const hops = flow.steps.map((step) => `${flow.parties[step.from]} → ${flow.parties[step.to]} ${step.label}`);
    shareResult("Call flow", hops.slice(0, 8));
  });
  view.querySelector("#clear-flow").addEventListener("click", () => { location.hash = "#/play/builder"; });
  fill();
  return () => {};
}

const EXPLORER = [
  { id: "phone", x: 40, y: 180, title: "Phone", copy: "A user agent. It sends INVITE and puts an offer in SDP if it is an early-offer phone.", cite: { label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261" } },
  { id: "sbc", x: 250, y: 80, title: "Enterprise SBC", copy: "A B2BUA. Two dialogs. It may anchor media or let RTP go direct.", cite: { label: "RFC 7092", url: "https://www.rfc-editor.org/rfc/rfc7092" } },
  { id: "cucm", x: 250, y: 280, title: "CUCM", copy: "Enterprise registrar and trunk peer. A SIP Profile here is an admin object, not a CUBE sip-profile.", cite: { label: "Cisco CUCM", url: "https://www.cisco.com/c/en/us/support/unified-communications/unified-communications-manager-callmanager/series.html" } },
  { id: "pstn", x: 500, y: 40, title: "PSTN carrier", copy: "Your SIP trunk. Identity headers and codecs are a contract with that carrier.", cite: { label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261" } },
  { id: "teams", x: 700, y: 40, title: "Teams", copy: "Direct Routing: certified SBC, TLS 5061 to the pstnhub names, SRTP media.", cite: { label: "Plan Direct Routing", url: "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan" } },
  { id: "webex", x: 700, y: 180, title: "Webex Calling", copy: "Local Gateway. 8934 for registration-based signaling, 5062 for certificate-based trunks, per the port reference.", cite: { label: "Port reference", url: "https://help.webex.com/en-us/article/b2exve" } },
  { id: "rec", x: 500, y: 200, title: "Recorder", copy: "SIPREC SRC to SRS. A second session. Metadata is RFC 7865.", cite: { label: "RFC 7866", url: "https://www.rfc-editor.org/rfc/rfc7866" } },
  { id: "e911", x: 500, y: 320, title: "Emergency", copy: "Service URN and location conveyance. Test with the provider’s test number. Not legal advice.", cite: { label: "RFC 6881", url: "https://www.rfc-editor.org/rfc/rfc6881" } },
  { id: "crm", x: 40, y: 40, title: "CRM", copy: "Screen pop on ANI or a case id. Dashed because it is not a SIP hop.", cite: { label: "RFC 3325", url: "https://www.rfc-editor.org/rfc/rfc3325" } },
];

const LINKS = [
  ["phone", "sbc"], ["phone", "cucm"], ["sbc", "pstn"], ["sbc", "teams"], ["sbc", "webex"], ["sbc", "rec"], ["sbc", "e911"], ["crm", "cucm"],
];

function explorer(view, ctx) {
  ctx.setTitle("Flow explorer");
  const seen = new Set();
  const nodes = EXPLORER.map((node) => `<g class="ex-node" data-id="${esc(node.id)}" tabindex="0" role="button">
      <rect x="${node.x}" y="${node.y}" width="150" height="64" rx="12"></rect>
      <text x="${node.x + 75}" y="${node.y + 38}">${esc(node.title)}</text>
    </g>`).join("");
  const edges = LINKS.map(([a, b]) => {
    const from = EXPLORER.find((node) => node.id === a);
    const to = EXPLORER.find((node) => node.id === b);
    return `<line x1="${from.x + 75}" y1="${from.y + 32}" x2="${to.x + 75}" y2="${to.y + 32}" class="ex-link ${a === "crm" ? "is-soft" : ""}"></line>`;
  }).join("");
  view.innerHTML = `<p class="lede">A teaching map. Click a node. Five different nodes earns the explorer badge.</p>
    <div class="tool-grid">
      <div class="scroll"><svg class="explorer" viewBox="0 0 880 420" role="img" aria-label="SIP edge map">${edges}${nodes}</svg></div>
      <article class="panel" id="ex-detail"><h2>Pick a node</h2><p>The citation opens the source.</p></article>
    </div>`;
  const detail = view.querySelector("#ex-detail");
  const show = (id) => {
    const node = EXPLORER.find((item) => item.id === id);
    if (!node) return;
    seen.add(id);
    if (seen.size >= 5) ctx.noteBadge("explorer");
    detail.innerHTML = `<h2>${esc(node.title)}</h2><p>${esc(node.copy)}</p>${citeLinks([node.cite])}`;
  };
  view.querySelectorAll(".ex-node").forEach((node) => {
    node.addEventListener("click", () => show(node.dataset.id));
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); show(node.dataset.id); }
    });
  });
  return () => {};
}

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function hash(value) {
  let h = 2166136261;
  for (const ch of value) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

async function daily(view, ctx) {
  const data = await load("data/daily.json");
  const key = dayKey();
  const start = hash(key) % data.items.length;
  const items = [0, 1, 2].map((offset) => data.items[(start + offset) % data.items.length]);
  const storeKey = "sip-universe-daily";
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storeKey) || "{}"); } catch { saved = {}; }
  ctx.setTitle("Daily challenge");
  if (saved.date === key && typeof saved.score === "number") {
    view.innerHTML = `<p class="lede">Today (${esc(key)} UTC) is already scored: ${saved.score} of ${saved.total}.</p>
      <button type="button" id="share-daily">Download result card</button>`;
    view.querySelector("#share-daily").addEventListener("click", () => shareResult("Daily challenge", [`${saved.score} of ${saved.total}`, key]));
    return () => {};
  }
  let index = 0;
  let score = 0;
  const draw = () => {
    const item = items[index];
    if (!item) {
      localStorage.setItem(storeKey, JSON.stringify({ date: key, score, total: items.length }));
      ctx.noteBadge("daily");
      view.innerHTML = `<p class="lede">${score} of ${items.length} on ${esc(key)}.</p>
        <button type="button" class="primary" id="share-daily">Download result card</button>`;
      view.querySelector("#share-daily").addEventListener("click", () => shareResult("Daily challenge", [`${score} of ${items.length}`, key]));
      return;
    }
    view.innerHTML = `<p class="fine">${esc(key)} UTC · question ${index + 1} of ${items.length}</p>
      <form class="quiz" id="daily-q"><p>${esc(item.q)}</p>
        ${item.choices.map((choice, i) => `<label class="choice"><input type="radio" name="d" value="${i}"> <span>${esc(choice)}</span></label>`).join("")}
        <button type="submit" class="primary">Answer</button><p class="why" hidden></p></form>`;
    view.querySelector("#daily-q").addEventListener("submit", (event) => {
      event.preventDefault();
      const picked = view.querySelector('input[name="d"]:checked');
      if (!picked) return;
      const ok = Number(picked.value) === item.answer;
      if (ok) score += 1;
      const why = view.querySelector(".why");
      why.hidden = false;
      why.innerHTML = `${ok ? "Correct." : `Answer: ${esc(item.choices[item.answer])}.`} ${esc(item.why)} ${citeLinks([item.cite])}`;
      const next = document.createElement("button");
      next.type = "button";
      next.textContent = "Next";
      next.className = "primary";
      next.addEventListener("click", () => { index += 1; draw(); });
      why.after(next);
    });
  };
  draw();
  return () => {};
}
