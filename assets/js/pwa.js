/* Install hint for the offline lab. No analytics. */
(function () {
  var style = document.createElement("style");
  style.textContent = ".pwa-bar{position:fixed;left:12px;right:12px;bottom:72px;z-index:40;display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:12px 14px;background:#1e1b4b;color:#f8fafc;border:2px solid #fde047;border-radius:12px;max-width:36rem}.pwa-bar p{margin:0;flex:1 1 12rem}.pwa-bar button{min-height:44px;min-width:44px;padding:8px 12px;background:#fde047;color:#1c1917;border:0;border-radius:8px;font:inherit}.pwa-bar button:focus-visible{outline:3px solid #fff;outline-offset:2px}.pwa-bar[hidden]{display:none}@media (max-width:390px){.pwa-bar{bottom:64px}}";
  document.head.appendChild(style);
  var deferred = null;
  var bar = document.createElement("div");
  bar.className = "pwa-bar";
  bar.hidden = true;
  bar.innerHTML = '<p>Install this lab on the device. It stays offline after the first visit.</p><button type="button" data-pwa-install>Install</button><button type="button" data-pwa-dismiss>Not now</button>';
  document.body.appendChild(bar);
  var install = bar.querySelector("[data-pwa-install]");
  var dismiss = bar.querySelector("[data-pwa-dismiss]");
  try {
    if (localStorage.getItem("sip-pwa-dismiss") === "1") bar.hidden = true;
  } catch (e) { /* storage off */ }
  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferred = event;
    try {
      if (localStorage.getItem("sip-pwa-dismiss") === "1") return;
    } catch (err) { /* show it */ }
    bar.hidden = false;
  });
  install.addEventListener("click", function () {
    if (!deferred) return;
    deferred.prompt();
    deferred.userChoice.then(function () {
      bar.hidden = true;
      deferred = null;
    });
  });
  dismiss.addEventListener("click", function () {
    bar.hidden = true;
    try { localStorage.setItem("sip-pwa-dismiss", "1"); } catch (e) { /* ignore */ }
  });
})();
