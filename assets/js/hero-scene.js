/* Full-bleed home scene. Vendored three.js r170 (MIT). One WebGL context.
   Falls back to the CSS stage when WebGL is missing or motion is reduced. */
import * as THREE from "../../vendor/three.module.min.js";

var PALETTES = {
  aurora: { fog: 0x070b16, a: 0x22d3ee, b: 0x818cf8, c: 0xf472b6, d: 0xfbbf24 },
  neon: { fog: 0x07060f, a: 0xe879f9, b: 0xbef264, c: 0x22d3ee, d: 0xfef08a },
  holographic: { fog: 0x04121c, a: 0x5eead4, b: 0x67e8f9, c: 0xc4b5fd, d: 0xf0abfc },
  cyberpunk: { fog: 0x140014, a: 0xff2bd6, b: 0xfacc15, c: 0x22d3ee, d: 0xa855f7 },
  sunset: { fog: 0x1c0a12, a: 0xfb7185, b: 0xf59e0b, c: 0xfde68a, d: 0xc084fc },
  paper: { fog: 0xe8eefc, a: 0x0891b2, b: 0x4f46e5, c: 0xdb2777, d: 0xd97706 },
  futuristic: { fog: 0x07111f, a: 0x38bdf8, b: 0xc4b5fd, c: 0x22d3ee, d: 0xe0f2fe },
  gaming: { fog: 0x07140c, a: 0x4ade80, b: 0xfacc15, c: 0x22c55e, d: 0xfef08a },
  contrast: { fog: 0x000000, a: 0xffe600, b: 0xffffff, c: 0x00e5ff, d: 0xffe600 }
};

PALETTES.bloom = { fog: 0xfde7f6, a: 0x7c3aed, b: 0xec4899, c: 0x22d3ee, d: 0xfacc15 };

function palette() {
  var name = document.documentElement.dataset.theme || "bloom";
  return PALETTES[name] || PALETTES.aurora;
}

function boot() {
  try { bootScene(); } catch (err) {
    document.documentElement.dataset.hero = "flat";
    var canvas = document.querySelector("[data-world-canvas]");
    if (canvas) canvas.hidden = true;
  }
}

function pixelRatio() {
  var mobile = window.matchMedia("(max-width: 720px), (pointer: coarse)").matches;
  return Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
}

function motionReduced() {
  try {
    var stored = localStorage.getItem("canon-motion");
    if (stored === "reduce") return true;
    if (stored === "full") return false;
  } catch (err) { /* storage off */ }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function bootScene() {
  var canvas = document.querySelector("[data-world-canvas]");
  var hero = canvas && canvas.closest("[data-world]");
  if (!canvas || !hero) return;
  var reduce = motionReduced();
  var phone = window.matchMedia("(max-width: 720px), (pointer: coarse)").matches;
  if (reduce || phone) {
    document.documentElement.dataset.hero = "flat";
    canvas.hidden = true;
    return;
  }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true
    });
  } catch (err) {
    document.documentElement.dataset.hero = "flat";
    canvas.hidden = true;
    return;
  }
  if (!renderer.getContext()) {
    document.documentElement.dataset.hero = "flat";
    canvas.hidden = true;
    return;
  }

  renderer.setPixelRatio(pixelRatio());
  renderer.setClearColor(0x000000, 0);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
  camera.position.set(0, 2.4, 11);

  var colors = palette();
  scene.fog = new THREE.Fog(colors.fog, 12, 28);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  var key = new THREE.PointLight(colors.a, 18, 40);
  key.position.set(4, 6, 6);
  scene.add(key);
  var fill = new THREE.PointLight(colors.c, 12, 36);
  fill.position.set(-6, -2, 4);
  scene.add(fill);

  var world = new THREE.Group();
  scene.add(world);

  var grid = new THREE.GridHelper(28, 28, colors.a, colors.b);
  grid.position.y = -2.4;
  grid.material.transparent = true;
  grid.material.opacity = 0.45;
  world.add(grid);

  var ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.3, 0.045, 12, 80),
    new THREE.MeshBasicMaterial({ color: colors.a, transparent: true, opacity: 0.9 })
  );
  ring.rotation.x = Math.PI / 2.4;
  world.add(ring);

  var glow = new THREE.Mesh(
    new THREE.SphereGeometry(3.6, 24, 18),
    new THREE.MeshBasicMaterial({
      color: colors.b,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  world.add(glow);

  var nodes = [];
  var count = 10;
  for (var i = 0; i < count; i++) {
    var geo = i % 3 === 0
      ? new THREE.IcosahedronGeometry(0.28, 0)
      : new THREE.OctahedronGeometry(0.26, 0);
    var mat = new THREE.MeshStandardMaterial({
      color: i % 2 ? colors.c : colors.d,
      emissive: i % 2 ? colors.a : colors.b,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.45
    });
    var mesh = new THREE.Mesh(geo, mat);
    var angle = (i / count) * Math.PI * 2;
    mesh.position.set(Math.cos(angle) * 3.3, Math.sin(angle * 2) * 0.55, Math.sin(angle) * 3.3);
    mesh.userData.angle = angle;
    world.add(mesh);
    nodes.push(mesh);
  }

  var core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.72, 1),
    new THREE.MeshStandardMaterial({
      color: colors.a,
      emissive: colors.b,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.6
    })
  );
  world.add(core);

  var sparks = 420;
  var positions = new Float32Array(sparks * 3);
  for (var s = 0; s < sparks; s++) {
    var r = 4 + Math.random() * 7;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    positions[s * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[s * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[s * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  var sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  var sparkMat = new THREE.PointsMaterial({
    color: colors.d,
    size: 0.045,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  var points = new THREE.Points(sparkGeo, sparkMat);
  world.add(points);

  var pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", function (event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function resize() {
    var width = hero.clientWidth || window.innerWidth;
    var height = hero.clientHeight || window.innerHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(width, height, false);
  }
  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(hero);
  else window.addEventListener("resize", resize);

  function paint(theme) {
    var next = PALETTES[theme] || palette();
    scene.fog.color.setHex(next.fog);
    key.color.setHex(next.a);
    fill.color.setHex(next.c);
    ring.material.color.setHex(next.a);
    glow.material.color.setHex(next.b);
    core.material.color.setHex(next.a);
    core.material.emissive.setHex(next.b);
    sparkMat.color.setHex(next.d);
    var gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMats.forEach(function (mat) {
      if (mat && mat.color) mat.color.setHex(next.a);
    });
    nodes.forEach(function (mesh, index) {
      mesh.material.color.setHex(index % 2 ? next.c : next.d);
      mesh.material.emissive.setHex(index % 2 ? next.a : next.b);
    });
  }
  document.addEventListener("canon-theme", function (event) {
    paint(event.detail && event.detail.theme);
  });

  var onScreen = true;
  var loopOn = false;
  var clock = new THREE.Clock();
  var scrollLift = 0;
  window.addEventListener("scroll", function () {
    scrollLift = Math.min(window.scrollY || 0, 480) / 480;
  }, { passive: true });
  function frame() {
    if (!loopOn) return;
    var t = clock.getElapsedTime();
    world.rotation.y = t * 0.18 + pointer.x * 0.35;
    world.rotation.x = pointer.y * -0.12;
    core.rotation.y = t * 0.6;
    core.rotation.x = t * 0.25;
    ring.rotation.z = t * 0.2;
    nodes.forEach(function (mesh, index) {
      var a = mesh.userData.angle + t * 0.35;
      mesh.position.x = Math.cos(a) * 3.3;
      mesh.position.z = Math.sin(a) * 3.3;
      mesh.position.y = Math.sin(t * 1.4 + index) * 0.55;
      mesh.rotation.y += 0.02;
    });
    points.rotation.y = t * 0.05;
    camera.position.x += (pointer.x * 1.4 - camera.position.x) * 0.04;
    camera.position.y += (2.2 + pointer.y * -0.6 + scrollLift * 1.1 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  function allowed() {
    return onScreen && !document.hidden && !motionReduced();
  }
  function start() {
    if (loopOn || !allowed()) return;
    loopOn = true;
    requestAnimationFrame(frame);
  }
  function stop() { loopOn = false; }
  function sync() {
    if (allowed()) start();
    else stop();
  }

  if ("IntersectionObserver" in window) {
    var seen = new IntersectionObserver(function (entries) {
      onScreen = entries.some(function (entry) { return entry.isIntersecting; });
      sync();
    }, { threshold: 0.02 });
    seen.observe(hero);
  }
  document.addEventListener("visibilitychange", sync);
  document.addEventListener("canon-motion", sync);
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motionQuery.addEventListener) motionQuery.addEventListener("change", sync);
  else if (motionQuery.addListener) motionQuery.addListener(sync);
  document.documentElement.dataset.hero = "webgl";
  canvas.hidden = false;
  start();
}

boot();
