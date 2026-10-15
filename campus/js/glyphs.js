const ORDER = [
  "foundations", "sip-core", "call-flows", "routing", "sdp", "rtp", "security", "nat",
  "sbc", "cisco", "multivendor", "cloud", "troubleshoot", "operations", "ecosystem", "capstone",
];

function reduced() {
  return document.documentElement.dataset.motion === "reduce";
}

function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "vendor/three.min.js";
    script.onload = () => (window.THREE ? resolve(window.THREE) : reject(new Error("Three.js missing")));
    script.onerror = () => reject(new Error("Three.js did not load"));
    document.head.appendChild(script);
  });
}

function cssHex(name, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : fallback;
}

function lit(THREE, color, emissive) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: emissive || color,
    emissiveIntensity: 0.85,
    roughness: 0.32,
    metalness: 0.2,
  });
}

function glow(THREE, color) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

function build(THREE, id, colors) {
  const g = new THREE.Group();
  const A = colors[0];
  const B = colors[1];
  const C = colors[2];
  const add = (...meshes) => meshes.forEach((mesh) => g.add(mesh));
  if (id === "foundations") {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 18), lit(THREE, A));
    ear.scale.set(1, 1, 0.42);
    ear.position.set(-0.62, 0.48, 0);
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 18), lit(THREE, C));
    mouth.scale.set(1, 1, 0.42);
    mouth.position.set(0.62, -0.48, 0);
    const grip = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.09, 12, 24, Math.PI), lit(THREE, B));
    grip.rotation.z = -0.55;
    add(ear, mouth, grip);
  } else if (id === "sip-core") {
    for (let i = 0; i < 4; i += 1) {
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.72), lit(THREE, i % 2 ? B : A));
      sheet.position.set(0, i * 0.12, i * 0.08);
      sheet.rotation.x = -0.4;
      sheet.rotation.y = i * 0.18;
      add(sheet);
    }
  } else if (id === "call-flows") {
    const left = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 8), lit(THREE, A));
    const right = left.clone();
    left.position.x = -0.55;
    right.position.x = 0.55;
    add(left, right);
    for (let i = 0; i < 4; i += 1) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8), lit(THREE, i % 2 ? C : B));
      rung.rotation.z = Math.PI / 2;
      rung.position.y = 0.55 - i * 0.38;
      add(rung);
    }
  } else if (id === "routing") {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8), lit(THREE, A));
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.45, 12), lit(THREE, B));
    head.position.y = 0.75;
    const fork = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 10), lit(THREE, C));
    fork.position.set(0.45, 0.15, 0);
    fork.rotation.z = -0.9;
    add(shaft, head, fork);
  } else if (id === "sdp") {
    const offer = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.15), lit(THREE, A));
    const answer = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.15), lit(THREE, C));
    offer.rotation.set(-0.5, -0.4, 0.1);
    answer.rotation.set(-0.45, 0.5, -0.1);
    answer.position.set(0.25, 0.05, 0.2);
    add(offer, answer);
  } else if (id === "rtp") {
    for (let i = 0; i < 18; i += 1) {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), lit(THREE, i % 2 ? B : A));
      bead.position.set(-0.9 + i * 0.1, Math.sin(i * 0.55) * 0.45, Math.cos(i * 0.4) * 0.15);
      add(bead);
    }
  } else if (id === "security") {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.7, 16), lit(THREE, A));
    body.position.y = -0.25;
    const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.07, 12, 24, Math.PI), lit(THREE, C));
    shackle.rotation.z = Math.PI;
    shackle.position.y = 0.2;
    const key = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), glow(THREE, B));
    add(body, shackle, key);
  } else if (id === "nat") {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.15, 10), lit(THREE, A));
    const dish = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.05, 10, 24), lit(THREE, C));
    dish.rotation.x = 1.15;
    dish.position.y = 0.72;
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), glow(THREE, B));
    lamp.position.set(0.18, 0.15, 0.28);
    add(tower, dish, lamp);
  } else if (id === "sbc") {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.09, 12, 28, Math.PI), lit(THREE, A));
    arch.rotation.z = Math.PI;
    arch.position.y = 0.15;
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8), lit(THREE, B));
    const postR = postL.clone();
    postL.position.set(-0.7, -0.3, 0);
    postR.position.set(0.7, -0.3, 0);
    add(arch, postL, postR);
  } else if (id === "cisco") {
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 0.9), lit(THREE, A));
    const antenna = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.55, 8), lit(THREE, C));
    antenna.position.set(0.45, 0.4, 0.2);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), glow(THREE, B));
    lamp.position.set(-0.5, 0.2, 0.4);
    add(chassis, antenna, lamp);
  } else if (id === "multivendor") {
    const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), lit(THREE, A));
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.55, 10), lit(THREE, B));
    const knot = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 8, 16), lit(THREE, C));
    ico.position.x = -0.55;
    cone.position.set(0.55, -0.05, 0);
    knot.position.set(0, 0.15, 0.2);
    add(ico, cone, knot);
  } else if (id === "cloud") {
    [[0, 0, 0, 0.42], [-0.4, -0.05, 0.1, 0.3], [0.42, -0.02, 0, 0.32], [0.05, 0.22, -0.1, 0.28]].forEach(([x, y, z, r], i) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), lit(THREE, i % 2 ? C : A));
      puff.position.set(x, y, z);
      add(puff);
    });
  } else if (id === "troubleshoot") {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.07, 12, 24), lit(THREE, A));
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), glow(THREE, C));
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8), lit(THREE, B));
    handle.position.set(0.45, -0.45, 0);
    handle.rotation.z = 0.8;
    add(rim, lens, handle);
  } else if (id === "operations") {
    const dial = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.08, 12, 28), lit(THREE, A));
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), lit(THREE, B));
    const needle = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.55, 8), lit(THREE, C));
    needle.rotation.z = -0.6;
    needle.position.set(0.1, 0.12, 0.05);
    add(dial, face, needle);
  } else if (id === "ecosystem") {
    const hub = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), lit(THREE, A));
    add(hub);
    for (let i = 0; i < 5; i += 1) {
      const moon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), lit(THREE, i % 2 ? C : B));
      const ang = (i / 5) * Math.PI * 2;
      moon.position.set(Math.cos(ang) * 0.7, Math.sin(ang) * 0.45, Math.sin(ang) * 0.3);
      add(moon);
    }
  } else {
    const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.42, 0.12, 80, 12), lit(THREE, A));
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.03, 8, 32), glow(THREE, C));
    halo.rotation.x = Math.PI / 2;
    add(knot, halo);
  }
  return g;
}

function drawFlat(canvas, id) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const accent = cssHex("--cc-accent-1", "#7af0ff");
  const alt = cssHex("--cc-accent-2", "#ff8bd2");
  ctx.strokeStyle = accent;
  ctx.fillStyle = alt;
  ctx.lineWidth = 6;
  ctx.lineJoin = "round";
  ctx.save();
  ctx.translate(w / 2, h / 2);
  if (id === "foundations") {
    ctx.beginPath();
    ctx.arc(-36, -28, 16, 0, Math.PI * 2);
    ctx.arc(36, 28, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-22, -16);
    ctx.quadraticCurveTo(0, 8, 24, 16);
    ctx.stroke();
  } else if (id === "nat") {
    ctx.fillRect(-16, -40, 32, 70);
    ctx.beginPath();
    ctx.ellipse(0, -48, 28, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (id === "rtp") {
    ctx.beginPath();
    for (let i = 0; i <= 20; i += 1) ctx.lineTo(-80 + i * 8, Math.sin(i) * 36);
    ctx.stroke();
  } else if (id === "security") {
    ctx.strokeRect(-28, -10, 56, 48);
    ctx.beginPath();
    ctx.arc(0, -10, 18, Math.PI, 0);
    ctx.stroke();
  } else if (id === "sbc") {
    ctx.beginPath();
    ctx.arc(0, 10, 40, Math.PI, 0);
    ctx.stroke();
  } else if (id === "cloud") {
    ctx.beginPath();
    ctx.arc(-16, 6, 22, 0, Math.PI * 2);
    ctx.arc(16, 4, 26, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "troubleshoot") {
    ctx.beginPath();
    ctx.arc(-6, -8, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, 12);
    ctx.lineTo(36, 36);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillRect(-6, -28, 12, 56);
  }
  ctx.restore();
}

let renderer = null;
let scene = null;
let camera = null;
let THREE = null;
let raf = 0;
let cursor = 0;
const cache = new Map();

function palette() {
  return [cssHex("--cc-accent-1", "#7af0ff"), cssHex("--cc-accent-2", "#c9a6ff"), cssHex("--cc-accent-3", "#ff8bd2")];
}

function ensure(T) {
  if (renderer) return;
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 192;
  renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(192, 192, false);
  renderer.setClearColor(0x000000, 0);
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(35, 1, 0.1, 20);
  camera.position.set(1.35, 0.95, 2.35);
  camera.lookAt(0, 0, 0);
  scene.add(new T.AmbientLight(0xffffff, 0.55));
  const key = new T.PointLight(0xffffff, 12, 12);
  key.position.set(2, 3, 3);
  scene.add(key);
}

function paintOne(host) {
  const id = ORDER.includes(host.dataset.glyph) ? host.dataset.glyph : "capstone";
  const colors = palette();
  const key = `${id}:${colors.join(",")}`;
  let group = cache.get(id);
  if (!group || group.userData.key !== key) {
    if (group) {
      scene.remove(group);
      group.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    }
    group = build(THREE, id, colors);
    group.userData.key = key;
    cache.set(id, group);
  }
  cache.forEach((item) => { item.visible = item === group; });
  if (!group.parent) scene.add(group);
  group.rotation.y += 0.05;
  renderer.render(scene, camera);
  const ctx = host.getContext("2d");
  if (ctx) ctx.drawImage(renderer.domElement, 0, 0, host.width, host.height);
}

export function mountGlyphs(root) {
  const hosts = [...root.querySelectorAll(".glyph-view")];
  if (!hosts.length) return () => {};
  let dead = false;
  hosts.forEach((host) => drawFlat(host, host.dataset.glyph || ""));
  const loop = () => {
    if (dead) return;
    raf = requestAnimationFrame(loop);
    if (!renderer || document.hidden || reduced()) return;
    const batch = Math.min(4, hosts.length);
    for (let n = 0; n < batch; n += 1) {
      const host = hosts[cursor % hosts.length];
      cursor += 1;
      if (!host.isConnected) continue;
      try { paintOne(host); } catch { drawFlat(host, host.dataset.glyph || ""); }
    }
  };
  loadThree().then((T) => {
    if (dead) return;
    THREE = T;
    try {
      ensure(T);
    } catch {
      return;
    }
    if (!reduced()) loop();
    else hosts.forEach((host) => paintOne(host));
  }).catch(() => {});
  return () => {
    dead = true;
    if (raf) cancelAnimationFrame(raf);
  };
}
