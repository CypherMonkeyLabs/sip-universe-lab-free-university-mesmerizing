import { esc } from "./draw.js";
import { loadJSON } from "./store.js";

let book = null;
let endpoint = "";
let token = 0;
let generation = 0;
let tour = null;
let tourStep = 0;
let quizIndex = -1;

function reduced() {
  const motion = document.documentElement.dataset.motion;
  if (motion === "reduce") return true;
  if (motion === "full") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function norm(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9.+# ]+/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(value) {
  return norm(value).split(" ").filter((part) => part.length > 1);
}

function dice(left, right) {
  const a = new Set(tokens(left));
  const b = new Set(tokens(right));
  if (!a.size || !b.size) return 0;
  let shared = 0;
  a.forEach((part) => { if (b.has(part)) shared += 1; });
  return (2 * shared) / (a.size + b.size);
}

function scoreText(query, text) {
  const q = norm(query);
  const hay = norm(text);
  if (!q || !hay) return 0;
  if (hay.includes(q) || q.includes(hay)) return 1;
  return dice(q, hay);
}

function bestEntry(query) {
  let best = null;
  let score = 0;
  for (const entry of book.entries) {
    const blob = [entry.text, ...(entry.prompts || [])].join(" ");
    const next = scoreText(query, blob);
    if (next > score) {
      score = next;
      best = entry;
    }
  }
  return score >= 0.34 ? best : null;
}

function bestTour(query) {
  let best = null;
  let score = 0;
  for (const item of book.tours) {
    const blob = [item.title, ...(item.prompts || [])].join(" ");
    const next = scoreText(query, blob);
    if (next > score) {
      score = next;
      best = item;
    }
  }
  return score >= 0.45 ? best : null;
}

function wait(ms) {
  return new Promise((resolve) => { window.setTimeout(resolve, ms); });
}

function citeHTML(cite) {
  if (!cite) return "";
  return ` <a href="${esc(cite.url)}">${esc(cite.label)}</a>`;
}

function logEl() {
  return document.querySelector("#guide-log");
}

function chipsEl() {
  return document.querySelector("#guide-chips");
}

function setChips(labels) {
  const host = chipsEl();
  if (!host) return;
  const list = labels && labels.length ? labels : book.chips;
  host.innerHTML = list.map((label) => `<button type="button" data-guide-chip>${esc(label)}</button>`).join("");
}

async function bubble(kind, html, plain) {
  const host = logEl();
  if (!host) return;
  const mine = ++token;
  const node = document.createElement("div");
  node.className = `guide-bubble is-${kind}`;
  host.appendChild(node);
  host.scrollTop = host.scrollHeight;
  if (kind !== "bot" || reduced()) {
    node.innerHTML = html;
    return;
  }
  node.classList.add("is-typing");
  node.textContent = "";
  const dots = document.createElement("span");
  dots.className = "guide-dots";
  dots.textContent = "···";
  node.appendChild(dots);
  await wait(280);
  if (mine !== token) return;
  node.classList.remove("is-typing");
  const span = document.createElement("span");
  node.replaceChildren(span);
  for (let i = 0; i < plain.length; i += 1) {
    if (mine !== token) return;
    span.textContent += plain[i];
    if (i % 3 === 0) await wait(12);
  }
  node.innerHTML = html;
  host.scrollTop = host.scrollHeight;
}

function sayEntry(entry, lead) {
  const plain = `${lead || ""}${entry.text}`;
  const html = `${lead ? `<p>${esc(lead)}</p>` : ""}<p>${esc(entry.text)}${citeHTML(entry.cite)}</p><p><a href="${esc(entry.href)}">Open the page</a></p>`;
  return bubble("bot", html, plain);
}

async function sayFallback(extra, mine) {
  const text = extra ? `${extra} ${book.fallback}` : book.fallback;
  await bubble("bot", `<p>${esc(text)}</p>`, text);
  if (mine !== generation) return;
  setChips(book.chips);
}

async function askEndpoint(question) {
  if (!endpoint) return null;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) return { miss: "The guide endpoint did not answer." };
  const body = await res.json();
  const id = body && typeof body.id === "string" ? body.id : "";
  const entry = book.entries.find((item) => item.id === id);
  if (!entry) return { miss: "The guide endpoint did not name a page in this campus. I did not use any other text it sent." };
  return { entry };
}

export function configureGuide(options) {
  const next = options && typeof options.endpoint === "string" ? options.endpoint.trim() : "";
  endpoint = next;
  return endpoint;
}

function startTour(item, mine) {
  tour = item;
  tourStep = 0;
  quizIndex = -1;
  return showTourStep(mine);
}

async function showTourStep(mine) {
  const step = tour.steps[tourStep];
  if (location.hash !== step.href) location.hash = step.href;
  const plain = `${tour.title}, step ${tourStep + 1} of ${tour.steps.length}. ${step.text}`;
  const html = `<p><strong>${esc(tour.title)}</strong> · ${tourStep + 1} of ${tour.steps.length}</p><p>${esc(step.text)}${citeHTML(step.cite)}</p>`;
  await bubble("bot", html, plain);
  if (mine !== generation) return;
  const more = tourStep < tour.steps.length - 1;
  setChips(more ? ["Next step", "Stop the tour"] : ["Quiz me", "Cheat codes"]);
  if (!more) tour = null;
}

function startQuiz(mine) {
  tour = null;
  quizIndex = 0;
  return showQuiz(mine);
}

async function showQuiz(mine) {
  const item = book.quizzes[quizIndex];
  const choices = item.choices.map((choice, index) => `<button type="button" data-guide-answer="${index}">${esc(choice)}</button>`).join("");
  await bubble("bot", `<p>${esc(item.q)}</p><div class="guide-choices">${choices}</div>`, item.q);
  if (mine !== generation) return;
  setChips(["Stop the quiz"]);
}

async function grade(index, mine) {
  const item = book.quizzes[quizIndex];
  const ok = index === item.answer;
  const plain = `${ok ? "Correct." : "Not quite."} ${item.why}`;
  await bubble("bot", `<p>${ok ? "Correct." : "Not quite."} ${esc(item.why)}${citeHTML(item.cite)}</p>`, plain);
  if (mine !== generation) return;
  quizIndex += 1;
  if (quizIndex < book.quizzes.length) {
    setChips(["Next question", "Stop the quiz"]);
  } else {
    quizIndex = -1;
    await bubble("bot", "<p>That is the end of this quiz. The items are the same facts as the cheat sheets.</p>", "That is the end of this quiz. The items are the same facts as the cheat sheets.");
    if (mine !== generation) return;
    setChips(book.chips);
  }
}

async function respond(question) {
  const trimmed = question.trim();
  if (!trimmed) return;
  const mine = ++generation;
  await bubble("user", `<p>${esc(trimmed)}</p>`, trimmed);
  if (mine !== generation) return;
  if (/^next step$/i.test(trimmed) && tour) {
    tourStep += 1;
    await showTourStep(mine);
    return;
  }
  if (/^stop the tour$/i.test(trimmed)) {
    tour = null;
    await bubble("bot", "<p>Tour stopped. The pages you already opened are unchanged.</p>", "Tour stopped. The pages you already opened are unchanged.");
    if (mine !== generation) return;
    setChips(book.chips);
    return;
  }
  if (/^next question$/i.test(trimmed) && quizIndex >= 0) {
    await showQuiz(mine);
    return;
  }
  if (/^stop the quiz$/i.test(trimmed)) {
    quizIndex = -1;
    await bubble("bot", "<p>Quiz stopped.</p>", "Quiz stopped.");
    if (mine !== generation) return;
    setChips(book.chips);
    return;
  }
  if (/quiz me|start a quiz|another quiz/i.test(trimmed)) {
    await startQuiz(mine);
    return;
  }
  const tourHit = bestTour(trimmed);
  if (tourHit) {
    await startTour(tourHit, mine);
    return;
  }
  const entry = bestEntry(trimmed);
  if (entry) {
    await sayEntry(entry);
    if (mine !== generation) return;
    setChips(book.chips);
    return;
  }
  try {
    const remote = await askEndpoint(trimmed);
    if (mine !== generation) return;
    if (remote && remote.entry) {
      await sayEntry(remote.entry, "Named by the configured guide endpoint. The sentence is still from this campus. ");
      if (mine !== generation) return;
      setChips(book.chips);
      return;
    }
    if (remote && remote.miss) {
      await sayFallback(remote.miss, mine);
      return;
    }
  } catch {
    await sayFallback("The guide endpoint could not be reached.", mine);
    return;
  }
  await sayFallback("", mine);
}

export async function mountGuide() {
  const root = document.querySelector("#guide");
  const panel = document.querySelector("#guide-panel");
  const open = document.querySelector("#guide-open");
  const form = document.querySelector("#guide-form");
  if (!root || !panel || !open || !form || root.dataset.bound) return;
  root.dataset.bound = "1";
  globalThis.SIP_GUIDE = {
    configure: configureGuide,
    get endpoint() { return endpoint; },
  };
  const setOpen = (on) => {
    panel.hidden = !on;
    open.setAttribute("aria-expanded", on ? "true" : "false");
    if (on) document.querySelector("#guide-q")?.focus();
  };
  open.addEventListener("click", () => setOpen(panel.hidden));
  document.querySelector("#guide-close")?.addEventListener("click", () => setOpen(false));
  document.querySelector("#quick-guide")?.addEventListener("click", () => setOpen(true));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#guide-q");
    const value = input.value;
    input.value = "";
    respond(value);
  });
  chipsEl()?.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-guide-chip]");
    if (!chip) return;
    respond(chip.textContent || "");
  });
  logEl()?.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-guide-answer]");
    const host = logEl();
    if (!choice || quizIndex < 0 || !host || choice.closest(".guide-bubble") !== host.lastElementChild) return;
    choice.closest(".guide-choices")?.querySelectorAll("button").forEach((button) => { button.disabled = true; });
    grade(Number(choice.dataset.guideAnswer), generation);
  });
  try {
    book = await loadJSON("data/guidebot.json");
  } catch {
    book = null;
  }
  if (!book) {
    await bubble("bot", "<p>The guide file did not load. I will not guess.</p>", "The guide file did not load. I will not guess.");
    return;
  }
  await bubble("bot", `<p>${esc(book.intro)}</p>`, book.intro);
  setChips(book.chips);
}
