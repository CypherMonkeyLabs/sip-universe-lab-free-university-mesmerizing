const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function u16(n) {
  return Uint8Array.of(n & 0xff, (n >>> 8) & 0xff);
}
function u32(n) {
  return Uint8Array.of(n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff);
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

export function buildZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = new TextEncoder().encode(file.name);
    const data = file.data;
    const crc = crc32(data);
    const local = concat([
      u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0),
      name, data,
    ]);
    const central = concat([
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset), name,
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralDir = concat(centrals);
  const end = concat([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(centralDir.length), u32(offset), u16(0),
  ]);
  return concat([...locals, centralDir, end]);
}

const SHELL = [
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
  "data/daily.json",
  "data/guidebot.json",
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

export async function downloadPack(catalog) {
  const status = document.querySelector("#pack-status");
  if (location.protocol === "file:") {
    if (status) status.textContent = "This page already has the catalog embedded. Serve the folder over HTTP to build the zip.";
    return 0;
  }
  if (status) status.textContent = "Collecting the campus…";
  const names = new Set(SHELL);
  for (const track of catalog.tracks || []) names.add(track.file);
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
    /* cheat sheets are optional in the pack */
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
