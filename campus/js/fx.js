const TOKENS = [
  ["SIP", "5060"],
  ["SDP", "m="],
  ["RTP", "even"],
  ["SRTP", "3711"],
  ["TLS", "5061"],
  ["NAT", "c="],
  ["ICE", "8445"],
  ["SBC", "B2B"],
];

export function paradeHTML() {
  return `<div class="parade" data-parade>${TOKENS.map(([name, mark], i) => `<span class="token" style="--i:${i}"><b>${name}</b><small>${mark}</small></span>`).join("")}</div>`;
}

export function bindParade(root) {
  const parade = root.querySelector("[data-parade]");
  if (!parade) return () => {};
  const onMove = (event) => {
    const rect = parade.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    parade.style.setProperty("--tilt-x", `${(-y * 16).toFixed(2)}deg`);
    parade.style.setProperty("--tilt-y", `${(x * 20).toFixed(2)}deg`);
  };
  const onLeave = () => {
    parade.style.removeProperty("--tilt-x");
    parade.style.removeProperty("--tilt-y");
  };
  parade.addEventListener("pointermove", onMove);
  parade.addEventListener("pointerleave", onLeave);
  return () => {
    parade.removeEventListener("pointermove", onMove);
    parade.removeEventListener("pointerleave", onLeave);
  };
}

function reduced() {
  return document.documentElement.dataset.motion === "reduce";
}

export function countUp(el, value) {
  const end = Number(value) || 0;
  const anime = globalThis.anime;
  if (reduced() || !anime || typeof anime.animate !== "function") {
    el.textContent = String(end);
    return;
  }
  const state = { n: 0 };
  try {
    anime.animate(state, {
      n: end,
      duration: 900,
      onUpdate: () => { el.textContent = String(Math.round(state.n)); },
    });
  } catch {
    el.textContent = String(end);
  }
}

export function animateStats(root) {
  root.querySelectorAll("[data-count]").forEach((el) => countUp(el, el.dataset.count));
  const anime = globalThis.anime;
  if (reduced() || !anime || typeof anime.animate !== "function") return;
  const nodes = root.querySelectorAll(".token");
  if (!nodes.length) return;
  try {
    anime.animate(nodes, {
      opacity: [0, 1],
      translateY: [14, 0],
      delay: typeof anime.stagger === "function" ? anime.stagger(45) : 0,
      duration: 520,
    });
  } catch {
    /* motion is optional */
  }
}

export function burst() {
  const confetti = globalThis.confetti;
  if (reduced() || typeof confetti !== "function") return;
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.65 }, disableForReducedMotion: true });
}

export function bindReveal(root) {
  const nodes = [...root.querySelectorAll(".card, .atlas-fig, .chart-card, .architect, .panel")];
  const motion = document.documentElement.dataset.motion;
  const reduce = motion === "reduce" || (motion !== "full" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (reduce || typeof IntersectionObserver !== "function") {
    nodes.forEach((node) => node.classList.add("is-in"));
    return () => {};
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  nodes.forEach((node) => {
    node.classList.add("reveal");
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) node.classList.add("is-in");
    else io.observe(node);
  });
  return () => io.disconnect();
}

export function bindMenuKeys(root) {
  const nav = root.querySelector(".prime");
  if (!nav) return;
  nav.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const links = [...nav.querySelectorAll("a")];
    const index = links.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === "ArrowRight" ? (index + 1) % links.length : (index - 1 + links.length) % links.length;
    links[next].focus();
  });
}
