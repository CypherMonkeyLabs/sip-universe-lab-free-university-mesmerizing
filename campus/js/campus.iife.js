(() => {
  // campus/js/draw.js
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }
  function citeLinks(cites) {
    if (!cites || !cites.length) return "";
    return `<ul class="cites">${cites.map((c) => `<li><a href="${esc(c.url)}" rel="noopener noreferrer">${esc(c.label)}</a></li>`).join("")}</ul>`;
  }
  var figSeq = 0;
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
  function illustration(spec) {
    if (!spec) return "";
    if (spec.type === "layers") {
      const rows = spec.layers || [];
      const inner2 = rows.map((layer, i) => {
        const y = 28 + i * 58;
        return `<rect x="36" y="${y}" width="688" height="46" rx="10" class="layer layer-${i % 4}"></rect>
        <text x="52" y="${y + 29}" class="layer-name">${esc(layer.name)}</text>
        <text x="230" y="${y + 29}" class="layer-detail">${esc(layer.detail)}</text>`;
      }).join("");
      return svgFrame(spec.title, spec.caption, inner2, 760, Math.max(120, 40 + rows.length * 58));
    }
    if (spec.type === "states") {
      const nodes2 = spec.nodes || [];
      const inner2 = nodes2.map((node, i) => {
        const x = 40 + i * 160;
        const next = nodes2[i + 1];
        const arrow2 = next ? `<line x1="${x + 108}" y1="92" x2="${x + 150}" y2="92" class="edge"></line>` : "";
        return `${arrow2}<rect x="${x}" y="62" width="110" height="60" rx="12" class="state"></rect>
        <text x="${x + 55}" y="97" text-anchor="middle" class="state-label">${esc(node)}</text>`;
      }).join("");
      return svgFrame(spec.title, spec.caption, inner2, Math.max(760, 80 + nodes2.length * 160), 180);
    }
    if (spec.type === "table") {
      const head = (spec.columns || []).map((c) => `<th scope="col">${esc(c)}</th>`).join("");
      const body = (spec.rows || []).map((row2) => `<tr>${row2.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("");
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
        <text x="${(a.x + b.x) / 2 * 7}" y="${(a.y + b.y) / 2 * 2.2 - 8}" text-anchor="middle" class="edge-label">${esc(edge.label || "")}</text>`;
      }),
      ...nodes.map((node) => `<g>
      <rect x="${node.x * 7 - 54}" y="${node.y * 2.2 - 18}" width="108" height="36" rx="10" class="node"></rect>
      <text x="${node.x * 7}" y="${node.y * 2.2 + 5}" text-anchor="middle" class="node-label">${esc(node.label)}</text>
    </g>`)
    ].join("");
    return svgFrame(spec.title, spec.caption, inner);
  }

  // campus/js/audio.js
  var KEY = "sip-universe-settings";
  var DEFAULTS = {
    theme: "neon",
    lang: "en",
    sfx: false,
    narration: false,
    voiceURI: "",
    rate: 1,
    motion: "",
    font: "md"
  };
  var settings = { ...DEFAULTS };
  var ctx = null;
  var listeners = /* @__PURE__ */ new Set();
  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
      settings = { ...DEFAULTS, ...saved };
    } catch {
      settings = { ...DEFAULTS };
    }
    if (!settings.motion) {
      settings.motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduce" : "full";
    }
    return settings;
  }
  function getSettings() {
    return settings;
  }
  function saveSettings(next) {
    settings = { ...settings, ...next };
    localStorage.setItem(KEY, JSON.stringify(settings));
    applySettings();
    listeners.forEach((fn) => fn(settings));
  }
  function onSettings(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  function applySettings() {
    const root = document.documentElement;
    root.dataset.theme = settings.theme || "observatory";
    root.dataset.font = settings.font || "md";
    root.dataset.motion = settings.motion || "full";
    const theme = document.querySelector('meta[name="theme-color"]');
    if (theme) {
      const colors = {
        holographic: "#07101f",
        neon: "#070112",
        cyberpunk: "#140016",
        sunset: "#1b0c12",
        light: "#e7f3ff",
        futuristic: "#071427",
        gaming: "#120814",
        observatory: "#070b14",
        daylight: "#f4f7fb",
        contrast: "#000000",
        phosphor: "#04140c"
      };
      theme.setAttribute("content", colors[settings.theme] || "#070b14");
    }
  }
  function prefersReduced() {
    return settings.motion === "reduce";
  }
  function audioCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function playTone(kind) {
    if (!settings.sfx) return;
    try {
      const ac = audioCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const map = { step: 660, ok: 880, bad: 196, click: 520 };
      osc.frequency.value = map[kind] || 520;
      osc.type = kind === "bad" ? "square" : "sine";
      gain.gain.setValueAtTime(1e-4, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.04, ac.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(1e-4, ac.currentTime + 0.12);
      osc.connect(gain).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.13);
    } catch {
    }
  }
  function roboticEdge(name) {
    return /microsoft\s+(david|zira|mark|hazel|george|susan)\b/i.test(name) && !/natural|neural/i.test(name);
  }
  function rankVoice(voice) {
    const name = voice.name.toLowerCase();
    let score = 0;
    if (/natural|neural|premium|enhanced/.test(name)) score += 50;
    if (/google|samantha|daniel|moira|karen|serena|allison|ava|siri/.test(name)) score += 20;
    if ((voice.lang || "").toLowerCase().startsWith("en")) score += 10;
    if (roboticEdge(voice.name)) score -= 100;
    if (/espeak|compact/.test(name)) score -= 20;
    return score;
  }
  function loadVoices() {
    return new Promise((resolve) => {
      const synth = window.speechSynthesis;
      if (!synth) {
        resolve([]);
        return;
      }
      const current = synth.getVoices();
      if (current.length) {
        resolve(current);
        return;
      }
      const finish = () => resolve(synth.getVoices());
      const timer = setTimeout(finish, 1200);
      synth.addEventListener("voiceschanged", () => {
        clearTimeout(timer);
        finish();
      }, { once: true });
    });
  }
  function bestVoice(voices) {
    const ranked = [...voices].filter((v) => (v.lang || "").toLowerCase().startsWith("en"));
    const pool = ranked.length ? ranked : [...voices];
    pool.sort((a, b) => rankVoice(b) - rankVoice(a));
    const top = pool[0];
    if (!top || rankVoice(top) < 0) return null;
    return top;
  }
  function stopNarration() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
  async function narrate(text2) {
    if (!settings.narration || !text2 || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    const voices = await loadVoices();
    stopNarration();
    const utter = new SpeechSynthesisUtterance(String(text2).slice(0, 700));
    utter.rate = Number(settings.rate) || 1;
    const chosen = voices.find((v) => v.voiceURI === settings.voiceURI);
    const voice = chosen && !roboticEdge(chosen.name) ? chosen : bestVoice(voices);
    if (settings.voiceURI && chosen) utter.voice = chosen;
    else if (voice) utter.voice = voice;
    else return;
    synth.speak(utter);
  }
  async function fillVoiceSelect(select) {
    const voices = await loadVoices();
    const sorted = [...voices].sort((a, b) => rankVoice(b) - rankVoice(a));
    const current = settings.voiceURI;
    select.replaceChildren();
    const auto = document.createElement("option");
    auto.value = "";
    auto.textContent = "Prefer a natural English voice";
    select.appendChild(auto);
    for (const voice of sorted) {
      const opt = document.createElement("option");
      opt.value = voice.voiceURI;
      const note = roboticEdge(voice.name) ? " \u2014 robotic, not the default" : "";
      opt.textContent = `${voice.name} (${voice.lang})${note}`;
      select.appendChild(opt);
    }
    select.value = current && [...select.options].some((o) => o.value === current) ? current : "";
    if (!current) {
      const best = bestVoice(voices);
      if (best) settings.voiceURI = "";
    }
  }

  // campus/js/flow.js
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
  function ladderSVG(flow, active2) {
    const parties = flow.parties || [];
    const steps = flow.steps || [];
    const width = Math.max(640, parties.length * 180);
    const row2 = 64;
    const top = 56;
    const height = top + Math.max(1, steps.length) * row2 + 28;
    const col = width / parties.length;
    const heads = parties.map((name, i) => {
      const x = col * i + col / 2;
      return `<text x="${x}" y="28" text-anchor="middle" class="party">${esc(name)}</text>
      <line x1="${x}" y1="40" x2="${x}" y2="${height - 16}" class="life"></line>`;
    }).join("");
    const arrows = steps.map((step, i) => {
      const x1 = col * step.from + col / 2;
      const x2 = col * step.to + col / 2;
      const y = top + i * row2 + 28;
      const on = i === active2 ? "is-on" : i < active2 ? "is-done" : "";
      const mid = (x1 + x2) / 2;
      const travel = i === active2 && !prefersReduced() ? `<circle r="5" fill="var(--cc-accent-3)"><animate attributeName="cx" from="${x1}" to="${x2}" dur="0.9s" repeatCount="indefinite"></animate><animate attributeName="cy" from="${y}" to="${y}" dur="0.9s" repeatCount="indefinite"></animate></circle>` : "";
      return `<g class="hop ${on} kind-${esc(step.kind || "req")}">
      <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" class="hop-line"></line>
      <polygon points="${x2},${y} ${x2 - Math.sign(x2 - x1) * 10},${y - 5} ${x2 - Math.sign(x2 - x1) * 10},${y + 5}" class="arrow-head"></polygon>
      <text x="${mid}" y="${y - 8}" text-anchor="middle" class="hop-label">${esc(step.label)}</text>
      ${travel}
    </g>`;
    }).join("");
    return `<svg class="ladder" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(flow.title || "SIP ladder")}">
    <rect width="${width}" height="${height}" class="ladder-bg"></rect>
    ${heads}${arrows}
  </svg>`;
  }
  function mountFlow(host, flow, options = {}) {
    if (!flow || !flow.steps || !flow.steps.length) {
      host.innerHTML = `<p class="muted">This lesson has no ladder.</p>`;
      return () => {
      };
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
    const view2 = host.querySelector(".sip-view");
    const scroll = host.querySelector(".ladder-scroll");
    const inspectBtn = host.querySelector('[data-act="inspect"]');
    function draw() {
      const step = flow.steps[index];
      scroll.innerHTML = ladderSVG(flow, index);
      count.textContent = `Step ${index + 1} of ${flow.steps.length}`;
      note.textContent = step.note || "";
      view2.innerHTML = paint(step.message || "");
      view2.hidden = !open;
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
        if (index >= flow.steps.length - 1) {
          stop();
          return;
        }
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
    host.querySelector('[data-act="pause"]').addEventListener("click", () => {
      playTone("click");
      stop();
    });
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

  // campus/js/store.js
  var cache = /* @__PURE__ */ new Map();
  async function loadJSON(path) {
    if (cache.has(path)) return cache.get(path);
    const bag = globalThis.SIP_DATA;
    if (bag && Object.prototype.hasOwnProperty.call(bag, path)) {
      cache.set(path, bag[path]);
      return bag[path];
    }
    const res = await fetch(path);
    if (!res.ok) throw new Error(`${path} (${res.status})`);
    const data = await res.json();
    cache.set(path, data);
    return data;
  }

  // campus/js/diagrams.js
  function live() {
    const motion = document.documentElement.dataset.motion;
    if (motion === "reduce") return false;
    if (motion === "full") return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function svg(label, w, h, body) {
    return `<svg class="atlas-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
    <rect width="${w}" height="${h}" rx="18" fill="var(--cc-bg)" stroke="var(--cc-line)"></rect>
    ${body}
  </svg>`;
  }
  function text(x, y, value, cls = "d-label", anchor = "middle") {
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${esc(value)}</text>`;
  }
  function box(x, y, w, h, title, sub, tone = 0) {
    const stroke = ["var(--cc-accent-1)", "var(--cc-accent-4)", "var(--cc-accent-2)", "var(--cc-accent-3)"][tone % 4];
    return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="var(--cc-surface-2)" stroke="${stroke}" stroke-width="2"></rect>
    ${text(x + w / 2, y + (sub ? 28 : h / 2 + 5), title)}
    ${sub ? text(x + w / 2, y + 48, sub, "d-sub") : ""}
  </g>`;
  }
  function arrow(x1, y1, x2, y2, label) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dash = live() ? "6 6" : "0";
    const sign = Math.sign(x2 - x1) || 1;
    return `<g>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--cc-accent-1)" stroke-width="2" stroke-dasharray="${dash}" class="d-march"></line>
    <polygon points="${x2},${y2} ${x2 - sign * 10},${y2 - 5} ${x2 - sign * 10},${y2 + 5}" fill="var(--cc-accent-1)"></polygon>
    ${label ? text(midX, midY - 8, label, "d-sub") : ""}
  </g>`;
  }
  function packet(x1, y1, x2, y2) {
    if (!live()) return "";
    return `<circle r="5" fill="var(--cc-accent-3)">
    <animate attributeName="cx" values="${x1};${x2}" dur="1.8s" repeatCount="indefinite"></animate>
    <animate attributeName="cy" values="${y1};${y2}" dur="1.8s" repeatCount="indefinite"></animate>
  </circle>`;
  }
  function ladder(parties, steps, w = 860, row2 = 52) {
    const top = 48;
    const h = top + steps.length * row2 + 24;
    const col = w / parties.length;
    const heads = parties.map((name, i) => {
      const x = col * i + col / 2;
      return `${text(x, 28, name)}<line x1="${x}" y1="40" x2="${x}" y2="${h - 16}" stroke="var(--cc-line)" stroke-width="2"></line>`;
    }).join("");
    const hops = steps.map((step, i) => {
      const x1 = col * step.from + col / 2;
      const x2 = col * step.to + col / 2;
      const y = top + i * row2 + 18;
      return `<g class="hop" data-i="${i}">${arrow(x1, y, x2, y, step.label)}${packet(x1, y, x2, y)}</g>`;
    }).join("");
    return svg(parties.join(" "), w, h, heads + hops);
  }
  function stack(layers) {
    const body = layers.map((layer, i) => {
      const y = 24 + i * 58;
      return box(40, y, 780, 48, layer.name, layer.detail, i);
    }).join("");
    return svg("stack", 860, 36 + layers.length * 58, body);
  }
  var ATLAS = [
    {
      id: "stack",
      title: "Session stack",
      caption: "SIP does not carry the voice. SDP names the media. RTP moves it.",
      cite: { label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261" },
      draw: () => stack([
        { name: "Neighbor systems", detail: "CRM, WFM, analytics. Events, not Via headers." },
        { name: "SIP dialog", detail: "Call-ID, tags, route set. RFC 3261." },
        { name: "SDP offer/answer", detail: "Codecs, ports, direction. RFC 3264 and RFC 8866." },
        { name: "RTP / SRTP", detail: "Media packets. RFC 3550 and RFC 3711." },
        { name: "UDP, TCP, or TLS", detail: "The hop under the message." }
      ])
    },
    {
      id: "invite-txn",
      title: "INVITE client transaction",
      caption: "Calling, Proceeding, Completed, Terminated. A 100 is not ringing.",
      cite: { label: "RFC 3261 \xA717", url: "https://www.rfc-editor.org/rfc/rfc3261#section-17" },
      draw: () => ladder(["UAC", "UAS"], [
        { from: 0, to: 1, label: "INVITE" },
        { from: 1, to: 0, label: "100" },
        { from: 1, to: 0, label: "180" },
        { from: 1, to: 0, label: "200" },
        { from: 0, to: 1, label: "ACK" }
      ])
    },
    {
      id: "noninvite",
      title: "Non-INVITE transaction",
      caption: "BYE, OPTIONS, and most others. The 2xx completes it. There is no separate ACK.",
      cite: { label: "RFC 3261 \xA717.1.2", url: "https://www.rfc-editor.org/rfc/rfc3261#section-17.1.2" },
      draw: () => ladder(["UAC", "UAS"], [
        { from: 0, to: 1, label: "BYE" },
        { from: 1, to: 0, label: "200" }
      ])
    },
    {
      id: "dialog",
      title: "Dialog versus transaction",
      caption: "The branch identifies a transaction. The tags identify the dialog.",
      cite: { label: "RFC 3261 \xA712", url: "https://www.rfc-editor.org/rfc/rfc3261#section-12" },
      draw: () => svg("dialog", 860, 280, [
        box(40, 40, 240, 180, "Transaction", "branch in Via", 0),
        box(310, 40, 240, 180, "Dialog", "Call-ID + tags", 1),
        box(580, 40, 240, 180, "Session", "SDP media", 2),
        text(160, 130, "one request", "d-sub"),
        text(430, 130, "the call", "d-sub"),
        text(700, 130, "the audio", "d-sub")
      ].join(""))
    },
    {
      id: "offer-answer",
      title: "Offer and answer",
      caption: "The answer picks. Port 0 rejects a stream. Order in the offer is a preference.",
      cite: { label: "RFC 3264", url: "https://www.rfc-editor.org/rfc/rfc3264" },
      draw: () => svg("offer", 860, 300, [
        box(40, 36, 340, 220, "Offer", "PCMU, PCMA, telephone-event", 0),
        box(480, 36, 340, 220, "Answer", "PCMU, telephone-event", 1),
        arrow(390, 140, 470, 140, ""),
        text(210, 150, "m=audio 49170", "d-sub"),
        text(650, 150, "m=audio 19642", "d-sub"),
        text(430, 250, "PCMA dropped", "d-sub")
      ].join(""))
    },
    {
      id: "rtp-header",
      title: "RTP header fields",
      caption: "Version, marker, payload type, sequence, timestamp, SSRC. Extensions sit behind the X bit.",
      cite: { label: "RFC 3550 \xA75.1", url: "https://www.rfc-editor.org/rfc/rfc3550#section-5.1" },
      draw: () => {
        const fields = ["V", "P", "X", "CC", "M", "PT", "sequence", "timestamp", "SSRC"];
        const body = fields.map((field2, i) => box(24 + i % 5 * 166, 36 + Math.floor(i / 5) * 100, 150, 72, field2, "", i)).join("");
        return svg("rtp", 860, 250, body);
      }
    },
    {
      id: "codecs",
      title: "Clock rates that surprise people",
      caption: "G.722 audio is 16 kHz. Its RTP clock in RFC 3551 is 8000.",
      cite: { label: "RFC 3551 \xA74.5.2", url: "https://www.rfc-editor.org/rfc/rfc3551#section-4.5.2" },
      draw: () => svg("codecs", 860, 220, [
        box(30, 50, 180, 110, "PCMU", "8000", 0),
        box(230, 50, 180, 110, "G.722", "clock 8000", 3),
        box(430, 50, 180, 110, "G.729", "8000", 1),
        box(630, 50, 180, 110, "Opus", "48000", 2)
      ].join(""))
    },
    {
      id: "dtmf",
      title: "Three ways digits show up",
      caption: "telephone-event is the IETF mechanism in RTP. INFO is a generic method. In-band is just audio.",
      cite: { label: "RFC 4733", url: "https://www.rfc-editor.org/rfc/rfc4733" },
      draw: () => svg("dtmf", 860, 220, [
        box(30, 50, 250, 110, "RFC 4733", "named events", 1),
        box(305, 50, 250, 110, "In-band", "audio tones", 0),
        box(580, 50, 250, 110, "INFO", "RFC 6086, not DTMF", 2)
      ].join(""))
    },
    {
      id: "srtp",
      title: "Two keying paths",
      caption: "SRTP is RFC 3711. SDES and DTLS-SRTP do not match by accident.",
      cite: { label: "RFC 3711", url: "https://www.rfc-editor.org/rfc/rfc3711" },
      draw: () => svg("srtp", 860, 240, [
        box(40, 40, 220, 90, "RTP", "media", 0),
        arrow(270, 85, 340, 85, ""),
        box(350, 30, 220, 70, "SDES", "RFC 4568", 3),
        box(350, 130, 220, 70, "DTLS-SRTP", "RFC 5764", 1),
        arrow(580, 65, 640, 85, ""),
        arrow(580, 165, 640, 120, ""),
        box(650, 60, 170, 80, "SRTP", "RFC 3711", 2)
      ].join(""))
    },
    {
      id: "ice",
      title: "ICE candidate types",
      caption: "Host, server-reflexive, relay. The checklist pairs them. RFC 8445 obsoletes RFC 5245.",
      cite: { label: "RFC 8445", url: "https://www.rfc-editor.org/rfc/rfc8445" },
      draw: () => svg("ice", 860, 260, [
        box(40, 80, 200, 90, "Host", "local address", 0),
        box(320, 30, 220, 90, "STUN", "server-reflexive", 1),
        box(320, 150, 220, 90, "TURN", "relay", 2),
        box(640, 80, 180, 90, "Peer", "checklist", 3),
        arrow(250, 120, 310, 80, ""),
        arrow(250, 130, 310, 180, ""),
        arrow(550, 75, 630, 110, ""),
        arrow(550, 190, 630, 140, ""),
        packet(250, 120, 630, 110)
      ].join(""))
    },
    {
      id: "stun",
      title: "STUN binding",
      caption: "The server tells the client the mapped address. Default port 3478.",
      cite: { label: "RFC 8489", url: "https://www.rfc-editor.org/rfc/rfc8489" },
      draw: () => ladder(["Client", "STUN"], [
        { from: 0, to: 1, label: "Binding" },
        { from: 1, to: 0, label: "XOR-MAPPED" }
      ])
    },
    {
      id: "turn",
      title: "TURN relay",
      caption: "Allocate, then the peer sends to the relayed address. TLS default is 5349.",
      cite: { label: "RFC 8656", url: "https://www.rfc-editor.org/rfc/rfc8656" },
      draw: () => ladder(["Client", "TURN", "Peer"], [
        { from: 0, to: 1, label: "Allocate" },
        { from: 1, to: 0, label: "relayed" },
        { from: 2, to: 1, label: "media" },
        { from: 1, to: 0, label: "media" }
      ])
    },
    {
      id: "nat",
      title: "NAT, ALG, and the SDP address",
      caption: "If c= is a private address and the phone is on the public Internet, the return audio has nowhere useful to go.",
      cite: { label: "RFC 7362", url: "https://www.rfc-editor.org/rfc/rfc7362" },
      draw: () => svg("nat", 860, 240, [
        box(30, 70, 180, 90, "Phone", "10.0.0.8", 0),
        box(280, 70, 200, 90, "NAT / ALG", "rewrites or not", 3),
        box(560, 70, 260, 90, "SBC", "sees the packet", 1),
        arrow(220, 110, 270, 110, ""),
        arrow(490, 110, 550, 110, "SDP c="),
        packet(220, 115, 550, 115)
      ].join(""))
    },
    {
      id: "b2bua",
      title: "B2BUA",
      caption: "Two dialogs. One operator call. Media may still go around the SBC.",
      cite: { label: "RFC 7092", url: "https://www.rfc-editor.org/rfc/rfc7092" },
      draw: () => svg("b2bua", 860, 240, [
        box(40, 40, 200, 70, "Dialog A", "Call-ID 1", 0),
        box(330, 40, 200, 70, "SBC", "B2BUA", 2),
        box(620, 40, 200, 70, "Dialog B", "Call-ID 2", 1),
        arrow(250, 75, 320, 75, ""),
        arrow(540, 75, 610, 75, ""),
        text(430, 160, "RTP may bypass this box", "d-sub"),
        text(430, 190, "RFC 5853 discusses that choice", "d-sub")
      ].join(""))
    },
    {
      id: "dns",
      title: "Locating a SIP server",
      caption: "NAPTR, then SRV, then A or AAAA. The SRV port wins over 5060.",
      cite: { label: "RFC 3263", url: "https://www.rfc-editor.org/rfc/rfc3263" },
      draw: () => svg("dns", 860, 200, [
        box(30, 50, 180, 90, "NAPTR", "transport", 0),
        arrow(220, 95, 250, 95, ""),
        box(260, 50, 180, 90, "SRV", "host + port", 1),
        arrow(450, 95, 490, 95, ""),
        box(500, 50, 160, 90, "A/AAAA", "address", 3),
        arrow(670, 95, 700, 95, ""),
        box(710, 50, 120, 90, "SIP", "", 2)
      ].join(""))
    },
    {
      id: "register",
      title: "Registration",
      caption: "Expires in the request is a wish. The 200 OK sets the binding.",
      cite: { label: "RFC 3261 \xA710", url: "https://www.rfc-editor.org/rfc/rfc3261#section-10" },
      draw: () => ladder(["UA", "Registrar"], [
        { from: 0, to: 1, label: "REGISTER" },
        { from: 1, to: 0, label: "401" },
        { from: 0, to: 1, label: "REGISTER" },
        { from: 1, to: 0, label: "200" }
      ])
    },
    {
      id: "prack",
      title: "Provisional reliability",
      caption: "PRACK acknowledges a reliable 1xx. It is its own transaction.",
      cite: { label: "RFC 3262", url: "https://www.rfc-editor.org/rfc/rfc3262" },
      draw: () => ladder(["UAC", "UAS"], [
        { from: 0, to: 1, label: "INVITE" },
        { from: 1, to: 0, label: "183" },
        { from: 0, to: 1, label: "PRACK" },
        { from: 1, to: 0, label: "200 PRACK" },
        { from: 1, to: 0, label: "200 INVITE" },
        { from: 0, to: 1, label: "ACK" }
      ])
    },
    {
      id: "refer",
      title: "REFER",
      caption: "The transferee sends a new INVITE. Replaces names the dialog to take over.",
      cite: { label: "RFC 3515", url: "https://www.rfc-editor.org/rfc/rfc3515" },
      draw: () => ladder(["Transferor", "Transferee", "Target"], [
        { from: 0, to: 1, label: "REFER" },
        { from: 1, to: 0, label: "202" },
        { from: 1, to: 2, label: "INVITE" },
        { from: 2, to: 1, label: "200" }
      ])
    },
    {
      id: "early",
      title: "Early media",
      caption: "183 with SDP can carry early media. 180 means alerting. They are not synonyms.",
      cite: { label: "RFC 3960", url: "https://www.rfc-editor.org/rfc/rfc3960" },
      draw: () => ladder(["Caller", "Callee"], [
        { from: 0, to: 1, label: "INVITE+SDP" },
        { from: 1, to: 0, label: "183+SDP" },
        { from: 1, to: 0, label: "180" },
        { from: 1, to: 0, label: "200" }
      ])
    },
    {
      id: "fork",
      title: "Forking",
      caption: "A proxy may fork. One 200 wins. The other branch is cancelled.",
      cite: { label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261" },
      draw: () => ladder(["Alice", "Proxy", "Bob", "Carol"], [
        { from: 0, to: 1, label: "INVITE" },
        { from: 1, to: 2, label: "INVITE" },
        { from: 1, to: 3, label: "INVITE" },
        { from: 2, to: 1, label: "200" },
        { from: 1, to: 3, label: "CANCEL" }
      ])
    },
    {
      id: "timer",
      title: "Session timer",
      caption: "The refresh is an UPDATE or a re-INVITE. Miss it and the session ends.",
      cite: { label: "RFC 4028", url: "https://www.rfc-editor.org/rfc/rfc4028" },
      draw: () => ladder(["A", "B"], [
        { from: 0, to: 1, label: "INVITE" },
        { from: 1, to: 0, label: "200 +SE" },
        { from: 0, to: 1, label: "UPDATE" },
        { from: 1, to: 0, label: "200" }
      ])
    },
    {
      id: "update",
      title: "UPDATE and re-INVITE",
      caption: "UPDATE can change the session before the INVITE completes. re-INVITE needs a confirmed dialog.",
      cite: { label: "RFC 3311", url: "https://www.rfc-editor.org/rfc/rfc3311" },
      draw: () => svg("update", 860, 220, [
        box(40, 50, 340, 110, "UPDATE", "RFC 3311", 0),
        box(480, 50, 340, 110, "re-INVITE", "confirmed dialog", 1)
      ].join(""))
    },
    {
      id: "cancel",
      title: "CANCEL and 487",
      caption: "The 200 OK belongs to the CANCEL. The INVITE should finish with 487.",
      cite: { label: "RFC 3261 \xA79", url: "https://www.rfc-editor.org/rfc/rfc3261#section-9" },
      draw: () => ladder(["Alice", "Bob"], [
        { from: 0, to: 1, label: "INVITE" },
        { from: 1, to: 0, label: "180" },
        { from: 0, to: 1, label: "CANCEL" },
        { from: 1, to: 0, label: "200 CANCEL" },
        { from: 1, to: 0, label: "487" },
        { from: 0, to: 1, label: "ACK" }
      ])
    },
    {
      id: "webrtc",
      title: "WebRTC triangle",
      caption: "The browser uses ICE. The signaling server is application-defined. JSEP is RFC 8829.",
      cite: { label: "RFC 8825", url: "https://www.rfc-editor.org/rfc/rfc8825" },
      draw: () => svg("webrtc", 860, 280, [
        box(40, 30, 200, 70, "Browser A", "ICE agent", 0),
        box(620, 30, 200, 70, "Browser B", "ICE agent", 1),
        box(320, 30, 220, 70, "Signaling", "not a SIP proxy", 3),
        box(320, 170, 220, 70, "STUN / TURN", "RFC 8489 / 8656", 2),
        arrow(250, 65, 310, 65, "SDP"),
        arrow(550, 65, 610, 65, "SDP"),
        arrow(150, 110, 400, 165, ""),
        arrow(700, 110, 460, 165, "")
      ].join(""))
    },
    {
      id: "teams",
      title: "Teams Direct Routing",
      caption: "Certified SBC, TLS to the pstnhub names, SRTP media. Users are homed in Microsoft 365.",
      cite: { label: "Plan Direct Routing", url: "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan" },
      draw: () => svg("teams", 860, 230, [
        box(30, 60, 180, 90, "Carrier", "PSTN", 3),
        box(250, 60, 180, 90, "Certified SBC", "your FQDN", 0),
        box(500, 60, 320, 90, "Teams", "5061 TLS", 1),
        arrow(220, 100, 240, 100, ""),
        arrow(440, 100, 490, 100, "SIP/TLS"),
        packet(250, 105, 500, 105)
      ].join(""))
    },
    {
      id: "lgw",
      title: "Webex Calling Local Gateway",
      caption: "Registration-based trunks use 8934. Certificate-based trunks use 5062. The help page is the authority.",
      cite: { label: "Webex port reference", url: "https://help.webex.com/en-us/article/b2exve" },
      draw: () => svg("lgw", 860, 230, [
        box(30, 60, 200, 90, "CUCM / PSTN", "inside", 3),
        box(300, 60, 220, 90, "Local Gateway", "CUBE or peer", 0),
        box(590, 60, 230, 90, "Webex Calling", "8934 or 5062", 1),
        arrow(240, 100, 290, 100, ""),
        arrow(530, 100, 580, 100, "SIP-TLS")
      ].join(""))
    },
    {
      id: "siprec",
      title: "SIPREC",
      caption: "The recording session is a second SIP dialog, with metadata.",
      cite: { label: "RFC 7866", url: "https://www.rfc-editor.org/rfc/rfc7866" },
      draw: () => svg("siprec", 860, 250, [
        box(40, 40, 180, 70, "Caller", "", 0),
        box(300, 40, 200, 70, "SRC / SBC", "anchors media", 2),
        box(600, 40, 200, 70, "Callee", "", 1),
        box(300, 150, 200, 70, "SRS", "recorder", 3),
        arrow(230, 75, 290, 75, ""),
        arrow(510, 75, 590, 75, ""),
        arrow(400, 120, 400, 145, "RFC 7866")
      ].join(""))
    },
    {
      id: "stir",
      title: "STIR Identity",
      caption: "The PASSporT rides in Identity. SHAKEN is the carrier profile, not a different method.",
      cite: { label: "RFC 8224", url: "https://www.rfc-editor.org/rfc/rfc8224" },
      draw: () => ladder(["Signer", "Verifier"], [
        { from: 0, to: 1, label: "INVITE" },
        { from: 1, to: 0, label: "Identity ok" }
      ])
    },
    {
      id: "qos",
      title: "Voice marking",
      caption: "Expedited Forwarding is the PHB in RFC 3246. Whether a hop honors it is network policy.",
      cite: { label: "RFC 3246", url: "https://www.rfc-editor.org/rfc/rfc3246" },
      draw: () => svg("qos", 860, 200, [
        box(40, 50, 220, 90, "Phone", "marks EF", 0),
        box(320, 50, 220, 90, "Switch", "may trust it", 3),
        box(600, 50, 220, 90, "WAN", "queue", 1),
        arrow(270, 95, 310, 95, ""),
        arrow(550, 95, 590, 95, "")
      ].join(""))
    },
    {
      id: "mind",
      title: "Ecosystem mind map",
      caption: "SIP is the session seam. The neighbors are not SIP elements.",
      cite: { label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261" },
      draw: () => {
        const spokes = [
          ["SDP", 80, 50],
          ["RTP", 250, 40],
          ["SBC", 450, 40],
          ["ICE", 680, 50],
          ["E911", 80, 180],
          ["SIPREC", 250, 190],
          ["CRM", 450, 190],
          ["WFM", 680, 180]
        ];
        const lines = spokes.map(([, x, y]) => `<line x1="430" y1="120" x2="${x + 70}" y2="${y + 28}" stroke="var(--cc-line)" stroke-width="2"></line>`).join("");
        const nodes = spokes.map(([label, x, y], i) => box(x, y, 140, 56, label, "", i)).join("");
        return svg("mind", 860, 270, lines + box(330, 90, 200, 60, "SIP dialog", "", 2) + nodes);
      }
    },
    {
      id: "timeline",
      title: "Specification timeline",
      caption: "Months are the dates printed on the RFC headers.",
      cite: { label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261" },
      draw: () => {
        const rows = [
          ["1999", "RFC 2543"],
          ["2002", "RFC 3261"],
          ["2003", "RFC 3550"],
          ["2006", "RFC 4566"],
          ["2018", "RFC 8445"],
          ["2020", "RFC 8489"],
          ["2021", "RFC 8866"]
        ];
        const body = rows.map((row2, i) => `${text(40, 48 + i * 36, row2[0], "d-sub", "start")}${text(140, 48 + i * 36, row2[1], "d-label", "start")}`).join("");
        return svg("timeline", 860, 40 + rows.length * 36, `<line x1="28" y1="20" x2="28" y2="${rows.length * 36}" stroke="var(--cc-accent-1)"></line>${body}`);
      }
    },
    {
      id: "hold",
      title: "Hold with re-INVITE",
      caption: "Hold is a new offer. a=sendonly asks the other side to stop sending. A confirmed dialog is required for re-INVITE.",
      cite: { label: "RFC 3264 \xA78.4", url: "https://www.rfc-editor.org/rfc/rfc3264#section-8.4" },
      draw: () => ladder(["Alice", "Bob"], [
        { from: 0, to: 1, label: "re-INVITE sendonly" },
        { from: 1, to: 0, label: "200 recvonly" },
        { from: 0, to: 1, label: "ACK" },
        { from: 0, to: 1, label: "re-INVITE sendrecv" },
        { from: 1, to: 0, label: "200" },
        { from: 0, to: 1, label: "ACK" }
      ])
    },
    {
      id: "tls",
      title: "SIP over TLS",
      caption: "The handshake is TLS. The INVITE rides after it. SIPS and 5061 are the usual signal. TLS 1.0 and 1.1 are deprecated.",
      cite: { label: "RFC 3261 \xA718 / RFC 8996", url: "https://www.rfc-editor.org/rfc/rfc8996" },
      draw: () => ladder(["Client", "Server"], [
        { from: 0, to: 1, label: "ClientHello" },
        { from: 1, to: 0, label: "ServerHello" },
        { from: 0, to: 1, label: "INVITE" },
        { from: 1, to: 0, label: "100" },
        { from: 1, to: 0, label: "200" }
      ])
    },
    {
      id: "srtp-flow",
      title: "SRTP after SDES",
      caption: "This ladder is the SDES path: keys travel in SDP. DTLS-SRTP (RFC 5764) keys the media in the media path instead.",
      cite: { label: "RFC 4568", url: "https://www.rfc-editor.org/rfc/rfc4568" },
      draw: () => ladder(["Alice", "Bob"], [
        { from: 0, to: 1, label: "INVITE a=crypto" },
        { from: 1, to: 0, label: "200 a=crypto" },
        { from: 0, to: 1, label: "ACK" },
        { from: 0, to: 1, label: "SRTP" }
      ])
    },
    {
      id: "cutover",
      title: "Parallel trunk cutover",
      caption: "A teaching sequence: prove the new trunk, then retire the old one. It is not a record of any carrier procedure.",
      cite: { label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261" },
      draw: () => ladder(["Pilot", "Old SBC", "New SBC"], [
        { from: 0, to: 1, label: "INVITE" },
        { from: 1, to: 0, label: "200" },
        { from: 0, to: 2, label: "INVITE" },
        { from: 2, to: 0, label: "200" },
        { from: 0, to: 1, label: "BYE" }
      ])
    },
    {
      id: "fault-tree",
      title: "One-way audio path",
      caption: "Status code first, then the SDP address, then whether RTP actually arrives. Private c= on a public hop is a common dead end.",
      cite: { label: "RFC 7362", url: "https://www.rfc-editor.org/rfc/rfc7362" },
      draw: () => svg("fault-tree", 860, 280, [
        box(40, 30, 200, 70, "One-way audio", "start here", 0),
        box(320, 20, 220, 70, "SDP c= private?", "RFC 7362", 3),
        box(620, 20, 200, 70, "Latch or rewrite", "media", 1),
        box(320, 160, 220, 70, "RTP present?", "even port", 2),
        box(620, 160, 200, 70, "Codec / ptime", "488 or silence", 0),
        arrow(250, 65, 310, 55, ""),
        arrow(550, 55, 610, 55, ""),
        arrow(430, 100, 430, 150, "no"),
        arrow(550, 195, 610, 195, ""),
        packet(250, 65, 610, 55)
      ].join(""))
    },
    {
      id: "mermaid-register",
      title: "REGISTER, from Mermaid",
      caption: "Mermaid 11.12.0 drew this at build time from the same registration sequence. The hand ladder is the one that animates.",
      cite: { label: "RFC 3261 \xA710", url: "https://www.rfc-editor.org/rfc/rfc3261#section-10" },
      draw: () => `<img class="atlas-svg" width="450" height="347" alt="REGISTER sequence drawn by Mermaid" src="diagrams/register.svg">`
    },
    {
      id: "mermaid-border",
      title: "Border paths, from Mermaid",
      caption: "A teaching sketch of a phone, an SBC, a call agent, and a carrier. Mermaid 11.12.0 drew it at build time. It is not a customer topology.",
      cite: { label: "RFC 7092", url: "https://www.rfc-editor.org/rfc/rfc7092" },
      draw: () => `<img class="atlas-svg" width="424" height="174" alt="Phone, SBC, CUCM, and carrier drawn by Mermaid" src="diagrams/border.svg">`
    }
  ];
  var ANIMATED = /* @__PURE__ */ new Set([
    "invite-txn",
    "noninvite",
    "nat",
    "register",
    "prack",
    "refer",
    "early",
    "fork",
    "timer",
    "cancel",
    "stir",
    "hold",
    "tls",
    "srtp-flow",
    "cutover"
  ]);
  for (const item of ATLAS) item.animated = ANIMATED.has(item.id);
  function figureHTML(item) {
    return `<figure class="atlas-fig${item.animated ? " is-animated" : ""}" id="atlas-${esc(item.id)}" data-animated="${item.animated ? "1" : "0"}">
    ${item.draw()}
    <figcaption><strong>${esc(item.title)}.</strong> <span data-i18n="why">Why this matters</span>: ${esc(item.caption)} <a href="${esc(item.cite.url)}">${esc(item.cite.label)}</a></figcaption>
    <div class="fig-actions"><button type="button" data-enlarge data-i18n="enlarge">Enlarge</button></div>
  </figure>`;
  }
  function bindLightbox() {
    const dialog = document.querySelector("#lightbox");
    if (!dialog || dialog.dataset.bound) return;
    dialog.dataset.bound = "1";
    const stage = dialog.querySelector("#lightbox-stage");
    const title = dialog.querySelector("#lightbox-title");
    const legend = dialog.querySelector("#lightbox-legend");
    const why = dialog.querySelector("#lightbox-why");
    const stepLabel = dialog.querySelector("#lightbox-step");
    let step = 0;
    const hops = () => [...stage.querySelectorAll(".hop")];
    const show = (n) => {
      const list = hops();
      if (!list.length) {
        stepLabel.textContent = "";
        return;
      }
      step = Math.max(0, Math.min(n, list.length - 1));
      list.forEach((hop, i) => {
        hop.style.opacity = i <= step ? "1" : "0.12";
      });
      stepLabel.textContent = `${step + 1} / ${list.length}`;
    };
    const svg2 = () => stage.querySelector("svg");
    document.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-enlarge]");
      if (!btn) return;
      const fig = btn.closest("figure");
      if (!fig) return;
      const source = fig.querySelector("svg, img");
      stage.replaceChildren();
      if (source) stage.appendChild(source.cloneNode(true));
      const heading = fig.querySelector("figcaption strong");
      title.textContent = heading ? heading.textContent.replace(/\.$/, "") : "Diagram";
      why.textContent = fig.querySelector("figcaption") ? fig.querySelector("figcaption").textContent : "";
      const names = [...stage.querySelectorAll("text.d-label")].map((node) => node.textContent.trim()).filter(Boolean);
      const unique = [...new Set(names)].slice(0, 8);
      legend.textContent = unique.length ? `Legend: ${unique.join(" \xB7 ")}` : "Legend: the drawing is a static export. The hand-built ladder is the one that steps.";
      const picture = svg2();
      if (picture && typeof picture.unpauseAnimations === "function") picture.unpauseAnimations();
      show(hops().length ? hops().length - 1 : 0);
      if (!dialog.open) dialog.showModal();
    });
    dialog.addEventListener("click", (event) => {
      const action = event.target.closest("[data-flow]");
      if (!action) return;
      const picture = svg2();
      if (action.dataset.flow === "pause") {
        if (picture && picture.pauseAnimations) picture.pauseAnimations();
        return;
      }
      if (action.dataset.flow === "play") {
        hops().forEach((hop) => {
          hop.style.opacity = "1";
        });
        if (picture && picture.unpauseAnimations) picture.unpauseAnimations();
        stepLabel.textContent = hops().length ? `${hops().length} / ${hops().length}` : "";
        return;
      }
      if (picture && picture.pauseAnimations) picture.pauseAnimations();
      show(step + 1 >= hops().length ? 0 : step + 1);
    });
  }
  function mountSpotlight(host) {
    if (!host) return;
    const picks = ["stack", "invite-txn", "ice", "b2bua"].map((id) => ATLAS.find((item) => item.id === id)).filter(Boolean);
    host.innerHTML = `<div class="atlas-grid">${picks.map(figureHTML).join("")}</div>`;
  }

  // campus/js/pack.js
  var CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();
  function crc32(data) {
    let c = 4294967295;
    for (let i = 0; i < data.length; i += 1) c = CRC_TABLE[(c ^ data[i]) & 255] ^ c >>> 8;
    return (c ^ 4294967295) >>> 0;
  }
  function u16(n) {
    return Uint8Array.of(n & 255, n >>> 8 & 255);
  }
  function u32(n) {
    return Uint8Array.of(n & 255, n >>> 8 & 255, n >>> 16 & 255, n >>> 24 & 255);
  }
  function concat(parts) {
    const size = parts.reduce((sum, part) => sum + part.length, 0);
    const out = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) {
      out.set(part, offset);
      offset += part.length;
    }
    return out;
  }
  function buildZip(files) {
    const locals = [];
    const centrals = [];
    let offset = 0;
    for (const file of files) {
      const name = new TextEncoder().encode(file.name);
      const data = file.data;
      const crc = crc32(data);
      const local = concat([
        u32(67324752),
        u16(20),
        u16(2048),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        name,
        data
      ]);
      const central = concat([
        u32(33639248),
        u16(20),
        u16(20),
        u16(2048),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        name
      ]);
      locals.push(local);
      centrals.push(central);
      offset += local.length;
    }
    const centralDir = concat(centrals);
    const end = concat([
      u32(101010256),
      u16(0),
      u16(0),
      u16(files.length),
      u16(files.length),
      u32(centralDir.length),
      u32(offset),
      u16(0)
    ]);
    return concat([...locals, centralDir, end]);
  }
  var SHELL = [
    "index.html",
    "manifest.webmanifest",
    "sw.js",
    "css/app.css",
    "css/flagship.css",
    "css/visual.css",
    "audio/architect-use.mp3",
    "audio/architect-share.mp3",
    "js/app.js",
    "js/audio.js",
    "js/draw.js",
    "js/flow.js",
    "js/parse.js",
    "js/tools.js",
    "js/topology.js",
    "js/diagrams.js",
    "js/field.js",
    "js/play.js",
    "js/pack.js",
    "js/store.js",
    "js/charts.js",
    "js/fx.js",
    "js/campus.iife.js",
    "js/embedded-data.js",
    "vendor/d3.min.js",
    "vendor/anime.umd.min.js",
    "vendor/rough.js",
    "vendor/confetti.browser.js",
    "vendor/markmap-view.js",
    "diagrams/register.svg",
    "diagrams/border.svg",
    "vendor/three.min.js",
    "vendor/VERSION.txt",
    "vendor/THREE-LICENSE.txt",
    "data/catalog.json",
    "data/glossary.json",
    "data/ecosystem.json",
    "data/certs.json",
    "data/labs.json",
    "data/samples.json",
    "data/boss.json",
    "data/interview.json",
    "data/ports.json",
    "data/fieldguide.json",
    "data/daily.json",
    "data/guidebot.json"
  ];
  async function fetchBytes(path) {
    const bag = globalThis.SIP_DATA;
    if (bag && Object.prototype.hasOwnProperty.call(bag, path)) {
      return new TextEncoder().encode(JSON.stringify(bag[path]));
    }
    const res = await fetch(path);
    if (!res.ok) throw new Error(`${path} (${res.status})`);
    return new Uint8Array(await res.arrayBuffer());
  }
  async function downloadPack(catalog2) {
    const status = document.querySelector("#pack-status");
    if (location.protocol === "file:") {
      if (status) status.textContent = "This page already has the catalog embedded. Serve the folder over HTTP to build the zip.";
      return 0;
    }
    if (status) status.textContent = "Collecting the campus\u2026";
    const names = new Set(SHELL);
    for (const track of catalog2.tracks || []) names.add(track.file);
    try {
      const manifestRes = await fetch("downloads/manifest.json");
      if (manifestRes.ok) {
        const manifest = await manifestRes.json();
        for (const item of manifest.items || []) {
          for (const key of ["html", "pdf", "png", "json"]) {
            if (item[key]) names.add(item[key]);
          }
        }
        names.add("downloads/manifest.json");
      }
    } catch {
    }
    const files = [];
    for (const name of names) {
      files.push({ name, data: await fetchBytes(name) });
      if (status) status.textContent = `Packed ${files.length} of ${names.size}`;
    }
    const zip = buildZip(files);
    const blob = new Blob([zip], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sip-universe-offline.zip";
    link.click();
    URL.revokeObjectURL(url);
    if (status) status.textContent = `Downloaded ${files.length} files. Unzip and serve the folder over HTTP, or open index.html from disk.`;
    return files.length;
  }

  // campus/js/icons.js
  function iconHTML(id) {
    const safe = String(id || "foundations").replace(/[^a-z0-9-]/gi, "") || "foundations";
    return `<span class="iso glyph-hold"><canvas class="glyph-view" data-glyph="${safe}" width="256" height="256" aria-hidden="true"></canvas></span>`;
  }

  // campus/js/play.js
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
  function shareResult(title, lines) {
    download("sip-universe-result.svg", cardSvg({ title, lines }), "image/svg+xml");
  }
  async function load(path) {
    return loadJSON(path);
  }
  async function route(path, view2, ctx2) {
    if (path === "#/play") return hub(view2, ctx2);
    if (path === "#/play/ports") return portsGame(view2, ctx2);
    if (path === "#/play/builder") return builder(view2, ctx2);
    if (path === "#/play/daily") return daily(view2, ctx2);
    if (path === "#/explorer") return explorer(view2, ctx2);
    return null;
  }
  function hub(view2, ctx2) {
    ctx2.setTitle("Practice");
    view2.innerHTML = `<p class="lede">Short drills with the same facts as the lessons. Scores stay in this browser.</p>
    <div class="card-grid">
      <a class="card" href="#/play/ports">${iconHTML("nat")}<span class="kicker">Game</span><h3>Ports mastery</h3><p>Eight questions from the checked port table.</p></a>
      <a class="card" href="#/play/builder">${iconHTML("call-flows")}<span class="kicker">Sandbox</span><h3>Build a call flow</h3><p>Add parties and hops. The ladder is the same engine as the lessons.</p></a>
      <a class="card" href="#/explorer">${iconHTML("routing")}<span class="kicker">Map</span><h3>Flow explorer</h3><p>Click a node. Read the protocol and the citation.</p></a>
      <a class="card" href="#/play/daily">${iconHTML("operations")}<span class="kicker">Daily</span><h3>Daily challenge</h3><p>Three questions chosen from the date. Same set until tomorrow UTC.</p></a>
      <a class="card" href="#/badges">${iconHTML("capstone")}<span class="kicker">Badges</span><h3>Badges</h3><p>Earned only when you do the thing.</p></a>
    </div>`;
    return () => {
    };
  }
  function shuffle(list, seed) {
    const copy = [...list];
    let s = seed || 1;
    for (let i = copy.length - 1; i > 0; i -= 1) {
      s = s * 1664525 + 1013904223 >>> 0;
      const j = s % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  async function portsGame(view2, ctx2) {
    const data = await load("data/ports.json");
    const round = shuffle(data.quiz, Date.now() % 1e5).slice(0, 8);
    let index = 0;
    let score = 0;
    ctx2.setTitle("Ports mastery");
    const draw = () => {
      const item = round[index];
      if (!item) {
        const perfect = score === round.length;
        if (score >= 6) ctx2.noteBadge("ports");
        if (perfect) ctx2.noteBadge("ports-perfect");
        view2.innerHTML = `<p class="lede">${score} of ${round.length}.</p>
        <div class="row-actions">
          <button type="button" class="primary" id="again">Play again</button>
          <button type="button" id="share-ports">Download result card</button>
          <a class="btn" href="#/ports">Open the table</a>
        </div>`;
        view2.querySelector("#again").addEventListener("click", () => {
          location.hash = "#/play/ports";
        });
        view2.querySelector("#share-ports").addEventListener("click", () => {
          shareResult("Ports mastery", [`${score} of ${round.length}`, (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)]);
        });
        return;
      }
      view2.innerHTML = `<p class="fine">Question ${index + 1} of ${round.length}. Score ${score}.</p>
      <form class="quiz" id="port-q"><p>${esc(item.q)}</p>
        ${item.choices.map((choice) => `<label class="choice"><input type="radio" name="p" value="${esc(choice)}"> <span>${esc(choice)}</span></label>`).join("")}
        <button type="submit" class="primary">Lock in</button>
        <p class="why" hidden></p>
      </form>`;
      view2.querySelector("#port-q").addEventListener("submit", (event) => {
        event.preventDefault();
        const picked = view2.querySelector('input[name="p"]:checked');
        const why = view2.querySelector(".why");
        if (!picked) return;
        const ok = picked.value === item.answer;
        if (ok) score += 1;
        why.hidden = false;
        why.innerHTML = `${ok ? "Correct." : `Answer: ${esc(item.answer)}.`} ${esc(item.why)} ${citeLinks([item.cite])}`;
        view2.querySelectorAll("input").forEach((input) => {
          input.disabled = true;
        });
        const next = document.createElement("button");
        next.type = "button";
        next.className = "primary";
        next.textContent = index === round.length - 1 ? "See score" : "Next";
        next.addEventListener("click", () => {
          index += 1;
          draw();
        });
        why.after(next);
      });
    };
    draw();
    return () => {
    };
  }
  async function builder(view2, ctx2) {
    ctx2.setTitle("Build a call flow");
    const flow = {
      title: "Your call",
      parties: ["Alice", "SBC", "Bob"],
      steps: [
        { from: 0, to: 1, label: "INVITE", kind: "req", note: "Offer leaves Alice.", message: "" },
        { from: 1, to: 2, label: "INVITE", kind: "req", note: "The B2BUA starts its own INVITE.", message: "" }
      ]
    };
    view2.innerHTML = `<p class="lede">Add a party or a hop. Labels are methods and status codes you choose. Nothing is sent to a network.</p>
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
    const form = view2.querySelector("#hop-form");
    const host = view2.querySelector("#built");
    const fill = () => {
      for (const name of ["from", "to"]) {
        const select = form.querySelector(`[name="${name}"]`);
        const current = select.value;
        select.innerHTML = flow.parties.map((party, i) => `<option value="${i}">${esc(party)}</option>`).join("");
        if (current) select.value = current;
      }
      host.innerHTML = `<div class="scroll">${ladderSVG(flow, flow.steps.length - 1)}</div>`;
    };
    view2.querySelector("#add-party").addEventListener("click", () => {
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
        from,
        to,
        label: form.label.value.trim().slice(0, 16) || "INVITE",
        kind: form.kind.value,
        note: "",
        message: ""
      });
      if (flow.steps.length >= 4) ctx2.noteBadge("builder");
      fill();
    });
    view2.querySelector("#share-flow").addEventListener("click", () => {
      const hops = flow.steps.map((step) => `${flow.parties[step.from]} \u2192 ${flow.parties[step.to]} ${step.label}`);
      shareResult("Call flow", hops.slice(0, 8));
    });
    view2.querySelector("#clear-flow").addEventListener("click", () => {
      location.hash = "#/play/builder";
    });
    fill();
    return () => {
    };
  }
  var EXPLORER = [
    { id: "phone", x: 40, y: 180, title: "Phone", copy: "A user agent. It sends INVITE and puts an offer in SDP if it is an early-offer phone.", cite: { label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261" } },
    { id: "sbc", x: 250, y: 80, title: "Enterprise SBC", copy: "A B2BUA. Two dialogs. It may anchor media or let RTP go direct.", cite: { label: "RFC 7092", url: "https://www.rfc-editor.org/rfc/rfc7092" } },
    { id: "cucm", x: 250, y: 280, title: "CUCM", copy: "Enterprise registrar and trunk peer. A SIP Profile here is an admin object, not a CUBE sip-profile.", cite: { label: "Cisco CUCM", url: "https://www.cisco.com/c/en/us/support/unified-communications/unified-communications-manager-callmanager/series.html" } },
    { id: "pstn", x: 500, y: 40, title: "PSTN carrier", copy: "Your SIP trunk. Identity headers and codecs are a contract with that carrier.", cite: { label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261" } },
    { id: "teams", x: 700, y: 40, title: "Teams", copy: "Direct Routing: certified SBC, TLS 5061 to the pstnhub names, SRTP media.", cite: { label: "Plan Direct Routing", url: "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan" } },
    { id: "webex", x: 700, y: 180, title: "Webex Calling", copy: "Local Gateway. 8934 for registration-based signaling, 5062 for certificate-based trunks, per the port reference.", cite: { label: "Port reference", url: "https://help.webex.com/en-us/article/b2exve" } },
    { id: "rec", x: 500, y: 200, title: "Recorder", copy: "SIPREC SRC to SRS. A second session. Metadata is RFC 7865.", cite: { label: "RFC 7866", url: "https://www.rfc-editor.org/rfc/rfc7866" } },
    { id: "e911", x: 500, y: 320, title: "Emergency", copy: "Service URN and location conveyance. Test with the provider\u2019s test number. Not legal advice.", cite: { label: "RFC 6881", url: "https://www.rfc-editor.org/rfc/rfc6881" } },
    { id: "crm", x: 40, y: 40, title: "CRM", copy: "Screen pop on ANI or a case id. Dashed because it is not a SIP hop.", cite: { label: "RFC 3325", url: "https://www.rfc-editor.org/rfc/rfc3325" } }
  ];
  var LINKS = [
    ["phone", "sbc"],
    ["phone", "cucm"],
    ["sbc", "pstn"],
    ["sbc", "teams"],
    ["sbc", "webex"],
    ["sbc", "rec"],
    ["sbc", "e911"],
    ["crm", "cucm"]
  ];
  function explorer(view2, ctx2) {
    ctx2.setTitle("Flow explorer");
    const seen = /* @__PURE__ */ new Set();
    const nodes = EXPLORER.map((node) => `<g class="ex-node" data-id="${esc(node.id)}" tabindex="0" role="button">
      <rect x="${node.x}" y="${node.y}" width="150" height="64" rx="12"></rect>
      <text x="${node.x + 75}" y="${node.y + 38}">${esc(node.title)}</text>
    </g>`).join("");
    const edges = LINKS.map(([a, b]) => {
      const from = EXPLORER.find((node) => node.id === a);
      const to = EXPLORER.find((node) => node.id === b);
      return `<line x1="${from.x + 75}" y1="${from.y + 32}" x2="${to.x + 75}" y2="${to.y + 32}" class="ex-link ${a === "crm" ? "is-soft" : ""}"></line>`;
    }).join("");
    view2.innerHTML = `<p class="lede">A teaching map. Click a node. Five different nodes earns the explorer badge.</p>
    <div class="tool-grid">
      <div class="scroll"><svg class="explorer" viewBox="0 0 880 420" role="img" aria-label="SIP edge map">${edges}${nodes}</svg></div>
      <article class="panel" id="ex-detail"><h2>Pick a node</h2><p>The citation opens the source.</p></article>
    </div>`;
    const detail = view2.querySelector("#ex-detail");
    const show = (id) => {
      const node = EXPLORER.find((item) => item.id === id);
      if (!node) return;
      seen.add(id);
      if (seen.size >= 5) ctx2.noteBadge("explorer");
      detail.innerHTML = `<h2>${esc(node.title)}</h2><p>${esc(node.copy)}</p>${citeLinks([node.cite])}`;
    };
    view2.querySelectorAll(".ex-node").forEach((node) => {
      node.addEventListener("click", () => show(node.dataset.id));
      node.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          show(node.dataset.id);
        }
      });
    });
    return () => {
    };
  }
  function dayKey() {
    return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  }
  function hash(value) {
    let h = 2166136261;
    for (const ch of value) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return h >>> 0;
  }
  async function daily(view2, ctx2) {
    const data = await load("data/daily.json");
    const key = dayKey();
    const start = hash(key) % data.items.length;
    const items = [0, 1, 2].map((offset) => data.items[(start + offset) % data.items.length]);
    const storeKey = "sip-universe-daily";
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(storeKey) || "{}");
    } catch {
      saved = {};
    }
    ctx2.setTitle("Daily challenge");
    if (saved.date === key && typeof saved.score === "number") {
      view2.innerHTML = `<p class="lede">Today (${esc(key)} UTC) is already scored: ${saved.score} of ${saved.total}.</p>
      <button type="button" id="share-daily">Download result card</button>`;
      view2.querySelector("#share-daily").addEventListener("click", () => shareResult("Daily challenge", [`${saved.score} of ${saved.total}`, key]));
      return () => {
      };
    }
    let index = 0;
    let score = 0;
    const draw = () => {
      const item = items[index];
      if (!item) {
        localStorage.setItem(storeKey, JSON.stringify({ date: key, score, total: items.length }));
        ctx2.noteBadge("daily");
        view2.innerHTML = `<p class="lede">${score} of ${items.length} on ${esc(key)}.</p>
        <button type="button" class="primary" id="share-daily">Download result card</button>`;
        view2.querySelector("#share-daily").addEventListener("click", () => shareResult("Daily challenge", [`${score} of ${items.length}`, key]));
        return;
      }
      view2.innerHTML = `<p class="fine">${esc(key)} UTC \xB7 question ${index + 1} of ${items.length}</p>
      <form class="quiz" id="daily-q"><p>${esc(item.q)}</p>
        ${item.choices.map((choice, i) => `<label class="choice"><input type="radio" name="d" value="${i}"> <span>${esc(choice)}</span></label>`).join("")}
        <button type="submit" class="primary">Answer</button><p class="why" hidden></p></form>`;
      view2.querySelector("#daily-q").addEventListener("submit", (event) => {
        event.preventDefault();
        const picked = view2.querySelector('input[name="d"]:checked');
        if (!picked) return;
        const ok = Number(picked.value) === item.answer;
        if (ok) score += 1;
        const why = view2.querySelector(".why");
        why.hidden = false;
        why.innerHTML = `${ok ? "Correct." : `Answer: ${esc(item.choices[item.answer])}.`} ${esc(item.why)} ${citeLinks([item.cite])}`;
        const next = document.createElement("button");
        next.type = "button";
        next.textContent = "Next";
        next.className = "primary";
        next.addEventListener("click", () => {
          index += 1;
          draw();
        });
        why.after(next);
      });
    };
    draw();
    return () => {
    };
  }

  // campus/js/charts.js
  var CHARTS = [
    { id: "lessons", title: "Lessons per track", source: "Counted from campus/data/catalog.json." },
    { id: "minutes", title: "Minutes per track", source: "Sum of lesson minutes in the catalog index." },
    { id: "levels", title: "Tracks by level", source: "The level field on each catalog track." },
    { id: "ports", title: "Port rows by transport", source: "campus/data/ports.json, checked 2026-10-15." },
    { id: "tags", title: "Lesson tags", source: "Tag counts on catalog lessons. Top eight." },
    { id: "totals", title: "Campus totals", source: "catalog.stats. Drawn with rough.js." }
  ];
  function scaleOf(max, width) {
    const d3 = globalThis.d3;
    if (d3 && typeof d3.scaleLinear === "function") {
      return d3.scaleLinear().domain([0, max || 1]).range([0, width]);
    }
    return (value) => Number(value) / (max || 1) * width;
  }
  function barChart(label, rows, unit) {
    const max = Math.max(...rows.map((row2) => row2.value), 1);
    const widthOf = scaleOf(max, 520);
    const rowH = 42;
    const h = 16 + rows.length * rowH;
    const bars = rows.map((row2, i) => {
      const y = 10 + i * rowH;
      const w = Math.max(4, widthOf(row2.value));
      const suffix = unit ? ` ${unit}` : "";
      const tip = `${row2.label}: ${row2.value}${suffix}`;
      return `<text x="12" y="${y + 14}" class="d-sub">${esc(row2.label)}</text>
      <text x="548" y="${y + 14}" text-anchor="end" class="d-sub">${esc(String(row2.value))}${esc(suffix)}</text>
      <rect data-tip="${esc(tip)}" x="12" y="${y + 16}" width="536" height="22" fill="transparent"></rect>
      <rect class="bar" data-tip="${esc(tip)}" x="12" y="${y + 22}" width="${w.toFixed(1)}" height="12" rx="4" fill="var(--cc-accent-1)" opacity="0.9"></rect>`;
    }).join("");
    return `<svg class="chart-svg" width="560" height="${h}" viewBox="0 0 560 ${h}" role="img" aria-label="${esc(label)}">
    <rect width="560" height="${h}" rx="12" fill="var(--cc-bg)" stroke="var(--cc-line)"></rect>
    ${bars}
  </svg>`;
  }
  function lessonsRows(catalog2) {
    return catalog2.tracks.map((track) => ({ label: track.title.slice(0, 22), value: track.lessons.length }));
  }
  function minutesRows(catalog2) {
    return catalog2.tracks.map((track) => ({
      label: track.title.slice(0, 22),
      value: track.lessons.reduce((sum, lesson) => sum + (lesson.minutes || 0), 0)
    }));
  }
  function levelRows(catalog2) {
    const map = /* @__PURE__ */ new Map();
    for (const track of catalog2.tracks) map.set(track.level, (map.get(track.level) || 0) + 1);
    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }
  function portRows(ports) {
    const map = /* @__PURE__ */ new Map();
    for (const row2 of ports.rows || []) map.set(row2.transport, (map.get(row2.transport) || 0) + 1);
    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }
  function tagRows(catalog2) {
    const map = /* @__PURE__ */ new Map();
    for (const track of catalog2.tracks) {
      for (const lesson of track.lessons) {
        for (const tag of lesson.tags || []) map.set(tag, (map.get(tag) || 0) + 1);
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value }));
  }
  function totalRows(catalog2) {
    const stats = catalog2.stats;
    return [
      ["Lessons", stats.lessons],
      ["Quizzes", stats.quizzes],
      ["Cards", stats.cards],
      ["Labs", stats.labs],
      ["Glossary", stats.glossary],
      ["Faults", stats.faults]
    ].map(([label, value]) => ({ label, value }));
  }
  function chartMarkup(id, catalog2, ports) {
    if (id === "lessons") return barChart("Lessons per track", lessonsRows(catalog2), "");
    if (id === "minutes") return barChart("Minutes per track", minutesRows(catalog2), "min");
    if (id === "levels") return barChart("Tracks by level", levelRows(catalog2), "");
    if (id === "ports") return barChart("Port rows by transport", portRows(ports), "");
    if (id === "tags") return barChart("Lesson tags", tagRows(catalog2), "");
    if (id === "totals") return `<svg id="chart-totals" class="chart-svg" width="520" height="280" viewBox="0 0 520 280" role="img" aria-label="Campus totals"></svg>`;
    return "";
  }
  function chartsHTML(catalog2, ports) {
    return `<div class="chart-grid">${CHARTS.map((chart) => `<figure class="chart-card" id="chart-${esc(chart.id)}" data-chart="${esc(chart.id)}">
      ${chartMarkup(chart.id, catalog2, ports)}
      <figcaption><strong>${esc(chart.title)}.</strong> ${esc(chart.source)}</figcaption>
    </figure>`).join("")}</div>`;
  }
  function bindChartTips(root) {
    if (!root) return () => {
    };
    const grids = [...root.querySelectorAll(".chart-grid")];
    const stops = grids.map((grid) => {
      const tip = document.createElement("div");
      tip.className = "chart-tip";
      tip.hidden = true;
      grid.appendChild(tip);
      const move = (event) => {
        const el = event.target.closest("[data-tip]");
        if (!el || !grid.contains(el)) {
          tip.hidden = true;
          return;
        }
        tip.hidden = false;
        tip.textContent = el.dataset.tip;
        const rect = grid.getBoundingClientRect();
        tip.style.left = `${Math.min(event.clientX - rect.left + 12, rect.width - 160)}px`;
        tip.style.top = `${event.clientY - rect.top + 14}px`;
      };
      const leave = () => {
        tip.hidden = true;
      };
      grid.addEventListener("pointermove", move);
      grid.addEventListener("pointerleave", leave);
      return () => {
        grid.removeEventListener("pointermove", move);
        grid.removeEventListener("pointerleave", leave);
      };
    });
    return () => stops.forEach((fn) => fn());
  }
  function animateCharts(root) {
    const motion = document.documentElement.dataset.motion;
    const reduce = motion === "reduce" || motion !== "full" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!root || reduce) return;
    const anime = globalThis.anime;
    if (!anime || typeof anime.animate !== "function") return;
    root.querySelectorAll(".chart-svg rect.bar").forEach((rect, index) => {
      const width = Number(rect.getAttribute("width")) || 0;
      const state = { w: 0 };
      rect.setAttribute("width", "0");
      try {
        anime.animate(state, {
          w: width,
          duration: 700,
          delay: index * 20,
          onUpdate: () => rect.setAttribute("width", state.w.toFixed(1))
        });
      } catch {
        rect.setAttribute("width", String(width));
      }
    });
  }
  function paintRoughTotals(root, catalog2) {
    const svg2 = root.querySelector("#chart-totals");
    const rough = globalThis.rough;
    if (!svg2 || !rough || typeof rough.svg !== "function") return;
    const rows = totalRows(catalog2);
    const max = Math.max(...rows.map((row2) => row2.value), 1);
    const widthOf = scaleOf(max, 240);
    const rc = rough.svg(svg2);
    rows.forEach((row2, i) => {
      const y = 24 + i * 40;
      const w = Math.max(8, widthOf(row2.value));
      const node = rc.rectangle(150, y, w, 22, {
        stroke: "#3ddcff",
        fill: "#173049",
        fillStyle: "hachure",
        roughness: 1.1,
        strokeWidth: 1.5
      });
      svg2.appendChild(node);
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", "12");
      label.setAttribute("y", String(y + 16));
      label.setAttribute("class", "d-sub");
      label.textContent = `${row2.label} ${row2.value}`;
      svg2.appendChild(label);
    });
  }
  function trackMinutesChart(track) {
    const rows = track.lessons.map((lesson) => ({ label: lesson.title.slice(0, 28), value: lesson.minutes || 0 }));
    return barChart(`${track.title} minutes`, rows, "min");
  }
  var MIND = {
    content: "SIP session",
    children: [
      { content: "Signaling", children: [
        { content: "INVITE and responses" },
        { content: "WebSocket subprotocol sip" },
        { content: "Transactions and dialogs" }
      ] },
      { content: "Media", children: [
        { content: "SDP offer and answer" },
        { content: "ICE, STUN, TURN" },
        { content: "DTLS-SRTP and Opus" }
      ] },
      { content: "Open core", children: [
        { content: "Kamailio SIP server" },
        { content: "Asterisk and FreeSWITCH" },
        { content: "rtpengine" }
      ] },
      { content: "Compliance study", children: [
        { content: "STIR and SHAKEN" },
        { content: "Kari's Law and RAY BAUM'S Act" },
        { content: "10DLC messaging" }
      ] },
      { content: "Neighbors", children: [
        { content: "WFM and CRM" },
        { content: "SIPREC recording" },
        { content: "Programmable voice APIs" }
      ] }
    ]
  };
  function mindNode(node) {
    return {
      content: node.content,
      children: (node.children || []).map(mindNode)
    };
  }
  function mountMind(host) {
    host.innerHTML = `<div class="markmap-wrap"><svg id="sip-mind" width="640" height="480" role="img" aria-label="SIP session mind map"></svg></div>
    <p class="fine">Mind map drawn with markmap and d3 from the campus outline. It is a map of topics, not a network.</p>`;
    const svg2 = host.querySelector("#sip-mind");
    const lib = globalThis.markmap;
    if (!svg2 || !lib || typeof lib.Markmap !== "function") {
      host.insertAdjacentHTML("beforeend", `<p class="fine">The mind map library did not load. The diagram atlas still has the ecosystem drawing.</p>`);
      return () => {
      };
    }
    const wrap = host.querySelector(".markmap-wrap");
    const width = Math.max(280, Math.round(wrap?.getBoundingClientRect().width || 640));
    const height = 480;
    svg2.setAttribute("width", String(width));
    svg2.setAttribute("height", String(height));
    svg2.setAttribute("viewBox", `0 0 ${width} ${height}`);
    try {
      const motion = document.documentElement.dataset.motion;
      const reduced5 = motion === "reduce" || motion !== "full" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const mm = lib.Markmap.create(svg2, { duration: reduced5 ? 0 : 300 }, mindNode(MIND));
      return () => {
        if (mm && typeof mm.destroy === "function") mm.destroy();
      };
    } catch (err) {
      host.insertAdjacentHTML("beforeend", `<p class="fine">${esc(err.message)}</p>`);
      return () => {
      };
    }
  }

  // campus/js/fx.js
  var TOKENS = [
    ["SIP", "5060"],
    ["SDP", "m="],
    ["RTP", "even"],
    ["SRTP", "3711"],
    ["TLS", "5061"],
    ["NAT", "c="],
    ["ICE", "8445"],
    ["SBC", "B2B"]
  ];
  function paradeHTML() {
    return `<div class="parade" data-parade>${TOKENS.map(([name, mark2], i) => `<span class="token" style="--i:${i}"><b>${name}</b><small>${mark2}</small></span>`).join("")}</div>`;
  }
  function bindParade(root) {
    const parade = root.querySelector("[data-parade]");
    if (!parade) return () => {
    };
    const onMove = (event) => {
      const rect = parade.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      parade.style.setProperty("--tilt-x", `${(-y * 16).toFixed(2)}deg`);
      parade.style.setProperty("--tilt-y", `${(x * 20).toFixed(2)}deg`);
    };
    const onLeave = () => {
      parade.style.removeProperty("--tilt-x");
      parade.style.removeProperty("--tilt-y");
    };
    parade.addEventListener("pointermove", onMove);
    parade.addEventListener("pointerleave", onLeave);
    return () => {
      parade.removeEventListener("pointermove", onMove);
      parade.removeEventListener("pointerleave", onLeave);
    };
  }
  function reduced() {
    const motion = document.documentElement.dataset.motion;
    if (motion === "reduce") return true;
    if (motion === "full") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function countUp(el, value) {
    const end = Number(value) || 0;
    const anime = globalThis.anime;
    if (reduced() || !anime || typeof anime.animate !== "function") {
      el.textContent = String(end);
      return;
    }
    const state = { n: 0 };
    try {
      anime.animate(state, {
        n: end,
        duration: 900,
        onUpdate: () => {
          el.textContent = String(Math.round(state.n));
        }
      });
    } catch {
      el.textContent = String(end);
    }
  }
  function animateStats(root) {
    root.querySelectorAll("[data-count]").forEach((el) => countUp(el, el.dataset.count));
    const anime = globalThis.anime;
    if (reduced() || !anime || typeof anime.animate !== "function") return;
    const nodes = root.querySelectorAll(".token");
    if (!nodes.length) return;
    try {
      anime.animate(nodes, {
        opacity: [0, 1],
        translateY: [14, 0],
        delay: typeof anime.stagger === "function" ? anime.stagger(45) : 0,
        duration: 520
      });
    } catch {
    }
  }
  function burst() {
    const confetti = globalThis.confetti;
    if (reduced() || typeof confetti !== "function") return;
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.65 }, disableForReducedMotion: true });
  }
  function bindReveal(root) {
    const nodes = [...root.querySelectorAll(".card, .atlas-fig, .chart-card, .architect, .panel")];
    const motion = document.documentElement.dataset.motion;
    const reduce = motion === "reduce" || motion !== "full" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver !== "function") {
      nodes.forEach((node) => node.classList.add("is-in"));
      return () => {
      };
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    nodes.forEach((node) => {
      node.classList.add("reveal");
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) node.classList.add("is-in");
      else io.observe(node);
    });
    return () => io.disconnect();
  }
  function bindMenuKeys(root) {
    const nav = root.querySelector(".prime");
    if (!nav) return;
    nav.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const links = [...nav.querySelectorAll("a")];
      const index = links.indexOf(document.activeElement);
      if (index < 0) return;
      event.preventDefault();
      const next = event.key === "ArrowRight" ? (index + 1) % links.length : (index - 1 + links.length) % links.length;
      links[next].focus();
    });
  }

  // campus/js/i18n.js
  var LANGS = [
    { id: "en", label: "English", dir: "ltr" },
    { id: "es", label: "Espa\xF1ol", dir: "ltr" },
    { id: "hi", label: "\u0939\u093F\u0928\u094D\u0926\u0940", dir: "ltr" },
    { id: "te", label: "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41", dir: "ltr" },
    { id: "fr", label: "Fran\xE7ais", dir: "ltr" },
    { id: "de", label: "Deutsch", dir: "ltr" },
    { id: "ja", label: "\u65E5\u672C\u8A9E", dir: "ltr" },
    { id: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", dir: "rtl" }
  ];
  var STR = {
    en: {
      diagrams: "Diagrams",
      flows: "Flows",
      charts: "Charts",
      cheats: "Cheat Codes",
      play: "Play",
      ecosystem: "Ecosystem",
      downloads: "Downloads",
      careers: "Careers",
      regions: "Regions",
      tagline: "Signaling, media, borders",
      greeting: "Follow the signal.",
      heroLead: "Call path, ladders, and borders.",
      start: "Start at the protocol",
      openAtlas: "Open the diagrams",
      listen: "Play the architect clip",
      search: "Search PRACK, CUBE, 488\u2026",
      audioTitle: "Architect notes",
      enlarge: "Enlarge",
      why: "Why this matters"
    },
    es: {
      diagrams: "Diagramas",
      flows: "Flujos",
      charts: "Gr\xE1ficos",
      cheats: "Chuletas",
      play: "Practicar",
      ecosystem: "Ecosistema",
      downloads: "Descargas",
      careers: "Carreras",
      regions: "Regiones",
      tagline: "Se\xF1alizaci\xF3n, medios, fronteras",
      greeting: "Sigue la se\xF1alizaci\xF3n.",
      heroLead: "Ruta de llamada, escaleras y fronteras.",
      start: "Empieza por el protocolo",
      openAtlas: "Abrir diagramas",
      listen: "O\xEDr a los arquitectos",
      search: "Buscar PRACK, CUBE, 488\u2026",
      audioTitle: "Notas del arquitecto",
      enlarge: "Ampliar",
      why: "Por qu\xE9 importa"
    },
    hi: {
      diagrams: "\u0906\u0930\u0947\u0916",
      flows: "\u092A\u094D\u0930\u0935\u093E\u0939",
      charts: "\u091A\u093E\u0930\u094D\u091F",
      cheats: "\u091A\u0940\u091F \u0915\u094B\u0921",
      play: "\u0905\u092D\u094D\u092F\u093E\u0938",
      ecosystem: "\u092A\u093E\u0930\u093F\u0938\u094D\u0925\u093F\u0924\u093F\u0915\u0940",
      downloads: "\u0921\u093E\u0909\u0928\u0932\u094B\u0921",
      careers: "\u0915\u0930\u093F\u092F\u0930",
      regions: "\u0915\u094D\u0937\u0947\u0924\u094D\u0930",
      tagline: "\u0938\u093F\u0917\u094D\u0928\u0932\u093F\u0902\u0917, \u092E\u0940\u0921\u093F\u092F\u093E, \u092C\u0949\u0930\u094D\u0921\u0930",
      greeting: "\u0938\u093F\u0917\u094D\u0928\u0932 \u0915\u093E \u0905\u0928\u0941\u0938\u0930\u0923 \u0915\u0930\u0947\u0902\u0964",
      heroLead: "\u0915\u0949\u0932 \u092A\u0925, \u0932\u0948\u0921\u0930, \u0914\u0930 \u092C\u0949\u0930\u094D\u0921\u0930\u0964",
      start: "\u092A\u094D\u0930\u094B\u091F\u094B\u0915\u0949\u0932 \u0938\u0947 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902",
      openAtlas: "\u0906\u0930\u0947\u0916 \u0916\u094B\u0932\u0947\u0902",
      listen: "\u0906\u0930\u094D\u0915\u093F\u091F\u0947\u0915\u094D\u091F \u0915\u094D\u0932\u093F\u092A \u091A\u0932\u093E\u090F\u0901",
      search: "PRACK, CUBE, 488 \u0916\u094B\u091C\u0947\u0902\u2026",
      audioTitle: "\u0906\u0930\u094D\u0915\u093F\u091F\u0947\u0915\u094D\u091F \u0928\u094B\u091F\u094D\u0938",
      enlarge: "\u092C\u0921\u093C\u093E \u0915\u0930\u0947\u0902",
      why: "\u092F\u0939 \u0915\u094D\u092F\u094B\u0902 \u092E\u093E\u092F\u0928\u0947 \u0930\u0916\u0924\u093E \u0939\u0948"
    },
    te: {
      diagrams: "\u0C2A\u0C1F\u0C3E\u0C32\u0C41",
      flows: "\u0C2A\u0C4D\u0C30\u0C35\u0C3E\u0C39\u0C3E\u0C32\u0C41",
      charts: "\u0C1A\u0C3E\u0C30\u0C4D\u0C1F\u0C41\u0C32\u0C41",
      cheats: "\u0C1A\u0C40\u0C1F\u0C4D \u0C15\u0C4B\u0C21\u0C4D\u0C38\u0C4D",
      play: "\u0C05\u0C2D\u0C4D\u0C2F\u0C3E\u0C38\u0C02",
      ecosystem: "\u0C2A\u0C30\u0C4D\u0C2F\u0C3E\u0C35\u0C30\u0C23\u0C02",
      downloads: "\u0C21\u0C4C\u0C28\u0C4D\u200C\u0C32\u0C4B\u0C21\u0C4D\u0C32\u0C41",
      careers: "\u0C15\u0C46\u0C30\u0C40\u0C30\u0C4D",
      regions: "\u0C2A\u0C4D\u0C30\u0C3E\u0C02\u0C24\u0C3E\u0C32\u0C41",
      tagline: "\u0C38\u0C3F\u0C17\u0C4D\u0C28\u0C32\u0C3F\u0C02\u0C17\u0C4D, \u0C2E\u0C40\u0C21\u0C3F\u0C2F\u0C3E, \u0C2C\u0C3E\u0C30\u0C4D\u0C21\u0C30\u0C4D\u0C32\u0C41",
      greeting: "\u0C38\u0C3F\u0C17\u0C4D\u0C28\u0C32\u0C4D\u200C\u0C28\u0C41 \u0C05\u0C28\u0C41\u0C38\u0C30\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F.",
      heroLead: "\u0C15\u0C3E\u0C32\u0C4D \u0C2A\u0C3E\u0C24\u0C4D, \u0C32\u0C3E\u0C21\u0C30\u0C4D\u0C32\u0C41, \u0C2C\u0C3E\u0C30\u0C4D\u0C21\u0C30\u0C4D\u0C32\u0C41.",
      start: "\u0C2A\u0C4D\u0C30\u0C4B\u0C1F\u0C4B\u0C15\u0C3E\u0C32\u0C4D \u0C35\u0C26\u0C4D\u0C26 \u0C2A\u0C4D\u0C30\u0C3E\u0C30\u0C02\u0C2D\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F",
      openAtlas: "\u0C2A\u0C1F\u0C3E\u0C32\u0C41 \u0C24\u0C46\u0C30\u0C35\u0C02\u0C21\u0C3F",
      listen: "\u0C06\u0C30\u0C4D\u0C15\u0C3F\u0C1F\u0C46\u0C15\u0C4D\u0C1F\u0C4D \u0C15\u0C4D\u0C32\u0C3F\u0C2A\u0C4D \u0C2A\u0C4D\u0C32\u0C47 \u0C1A\u0C47\u0C2F\u0C02\u0C21\u0C3F",
      search: "PRACK, CUBE, 488 \u0C35\u0C46\u0C24\u0C15\u0C02\u0C21\u0C3F\u2026",
      audioTitle: "\u0C06\u0C30\u0C4D\u0C15\u0C3F\u0C1F\u0C46\u0C15\u0C4D\u0C1F\u0C4D \u0C28\u0C4B\u0C1F\u0C4D\u0C38\u0C4D",
      enlarge: "\u0C2A\u0C46\u0C26\u0C4D\u0C26\u0C26\u0C3F\u0C17\u0C3E",
      why: "\u0C07\u0C26\u0C3F \u0C0E\u0C02\u0C26\u0C41\u0C15\u0C41 \u0C2E\u0C41\u0C16\u0C4D\u0C2F\u0C02"
    },
    fr: {
      diagrams: "Sch\xE9mas",
      flows: "Flux",
      charts: "Graphiques",
      cheats: "Antis\xE8ches",
      play: "Jouer",
      ecosystem: "\xC9cosyst\xE8me",
      downloads: "T\xE9l\xE9chargements",
      careers: "Parcours",
      regions: "R\xE9gions",
      tagline: "Signalisation, m\xE9dia, fronti\xE8res",
      greeting: "Suivez la signalisation.",
      heroLead: "Chemin d'appel, \xE9chelles et fronti\xE8res.",
      start: "Commencer par le protocole",
      openAtlas: "Ouvrir les sch\xE9mas",
      listen: "\xC9couter les architectes",
      search: "Chercher PRACK, CUBE, 488\u2026",
      audioTitle: "Notes d'architecte",
      enlarge: "Agrandir",
      why: "Pourquoi c'est important"
    },
    de: {
      diagrams: "Diagramme",
      flows: "Abl\xE4ufe",
      charts: "Schaubilder",
      cheats: "Spickzettel",
      play: "\xDCben",
      ecosystem: "\xD6kosystem",
      downloads: "Downloads",
      careers: "Laufbahn",
      regions: "Regionen",
      tagline: "Signalisierung, Medien, Grenzen",
      greeting: "Folge der Signalisierung.",
      heroLead: "Rufpfad, Leitern und Grenzen.",
      start: "Beim Protokoll starten",
      openAtlas: "Diagramme \xF6ffnen",
      listen: "Architektengespr\xE4ch abspielen",
      search: "PRACK, CUBE, 488 suchen\u2026",
      audioTitle: "Architektennotizen",
      enlarge: "Vergr\xF6\xDFern",
      why: "Warum das z\xE4hlt"
    },
    ja: {
      diagrams: "\u56F3",
      flows: "\u30D5\u30ED\u30FC",
      charts: "\u30B0\u30E9\u30D5",
      cheats: "\u65E9\u898B\u8868",
      play: "\u7DF4\u7FD2",
      ecosystem: "\u30A8\u30B3\u30B7\u30B9\u30C6\u30E0",
      downloads: "\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
      careers: "\u30AD\u30E3\u30EA\u30A2",
      regions: "\u5730\u57DF",
      tagline: "\u30B7\u30B0\u30CA\u30EA\u30F3\u30B0\u3001\u30E1\u30C7\u30A3\u30A2\u3001\u5883\u754C",
      greeting: "\u4FE1\u53F7\u3092\u8FFD\u3046\u3002",
      heroLead: "\u30B3\u30FC\u30EB\u30D1\u30B9\u3001\u30E9\u30C0\u30FC\u3001\u30DC\u30FC\u30C0\u30FC\u3002",
      start: "\u30D7\u30ED\u30C8\u30B3\u30EB\u304B\u3089\u59CB\u3081\u308B",
      openAtlas: "\u56F3\u3092\u958B\u304F",
      listen: "\u5EFA\u7BC9\u5BB6\u30AF\u30EA\u30C3\u30D7\u3092\u518D\u751F",
      search: "PRACK\u3001CUBE\u3001488 \u3092\u691C\u7D22\u2026",
      audioTitle: "\u30A2\u30FC\u30AD\u30C6\u30AF\u30C8\u306E\u30E1\u30E2",
      enlarge: "\u62E1\u5927",
      why: "\u306A\u305C\u91CD\u8981\u304B"
    },
    ar: {
      diagrams: "\u0627\u0644\u0645\u062E\u0637\u0637\u0627\u062A",
      flows: "\u0627\u0644\u062A\u062F\u0641\u0642\u0627\u062A",
      charts: "\u0627\u0644\u0631\u0633\u0648\u0645",
      cheats: "\u0623\u0648\u0631\u0627\u0642 \u0627\u0644\u0645\u0631\u062C\u0639",
      play: "\u062A\u062F\u0631\u064A\u0628",
      ecosystem: "\u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629",
      downloads: "\u0627\u0644\u062A\u0646\u0632\u064A\u0644\u0627\u062A",
      careers: "\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A",
      regions: "\u0627\u0644\u0645\u0646\u0627\u0637\u0642",
      tagline: "\u0625\u0634\u0627\u0631\u0627\u062A \u0648\u0648\u0633\u0627\u0626\u0637 \u0648\u062D\u062F\u0648\u062F",
      greeting: "\u0627\u062A\u0628\u0639 \u0627\u0644\u0625\u0634\u0627\u0631\u0629.",
      heroLead: "\u0645\u0633\u0627\u0631 \u0627\u0644\u0646\u062F\u0627\u0621\u060C \u0648\u0627\u0644\u0633\u0644\u0627\u0644\u0645\u060C \u0648\u0627\u0644\u062D\u062F\u0648\u062F.",
      start: "\u0627\u0628\u062F\u0623 \u0645\u0646 \u0627\u0644\u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644",
      openAtlas: "\u0627\u0641\u062A\u062D \u0627\u0644\u0645\u062E\u0637\u0637\u0627\u062A",
      listen: "\u062A\u0634\u063A\u064A\u0644 \u062D\u0648\u0627\u0631 \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A\u064A\u0646",
      search: "\u0627\u0628\u062D\u062B \u0639\u0646 PRACK \u0623\u0648 CUBE \u0623\u0648 488\u2026",
      audioTitle: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A",
      enlarge: "\u062A\u0643\u0628\u064A\u0631",
      why: "\u0644\u0645\u0627\u0630\u0627 \u0647\u0630\u0627 \u0645\u0647\u0645"
    }
  };
  var active = "en";
  function t(key) {
    return STR[active] && STR[active][key] || STR.en[key] || key;
  }
  function applyLang(lang) {
    const meta = LANGS.find((item) => item.id === lang) || LANGS[0];
    active = meta.id;
    document.documentElement.lang = meta.id;
    document.documentElement.dir = meta.dir;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const value = t(el.dataset.i18n);
      if (value) el.textContent = value;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
    });
    document.querySelectorAll("[data-lang-select]").forEach((sel) => {
      if (sel.value !== meta.id) sel.value = meta.id;
    });
    const line = document.querySelector("#mascot-line");
    if (line) line.textContent = t("greeting");
  }

  // campus/js/field.js
  var BADGE_KEY = "sip-universe-badges";
  var BADGES = [
    { id: "read", name: "First trace", detail: "Mark a lesson read." },
    { id: "quiz", name: "Eighty", detail: "Score at least 80% on a lesson quiz." },
    { id: "lab", name: "Bench", detail: "Pass a lesson lab check." },
    { id: "ports", name: "Port clerk", detail: "Score 6 or more on the ports game." },
    { id: "ports-perfect", name: "Clean matrix", detail: "A perfect ports round." },
    { id: "builder", name: "Ladderwright", detail: "Build a flow with at least four hops." },
    { id: "daily", name: "Today", detail: "Finish the daily challenge." },
    { id: "explorer", name: "Cartographer", detail: "Open five nodes on the flow map." },
    { id: "offline", name: "Pocket campus", detail: "Download the offline zip." },
    { id: "konami", name: "Branch cookie", detail: "The old joystick code. It only changes the mascot." }
  ];
  function badgeState() {
    try {
      return JSON.parse(localStorage.getItem(BADGE_KEY) || "{}");
    } catch {
      return {};
    }
  }
  function noteBadge(id) {
    const known = BADGES.find((item) => item.id === id);
    if (!known) return false;
    const state = badgeState();
    if (state[id]) return false;
    state[id] = (/* @__PURE__ */ new Date()).toISOString();
    localStorage.setItem(BADGE_KEY, JSON.stringify(state));
    const toast = document.querySelector("#toast");
    if (toast) toast.textContent = `Badge: ${known.name}. ${known.detail}`;
    return true;
  }
  var POSES = [
    { id: "wave", line: "Follow the Via." },
    { id: "point", line: "The branch is the transaction." },
    { id: "think", line: "Port 0 means rejected." },
    { id: "cheer", line: "ACK the 200." }
  ];
  var LOOKS = ["classic", "visor", "phones", "scarf"];
  function paintLook() {
    const mascot = document.querySelector("#mascot");
    if (!mascot) return;
    const theme = document.documentElement.dataset.theme || "holographic";
    const map = { holographic: 1, neon: 2, cyberpunk: 2, sunset: 3, light: 0, futuristic: 1, gaming: 2, observatory: 0, daylight: 0, contrast: 0, phosphor: 1 };
    const shift = Math.floor(Date.now() / 18e4);
    mascot.dataset.look = LOOKS[((map[theme] ?? 0) + shift) % LOOKS.length];
  }
  function startMascot() {
    const mascot = document.querySelector("#mascot");
    const line = document.querySelector("#mascot-line");
    if (!mascot || !line) return;
    let index = 0;
    const tick = () => {
      paintLook();
      if (document.documentElement.dataset.motion === "reduce") return;
      const pose = POSES[index % POSES.length];
      mascot.dataset.pose = pose.id;
      if (index % POSES.length !== 0) line.textContent = pose.line;
      index += 1;
    };
    tick();
    window.setInterval(tick, 7e3);
    window.setInterval(paintLook, 6e4);
    onSettings(paintLook);
  }
  var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
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
    const paint2 = () => {
      const theme = getSettings().theme;
      document.querySelectorAll("[data-set-theme]").forEach((button) => {
        button.setAttribute("aria-pressed", button.dataset.setTheme === theme ? "true" : "false");
      });
    };
    document.querySelectorAll("[data-set-theme]").forEach((button) => {
      button.addEventListener("click", () => {
        const theme = button.dataset.setTheme;
        if (theme !== "light") localStorage.setItem("sip-universe-dark", theme);
        saveSettings({ theme });
      });
    });
    onSettings(paint2);
    paint2();
  }
  function bindProgressBar() {
    const bar = document.querySelector("#read-progress");
    if (!bar) return;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, window.scrollY / max * 100) : 0;
      bar.style.width = `${pct}%`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
  function bindOffline(catalog2) {
    const run = async () => {
      const status = document.querySelector("#pack-status");
      try {
        await downloadPack(catalog2);
        noteBadge("offline");
      } catch (err) {
        if (status) status.textContent = err.message;
      }
    };
    document.querySelectorAll("[data-offline]").forEach((button) => {
      button.addEventListener("click", run);
    });
  }
  function bindLang() {
    document.querySelectorAll("#lang, #menu-lang").forEach((lang) => {
      lang.value = getSettings().lang || "en";
      lang.addEventListener("change", () => {
        saveSettings({ lang: lang.value });
      });
    });
    const toggle = document.querySelector("#theme-toggle");
    const paintToggle = () => {
      if (!toggle) return;
      const theme = getSettings().theme;
      const light = theme === "light" || theme === "daylight";
      toggle.textContent = light ? "Dark" : "Light";
      toggle.setAttribute("aria-pressed", light ? "true" : "false");
    };
    toggle?.addEventListener("click", () => {
      const theme = getSettings().theme;
      if (theme === "light" || theme === "daylight") saveSettings({ theme: localStorage.getItem("sip-universe-dark") || "neon" });
      else {
        localStorage.setItem("sip-universe-dark", theme);
        saveSettings({ theme: "light" });
      }
    });
    onSettings((settings2) => applyLang(settings2.lang || "en"));
    onSettings(paintToggle);
    paintToggle();
    applyLang(getSettings().lang || "en");
  }
  function bindChrome(catalog2) {
    startMascot();
    bindKonami();
    bindSwatches();
    bindLang();
    bindProgressBar();
    bindOffline(catalog2);
    bindMenuKeys(document);
    bindLightbox();
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
  function guideIndex(data, ctx2) {
    ctx2.setTitle("Field guide");
    return `<p class="lede">${esc(data.summary)} Checked ${esc(data.checked)}.</p>
    <div class="card-grid">${data.sections.map((section) => `<a class="card" href="#/guide/${esc(section.id)}">
      <span class="kicker">${esc(section.kicker)}</span><h3>${esc(section.title)}</h3><p>${esc(section.summary)}</p></a>`).join("")}</div>`;
  }
  function searchField(data, q) {
    const needle = q.toLowerCase();
    if (!needle || !data) return [];
    return data.sections.filter((section) => `${section.title} ${section.summary}`.toLowerCase().includes(needle)).map((section) => ({ href: `#/guide/${section.id}`, title: section.title, summary: section.summary }));
  }
  async function tryFieldRoute(path, view2, ctx2) {
    if (path === "#/atlas") {
      ctx2.setTitle("Diagram atlas");
      const animated = ATLAS.filter((item) => item.animated).length;
      const notes = ATLAS.slice(0, 8).map((item) => `<li><a href="#atlas-${esc(item.id)}">${esc(item.title)}</a></li>`).join("");
      view2.innerHTML = `<div class="stage-flow">
      <header class="stage-inline">
        <canvas class="glyph-view side-live" data-glyph="sip-core" width="320" height="320" aria-hidden="true"></canvas>
        <div class="stage-copy"><p class="lede">${ATLAS.length} diagrams, ${animated} of them animated call, signal, or data flows. Reduced motion keeps the drawing and drops the traveling packet.</p></div>
        <aside class="stage-calls">
          <h2>Read these first</h2>
          <ol>${notes}</ol>
          <p class="fine">Enlarge a ladder to play, pause, and step the packet. The caption says why that hop matters.</p>
        </aside>
      </header>
      <div class="atlas-grid">${ATLAS.map(figureHTML).join("")}</div>
    </div>`;
      return () => {
      };
    }
    if (path === "#/flows") {
      ctx2.setTitle("Flows");
      const flows = ATLAS.filter((item) => item.animated);
      const notes = flows.slice(0, 8).map((item) => `<li><a href="#atlas-${esc(item.id)}">${esc(item.title)}</a><span class="fine"> ${esc(item.caption)}</span></li>`).join("");
      view2.innerHTML = `<div class="stage-flow">
      <header class="stage-inline">
        <canvas class="glyph-view side-live" data-glyph="call-flows" width="320" height="320" aria-hidden="true"></canvas>
        <div class="stage-copy"><p class="lede">${flows.length} animated flows: INVITE, REGISTER, transfer, hold, forking, early media, NAT, TLS, and SRTP among them.</p></div>
        <aside class="stage-calls">
          <h2>Why these flows</h2>
          <ol>${notes}</ol>
        </aside>
      </header>
      ${paradeHTML()}
      <div class="atlas-grid">${flows.map(figureHTML).join("")}</div>
    </div>`;
      return bindParade(view2);
    }
    if (path === "#/charts") {
      const ports = await loadJSON("data/ports.json");
      ctx2.setTitle("Charts");
      const notes = CHARTS.map((chart) => `<li><a href="#chart-${esc(chart.id)}">${esc(chart.title)}</a><span class="fine"> ${esc(chart.source)}</span></li>`).join("");
      view2.innerHTML = `<div class="stage-flow">
      <header class="stage-inline">
        <canvas class="glyph-view side-live" data-glyph="operations" width="320" height="320" aria-hidden="true"></canvas>
        <div class="stage-copy"><p class="lede">${CHARTS.length} charts from the catalog, the ports table, and lesson tags. The topic map uses markmap.</p></div>
        <aside class="stage-calls">
          <h2>Where the numbers come from</h2>
          <ol>${notes}</ol>
          <p class="fine">Hover a bar for the value. The source line under each chart is the citation.</p>
        </aside>
      </header>
      ${paradeHTML()}
      ${chartsHTML(ctx2.catalog, ports)}
      <h2>Topic map</h2>
      <div id="mind-host"></div>
    </div>`;
      paintRoughTotals(view2, ctx2.catalog);
      animateCharts(view2);
      const stopMind = mountMind(view2.querySelector("#mind-host"));
      const stopParade = bindParade(view2);
      const stopTips = bindChartTips(view2);
      return () => {
        stopParade();
        stopMind();
        stopTips();
      };
    }
    if (path === "#/regions") {
      ctx2.setTitle("Regions");
      view2.innerHTML = `<p class="lede">SIP itself has no country. What follows is either a cited fact or marked as an example.</p>
      <h2>Cited</h2>
      <ul>
        <li>SIP creates, modifies, and ends sessions. <a href="https://www.rfc-editor.org/rfc/rfc3261">RFC 3261</a>. It does not name a country, a carrier, or a data-residency region.</li>
        <li>Public telephone numbers follow ITU-T E.164. This page does not restate national numbering plans.</li>
        <li>United States multi-line telephone systems: FCC MLTS rules, and <a href="https://www.rfc-editor.org/rfc/rfc6881">RFC 6881</a> as a best current practice for emergency services. This is not legal advice.</li>
        <li>Microsoft Teams Direct Routing, Microsoft Learn, fetched 2026-10-15: signaling TCP 5061 toward sip.pstnhub.microsoft.com, sip2.pstnhub.microsoft.com, and sip3.pstnhub.microsoft.com. Media UDP 3478\u20133481 and 49152\u201353247. Ranges 52.112.0.0/14 and 52.120.0.0/14. Those are Microsoft cloud addresses, not a map of countries.</li>
      </ul>
      <h2>Example region board</h2>
      <p class="callout">Example only. Not coverage, not a carrier map, and not a data-residency guarantee. A calling code does not mean this campus or any SBC serves that place.</p>
      <div class="region-board">
        <article class="card"><p class="region-flag" aria-hidden="true">\u{1F1FA}\u{1F1F8}</p><h3>NANP</h3><p>+1</p><p class="fine">Example symbol. Not a coverage claim.</p></article>
        <article class="card"><p class="region-flag" aria-hidden="true">\u{1F1EA}\u{1F1FA}</p><h3>Europe</h3><p>+33 \xB7 +49</p><p class="fine">Example symbols. Not a coverage claim.</p></article>
        <article class="card"><p class="region-flag" aria-hidden="true">\u{1F1EE}\u{1F1F3}</p><h3>India</h3><p>+91</p><p class="fine">Example symbol. Not a coverage claim.</p></article>
        <article class="card"><p class="region-flag" aria-hidden="true">\u{1F1EF}\u{1F1F5}</p><h3>Japan</h3><p>+81</p><p class="fine">Example symbol. Not a coverage claim.</p></article>
        <article class="card"><p class="region-flag" aria-hidden="true">\u{1F1E6}\u{1F1EA}</p><h3>UAE</h3><p>+971</p><p class="fine">Example symbol. Not a coverage claim.</p></article>
        <article class="card"><p class="region-flag" aria-hidden="true">\u{1F1E7}\u{1F1F7}</p><h3>Brazil</h3><p>+55</p><p class="fine">Example symbol. Not a coverage claim.</p></article>
      </div>
      <p class="fine">Where a recording or a trunk is stored is a product and contract question. Unverified here.</p>`;
      return () => {
      };
    }
    if (path === "#/ports") {
      const data = await loadJSON("data/ports.json");
      ctx2.setTitle("Ports and protocols");
      view2.innerHTML = `<p class="lede">${esc(data.summary)} Read ${esc(data.checked)}.</p>
      <div class="scroll"><table><thead><tr><th scope="col">Name</th><th scope="col">Port</th><th scope="col">Transport</th><th scope="col">Why it is here</th><th scope="col">Source</th></tr></thead><tbody>
        ${data.rows.map((row2) => `<tr><th scope="row">${esc(row2.name)}</th><td>${esc(row2.port)}</td><td>${esc(row2.transport)}</td><td>${esc(row2.purpose)} ${esc(row2.note)}</td><td><a href="${esc(row2.cite.url)}">${esc(row2.cite.label)}</a></td></tr>`).join("")}
      </tbody></table></div>
      <h2>Firewall matrix</h2>
      <div class="scroll"><table><thead><tr><th scope="col">Flow</th><th scope="col">From</th><th scope="col">To</th><th scope="col">Transport</th><th scope="col">Ports</th><th scope="col">Source</th></tr></thead><tbody>
        ${data.matrix.map((row2) => `<tr><th scope="row">${esc(row2.flow)}</th><td>${esc(row2.from)}</td><td>${esc(row2.to)}</td><td>${esc(row2.transport)}</td><td>${esc(row2.ports)}</td><td>${esc(row2.source)}</td></tr>`).join("")}
      </tbody></table></div>
      <p><a class="btn" href="#/play/ports">Play the ports game</a></p>`;
      return () => {
      };
    }
    if (path === "#/downloads") {
      const manifest = await loadJSON("downloads/manifest.json");
      ctx2.setTitle("Cheat codes");
      view2.innerHTML = `<p class="lede">One-page sheets and a printable flashcard deck, generated into this repo. Each file carries the campus footer.</p>
      <div class="card-grid">${manifest.items.map((item) => `<article class="card">
        ${iconHTML("operations")}
        <span class="kicker">${esc(item.topic)}</span>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.blurb)}</p>
        <p class="fine">
          ${item.html ? `<a href="${esc(item.html)}">HTML</a>` : ""}
          ${item.pdf ? ` \xB7 <a href="${esc(item.pdf)}">PDF</a>` : ""}
          ${item.png ? ` \xB7 <a href="${esc(item.png)}">PNG</a>` : ""}
          ${item.json ? ` \xB7 <a href="${esc(item.json)}">JSON</a>` : ""}
        </p>
      </article>`).join("")}</div>
      <p class="fine">The offline zip is the full campus, including these files. The status line is in the footer.</p>`;
      return () => {
      };
    }
    if (path === "#/badges") {
      ctx2.setTitle("Badges");
      const state = badgeState();
      const earned = BADGES.filter((item) => state[item.id]).length;
      view2.innerHTML = `<p class="lede">${earned} of ${BADGES.length} earned in this browser.</p>
      <div class="card-grid">${BADGES.map((item) => `<article class="card ${state[item.id] ? "is-earned" : ""}">
        <span class="kicker">${state[item.id] ? "Earned" : "Locked"}</span>
        <h3>${esc(item.name)}</h3><p>${esc(item.detail)}</p>
        ${state[item.id] ? `<p class="fine">${esc(state[item.id])}</p>` : ""}
      </article>`).join("")}</div>`;
      return () => {
      };
    }
    if (path === "#/progress") {
      ctx2.setTitle("Progress");
      const raw = JSON.parse(localStorage.getItem("sip-universe-progress") || '{"lessons":{}}');
      const rows = Object.entries(raw.lessons || {});
      const read = rows.filter(([, row2]) => row2.read).length;
      const quizzed = rows.filter(([, row2]) => row2.quizN).length;
      view2.innerHTML = `<p class="lede">${read} lessons marked read. ${quizzed} quizzes scored. ${ctx2.catalog.stats.lessons} lessons in the catalog.</p>
      <div class="stat-row">
        <div class="stat"><b>${rows.length}</b> touched</div>
        <div class="stat"><b>${read}</b> marked read</div>
        <div class="stat"><b>${quizzed}</b> quizzes scored</div>
        <div class="stat"><b>${BADGES.filter((item) => badgeState()[item.id]).length}</b> badges</div>
      </div>
      <p><a href="#/tracks">Back to the tracks</a></p>`;
      return () => {
      };
    }
    if (path === "#/play" || path.startsWith("#/play/") || path === "#/explorer") {
      return route(path, view2, { ...ctx2, noteBadge });
    }
    if (path === "#/guide" || path === "#/roadmap" || path === "#/career") {
      const data = await loadJSON("data/fieldguide.json");
      if (path === "#/guide") {
        view2.innerHTML = guideIndex(data, ctx2);
        return () => {
        };
      }
      const id = path === "#/roadmap" ? "roadmap" : "career";
      return renderSection(data, id, view2, ctx2);
    }
    const match = path.match(/^#\/guide\/([\w-]+)$/);
    if (match) {
      const data = await loadJSON("data/fieldguide.json");
      return renderSection(data, match[1], view2, ctx2);
    }
    return null;
  }
  function renderSection(data, id, view2, ctx2) {
    const section = data.sections.find((item) => item.id === id);
    if (!section) return null;
    ctx2.setTitle(section.title);
    const trackList = id === "roadmap" && ctx2.catalog ? `<h2>Track order</h2><ol>${ctx2.catalog.tracks.map((track) => `<li><a href="#/track/${esc(track.id)}">${esc(track.title)}</a></li>`).join("")}</ol>` : "";
    const banner = id === "career" ? iconHTML("capstone") : "";
    view2.innerHTML = `${banner}<p class="crumbs"><a href="#/guide">Field guide</a> / ${esc(section.title)}</p>
    <p class="lede">${esc(section.summary)}</p>
    ${section.blocks.map(blockHTML).join("")}
    ${trackList}`;
    return () => {
    };
  }

  // campus/js/parse.js
  var STATIC_PT = {
    0: "PCMU/8000",
    3: "GSM/8000",
    4: "G723/8000",
    8: "PCMA/8000",
    9: "G722/8000",
    15: "G728/8000",
    18: "G729/8000"
  };
  var COMPACT = {
    c: "Content-Type",
    e: "Content-Encoding",
    f: "From",
    i: "Call-ID",
    k: "Supported",
    l: "Content-Length",
    m: "Contact",
    s: "Subject",
    t: "To",
    v: "Via",
    o: "Event",
    u: "Allow-Events",
    r: "Refer-To",
    b: "Referred-By"
  };
  var METHODS = /* @__PURE__ */ new Set([
    "INVITE",
    "ACK",
    "BYE",
    "CANCEL",
    "REGISTER",
    "OPTIONS",
    "PRACK",
    "UPDATE",
    "INFO",
    "REFER",
    "NOTIFY",
    "SUBSCRIBE",
    "MESSAGE",
    "PUBLISH"
  ]);
  function unfold(text2) {
    const raw = String(text2 || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = raw.split("\n");
    const out = [];
    for (const line of lines) {
      if ((line.startsWith(" ") || line.startsWith("	")) && out.length) {
        out[out.length - 1] += " " + line.trim();
      } else {
        out.push(line);
      }
    }
    return out;
  }
  function headerName(raw) {
    const compact = raw.length === 1 ? raw.toLowerCase() : null;
    const long = compact && COMPACT[compact] ? COMPACT[compact] : raw;
    return { name: long, compact: compact && COMPACT[compact] ? raw : null };
  }
  function dissect(text2) {
    const warnings = [];
    const lines = unfold(text2);
    while (lines.length && lines[0].trim() === "") lines.shift();
    if (!lines.length || !lines[0].trim()) {
      return { ok: false, warnings: [{ level: "warn", text: "No SIP start line found." }], headers: [], body: "" };
    }
    const start = lines[0].trim();
    const headers = [];
    let i = 1;
    for (; i < lines.length; i++) {
      if (lines[i].trim() === "") {
        i++;
        break;
      }
      const line = lines[i];
      const colon = line.indexOf(":");
      if (colon <= 0) {
        warnings.push({ level: "warn", text: `Header line has no name: ${line.slice(0, 80)}` });
        continue;
      }
      const rawName = line.slice(0, colon).trim();
      const value = line.slice(colon + 1).trim();
      const named = headerName(rawName);
      headers.push({ ...named, rawName, value });
    }
    const body = lines.slice(i).join("\n");
    const request = METHODS.has(start.split(/\s+/)[0]);
    const response = /^SIP\/2\.0\s+\d{3}/.test(start);
    const result = {
      ok: request || response,
      kind: request ? "request" : response ? "response" : "unknown",
      start,
      method: null,
      uri: null,
      status: null,
      reason: null,
      headers,
      body,
      warnings
    };
    if (request) {
      const parts = start.split(/\s+/);
      result.method = parts[0];
      result.uri = parts[1] || "";
      if (!/^SIP\/2\.0$/.test(parts[2] || "")) warnings.push({ level: "warn", text: "Request version is not SIP/2.0." });
    } else if (response) {
      const m = start.match(/^SIP\/2\.0\s+(\d{3})\s*(.*)$/);
      result.status = m ? Number(m[1]) : null;
      result.reason = m ? m[2] : "";
    } else {
      warnings.push({ level: "warn", text: "Start line is neither a known request nor a SIP/2.0 response." });
    }
    const has = (name) => headers.some((h) => h.name.toLowerCase() === name.toLowerCase());
    const first = (name) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
    for (const required of ["Via", "From", "To", "Call-ID", "CSeq"]) {
      if (!has(required)) warnings.push({ level: "warn", text: `Missing ${required}.` });
    }
    if (request && !has("Max-Forwards")) warnings.push({ level: "warn", text: "Request has no Max-Forwards." });
    const via = first("Via");
    if (via && !/branch=z9hG4bK/i.test(via.value)) {
      warnings.push({ level: "warn", text: "Via branch does not start with the RFC 3261 magic cookie z9hG4bK." });
    }
    const cseq = first("CSeq");
    if (cseq && result.method && !new RegExp(`\\s${result.method}$`, "i").test(cseq.value.trim())) {
      warnings.push({ level: "warn", text: "CSeq method does not match the request method." });
    }
    const len = first("Content-Length");
    if (len) {
      const n = Number(len.value);
      const actual = new TextEncoder().encode(body.replace(/\n/g, "\r\n")).length;
      const lf = new TextEncoder().encode(body).length;
      if (Number.isFinite(n) && n !== actual && n !== lf) {
        warnings.push({ level: "warn", text: `Content-Length is ${n} but the body is ${lf} bytes (LF) / ${actual} bytes (CRLF).` });
      }
    }
    if (result.method === "INVITE" && !has("Contact")) {
      warnings.push({ level: "info", text: "Dialog-forming INVITE has no Contact." });
    }
    const to = first("To");
    if (request && to && /;tag=/i.test(to.value)) result.inDialog = true;
    if (request && to && !/;tag=/i.test(to.value)) result.inDialog = false;
    return result;
  }
  function parseMedia(text2) {
    const lines = String(text2 || "").replace(/\r/g, "").split("\n").map((l) => l.trim()).filter((l) => l.length);
    const session2 = [];
    const media = [];
    let cur = null;
    for (const line of lines) {
      if (line.startsWith("m=")) {
        const p = line.slice(2).trim().split(/\s+/);
        cur = {
          type: p[0] || "",
          port: Number(p[1]),
          proto: p[2] || "",
          pts: p.slice(3),
          rtpmap: {},
          fmtp: {},
          dir: null,
          raw: [line]
        };
        media.push(cur);
      } else if (cur) {
        cur.raw.push(line);
        if (line.startsWith("a=rtpmap:")) {
          const body = line.slice(9);
          const sp = body.indexOf(" ");
          if (sp > 0) cur.rtpmap[body.slice(0, sp)] = body.slice(sp + 1);
        } else if (line.startsWith("a=fmtp:")) {
          const body = line.slice(7);
          const sp = body.indexOf(" ");
          if (sp > 0) cur.fmtp[body.slice(0, sp)] = body.slice(sp + 1);
        } else if (/^a=(sendrecv|sendonly|recvonly|inactive)$/.test(line)) {
          cur.dir = line.slice(2);
        }
      } else {
        session2.push(line);
      }
    }
    return { session: session2, media };
  }
  function codecName(pt, rtpmap) {
    if (rtpmap[pt]) return rtpmap[pt].split("/")[0].toUpperCase();
    if (Object.prototype.hasOwnProperty.call(STATIC_PT, Number(pt))) return STATIC_PT[Number(pt)].split("/")[0];
    return null;
  }
  function directionResult(offer, answer) {
    const o = offer || "sendrecv";
    const a = answer || "sendrecv";
    const legal = {
      sendrecv: ["sendrecv", "sendonly", "recvonly", "inactive"],
      sendonly: ["recvonly", "inactive"],
      recvonly: ["sendonly", "inactive"],
      inactive: ["inactive"]
    };
    const ok = (legal[o] || []).includes(a);
    return { offer: o, answer: a, result: a, ok };
  }
  function negotiate(offerText, answerText) {
    const offer = parseMedia(offerText);
    const answer = parseMedia(answerText);
    const notes = [];
    if (!offer.media.length) notes.push({ level: "warn", text: "Offer has no m-lines." });
    if (offer.media.length !== answer.media.length) {
      notes.push({ level: "warn", text: `Offer has ${offer.media.length} m-lines and the answer has ${answer.media.length}. RFC 3264 requires the same number, in the same order.` });
    }
    const count = Math.max(offer.media.length, answer.media.length);
    const streams = [];
    for (let i = 0; i < count; i++) {
      const o = offer.media[i];
      const a = answer.media[i];
      if (!o || !a) {
        streams.push({ index: i, missing: !o ? "offer" : "answer" });
        continue;
      }
      const stream = {
        index: i,
        type: o.type,
        answerType: a.type,
        rejected: a.port === 0,
        offerPort: o.port,
        answerPort: a.port,
        offerProto: o.proto,
        answerProto: a.proto,
        codecs: [],
        dropped: [],
        direction: directionResult(o.dir, a.dir),
        dtmf: "none"
      };
      if (o.type !== a.type) notes.push({ level: "warn", text: `m-line ${i + 1} type ${o.type} was answered as ${a.type}.` });
      if (o.proto !== a.proto) notes.push({ level: "warn", text: `m-line ${i + 1} protocol ${o.proto} was answered as ${a.proto}. RTP/AVP and RTP/SAVP do not interchange.` });
      const offerKeys = o.pts.map((pt) => ({ pt, name: codecName(pt, o.rtpmap) || `PT${pt}` }));
      const answerByName = /* @__PURE__ */ new Map();
      for (const pt of a.pts) {
        const name = codecName(pt, a.rtpmap) || `PT${pt}`;
        if (!answerByName.has(name)) answerByName.set(name, pt);
      }
      for (const item of offerKeys) {
        if (answerByName.has(item.name)) {
          stream.codecs.push({ name: item.name, offerPt: item.pt, answerPt: answerByName.get(item.name) });
        } else {
          stream.dropped.push(item.name);
        }
      }
      const names = new Set(stream.codecs.map((c) => c.name));
      const oDtmf = offerKeys.some((c) => c.name === "TELEPHONE-EVENT");
      const aDtmf = [...answerByName.keys()].includes("TELEPHONE-EVENT");
      stream.dtmf = oDtmf && aDtmf ? "both" : oDtmf ? "offer" : aDtmf ? "answer" : "none";
      if (stream.dtmf === "offer" || stream.dtmf === "answer") {
        notes.push({ level: "info", text: `m-line ${i + 1}: telephone-event is only in the ${stream.dtmf}. RFC 4733 DTMF may not pass.` });
      }
      if (!stream.rejected && stream.codecs.filter((c) => c.name !== "TELEPHONE-EVENT").length === 0) {
        notes.push({ level: "warn", text: `m-line ${i + 1} has no shared audio codec.` });
      }
      if (!stream.direction.ok) {
        notes.push({ level: "warn", text: `m-line ${i + 1}: answer direction ${stream.direction.answer} does not fit an offer of ${stream.direction.offer}.` });
      }
      if (!names.size && !stream.rejected) notes.push({ level: "warn", text: `m-line ${i + 1} negotiated no payload types.` });
      streams.push(stream);
    }
    return { ok: notes.every((n) => n.level !== "warn"), notes, streams };
  }
  function safeRegExp(source) {
    const src = String(source || "");
    if (src.length > 180) throw new Error("Pattern is longer than 180 characters.");
    if (/(\*|\+|\{[^}]*\})\s*\)?\s*(\*|\+|\{)/.test(src)) throw new Error("Nested quantifiers are blocked in this sandbox.");
    return new RegExp(src, "g");
  }
  function splitMessage(text2) {
    const lines = String(text2 || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    const start = lines[0] || "";
    const headers = [];
    let i = 1;
    for (; i < lines.length; i++) {
      if (lines[i] === "") {
        i++;
        break;
      }
      headers.push(lines[i]);
    }
    const body = lines.slice(i).join("\n");
    return { start, headers, body };
  }
  function joinMessage(start, headers, body) {
    const head = [start, ...headers];
    const bytes = new TextEncoder().encode(body.replace(/\n/g, "\r\n")).length;
    const next = [];
    let seen = false;
    for (const line of head.slice(1)) {
      if (/^content-length\s*:/i.test(line)) {
        next.push(`Content-Length: ${body ? bytes : 0}`);
        seen = true;
      } else next.push(line);
    }
    if (!seen) next.push(`Content-Length: ${body ? bytes : 0}`);
    return [head[0], ...next, "", body].join("\n").replace(/\n$/, body ? "\n" : "\n");
  }
  function headerKey(line) {
    const i = line.indexOf(":");
    return i > 0 ? line.slice(0, i).trim().toLowerCase() : "";
  }
  function requestMethod(start) {
    const p = start.split(/\s+/);
    return METHODS.has(p[0]) ? p[0] : null;
  }
  function responseCode(start) {
    const m = start.match(/^SIP\/2\.0\s+(\d{3})/);
    return m ? m[1] : null;
  }
  function ruleMatchesMessage(token2, start) {
    const t2 = String(token2 || "ANY").toUpperCase();
    if (t2 === "ANY") return true;
    const method = requestMethod(start);
    const code = responseCode(start);
    if (method) return t2 === method;
    if (code) return t2 === code || t2 === code[0] + "XX";
    return false;
  }
  function applyCube(rulesText, message) {
    const changes = [];
    const warnings = [];
    let msg = splitMessage(message);
    const lines = String(rulesText || "").split(/\n/);
    lines.forEach((raw, idx) => {
      const line = raw.trim();
      if (!line || line.startsWith("!") || line.startsWith("#") || line.startsWith("voice class")) return;
      const m = line.match(/^(request|response)\s+(\S+)\s+sip-header\s+(\S+)\s+(add|remove|modify)\s*(.*)$/i);
      if (!m) {
        warnings.push(`Line ${idx + 1} is not in the teaching subset (request|response METHOD sip-header NAME add|remove|modify).`);
        return;
      }
      const [, dir, token2, header, action, rest] = m;
      const isResp = Boolean(responseCode(msg.start));
      if (dir.toLowerCase() === "request" && isResp) return;
      if (dir.toLowerCase() === "response" && !isResp) return;
      if (!ruleMatchesMessage(token2, msg.start)) return;
      const name = header.toLowerCase();
      if (action.toLowerCase() === "remove") {
        const before = msg.headers.length;
        msg.headers = msg.headers.filter((h) => headerKey(h) !== name);
        changes.push({ rule: line, detail: before === msg.headers.length ? "no header removed" : `removed ${header}` });
        return;
      }
      if (action.toLowerCase() === "add") {
        const quoted = rest.match(/^"([\s\S]*)"$/);
        const value = quoted ? quoted[1] : rest.replace(/^"|"$/g, "");
        msg.headers.push(value.includes(":") ? value : `${header}: ${value}`);
        changes.push({ rule: line, detail: `added ${header}` });
        return;
      }
      const parts = [...rest.matchAll(/"([^"]*)"/g)].map((x) => x[1]);
      if (parts.length < 2) {
        warnings.push(`Line ${idx + 1} modify needs two quoted strings.`);
        return;
      }
      let re;
      try {
        re = safeRegExp(parts[0]);
      } catch (err) {
        warnings.push(`Line ${idx + 1}: ${err.message}`);
        return;
      }
      const repl = parts[1].replace(/\\(\d)/g, "$$$1");
      let hits = 0;
      msg.headers = msg.headers.map((h) => {
        if (headerKey(h) !== name) return h;
        const i = h.indexOf(":");
        const value = h.slice(i + 1);
        re.lastIndex = 0;
        if (!re.test(value)) return h;
        re.lastIndex = 0;
        hits += 1;
        return h.slice(0, i + 1) + value.replace(re, repl);
      });
      changes.push({ rule: line, detail: hits ? `modified ${hits} ${header}` : `no match on ${header}` });
    });
    return { output: joinMessage(msg.start, msg.headers, msg.body), changes, warnings };
  }
  function parseAcme(text2) {
    const blocks = [];
    let cur = null;
    for (const raw of String(text2 || "").split(/\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      if (/^header-rule$/i.test(line)) {
        if (cur) blocks.push(cur);
        cur = {};
        continue;
      }
      if (!cur) continue;
      const sp = line.indexOf(" ");
      const key = (sp === -1 ? line : line.slice(0, sp)).toLowerCase();
      const value = sp === -1 ? "" : line.slice(sp + 1).trim();
      cur[key] = value;
    }
    if (cur) blocks.push(cur);
    return blocks;
  }
  function applyAcme(rulesText, message) {
    const changes = [];
    const warnings = [];
    const stores = {};
    let msg = splitMessage(message);
    let rejected = false;
    for (const rule of parseAcme(rulesText)) {
      const header = rule["header-name"];
      const action = (rule.action || "").toLowerCase();
      if (!header || !action) {
        warnings.push("A header-rule needs header-name and action.");
        continue;
      }
      const msgType = (rule["msg-type"] || "any").toLowerCase();
      const isResp = Boolean(responseCode(msg.start));
      if (msgType === "request" && isResp) continue;
      if (msgType === "reply" && !isResp) continue;
      const name = header.toLowerCase();
      const matchValue = rule["match-value"] || "";
      const comparison = (rule["comparison-type"] || "boolean").toLowerCase();
      const applyOne = (value) => {
        if (comparison === "boolean" || !matchValue) return { ok: true, value };
        if (comparison === "case-sensitive") {
          return { ok: value.includes(matchValue), value: value.split(matchValue).join(rule["new-value"] || "") };
        }
        try {
          const re = safeRegExp(matchValue);
          if (!re.test(value)) return { ok: false, value };
          re.lastIndex = 0;
          const repl = (rule["new-value"] || "").replace(/\\(\d)/g, "$$$1");
          return { ok: true, value: value.replace(re, repl), found: value.match(safeRegExp(matchValue)) };
        } catch (err) {
          warnings.push(err.message);
          return { ok: false, value };
        }
      };
      if (action === "add") {
        msg.headers.push(`${header}: ${rule["new-value"] || ""}`);
        changes.push({ rule: rule.name || header, detail: `added ${header}` });
        continue;
      }
      let hits = 0;
      const next = [];
      for (const h of msg.headers) {
        if (headerKey(h) !== name) {
          next.push(h);
          continue;
        }
        const i = h.indexOf(":");
        const tested = applyOne(h.slice(i + 1));
        if (!tested.ok && comparison !== "boolean") {
          next.push(h);
          continue;
        }
        hits += 1;
        if (action === "delete") continue;
        if (action === "store") {
          stores[rule.name || header] = h.slice(i + 1).trim();
          next.push(h);
          continue;
        }
        if (action === "reject") {
          rejected = true;
          next.push(h);
          continue;
        }
        if (action === "manipulate") {
          next.push(h.slice(0, i + 1) + (tested.value.startsWith(" ") ? tested.value : " " + tested.value.trim()));
          continue;
        }
        warnings.push(`Action ${action} is outside this teaching subset.`);
        next.push(h);
      }
      msg.headers = next;
      changes.push({ rule: rule.name || header, detail: `${action} on ${header}: ${hits} header(s)` });
    }
    return { output: joinMessage(msg.start, msg.headers, msg.body), changes, warnings, stores, rejected };
  }
  function extractMessages(raw) {
    const lines = String(raw || "").replace(/\r/g, "").split("\n").map((line) => {
      return line.replace(/^[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\.\d+:\s*/, "").replace(/^\/\/-?\d+\/[0-9A-Fa-fx]+\/SIP\/Msg\/ccsipDisplayMsg:\s*/, "");
    });
    const messages = [];
    let direction = "";
    let buf = [];
    const flush = () => {
      const text2 = buf.join("\n").trim();
      buf = [];
      if (!text2) return;
      const first = text2.split("\n")[0];
      if (METHODS.has(first.split(/\s+/)[0]) || first.startsWith("SIP/2.0")) {
        messages.push({ direction, text: text2 });
      }
    };
    for (const line of lines) {
      const trim = line.trim();
      if (/^(Sent|Received):?$/i.test(trim)) {
        flush();
        direction = /^sent/i.test(trim) ? "sent" : "received";
        continue;
      }
      const method = trim.split(/\s+/)[0];
      const starts = METHODS.has(method) || trim.startsWith("SIP/2.0 ");
      if (starts && buf.length) flush();
      if (trim || buf.length) buf.push(line);
    }
    flush();
    return messages;
  }

  // campus/js/tools.js
  function field(label, id, value, rows = 12) {
    return `<label class="stack" for="${id}"><span>${esc(label)}</span>
    <textarea id="${id}" rows="${rows}" spellcheck="false">${esc(value || "")}</textarea></label>`;
  }
  function mountDissector(host, initial = "") {
    host.innerHTML = `
    <div class="tool-grid">
      ${field("SIP message", "dis-in", initial, 16)}
      <div>
        <div class="row-actions"><button type="button" id="dis-run">Dissect</button></div>
        <div id="dis-out" class="tool-out" aria-live="polite"></div>
      </div>
    </div>`;
    const run = () => {
      playTone("click");
      const msg = dissect(host.querySelector("#dis-in").value);
      const headers = (msg.headers || []).map((h) => `<tr><th scope="row">${esc(h.name)}${h.compact ? ` <span class="muted">(${esc(h.compact)})</span>` : ""}</th><td>${esc(h.value)}</td></tr>`).join("");
      const warnings = (msg.warnings || []).map((w) => `<li class="${esc(w.level)}">${esc(w.text)}</li>`).join("");
      const kind = msg.kind === "request" ? `${esc(msg.method)} ${esc(msg.uri)}` : msg.kind === "response" ? `${esc(msg.status)} ${esc(msg.reason)}` : "Unrecognized";
      host.querySelector("#dis-out").innerHTML = `
      <p class="tool-kicker">${kind}</p>
      ${warnings ? `<ul class="warn-list">${warnings}</ul>` : `<p class="ok-line">No structural warnings.</p>`}
      <div class="scroll"><table><tbody>${headers || `<tr><td>No headers</td></tr>`}</tbody></table></div>
      ${msg.body ? `<h3>Body</h3><pre class="sip-view">${esc(msg.body)}</pre>` : ""}`;
    };
    host.querySelector("#dis-run").addEventListener("click", run);
    if (initial) run();
  }
  function mountSdp(host, offer = "", answer = "") {
    host.innerHTML = `
    <div class="tool-grid">
      <div>
        ${field("Offer", "sdp-offer", offer, 12)}
        ${field("Answer", "sdp-answer", answer, 12)}
        <button type="button" id="sdp-run">Negotiate</button>
      </div>
      <div id="sdp-out" class="tool-out" aria-live="polite"></div>
    </div>
    <p class="fine">Teaching subset of RFC 3264 and RFC 6337. Payload types match on the encoding name. Static names for PT 0, 8, 9, and 18 come from RFC 3551 when rtpmap is absent.</p>`;
    const run = () => {
      playTone("click");
      const result = negotiate(host.querySelector("#sdp-offer").value, host.querySelector("#sdp-answer").value);
      const notes = result.notes.map((n) => `<li class="${esc(n.level)}">${esc(n.text)}</li>`).join("");
      const streams = result.streams.map((s) => {
        if (s.missing) return `<article class="stream"><h3>m-line ${s.index + 1}</h3><p>Missing from the ${esc(s.missing)}.</p></article>`;
        const codecs = s.codecs.map((c) => `<li>${esc(c.name)} <span class="muted">offer PT ${esc(c.offerPt)} / answer PT ${esc(c.answerPt)}</span></li>`).join("");
        return `<article class="stream">
        <h3>m-line ${s.index + 1}: ${esc(s.type)} ${s.rejected ? "rejected" : "accepted"}</h3>
        <p>Ports ${esc(s.offerPort)} \u2192 ${esc(s.answerPort)}. Profile ${esc(s.offerProto)} \u2192 ${esc(s.answerProto)}.</p>
        <p>Direction ${esc(s.direction.offer)} answered with ${esc(s.direction.answer)}${s.direction.ok ? "" : " \u2014 does not fit the offer"}.</p>
        <p>DTMF telephone-event: ${esc(s.dtmf)}.</p>
        <ul>${codecs || "<li>No shared codecs.</li>"}</ul>
        ${s.dropped.length ? `<p class="muted">Offered but not answered: ${esc(s.dropped.join(", "))}.</p>` : ""}
      </article>`;
      }).join("");
      host.querySelector("#sdp-out").innerHTML = `${notes ? `<ul class="warn-list">${notes}</ul>` : `<p class="ok-line">No warnings.</p>`}${streams}`;
    };
    host.querySelector("#sdp-run").addEventListener("click", run);
    if (offer && answer) run();
  }
  function mountSandbox(host, rules = "", message = "", dialect = "cube") {
    host.innerHTML = `
    <div class="seg" role="radiogroup" aria-label="Rule dialect">
      <label><input type="radio" name="dialect" value="cube" ${dialect === "cube" ? "checked" : ""}> CUBE SIP profile subset</label>
      <label><input type="radio" name="dialect" value="acme" ${dialect === "acme" ? "checked" : ""}> Acme header-rule subset</label>
    </div>
    <div class="tool-grid">
      <div>
        ${field("Rules", "sb-rules", rules, 10)}
        ${field("Message", "sb-msg", message, 12)}
        <button type="button" id="sb-run">Apply</button>
      </div>
      <div id="sb-out" class="tool-out" aria-live="polite"></div>
    </div>
    <p class="fine">CUBE subset: <code>request INVITE sip-header From modify "regex" "replacement"</code>. Acme subset: <code>header-rule</code> blocks with header-name, action (add, delete, manipulate, store, reject), comparison-type, match-value, new-value, msg-type. Real copy lists, element rules, and release-specific actions stay in the vendor guides.</p>`;
    const run = () => {
      playTone("click");
      const which = host.querySelector('input[name="dialect"]:checked').value;
      const rulesText = host.querySelector("#sb-rules").value;
      const msg = host.querySelector("#sb-msg").value;
      const result = which === "acme" ? applyAcme(rulesText, msg) : applyCube(rulesText, msg);
      const changes = (result.changes || []).map((c) => `<li>${esc(c.detail)}</li>`).join("");
      const warnings = (result.warnings || []).map((w) => `<li class="warn">${esc(w)}</li>`).join("");
      host.querySelector("#sb-out").innerHTML = `
      ${result.rejected ? `<p class="bad-line">Reject action matched. Check the Oracle HMR guide for the status this release sends.</p>` : ""}
      <ul>${changes || "<li>No rule fired.</li>"}</ul>
      ${warnings ? `<ul class="warn-list">${warnings}</ul>` : ""}
      ${result.stores && Object.keys(result.stores).length ? `<p>Stored: ${esc(JSON.stringify(result.stores))}</p>` : ""}
      <h3>Result</h3>
      <pre class="sip-view">${esc(result.output)}</pre>`;
    };
    host.querySelector("#sb-run").addEventListener("click", run);
    if (rules && message) run();
  }
  function mountCapture(host, initial = "") {
    host.innerHTML = `
    <div class="tool-grid">
      ${field("debug ccsip messages or a text capture", "cap-in", initial, 16)}
      <div>
        <button type="button" id="cap-run">Extract SIP</button>
        <div id="cap-out" class="tool-out"></div>
      </div>
    </div>`;
    host.querySelector("#cap-run").addEventListener("click", () => {
      playTone("click");
      const found = extractMessages(host.querySelector("#cap-in").value);
      if (!found.length) {
        host.querySelector("#cap-out").innerHTML = `<p>No SIP start line found.</p>`;
        return;
      }
      host.querySelector("#cap-out").innerHTML = found.map((item, i) => `
      <article class="stream">
        <h3>${esc(item.direction || "message")} ${i + 1}</h3>
        <div class="mini-dissect" data-i="${i}"></div>
      </article>`).join("");
      host.querySelectorAll(".mini-dissect").forEach((node) => {
        const item = found[Number(node.dataset.i)];
        mountDissector(node, item.text);
      });
    });
    if (initial) host.querySelector("#cap-run").click();
  }

  // campus/js/topology.js
  var NODES = [
    { id: "pstn", label: "PSTN", x: -6.2, y: 0.2, z: 0.4 },
    { id: "carrier", label: "Carrier SBC", x: -3.6, y: 0.6, z: 1.1 },
    { id: "cube", label: "Enterprise SBC", x: 0, y: 0.9, z: 0 },
    { id: "cucm", label: "CUCM", x: 3.1, y: 0.4, z: 0.8 },
    { id: "unity", label: "Unity", x: 4.8, y: -0.4, z: -0.4 },
    { id: "phone", label: "IP phone", x: 3.3, y: -1.1, z: 1.8 },
    { id: "teams", label: "Teams", x: -0.2, y: 2.4, z: -2.3 },
    { id: "webex", label: "Webex Calling", x: 1.8, y: 2.2, z: -2.5 },
    { id: "connect", label: "Amazon Connect", x: -2.4, y: 2.5, z: -1.1 },
    { id: "five9", label: "Five9", x: 3.5, y: 1.9, z: -1.5 },
    { id: "genesys", label: "Genesys", x: 4.8, y: 1.2, z: -2.3 },
    { id: "cxone", label: "CXone", x: -4.6, y: 1.8, z: -1.6 },
    { id: "twilio", label: "Twilio", x: -5.5, y: 0.3, z: -1.4 }
  ];
  var LINKS2 = [
    ["pstn", "carrier", "pstn"],
    ["carrier", "cube", "wan"],
    ["cube", "cucm", "core"],
    ["cucm", "unity", "uc"],
    ["cucm", "phone", "uc"],
    ["cube", "teams", "tls"],
    ["cube", "webex", "tls"],
    ["cube", "connect", "siprec"],
    ["cube", "five9", "byoc"],
    ["cube", "genesys", "byoc"],
    ["carrier", "cxone", "cloud"],
    ["carrier", "twilio", "cloud"]
  ];
  var FAILURES = [
    { id: "none", label: "Healthy", detail: "Signaling and media paths are up. This is the reference picture, not a live network." },
    { id: "wan", label: "WAN down", detail: "The carrier-to-enterprise path fails. Calls that hairpin through the enterprise SBC to the PSTN stop. Cloud trunks that do not use that path stay up." },
    { id: "tls", label: "TLS failure", detail: "Teams and Webex trunks need SIP over TLS. A certificate or TLS version mismatch takes those signaling paths down while UDP carrier trunks may still answer." },
    { id: "oneway", label: "One-way audio", detail: "Signaling can succeed while RTP flows only one way. Look at c= and m= ports, NAT, and whether media is anchored." },
    { id: "alg", label: "SIP ALG", detail: "An ALG rewriting addresses inside SIP or SDP corrupts the path toward CUCM. TLS trunks usually cannot be rewritten and fail differently." },
    { id: "options", label: "OPTIONS timeout", detail: "Teams Direct Routing marks an SBC inactive when OPTIONS over TLS does not complete with 200 OK." },
    { id: "codec", label: "Codec mismatch", detail: "The Webex path returns 488 when the offer and answer share no codec. Signaling reached the far side; media never starts." },
    { id: "fraud", label: "Toll-fraud burst", detail: "A sudden international call spike on the PSTN side. Treat it as a security event: unknown source addresses and open dial patterns." }
  ];
  function nodeById(id) {
    return NODES.find((n) => n.id === id);
  }
  function linkState(kind, failure) {
    if (failure === "wan" && (kind === "wan" || kind === "pstn")) return "down";
    if (failure === "tls" && kind === "tls") return "down";
    if (failure === "options" && kind === "tls") return "warn";
    if (failure === "codec" && kind === "tls") return "warn";
    if (failure === "alg" && kind === "core") return "warn";
    if (failure === "oneway" && (kind === "core" || kind === "wan" || kind === "uc")) return "media";
    if (failure === "fraud" && kind === "pstn") return "warn";
    return "up";
  }
  function fallbackSVG(failure) {
    const w = 980;
    const h = 460;
    const pos = {
      pstn: [80, 230],
      carrier: [230, 180],
      cube: [430, 210],
      cucm: [640, 180],
      unity: [820, 120],
      phone: [800, 250],
      teams: [360, 70],
      webex: [520, 60],
      connect: [250, 70],
      five9: [700, 70],
      genesys: [860, 190],
      cxone: [120, 80],
      twilio: [80, 360]
    };
    const lines = LINKS2.map(([a, b, kind]) => {
      const [x1, y1] = pos[a];
      const [x2, y2] = pos[b];
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="topo-link is-${linkState(kind, failure)}"></line>`;
    }).join("");
    const dots = NODES.map((n) => {
      const [x, y] = pos[n.id];
      return `<g><circle cx="${x}" cy="${y}" r="16" class="topo-dot"></circle><text x="${x}" y="${y + 34}" text-anchor="middle" class="topo-label">${esc(n.label)}</text></g>`;
    }).join("");
    return `<svg class="topo-flat" viewBox="0 0 ${w} ${h}" role="img" aria-label="Flat SBC topology">
    <rect width="${w}" height="${h}" class="ladder-bg"></rect>${lines}${dots}</svg>`;
  }
  function makeLabel(THREE2, text2) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const g = canvas.getContext("2d");
    g.fillStyle = "rgba(7,11,20,0.8)";
    g.fillRect(0, 0, 256, 64);
    g.fillStyle = "#e8f0fa";
    g.font = "28px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text2, 128, 32);
    const tex = new THREE2.CanvasTexture(canvas);
    const sprite = new THREE2.Sprite(new THREE2.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(1.8, 0.45, 1);
    return sprite;
  }
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "vendor/three.min.js";
      script.onload = () => resolve(window.THREE);
      script.onerror = () => reject(new Error("Three.js did not load"));
      document.head.appendChild(script);
    });
  }
  async function mountTopology(host) {
    let failure = "none";
    let frame = 0;
    let renderer2 = null;
    let stop = false;
    host.innerHTML = `
    <div class="topo-layout">
      <div class="topo-stage" id="topo-stage">
        <canvas id="topo-canvas" hidden></canvas>
        <div id="topo-flat" class="scroll"></div>
        <p id="topo-mode" class="fine"></p>
      </div>
      <div>
        <fieldset><legend>Failure toggles</legend><div id="topo-fails" class="fail-list"></div></fieldset>
        <div id="topo-detail" class="tool-out" aria-live="polite"></div>
        <ul id="topo-nodes" class="node-list"></ul>
      </div>
    </div>`;
    const fails = host.querySelector("#topo-fails");
    fails.innerHTML = FAILURES.map((f) => `<label><input type="radio" name="fail" value="${esc(f.id)}" ${f.id === "none" ? "checked" : ""}> ${esc(f.label)}</label>`).join("");
    const nodeList = host.querySelector("#topo-nodes");
    nodeList.innerHTML = NODES.map((n) => `<li><button type="button" data-node="${esc(n.id)}">${esc(n.label)}</button></li>`).join("");
    const meshes = /* @__PURE__ */ new Map();
    const lines = [];
    let scene2 = null;
    let camera2 = null;
    let THREE2 = null;
    const sph = { r: 13.5, theta: 0.5, phi: 1.05 };
    const reduced5 = prefersReduced();
    function placeCamera() {
      if (!camera2) return;
      camera2.position.set(
        sph.r * Math.sin(sph.phi) * Math.sin(sph.theta),
        sph.r * Math.cos(sph.phi),
        sph.r * Math.sin(sph.phi) * Math.cos(sph.theta)
      );
      camera2.lookAt(0, 0.4, 0);
    }
    function colorFor(state) {
      if (state === "down") return 16731498;
      if (state === "warn") return 16756768;
      if (state === "media") return 16731533;
      return 4054271;
    }
    function applyFailure() {
      const meta = FAILURES.find((f) => f.id === failure);
      host.querySelector("#topo-detail").innerHTML = `<h3>${esc(meta.label)}</h3><p>${esc(meta.detail)}</p>`;
      host.querySelector("#topo-flat").innerHTML = fallbackSVG(failure);
      lines.forEach((entry) => {
        const state = linkState(entry.kind, failure);
        entry.line.material.color.setHex(colorFor(state));
        entry.line.material.opacity = state === "down" ? 0.25 : 1;
      });
    }
    fails.addEventListener("change", (event) => {
      if (event.target.name === "fail") {
        failure = event.target.value;
        applyFailure();
      }
    });
    nodeList.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-node]");
      if (!btn) return;
      const node = nodeById(btn.dataset.node);
      host.querySelector("#topo-detail").innerHTML = `<h3>${esc(node.label)}</h3><p>Select a failure to see how this node\u2019s paths change. Labels are a teaching map, not a discovery scan.</p>`;
    });
    applyFailure();
    if (reduced5) {
      host.querySelector("#topo-mode").textContent = "Reduced motion is on, so the flat map is the view. Turn motion back on in Settings to orbit the 3D model.";
      return () => {
      };
    }
    try {
      THREE2 = await loadThree();
      if (stop) return () => {
      };
      const canvas = host.querySelector("#topo-canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) throw new Error("no webgl");
      canvas.hidden = false;
      scene2 = new THREE2.Scene();
      scene2.fog = new THREE2.Fog(461588, 16, 32);
      camera2 = new THREE2.PerspectiveCamera(48, 1, 0.1, 80);
      renderer2 = new THREE2.WebGLRenderer({ canvas, antialias: true, alpha: true });
      const mobile = window.matchMedia("(max-width: 800px)").matches;
      renderer2.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
      scene2.add(new THREE2.AmbientLight(8956637, 0.55));
      const key = new THREE2.PointLight(4054271, 18, 30);
      key.position.set(4, 6, 4);
      scene2.add(key);
      const rim = new THREE2.PointLight(16731533, 10, 24);
      rim.position.set(-4, 2, -3);
      scene2.add(rim);
      NODES.forEach((n) => {
        const mesh = new THREE2.Mesh(
          new THREE2.SphereGeometry(0.28, 24, 18),
          new THREE2.MeshStandardMaterial({ color: 1192004, emissive: 4054271, emissiveIntensity: 0.7, roughness: 0.35 })
        );
        mesh.position.set(n.x, n.y, n.z);
        const label = makeLabel(THREE2, n.label);
        label.position.set(n.x, n.y + 0.55, n.z);
        scene2.add(mesh);
        scene2.add(label);
        meshes.set(n.id, mesh);
      });
      LINKS2.forEach(([a, b, kind]) => {
        const na = nodeById(a);
        const nb = nodeById(b);
        const geo = new THREE2.BufferGeometry().setFromPoints([
          new THREE2.Vector3(na.x, na.y, na.z),
          new THREE2.Vector3(nb.x, nb.y, nb.z)
        ]);
        const mat = new THREE2.LineBasicMaterial({ color: 4054271 });
        const line = new THREE2.Line(geo, mat);
        scene2.add(line);
        lines.push({ kind, line });
      });
      const stage = host.querySelector("#topo-stage");
      const resize = () => {
        const w = stage.clientWidth || 640;
        const h = 420;
        renderer2.setSize(w, h, false);
        camera2.aspect = w / h;
        camera2.updateProjectionMatrix();
      };
      resize();
      placeCamera();
      applyFailure();
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      canvas.addEventListener("pointerdown", (e) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener("pointerup", () => {
        dragging = false;
      });
      canvas.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        sph.theta -= (e.clientX - lastX) * 8e-3;
        sph.phi = Math.min(2.4, Math.max(0.35, sph.phi - (e.clientY - lastY) * 8e-3));
        lastX = e.clientX;
        lastY = e.clientY;
        placeCamera();
      });
      canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        sph.r = Math.min(22, Math.max(7, sph.r + Math.sign(e.deltaY) * 0.6));
        placeCamera();
      }, { passive: false });
      const loop = () => {
        if (stop) return;
        frame = requestAnimationFrame(loop);
        if (document.hidden) return;
        const box2 = canvas.getBoundingClientRect();
        if (box2.bottom <= 0 || box2.top >= window.innerHeight) return;
        if (!dragging) sph.theta += 15e-4;
        placeCamera();
        renderer2.render(scene2, camera2);
      };
      loop();
      window.addEventListener("resize", resize);
      host.querySelector("#topo-mode").textContent = "Drag to orbit. Scroll to dolly. The flat map under the model stays available.";
      return () => {
        stop = true;
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        renderer2.dispose();
      };
    } catch {
      host.querySelector("#topo-mode").textContent = "WebGL is unavailable. The flat map is the working view.";
      return () => {
        stop = true;
      };
    }
  }

  // campus/js/hero.js
  var LABELS = ["UA", "SBC", "DNS", "PSTN", "TURN", "RTP"];
  var MESSAGES = ["INVITE", "180", "200", "ACK"];
  var VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
  var EXTRACT = `
  uniform sampler2D tDiffuse;
  uniform float threshold;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    float keep = smoothstep(threshold, threshold + 0.4, luma);
    gl_FragColor = vec4(color.rgb * keep, 1.0);
  }
`;
  var BLUR = `
  uniform sampler2D tDiffuse;
  uniform vec2 direction;
  varying vec2 vUv;
  void main() {
    vec3 acc = vec3(0.0);
    float sum = 0.0;
    for (int i = -6; i <= 6; i++) {
      float wgt = exp(-float(i * i) / 14.0);
      acc += texture2D(tDiffuse, vUv + direction * float(i)).rgb * wgt;
      sum += wgt;
    }
    gl_FragColor = vec4(acc / sum, 1.0);
  }
`;
  var session = null;
  var flyArmed = false;
  var looseFly = null;
  function pixelRatio() {
    const dpr = window.devicePixelRatio || 1;
    const mobile = window.matchMedia("(max-width: 800px)").matches;
    return Math.min(dpr, mobile ? 1.5 : 2);
  }
  function reduced2() {
    const motion = document.documentElement.dataset.motion;
    if (motion === "reduce") return true;
    if (motion === "full") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function hasWebGL() {
    try {
      const test = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (test.getContext("webgl2") || test.getContext("webgl")));
    } catch {
      return false;
    }
  }
  function cssHex(name, fallback) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : fallback;
  }
  function loadThree2() {
    if (window.THREE) return Promise.resolve(window.THREE);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "vendor/three.min.js";
      script.onload = () => resolve(window.THREE);
      script.onerror = () => reject(new Error("Three.js did not load"));
      document.head.appendChild(script);
    });
  }
  function fallbackMarkup() {
    const nodes = LABELS.map((name, i) => `<span class="fb-node" style="--a:${i * 60}deg">${name}</span>`).join("");
    return `<div class="fb-grid"></div><div class="fb-globe"></div><div class="fb-ring r1"></div><div class="fb-ring r2"></div><div class="fb-ring r3"></div>${nodes}`;
  }
  function paintLabel(text2, color) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 72;
    const ctx2 = canvas.getContext("2d");
    ctx2.clearRect(0, 0, 256, 72);
    ctx2.font = "700 40px sans-serif";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillStyle = color;
    ctx2.fillText(text2, 128, 36);
    return canvas;
  }
  function makeTarget(THREE2, w, h) {
    const target = new THREE2.WebGLRenderTarget(w, h, { depthBuffer: true });
    return target;
  }
  function bloomKit(THREE2) {
    const scene2 = new THREE2.Scene();
    const camera2 = new THREE2.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mesh = new THREE2.Mesh(new THREE2.PlaneGeometry(2, 2));
    scene2.add(mesh);
    const extract = new THREE2.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, threshold: { value: 0.42 } },
      vertexShader: VERT,
      fragmentShader: EXTRACT,
      depthTest: false,
      depthWrite: false
    });
    const blur = new THREE2.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, direction: { value: new THREE2.Vector2(1, 0) } },
      vertexShader: VERT,
      fragmentShader: BLUR,
      depthTest: false,
      depthWrite: false
    });
    const composite = new THREE2.ShaderMaterial({
      uniforms: { tBloom: { value: null }, strength: { value: 1.85 } },
      vertexShader: VERT,
      fragmentShader: `
      uniform sampler2D tBloom;
      uniform float strength;
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(texture2D(tBloom, vUv).rgb * strength, 1.0);
      }
    `,
      transparent: true,
      blending: THREE2.AdditiveBlending,
      depthTest: false,
      depthWrite: false
    });
    return { scene: scene2, camera: camera2, mesh, extract, blur, composite };
  }
  function armFly() {
    if (reduced2()) return;
    if (session && !session.flying) {
      flyArmed = true;
      return;
    }
    if (!session && !looseFly) startLooseFly();
  }
  function startLooseFly() {
    if (!hasWebGL()) return;
    loadThree2().then((THREE2) => {
      if (session || looseFly || reduced2()) return;
      const canvas = document.createElement("canvas");
      canvas.className = "hero-canvas is-fly";
      document.body.appendChild(canvas);
      let renderer2;
      try {
        renderer2 = new THREE2.WebGLRenderer({ canvas, antialias: true, alpha: false });
      } catch {
        canvas.remove();
        return;
      }
      const scene2 = new THREE2.Scene();
      const camera2 = new THREE2.PerspectiveCamera(52, 1, 0.1, 80);
      const bg = cssHex("--cc-bg", "#07101f");
      scene2.background = new THREE2.Color(bg);
      renderer2.setClearColor(bg, 1);
      renderer2.setPixelRatio(pixelRatio());
      renderer2.setSize(window.innerWidth, window.innerHeight, false);
      camera2.aspect = window.innerWidth / window.innerHeight;
      camera2.updateProjectionMatrix();
      const wire = new THREE2.Mesh(
        new THREE2.IcosahedronGeometry(1.8, 1),
        new THREE2.MeshBasicMaterial({ color: cssHex("--cc-accent-1", "#7af0ff"), wireframe: true })
      );
      scene2.add(wire);
      [3.2, 4.3, 5.4].forEach((radius, i) => {
        const ring = new THREE2.Mesh(
          new THREE2.TorusGeometry(radius, 0.04, 8, 64),
          new THREE2.MeshBasicMaterial({ color: cssHex(i === 1 ? "--cc-accent-2" : "--cc-accent-3", "#ff8bd2") })
        );
        ring.rotation.x = 1.1 + i * 0.3;
        scene2.add(ring);
      });
      const started = performance.now();
      looseFly = { renderer: renderer2, scene: scene2, canvas };
      const tick = (now) => {
        if (!looseFly) return;
        const u = Math.min(1, (now - started) / 720);
        wire.rotation.y = u * 2.4;
        camera2.position.set(Math.sin(u * Math.PI) * 3.2, 0.4 + u * 0.6, 9 - u * 7.2);
        camera2.lookAt(0, 0.8, 0);
        renderer2.render(scene2, camera2);
        if (u < 1) requestAnimationFrame(tick);
        else {
          renderer2.dispose();
          scene2.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
          });
          canvas.remove();
          looseFly = null;
        }
      };
      requestAnimationFrame(tick);
    }).catch(() => {
    });
  }
  async function mountHero(host) {
    const glass = host.innerHTML;
    host.innerHTML = `<div class="hero-bleed" data-hero="pending">
    <p class="sr-only">A three-dimensional call path. A user agent, an SBC, DNS, PSTN, TURN, and RTP orbit a glowing globe. No fog. The nodes stay sharp.</p>
    <canvas class="hero-canvas" aria-hidden="true"></canvas>
    <div class="hero-fallback" hidden>${fallbackMarkup()}</div>
    <div class="hero-glass">${glass}</div>
  </div>`;
    const bleed = host.querySelector(".hero-bleed");
    const canvas = host.querySelector(".hero-canvas");
    const fallback = host.querySelector(".hero-fallback");
    const fit = () => {
      const head = document.querySelector(".site-head");
      const h = head ? head.offsetHeight : 120;
      bleed.style.marginTop = `-${h}px`;
      bleed.style.paddingTop = `${h + 8}px`;
    };
    fit();
    const showFallback = () => {
      bleed.dataset.hero = "css";
      canvas.hidden = true;
      fallback.hidden = false;
    };
    if (reduced2() || !hasWebGL()) {
      showFallback();
      return () => {
      };
    }
    let THREE2;
    try {
      THREE2 = await loadThree2();
    } catch {
      showFallback();
      return () => {
      };
    }
    if (!THREE2 || !host.isConnected) {
      showFallback();
      return () => {
      };
    }
    let renderer2;
    try {
      renderer2 = new THREE2.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch {
      showFallback();
      return () => {
      };
    }
    renderer2.setPixelRatio(pixelRatio());
    bleed.dataset.hero = "webgl";
    bleed.dataset.bloom = "0";
    const scene2 = new THREE2.Scene();
    const camera2 = new THREE2.PerspectiveCamera(52, 1, 0.1, 80);
    camera2.position.set(0, -0.55, 6.2);
    const palette2 = () => ({
      bg: cssHex("--cc-bg", "#0b1020"),
      a: cssHex("--cc-accent-1", "#39ff14"),
      b: cssHex("--cc-accent-2", "#ff2bd6"),
      c: cssHex("--cc-accent-3", "#00e5ff"),
      d: cssHex("--cc-accent-4", "#ffe600")
    });
    const colors = palette2();
    scene2.background = new THREE2.Color(colors.bg);
    scene2.fog = null;
    renderer2.setClearColor(colors.bg, 1);
    const globe = new THREE2.Group();
    globe.position.y = 1.7;
    const wire = new THREE2.Mesh(
      new THREE2.IcosahedronGeometry(1.85, 1),
      new THREE2.MeshBasicMaterial({ color: colors.a, wireframe: true })
    );
    const core = new THREE2.Mesh(
      new THREE2.SphereGeometry(1.25, 28, 28),
      new THREE2.MeshBasicMaterial({ color: colors.c, transparent: true, opacity: 0.55, blending: THREE2.AdditiveBlending, depthWrite: false })
    );
    const halo = new THREE2.Mesh(
      new THREE2.SphereGeometry(2.15, 24, 24),
      new THREE2.MeshBasicMaterial({ color: colors.b, transparent: true, opacity: 0.16, blending: THREE2.AdditiveBlending, depthWrite: false })
    );
    globe.add(wire, core, halo);
    scene2.add(globe);
    const rings = [3.05, 4.05, 5.15].map((radius, i) => {
      const mesh = new THREE2.Mesh(
        new THREE2.TorusGeometry(radius, 0.045, 12, 96),
        new THREE2.MeshBasicMaterial({ color: [colors.b, colors.c, colors.d][i] })
      );
      mesh.position.y = 1.7;
      mesh.rotation.x = 1.05 + i * 0.22;
      mesh.rotation.y = i * 0.4;
      scene2.add(mesh);
      return mesh;
    });
    const grid = new THREE2.GridHelper(28, 18, colors.a, colors.b);
    grid.position.y = -1.6;
    if (grid.material) {
      const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
      mats.forEach((mat) => {
        mat.transparent = true;
        mat.opacity = 0.55;
      });
    }
    scene2.add(grid);
    const count = 1700;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 1.4 + Math.random() * 9.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius * 1.45;
      positions[i * 3 + 1] = Math.cos(phi) * radius * 0.9 + 1.05;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius * 0.72 + 0.35;
    }
    const pointsGeo = new THREE2.BufferGeometry();
    pointsGeo.setAttribute("position", new THREE2.BufferAttribute(positions, 3));
    const points = new THREE2.Points(pointsGeo, new THREE2.PointsMaterial({
      color: colors.c,
      size: 0.05,
      transparent: true,
      opacity: 0.95,
      blending: THREE2.AdditiveBlending,
      depthWrite: false
    }));
    const nearCount = 480;
    const nearPos = new Float32Array(nearCount * 3);
    for (let i = 0; i < nearCount; i += 1) {
      nearPos[i * 3] = (Math.random() - 0.5) * 4.8;
      nearPos[i * 3 + 1] = (Math.random() - 0.4) * 5.2 + 0.8;
      nearPos[i * 3 + 2] = 2.8 + Math.random() * 2.4;
    }
    const nearGeo = new THREE2.BufferGeometry();
    nearGeo.setAttribute("position", new THREE2.BufferAttribute(nearPos, 3));
    const nearPoints = new THREE2.Points(nearGeo, new THREE2.PointsMaterial({
      color: colors.a,
      size: 0.11,
      transparent: true,
      opacity: 0.9,
      blending: THREE2.AdditiveBlending,
      depthWrite: false
    }));
    const ribbonCount = 360;
    const ribbonPos = new Float32Array(ribbonCount * 3);
    for (let i = 0; i < ribbonCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      ribbonPos[i * 3] = Math.cos(angle) * (1.15 + Math.random() * 0.95);
      ribbonPos[i * 3 + 1] = 0.15 + Math.random() * 2.5;
      ribbonPos[i * 3 + 2] = 2.9 + Math.sin(angle) * 0.35 + Math.random() * 0.35;
    }
    const ribbonGeo = new THREE2.BufferGeometry();
    ribbonGeo.setAttribute("position", new THREE2.BufferAttribute(ribbonPos, 3));
    const ribbon = new THREE2.Points(ribbonGeo, new THREE2.PointsMaterial({
      color: colors.b,
      size: 0.07,
      transparent: true,
      opacity: 0.95,
      blending: THREE2.AdditiveBlending,
      depthWrite: false
    }));
    scene2.add(points, nearPoints, ribbon);
    camera2.aspect = Math.max(0.45, (window.innerWidth || 1440) / (window.innerHeight || 900));
    camera2.updateProjectionMatrix();
    camera2.lookAt(0, 0.15, 0);
    camera2.updateMatrixWorld();
    const placeInView = (distance, sx, sy) => {
      const forward = new THREE2.Vector3();
      camera2.getWorldDirection(forward);
      const right = new THREE2.Vector3().crossVectors(forward, camera2.up).normalize();
      if (right.lengthSq() < 1e-4) right.set(1, 0, 0);
      const up = new THREE2.Vector3().crossVectors(right, forward).normalize();
      const halfH = Math.tan(THREE2.MathUtils.degToRad(camera2.fov) / 2) * distance;
      const halfW = halfH * camera2.aspect;
      return new THREE2.Vector3().copy(camera2.position).addScaledVector(forward, distance).addScaledVector(right, sx * halfW).addScaledVector(up, sy * halfH);
    };
    const starCount = 2400;
    const starPos = new Float32Array(starCount * 3);
    let starN = 0;
    const pushStar = (vec) => {
      if (starN >= starCount) return;
      starPos[starN * 3] = vec.x;
      starPos[starN * 3 + 1] = vec.y;
      starPos[starN * 3 + 2] = vec.z;
      starN += 1;
    };
    for (let i = 0; i < 1600; i += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 16 + Math.random() * 20;
      pushStar(camera2.position.clone().add(new THREE2.Vector3(
        Math.sin(phi) * Math.cos(theta) * radius,
        Math.cos(phi) * radius,
        Math.sin(phi) * Math.sin(theta) * radius
      )));
    }
    [[0.97, 0.92], [-0.97, 0.92], [0.97, -0.9], [-0.97, -0.9], [0.99, 0.15], [-0.99, 0.1], [0.2, 0.98], [-0.2, 0.98]].forEach(([sx, sy]) => {
      for (let k = 0; k < 80 && starN < starCount; k += 1) {
        pushStar(placeInView(15 + Math.random() * 12, sx * (0.7 + Math.random() * 0.32), sy * (0.7 + Math.random() * 0.32)));
      }
    });
    const starGeo = new THREE2.BufferGeometry();
    starGeo.setAttribute("position", new THREE2.BufferAttribute(starPos.subarray(0, starN * 3), 3));
    const stars = new THREE2.Points(starGeo, new THREE2.PointsMaterial({
      color: 14150911,
      size: 0.05,
      transparent: true,
      opacity: 0.9,
      blending: THREE2.AdditiveBlending,
      depthWrite: false
    }));
    scene2.add(stars);
    const MID = [
      ["Proxy", 0.9, 0.76],
      ["Registrar", -0.9, 0.76],
      ["Edge", 0.9, -0.68],
      ["Location", -0.9, -0.68],
      ["Outbound", 0.4, 0.9],
      ["B2BUA", -0.4, -0.82]
    ];
    const midNodes = MID.map(([name, sx, sy], i) => {
      const tone = [colors.a, colors.b, colors.c, colors.d, colors.a, colors.b][i];
      const group = new THREE2.Group();
      const mat = new THREE2.MeshBasicMaterial({ color: tone });
      group.add(new THREE2.Mesh(new THREE2.OctahedronGeometry(0.16, 0), mat));
      const tex = new THREE2.CanvasTexture(paintLabel(name, "#f4fff4"));
      const labelMat = new THREE2.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      const sprite = new THREE2.Sprite(labelMat);
      sprite.position.y = 0.38;
      sprite.scale.set(1.2, 0.36, 1);
      group.add(sprite);
      scene2.add(group);
      return { group, mat, sx, sy };
    });
    const netPos = new Float32Array(MID.length * 6);
    const netGeo = new THREE2.BufferGeometry();
    netGeo.setAttribute("position", new THREE2.BufferAttribute(netPos, 3));
    const net = new THREE2.LineSegments(netGeo, new THREE2.LineBasicMaterial({ color: colors.c, transparent: true, opacity: 0.7 }));
    scene2.add(net);
    const packetSeeds = [[0.92, 0.84], [-0.92, 0.84], [0.92, -0.76], [-0.92, -0.76], [0.97, 0.02], [-0.97, 0.02]];
    const packets = packetSeeds.map(([sx, sy], i) => {
      const tone = [colors.a, colors.d, colors.b, colors.c, colors.a, colors.b][i];
      const group = new THREE2.Group();
      const mat = new THREE2.MeshBasicMaterial({ color: tone });
      group.add(new THREE2.Mesh(new THREE2.SphereGeometry(0.075, 10, 10), mat));
      const beads = [];
      for (let k = 1; k <= 5; k += 1) {
        const bead = new THREE2.Mesh(new THREE2.SphereGeometry(0.04, 8, 8), new THREE2.MeshBasicMaterial({
          color: tone,
          transparent: true,
          opacity: 0.75 * (1 - k / 6),
          blending: THREE2.AdditiveBlending,
          depthWrite: false
        }));
        bead.position.set(0, 0, 0.1 * k);
        group.add(bead);
        beads.push(bead);
      }
      scene2.add(group);
      return { group, mat, beads, sx, sy };
    });
    const placeDepth = (time) => {
      camera2.updateMatrixWorld();
      midNodes.forEach((node, i) => {
        const sway = Math.sin(time * 0.65 + i) * 0.035;
        node.group.position.copy(placeInView(8.4, node.sx + sway, node.sy));
      });
      for (let i = 0; i < midNodes.length; i += 1) {
        const a = midNodes[i].group.position;
        const b = midNodes[(i + 1) % midNodes.length].group.position;
        netPos[i * 6] = a.x;
        netPos[i * 6 + 1] = a.y;
        netPos[i * 6 + 2] = a.z;
        netPos[i * 6 + 3] = b.x;
        netPos[i * 6 + 4] = b.y;
        netPos[i * 6 + 5] = b.z;
      }
      netGeo.attributes.position.needsUpdate = true;
      packets.forEach((pkt, i) => {
        const drift = Math.sin(time * 1.5 + i) * 0.045;
        pkt.group.position.copy(placeInView(2.05, pkt.sx, pkt.sy + drift));
      });
    };
    placeDepth(0);
    const orbit = new THREE2.Group();
    const nodeMats = [];
    const shellMats = [];
    const labelMats = [];
    LABELS.forEach((name, i) => {
      const tone = [colors.a, colors.b, colors.c, colors.d, colors.a, colors.b][i];
      const group = new THREE2.Group();
      const bodyMat = new THREE2.MeshStandardMaterial({ color: tone, emissive: tone, emissiveIntensity: 0.9, roughness: 0.28, metalness: 0.12 });
      const shellMat = new THREE2.MeshBasicMaterial({ color: tone, transparent: true, opacity: 0.4, blending: THREE2.AdditiveBlending, depthWrite: false });
      nodeMats.push(bodyMat);
      shellMats.push(shellMat);
      group.add(new THREE2.Mesh(new THREE2.SphereGeometry(0.28, 18, 18), bodyMat));
      group.add(new THREE2.Mesh(new THREE2.SphereGeometry(0.5, 14, 14), shellMat));
      const tex = new THREE2.CanvasTexture(paintLabel(name, "#f7fbff"));
      const labelMat = new THREE2.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      labelMats.push(labelMat);
      const sprite = new THREE2.Sprite(labelMat);
      sprite.position.y = 0.72;
      sprite.scale.set(1.8, 0.5, 1);
      group.add(sprite);
      const angle = i / LABELS.length * Math.PI * 2;
      group.position.set(Math.cos(angle) * 5.1, 1.55 + Math.sin(angle * 2) * 1.35, Math.sin(angle) * 3.6);
      orbit.add(group);
    });
    scene2.add(orbit);
    const lineMat = new THREE2.LineBasicMaterial({ color: colors.a });
    const linePositions = [];
    LABELS.forEach((_, i) => {
      const a = i / LABELS.length * Math.PI * 2;
      const b = (i + 1) / LABELS.length * Math.PI * 2;
      linePositions.push(Math.cos(a) * 5.1, 1.55, Math.sin(a) * 3.6, Math.cos(b) * 5.1, 1.55, Math.sin(b) * 3.6);
    });
    const lineGeo = new THREE2.BufferGeometry();
    lineGeo.setAttribute("position", new THREE2.BufferAttribute(new Float32Array(linePositions), 3));
    scene2.add(new THREE2.LineSegments(lineGeo, lineMat));
    const span = new THREE2.Mesh(
      new THREE2.TorusGeometry(6.4, 0.028, 8, 96),
      new THREE2.MeshBasicMaterial({ color: colors.d, transparent: true, opacity: 0.9 })
    );
    span.position.set(0, 1.25, 0.4);
    span.rotation.x = 1.25;
    scene2.add(span);
    rings.push(span);
    const trailPoint = (angle) => {
      const x = Math.cos(angle) * 1.95;
      const y = 1.05 + Math.sin(angle * 2) * 1.15;
      const z = 3.15 + Math.sin(angle) * 0.4;
      return [x, y, z];
    };
    const trails = MESSAGES.map((name, i) => {
      const tone = [colors.a, colors.b, colors.c, colors.d][i];
      const group = new THREE2.Group();
      const headMat = new THREE2.MeshBasicMaterial({ color: tone });
      group.add(new THREE2.Mesh(new THREE2.SphereGeometry(0.18, 14, 14), headMat));
      const tex = new THREE2.CanvasTexture(paintLabel(name, "#f7fbff"));
      const labelMat = new THREE2.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      labelMats.push(labelMat);
      const sprite = new THREE2.Sprite(labelMat);
      sprite.position.y = 0.55;
      sprite.scale.set(2.05, 0.62, 1);
      group.add(sprite);
      const beads = [];
      for (let k = 1; k <= 16; k += 1) {
        const mat = new THREE2.MeshBasicMaterial({
          color: tone,
          transparent: true,
          opacity: Math.max(0.08, 0.9 * (1 - k / 17)),
          blending: THREE2.AdditiveBlending,
          depthWrite: false
        });
        const bead = new THREE2.Mesh(new THREE2.SphereGeometry(0.09 * (1 - k / 22), 8, 8), mat);
        scene2.add(bead);
        beads.push(bead);
      }
      scene2.add(group);
      return { group, beads, phase: i / MESSAGES.length * Math.PI * 2 };
    });
    const placeTrails = (time) => {
      trails.forEach((trail) => {
        const [x, y, z] = trailPoint(trail.phase + time);
        trail.group.position.set(x, y, z);
        trail.beads.forEach((bead, k) => {
          const lag = trailPoint(trail.phase + time - (k + 1) * 0.11);
          bead.position.set(lag[0], lag[1], lag[2]);
        });
      });
    };
    placeTrails(0);
    const key = new THREE2.PointLight(colors.b, 16, 30);
    key.position.set(4, 5, 6);
    const fill = new THREE2.PointLight(colors.c, 12, 30);
    fill.position.set(-5, 2, 4);
    scene2.add(new THREE2.AmbientLight(16777215, 0.45), key, fill);
    const kit = bloomKit(THREE2);
    let rtScene = makeTarget(THREE2, 8, 8);
    let rtA = makeTarget(THREE2, 4, 4);
    let rtB = makeTarget(THREE2, 4, 4);
    let bloomOn = true;
    const resizeTargets = (w, h) => {
      const ratio = pixelRatio();
      const dw = Math.max(2, Math.floor(w * ratio));
      const dh = Math.max(2, Math.floor(h * ratio));
      rtScene.setSize(dw, dh);
      rtA.setSize(Math.max(2, Math.floor(dw / 4)), Math.max(2, Math.floor(dh / 4)));
      rtB.setSize(Math.max(2, Math.floor(dw / 4)), Math.max(2, Math.floor(dh / 4)));
    };
    const renderFrame = () => {
      const box2 = canvas.getBoundingClientRect();
      const w = Math.max(2, box2.width || window.innerWidth);
      const h = Math.max(2, box2.height || window.innerHeight);
      const ratio = pixelRatio();
      const dw = Math.floor(w * ratio);
      const dh = Math.floor(h * ratio);
      if (canvas.width !== dw || canvas.height !== dh) {
        camera2.aspect = w / h;
        camera2.updateProjectionMatrix();
        renderer2.setPixelRatio(ratio);
        renderer2.setSize(w, h, false);
        resizeTargets(w, h);
      }
      renderer2.autoClear = true;
      renderer2.setRenderTarget(null);
      renderer2.render(scene2, camera2);
      if (!bloomOn) return;
      renderer2.setRenderTarget(rtScene);
      renderer2.render(scene2, camera2);
      kit.mesh.material = kit.extract;
      kit.extract.uniforms.tDiffuse.value = rtScene.texture;
      renderer2.setRenderTarget(rtA);
      renderer2.render(kit.scene, kit.camera);
      kit.mesh.material = kit.blur;
      kit.blur.uniforms.tDiffuse.value = rtA.texture;
      kit.blur.uniforms.direction.value.set(1 / Math.max(1, rtA.width), 0);
      renderer2.setRenderTarget(rtB);
      renderer2.render(kit.scene, kit.camera);
      kit.blur.uniforms.tDiffuse.value = rtB.texture;
      kit.blur.uniforms.direction.value.set(0, 1 / Math.max(1, rtB.height));
      renderer2.setRenderTarget(rtA);
      renderer2.render(kit.scene, kit.camera);
      kit.mesh.material = kit.composite;
      kit.composite.uniforms.tBloom.value = rtA.texture;
      renderer2.autoClear = false;
      renderer2.setRenderTarget(null);
      renderer2.render(kit.scene, kit.camera);
      renderer2.autoClear = true;
      bleed.dataset.bloom = "1";
    };
    const applyPalette = () => {
      const next = palette2();
      scene2.background.set(next.bg);
      scene2.fog = null;
      renderer2.setClearColor(next.bg, 1);
      wire.material.color.set(next.a);
      core.material.color.set(next.c);
      halo.material.color.set(next.b);
      rings[0].material.color.set(next.b);
      rings[1].material.color.set(next.c);
      rings[2].material.color.set(next.d);
      points.material.color.set(next.c);
      nearPoints.material.color.set(next.a);
      ribbon.material.color.set(next.b);
      stars.material.color.set(14150911);
      net.material.color.set(next.c);
      midNodes.forEach((node, i) => node.mat.color.set([next.a, next.b, next.c, next.d, next.a, next.b][i]));
      packets.forEach((pkt, i) => {
        const tone = [next.a, next.d, next.b, next.c, next.a, next.b][i];
        pkt.mat.color.set(tone);
        pkt.beads.forEach((bead) => bead.material.color.set(tone));
      });
      lineMat.color.set(next.a);
      span.material.color.set(next.d);
      const trailTones = [next.a, next.b, next.c, next.d];
      trails.forEach((trail, i) => {
        trail.group.children[0].material.color.set(trailTones[i]);
        trail.beads.forEach((bead) => bead.material.color.set(trailTones[i]));
      });
      key.color.set(next.b);
      fill.color.set(next.c);
      const tones = [next.a, next.b, next.c, next.d, next.a, next.b];
      nodeMats.forEach((mat, i) => {
        mat.color.set(tones[i]);
        mat.emissive.set(tones[i]);
      });
      shellMats.forEach((mat, i) => mat.color.set(tones[i]));
      const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
      gridMats.forEach((mat, i) => mat.color && mat.color.set(i === 0 ? next.a : next.b));
    };
    let raf2 = 0;
    let stop = false;
    let t2 = 0;
    const pointer = { x: 0, y: 0 };
    let scrollY = window.scrollY || 0;
    const homePose = () => ({ x: pointer.x * 0.55, y: -0.55 + pointer.y * -0.2, z: 6.2 });
    const onPtr = (event) => {
      pointer.x = (event.clientX / (window.innerWidth || 1) - 0.5) * 2;
      pointer.y = (event.clientY / (window.innerHeight || 1) - 0.5) * 2;
    };
    const onScroll = () => {
      scrollY = window.scrollY || 0;
    };
    window.addEventListener("pointermove", onPtr, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => renderFrame());
    ro.observe(bleed);
    const unsettings = onSettings(applyPalette);
    camera2.lookAt(0, 0.15, 0);
    try {
      resizeTargets(bleed.clientWidth || window.innerWidth, bleed.clientHeight || window.innerHeight);
      renderFrame();
    } catch {
      bloomOn = false;
      renderer2.setRenderTarget(null);
      renderer2.render(scene2, camera2);
    }
    const current = { renderer: renderer2, scene: scene2, camera: camera2, canvas, bleed, flying: false, flyStart: 0 };
    session = current;
    const hardDispose = () => {
      stop = true;
      if (raf2) cancelAnimationFrame(raf2);
      window.removeEventListener("pointermove", onPtr);
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      unsettings();
      scene2.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((mat) => {
            if (mat.map) mat.map.dispose();
            mat.dispose();
          });
        }
      });
      labelMats.forEach((mat) => {
        if (mat.map) mat.map.dispose();
      });
      rtScene.dispose();
      rtA.dispose();
      rtB.dispose();
      kit.extract.dispose();
      kit.blur.dispose();
      kit.composite.dispose();
      renderer2.dispose();
      document.removeEventListener("visibilitychange", onVis);
      heroWatch.disconnect();
      canvas.classList.remove("is-fly");
      if (canvas.parentElement === document.body) canvas.remove();
      if (session === current) session = null;
    };
    let heroVisible = true;
    let loopOn = false;
    const kick = () => {
      if (loopOn || stop && !current.flying) return;
      loopOn = true;
      raf2 = requestAnimationFrame(tick);
    };
    const onVis = () => {
      if (!document.hidden) kick();
    };
    document.addEventListener("visibilitychange", onVis);
    const heroWatch = new IntersectionObserver((entries) => {
      heroVisible = entries.some((entry) => entry.isIntersecting);
      if (heroVisible) kick();
    });
    heroWatch.observe(bleed);
    const tick = (now) => {
      if (stop && !current.flying) {
        loopOn = false;
        return;
      }
      if (!current.flying && (document.hidden || !heroVisible)) {
        loopOn = false;
        return;
      }
      loopOn = true;
      raf2 = requestAnimationFrame(tick);
      t2 += 6e-3;
      globe.rotation.y = t2 * 0.35;
      rings.forEach((ring, i) => {
        ring.rotation.z = t2 * (0.25 + i * 0.08);
      });
      orbit.rotation.y = t2 * 0.28;
      points.rotation.y = t2 * 0.04;
      nearPoints.rotation.z = t2 * 0.03;
      placeTrails(t2 * 0.85);
      if (current.flying) {
        const u = Math.min(1, (now - current.flyStart) / 720);
        const dive = Math.sin(u * Math.PI);
        camera2.position.set(dive * 2.2, -0.2 + u * 0.8, 6.2 - u * 5.4);
        camera2.lookAt(0, 1.7, 0);
        placeDepth(t2);
        try {
          renderFrame();
        } catch {
          bloomOn = false;
        }
        if (u >= 1) hardDispose();
        return;
      }
      const pose = homePose();
      pose.y -= Math.min(scrollY, 500) * 15e-4;
      camera2.position.x += (pose.x - camera2.position.x) * 0.08;
      camera2.position.y += (pose.y - camera2.position.y) * 0.08;
      camera2.position.z += (pose.z - camera2.position.z) * 0.08;
      camera2.lookAt(0, 0.15, 0);
      placeDepth(t2);
      try {
        renderFrame();
      } catch {
        bloomOn = false;
      }
    };
    kick();
    return () => {
      window.removeEventListener("pointermove", onPtr);
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      unsettings();
      if (flyArmed && session === current && !current.flying) {
        flyArmed = false;
        current.flying = true;
        current.flyStart = performance.now();
        canvas.classList.add("is-fly");
        document.body.appendChild(canvas);
        kick();
        return;
      }
      hardDispose();
    };
  }

  // campus/js/glyphs.js
  var ORDER = [
    "foundations",
    "sip-core",
    "call-flows",
    "routing",
    "sdp",
    "rtp",
    "security",
    "nat",
    "sbc",
    "cisco",
    "multivendor",
    "cloud",
    "troubleshoot",
    "operations",
    "ecosystem",
    "capstone",
    "webrtc",
    "opensource",
    "compliance",
    "gaps"
  ];
  function reduced3() {
    const motion = document.documentElement.dataset.motion;
    if (motion === "reduce") return true;
    if (motion === "full") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function onScreen(el) {
    const rect = el.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
  }
  function loadThree3() {
    if (window.THREE) return Promise.resolve(window.THREE);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "vendor/three.min.js";
      script.onload = () => window.THREE ? resolve(window.THREE) : reject(new Error("Three.js missing"));
      script.onerror = () => reject(new Error("Three.js did not load"));
      document.head.appendChild(script);
    });
  }
  function cssHex2(name, fallback) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : fallback;
  }
  function lit(THREE2, color, emissive) {
    return new THREE2.MeshStandardMaterial({
      color,
      emissive: emissive || color,
      emissiveIntensity: 0.85,
      roughness: 0.32,
      metalness: 0.2
    });
  }
  function glow(THREE2, color) {
    return new THREE2.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.45,
      blending: THREE2.AdditiveBlending,
      depthWrite: false
    });
  }
  function build(THREE2, id, colors) {
    const g = new THREE2.Group();
    const A = colors[0];
    const B = colors[1];
    const C = colors[2];
    const add = (...meshes) => meshes.forEach((mesh) => g.add(mesh));
    if (id === "foundations") {
      const ear = new THREE2.Mesh(new THREE2.SphereGeometry(0.32, 18, 18), lit(THREE2, A));
      ear.scale.set(1, 1, 0.42);
      ear.position.set(-0.62, 0.48, 0);
      const mouth = new THREE2.Mesh(new THREE2.SphereGeometry(0.26, 18, 18), lit(THREE2, C));
      mouth.scale.set(1, 1, 0.42);
      mouth.position.set(0.62, -0.48, 0);
      const grip = new THREE2.Mesh(new THREE2.TorusGeometry(0.62, 0.09, 12, 24, Math.PI), lit(THREE2, B));
      grip.rotation.z = -0.55;
      add(ear, mouth, grip);
    } else if (id === "sip-core") {
      for (let i = 0; i < 4; i += 1) {
        const sheet = new THREE2.Mesh(new THREE2.PlaneGeometry(1.1, 0.72), lit(THREE2, i % 2 ? B : A));
        sheet.position.set(0, i * 0.12, i * 0.08);
        sheet.rotation.x = -0.4;
        sheet.rotation.y = i * 0.18;
        add(sheet);
      }
    } else if (id === "call-flows") {
      const left = new THREE2.Mesh(new THREE2.CylinderGeometry(0.05, 0.05, 1.7, 8), lit(THREE2, A));
      const right = left.clone();
      left.position.x = -0.55;
      right.position.x = 0.55;
      add(left, right);
      for (let i = 0; i < 4; i += 1) {
        const rung = new THREE2.Mesh(new THREE2.CylinderGeometry(0.035, 0.035, 1.1, 8), lit(THREE2, i % 2 ? C : B));
        rung.rotation.z = Math.PI / 2;
        rung.position.y = 0.55 - i * 0.38;
        add(rung);
      }
    } else if (id === "routing") {
      const shaft = new THREE2.Mesh(new THREE2.CylinderGeometry(0.06, 0.06, 1.1, 8), lit(THREE2, A));
      const head = new THREE2.Mesh(new THREE2.ConeGeometry(0.28, 0.45, 12), lit(THREE2, B));
      head.position.y = 0.75;
      const fork = new THREE2.Mesh(new THREE2.ConeGeometry(0.16, 0.36, 10), lit(THREE2, C));
      fork.position.set(0.45, 0.15, 0);
      fork.rotation.z = -0.9;
      add(shaft, head, fork);
    } else if (id === "sdp") {
      const offer = new THREE2.Mesh(new THREE2.PlaneGeometry(0.9, 1.15), lit(THREE2, A));
      const answer = new THREE2.Mesh(new THREE2.PlaneGeometry(0.9, 1.15), lit(THREE2, C));
      offer.rotation.set(-0.5, -0.4, 0.1);
      answer.rotation.set(-0.45, 0.5, -0.1);
      answer.position.set(0.25, 0.05, 0.2);
      add(offer, answer);
    } else if (id === "rtp") {
      for (let i = 0; i < 18; i += 1) {
        const bead = new THREE2.Mesh(new THREE2.SphereGeometry(0.07, 10, 10), lit(THREE2, i % 2 ? B : A));
        bead.position.set(-0.9 + i * 0.1, Math.sin(i * 0.55) * 0.45, Math.cos(i * 0.4) * 0.15);
        add(bead);
      }
    } else if (id === "security") {
      const body = new THREE2.Mesh(new THREE2.CylinderGeometry(0.38, 0.42, 0.7, 16), lit(THREE2, A));
      body.position.y = -0.25;
      const shackle = new THREE2.Mesh(new THREE2.TorusGeometry(0.32, 0.07, 12, 24, Math.PI), lit(THREE2, C));
      shackle.rotation.z = Math.PI;
      shackle.position.y = 0.2;
      const key = new THREE2.Mesh(new THREE2.SphereGeometry(0.1, 10, 10), glow(THREE2, B));
      add(body, shackle, key);
    } else if (id === "nat") {
      const tower = new THREE2.Mesh(new THREE2.CylinderGeometry(0.22, 0.32, 1.15, 10), lit(THREE2, A));
      const dish = new THREE2.Mesh(new THREE2.TorusGeometry(0.46, 0.05, 10, 24), lit(THREE2, C));
      dish.rotation.x = 1.15;
      dish.position.y = 0.72;
      const lamp = new THREE2.Mesh(new THREE2.SphereGeometry(0.09, 12, 12), glow(THREE2, B));
      lamp.position.set(0.18, 0.15, 0.28);
      add(tower, dish, lamp);
    } else if (id === "sbc") {
      const arch = new THREE2.Mesh(new THREE2.TorusGeometry(0.7, 0.09, 12, 28, Math.PI), lit(THREE2, A));
      arch.rotation.z = Math.PI;
      arch.position.y = 0.15;
      const postL = new THREE2.Mesh(new THREE2.CylinderGeometry(0.08, 0.08, 0.9, 8), lit(THREE2, B));
      const postR = postL.clone();
      postL.position.set(-0.7, -0.3, 0);
      postR.position.set(0.7, -0.3, 0);
      add(arch, postL, postR);
    } else if (id === "cisco") {
      const chassis = new THREE2.Mesh(new THREE2.BoxGeometry(1.5, 0.28, 0.9), lit(THREE2, A));
      const antenna = new THREE2.Mesh(new THREE2.ConeGeometry(0.08, 0.55, 8), lit(THREE2, C));
      antenna.position.set(0.45, 0.4, 0.2);
      const lamp = new THREE2.Mesh(new THREE2.SphereGeometry(0.08, 10, 10), glow(THREE2, B));
      lamp.position.set(-0.5, 0.2, 0.4);
      add(chassis, antenna, lamp);
    } else if (id === "multivendor") {
      const ico = new THREE2.Mesh(new THREE2.IcosahedronGeometry(0.32, 0), lit(THREE2, A));
      const cone = new THREE2.Mesh(new THREE2.ConeGeometry(0.26, 0.55, 10), lit(THREE2, B));
      const knot = new THREE2.Mesh(new THREE2.TorusGeometry(0.22, 0.07, 8, 16), lit(THREE2, C));
      ico.position.x = -0.55;
      cone.position.set(0.55, -0.05, 0);
      knot.position.set(0, 0.15, 0.2);
      add(ico, cone, knot);
    } else if (id === "cloud") {
      [[0, 0, 0, 0.42], [-0.4, -0.05, 0.1, 0.3], [0.42, -0.02, 0, 0.32], [0.05, 0.22, -0.1, 0.28]].forEach(([x, y, z, r], i) => {
        const puff = new THREE2.Mesh(new THREE2.SphereGeometry(r, 16, 16), lit(THREE2, i % 2 ? C : A));
        puff.position.set(x, y, z);
        add(puff);
      });
    } else if (id === "troubleshoot") {
      const rim = new THREE2.Mesh(new THREE2.TorusGeometry(0.38, 0.07, 12, 24), lit(THREE2, A));
      const lens = new THREE2.Mesh(new THREE2.CircleGeometry(0.3, 20), glow(THREE2, C));
      const handle = new THREE2.Mesh(new THREE2.CylinderGeometry(0.06, 0.06, 0.7, 8), lit(THREE2, B));
      handle.position.set(0.45, -0.45, 0);
      handle.rotation.z = 0.8;
      add(rim, lens, handle);
    } else if (id === "operations") {
      const dial = new THREE2.Mesh(new THREE2.TorusGeometry(0.62, 0.08, 12, 28), lit(THREE2, A));
      const face = new THREE2.Mesh(new THREE2.CircleGeometry(0.5, 24), lit(THREE2, B));
      const needle = new THREE2.Mesh(new THREE2.ConeGeometry(0.06, 0.55, 8), lit(THREE2, C));
      needle.rotation.z = -0.6;
      needle.position.set(0.1, 0.12, 0.05);
      add(dial, face, needle);
    } else if (id === "ecosystem") {
      const hub2 = new THREE2.Mesh(new THREE2.OctahedronGeometry(0.28), lit(THREE2, A));
      add(hub2);
      for (let i = 0; i < 5; i += 1) {
        const moon = new THREE2.Mesh(new THREE2.SphereGeometry(0.12, 10, 10), lit(THREE2, i % 2 ? C : B));
        const ang = i / 5 * Math.PI * 2;
        moon.position.set(Math.cos(ang) * 0.7, Math.sin(ang) * 0.45, Math.sin(ang) * 0.3);
        add(moon);
      }
    } else if (id === "webrtc") {
      const pane = new THREE2.Mesh(new THREE2.BoxGeometry(0.9, 0.62, 0.08), lit(THREE2, A));
      const cam = new THREE2.Mesh(new THREE2.SphereGeometry(0.1, 12, 12), glow(THREE2, C));
      cam.position.set(0.22, 0.1, 0.12);
      const mic = new THREE2.Mesh(new THREE2.CylinderGeometry(0.05, 0.05, 0.28, 8), lit(THREE2, B));
      mic.position.set(-0.22, -0.02, 0.12);
      add(pane, cam, mic);
    } else if (id === "opensource") {
      const core = new THREE2.Mesh(new THREE2.BoxGeometry(0.42, 0.42, 0.42), lit(THREE2, A));
      const ring = new THREE2.Mesh(new THREE2.TorusGeometry(0.62, 0.06, 10, 24), lit(THREE2, B));
      ring.rotation.x = Math.PI / 3;
      const sat = new THREE2.Mesh(new THREE2.OctahedronGeometry(0.16), lit(THREE2, C));
      sat.position.set(0.7, 0.25, 0);
      add(core, ring, sat);
    } else if (id === "compliance") {
      const shield = new THREE2.Mesh(new THREE2.CylinderGeometry(0.42, 0.48, 0.16, 6), lit(THREE2, A));
      const seal = new THREE2.Mesh(new THREE2.TorusGeometry(0.18, 0.05, 8, 16), glow(THREE2, C));
      seal.rotation.x = Math.PI / 2;
      seal.position.y = 0.12;
      add(shield, seal);
    } else if (id === "gaps") {
      const hub2 = new THREE2.Mesh(new THREE2.IcosahedronGeometry(0.28, 0), lit(THREE2, A));
      add(hub2);
      [[-0.55, 0.2], [0.55, 0.15], [0, -0.5], [0.4, 0.5]].forEach(([x, y], i) => {
        const leaf = new THREE2.Mesh(new THREE2.SphereGeometry(0.12, 10, 10), lit(THREE2, i % 2 ? C : B));
        leaf.position.set(x, y, 0.1);
        add(leaf);
      });
    } else {
      const knot = new THREE2.Mesh(new THREE2.TorusKnotGeometry(0.42, 0.12, 80, 12), lit(THREE2, A));
      const halo = new THREE2.Mesh(new THREE2.TorusGeometry(0.7, 0.03, 8, 32), glow(THREE2, C));
      halo.rotation.x = Math.PI / 2;
      add(knot, halo);
    }
    return g;
  }
  function drawFlat(canvas, id) {
    const ctx2 = canvas.getContext("2d");
    if (!ctx2) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx2.clearRect(0, 0, w, h);
    const accent = cssHex2("--cc-accent-1", "#7af0ff");
    const alt = cssHex2("--cc-accent-2", "#ff8bd2");
    ctx2.strokeStyle = accent;
    ctx2.fillStyle = alt;
    ctx2.lineWidth = 6;
    ctx2.lineJoin = "round";
    ctx2.save();
    ctx2.translate(w / 2, h / 2);
    if (id === "foundations") {
      ctx2.beginPath();
      ctx2.arc(-36, -28, 16, 0, Math.PI * 2);
      ctx2.arc(36, 28, 14, 0, Math.PI * 2);
      ctx2.stroke();
      ctx2.beginPath();
      ctx2.moveTo(-22, -16);
      ctx2.quadraticCurveTo(0, 8, 24, 16);
      ctx2.stroke();
    } else if (id === "nat") {
      ctx2.fillRect(-16, -40, 32, 70);
      ctx2.beginPath();
      ctx2.ellipse(0, -48, 28, 10, 0, 0, Math.PI * 2);
      ctx2.stroke();
    } else if (id === "rtp") {
      ctx2.beginPath();
      for (let i = 0; i <= 20; i += 1) ctx2.lineTo(-80 + i * 8, Math.sin(i) * 36);
      ctx2.stroke();
    } else if (id === "security") {
      ctx2.strokeRect(-28, -10, 56, 48);
      ctx2.beginPath();
      ctx2.arc(0, -10, 18, Math.PI, 0);
      ctx2.stroke();
    } else if (id === "sbc") {
      ctx2.beginPath();
      ctx2.arc(0, 10, 40, Math.PI, 0);
      ctx2.stroke();
    } else if (id === "cloud") {
      ctx2.beginPath();
      ctx2.arc(-16, 6, 22, 0, Math.PI * 2);
      ctx2.arc(16, 4, 26, 0, Math.PI * 2);
      ctx2.fill();
    } else if (id === "troubleshoot") {
      ctx2.beginPath();
      ctx2.arc(-6, -8, 24, 0, Math.PI * 2);
      ctx2.stroke();
      ctx2.beginPath();
      ctx2.moveTo(12, 12);
      ctx2.lineTo(36, 36);
      ctx2.stroke();
    } else {
      ctx2.beginPath();
      ctx2.arc(0, 0, 34, 0, Math.PI * 2);
      ctx2.stroke();
      ctx2.fillRect(-6, -28, 12, 56);
    }
    ctx2.restore();
  }
  var renderer = null;
  var scene = null;
  var camera = null;
  var THREE = null;
  var raf = 0;
  var cursor = 0;
  var cache2 = /* @__PURE__ */ new Map();
  function palette() {
    return [cssHex2("--cc-accent-1", "#7af0ff"), cssHex2("--cc-accent-2", "#c9a6ff"), cssHex2("--cc-accent-3", "#ff8bd2")];
  }
  function ensure(T) {
    if (renderer) return;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    const mobile = window.matchMedia("(max-width: 800px)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
    renderer.setSize(256, 256, false);
    renderer.setClearColor(0, 0);
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(32, 1, 0.1, 20);
    camera.position.set(1.05, 0.72, 1.9);
    camera.lookAt(0, 0, 0);
    scene.add(new T.AmbientLight(16777215, 0.55));
    const key = new T.PointLight(16777215, 12, 12);
    key.position.set(2, 3, 3);
    scene.add(key);
  }
  function paintOne(host) {
    const id = ORDER.includes(host.dataset.glyph) ? host.dataset.glyph : "capstone";
    const colors = palette();
    const key = `${id}:${colors.join(",")}`;
    let group = cache2.get(id);
    if (!group || group.userData.key !== key) {
      if (group) {
        scene.remove(group);
        group.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        });
      }
      group = build(THREE, id, colors);
      group.userData.key = key;
      cache2.set(id, group);
    }
    cache2.forEach((item) => {
      item.visible = item === group;
    });
    if (!group.parent) scene.add(group);
    group.rotation.y += 0.05;
    renderer.render(scene, camera);
    const ctx2 = host.getContext("2d");
    if (ctx2) ctx2.drawImage(renderer.domElement, 0, 0, host.width, host.height);
  }
  function mountGlyphs(root) {
    const hosts = [...root.querySelectorAll(".glyph-view")];
    if (!hosts.length) return () => {
    };
    let dead = false;
    hosts.forEach((host) => drawFlat(host, host.dataset.glyph || ""));
    const loop = () => {
      if (dead) return;
      raf = requestAnimationFrame(loop);
      if (!renderer || document.hidden || reduced3()) return;
      if (!hosts.some((host) => host.isConnected && onScreen(host))) return;
      const batch = Math.min(4, hosts.length);
      for (let n = 0; n < batch; n += 1) {
        const host = hosts[cursor % hosts.length];
        cursor += 1;
        if (!host.isConnected) continue;
        try {
          paintOne(host);
        } catch {
          drawFlat(host, host.dataset.glyph || "");
        }
      }
    };
    loadThree3().then((T) => {
      if (dead) return;
      THREE = T;
      try {
        ensure(T);
      } catch {
        return;
      }
      if (!reduced3()) loop();
      else hosts.forEach((host) => paintOne(host));
    }).catch(() => {
    });
    return () => {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }

  // campus/js/menu.js
  var NAV = [
    { href: "#/", label: "Home", group: "Learn", icon: "home", desc: "The call-path opening screen." },
    { href: "#/tracks", label: "Tracks", group: "Learn", icon: "tracks", desc: "Twenty tracks, from signaling through the ecosystem gaps." },
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
    { href: "#/regions", label: "Regions", group: "Field", icon: "regions", i18n: "regions", desc: "Cited facts, plus examples marked as examples." }
  ];
  function iconHTML2(name) {
    const id = `ico-${String(name || "home").replace(/[^a-z0-9-]/g, "") || "home"}`;
    return `<svg class="menu-ico" aria-hidden="true" width="22" height="22"><use href="#${id}"></use></svg>`;
  }
  function navCurrent(path, href) {
    if (href === "#/tracks") {
      return path === "#/tracks" || path.startsWith("#/track/") || path.startsWith("#/lesson/") || path === "#/labs" || path.startsWith("#/guide") || path.startsWith("#/boss") || path.startsWith("#/interview");
    }
    if (href === "#/") return path === "#/" || path === "";
    if (href === "#/downloads") return path === "#/downloads";
    return path === href || path.startsWith(`${href}/`);
  }
  function menuRows(path, query) {
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
    return `<a class="menu-item" href="${item.href}"${current}>${iconHTML2(item.icon)}<span class="menu-copy"><strong${i18n}>${esc(item.label)}</strong><small>${esc(item.desc)}</small></span></a>`;
  }

  // campus/js/guide.js
  var book = null;
  var endpoint = "";
  var token = 0;
  var generation = 0;
  var tour = null;
  var tourStep = 0;
  var quizIndex = -1;
  function reduced4() {
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
    a.forEach((part) => {
      if (b.has(part)) shared += 1;
    });
    return 2 * shared / (a.size + b.size);
  }
  function scoreText(query, text2) {
    const q = norm(query);
    const hay = norm(text2);
    if (!q || !hay) return 0;
    if (hay.includes(q) || q.includes(hay)) return 1;
    return dice(q, hay);
  }
  function bestEntry(query) {
    let best = null;
    let score = 0;
    for (const entry of book.entries) {
      const blob = [entry.text, ...entry.prompts || []].join(" ");
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
      const blob = [item.title, ...item.prompts || []].join(" ");
      const next = scoreText(query, blob);
      if (next > score) {
        score = next;
        best = item;
      }
    }
    return score >= 0.45 ? best : null;
  }
  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
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
    if (kind !== "bot" || reduced4()) {
      node.innerHTML = html;
      return;
    }
    node.classList.add("is-typing");
    node.textContent = "";
    const dots = document.createElement("span");
    dots.className = "guide-dots";
    dots.textContent = "\xB7\xB7\xB7";
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
    const text2 = extra ? `${extra} ${book.fallback}` : book.fallback;
    await bubble("bot", `<p>${esc(text2)}</p>`, text2);
    if (mine !== generation) return;
    setChips(book.chips);
  }
  async function askEndpoint(question) {
    if (!endpoint) return null;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question })
    });
    if (!res.ok) return { miss: "The guide endpoint did not answer." };
    const body = await res.json();
    const id = body && typeof body.id === "string" ? body.id : "";
    const entry = book.entries.find((item) => item.id === id);
    if (!entry) return { miss: "The guide endpoint did not name a page in this campus. I did not use any other text it sent." };
    return { entry };
  }
  function configureGuide(options) {
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
    const html = `<p><strong>${esc(tour.title)}</strong> \xB7 ${tourStep + 1} of ${tour.steps.length}</p><p>${esc(step.text)}${citeHTML(step.cite)}</p>`;
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
    if (globalThis.SIPBOT_READY && !/\btour\b/i.test(trimmed)) {
      try {
        const bot = await globalThis.SIPBOT_READY;
        const answer = bot.ask(trimmed);
        const quiet = answer.mode === "fallback" || answer.intent === "help" || answer.intent === "injection" || answer.intent === "greet" || answer.intent === "smalltalk";
        const linked = answer.href && !quiet;
        const html = `<p>${esc(answer.text || "")}</p>${answer.example ? `<pre>${esc(answer.example)}</pre>` : ""}${linked ? `<p><a href="${esc(answer.href)}">${esc(answer.link || "Open this page")}</a></p>` : ""}`;
        await bubble("bot", html, answer.text || "");
        if (mine !== generation) return;
        const chips = answer.intent === "help"
          ? ["Where do I start?", "SIP messages", "SDP", "RTP", "NAT and ICE", "SBCs"]
          : [answer.follow || "What can you help with?"];
        setChips(chips.filter(Boolean));
        return;
      } catch {
        /* The campus quiz book remains if the shared index is missing. */
      }
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
  async function mountGuide() {
    const root = document.querySelector("#guide");
    const panel = document.querySelector("#guide-panel");
    const open = document.querySelector("#guide-open");
    const form = document.querySelector("#guide-form");
    if (!root || !panel || !open || !form || root.dataset.bound) return;
    root.dataset.bound = "1";
    globalThis.SIP_GUIDE = {
      configure: configureGuide,
      get endpoint() {
        return endpoint;
      }
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
      choice.closest(".guide-choices")?.querySelectorAll("button").forEach((button) => {
        button.disabled = true;
      });
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

  // campus/js/app.js
  var view = document.querySelector("#view");
  var titleEl = document.querySelector("#view-title");
  var announcer = document.querySelector("#announcer");
  var rail = document.querySelector("#rail");
  var bottom = document.querySelector("#bottom");
  var pill = document.querySelector("#progress-pill");
  var PROG = "sip-universe-progress";
  var catalog = null;
  var menuQuery = "";
  var cleanup = () => {
  };
  var routeGen = 0;
  function progress() {
    try {
      return JSON.parse(localStorage.getItem(PROG) || '{"lessons":{}}');
    } catch {
      return { lessons: {} };
    }
  }
  function saveProgress(next) {
    localStorage.setItem(PROG, JSON.stringify(next));
    updatePill();
  }
  function lessonKey(track, lesson) {
    return `${track}/${lesson}`;
  }
  function mark(track, lesson, patch) {
    const data = progress();
    const key = lessonKey(track, lesson);
    data.lessons[key] = { ...data.lessons[key] || {}, ...patch };
    saveProgress(data);
    if (patch.read) noteBadge("read");
    if (patch.quizN && patch.quiz / patch.quizN >= 0.8) noteBadge("quiz");
    if (patch.lab) noteBadge("lab");
  }
  function updatePill() {
    const data = progress();
    const done = Object.values(data.lessons).filter((row2) => row2.read || row2.quizN && row2.quiz / row2.quizN >= 0.8).length;
    const total = catalog ? catalog.stats.lessons : 0;
    pill.textContent = total ? `${done}/${total} read` : `${done} read`;
  }
  function markPrime(path) {
    document.querySelectorAll(".prime a, .study-nav a").forEach((link) => {
      const href = link.getAttribute("href");
      const on = path === href || href !== "#/" && path.startsWith(href);
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
  function setTitle(text2) {
    titleEl.tabIndex = -1;
    titleEl.textContent = text2;
    document.title = text2 === "SIP Universe" ? text2 : `${text2} \xB7 SIP Universe`;
    announcer.textContent = text2;
    titleEl.focus();
  }
  function paintNav(path) {
    const active2 = document.activeElement;
    const html = menuRows(path, menuQuery);
    const railList = document.querySelector("#rail-list");
    if (railList) {
      railList.innerHTML = `${html}<button type="button" class="menu-item rail-settings" id="rail-settings">${iconHTML2("settings")}<span class="menu-copy"><strong>Settings</strong><small>Theme, motion, sound, and type size.</small></span></button>`;
      railList.querySelector("#rail-settings").addEventListener("click", openSettings);
    }
    const phoneList = document.querySelector("#phone-menu-list");
    if (phoneList) phoneList.innerHTML = html;
    const results = document.querySelector("#menu-results");
    if (results) {
      const open = menuQuery.trim().length > 0;
      results.hidden = !open;
      results.innerHTML = open ? html : "";
    }
    markPrime(path);
    bottom.querySelectorAll("a").forEach((link) => {
      const href = link.getAttribute("href");
      if (navCurrent(path, href)) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    if (active2 && (active2.id === "rail-q" || active2.id === "menu-q" || active2.id === "head-q")) active2.focus();
  }
  var menuHistory = false;
  function setMenuExpanded(open) {
    document.querySelectorAll("#menu-open, #quick-menu").forEach((button) => {
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  function openPhoneMenu() {
    const dialog = document.querySelector("#phone-menu");
    if (!dialog || dialog.open) return;
    paintNav(parseHash().path);
    dialog.showModal();
    setMenuExpanded(true);
    history.pushState({ sipMenu: true }, "");
    menuHistory = true;
    document.querySelector("#phone-menu-close")?.focus();
  }
  function closePhoneMenu() {
    const dialog = document.querySelector("#phone-menu");
    if (menuHistory) {
      menuHistory = false;
      history.back();
      return;
    }
    if (dialog?.open) dialog.close();
    setMenuExpanded(false);
  }
  function listenClip() {
    const behavior = document.documentElement.dataset.motion === "reduce" ? "auto" : "smooth";
    const tryPlay = (tries) => {
      const section = document.querySelector("#architect");
      if (!section) {
        if (tries < 40) window.setTimeout(() => tryPlay(tries + 1), 50);
        return;
      }
      section.scrollIntoView({ behavior, block: "start" });
      const audio = document.querySelector("#architect-use");
      if (audio) audio.play().catch(() => {
      });
    };
    if ((location.hash || "#/") !== "#/") location.hash = "#/";
    tryPlay(0);
  }
  function bindMenuSearch() {
    document.querySelectorAll("#rail-q, #menu-q, #head-q").forEach((input) => {
      input.addEventListener("input", () => {
        menuQuery = input.value;
        document.querySelectorAll("#rail-q, #menu-q, #head-q").forEach((other) => {
          if (other !== input) other.value = menuQuery;
        });
        paintNav(parseHash().path);
      });
    });
  }
  function bindPhoneMenu() {
    bindMenuSearch();
    document.querySelector("#menu-open")?.addEventListener("click", openPhoneMenu);
    document.querySelector("#menu-listen")?.addEventListener("click", () => {
      closePhoneMenu();
      listenClip();
    });
    document.querySelector("#quick-menu")?.addEventListener("click", openPhoneMenu);
    document.querySelector("#quick-listen")?.addEventListener("click", listenClip);
    document.querySelector("#phone-menu-close")?.addEventListener("click", closePhoneMenu);
    document.querySelector("#menu-settings")?.addEventListener("click", () => {
      const dialog2 = document.querySelector("#phone-menu");
      if (menuHistory) {
        menuHistory = false;
        history.replaceState(null, "");
      }
      if (dialog2?.open) dialog2.close();
      setMenuExpanded(false);
      openSettings();
    });
    const dialog = document.querySelector("#phone-menu");
    dialog?.addEventListener("cancel", (event) => {
      event.preventDefault();
      closePhoneMenu();
    });
    dialog?.addEventListener("close", () => setMenuExpanded(false));
    dialog?.addEventListener("click", (event) => {
      if (event.target === dialog) {
        closePhoneMenu();
        return;
      }
      const link = event.target.closest("a[href]");
      if (!link || !dialog.contains(link)) return;
      event.preventDefault();
      const href = link.getAttribute("href");
      if (menuHistory) {
        menuHistory = false;
        history.replaceState(null, "");
      }
      dialog.close();
      setMenuExpanded(false);
      if (href && location.hash !== href) location.hash = href;
    });
    dialog?.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = [...dialog.querySelectorAll("a, button, select")];
      const index = items.indexOf(document.activeElement);
      if (index < 0) return;
      event.preventDefault();
      const next = event.key === "ArrowDown" ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
      items[next].focus();
    });
    window.addEventListener("popstate", () => {
      menuHistory = false;
      if (dialog?.open) dialog.close();
      setMenuExpanded(false);
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
      if (!picked) {
        why.hidden = false;
        why.textContent = "Pick an answer first.";
        return;
      }
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
      <p class="hero-kicker">SIP \xB7 SDP \xB7 RTP</p>
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
        <p>Two short clips. Signal and Border walk the campus: how to view it, practise, and share it. The player is ready for a later recording at the same file names. The clips shipped today were spoken with eSpeak NG 1.51, with a quiet pad underneath.</p>
        <audio id="architect-use" controls preload="none" src="audio/architect-use.mp3"></audio>
        <audio id="architect-share" controls preload="none" src="audio/architect-share.mp3"></audio>
        <p class="fine">Scripts: <a href="audio/scripts/architect-use.md">how to view</a> \xB7 <a href="audio/scripts/architect-share.md">how to practise and share</a>.</p>
        <p>Lucky is a lifelong student and an AI enthusiast. The path here runs through systems, networking, voice, and the contact center, and it is growing into AI omni-channel agents. This campus is that study, wider than a UC engineer title.</p>
        <p><a href="https://github.com/CypherMonkeyLabs/sip-universe-lab-free-university-mesmerizing">Rate, comment, or help on the repository</a> \xB7 <a href="https://cyphermonkeylabs.com/#contact" rel="noopener noreferrer">Contact</a></p>
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
      const behavior = document.documentElement.dataset.motion === "reduce" ? "auto" : "smooth";
      view.querySelector("#architect")?.scrollIntoView({ behavior, block: "start" });
      const audio = view.querySelector("#architect-use");
      if (audio) audio.play().catch(() => {
      });
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
      const row2 = data.lessons[lessonKey(track.id, lesson.id)];
      return row2 && (row2.read || row2.quizN && row2.quiz / row2.quizN >= 0.8);
    }).length;
    const pct = Math.round(done / track.lessons.length * 100);
    const ring = (188.4 * pct / 100).toFixed(1);
    return `<a class="card" href="#/track/${esc(track.id)}">
    <div class="card-top">${iconHTML(track.id)}
      <svg class="ring" viewBox="0 0 72 72" aria-label="${pct} percent">
        <circle class="ring-track" cx="36" cy="36" r="30"></circle>
        <circle class="ring-val" cx="36" cy="36" r="30" stroke-dasharray="${ring} 188.4"></circle>
        <text x="36" y="41">${pct}</text>
      </svg>
    </div>
    <span class="kicker">${esc(track.level)} \xB7 ${track.lessons.length} lessons</span>
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
    view.innerHTML = `<p class="lede">${catalog.stats.tracks} tracks, from the first Via header through WebRTC, the open-source core, compliance study, and the ecosystem gaps. Open one. Lessons load on their own.</p>
    <div class="card-grid">${catalog.tracks.map(trackCard).join("")}</div>`;
    return () => {
    };
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
        <section id="go-deeper" class="go-deeper"><h2>Sources and go deeper</h2><ul>${lessonSources(lesson)}</ul></section>
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
    view.querySelector("#mark-read").addEventListener("click", () => {
      mark(track.id, lesson.id, { read: true });
      playTone("ok");
    });
    const stopFlow = mountFlow(view.querySelector("#lesson-flow"), lesson.flow);
    mountQuiz(view.querySelector("#lesson-quiz"), lesson.quiz, (score, total) => mark(track.id, lesson.id, { quiz: score, quizN: total, read: score / total >= 0.8 }));
    mountCards(view.querySelector("#lesson-cards"), lesson.cards);
    const stopLab = await mountLab(view.querySelector("#lesson-lab"), lesson, () => mark(track.id, lesson.id, { lab: true }));
    mountFault(view.querySelector("#lesson-fault"), lesson.fault, () => mark(track.id, lesson.id, { fault: true }));
    narrate(`${lesson.title}. ${lesson.summary}`);
    return () => {
      stopFlow();
      if (stopLab) stopLab();
      stopNarration();
    };
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
    const queue = [...cards || []];
    const draw = () => {
      const card = queue[index];
      if (!card) {
        host.innerHTML = `<p>No cards.</p>`;
        return;
      }
      host.innerHTML = `<div class="flash">
      <p class="fine">Card ${index + 1} of ${queue.length}</p>
      <div class="flash-face"><p>${esc(flipped ? card.back : card.front)}</p></div>
      <div class="row-actions">
        <button type="button" id="flip">Flip</button>
        <button type="button" id="next-card">Next</button>
      </div>
      ${flipped && card.cite ? `<p><a href="${esc(card.cite.url)}">${esc(card.cite.label)}</a></p>` : ""}
    </div>`;
      host.querySelector("#flip").addEventListener("click", () => {
        flipped = !flipped;
        playTone("click");
        draw();
      });
      host.querySelector("#next-card").addEventListener("click", () => {
        index = (index + 1) % queue.length;
        flipped = false;
        playTone("click");
        draw();
      });
    };
    draw();
  }
  function mountFault(host, fault, onPass) {
    if (!fault) {
      host.innerHTML = `<p>No fault in this lesson.</p>`;
      return;
    }
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
    if (!lab) {
      host.innerHTML = `<p>No lab.</p>`;
      return () => {
      };
    }
    host.innerHTML = `<article class="lab"><h3>${esc(lab.title)}</h3><p>${esc(lab.prompt || "")}</p>
    ${lab.steps ? `<ol>${lab.steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>` : ""}
    ${lab.config ? `<pre>${esc(lab.config)}</pre>` : ""}
    <div id="lab-tool"></div>
    <div id="lab-check"></div>
  </article>`;
    const tool = host.querySelector("#lab-tool");
    let stop = () => {
    };
    if (lab.kind === "ladder") stop = mountFlow(tool, lab.flow || lesson.flow);
    if (["dissect", "sdp", "sandbox", "capture"].includes(lab.kind)) {
      if (lab.kind === "dissect") mountDissector(tool, lab.message || "");
      if (lab.kind === "sdp") mountSdp(tool, lab.offer || "", lab.answer || "");
      if (lab.kind === "sandbox") mountSandbox(tool, lab.rules || "", lab.message || "", lab.dialect || "cube");
      if (lab.kind === "capture") mountCapture(tool, lab.message || "");
    }
    mountCheck(host.querySelector("#lab-check"), lab.check, onPass);
    return stop;
  }
  function notFound() {
    setTitle("Page not found");
    view.innerHTML = `<p>That path is not a track, lesson, or bench. <a href="#/">Return home</a> or open <a href="#/tracks">the tracks</a>.</p>`;
    return () => {
    };
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
    } catch {
      guideHits = [];
    }
    const lessonWord = hits.length === 1 ? "lesson" : "lessons";
    const guideWord = guideHits.length === 1 ? "guide section" : "guide sections";
    view.innerHTML = `<p class="lede">${q ? `${hits.length} ${lessonWord} and ${guideHits.length} ${guideWord} match \u201C${esc(q)}\u201D.` : "Type a header, status code, product, or RFC number."}</p>
    ${guideHits.length ? `<h2>Field guide</h2><ul>${guideHits.map((hit) => `<li><a href="${esc(hit.href)}">${esc(hit.title)}</a><br><span class="fine">${esc(hit.summary)}</span></li>`).join("")}</ul>` : ""}
    <h2>Lessons</h2>
    <ul>${hits.map(({ track, lesson }) => `<li><a href="#/lesson/${esc(track.id)}/${esc(lesson.id)}">${esc(lesson.title)}</a> <span class="fine">${esc(track.title)}</span><br><span class="fine">${esc(lesson.summary)}</span></li>`).join("")}</ul>`;
    return () => {
    };
  }
  async function renderTool(name) {
    const samples = await loadJSON("data/samples.json");
    const map = {
      ladder: ["SIP ladders", "Step a synthetic call. Inspect prints the message for that hop."],
      dissector: ["SIP dissector", "Paste a request or response. Compact header names are expanded using RFC 3261 and the extensions called out in the lesson."],
      sdp: ["SDP offer/answer", "The negotiator follows the order and port rules in RFC 3264 and flags profile mismatches."],
      sandbox: ["Normalization sandbox", "A teaching subset of CUBE SIP profiles and Oracle header rules. It is not the vendor parser."],
      capture: ["Capture bench", "Paste synthetic debug ccsip messages output. Timestamp prefixes are stripped, then each SIP message is dissected."]
    };
    if (!map[name]) return notFound();
    setTitle(map[name][0]);
    view.innerHTML = `${crumbs([["Tools", "#/tools"], [map[name][0]]])}<p class="lede">${map[name][1]}</p><div id="tool-host"></div>`;
    const host = view.querySelector("#tool-host");
    if (name === "ladder") {
      const flows = samples.flows;
      host.innerHTML = `<label class="stack">Flow <select id="flow-pick">${flows.map((flow, i) => `<option value="${i}">${esc(flow.title)}</option>`).join("")}</select></label><div id="flow-host"></div>`;
      let stop = () => {
      };
      const draw = () => {
        stop();
        stop = mountFlow(host.querySelector("#flow-host"), flows[Number(host.querySelector("#flow-pick").value)]);
      };
      host.querySelector("#flow-pick").addEventListener("change", draw);
      draw();
      return () => stop();
    }
    if (name === "dissector") mountDissector(host, samples.messages.invite);
    if (name === "sdp") mountSdp(host, samples.sdp.offer, samples.sdp.answer);
    if (name === "sandbox") mountSandbox(host, samples.sandbox.rules, samples.sandbox.message, "cube");
    if (name === "capture") mountCapture(host, samples.capture);
    return () => {
    };
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
    return () => {
    };
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
    return () => {
    };
  }
  function lessonSources(lesson) {
    const seen = /* @__PURE__ */ new Set();
    const items = [];
    const walk = (node) => {
      if (!node || typeof node !== "object") return;
      if (typeof node.label === "string" && typeof node.url === "string" && node.url.startsWith("http")) {
        const key = `${node.label}|${node.url}`;
        if (!seen.has(key)) {
          seen.add(key);
          items.push(node);
        }
      }
      const values = Array.isArray(node) ? node : Object.values(node);
      values.forEach(walk);
    };
    walk(lesson);
    if (!items.length) return "<li>confirm</li>";
    return items.map((cite) => {
      if (/https?:\/\/(?:www\.)?fcc\.gov/i.test(cite.url)) return `<li>${esc(cite.label)} \u2014 confirm</li>`;
      return `<li><a href="${esc(cite.url)}">${esc(cite.label)}</a> \u2014 last checked 2026-10</li>`;
    }).join("");
  }
  function ecoCards(items) {
    return (items || []).map((item) => `<article class="card"><h3>${esc(item.name)}</h3><p>${esc(item.blurb)}</p>${citeLinks(item.cites)}</article>`).join("");
  }
  async function renderEcosystem() {
    const data = await loadJSON("data/ecosystem.json");
    setTitle("Ecosystem");
    const author = data.author ? `<section class="panel" id="campus-author"><h2>${esc(data.author.title)}</h2><p>${esc(data.author.blurb)}</p>${citeLinks(data.author.cites)}</section>` : "";
    const disclaimer = data.disclaimer ? `<p class="fine">${esc(data.disclaimer)}</p>` : "";
    const extra = [
      ["Configuration", data.config],
      ["Troubleshooting", data.troubleshoot],
      ["Integration hooks", data.hooks]
    ].filter(([, items]) => items && items.length).map(([title, items]) => `<h2>${title}</h2><div class="card-grid">${ecoCards(items)}</div>`).join("");
    view.innerHTML = `${iconHTML("ecosystem")}<p class="lede">${esc(data.summary)}</p>
    ${disclaimer}
    ${author}
    <h2>Neighboring systems</h2>
    <div class="card-grid">${ecoCards(data.sisters)}</div>
    <h2>Where SIP shows up in the UC stack</h2>
    ${data.bridges.map((item) => `<section class="panel"><h3>${esc(item.name)}</h3><p>${esc(item.blurb)}</p>${citeLinks(item.cites)}</section>`).join("")}
    ${extra}
    ${illustration(data.map)}
    <h2>Timeline</h2>
    <div class="scroll"><table><thead><tr><th scope="col">RFC</th><th scope="col">Date</th><th scope="col">Title</th><th scope="col">Status note</th></tr></thead><tbody>
      ${data.timeline.map((row2) => `<tr><td><a href="${esc(row2.url)}">${esc(row2.rfc)}</a></td><td>${esc(row2.date || "see RFC")}</td><td>${esc(row2.title)}</td><td>${esc(row2.note || "")}</td></tr>`).join("")}
    </tbody></table></div>`;
    return () => {
    };
  }
  async function renderCerts() {
    const data = await loadJSON("data/certs.json");
    setTitle("Certifications and courses");
    view.innerHTML = `<p class="lede">${esc(data.summary)}</p>` + data.items.map((item) => `
    <article class="panel"><h2>${esc(item.name)}</h2><p><strong>${esc(item.status)}</strong></p><p>${esc(item.note)}</p>
    <p><a href="${esc(item.url)}">${esc(item.url)}</a></p></article>`).join("");
    return () => {
    };
  }
  async function renderInterview() {
    const data = await loadJSON("data/interview.json");
    setTitle("Interview drills");
    view.innerHTML = `<p class="lede">Answer out loud, then open the citation. These are drills, not a dump of a vendor\u2019s exam.</p>` + data.items.map((item, i) => `<article class="panel"><h2>${i + 1}. ${esc(item.q)}</h2><p class="fine">${esc(item.level)}</p><button type="button" data-i="${i}">Show a cited answer</button><div class="why" hidden></div></article>`).join("");
    view.querySelectorAll("button[data-i]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = data.items[Number(button.dataset.i)];
        const why = button.parentElement.querySelector(".why");
        why.hidden = false;
        why.innerHTML = `<p>${esc(item.a)}</p>${citeLinks(item.cites)}`;
      });
    });
    return () => {
    };
  }
  async function renderBoss(id) {
    const data = await loadJSON("data/boss.json");
    if (!id) {
      setTitle("Boss incidents");
      view.innerHTML = `<p class="lede">Synthetic logs. The failure mode is real; the trace was written for the lab.</p><div class="card-grid">${data.incidents.map((item) => `<a class="card" href="#/boss/${esc(item.id)}"><span class="kicker">${item.steps.length} steps</span><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p></a>`).join("")}</div>`;
      return () => {
      };
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
        if (next) next.addEventListener("click", () => {
          step += 1;
          draw();
        });
      });
    };
    draw();
    return () => {
    };
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
    return () => {
    };
  }
  async function renderLabs() {
    const data = await loadJSON("data/labs.json");
    setTitle("Labs");
    view.innerHTML = `<p class="lede">Featured benches, plus a lab inside every lesson. ${catalog.stats.labs} lesson labs are in the tracks.</p>
    <div class="card-grid">${data.labs.map((lab) => `<a class="card" href="${esc(lab.href)}"><span class="kicker">${esc(lab.kind)}</span><h3>${esc(lab.title)}</h3><p>${esc(lab.prompt)}</p></a>`).join("")}</div>`;
    return () => {
    };
  }
  async function render() {
    const gen = ++routeGen;
    const parsed = parseHash();
    if (render.last && render.last !== parsed.path) {
      armFly();
      window.scrollTo(0, 0);
    }
    render.last = parsed.path;
    cleanup();
    cleanup = () => {
    };
    stopNarration();
    const { path, params } = parsed;
    document.body.classList.toggle("is-home", path === "#/" || path === "");
    document.body.classList.toggle("is-stage", path === "#/atlas" || path === "#/flows" || path === "#/charts");
    paintNav(path);
    view.setAttribute("aria-busy", "true");
    let stop = () => {
    };
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
        else if (match = path.match(/^#\/lesson\/([\w-]+)\/([\w-]+)\/?$/)) stop = await renderLesson(match[1], match[2]);
        else if (match = path.match(/^#\/tools\/([\w-]+)\/?$/)) stop = await renderTool(match[1]);
        else if (match = path.match(/^#\/boss\/([\w-]+)\/?$/)) stop = await renderBoss(match[1]);
        else if (path === "#/track" || path === "#/lesson" || path === "#/tools/") location.hash = path.startsWith("#/tools") ? "#/tools" : "#/tracks";
        else stop = notFound();
      }
    } catch (err) {
      setTitle("Could not load this view");
      view.innerHTML = `<p>The file did not load. If you are offline, open a track you visited once before.</p><p class="fine">${esc(err.message)}</p><button type="button" id="retry" class="primary">Retry</button>`;
      view.querySelector("#retry").addEventListener("click", () => render());
      stop = () => {
      };
    }
    if (gen !== routeGen) {
      if (typeof stop === "function") stop();
      return;
    }
    const stopGlyphs = mountGlyphs(view);
    const stopReveal = bindReveal(view);
    const stopRoute = typeof stop === "function" ? stop : () => {
    };
    cleanup = () => {
      stopRoute();
      stopGlyphs();
      stopReveal();
    };
    view.removeAttribute("aria-busy");
    titleEl.setAttribute("tabindex", "-1");
    applyLang(getSettings().lang || document.documentElement.lang || "en");
  }
  function openSettings() {
    const dialog = document.querySelector("#settings");
    const settings2 = getSettings();
    dialog.querySelectorAll('input[name="theme"]').forEach((input) => {
      input.checked = input.value === settings2.theme;
    });
    dialog.querySelectorAll('input[name="font"]').forEach((input) => {
      input.checked = input.value === settings2.font;
    });
    dialog.querySelector('[name="sfx"]').checked = settings2.sfx;
    dialog.querySelector('[name="narration"]').checked = settings2.narration;
    dialog.querySelector('[name="motion"]').checked = settings2.motion === "reduce";
    const langSel = dialog.querySelector("#settings-lang");
    if (langSel) langSel.value = settings2.lang || "en";
    dialog.querySelector('[name="rate"]').value = settings2.rate;
    dialog.querySelector("#rate-val").textContent = settings2.rate;
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
      lang: form.querySelector("#settings-lang")?.value || getSettings().lang
    });
    form.addEventListener("change", read);
    form.querySelector("#rate").addEventListener("input", () => {
      form.querySelector("#rate-val").textContent = form.querySelector("#rate").value;
      read();
    });
    document.querySelector("#open-settings").addEventListener("click", openSettings);
    document.querySelector("#prime-settings")?.addEventListener("click", openSettings);
  }
  async function boot() {
    loadSettings();
    applySettings();
    bindSettings();
    onSettings(() => {
      if ((location.hash || "#/") === "#/" || location.hash === "#/topology") render();
    });
    document.querySelector("#search-form").addEventListener("submit", (event) => {
      event.preventDefault();
      location.hash = `#/search?q=${encodeURIComponent(document.querySelector("#q").value)}`;
    });
    document.querySelector("#more").addEventListener("click", (event) => {
      if (event.target.tagName === "A") document.querySelector("#more").close();
    });
    bindPhoneMenu();
    try {
      catalog = await loadJSON("data/catalog.json");
    } catch (err) {
      setTitle("SIP Universe");
      view.innerHTML = `<p>The catalog did not load. On disk, embedded-data.js has to load before this script. Over HTTP, data/catalog.json has to answer.</p><p class="fine">${esc(err.message)}</p>`;
      return;
    }
    updatePill();
    bindChrome(catalog);
    mountGuide();
    window.addEventListener("hashchange", render);
    if (!location.hash) location.hash = "#/";
    else render();
    window.setTimeout(() => {
      if (location.protocol === "file:") return;
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").then(() => {
          window.setTimeout(() => {
            catalog.tracks.forEach((track) => {
              fetch(track.file).catch(() => {
              });
            });
            ["data/glossary.json", "data/boss.json", "data/interview.json", "data/ecosystem.json", "data/certs.json", "data/labs.json", "data/samples.json", "data/ports.json", "data/fieldguide.json", "data/daily.json", "data/guidebot.json", "downloads/manifest.json"].forEach((path) => {
              fetch(path).catch(() => {
              });
            });
          }, 8e3);
        }).catch(() => {
        });
      }
    }, 4e3);
  }
  boot();
})();
