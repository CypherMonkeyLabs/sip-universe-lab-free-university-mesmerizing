/**
 * Headless screenshots through Chrome's debugging port.
 * Chrome stays open after a screenshot, so this script kills it once the PNG is saved.
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const base = process.env.SHOT_BASE || "http://127.0.0.1:8742";
const port = 9333;
const outDir = "docs/screenshots";
mkdirSync(outDir, { recursive: true });

const chrome = spawn("google-chrome", [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  "--no-first-run",
  `--user-data-dir=/tmp/cdp-sip-${process.pid}`,
  `--remote-debugging-port=${port}`,
  "about:blank"
], { stdio: "ignore" });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function version() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return response.json();
    } catch { /* chrome still starting */ }
    await sleep(200);
  }
  throw new Error("chrome debug port did not open");
}

const info = await version();
const browser = new WebSocket(info.webSocketDebuggerUrl);
let seq = 0;
const pending = new Map();
const events = [];
browser.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  } else if (message.method) events.push(message);
});
await new Promise((resolve) => browser.addEventListener("open", resolve));

function send(method, params = {}, sessionId) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout ${method}`)), 20000);
    pending.set(id, (message) => {
      clearTimeout(timer);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result || {});
    });
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    browser.send(JSON.stringify(payload));
  });
}

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, sessionId);
  return result.result?.value;
}

const shots = process.env.GEOM ? [
  { name: "pass3-desktop-home", width: 1440, height: 900, path: "/" },
  { name: "pass3-phone-home", width: 390, height: 844, path: "/", mobile: true },
  { name: "pass3-phone-room", width: 390, height: 844, path: "/rooms/T02-roles.html", mobile: true },
  { name: "pass3-phone-downloads", width: 390, height: 844, path: "/downloads.html", mobile: true },
  { name: "pass3-ipad-home", width: 820, height: 1180, path: "/" },
  { name: "pass3-desktop-room", width: 1440, height: 900, path: "/rooms/T02-roles.html" },
  { name: "pass3-desktop-downloads", width: 1440, height: 900, path: "/downloads.html" },
  { name: "pass3-desktop-menu", width: 1440, height: 900, path: "/", menu: true },
  { name: "pass3-phone-menu", width: 390, height: 844, path: "/", mobile: true, menu: true },
  { name: "pass3-phone-bot", width: 390, height: 844, path: "/", mobile: true, bot: true }
] : [
  { name: "pass2-desktop-home", width: 1440, height: 900, path: "/" },
  { name: "pass2-desktop-room", width: 1440, height: 900, path: "/rooms/T02-roles.html" },
  { name: "pass2-desktop-downloads", width: 1440, height: 900, path: "/downloads.html" },
  { name: "pass2-desktop-menu", width: 1440, height: 900, path: "/", menu: true },
  { name: "pass2-ipad-home", width: 820, height: 1180, path: "/" },
  { name: "pass2-phone-home", width: 390, height: 844, path: "/", mobile: true },
  { name: "pass2-phone-room", width: 390, height: 844, path: "/rooms/T02-roles.html", mobile: true },
  { name: "pass2-phone-downloads", width: 390, height: 844, path: "/downloads.html", mobile: true },
  { name: "pass2-phone-menu", width: 390, height: 844, path: "/", mobile: true, menu: true },
  { name: "pass2-phone-bot", width: 390, height: 844, path: "/", mobile: true, bot: true }
];

for (const shot of shots) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: shot.width,
    height: shot.height,
    deviceScaleFactor: 1,
    mobile: Boolean(shot.mobile)
  }, sessionId);
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "try{localStorage.setItem('canon-tour-done','1');localStorage.setItem('cg-greet-done','1');localStorage.setItem('cg-poke-off','1');localStorage.setItem('canon-theme','bloom');}catch(e){}"
  }, sessionId);
  await send("Page.navigate", { url: base + shot.path }, sessionId);
  await sleep(1800);
  if (shot.menu) {
    await evaluate("var b=document.querySelector('.header-menu')||document.querySelector('[data-open-menu]'); if(b) b.click(); 'ok'");
    await sleep(500);
  }
  if (shot.bot) {
    await evaluate("var b=document.querySelector('.cg-monkey'); if(b) b.click(); 'ok'");
    await sleep(700);
  }
  if (shot.path.includes("roles") && !shot.menu) {
    const quiz = await evaluate(`(function(){
      var form=document.querySelector('[data-quiz]');
      if(!form) return 'no-quiz';
      var box=form.querySelector('fieldset');
      var answer=box.getAttribute('data-answer');
      var radio=box.querySelectorAll('input')[Number(answer)];
      if(radio) radio.checked=true;
      form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
      return (form.querySelector('.quiz-score')||{}).textContent||'no-score';
    })()`);
    console.log("quiz", shot.name, quiz);
  }
  const clip = await send("Page.captureScreenshot", { format: "png" }, sessionId);
  const file = `${outDir}/${shot.name}.png`;
  writeFileSync(file, Buffer.from(clip.data, "base64"));
  const title = await evaluate(`JSON.stringify({
    h1:(document.querySelector('h1')||{}).innerText,
    box:(function(){var n=document.querySelector('h1'); if(!n) return null; var r=n.getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),clip:r.right>innerWidth+1||r.left<0};})(),
    overflow:document.documentElement.scrollWidth>innerWidth+2,
    offenders:(function(){var bad=[]; document.querySelectorAll('body *').forEach(function(n){var r=n.getBoundingClientRect(); if(r.width>8 && r.right>innerWidth+2) bad.push((n.className&&String(n.className).slice(0,40))||n.tagName);}); return bad.slice(0,8);})(),
    disc:(function(){var n=document.querySelector('.disclaimer-panel'); if(!n) return null; var r=n.getBoundingClientRect(); return {y:Math.round(r.y),h:Math.round(r.height)};})(),
    monkeys:document.querySelectorAll('.cg-monkey,.monkey').length
  })`);
  console.log(shot.name, title);
}

browser.close();
chrome.kill("SIGKILL");
process.exit(0);
