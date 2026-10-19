/* Rewrite the SHELL list in sw.js from a required set plus same-origin assets, under 3.5 MB. */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const budget = 3_500_000;
const swPath = path.join(root, "sw.js");

const required = [
  "index.html",
  "offline.html",
  "manifest.webmanifest",
  "favicon.svg",
  "favicon.ico",
  "start.html",
  "play.html",
  "simulator.html",
  "rooms/T02-dialogs.html",
  "assets/js/university.js",
  "assets/js/pwa.js",
  "assets/js/sip-sim.js",
  "assets/js/onboard.js",
  "assets/js/canon.js",
  "assets/js/theme-boot.js",
  "assets/js/home-hero-loader.js",
  "assets/js/hero-scene.js",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-maskable-192.png",
  "assets/icons/icon-maskable-512.png",
  "guide/guide.js",
  "guide/guide.css",
  "guide/dragbot.js",
  "guide/engine.mjs",
  "shared/pybot-chat/engine.js",
  "shared/pybot-chat/ui.js",
  "shared/pybot-chat/chat.css",
  "js/content/sipbot-index.json",
  "vendor/three.module.min.js",
];

const extra = [];
for (const name of fs.readdirSync(path.join(root, "assets/css"))) {
  if (name.endsWith(".css")) extra.push(`assets/css/${name}`);
}
for (const name of ["frame.js", "phone-nav.js", "wow.js", "brand.js", "polish.js"]) {
  extra.push(`assets/js/${name}`);
}

const chosen = [];
let total = 0;
function consider(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs) || chosen.includes(rel)) return;
  const size = fs.statSync(abs).size;
  if (total + size > budget) {
    console.log("skip over budget", rel, size);
    return;
  }
  chosen.push(rel);
  total += size;
}
for (const rel of required) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error("missing required", rel);
    process.exit(1);
  }
  consider(rel);
}
for (const rel of extra) consider(rel);

const body = ["  \"./\",", ...chosen.map((rel) => `  "./${rel}",`)].join("\n");
let sw = fs.readFileSync(swPath, "utf8");
const next = sw.replace(/\/\* precache:start \*\/[\s\S]*\/\* precache:end \*\//, `/* precache:start */\n${body}\n  /* precache:end */`);
if (next === sw) {
  console.error("precache markers missing");
  process.exit(1);
}
fs.writeFileSync(swPath, next);
console.log(`precache ${chosen.length + 1} urls, ${total} bytes, budget ${budget}`);
if (total > budget) process.exit(1);
