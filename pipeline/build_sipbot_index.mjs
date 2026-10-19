/* Build the offline SIP chat index and the lesson map from this lab's pages.
   Usage: node pipeline/build_sipbot_index.mjs
   Writes js/content/sipbot-index.json, data/lesson-map.json, data/sources.json.
   Excerpts are copied from the pages. This script does not invent sentences. */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tokens } from "../shared/pybot-chat/engine.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LEVEL = {
  T01: 0, T02: 1, T03: 2, T04: 3, T05: 4, T06: 5, T07: 6, T08: 6,
  T09: 7, T10: 8, T11: 8, T12: 9, T13: 7, T14: 8, T15: 9, T16: 10,
  T17: 5, T18: 6, T19: 9, T20: 10,
};
const VOLATILE = new Set(["T10", "T11", "T12", "T15", "T19"]);

const SYN = {
  voip: "sip",
  dialogue: "dialog",
  dialouge: "dialog",
  dialogs: "dialog",
  invites: "invite",
  codecs: "codec",
  borders: "sbc",
  firewall: "nat",
  traversal: "ice",
  reflexive: "stun",
  relay: "turn",
  websockets: "websocket",
  shaken: "shaken",
  passports: "passport",
  cube: "cube",
  cubes: "cube",
};

function decode(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function strip(html) {
  return decode(String(html || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function pick(html, pattern) {
  const match = html.match(pattern);
  return match ? strip(match[1]) : "";
}

function section(html, id) {
  const match = html.match(new RegExp(`<section[^>]*id="${id}"[^>]*>([\\s\\S]*?)</section>`, "i"));
  return match ? match[1] : "";
}

function lis(html) {
  return [...html.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((match) => strip(match[1])).filter(Boolean);
}

function sourceId(url) {
  const rfc = url.match(/rfc(\d+)/i);
  if (rfc) return `rfc${rfc[1]}`;
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  } catch {
    return "";
  }
}

function parseRoom(file, html) {
  const id = pick(html, /data-room="([^"]+)"/) || file.replace(/\.html$/, "");
  const track = pick(html, /data-track="([^"]+)"/) || id.slice(0, 3);
  const title = pick(html, /<h1>([\s\S]*?)<\/h1>/i) || pick(html, /<title>([\s\S]*?)<\/title>/i);
  const lede = pick(html, /<p class="lede">([\s\S]*?)<\/p>/i);
  const takeaways = lis(section(html, "learn") || html.match(/<aside class="takeaways">([\s\S]*?)<\/aside>/i)?.[1] || "");
  const exampleBlock = section(html, "example");
  const example = pick(exampleBlock, /<p>([\s\S]*?)<\/p>/i);
  const fault = pick(section(html, "fault"), /<p>([\s\S]*?)<\/p>/i);
  const deeper = section(html, "go-deeper");
  const sources = [];
  for (const match of deeper.matchAll(/<a href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = match[1];
    const sid = sourceId(url);
    if (!sid) continue;
    sources.push({ id: sid, title: strip(match[2]), url });
  }
  const checked = (html.match(/last checked (\d{4}-\d{2})/i) || [])[1] || "";
  return { id, track, title, lede, takeaways, example, fault, sources, checked, file };
}

function pageDoc(file, kind) {
  const html = readFileSync(join(root, file), "utf8");
  const title = pick(html, /<h1>([\s\S]*?)<\/h1>/i) || pick(html, /<title>([\s\S]*?)<\/title>/i);
  const lede = pick(html, /<p class="lede">([\s\S]*?)<\/p>/i) || pick(html, /<main[\s\S]*?<p>([\s\S]*?)<\/p>/i);
  const body = [title, lede].filter(Boolean).join(". ");
  return {
    i: `page:${file.replace(/\.html$/, "")}`,
    k: kind,
    ti: title,
    h: file,
    s: "site",
    ex: body,
    eg: "",
    w: tokens(`${title} ${lede}`),
    tw: tokens(title),
    checked: (html.match(/last checked (\d{4}-\d{2})/i) || [])[1] || "",
    volatile: false,
  };
}

const roomDir = join(root, "rooms");
const rooms = readdirSync(roomDir).filter((name) => name.endsWith(".html")).sort().map((name) => {
  return parseRoom(name, readFileSync(join(roomDir, name), "utf8"));
});

const sourceMap = new Map();
const lessons = [];
const docs = [];
const seeds = [];

for (const room of rooms) {
  for (const source of room.sources) {
    if (!sourceMap.has(source.id)) sourceMap.set(source.id, { id: source.id, title: source.title, url: source.url });
  }
  const outcomes = (room.takeaways.length ? room.takeaways : [room.lede]).filter((item) => item && item.length >= 8);
  lessons.push({
    key: room.id,
    title: room.title,
    level: LEVEL[room.track] ?? 0,
    outcomes,
    sources: [...new Set(room.sources.map((source) => source.id))],
    last_verified: null,
  });
  const quote = [room.title, room.lede].filter(Boolean).join(". ");
  const searchText = [room.title, room.lede, room.takeaways.join(" "), room.example, room.fault].filter(Boolean).join(" ");
  const href = `rooms/${room.file}`;
  docs.push({
    i: `lesson:${room.id}`,
    k: "lesson",
    ti: room.title,
    h: href,
    s: room.track,
    ex: quote,
    eg: room.example || "",
    w: tokens(searchText),
    tw: tokens(room.title),
    checked: room.checked,
    volatile: VOLATILE.has(room.track),
  });
  const titleTokens = tokens(room.title).filter((term) => term.length >= 5 && !["about", "their", "there", "which", "where", "using"].includes(term));
  if (titleTokens.length >= 2) {
    const allow = tokens(`${room.title} ${room.lede}`).slice(0, 14);
    seeds.push({
      i: `lesson:${room.id}`,
      h: href,
      ti: room.title,
      k: "lesson",
      ex: quote,
      eg: room.example || "",
      topic: titleTokens[0],
      all: titleTokens.slice(0, 3),
      any: [],
      allow,
      block: [],
      how: false,
      rank: 2,
      checked: room.checked,
      volatile: VOLATILE.has(room.track),
    });
  }
}

const softphone = docs.find((doc) => doc.i === "lesson:T17-browser-softphone");
if (softphone) {
  seeds.push({
    i: softphone.i,
    h: softphone.h,
    ti: softphone.ti,
    k: "lesson",
    ex: softphone.ex,
    eg: softphone.eg,
    topic: "softphone",
    all: ["softphone"],
    any: [],
    allow: ["softphone", "browser", "call", "flow"],
    block: [],
    how: false,
    loose: true,
    rank: 20,
    checked: softphone.checked,
    volatile: false,
  });
}

for (const [file, kind] of [
  ["start.html", "page"],
  ["downloads.html", "download"],
  ["help.html", "guide"],
  ["play.html", "game"],
  ["simulator.html", "game"],
  ["glossary.html", "glossary"],
  ["index.html", "page"],
  ["flows.html", "page"],
  ["ports.html", "page"],
]) {
  try {
    docs.push(pageDoc(file, kind));
  } catch {
    /* optional page */
  }
}

const index = { v: 2, syn: SYN, seeds, docs };
mkdirSync(join(root, "js/content"), { recursive: true });
mkdirSync(join(root, "data"), { recursive: true });
writeFileSync(join(root, "js/content/sipbot-index.json"), `${JSON.stringify(index)}\n`);
writeFileSync(join(root, "data/lesson-map.json"), `${JSON.stringify({ lessons }, null, 2)}\n`);
writeFileSync(join(root, "data/sources.json"), `${JSON.stringify({ sources: [...sourceMap.values()] }, null, 2)}\n`);
console.log(`rooms ${rooms.length} docs ${docs.length} seeds ${seeds.length} sources ${sourceMap.size}`);
