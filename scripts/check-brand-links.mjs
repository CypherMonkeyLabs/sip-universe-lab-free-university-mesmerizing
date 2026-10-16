/**
 * Fail when a generated page or script ships a social link outside the
 * three brand destinations: cyphermonkeylabs.com, github.com/CypherMonkeyLabs,
 * and linktr.ee/cyphermonkey.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const socialHost = /(?:^|\.)(?:x\.com|twitter\.com|linkedin\.com|huggingface\.co|facebook\.com|instagram\.com|tiktok\.com|youtube\.com|youtu\.be|discord\.com|discord\.gg|bsky\.app)$/i;
const urlRe = /https?:\/\/[^\s"'<>)]+/gi;

function walk(dir, into = []) {
  if (!existsSync(dir)) return into;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "vendor") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, into);
    else into.push(full);
  }
  return into;
}

function brandUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { return false; }
  const host = url.hostname.replace(/^www\./i, "");
  if (host === "cyphermonkeylabs.com") return true;
  if (host === "github.com" && /^\/CypherMonkeyLabs(?:\/|$)/i.test(url.pathname)) return true;
  if (host === "linktr.ee" && /^\/cyphermonkey\/?$/i.test(url.pathname)) return true;
  return false;
}

export function brandLinkProblems(base = root) {
  const problems = [];
  const files = walk(base).filter((file) => /\.(html|mjs|js|css|json|md)$/.test(file));
  for (const file of files) {
    if (file.endsWith("/scripts/check-brand-links.mjs")) continue;
    const text = readFileSync(file, "utf8");
    const found = text.match(urlRe) || [];
    for (const raw of found) {
      const trimmed = raw.replace(/[.,;]+$/, "");
      let url;
      try { url = new URL(trimmed); } catch { continue; }
      const host = url.hostname.replace(/^www\./i, "");
      if (!socialHost.test(host) && host !== "github.com") continue;
      if (brandUrl(trimmed)) continue;
      problems.push(`non-brand social link ${file.slice(base.length + 1)} ${trimmed}`);
    }
  }
  return problems;
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  const problems = brandLinkProblems();
  console.log(JSON.stringify({ problems }, null, 2));
  if (problems.length) process.exit(1);
}
