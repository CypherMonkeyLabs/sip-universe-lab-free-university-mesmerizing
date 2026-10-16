/**
 * Fail the build when the root university misses the brief's minimums
 * or ships a brand link outside the three allowed hosts.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { brandLinkProblems } from "./check-brand-links.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];

function walk(dir, into = []) {
  if (!existsSync(dir)) return into;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, into);
    else into.push(full);
  }
  return into;
}

const htmlFiles = walk(root).filter((file) => {
  if (!file.endsWith(".html") || file.includes("/node_modules/")) return false;
  const rel = file.slice(root.length + 1);
  if (rel.startsWith("campus/") || rel.startsWith("assets/")) return false;
  return true;
});
const forbidden = /https?:\/\/(?:(?:www\.)?x\.com|linkedin\.com|huggingface\.co|github\.com\/cipher0x9)|mailto:/i;
const needsSources = (file) => {
  const rel = file.slice(root.length + 1);
  if (rel.startsWith("rooms/") || rel.startsWith("tracks/") || rel.startsWith("diagrams/pages/") || rel.startsWith("downloads/")) return true;
  return !rel.includes("/");
};
for (const file of htmlFiles) {
  const text = readFileSync(file, "utf8");
  const rel = file.replace(root + "/", "");
  if (forbidden.test(text)) problems.push(`forbidden link ${rel}`);
  if (!text.includes("independent, free, learning-only")) problems.push(`disclaimer ${rel}`);
  if (needsSources(file) && !text.includes("Sources and go deeper")) problems.push(`sources heading ${rel}`);
}
for (const hit of brandLinkProblems(root)) problems.push(hit);

const index = existsSync(join(root, "index.html")) ? readFileSync(join(root, "index.html"), "utf8") : "";
for (const word of ["diagrams.html", "flows.html", "charts.html", "Cheat Codes", "play.html", "ecosystem.html", "downloads.html", "careers.html"]) {
  if (!index.includes(word)) problems.push(`home menu ${word}`);
}
for (const host of ["https://cyphermonkeylabs.com", "https://github.com/CypherMonkeyLabs", "https://linktr.ee/cyphermonkey"]) {
  if (!index.includes(host)) problems.push(`brand ${host}`);
}
if (index.includes('http-equiv="refresh"')) problems.push("home still redirects");

const countsPath = join(root, "data/build-counts.json");
if (!existsSync(countsPath)) problems.push("missing build-counts");
else {
  const counts = JSON.parse(readFileSync(countsPath, "utf8"));
  if (counts.diagrams < 25) problems.push(`diagrams ${counts.diagrams}`);
  if (counts.animated < 12) problems.push(`animated ${counts.animated}`);
  if (counts.sheets < 10) problems.push(`sheets ${counts.sheets}`);
  if (counts.rooms < 100) problems.push(`rooms ${counts.rooms}`);
  if (counts.missing) problems.push(`missing files ${counts.missing}`);
}

const svgs = existsSync(join(root, "diagrams"))
  ? readdirSync(join(root, "diagrams")).filter((name) => name.endsWith(".svg"))
  : [];
const animated = svgs.filter((name) => readFileSync(join(root, "diagrams", name), "utf8").includes("animateMotion")).length;
if (svgs.length < 25) problems.push(`svg files ${svgs.length}`);
if (animated < 12) problems.push(`animated svg ${animated}`);

const charts = existsSync(join(root, "charts.html")) ? readFileSync(join(root, "charts.html"), "utf8") : "";
const chartCount = (charts.match(/<figure>/g) || []).length;
if (chartCount < 6) problems.push(`chart figures ${chartCount}`);

const roomDir = join(root, "rooms");
const roomPages = existsSync(roomDir) ? readdirSync(roomDir).filter((name) => name.endsWith(".html")) : [];
let sourcesOk = 0;
for (const name of roomPages) {
  const id = name.replace(/\.html$/, "");
  const sources = join(root, "rooms/sources", id, "sources.json");
  if (!existsSync(sources)) problems.push(`sources.json ${id}`);
  else sourcesOk += 1;
}
if (roomPages.length < 100) problems.push(`room pages ${roomPages.length}`);

const sheetDir = join(root, "downloads/sheets");
const slugs = existsSync(sheetDir) ? [...new Set(readdirSync(sheetDir).map((name) => name.replace(/\.(html|pdf|png)$/, "")))] : [];
let fullSheets = 0;
for (const slug of slugs) {
  if (["html", "pdf", "png"].every((ext) => existsSync(join(sheetDir, `${slug}.${ext}`)) && statSync(join(sheetDir, `${slug}.${ext}`)).size > 200)) fullSheets += 1;
}
if (fullSheets < 10) problems.push(`full sheets ${fullSheets}`);

const report = {
  html: htmlFiles.length,
  rooms: roomPages.length,
  sourcesOk,
  svgs: svgs.length,
  animated,
  charts: chartCount,
  fullSheets,
  problems,
};
console.log(JSON.stringify(report, null, 2));
if (problems.length) process.exit(1);
