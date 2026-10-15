import { onSettings } from "./audio.js";

const LABELS = ["UA", "SBC", "DNS", "PSTN", "TURN", "RTP"];

function reduced() {
  return document.documentElement.dataset.motion === "reduce";
}

function hasWebGL() {
  try {
    const test = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (test.getContext("webgl2") || test.getContext("webgl")));
  } catch {
    return false;
  }
}

function cssHex(name, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : fallback;
}

function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "vendor/three.min.js";
    script.onload = () => resolve(window.THREE);
    script.onerror = () => reject(new Error("Three.js did not load"));
    document.head.appendChild(script);
  });
}

function fallbackMarkup() {
  const nodes = LABELS.map((name, i) => `<span class="fb-node" style="--a:${i * 60}deg">${name}</span>`).join("");
  return `<div class="fb-grid"></div><div class="fb-globe"></div><div class="fb-ring r1"></div><div class="fb-ring r2"></div><div class="fb-ring r3"></div>${nodes}`;
}

function paintLabel(text, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 72;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 256, 72);
  ctx.font = "700 40px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, 128, 36);
  return canvas;
}

export async function mountHero(host) {
  const glass = host.innerHTML;
  host.innerHTML = `<div class="hero-bleed" data-hero="pending">
    <p class="sr-only">A three-dimensional call path. A user agent, an SBC, DNS, PSTN, TURN, and RTP orbit a glowing globe on a neon grid.</p>
    <canvas class="hero-canvas" aria-hidden="true"></canvas>
    <div class="hero-fallback" hidden>${fallbackMarkup()}</div>
    <div class="hero-glass">${glass}</div>
  </div>`;
  const bleed = host.querySelector(".hero-bleed");
  const canvas = host.querySelector(".hero-canvas");
  const fallback = host.querySelector(".hero-fallback");
  const fit = () => {
    const head = document.querySelector(".site-head");
    const h = head ? head.offsetHeight : 120;
    bleed.style.marginTop = `-${h}px`;
    bleed.style.paddingTop = `${h + 8}px`;
  };
  fit();

  const showFallback = () => {
    bleed.dataset.hero = "css";
    canvas.hidden = true;
    fallback.hidden = false;
  };

  if (reduced() || !hasWebGL()) {
    showFallback();
    return () => {};
  }

  let THREE;
  try {
    THREE = await loadThree();
  } catch {
    showFallback();
    return () => {};
  }
  if (!THREE || !host.isConnected) {
    showFallback();
    return () => {};
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch {
    showFallback();
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  bleed.dataset.hero = "webgl";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
  camera.position.set(0.2, 2.15, 12.2);

  const palette = () => ({
    bg: cssHex("--cc-bg", "#0b1020"),
    a: cssHex("--cc-accent-1", "#39ff14"),
    b: cssHex("--cc-accent-2", "#ff2bd6"),
    c: cssHex("--cc-accent-3", "#00e5ff"),
    d: cssHex("--cc-accent-4", "#ffe600"),
  });

  const colors = palette();
  scene.background = new THREE.Color(colors.bg);
  scene.fog = new THREE.Fog(colors.bg, 24, 72);
  renderer.setClearColor(colors.bg, 1);

  const globe = new THREE.Group();
  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.35, 1),
    new THREE.MeshBasicMaterial({ color: colors.a, wireframe: true }),
  );
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.55, 28, 28),
    new THREE.MeshBasicMaterial({ color: colors.c, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  globe.add(wire, core);
  scene.add(globe);

  const rings = [4.1, 5.4, 6.6].map((radius, i) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.028, 12, 96),
      new THREE.MeshBasicMaterial({ color: [colors.b, colors.c, colors.d][i] }),
    );
    mesh.rotation.x = 1.15 + i * 0.28;
    mesh.rotation.y = i * 0.4;
    scene.add(mesh);
    return mesh;
  });

  const grid = new THREE.GridHelper(48, 24, colors.a, colors.b);
  grid.position.y = -3.2;
  if (grid.material) {
    const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
    mats.forEach((mat) => { mat.transparent = true; mat.opacity = 0.45; });
  }
  scene.add(grid);

  const count = 1100;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const radius = 8 + Math.random() * 18;
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(theta) * radius;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 2] = Math.sin(theta) * radius;
  }
  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(pointsGeo, new THREE.PointsMaterial({
    color: colors.c,
    size: 0.07,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  scene.add(points);

  const orbit = new THREE.Group();
  const nodeMats = [];
  const shellMats = [];
  const labelMats = [];
  LABELS.forEach((name, i) => {
    const tone = [colors.a, colors.b, colors.c, colors.d, colors.a, colors.b][i];
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: tone, emissive: tone, emissiveIntensity: 0.65, roughness: 0.35, metalness: 0.15 });
    const shellMat = new THREE.MeshBasicMaterial({ color: tone, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false });
    nodeMats.push(bodyMat);
    shellMats.push(shellMat);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 20), bodyMat);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 16), shellMat);
    const tex = new THREE.CanvasTexture(paintLabel(name, "#f7fbff"));
    const labelMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    labelMats.push(labelMat);
    const sprite = new THREE.Sprite(labelMat);
    sprite.position.y = 0.95;
    sprite.scale.set(2.4, 0.68, 1);
    group.add(body, shell, sprite);
    const angle = (i / LABELS.length) * Math.PI * 2;
    group.position.set(Math.cos(angle) * 7.2, Math.sin(angle * 2) * 0.6, Math.sin(angle) * 7.2);
    group.userData.angle = angle;
    orbit.add(group);
  });
  scene.add(orbit);

  const linePositions = [];
  LABELS.forEach((_, i) => {
    const a = (i / LABELS.length) * Math.PI * 2;
    const b = ((i + 1) / LABELS.length) * Math.PI * 2;
    linePositions.push(Math.cos(a) * 7.2, 0.2, Math.sin(a) * 7.2, Math.cos(b) * 7.2, 0.2, Math.sin(b) * 7.2);
  });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linePositions), 3));
  const lineMat = new THREE.LineBasicMaterial({ color: colors.a, transparent: true, opacity: 0.7 });
  scene.add(new THREE.LineSegments(lineGeo, lineMat));

  const key = new THREE.PointLight(colors.b, 18, 48);
  key.position.set(6, 8, 8);
  const fill = new THREE.PointLight(colors.c, 14, 48);
  fill.position.set(-8, 3, 6);
  scene.add(new THREE.AmbientLight(0xffffff, 0.38), key, fill);

  const accents = [wire.material, core.material, ...rings.map((ring) => ring.material), points.material, lineMat, ...nodeMats, ...shellMats];
  const applyPalette = () => {
    const next = palette();
    scene.background.set(next.bg);
    scene.fog.color.set(next.bg);
    renderer.setClearColor(next.bg, 1);
    wire.material.color.set(next.a);
    core.material.color.set(next.c);
    rings[0].material.color.set(next.b);
    rings[1].material.color.set(next.c);
    rings[2].material.color.set(next.d);
    points.material.color.set(next.c);
    lineMat.color.set(next.a);
    key.color.set(next.b);
    fill.color.set(next.c);
    const tones = [next.a, next.b, next.c, next.d, next.a, next.b];
    nodeMats.forEach((mat, i) => { mat.color.set(tones[i]); mat.emissive.set(tones[i]); });
    shellMats.forEach((mat, i) => mat.color.set(tones[i]));
    const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMats.forEach((mat, i) => mat.color && mat.color.set(i === 0 ? next.a : next.b));
    void accents;
  };

  let raf = 0;
  let stop = false;
  let t = 0;
  const pointer = { x: 0, y: 0 };
  let scrollY = window.scrollY || 0;
  const onPtr = (event) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    pointer.x = (event.clientX / w - 0.5) * 2;
    pointer.y = (event.clientY / h - 0.5) * 2;
  };
  const onScroll = () => { scrollY = window.scrollY || 0; };
  window.addEventListener("pointermove", onPtr, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });

  const resize = () => {
    const w = bleed.clientWidth || window.innerWidth;
    const h = bleed.clientHeight || window.innerHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(bleed);
  resize();

  const unsettings = onSettings(applyPalette);
  const tick = () => {
    if (stop) return;
    raf = requestAnimationFrame(tick);
    if (document.hidden) return;
    t += 0.005;
    const drift = t * 0.35;
    globe.rotation.y = drift;
    globe.rotation.x = Math.sin(t * 0.4) * 0.12;
    rings.forEach((ring, i) => { ring.rotation.z = drift * (0.35 + i * 0.12); });
    orbit.rotation.y = drift * 0.55;
    points.rotation.y = drift * 0.08;
    const px = pointer.x * 1.8 + Math.sin(t * 0.15) * 0.9;
    const py = 2.05 + pointer.y * -0.7 - Math.min(scrollY, 700) * 0.0025;
    const pz = 12.2 + pointer.y * 0.5;
    camera.position.x += (px - camera.position.x) * 0.04;
    camera.position.y += (py - camera.position.y) * 0.04;
    camera.position.z += (pz - camera.position.z) * 0.04;
    camera.lookAt(0, 0.85, 0);
    renderer.render(scene, camera);
  };
  tick();

  return () => {
    stop = true;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onPtr);
    window.removeEventListener("scroll", onScroll);
    ro.disconnect();
    unsettings();
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          if (mat.map) mat.map.dispose();
          mat.dispose();
        });
      }
    });
    labelMats.forEach((mat) => { if (mat.map) mat.map.dispose(); });
    renderer.dispose();
  };
}
