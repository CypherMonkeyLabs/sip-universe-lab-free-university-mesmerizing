// Validates data/lesson-map.json against the room pages.
// Every lesson needs: a level 0-10, at least one outcome, source ids that exist,
// a title that matches the room, and last_verified null or YYYY-MM-DD.
// Run: node scripts/validate_lessons.mjs        (exit 1 on any problem)
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const map = JSON.parse(readFileSync(join(root, "data/lesson-map.json"), "utf8"));
const schema = JSON.parse(readFileSync(join(root, "data/lesson-schema.json"), "utf8"));
const sources = JSON.parse(readFileSync(join(root, "data/sources.json"), "utf8"));
const sourceIds = new Set((sources.sources || []).map((source) => source.id));
const problems = [];

function strip(html) {
  return String(html || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function roomTitle(file) {
  const html = readFileSync(join(root, "rooms", file), "utf8");
  const h1 = html.match(/<h1>([\s\S]*?)<\/h1>/i);
  return strip(h1 ? h1[1] : "");
}

const files = readdirSync(join(root, "rooms")).filter((name) => name.endsWith(".html"));
const onDisk = new Map();
for (const file of files) {
  const html = readFileSync(join(root, "rooms", file), "utf8");
  const id = (html.match(/data-room="([^"]+)"/) || [])[1] || file.replace(/\.html$/, "");
  onDisk.set(id, roomTitle(file));
}

const mapped = new Map((map.lessons || []).map((lesson) => [lesson.key, lesson]));
for (const [key, title] of onDisk) {
  const lesson = mapped.get(key);
  if (!lesson) {
    problems.push(`${key}: not in lesson-map.json`);
    continue;
  }
  for (const field of schema.required) {
    if (!(field in lesson)) problems.push(`${key}: missing field ${field}`);
  }
  if (!Number.isInteger(lesson.level) || lesson.level < 0 || lesson.level > 10) problems.push(`${key}: level must be 0-10`);
  if (!Array.isArray(lesson.outcomes) || lesson.outcomes.length < 1 || lesson.outcomes.some((item) => typeof item !== "string" || item.length < 8)) {
    problems.push(`${key}: needs at least one outcome`);
  }
  if (!Array.isArray(lesson.sources) || lesson.sources.length < 1) problems.push(`${key}: needs at least one source`);
  for (const source of lesson.sources || []) {
    if (!sourceIds.has(source)) problems.push(`${key}: unknown source id ${source}`);
  }
  if (lesson.title !== title) problems.push(`${key}: title differs from the room`);
  if (lesson.last_verified !== null && !/^\d{4}-\d{2}-\d{2}$/.test(lesson.last_verified)) {
    problems.push(`${key}: last_verified must be null or YYYY-MM-DD`);
  }
}
for (const key of mapped.keys()) {
  if (!onDisk.has(key)) problems.push(`${key}: in lesson-map.json but no such room`);
}

const perLevel = {};
for (const lesson of map.lessons || []) perLevel[lesson.level] = (perLevel[lesson.level] || 0) + 1;
for (const problem of problems) console.log("FAIL", problem);
console.log("lessons:", onDisk.size, "mapped:", mapped.size, "per level:", JSON.stringify(perLevel));
console.log("validate_lessons:", problems.length, "problems");
process.exit(problems.length ? 1 : 0);
