const KEY = "sip-universe-settings";

export const DEFAULTS = {
  theme: "observatory",
  sfx: false,
  narration: false,
  voiceURI: "",
  rate: 1,
  motion: "",
  font: "md",
};

let settings = { ...DEFAULTS };
let ctx = null;
const listeners = new Set();

export function loadSettings() {
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

export function getSettings() {
  return settings;
}

export function saveSettings(next) {
  settings = { ...settings, ...next };
  localStorage.setItem(KEY, JSON.stringify(settings));
  applySettings();
  listeners.forEach((fn) => fn(settings));
}

export function onSettings(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function applySettings() {
  const root = document.documentElement;
  root.dataset.theme = settings.theme || "observatory";
  root.dataset.font = settings.font || "md";
  root.dataset.motion = settings.motion || "full";
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) {
    const colors = { observatory: "#070b14", daylight: "#f4f7fb", contrast: "#000000", phosphor: "#04140c" };
    theme.setAttribute("content", colors[settings.theme] || "#070b14");
  }
}

export function prefersReduced() {
  return settings.motion === "reduce";
}

function audioCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function playTone(kind) {
  if (!settings.sfx) return;
  try {
    const ac = audioCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const map = { step: 660, ok: 880, bad: 196, click: 520 };
    osc.frequency.value = map[kind] || 520;
    osc.type = kind === "bad" ? "square" : "sine";
    gain.gain.setValueAtTime(0.0001, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.04, ac.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.12);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + 0.13);
  } catch {
    /* sound is optional */
  }
}

function roboticEdge(name) {
  return /microsoft\s+(david|zira|mark|hazel|george|susan)\b/i.test(name) && !/natural|neural/i.test(name);
}

export function rankVoice(voice) {
  const name = voice.name.toLowerCase();
  let score = 0;
  if (/natural|neural|premium|enhanced/.test(name)) score += 50;
  if (/google|samantha|daniel|moira|karen|serena|allison|ava|siri/.test(name)) score += 20;
  if ((voice.lang || "").toLowerCase().startsWith("en")) score += 10;
  if (roboticEdge(voice.name)) score -= 100;
  if (/espeak|compact/.test(name)) score -= 20;
  return score;
}

export function loadVoices() {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) { resolve([]); return; }
    const current = synth.getVoices();
    if (current.length) { resolve(current); return; }
    const finish = () => resolve(synth.getVoices());
    const timer = setTimeout(finish, 1200);
    synth.addEventListener("voiceschanged", () => { clearTimeout(timer); finish(); }, { once: true });
  });
}

export function bestVoice(voices) {
  const ranked = [...voices].filter((v) => (v.lang || "").toLowerCase().startsWith("en"));
  const pool = ranked.length ? ranked : [...voices];
  pool.sort((a, b) => rankVoice(b) - rankVoice(a));
  const top = pool[0];
  if (!top || rankVoice(top) < 0) return null;
  return top;
}

export function stopNarration() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

export async function narrate(text) {
  if (!settings.narration || !text || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  const voices = await loadVoices();
  stopNarration();
  const utter = new SpeechSynthesisUtterance(String(text).slice(0, 700));
  utter.rate = Number(settings.rate) || 1;
  const chosen = voices.find((v) => v.voiceURI === settings.voiceURI);
  const voice = chosen && !roboticEdge(chosen.name) ? chosen : bestVoice(voices);
  if (settings.voiceURI && chosen) utter.voice = chosen;
  else if (voice) utter.voice = voice;
  else return;
  synth.speak(utter);
}

export async function fillVoiceSelect(select) {
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
    const note = roboticEdge(voice.name) ? " — robotic, not the default" : "";
    opt.textContent = `${voice.name} (${voice.lang})${note}`;
    select.appendChild(opt);
  }
  select.value = current && [...select.options].some((o) => o.value === current) ? current : "";
  if (!current) {
    const best = bestVoice(voices);
    if (best) settings.voiceURI = "";
  }
}
