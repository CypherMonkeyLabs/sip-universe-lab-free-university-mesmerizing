/* Round 3 polish. About links, Display colors, first-visit navigation hint, hero 3D objects. */
(function () {
  var root = document.documentElement;
  var B = window.CANON_BRAND || {};
  function brandArt(value, key) {
    if (!value) return "";
    return typeof value === "function" ? value(key) : value;
  }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* storage off */ } return null; }

  document.querySelectorAll(".lab-links").forEach(function (n) { n.remove(); });

  /* About: website, GitHub organization, Linktree icon. Nothing else. */
  function aboutHtml(k) {
    return '<section class="about-block" aria-label="About CypherMonkey Labs"><h3>About</h3>' +
      '<a class="about-site" href="https://cyphermonkeylabs.com" target="_blank" rel="noopener noreferrer">' + brandArt(B.monkey, "ab" + k) +
      '<span><strong>CypherMonkey Labs</strong><small>Visit the website</small></span></a>' +
      '<div class="about-row">' +
      '<a class="about-gh" href="https://github.com/CypherMonkeyLabs" target="_blank" rel="noopener noreferrer" aria-label="CypherMonkeyLabs GitHub organization" title="GitHub organization">' + brandArt(B.github, "gh") + "</a>" +
      '<a class="about-lt" href="https://linktr.ee/cyphermonkey" target="_blank" rel="noopener noreferrer" aria-label="CypherMonkey on Linktree" title="Linktree">' + brandArt(B.linktree, "lt" + k) + "</a>" +
      "</div></section>";
  }
  function mountAbout() {
    var edge = document.querySelector(".edge-menu");
    if (edge && !edge.querySelector(".about-block")) edge.insertAdjacentHTML("beforeend", aboutHtml("e"));
    var ph = document.querySelector("[data-about-mount]");
    if (ph && !ph.querySelector(".about-block")) ph.innerHTML = aboutHtml("p");
  }

  /* Display panel: font color and accent. */
  var INKS = ["#1b1340", "#ffffff", "#fde047", "#67e8f9", "#f9a8d4", "#86efac", "#fdba74"];
  function setInk(c) {
    if (c) { root.style.setProperty("--ink", c); root.dataset.ink = "1"; ls("canon-ink", c); }
    else { root.style.removeProperty("--ink"); delete root.dataset.ink; ls("canon-ink", ""); }
    syncInk();
  }
  function setAccent(c) {
    if (c) { root.style.setProperty("--accent", c); ls("canon-accent", c); }
    else { root.style.removeProperty("--accent"); ls("canon-accent", ""); }
  }
  function syncInk() {
    var cur = (root.style.getPropertyValue("--ink") || "").trim().toLowerCase();
    document.querySelectorAll(".ink-row .swatch").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.c === cur ? "true" : "false"); });
  }
  function mountDisplay() {
    var panel = document.querySelector(".display-panel");
    if (!panel || panel.querySelector(".ink-row")) return;
    var stats = panel.querySelector(".display-stats");
    var html = '<p class="a11y-label">Font color</p><div class="ink-row" role="group" aria-label="Font color">' +
      INKS.map(function (c) { return '<button type="button" class="swatch" data-c="' + c + '" style="background:' + c + '" aria-label="Font color ' + c + '" aria-pressed="false"></button>'; }).join("") +
      '<label class="sr" for="ink-custom">Custom font color</label><input id="ink-custom" type="color" value="#1b1340" aria-label="Custom font color">' +
      '<button type="button" class="ink-reset" data-ink-reset>Theme default</button></div>' +
      '<p class="a11y-label">Accent color</p><div class="ink-row"><label class="sr" for="accent-custom">Accent color</label><input id="accent-custom" type="color" value="#7c3aed" aria-label="Accent color">' +
      '<button type="button" class="ink-reset" data-accent-reset>Theme default</button></div>';
    var holder = document.createElement("div");
    holder.innerHTML = html;
    while (holder.firstChild) panel.insertBefore(holder.firstChild, stats || null);
    panel.addEventListener("click", function (e) {
      var sw = e.target.closest(".swatch");
      if (sw) setInk(sw.dataset.c);
      if (e.target.closest("[data-ink-reset]")) setInk("");
      if (e.target.closest("[data-accent-reset]")) setAccent("");
    });
    panel.querySelector("#ink-custom").addEventListener("input", function (e) { setInk(e.target.value); });
    panel.querySelector("#accent-custom").addEventListener("input", function (e) { setAccent(e.target.value); });
    syncInk();
  }

  /* The numbered first-open tour in onboard.js covers the phone hint. */
  function mountHint() { return; }

  function mountHero() {
    var host = document.querySelector(".world-hero") || document.querySelector(".hero-copy");
    if (!host || host.querySelector(".hero-3d")) return;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    var cube = '<i></i><i></i><i></i><i></i><i></i><i></i>';
    var d = document.createElement("div");
    d.className = "hero-3d";
    d.setAttribute("aria-hidden", "true");
    d.innerHTML = '<div class="obj o1">' + cube + '</div><div class="obj o2">' + cube + '</div><div class="obj o3">' + cube + "</div>";
    host.insertBefore(d, host.firstChild);
  }

  function boot() { mountAbout(); mountDisplay(); mountHint(); mountHero(); }
  boot();
  var tries = 0;
  var t = setInterval(function () { boot(); if (++tries > 20) clearInterval(t); }, 250);
})();
