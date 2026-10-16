import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dissect, negotiate, applyCube, applyAcme, extractMessages } from "../campus/js/parse.js";
import { brandLinkProblems } from "./check-brand-links.mjs";
import { ATLAS } from "../campus/js/diagrams.js";
import { CHARTS } from "../campus/js/charts.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = join(root, "campus", "data");

function load(name) {
  return JSON.parse(readFileSync(join(data, name), "utf8"));
}

const catalog = load("catalog.json");
const tracks = readdirSync(join(data, "tracks")).filter((name) => name.endsWith(".json")).sort();
let lessons = 0;
let quizzes = 0;
let cards = 0;
let labs = 0;
let faults = 0;
let cites = 0;
let flows = 0;
let illustrations = 0;
const problems = [];

function walk(node) {
  if (!node || typeof node !== "object") return;
  if (typeof node.url === "string" && typeof node.label === "string") cites += 1;
  for (const value of Object.values(node)) walk(value);
}

for (const file of tracks) {
  const track = JSON.parse(readFileSync(join(data, "tracks", file), "utf8"));
  const listed = catalog.tracks.find((item) => item.id === track.id);
  if (!listed || listed.file !== `data/tracks/${file}`) problems.push(`catalog file mismatch ${file}`);
  if (listed.lessons.length !== track.lessons.length) problems.push(`lesson index ${track.id}`);
  for (const lesson of track.lessons) {
    lessons += 1;
    quizzes += lesson.quiz.length;
    cards += lesson.cards.length;
    labs += lesson.lab ? 1 : 0;
    faults += lesson.fault ? 1 : 0;
    flows += lesson.flow && lesson.flow.steps ? 1 : 0;
    illustrations += lesson.illustration ? 1 : 0;
    if (!lesson.flow || lesson.flow.steps.length < 2) problems.push(`flow ${track.id}/${lesson.id}`);
    if (lesson.quiz.length < 4) problems.push(`quiz ${track.id}/${lesson.id}`);
    walk(lesson);
  }
}

const glossary = load("glossary.json");
const boss = load("boss.json");
const interview = load("interview.json");
const ecosystem = load("ecosystem.json");
const certs = load("certs.json");
const labsPage = load("labs.json");
const samples = load("samples.json");
walk(glossary);
walk(boss);
walk(interview);
walk(ecosystem);
walk(certs);

const stats = catalog.stats;
const expect = [
  ["tracks", stats.tracks, tracks.length],
  ["lessons", stats.lessons, lessons],
  ["quizzes", stats.quizzes, quizzes],
  ["cards", stats.cards, cards],
  ["labs", stats.labs, labs],
  ["faults", stats.faults, faults],
  ["boss", stats.boss, boss.incidents.length],
  ["interview", stats.interview, interview.items.length],
  ["glossary", stats.glossary, glossary.terms.length],
];
for (const [name, claimed, actual] of expect) {
  if (claimed !== actual) problems.push(`${name} claimed ${claimed} actual ${actual}`);
}
if (tracks.length < 15) problems.push("tracks < 15");
if (lessons < 100) problems.push("lessons < 100");
if (quizzes < 600) problems.push("quizzes < 600");
if (labs < 20) problems.push("labs < 20");
if (faults < 30) problems.push("faults < 30");
if (boss.incidents.length < 6) problems.push("boss");
if (interview.items.length < 30) problems.push("interview");
if (glossary.terms.length < 40) problems.push("glossary");
if (labsPage.labs.length < 24) problems.push("featured labs");
if (!samples.messages.invite || !samples.sdp.offer || !samples.sandbox.rules || !samples.capture || !samples.flows.length) {
  problems.push("samples incomplete");
}
if (!catalog.preview || !catalog.preview.steps) problems.push("preview");

const ports = load("ports.json");
const guide = load("fieldguide.json");
const daily = load("daily.json");
if (ports.rows.length < 12) problems.push("ports rows");
if (!ports.matrix.length || !ports.quiz.length) problems.push("ports matrix");
const requiredGuide = ["fundamentals", "architecture", "deployment", "migration", "configuration", "troubleshooting", "ports", "trunking", "wfm", "recording", "e911", "analytics", "crm", "ai-agents", "security", "licensing", "roadmap", "integrations", "career"];
for (const id of requiredGuide) {
  if (!guide.sections.some((section) => section.id === id)) problems.push(`guide ${id}`);
}
if (daily.items.length < 8) problems.push("daily");
const manifest = JSON.parse(readFileSync(join(root, "campus", "downloads", "manifest.json"), "utf8"));
if (manifest.items.length < 8) problems.push("downloads");
for (const item of manifest.items) {
  for (const key of ["html", "pdf", "png", "json"]) {
    if (item[key] && !statSync(join(root, "campus", item[key]), { throwIfNoEntry: false })) problems.push(`missing ${item[key]}`);
  }
}
const indexHtml = readFileSync(join(root, "campus", "index.html"), "utf8").toLowerCase();
if (indexHtml.includes("linkedin") || indexHtml.includes("mailto:")) problems.push("chrome contact policy");
for (const hit of brandLinkProblems(root)) problems.push(hit);
const campusSheets = readdirSync(join(root, "campus", "downloads")).filter((name) => name.endsWith(".html"));
for (const name of campusSheets) {
  const text = readFileSync(join(root, "campus", "downloads", name), "utf8");
  if (!text.includes("Sources and go deeper")) problems.push(`campus download sources ${name}`);
}
const menuWords = ["diagrams", "flows", "charts", "cheat codes", "play", "ecosystem", "downloads", "careers"];
for (const word of menuWords) {
  if (!indexHtml.includes(word)) problems.push(`menu ${word}`);
}
if (indexHtml.includes("type=\"module\"")) problems.push("module entry");
if (!indexHtml.includes("campus.iife.js") || !indexHtml.includes("embedded-data.js")) problems.push("disk boot");
const animated = ATLAS.filter((item) => item.animated).length;
if (ATLAS.length < 25) problems.push(`atlas ${ATLAS.length}`);
if (animated < 12) problems.push(`animated ${animated}`);
if (CHARTS.length < 6) problems.push(`charts ${CHARTS.length}`);
const fullSheets = manifest.items.filter((item) => item.html && item.pdf && item.png);
if (fullSheets.length < 10) problems.push(`sheets ${fullSheets.length}`);
for (const file of ["vendor/d3.min.js", "vendor/anime.umd.min.js", "vendor/rough.js", "vendor/confetti.browser.js", "vendor/markmap-view.js", "js/campus.iife.js", "js/embedded-data.js"]) {
  if (!statSync(join(root, "campus", file), { throwIfNoEntry: false })) problems.push(`missing ${file}`);
}
const embedPath = join(root, "campus", "js", "embedded-data.js");
if (statSync(embedPath, { throwIfNoEntry: false })) {
  const raw = readFileSync(embedPath, "utf8").replace(/^\/\*[\s\S]*?\*\/\n/, "").replace(/^window\.SIP_DATA=/, "").replace(/;\s*$/, "");
  const embedded = JSON.parse(raw);
  if (!embedded["data/catalog.json"] || embedded["data/catalog.json"].stats.lessons !== catalog.stats.lessons) problems.push("embed stale");
  if (!embedded["downloads/manifest.json"]) problems.push("embed manifest");
}
const iifePath = join(root, "campus", "js", "campus.iife.js");
if (statSync(iifePath, { throwIfNoEntry: false })) {
  const iife = readFileSync(iifePath, "utf8");
  if (!iife.includes("data-count")) problems.push("bundle stale");
  if (!iife.includes("hero-canvas")) problems.push("hero missing");
  if (iife.includes("import.meta")) problems.push("import.meta in bundle");
}
for (const word of ["holographic", "cyberpunk", "sunset", "visual.css", "id=\"lang\"", "lightbox"]) {
  if (!indexHtml.includes(word)) problems.push(`visual ${word}`);
}
for (const rel of ["audio/architect-use.mp3", "audio/architect-share.mp3", "css/visual.css"]) {
  if (!statSync(join(root, "campus", rel), { throwIfNoEntry: false })) problems.push(`missing ${rel}`);
}
for (const page of [
  "https://cyphermonkeylabs.com/uc-lab-free-university-mesmerizing/",
  "https://cyphermonkeylabs.com/ai-lab-free-university-mesmerizing/",
  "https://cyphermonkeylabs.com/webex-lab-free-university-mesmerizing/",
  "https://cyphermonkeylabs.com/sip-universe-lab-free-university-mesmerizing/",
]) {
  if (!indexHtml.includes(page)) problems.push(`sibling ${page}`);
}

const shell = ["index.html", "css/app.css", "js/app.js", "js/draw.js", "js/audio.js", "js/flow.js", "data/catalog.json"]
  .map((rel) => statSync(join(root, "campus", rel)).size);
const shellBytes = shell.reduce((sum, n) => sum + n, 0);
if (shellBytes > 520 * 1024) problems.push(`shell ${shellBytes} over budget`);

const good = `INVITE sip:+15551212@203.0.113.20 SIP/2.0
Via: SIP/2.0/UDP 203.0.113.10;branch=z9hG4bK7766as01
Max-Forwards: 70
From: "Alice" <sip:alice@example.com>;tag=9fxced76sl
To: <sip:+15551212@example.com>
Call-ID: a84b4c76e66710@example.com
CSeq: 1 INVITE
Contact: <sip:alice@203.0.113.10>
Diversion: <sip:+15550000@example.com>
Server: Acme
Content-Length: 0
`;
const dissected = dissect(good);
if (dissected.warnings.some((w) => /magic cookie|Max-Forwards/.test(w.text))) problems.push("dissect false warning");
if (!dissected.headers.some((h) => h.name === "Max-Forwards")) problems.push("max-forwards");
const badBranch = dissect(good.replace("z9hG4bK", "deadbeef"));
if (!badBranch.warnings.some((w) => /magic cookie/.test(w.text))) problems.push("cookie warning missing");

const offer = "v=0\no=- 1 1 IN IP4 203.0.113.10\ns=-\nc=IN IP4 203.0.113.10\nt=0 0\nm=audio 49170 RTP/AVP 0 8 101\na=rtpmap:0 PCMU/8000\na=rtpmap:8 PCMA/8000\na=rtpmap:101 telephone-event/8000\na=sendrecv\n";
const answer = "v=0\no=- 2 1 IN IP4 203.0.113.20\ns=-\nc=IN IP4 203.0.113.20\nt=0 0\nm=audio 0 RTP/AVP 0\na=rtpmap:0 PCMU/8000\na=recvonly\n";
const negotiated = negotiate(offer, answer);
const stream = negotiated.streams[0];
if (!stream.dropped.includes("PCMA")) problems.push("pcma not dropped");
if (!stream.rejected) problems.push("port 0");
if (stream.codecs.some((c) => c.name === "PCMA")) problems.push("pcma kept");

const cube = applyCube('request INVITE sip-header Diversion remove\nrequest INVITE sip-header From modify "Alice" "Alicia"\n', good);
if (/Diversion/i.test(cube.output)) problems.push("cube remove");
if (!/Alicia/.test(cube.output)) problems.push("cube modify");

const acme = applyAcme(`header-rule
name strip-server
header-name Server
action delete
msg-type request
comparison-type boolean
`, good);
if (/^Server:/m.test(acme.output)) problems.push("acme delete");

const capture = `Nov 2 02:11:04.221: //-1/xxxxxxxxxxxx/SIP/Msg/ccsipDisplayMsg:
Received:
INVITE sip:+15551212@203.0.113.20 SIP/2.0
Via: SIP/2.0/UDP 203.0.113.10;branch=z9hG4bK7766as01
Max-Forwards: 70
From: "Alice" <sip:alice@example.com>;tag=9fxced76sl
To: <sip:+15551212@example.com>
Call-ID: a84b4c76e66710@example.com
CSeq: 1 INVITE
Content-Length: 0

Sent:
SIP/2.0 100 Trying
Via: SIP/2.0/UDP 203.0.113.10;branch=z9hG4bK7766as01
From: "Alice" <sip:alice@example.com>;tag=9fxced76sl
To: <sip:+15551212@example.com>
Call-ID: a84b4c76e66710@example.com
CSeq: 1 INVITE
Content-Length: 0
`;
const messages = extractMessages(capture);
if (messages.length !== 2 || messages[0].direction !== "received" || messages[1].direction !== "sent") {
  problems.push(`extract ${JSON.stringify(messages.map((m) => m.direction))}`);
}

const report = {
  tracks: tracks.length,
  lessons,
  quizzes,
  cards,
  labs,
  faults,
  boss: boss.incidents.length,
  interview: interview.items.length,
  glossary: glossary.terms.length,
  cites,
  flows,
  illustrations,
  featuredLabs: labsPage.labs.length,
  shellBytes,
  atlas: ATLAS.length,
  animated,
  charts: CHARTS.length,
  sheets: manifest.items.filter((item) => item.html && item.pdf && item.png).length,
  problems,
};
console.log(JSON.stringify(report, null, 2));
if (problems.length) process.exit(1);
void pathToFileURL;
