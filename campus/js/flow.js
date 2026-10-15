import { esc } from "./draw.js";
import { playTone, narrate, prefersReduced } from "./audio.js";

function paint(message) {
  return String(message || "").split("\n").map((line, index) => {
    if (index === 0) return `<span class="sip-start">${esc(line)}</span>`;
    const colon = line.indexOf(":");
    if (colon > 0 && colon < 32 && !line.startsWith(" ")) {
      return `<span class="sip-h">${esc(line.slice(0, colon))}</span>:${esc(line.slice(colon + 1))}`;
    }
    return esc(line);
  }).join("\n");
}

export function ladderSVG(flow, active) {
  const parties = flow.parties || [];
  const steps = flow.steps || [];
  const width = Math.max(640, parties.length * 180);
  const row = 64;
  const top = 56;
  const height = top + Math.max(1, steps.length) * row + 28;
  const col = width / parties.length;
  const heads = parties.map((name, i) => {
    const x = col * i + col / 2;
    return `<text x="${x}" y="28" text-anchor="middle" class="party">${esc(name)}</text>
      <line x1="${x}" y1="40" x2="${x}" y2="${height - 16}" class="life"></line>`;
  }).join("");
  const arrows = steps.map((step, i) => {
    const x1 = col * step.from + col / 2;
    const x2 = col * step.to + col / 2;
    const y = top + i * row + 28;
    const on = i === active ? "is-on" : i < active ? "is-done" : "";
    const mid = (x1 + x2) / 2;
    return `<g class="hop ${on} kind-${esc(step.kind || "req")}">
      <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" class="hop-line"></line>
      <polygon points="${x2},${y} ${x2 - Math.sign(x2 - x1) * 10},${y - 5} ${x2 - Math.sign(x2 - x1) * 10},${y + 5}" class="arrow-head"></polygon>
      <text x="${mid}" y="${y - 8}" text-anchor="middle" class="hop-label">${esc(step.label)}</text>
    </g>`;
  }).join("");
  return `<svg class="ladder" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(flow.title || "SIP ladder")}">
    <rect width="${width}" height="${height}" class="ladder-bg"></rect>
    ${heads}${arrows}
  </svg>`;
}

export function mountFlow(host, flow, options = {}) {
  if (!flow || !flow.steps || !flow.steps.length) {
    host.innerHTML = `<p class="muted">This lesson has no ladder.</p>`;
    return () => {};
  }
  let index = 0;
  let timer = null;
  let open = false;
  host.innerHTML = `
    <div class="flow">
      <div class="flow-bar">
        <button type="button" data-act="play">Play</button>
        <button type="button" data-act="pause">Pause</button>
        <button type="button" data-act="step">Step</button>
        <button type="button" data-act="inspect" aria-expanded="false">Inspect</button>
        <span class="flow-count" aria-live="polite"></span>
      </div>
      <div class="scroll ladder-scroll"></div>
      <p class="flow-note" aria-live="polite"></p>
      <pre class="sip-view" hidden></pre>
    </div>`;
  const count = host.querySelector(".flow-count");
  const note = host.querySelector(".flow-note");
  const view = host.querySelector(".sip-view");
  const scroll = host.querySelector(".ladder-scroll");
  const inspectBtn = host.querySelector('[data-act="inspect"]');

  function draw() {
    const step = flow.steps[index];
    scroll.innerHTML = ladderSVG(flow, index);
    count.textContent = `Step ${index + 1} of ${flow.steps.length}`;
    note.textContent = step.note || "";
    view.innerHTML = paint(step.message || "");
    view.hidden = !open;
    inspectBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (options.onStep) options.onStep(step, index);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function play() {
    stop();
    if (prefersReduced()) return;
    timer = setInterval(() => {
      if (index >= flow.steps.length - 1) { stop(); return; }
      index += 1;
      playTone("step");
      draw();
      narrate(flow.steps[index].note || flow.steps[index].label);
    }, 1100);
  }

  host.querySelector('[data-act="play"]').addEventListener("click", () => {
    playTone("click");
    if (index >= flow.steps.length - 1) index = 0;
    draw();
    play();
  });
  host.querySelector('[data-act="pause"]').addEventListener("click", () => { playTone("click"); stop(); });
  host.querySelector('[data-act="step"]').addEventListener("click", () => {
    stop();
    index = Math.min(flow.steps.length - 1, index + 1);
    playTone("step");
    draw();
    narrate(flow.steps[index].note || "");
  });
  inspectBtn.addEventListener("click", () => {
    open = !open;
    playTone("click");
    draw();
  });
  draw();
  return stop;
}
