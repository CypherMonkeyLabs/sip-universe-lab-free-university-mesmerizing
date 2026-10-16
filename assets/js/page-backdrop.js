/* Lightweight WebGL backdrop for inner Canon pages. One context, disposed when the tab hides. */
import * as THREE from "../../vendor/three.module.min.js";

var THEMES = {
  bloom: [0x7c3aed, 0xec4899, 0x22d3ee, 0xfacc15],
  aurora: [0x22d3ee, 0x818cf8, 0xf472b6, 0xfbbf24],
  neon: [0xe879f9, 0xbef264, 0x22d3ee, 0xfef08a],
  holographic: [0x5eead4, 0x67e8f9, 0xc4b5fd, 0xf0abfc],
  cyberpunk: [0xff2bd6, 0xfacc15, 0x22d3ee, 0xa855f7],
  sunset: [0xfb7185, 0xf59e0b, 0xfde68a, 0xc084fc],
  paper: [0x0891b2, 0x4f46e5, 0xdb2777, 0xd97706],
  contrast: [0xffe600, 0x00e5ff, 0xffffff, 0xffe600],
  futuristic: [0x38bdf8, 0xc4b5fd, 0x22d3ee, 0xe0f2fe],
  gaming: [0x4ade80, 0xfacc15, 0x22c55e, 0xfef08a]
};

var KICKERS = {
  diagrams: "Diagrams · node orbit",
  flows: "Flows · packet stream",
  charts: "Charts · rising bars",
  careers: "Careers · stepping path",
  play: "Play · tumbling gems",
  rooms: "Rooms · study chamber"
};

function pageKind() {
  var path = location.pathname;
  var file = path.split("/").pop() || "";
  if (file === "diagrams.html") return "diagrams";
  if (file === "flows.html") return "flows";
  if (file === "charts.html") return "charts";
  if (file === "careers.html") return "careers";
  if (file === "play.html") return "play";
  if (document.body.getAttribute("data-room") || path.indexOf("/rooms/") !== -1) return "rooms";
  return "";
}

function colors() {
  var name = document.documentElement.dataset.theme || "bloom";
  return THEMES[name] || THEMES.aurora;
}

function material(hex, wire) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    emissive: hex,
    emissiveIntensity: wire ? 0.2 : 0.45,
    metalness: 0.25,
    roughness: 0.35,
    wireframe: !!wire
  });
}

function wash(scene, palette, rig) {
  for (var i = 0; i < 14; i += 1) {
    var orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.22 + (i % 3) * 0.12, 12, 12),
      material(palette[i % 4], false)
    );
    orb.position.set((i - 6.5) * 0.62, ((i % 4) - 1.5) * 0.42, -1.6 - (i % 3) * 0.35);
    orb.userData.bob = i;
    scene.add(orb);
    rig.wash.push(orb);
  }
}

function build(kind, scene, palette) {
  var rig = { kind: kind, meshes: [], bars: [], gems: [], steps: [], packet: null, wash: [] };
  wash(scene, palette, rig);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  var key = new THREE.PointLight(palette[0], 16, 30);
  key.position.set(3, 4, 5);
  scene.add(key);
  var rim = new THREE.PointLight(palette[2], 10, 24);
  rim.position.set(-4, 1, -2);
  scene.add(rim);

  if (kind === "diagrams") {
    var torus = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.08, 12, 48), material(palette[0], true));
    var ico = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), material(palette[1], true));
    torus.rotation.x = 0.8;
    scene.add(torus);
    scene.add(ico);
    rig.meshes.push(torus, ico);
    for (var i = 0; i < 8; i += 1) {
      var node = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), material(palette[i % 4], false));
      node.userData.angle = i / 8 * Math.PI * 2;
      scene.add(node);
      rig.meshes.push(node);
    }
  } else if (kind === "flows") {
    var curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.2, -0.4, 0),
      new THREE.Vector3(-1.2, 1.1, 0.4),
      new THREE.Vector3(1.1, -0.8, -0.3),
      new THREE.Vector3(3.2, 0.6, 0.2)
    ]);
    var tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.04, 6, false), material(palette[3], false));
    scene.add(tube);
    rig.curve = curve;
    for (var p = 0; p < 6; p += 1) {
      var packet = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), material(palette[p % 3], false));
      packet.userData.offset = p / 6;
      scene.add(packet);
      rig.meshes.push(packet);
    }
  } else if (kind === "charts") {
    for (var b = 0; b < 8; b += 1) {
      var height = 0.7 + (b % 5) * 0.38;
      var bar = new THREE.Mesh(new THREE.BoxGeometry(0.38, height, 0.38), material(palette[b % 4], false));
      bar.position.set((b - 3.5) * 0.58, height / 2 - 1.4, 0);
      bar.userData.base = height;
      scene.add(bar);
      rig.bars.push(bar);
    }
  } else if (kind === "careers") {
    for (var s = 0; s < 7; s += 1) {
      var step = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.7), material(palette[s % 4], false));
      step.position.set((s % 2 === 0 ? -0.35 : 0.35), -1.3 + s * 0.28, -s * 0.55);
      scene.add(step);
      rig.steps.push(step);
    }
    rig.packet = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), material(palette[3], false));
    scene.add(rig.packet);
  } else if (kind === "play") {
    var geos = [
      new THREE.TetrahedronGeometry(0.55, 0),
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.IcosahedronGeometry(0.48, 0),
      new THREE.TorusGeometry(0.42, 0.14, 10, 24),
      new THREE.DodecahedronGeometry(0.46, 0)
    ];
    geos.forEach(function (geo, index) {
      var gem = new THREE.Mesh(geo, material(palette[index % 4], false));
      gem.position.set((index - 2) * 1.15, (index % 2 === 0 ? 0.4 : -0.35), index * 0.15);
      gem.userData.phase = index * 0.7;
      scene.add(gem);
      rig.gems.push(gem);
    });
  } else if (kind === "rooms") {
    var shell = material(palette[0], false);
    shell.side = THREE.DoubleSide;
    var back = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 3.2), shell);
    back.position.set(0, 0.2, -2.2);
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 4.2), material(palette[1], false));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.35;
    var left = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.2), material(palette[2], false));
    left.position.set(-3.1, 0.2, -0.2);
    left.rotation.y = Math.PI / 2;
    var right = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.2), material(palette[2], false));
    right.position.set(3.1, 0.2, -0.2);
    right.rotation.y = -Math.PI / 2;
    var book = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 1.25), material(palette[3], false));
    book.position.set(0.2, -0.9, 0.2);
    scene.add(back, floor, left, right, book);
    rig.packet = book;
  } else {
    var unknown = kind;
    return unknown;
  }
  return rig;
}

function frame(rig, time) {
  var t = time * 0.001;
  rig.wash.forEach(function (orb) {
    orb.position.y += Math.sin(t * 1.2 + orb.userData.bob) * 0.004;
  });
  if (rig.kind === "diagrams") {
    rig.meshes.forEach(function (mesh, index) {
      if (index < 2) {
        mesh.rotation.y = t * (index === 0 ? 0.25 : -0.4);
        mesh.rotation.z = t * 0.1;
        return;
      }
      var angle = mesh.userData.angle + t * 0.6;
      mesh.position.set(Math.cos(angle) * 2.3, Math.sin(angle * 2) * 0.45, Math.sin(angle) * 2.3);
    });
  } else if (rig.kind === "flows" && rig.curve) {
    rig.meshes.forEach(function (mesh) {
      var at = (mesh.userData.offset + t * 0.18) % 1;
      mesh.position.copy(rig.curve.getPointAt(at));
    });
  } else if (rig.kind === "charts") {
    rig.bars.forEach(function (bar, index) {
      var pulse = 1 + Math.sin(t * 1.6 + index) * 0.08;
      bar.scale.y = pulse;
      bar.position.y = (bar.userData.base * pulse) / 2 - 1.4;
    });
  } else if (rig.kind === "careers" && rig.packet) {
    var step = Math.floor(t % rig.steps.length);
    var target = rig.steps[step];
    rig.packet.position.set(target.position.x, target.position.y + 0.45, target.position.z);
    rig.packet.rotation.y = t;
  } else if (rig.kind === "play") {
    rig.gems.forEach(function (gem) {
      gem.rotation.x = t + gem.userData.phase;
      gem.rotation.y = t * 1.3;
      gem.position.y = Math.sin(t * 1.8 + gem.userData.phase) * 0.45;
    });
  } else if (rig.kind === "rooms" && rig.packet) {
    rig.packet.position.y = -0.9 + Math.sin(t * 1.4) * 0.18;
    rig.packet.rotation.y = t * 0.4;
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

function boot() {
  var kind = pageKind();
  if (!kind) return;
  if (motionReduced()) return;
  var banner = document.querySelector(".stage-banner");
  if (!banner) return;
  var canvas = document.createElement("canvas");
  canvas.className = "page-gl";
  canvas.width = 1280;
  canvas.height = 240;
  canvas.setAttribute("data-page-gl", kind);
  canvas.setAttribute("aria-hidden", "true");
  banner.prepend(canvas);
  document.body.classList.add("has-page-gl");
  document.body.dataset.pageGl = kind;
  var kicker = document.querySelector(".stage-kicker");
  if (kicker && KICKERS[kind]) kicker.textContent = KICKERS[kind];

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: "low-power" });
  } catch (err) {
    canvas.remove();
    document.body.classList.remove("has-page-gl");
    return;
  }
  if (!renderer.getContext()) {
    canvas.remove();
    document.body.classList.remove("has-page-gl");
    return;
  }
  renderer.setPixelRatio(pixelRatio());
  var sky = {
    diagrams: 0x0b1c3a,
    flows: 0x07281f,
    charts: 0x1a1030,
    careers: 0x2a1608,
    play: 0x1a0824,
    rooms: 0x1a1028
  };
  var clear = sky[kind] || 0x0b1c3a;
  renderer.setClearColor(clear, 1);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  if (kind === "rooms") camera.position.set(0.2, 0.55, 3.6);
  else if (kind === "careers") camera.position.set(0, 0.35, 4.2);
  else if (kind === "charts") camera.position.set(0.1, 0.25, 4.4);
  else camera.position.set(0, 0.15, 4.4);
  camera.lookAt(0, 0.1, 0);
  scene.fog = new THREE.Fog(clear, 6, 14);

  var rig = build(kind, scene, colors());
  if (!rig || !rig.kind) {
    renderer.dispose();
    canvas.remove();
    document.body.classList.remove("has-page-gl");
    delete document.body.dataset.pageGl;
    return;
  }

  function resize() {
    var w = Math.max(banner.clientWidth, 1);
    var h = Math.max(banner.clientHeight, 1);
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(banner);

  var onScreen = true;
  var handle = 0;
  function running() {
    return onScreen && !document.hidden && !motionReduced();
  }
  function loop(now) {
    if (!running()) return;
    frame(rig, now || 0);
    renderer.render(scene, camera);
    handle = window.requestAnimationFrame(loop);
  }
  function kick() {
    window.cancelAnimationFrame(handle);
    if (running()) handle = window.requestAnimationFrame(loop);
  }
  kick();
  document.addEventListener("visibilitychange", kick);
  document.addEventListener("canon-motion", kick);
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motionQuery.addEventListener) motionQuery.addEventListener("change", kick);
  else if (motionQuery.addListener) motionQuery.addListener(kick);
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      onScreen = entries.some(function (entry) { return entry.isIntersecting; });
      kick();
    }, { threshold: 0.02 }).observe(banner);
  }
  document.addEventListener("canon-theme", function () {
    var next = colors();
    var flat = [];
    scene.traverse(function (obj) {
      if (obj.isMesh) flat.push(obj);
    });
    flat.forEach(function (mesh, index) {
      var hex = next[index % next.length];
      if (mesh.material && mesh.material.color) {
        mesh.material.color.setHex(hex);
        if (mesh.material.emissive) mesh.material.emissive.setHex(hex);
      }
    });
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
