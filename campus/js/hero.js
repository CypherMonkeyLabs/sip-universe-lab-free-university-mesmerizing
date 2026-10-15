import { onSettings } from "./audio.js";

const LABELS = ["UA", "SBC", "DNS", "PSTN", "TURN", "RTP"];
const MESSAGES = ["INVITE", "180", "200", "ACK"];
const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const EXTRACT = `
  uniform sampler2D tDiffuse;
  uniform float threshold;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    float keep = smoothstep(threshold, threshold + 0.4, luma);
    gl_FragColor = vec4(color.rgb * keep, 1.0);
  }
`;
const BLUR = `
  uniform sampler2D tDiffuse;
  uniform vec2 direction;
  varying vec2 vUv;
  void main() {
    vec3 acc = vec3(0.0);
    float sum = 0.0;
    for (int i = -6; i <= 6; i++) {
      float wgt = exp(-float(i * i) / 14.0);
      acc += texture2D(tDiffuse, vUv + direction * float(i)).rgb * wgt;
      sum += wgt;
    }
    gl_FragColor = vec4(acc / sum, 1.0);
  }
`;
let session = null;
let flyArmed = false;
let looseFly = null;

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

function makeTarget(THREE, w, h) {
  const target = new THREE.WebGLRenderTarget(w, h, { depthBuffer: true });
  return target;
}

function bloomKit(THREE) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  scene.add(mesh);
  const extract = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, threshold: { value: 0.42 } },
    vertexShader: VERT,
    fragmentShader: EXTRACT,
    depthTest: false,
    depthWrite: false,
  });
  const blur = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, direction: { value: new THREE.Vector2(1, 0) } },
    vertexShader: VERT,
    fragmentShader: BLUR,
    depthTest: false,
    depthWrite: false,
  });
  const composite = new THREE.ShaderMaterial({
    uniforms: { tBloom: { value: null }, strength: { value: 1.85 } },
    vertexShader: VERT,
    fragmentShader: `
      uniform sampler2D tBloom;
      uniform float strength;
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(texture2D(tBloom, vUv).rgb * strength, 1.0);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  });
  return { scene, camera, mesh, extract, blur, composite };
}

export function armFly() {
  if (reduced()) return;
  if (session && !session.flying) {
    flyArmed = true;
    return;
  }
  if (!session && !looseFly) startLooseFly();
}

function startLooseFly() {
  if (!hasWebGL()) return;
  loadThree().then((THREE) => {
    if (session || looseFly || reduced()) return;
    const canvas = document.createElement("canvas");
    canvas.className = "hero-canvas is-fly";
    document.body.appendChild(canvas);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    } catch {
      canvas.remove();
      return;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 80);
    const bg = cssHex("--cc-bg", "#07101f");
    scene.background = new THREE.Color(bg);
    renderer.setClearColor(bg, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.8, 1),
      new THREE.MeshBasicMaterial({ color: cssHex("--cc-accent-1", "#7af0ff"), wireframe: true }),
    );
    scene.add(wire);
    [3.2, 4.3, 5.4].forEach((radius, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.04, 8, 64),
        new THREE.MeshBasicMaterial({ color: cssHex(i === 1 ? "--cc-accent-2" : "--cc-accent-3", "#ff8bd2") }),
      );
      ring.rotation.x = 1.1 + i * 0.3;
      scene.add(ring);
    });
    const started = performance.now();
    looseFly = { renderer, scene, canvas };
    const tick = (now) => {
      if (!looseFly) return;
      const u = Math.min(1, (now - started) / 720);
      wire.rotation.y = u * 2.4;
      camera.position.set(Math.sin(u * Math.PI) * 3.2, 0.4 + u * 0.6, 9 - u * 7.2);
      camera.lookAt(0, 0.8, 0);
      renderer.render(scene, camera);
      if (u < 1) requestAnimationFrame(tick);
      else {
        renderer.dispose();
        scene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        });
        canvas.remove();
        looseFly = null;
      }
    };
    requestAnimationFrame(tick);
  }).catch(() => {});
}

export async function mountHero(host) {
  const glass = host.innerHTML;
  host.innerHTML = `<div class="hero-bleed" data-hero="pending">
    <p class="sr-only">A three-dimensional call path. A user agent, an SBC, DNS, PSTN, TURN, and RTP orbit a glowing globe. No fog. The nodes stay sharp.</p>
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  bleed.dataset.hero = "webgl";
  bleed.dataset.bloom = "0";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 80);
  camera.position.set(0, -0.55, 6.2);

  const palette = () => ({
    bg: cssHex("--cc-bg", "#0b1020"),
    a: cssHex("--cc-accent-1", "#39ff14"),
    b: cssHex("--cc-accent-2", "#ff2bd6"),
    c: cssHex("--cc-accent-3", "#00e5ff"),
    d: cssHex("--cc-accent-4", "#ffe600"),
  });
  const colors = palette();
  scene.background = new THREE.Color(colors.bg);
  scene.fog = null;
  renderer.setClearColor(colors.bg, 1);

  const globe = new THREE.Group();
  globe.position.y = 1.7;
  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.85, 1),
    new THREE.MeshBasicMaterial({ color: colors.a, wireframe: true }),
  );
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.25, 28, 28),
    new THREE.MeshBasicMaterial({ color: colors.c, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(2.15, 24, 24),
    new THREE.MeshBasicMaterial({ color: colors.b, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  globe.add(wire, core, halo);
  scene.add(globe);

  const rings = [3.05, 4.05, 5.15].map((radius, i) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.045, 12, 96),
      new THREE.MeshBasicMaterial({ color: [colors.b, colors.c, colors.d][i] }),
    );
    mesh.position.y = 1.7;
    mesh.rotation.x = 1.05 + i * 0.22;
    mesh.rotation.y = i * 0.4;
    scene.add(mesh);
    return mesh;
  });

  const grid = new THREE.GridHelper(28, 18, colors.a, colors.b);
  grid.position.y = -1.6;
  if (grid.material) {
    const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
    mats.forEach((mat) => { mat.transparent = true; mat.opacity = 0.55; });
  }
  scene.add(grid);

  const count = 1700;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const radius = 1.4 + Math.random() * 9.2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius * 1.45;
    positions[i * 3 + 1] = Math.cos(phi) * radius * 0.9 + 1.05;
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius * 0.72 + 0.35;
  }
  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(pointsGeo, new THREE.PointsMaterial({
    color: colors.c,
    size: 0.05,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  const nearCount = 480;
  const nearPos = new Float32Array(nearCount * 3);
  for (let i = 0; i < nearCount; i += 1) {
    nearPos[i * 3] = (Math.random() - 0.5) * 4.8;
    nearPos[i * 3 + 1] = (Math.random() - 0.4) * 5.2 + 0.8;
    nearPos[i * 3 + 2] = 2.8 + Math.random() * 2.4;
  }
  const nearGeo = new THREE.BufferGeometry();
  nearGeo.setAttribute("position", new THREE.BufferAttribute(nearPos, 3));
  const nearPoints = new THREE.Points(nearGeo, new THREE.PointsMaterial({
    color: colors.a,
    size: 0.11,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  const ribbonCount = 360;
  const ribbonPos = new Float32Array(ribbonCount * 3);
  for (let i = 0; i < ribbonCount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    ribbonPos[i * 3] = Math.cos(angle) * (1.15 + Math.random() * 0.95);
    ribbonPos[i * 3 + 1] = 0.15 + Math.random() * 2.5;
    ribbonPos[i * 3 + 2] = 2.9 + Math.sin(angle) * 0.35 + Math.random() * 0.35;
  }
  const ribbonGeo = new THREE.BufferGeometry();
  ribbonGeo.setAttribute("position", new THREE.BufferAttribute(ribbonPos, 3));
  const ribbon = new THREE.Points(ribbonGeo, new THREE.PointsMaterial({
    color: colors.b,
    size: 0.07,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  scene.add(points, nearPoints, ribbon);

  const orbit = new THREE.Group();
  const nodeMats = [];
  const shellMats = [];
  const labelMats = [];
  LABELS.forEach((name, i) => {
    const tone = [colors.a, colors.b, colors.c, colors.d, colors.a, colors.b][i];
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: tone, emissive: tone, emissiveIntensity: 0.9, roughness: 0.28, metalness: 0.12 });
    const shellMat = new THREE.MeshBasicMaterial({ color: tone, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
    nodeMats.push(bodyMat);
    shellMats.push(shellMat);
    group.add(new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 18), bodyMat));
    group.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 14), shellMat));
    const tex = new THREE.CanvasTexture(paintLabel(name, "#f7fbff"));
    const labelMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    labelMats.push(labelMat);
    const sprite = new THREE.Sprite(labelMat);
    sprite.position.y = 0.72;
    sprite.scale.set(1.8, 0.5, 1);
    group.add(sprite);
    const angle = (i / LABELS.length) * Math.PI * 2;
    group.position.set(Math.cos(angle) * 5.1, 1.55 + Math.sin(angle * 2) * 1.35, Math.sin(angle) * 3.6);
    orbit.add(group);
  });
  scene.add(orbit);

  const lineMat = new THREE.LineBasicMaterial({ color: colors.a });
  const linePositions = [];
  LABELS.forEach((_, i) => {
    const a = (i / LABELS.length) * Math.PI * 2;
    const b = ((i + 1) / LABELS.length) * Math.PI * 2;
    linePositions.push(Math.cos(a) * 5.1, 1.55, Math.sin(a) * 3.6, Math.cos(b) * 5.1, 1.55, Math.sin(b) * 3.6);
  });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linePositions), 3));
  scene.add(new THREE.LineSegments(lineGeo, lineMat));

  const span = new THREE.Mesh(
    new THREE.TorusGeometry(6.4, 0.028, 8, 96),
    new THREE.MeshBasicMaterial({ color: colors.d, transparent: true, opacity: 0.9 }),
  );
  span.position.set(0, 1.25, 0.4);
  span.rotation.x = 1.25;
  scene.add(span);
  rings.push(span);

  const trailPoint = (angle) => {
    const x = Math.cos(angle) * 1.95;
    const y = 1.05 + Math.sin(angle * 2) * 1.15;
    const z = 3.15 + Math.sin(angle) * 0.4;
    return [x, y, z];
  };
  const trails = MESSAGES.map((name, i) => {
    const tone = [colors.a, colors.b, colors.c, colors.d][i];
    const group = new THREE.Group();
    const headMat = new THREE.MeshBasicMaterial({ color: tone });
    group.add(new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), headMat));
    const tex = new THREE.CanvasTexture(paintLabel(name, "#f7fbff"));
    const labelMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    labelMats.push(labelMat);
    const sprite = new THREE.Sprite(labelMat);
    sprite.position.y = 0.55;
    sprite.scale.set(2.05, 0.62, 1);
    group.add(sprite);
    const beads = [];
    for (let k = 1; k <= 16; k += 1) {
      const mat = new THREE.MeshBasicMaterial({
        color: tone,
        transparent: true,
        opacity: Math.max(0.08, 0.9 * (1 - k / 17)),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.09 * (1 - k / 22), 8, 8), mat);
      scene.add(bead);
      beads.push(bead);
    }
    scene.add(group);
    return { group, beads, phase: (i / MESSAGES.length) * Math.PI * 2 };
  });
  const placeTrails = (time) => {
    trails.forEach((trail) => {
      const [x, y, z] = trailPoint(trail.phase + time);
      trail.group.position.set(x, y, z);
      trail.beads.forEach((bead, k) => {
        const lag = trailPoint(trail.phase + time - (k + 1) * 0.11);
        bead.position.set(lag[0], lag[1], lag[2]);
      });
    });
  };
  placeTrails(0);

  const key = new THREE.PointLight(colors.b, 16, 30);
  key.position.set(4, 5, 6);
  const fill = new THREE.PointLight(colors.c, 12, 30);
  fill.position.set(-5, 2, 4);
  scene.add(new THREE.AmbientLight(0xffffff, 0.45), key, fill);

  const kit = bloomKit(THREE);
  let rtScene = makeTarget(THREE, 8, 8);
  let rtA = makeTarget(THREE, 4, 4);
  let rtB = makeTarget(THREE, 4, 4);
  let bloomOn = true;

  const resizeTargets = (w, h) => {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
    const dw = Math.max(2, Math.floor(w * ratio));
    const dh = Math.max(2, Math.floor(h * ratio));
    rtScene.setSize(dw, dh);
    rtA.setSize(Math.max(2, Math.floor(dw / 4)), Math.max(2, Math.floor(dh / 4)));
    rtB.setSize(Math.max(2, Math.floor(dw / 4)), Math.max(2, Math.floor(dh / 4)));
  };

  const renderFrame = () => {
    const box = canvas.getBoundingClientRect();
    const w = Math.max(2, box.width || window.innerWidth);
    const h = Math.max(2, box.height || window.innerHeight);
    if (camera.aspect !== w / h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      resizeTargets(w, h);
    }
    renderer.autoClear = true;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    if (!bloomOn) return;
    renderer.setRenderTarget(rtScene);
    renderer.render(scene, camera);
    kit.mesh.material = kit.extract;
    kit.extract.uniforms.tDiffuse.value = rtScene.texture;
    renderer.setRenderTarget(rtA);
    renderer.render(kit.scene, kit.camera);
    kit.mesh.material = kit.blur;
    kit.blur.uniforms.tDiffuse.value = rtA.texture;
    kit.blur.uniforms.direction.value.set(1 / Math.max(1, rtA.width), 0);
    renderer.setRenderTarget(rtB);
    renderer.render(kit.scene, kit.camera);
    kit.blur.uniforms.tDiffuse.value = rtB.texture;
    kit.blur.uniforms.direction.value.set(0, 1 / Math.max(1, rtB.height));
    renderer.setRenderTarget(rtA);
    renderer.render(kit.scene, kit.camera);
    kit.mesh.material = kit.composite;
    kit.composite.uniforms.tBloom.value = rtA.texture;
    renderer.autoClear = false;
    renderer.setRenderTarget(null);
    renderer.render(kit.scene, kit.camera);
    renderer.autoClear = true;
    bleed.dataset.bloom = "1";
  };

  const applyPalette = () => {
    const next = palette();
    scene.background.set(next.bg);
    scene.fog = null;
    renderer.setClearColor(next.bg, 1);
    wire.material.color.set(next.a);
    core.material.color.set(next.c);
    halo.material.color.set(next.b);
    rings[0].material.color.set(next.b);
    rings[1].material.color.set(next.c);
    rings[2].material.color.set(next.d);
    points.material.color.set(next.c);
    nearPoints.material.color.set(next.a);
    ribbon.material.color.set(next.b);
    lineMat.color.set(next.a);
    span.material.color.set(next.d);
    const trailTones = [next.a, next.b, next.c, next.d];
    trails.forEach((trail, i) => {
      trail.group.children[0].material.color.set(trailTones[i]);
      trail.beads.forEach((bead) => bead.material.color.set(trailTones[i]));
    });
    key.color.set(next.b);
    fill.color.set(next.c);
    const tones = [next.a, next.b, next.c, next.d, next.a, next.b];
    nodeMats.forEach((mat, i) => { mat.color.set(tones[i]); mat.emissive.set(tones[i]); });
    shellMats.forEach((mat, i) => mat.color.set(tones[i]));
    const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMats.forEach((mat, i) => mat.color && mat.color.set(i === 0 ? next.a : next.b));
  };

  let raf = 0;
  let stop = false;
  let t = 0;
  const pointer = { x: 0, y: 0 };
  let scrollY = window.scrollY || 0;
  const homePose = () => ({ x: pointer.x * 0.55, y: -0.55 + pointer.y * -0.2, z: 6.2 });
  const onPtr = (event) => {
    pointer.x = (event.clientX / (window.innerWidth || 1) - 0.5) * 2;
    pointer.y = (event.clientY / (window.innerHeight || 1) - 0.5) * 2;
  };
  const onScroll = () => { scrollY = window.scrollY || 0; };
  window.addEventListener("pointermove", onPtr, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  const ro = new ResizeObserver(() => renderFrame());
  ro.observe(bleed);
  const unsettings = onSettings(applyPalette);
  camera.lookAt(0, 0.15, 0);
  try {
    resizeTargets(bleed.clientWidth || window.innerWidth, bleed.clientHeight || window.innerHeight);
    renderFrame();
  } catch {
    bloomOn = false;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
  }

  const current = { renderer, scene, camera, canvas, bleed, flying: false, flyStart: 0 };
  session = current;

  const hardDispose = () => {
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
    rtScene.dispose();
    rtA.dispose();
    rtB.dispose();
    kit.extract.dispose();
    kit.blur.dispose();
    kit.composite.dispose();
    renderer.dispose();
    canvas.classList.remove("is-fly");
    if (canvas.parentElement === document.body) canvas.remove();
    if (session === current) session = null;
  };

  const tick = (now) => {
    if (stop && !current.flying) return;
    raf = requestAnimationFrame(tick);
    if (document.hidden) return;
    t += 0.006;
    globe.rotation.y = t * 0.35;
    rings.forEach((ring, i) => { ring.rotation.z = t * (0.25 + i * 0.08); });
    orbit.rotation.y = t * 0.28;
    points.rotation.y = t * 0.04;
    nearPoints.rotation.z = t * 0.03;
    placeTrails(t * 0.85);
    if (current.flying) {
      const u = Math.min(1, (now - current.flyStart) / 720);
      const dive = Math.sin(u * Math.PI);
      camera.position.set(dive * 2.2, -0.2 + u * 0.8, 6.2 - u * 5.4);
      camera.lookAt(0, 1.7, 0);
      try { renderFrame(); } catch { bloomOn = false; }
      if (u >= 1) hardDispose();
      return;
    }
    const pose = homePose();
    pose.y -= Math.min(scrollY, 500) * 0.0015;
    camera.position.x += (pose.x - camera.position.x) * 0.08;
    camera.position.y += (pose.y - camera.position.y) * 0.08;
    camera.position.z += (pose.z - camera.position.z) * 0.08;
    camera.lookAt(0, 0.15, 0);
    try { renderFrame(); } catch { bloomOn = false; }
  };
  tick(performance.now());

  return () => {
    window.removeEventListener("pointermove", onPtr);
    window.removeEventListener("scroll", onScroll);
    ro.disconnect();
    unsettings();
    if (flyArmed && session === current && !current.flying) {
      flyArmed = false;
      current.flying = true;
      current.flyStart = performance.now();
      canvas.classList.add("is-fly");
      document.body.appendChild(canvas);
      return;
    }
    hardDispose();
  };
}
