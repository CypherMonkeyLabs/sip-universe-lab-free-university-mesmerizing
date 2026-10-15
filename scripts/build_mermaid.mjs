import { writeFileSync, mkdirSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "campus", "diagrams");
mkdirSync(outDir, { recursive: true });
const mermaid = process.env.MERMAID || "/tmp/sip-vendor/mm/package/dist/mermaid.min.js";
const diagrams = [
  {
    id: "register",
    src: `sequenceDiagram
    participant UA
    participant Registrar
    UA->>Registrar: REGISTER
    Registrar-->>UA: 401
    UA->>Registrar: REGISTER
    Registrar-->>UA: 200`,
  },
  {
    id: "border",
    src: `flowchart LR
    Phone --> SBC
    SBC --> CUCM
    SBC --> Carrier`,
  },
];
const htmlPath = "/tmp/sip-mermaid.html";
writeFileSync(htmlPath, `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script src="${mermaid}"></script>
<pre id="src"></pre>
<script>
const diagrams = ${JSON.stringify(diagrams)};
document.getElementById("src").textContent = JSON.stringify(diagrams);
mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });
(async () => {
  const holder = document.createElement("div");
  holder.id = "out";
  for (const item of diagrams) {
    const rendered = await mermaid.render("m-" + item.id, item.src);
    const wrap = document.createElement("div");
    wrap.id = "svg-" + item.id;
    wrap.innerHTML = rendered.svg;
    holder.appendChild(wrap);
  }
  document.body.appendChild(holder);
  document.title = "ready";
})().catch((err) => { document.title = "fail " + err.message; });
</script></body></html>`);

const chrome = process.env.CHROME || "/opt/google/chrome/chrome";
const port = 9334;
const userDir = `/tmp/sip-mermaid-chrome-${process.pid}`;
const child = spawn(chrome, [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage",
  `--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`,
  `file://${htmlPath}`,
], { stdio: "ignore" });

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function ready() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const pages = await res.json();
      const page = pages.find((item) => item.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* chrome still starting */ }
    await sleep(250);
  }
  throw new Error("chrome did not open a page");
}

const wsUrl = await ready();
const ws = new WebSocket(wsUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve);
  ws.addEventListener("error", reject);
});
let id = 0;
function send(method, params) {
  const messageId = ++id;
  return new Promise((resolve) => {
    const onMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === messageId) {
        ws.removeEventListener("message", onMessage);
        resolve(data.result);
      }
    };
    ws.addEventListener("message", onMessage);
    ws.send(JSON.stringify({ id: messageId, method, params }));
  });
}
await send("Runtime.enable");
let title = "";
for (let i = 0; i < 40; i += 1) {
  const result = await send("Runtime.evaluate", { expression: "document.title", returnByValue: true });
  title = result.result.value;
  if (title.startsWith("ready") || title.startsWith("fail")) break;
  await sleep(200);
}
if (!title.startsWith("ready")) {
  child.kill();
  throw new Error(title || "mermaid did not finish");
}
for (const item of diagrams) {
  const result = await send("Runtime.evaluate", {
    expression: `document.querySelector("#svg-${item.id}").innerHTML`,
    returnByValue: true,
  });
  const svg = result.result.value;
  if (!svg || !svg.includes("<svg")) throw new Error(`empty ${item.id}`);
  writeFileSync(join(outDir, `${item.id}.svg`), svg);
}
ws.close();
child.kill();
spawnSync("sleep", ["0.2"]);
console.log(JSON.stringify({ wrote: diagrams.map((item) => item.id) }));
