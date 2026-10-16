import { esc } from "./draw.js";

export const CHARTS = [
  { id: "lessons", title: "Lessons per track", source: "Counted from campus/data/catalog.json." },
  { id: "minutes", title: "Minutes per track", source: "Sum of lesson minutes in the catalog index." },
  { id: "levels", title: "Tracks by level", source: "The level field on each catalog track." },
  { id: "ports", title: "Port rows by transport", source: "campus/data/ports.json, checked 2026-10-15." },
  { id: "tags", title: "Lesson tags", source: "Tag counts on catalog lessons. Top eight." },
  { id: "totals", title: "Campus totals", source: "catalog.stats. Drawn with rough.js." },
];

function scaleOf(max, width) {
  const d3 = globalThis.d3;
  if (d3 && typeof d3.scaleLinear === "function") {
    return d3.scaleLinear().domain([0, max || 1]).range([0, width]);
  }
  return (value) => (Number(value) / (max || 1)) * width;
}

function barChart(label, rows, unit) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  const widthOf = scaleOf(max, 520);
  const rowH = 42;
  const h = 16 + rows.length * rowH;
  const bars = rows.map((row, i) => {
    const y = 10 + i * rowH;
    const w = Math.max(4, widthOf(row.value));
    const suffix = unit ? ` ${unit}` : "";
    const tip = `${row.label}: ${row.value}${suffix}`;
    return `<text x="12" y="${y + 14}" class="d-sub">${esc(row.label)}</text>
      <text x="548" y="${y + 14}" text-anchor="end" class="d-sub">${esc(String(row.value))}${esc(suffix)}</text>
      <rect data-tip="${esc(tip)}" x="12" y="${y + 16}" width="536" height="22" fill="transparent"></rect>
      <rect class="bar" data-tip="${esc(tip)}" x="12" y="${y + 22}" width="${w.toFixed(1)}" height="12" rx="4" fill="var(--cc-accent-1)" opacity="0.9"></rect>`;
  }).join("");
  return `<svg class="chart-svg" width="560" height="${h}" viewBox="0 0 560 ${h}" role="img" aria-label="${esc(label)}">
    <rect width="560" height="${h}" rx="12" fill="var(--cc-bg)" stroke="var(--cc-line)"></rect>
    ${bars}
  </svg>`;
}

function lessonsRows(catalog) {
  return catalog.tracks.map((track) => ({ label: track.title.slice(0, 22), value: track.lessons.length }));
}

function minutesRows(catalog) {
  return catalog.tracks.map((track) => ({
    label: track.title.slice(0, 22),
    value: track.lessons.reduce((sum, lesson) => sum + (lesson.minutes || 0), 0),
  }));
}

function levelRows(catalog) {
  const map = new Map();
  for (const track of catalog.tracks) map.set(track.level, (map.get(track.level) || 0) + 1);
  return [...map.entries()].map(([label, value]) => ({ label, value }));
}

function portRows(ports) {
  const map = new Map();
  for (const row of ports.rows || []) map.set(row.transport, (map.get(row.transport) || 0) + 1);
  return [...map.entries()].map(([label, value]) => ({ label, value }));
}

function tagRows(catalog) {
  const map = new Map();
  for (const track of catalog.tracks) {
    for (const lesson of track.lessons) {
      for (const tag of lesson.tags || []) map.set(tag, (map.get(tag) || 0) + 1);
    }
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value }));
}

function totalRows(catalog) {
  const stats = catalog.stats;
  return [
    ["Lessons", stats.lessons],
    ["Quizzes", stats.quizzes],
    ["Cards", stats.cards],
    ["Labs", stats.labs],
    ["Glossary", stats.glossary],
    ["Faults", stats.faults],
  ].map(([label, value]) => ({ label, value }));
}

export function chartMarkup(id, catalog, ports) {
  if (id === "lessons") return barChart("Lessons per track", lessonsRows(catalog), "");
  if (id === "minutes") return barChart("Minutes per track", minutesRows(catalog), "min");
  if (id === "levels") return barChart("Tracks by level", levelRows(catalog), "");
  if (id === "ports") return barChart("Port rows by transport", portRows(ports), "");
  if (id === "tags") return barChart("Lesson tags", tagRows(catalog), "");
  if (id === "totals") return `<svg id="chart-totals" class="chart-svg" width="520" height="280" viewBox="0 0 520 280" role="img" aria-label="Campus totals"></svg>`;
  return "";
}

export function chartsHTML(catalog, ports) {
  return `<div class="chart-grid">${CHARTS.map((chart) => `<figure class="chart-card" id="chart-${esc(chart.id)}" data-chart="${esc(chart.id)}">
      ${chartMarkup(chart.id, catalog, ports)}
      <figcaption><strong>${esc(chart.title)}.</strong> ${esc(chart.source)}</figcaption>
    </figure>`).join("")}</div>`;
}

export function bindChartTips(root) {
  if (!root) return () => {};
  const grids = [...root.querySelectorAll(".chart-grid")];
  const stops = grids.map((grid) => {
    const tip = document.createElement("div");
    tip.className = "chart-tip";
    tip.hidden = true;
    grid.appendChild(tip);
    const move = (event) => {
      const el = event.target.closest("[data-tip]");
      if (!el || !grid.contains(el)) { tip.hidden = true; return; }
      tip.hidden = false;
      tip.textContent = el.dataset.tip;
      const rect = grid.getBoundingClientRect();
      tip.style.left = `${Math.min(event.clientX - rect.left + 12, rect.width - 160)}px`;
      tip.style.top = `${event.clientY - rect.top + 14}px`;
    };
    const leave = () => { tip.hidden = true; };
    grid.addEventListener("pointermove", move);
    grid.addEventListener("pointerleave", leave);
    return () => {
      grid.removeEventListener("pointermove", move);
      grid.removeEventListener("pointerleave", leave);
    };
  });
  return () => stops.forEach((fn) => fn());
}

export function animateCharts(root) {
  const motion = document.documentElement.dataset.motion;
  const reduce = motion === "reduce" || (motion !== "full" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (!root || reduce) return;
  const anime = globalThis.anime;
  if (!anime || typeof anime.animate !== "function") return;
  root.querySelectorAll(".chart-svg rect.bar").forEach((rect, index) => {
    const width = Number(rect.getAttribute("width")) || 0;
    const state = { w: 0 };
    rect.setAttribute("width", "0");
    try {
      anime.animate(state, {
        w: width,
        duration: 700,
        delay: index * 20,
        onUpdate: () => rect.setAttribute("width", state.w.toFixed(1)),
      });
    } catch {
      rect.setAttribute("width", String(width));
    }
  });
}

export function paintRoughTotals(root, catalog) {
  const svg = root.querySelector("#chart-totals");
  const rough = globalThis.rough;
  if (!svg || !rough || typeof rough.svg !== "function") return;
  const rows = totalRows(catalog);
  const max = Math.max(...rows.map((row) => row.value), 1);
  const widthOf = scaleOf(max, 240);
  const rc = rough.svg(svg);
  rows.forEach((row, i) => {
    const y = 24 + i * 40;
    const w = Math.max(8, widthOf(row.value));
    const node = rc.rectangle(150, y, w, 22, {
      stroke: "#3ddcff",
      fill: "#173049",
      fillStyle: "hachure",
      roughness: 1.1,
      strokeWidth: 1.5,
    });
    svg.appendChild(node);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", "12");
    label.setAttribute("y", String(y + 16));
    label.setAttribute("class", "d-sub");
    label.textContent = `${row.label} ${row.value}`;
    svg.appendChild(label);
  });
}

export function trackMinutesChart(track) {
  const rows = track.lessons.map((lesson) => ({ label: lesson.title.slice(0, 28), value: lesson.minutes || 0 }));
  return barChart(`${track.title} minutes`, rows, "min");
}

const MIND = {
  content: "SIP session",
  children: [
    { content: "Signaling", children: [
      { content: "INVITE" },
      { content: "REGISTER" },
      { content: "REFER" },
      { content: "PRACK" },
    ] },
    { content: "Media", children: [
      { content: "SDP" },
      { content: "RTP" },
      { content: "SRTP" },
    ] },
    { content: "Reachability", children: [
      { content: "NAT" },
      { content: "ICE" },
      { content: "TLS" },
    ] },
    { content: "Neighbors", children: [
      { content: "E911" },
      { content: "SIPREC" },
      { content: "WFM" },
      { content: "CRM" },
    ] },
  ],
};

function mindNode(node) {
  return {
    content: node.content,
    children: (node.children || []).map(mindNode),
  };
}

export function mountMind(host) {
  host.innerHTML = `<div class="markmap-wrap"><svg id="sip-mind" width="640" height="480" role="img" aria-label="SIP session mind map"></svg></div>
    <p class="fine">Mind map drawn with markmap and d3 from the campus outline. It is a map of topics, not a network.</p>`;
  const svg = host.querySelector("#sip-mind");
  const lib = globalThis.markmap;
  if (!svg || !lib || typeof lib.Markmap !== "function") {
    host.insertAdjacentHTML("beforeend", `<p class="fine">The mind map library did not load. The diagram atlas still has the ecosystem drawing.</p>`);
    return () => {};
  }
  const wrap = host.querySelector(".markmap-wrap");
  const width = Math.max(280, Math.round(wrap?.getBoundingClientRect().width || 640));
  const height = 480;
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  try {
    const motion = document.documentElement.dataset.motion;
    const reduced = motion === "reduce" || (motion !== "full" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const mm = lib.Markmap.create(svg, { duration: reduced ? 0 : 300 }, mindNode(MIND));
    return () => { if (mm && typeof mm.destroy === "function") mm.destroy(); };
  } catch (err) {
    host.insertAdjacentHTML("beforeend", `<p class="fine">${esc(err.message)}</p>`);
    return () => {};
  }
}
