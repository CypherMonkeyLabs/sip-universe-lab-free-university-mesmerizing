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
    <svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-title ${id}-desc">
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
      const body = (spec.rows || []).map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("");
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
    theme: "holographic",
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
    return document.documentElement.dataset.motion !== "reduce";
  }
  function svg(label, w, h, body) {
    return `<svg class="atlas-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
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
  function ladder(parties, steps, w = 860, row = 52) {
    const top = 48;
    const h = top + steps.length * row + 24;
    const col = w / parties.length;
    const heads = parties.map((name, i) => {
      const x = col * i + col / 2;
      return `${text(x, 28, name)}<line x1="${x}" y1="40" x2="${x}" y2="${h - 16}" stroke="var(--cc-line)" stroke-width="2"></line>`;
    }).join("");
    const hops = steps.map((step, i) => {
      const x1 = col * step.from + col / 2;
      const x2 = col * step.to + col / 2;
      const y = top + i * row + 18;
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
        const body = rows.map((row, i) => `${text(40, 48 + i * 36, row[0], "d-sub", "start")}${text(140, 48 + i * 36, row[1], "d-label", "start")}`).join("");
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
      draw: () => `<img class="atlas-svg" alt="REGISTER sequence drawn by Mermaid" src="diagrams/register.svg">`
    },
    {
      id: "mermaid-border",
      title: "Border paths, from Mermaid",
      caption: "A teaching sketch of a phone, an SBC, a call agent, and a carrier. Mermaid 11.12.0 drew it at build time. It is not a customer topology.",
      cite: { label: "RFC 7092", url: "https://www.rfc-editor.org/rfc/rfc7092" },
      draw: () => `<img class="atlas-svg" alt="Phone, SBC, CUCM, and carrier drawn by Mermaid" src="diagrams/border.svg">`
    }
  ];
  var ANIMATED = /* @__PURE__ */ new Set([
    "invite-txn",
    "noninvite",
    "stun",
    "turn",
    "nat",
    "ice",
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
    "cutover",
    "fault-tree"
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
    "data/daily.json"
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
  var SPECS = {
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
    operations: [[0.15, 0, 0.15, 2, 2, 0.3], [0.7, 0.35, 0.7, 0.9, 0.9, 0.35], [1, 0.75, 1, 0.28, 0.28, 0.9]],
    ecosystem: [[0.9, 0, 0.9, 0.7, 0.7, 0.7], [0, 0, 0.2, 0.55, 0.55, 0.55], [1.8, 0, 0.3, 0.55, 0.55, 0.9], [0.3, 0, 1.7, 0.55, 0.55, 1.1], [1.6, 0, 1.6, 0.5, 0.5, 0.5]],
    capstone: [[0.85, 0, 0.85, 0.8, 0.8, 1.6], [0.2, 0.9, 0.85, 2.1, 0.35, 0.35], [0.85, 0.9, 0.2, 0.35, 2.1, 0.35]]
  };
  var TONES = [
    ["var(--cc-accent-1)", "color-mix(in srgb, var(--cc-accent-1) 62%, #05060c)", "color-mix(in srgb, var(--cc-accent-2) 70%, #05060c)"],
    ["var(--cc-accent-2)", "color-mix(in srgb, var(--cc-accent-2) 60%, #05060c)", "color-mix(in srgb, var(--cc-accent-3) 68%, #05060c)"],
    ["var(--cc-accent-3)", "color-mix(in srgb, var(--cc-accent-3) 58%, #05060c)", "color-mix(in srgb, var(--cc-accent-4) 70%, #05060c)"],
    ["var(--cc-accent-4)", "color-mix(in srgb, var(--cc-accent-4) 55%, #05060c)", "color-mix(in srgb, var(--cc-accent-1) 66%, #05060c)"]
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
  function iconHTML(id) {
    const parts = SPECS[id] || SPECS.foundations;
    const body = parts.map((part, i) => prism(part[0], part[1], part[2], part[3], part[4], part[5], i + id.length % 3)).join("");
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
    const max = Math.max(...rows.map((row) => row.value), 1);
    const widthOf = scaleOf(max, 520);
    const rowH = 42;
    const h = 16 + rows.length * rowH;
    const bars = rows.map((row, i) => {
      const y = 10 + i * rowH;
      const w = Math.max(4, widthOf(row.value));
      const suffix = unit ? ` ${unit}` : "";
      const tip = `${row.label}: ${row.value}${suffix}`;
      return `<text x="12" y="${y + 14}" class="d-sub">${esc(row.label)}</text>
      <text x="548" y="${y + 14}" text-anchor="end" class="d-sub">${esc(String(row.value))}${esc(suffix)}</text>
      <rect data-tip="${esc(tip)}" x="12" y="${y + 16}" width="536" height="22" fill="transparent"></rect>
      <rect class="bar" data-tip="${esc(tip)}" x="12" y="${y + 22}" width="${w.toFixed(1)}" height="12" rx="4" fill="var(--cc-accent-1)" opacity="0.9"></rect>`;
    }).join("");
    return `<svg class="chart-svg" viewBox="0 0 560 ${h}" role="img" aria-label="${esc(label)}">
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
    for (const row of ports.rows || []) map.set(row.transport, (map.get(row.transport) || 0) + 1);
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
    if (id === "totals") return `<svg id="chart-totals" class="chart-svg" viewBox="0 0 520 280" role="img" aria-label="Campus totals"></svg>`;
    return "";
  }
  function chartsHTML(catalog2, ports) {
    return `<div class="chart-grid">${CHARTS.map((chart) => `<figure class="chart-card" data-chart="${esc(chart.id)}">
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
    if (!root || document.documentElement.dataset.motion === "reduce") return;
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
    const max = Math.max(...rows.map((row) => row.value), 1);
    const widthOf = scaleOf(max, 240);
    const rc = rough.svg(svg2);
    rows.forEach((row, i) => {
      const y = 24 + i * 40;
      const w = Math.max(8, widthOf(row.value));
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
      label.textContent = `${row.label} ${row.value}`;
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
        { content: "INVITE" },
        { content: "REGISTER" },
        { content: "REFER" },
        { content: "PRACK" }
      ] },
      { content: "Media", children: [
        { content: "SDP" },
        { content: "RTP" },
        { content: "SRTP" }
      ] },
      { content: "Reachability", children: [
        { content: "NAT" },
        { content: "ICE" },
        { content: "TLS" }
      ] },
      { content: "Neighbors", children: [
        { content: "E911" },
        { content: "SIPREC" },
        { content: "WFM" },
        { content: "CRM" }
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
    host.innerHTML = `<div class="markmap-wrap"><svg id="sip-mind" role="img" aria-label="SIP session mind map"></svg></div>
    <p class="fine">Mind map drawn with markmap and d3 from the campus outline. It is a map of topics, not a network.</p>`;
    const svg2 = host.querySelector("#sip-mind");
    const lib = globalThis.markmap;
    if (!svg2 || !lib || typeof lib.Markmap !== "function") {
      host.insertAdjacentHTML("beforeend", `<p class="fine">The mind map library did not load. The diagram atlas still has the ecosystem drawing.</p>`);
      return () => {
      };
    }
    try {
      const mm = lib.Markmap.create(svg2, { duration: 300 }, mindNode(MIND));
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
    return document.documentElement.dataset.motion === "reduce";
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
    const sel = document.querySelector("#lang");
    if (sel && sel.value !== meta.id) sel.value = meta.id;
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
    const lang = document.querySelector("#lang");
    if (lang) {
      lang.value = getSettings().lang || "en";
      lang.addEventListener("change", () => {
        saveSettings({ lang: lang.value });
        applyLang(lang.value);
      });
    }
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
      if (theme === "light" || theme === "daylight") saveSettings({ theme: localStorage.getItem("sip-universe-dark") || "holographic" });
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
      view2.innerHTML = `<p class="lede">${ATLAS.length} diagrams, ${animated} of them animated call, signal, or data flows. Reduced motion keeps the drawing and drops the traveling packet.</p>
      <div class="atlas-grid">${ATLAS.map(figureHTML).join("")}</div>`;
      return () => {
      };
    }
    if (path === "#/flows") {
      ctx2.setTitle("Flows");
      const flows = ATLAS.filter((item) => item.animated);
      view2.innerHTML = `<p class="lede">${flows.length} animated flows: INVITE, REGISTER, transfer, hold, forking, early media, NAT, TLS, and SRTP among them.</p>
      ${paradeHTML()}
      <div class="atlas-grid">${flows.map(figureHTML).join("")}</div>`;
      return bindParade(view2);
    }
    if (path === "#/charts") {
      const ports = await loadJSON("data/ports.json");
      ctx2.setTitle("Charts");
      view2.innerHTML = `<p class="lede">${CHARTS.length} charts from the catalog, the ports table, and lesson tags. The topic map uses markmap.</p>
      ${paradeHTML()}
      ${chartsHTML(ctx2.catalog, ports)}
      <h2>Topic map</h2>
      <div id="mind-host"></div>`;
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
        ${data.rows.map((row) => `<tr><th scope="row">${esc(row.name)}</th><td>${esc(row.port)}</td><td>${esc(row.transport)}</td><td>${esc(row.purpose)} ${esc(row.note)}</td><td><a href="${esc(row.cite.url)}">${esc(row.cite.label)}</a></td></tr>`).join("")}
      </tbody></table></div>
      <h2>Firewall matrix</h2>
      <div class="scroll"><table><thead><tr><th scope="col">Flow</th><th scope="col">From</th><th scope="col">To</th><th scope="col">Transport</th><th scope="col">Ports</th><th scope="col">Source</th></tr></thead><tbody>
        ${data.matrix.map((row) => `<tr><th scope="row">${esc(row.flow)}</th><td>${esc(row.from)}</td><td>${esc(row.to)}</td><td>${esc(row.transport)}</td><td>${esc(row.ports)}</td><td>${esc(row.source)}</td></tr>`).join("")}
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
      const read = rows.filter(([, row]) => row.read).length;
      const quizzed = rows.filter(([, row]) => row.quizN).length;
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
    const session = [];
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
        session.push(line);
      }
    }
    return { session, media };
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
  function ruleMatchesMessage(token, start) {
    const t2 = String(token || "ANY").toUpperCase();
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
      const [, dir, token, header, action, rest] = m;
      const isResp = Boolean(responseCode(msg.start));
      if (dir.toLowerCase() === "request" && isResp) return;
      if (dir.toLowerCase() === "response" && !isResp) return;
      if (!ruleMatchesMessage(token, msg.start)) return;
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
  function makeLabel(THREE, text2) {
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
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
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
    let renderer = null;
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
    let scene = null;
    let camera = null;
    let THREE = null;
    const sph = { r: 13.5, theta: 0.5, phi: 1.05 };
    const reduced3 = prefersReduced();
    function placeCamera() {
      if (!camera) return;
      camera.position.set(
        sph.r * Math.sin(sph.phi) * Math.sin(sph.theta),
        sph.r * Math.cos(sph.phi),
        sph.r * Math.sin(sph.phi) * Math.cos(sph.theta)
      );
      camera.lookAt(0, 0.4, 0);
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
    if (reduced3) {
      host.querySelector("#topo-mode").textContent = "Reduced motion is on, so the flat map is the view. Turn motion back on in Settings to orbit the 3D model.";
      return () => {
      };
    }
    try {
      THREE = await loadThree();
      if (stop) return () => {
      };
      const canvas = host.querySelector("#topo-canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) throw new Error("no webgl");
      canvas.hidden = false;
      scene = new THREE.Scene();
      scene.fog = new THREE.Fog(461588, 16, 32);
      camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      scene.add(new THREE.AmbientLight(8956637, 0.55));
      const key = new THREE.PointLight(4054271, 18, 30);
      key.position.set(4, 6, 4);
      scene.add(key);
      const rim = new THREE.PointLight(16731533, 10, 24);
      rim.position.set(-4, 2, -3);
      scene.add(rim);
      NODES.forEach((n) => {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.28, 24, 18),
          new THREE.MeshStandardMaterial({ color: 1192004, emissive: 4054271, emissiveIntensity: 0.7, roughness: 0.35 })
        );
        mesh.position.set(n.x, n.y, n.z);
        const label = makeLabel(THREE, n.label);
        label.position.set(n.x, n.y + 0.55, n.z);
        scene.add(mesh);
        scene.add(label);
        meshes.set(n.id, mesh);
      });
      LINKS2.forEach(([a, b, kind]) => {
        const na = nodeById(a);
        const nb = nodeById(b);
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(na.x, na.y, na.z),
          new THREE.Vector3(nb.x, nb.y, nb.z)
        ]);
        const mat = new THREE.LineBasicMaterial({ color: 4054271 });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
        lines.push({ kind, line });
      });
      const stage = host.querySelector("#topo-stage");
      const resize = () => {
        const w = stage.clientWidth || 640;
        const h = 420;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
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
        if (!dragging) sph.theta += 15e-4;
        placeCamera();
        renderer.render(scene, camera);
      };
      loop();
      window.addEventListener("resize", resize);
      host.querySelector("#topo-mode").textContent = "Drag to orbit. Scroll to dolly. The flat map under the model stays available.";
      return () => {
        stop = true;
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        renderer.dispose();
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
  function reduced2() {
    return document.documentElement.dataset.motion === "reduce";
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
  async function mountHero(host) {
    const glass = host.innerHTML;
    host.innerHTML = `<div class="hero-bleed" data-hero="pending">
    <p class="sr-only">A three-dimensional call path. A user agent, an SBC, DNS, PSTN, TURN, and RTP orbit a glowing globe on a neon grid.</p>
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
    let THREE;
    try {
      THREE = await loadThree2();
    } catch {
      showFallback();
      return () => {
      };
    }
    if (!THREE || !host.isConnected) {
      showFallback();
      return () => {
      };
    }
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch {
      showFallback();
      return () => {
      };
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    bleed.dataset.hero = "webgl";
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
    camera.position.set(0.2, 2.15, 12.2);
    const palette = () => ({
      bg: cssHex("--cc-bg", "#0b1020"),
      a: cssHex("--cc-accent-1", "#39ff14"),
      b: cssHex("--cc-accent-2", "#ff2bd6"),
      c: cssHex("--cc-accent-3", "#00e5ff"),
      d: cssHex("--cc-accent-4", "#ffe600")
    });
    const colors = palette();
    scene.background = new THREE.Color(colors.bg);
    scene.fog = new THREE.Fog(colors.bg, 24, 72);
    renderer.setClearColor(colors.bg, 1);
    const globe = new THREE.Group();
    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.35, 1),
      new THREE.MeshBasicMaterial({ color: colors.a, wireframe: true })
    );
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(1.55, 28, 28),
      new THREE.MeshBasicMaterial({ color: colors.c, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    globe.add(wire, core);
    scene.add(globe);
    const rings = [4.1, 5.4, 6.6].map((radius, i) => {
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.028, 12, 96),
        new THREE.MeshBasicMaterial({ color: [colors.b, colors.c, colors.d][i] })
      );
      mesh.rotation.x = 1.15 + i * 0.28;
      mesh.rotation.y = i * 0.4;
      scene.add(mesh);
      return mesh;
    });
    const grid = new THREE.GridHelper(48, 24, colors.a, colors.b);
    grid.position.y = -3.2;
    if (grid.material) {
      const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
      mats.forEach((mat) => {
        mat.transparent = true;
        mat.opacity = 0.45;
      });
    }
    scene.add(grid);
    const count = 1100;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 8 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = Math.sin(theta) * radius;
    }
    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(pointsGeo, new THREE.PointsMaterial({
      color: colors.c,
      size: 0.07,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    scene.add(points);
    const orbit = new THREE.Group();
    const nodeMats = [];
    const shellMats = [];
    const labelMats = [];
    LABELS.forEach((name, i) => {
      const tone = [colors.a, colors.b, colors.c, colors.d, colors.a, colors.b][i];
      const group = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: tone, emissive: tone, emissiveIntensity: 0.65, roughness: 0.35, metalness: 0.15 });
      const shellMat = new THREE.MeshBasicMaterial({ color: tone, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false });
      nodeMats.push(bodyMat);
      shellMats.push(shellMat);
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 20), bodyMat);
      const shell = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 16), shellMat);
      const tex = new THREE.CanvasTexture(paintLabel(name, "#f7fbff"));
      const labelMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      labelMats.push(labelMat);
      const sprite = new THREE.Sprite(labelMat);
      sprite.position.y = 0.95;
      sprite.scale.set(2.4, 0.68, 1);
      group.add(body, shell, sprite);
      const angle = i / LABELS.length * Math.PI * 2;
      group.position.set(Math.cos(angle) * 7.2, Math.sin(angle * 2) * 0.6, Math.sin(angle) * 7.2);
      group.userData.angle = angle;
      orbit.add(group);
    });
    scene.add(orbit);
    const linePositions = [];
    LABELS.forEach((_, i) => {
      const a = i / LABELS.length * Math.PI * 2;
      const b = (i + 1) / LABELS.length * Math.PI * 2;
      linePositions.push(Math.cos(a) * 7.2, 0.2, Math.sin(a) * 7.2, Math.cos(b) * 7.2, 0.2, Math.sin(b) * 7.2);
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    const lineMat = new THREE.LineBasicMaterial({ color: colors.a, transparent: true, opacity: 0.7 });
    scene.add(new THREE.LineSegments(lineGeo, lineMat));
    const key = new THREE.PointLight(colors.b, 18, 48);
    key.position.set(6, 8, 8);
    const fill = new THREE.PointLight(colors.c, 14, 48);
    fill.position.set(-8, 3, 6);
    scene.add(new THREE.AmbientLight(16777215, 0.38), key, fill);
    const accents = [wire.material, core.material, ...rings.map((ring) => ring.material), points.material, lineMat, ...nodeMats, ...shellMats];
    const applyPalette = () => {
      const next = palette();
      scene.background.set(next.bg);
      scene.fog.color.set(next.bg);
      renderer.setClearColor(next.bg, 1);
      wire.material.color.set(next.a);
      core.material.color.set(next.c);
      rings[0].material.color.set(next.b);
      rings[1].material.color.set(next.c);
      rings[2].material.color.set(next.d);
      points.material.color.set(next.c);
      lineMat.color.set(next.a);
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
      void accents;
    };
    let raf = 0;
    let stop = false;
    let t2 = 0;
    const pointer = { x: 0, y: 0 };
    let scrollY = window.scrollY || 0;
    const onPtr = (event) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      pointer.x = (event.clientX / w - 0.5) * 2;
      pointer.y = (event.clientY / h - 0.5) * 2;
    };
    const onScroll = () => {
      scrollY = window.scrollY || 0;
    };
    window.addEventListener("pointermove", onPtr, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    const resize = () => {
      const w = bleed.clientWidth || window.innerWidth;
      const h = bleed.clientHeight || window.innerHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(bleed);
    resize();
    const unsettings = onSettings(applyPalette);
    const tick = () => {
      if (stop) return;
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      t2 += 5e-3;
      const drift = t2 * 0.35;
      globe.rotation.y = drift;
      globe.rotation.x = Math.sin(t2 * 0.4) * 0.12;
      rings.forEach((ring, i) => {
        ring.rotation.z = drift * (0.35 + i * 0.12);
      });
      orbit.rotation.y = drift * 0.55;
      points.rotation.y = drift * 0.08;
      const px = pointer.x * 1.8 + Math.sin(t2 * 0.15) * 0.9;
      const py = 2.05 + pointer.y * -0.7 - Math.min(scrollY, 700) * 25e-4;
      const pz = 12.2 + pointer.y * 0.5;
      camera.position.x += (px - camera.position.x) * 0.04;
      camera.position.y += (py - camera.position.y) * 0.04;
      camera.position.z += (pz - camera.position.z) * 0.04;
      camera.lookAt(0, 0.85, 0);
      renderer.render(scene, camera);
    };
    tick();
    return () => {
      stop = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPtr);
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      unsettings();
      scene.traverse((obj) => {
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
      renderer.dispose();
    };
  }

  // campus/js/app.js
  var view = document.querySelector("#view");
  var titleEl = document.querySelector("#view-title");
  var announcer = document.querySelector("#announcer");
  var rail = document.querySelector("#rail");
  var bottom = document.querySelector("#bottom");
  var pill = document.querySelector("#progress-pill");
  var PROG = "sip-universe-progress";
  var NAV = [
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
    { href: "#/faults", label: "Faults", group: "Field" }
  ];
  var catalog = null;
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
    const done = Object.values(data.lessons).filter((row) => row.read || row.quizN && row.quiz / row.quizN >= 0.8).length;
    const total = catalog ? catalog.stats.lessons : 0;
    pill.textContent = total ? `${done}/${total} read` : `${done} read`;
  }
  function markPrime(path) {
    document.querySelectorAll(".prime a").forEach((link) => {
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
      { href: "#/topology", label: "Map" }
    ];
    bottom.innerHTML = mobile.map((item) => {
      const current = path === item.href || item.href === "#/play" && path.startsWith("#/play") ? ' aria-current="page"' : "";
      return `<a href="${item.href}"${current}>${esc(item.label)}</a>`;
    }).join("") + `<button type="button" id="open-more">More</button>`;
    bottom.querySelector("#open-more").addEventListener("click", () => {
      const list = document.querySelector("#more-list");
      list.innerHTML = NAV.filter((item) => !["#/", "#/tracks", "#/topology"].includes(item.href) && item.href !== "#/tools/ladder").map((item) => `<a href="${item.href}">${esc(item.label)}</a>`).join("") + `<button type="button" id="more-settings">Settings</button>`;
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
        <p>Two short clips. Signal and Border walk the campus: how to view it, practise, and share it. Spoken with eSpeak NG 1.51. A low pad sits under the voices.</p>
        <audio id="architect-use" controls preload="none" src="audio/architect-use.mp3"></audio>
        <audio id="architect-share" controls preload="none" src="audio/architect-share.mp3"></audio>
        <p class="fine">Scripts: <a href="audio/scripts/architect-use.md">how to view</a> \xB7 <a href="audio/scripts/architect-share.md">how to practise and share</a>.</p>
        <p><a href="https://github.com/cipher0x9/sip-universe-lab-free-university-mesmerizing">Rate, comment, or help on the repository</a> \xB7 <a href="https://cyphermonkeylabs.com/#contact" rel="noopener noreferrer">Contact</a></p>
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
      const row = data.lessons[lessonKey(track.id, lesson.id)];
      return row && (row.read || row.quizN && row.quiz / row.quizN >= 0.8);
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
    view.innerHTML = `<p class="lede">Sixteen tracks, from the first Via header to cloud PSTN interconnects. Open one. Lessons load on their own.</p>
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
    cleanup();
    cleanup = () => {
    };
    stopNarration();
    const { path, params } = parseHash();
    document.body.classList.toggle("is-home", path === "#/" || path === "");
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
    cleanup = typeof stop === "function" ? stop : () => {
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
      motion: form.querySelector('[name="motion"]').checked ? "reduce" : "full"
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
            catalog.tracks.forEach((track) => {
              fetch(track.file).catch(() => {
              });
            });
            ["data/glossary.json", "data/boss.json", "data/interview.json", "data/ecosystem.json", "data/certs.json", "data/labs.json", "data/samples.json", "data/ports.json", "data/fieldguide.json", "data/daily.json", "downloads/manifest.json"].forEach((path) => {
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
