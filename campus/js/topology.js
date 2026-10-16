import { esc } from "./draw.js";
import { prefersReduced } from "./audio.js";

const NODES = [
  { id: "pstn", label: "PSTN", x: -6.2, y: 0.2, z: 0.4 },
  { id: "carrier", label: "Carrier SBC", x: -3.6, y: 0.6, z: 1.1 },
  { id: "cube", label: "Enterprise SBC", x: 0, y: 0.9, z: 0 },
  { id: "cucm", label: "CUCM", x: 3.1, y: 0.4, z: 0.8 },
  { id: "unity", label: "Unity", x: 4.8, y: -0.4, z: -0.4 },
  { id: "phone", label: "IP phone", x: 3.3, y: -1.1, z: 1.8 },
  { id: "teams", label: "Teams", x: -0.2, y: 2.4, z: -2.3 },
  { id: "webex", label: "Webex Calling", x: 1.8, y: 2.2, z: -2.5 },
  { id: "connect", label: "Amazon Connect", x: -2.4, y: 2.5, z: -1.1 },
  { id: "five9", label: "Five9", x: 3.5, y: 1.9, z: -1.5 },
  { id: "genesys", label: "Genesys", x: 4.8, y: 1.2, z: -2.3 },
  { id: "cxone", label: "CXone", x: -4.6, y: 1.8, z: -1.6 },
  { id: "twilio", label: "Twilio", x: -5.5, y: 0.3, z: -1.4 },
];

const LINKS = [
  ["pstn", "carrier", "pstn"],
  ["carrier", "cube", "wan"],
  ["cube", "cucm", "core"],
  ["cucm", "unity", "uc"],
  ["cucm", "phone", "uc"],
  ["cube", "teams", "tls"],
  ["cube", "webex", "tls"],
  ["cube", "connect", "siprec"],
  ["cube", "five9", "byoc"],
  ["cube", "genesys", "byoc"],
  ["carrier", "cxone", "cloud"],
  ["carrier", "twilio", "cloud"],
];

const FAILURES = [
  { id: "none", label: "Healthy", detail: "Signaling and media paths are up. This is the reference picture, not a live network." },
  { id: "wan", label: "WAN down", detail: "The carrier-to-enterprise path fails. Calls that hairpin through the enterprise SBC to the PSTN stop. Cloud trunks that do not use that path stay up." },
  { id: "tls", label: "TLS failure", detail: "Teams and Webex trunks need SIP over TLS. A certificate or TLS version mismatch takes those signaling paths down while UDP carrier trunks may still answer." },
  { id: "oneway", label: "One-way audio", detail: "Signaling can succeed while RTP flows only one way. Look at c= and m= ports, NAT, and whether media is anchored." },
  { id: "alg", label: "SIP ALG", detail: "An ALG rewriting addresses inside SIP or SDP corrupts the path toward CUCM. TLS trunks usually cannot be rewritten and fail differently." },
  { id: "options", label: "OPTIONS timeout", detail: "Teams Direct Routing marks an SBC inactive when OPTIONS over TLS does not complete with 200 OK." },
  { id: "codec", label: "Codec mismatch", detail: "The Webex path returns 488 when the offer and answer share no codec. Signaling reached the far side; media never starts." },
  { id: "fraud", label: "Toll-fraud burst", detail: "A sudden international call spike on the PSTN side. Treat it as a security event: unknown source addresses and open dial patterns." },
];

function nodeById(id) {
  return NODES.find((n) => n.id === id);
}

function linkState(kind, failure) {
  if (failure === "wan" && (kind === "wan" || kind === "pstn")) return "down";
  if (failure === "tls" && kind === "tls") return "down";
  if (failure === "options" && kind === "tls") return "warn";
  if (failure === "codec" && kind === "tls") return "warn";
  if (failure === "alg" && kind === "core") return "warn";
  if (failure === "oneway" && (kind === "core" || kind === "wan" || kind === "uc")) return "media";
  if (failure === "fraud" && kind === "pstn") return "warn";
  return "up";
}

function fallbackSVG(failure) {
  const w = 980;
  const h = 460;
  const pos = {
    pstn: [80, 230], carrier: [230, 180], cube: [430, 210], cucm: [640, 180],
    unity: [820, 120], phone: [800, 250], teams: [360, 70], webex: [520, 60],
    connect: [250, 70], five9: [700, 70], genesys: [860, 190], cxone: [120, 80], twilio: [80, 360],
  };
  const lines = LINKS.map(([a, b, kind]) => {
    const [x1, y1] = pos[a];
    const [x2, y2] = pos[b];
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="topo-link is-${linkState(kind, failure)}"></line>`;
  }).join("");
  const dots = NODES.map((n) => {
    const [x, y] = pos[n.id];
    return `<g><circle cx="${x}" cy="${y}" r="16" class="topo-dot"></circle><text x="${x}" y="${y + 34}" text-anchor="middle" class="topo-label">${esc(n.label)}</text></g>`;
  }).join("");
  return `<svg class="topo-flat" viewBox="0 0 ${w} ${h}" role="img" aria-label="Flat SBC topology">
    <rect width="${w}" height="${h}" class="ladder-bg"></rect>${lines}${dots}</svg>`;
}

function makeLabel(THREE, text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const g = canvas.getContext("2d");
  g.fillStyle = "rgba(7,11,20,0.8)";
  g.fillRect(0, 0, 256, 64);
  g.fillStyle = "#e8f0fa";
  g.font = "28px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(1.8, 0.45, 1);
  return sprite;
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

export async function mountTopology(host) {
  let failure = "none";
  let frame = 0;
  let renderer = null;
  let stop = false;
  host.innerHTML = `
    <div class="topo-layout">
      <div class="topo-stage" id="topo-stage">
        <canvas id="topo-canvas" hidden></canvas>
        <div id="topo-flat" class="scroll"></div>
        <p id="topo-mode" class="fine"></p>
      </div>
      <div>
        <fieldset><legend>Failure toggles</legend><div id="topo-fails" class="fail-list"></div></fieldset>
        <div id="topo-detail" class="tool-out" aria-live="polite"></div>
        <ul id="topo-nodes" class="node-list"></ul>
      </div>
    </div>`;
  const fails = host.querySelector("#topo-fails");
  fails.innerHTML = FAILURES.map((f) => `<label><input type="radio" name="fail" value="${esc(f.id)}" ${f.id === "none" ? "checked" : ""}> ${esc(f.label)}</label>`).join("");
  const nodeList = host.querySelector("#topo-nodes");
  nodeList.innerHTML = NODES.map((n) => `<li><button type="button" data-node="${esc(n.id)}">${esc(n.label)}</button></li>`).join("");

  const meshes = new Map();
  const lines = [];
  let scene = null;
  let camera = null;
  let THREE = null;
  const sph = { r: 13.5, theta: 0.5, phi: 1.05 };
  const reduced = prefersReduced();

  function placeCamera() {
    if (!camera) return;
    camera.position.set(
      sph.r * Math.sin(sph.phi) * Math.sin(sph.theta),
      sph.r * Math.cos(sph.phi),
      sph.r * Math.sin(sph.phi) * Math.cos(sph.theta),
    );
    camera.lookAt(0, 0.4, 0);
  }

  function colorFor(state) {
    if (state === "down") return 0xff4d6a;
    if (state === "warn") return 0xffb020;
    if (state === "media") return 0xff4d8d;
    return 0x3ddcff;
  }

  function applyFailure() {
    const meta = FAILURES.find((f) => f.id === failure);
    host.querySelector("#topo-detail").innerHTML = `<h3>${esc(meta.label)}</h3><p>${esc(meta.detail)}</p>`;
    host.querySelector("#topo-flat").innerHTML = fallbackSVG(failure);
    lines.forEach((entry) => {
      const state = linkState(entry.kind, failure);
      entry.line.material.color.setHex(colorFor(state));
      entry.line.material.opacity = state === "down" ? 0.25 : 1;
    });
  }

  fails.addEventListener("change", (event) => {
    if (event.target.name === "fail") {
      failure = event.target.value;
      applyFailure();
    }
  });
  nodeList.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-node]");
    if (!btn) return;
    const node = nodeById(btn.dataset.node);
    host.querySelector("#topo-detail").innerHTML = `<h3>${esc(node.label)}</h3><p>Select a failure to see how this node’s paths change. Labels are a teaching map, not a discovery scan.</p>`;
  });

  applyFailure();

  if (reduced) {
    host.querySelector("#topo-mode").textContent = "Reduced motion is on, so the flat map is the view. Turn motion back on in Settings to orbit the 3D model.";
    return () => {};
  }

  try {
    THREE = await loadThree();
    if (stop) return () => {};
    const canvas = host.querySelector("#topo-canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) throw new Error("no webgl");
    canvas.hidden = false;
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x070b14, 16, 32);
    camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    const mobile = window.matchMedia("(max-width: 800px)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
    scene.add(new THREE.AmbientLight(0x88aadd, 0.55));
    const key = new THREE.PointLight(0x3ddcff, 18, 30);
    key.position.set(4, 6, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0xff4d8d, 10, 24);
    rim.position.set(-4, 2, -3);
    scene.add(rim);
    NODES.forEach((n) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 24, 18),
        new THREE.MeshStandardMaterial({ color: 0x123044, emissive: 0x3ddcff, emissiveIntensity: 0.7, roughness: 0.35 }),
      );
      mesh.position.set(n.x, n.y, n.z);
      const label = makeLabel(THREE, n.label);
      label.position.set(n.x, n.y + 0.55, n.z);
      scene.add(mesh);
      scene.add(label);
      meshes.set(n.id, mesh);
    });
    LINKS.forEach(([a, b, kind]) => {
      const na = nodeById(a);
      const nb = nodeById(b);
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(na.x, na.y, na.z),
        new THREE.Vector3(nb.x, nb.y, nb.z),
      ]);
      const mat = new THREE.LineBasicMaterial({ color: 0x3ddcff });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      lines.push({ kind, line });
    });
    const stage = host.querySelector("#topo-stage");
    const resize = () => {
      const w = stage.clientWidth || 640;
      const h = 420;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    placeCamera();
    applyFailure();
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    canvas.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointerup", () => { dragging = false; });
    canvas.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      sph.theta -= (e.clientX - lastX) * 0.008;
      sph.phi = Math.min(2.4, Math.max(0.35, sph.phi - (e.clientY - lastY) * 0.008));
      lastX = e.clientX;
      lastY = e.clientY;
      placeCamera();
    });
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      sph.r = Math.min(22, Math.max(7, sph.r + Math.sign(e.deltaY) * 0.6));
      placeCamera();
    }, { passive: false });
    const loop = () => {
      if (stop) return;
      frame = requestAnimationFrame(loop);
      if (document.hidden) return;
      const box = canvas.getBoundingClientRect();
      if (box.bottom <= 0 || box.top >= window.innerHeight) return;
      if (!dragging) sph.theta += 0.0015;
      placeCamera();
      renderer.render(scene, camera);
    };
    loop();
    window.addEventListener("resize", resize);
    host.querySelector("#topo-mode").textContent = "Drag to orbit. Scroll to dolly. The flat map under the model stays available.";
    return () => {
      stop = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    };
  } catch {
    host.querySelector("#topo-mode").textContent = "WebGL is unavailable. The flat map is the working view.";
    return () => { stop = true; };
  }
}
