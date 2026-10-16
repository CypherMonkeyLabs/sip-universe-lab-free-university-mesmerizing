/* Embed card for the SIP lab. Set data-base on the script tag to the lab root. */
(function () {
  var script = document.currentScript;
  if (!script || !script.parentNode) return;
  var base = script.getAttribute("data-base") || "";
  var card = document.createElement("aside");
  card.className = "cml-embed";
  card.setAttribute("aria-label", "SIP Universe Free University");
  card.innerHTML =
    '<p class="cml-embed-kicker">SIP Universe</p>' +
    '<p>An independent, free, learning-only student project. It is not affiliated with or endorsed by any vendor.</p>' +
    '<p><a href="' + base + 'index.html">Open the lab</a></p>' +
    '<p><a href="https://cyphermonkeylabs.com">CypherMonkey Labs</a> · ' +
    '<a href="https://github.com/CypherMonkeyLabs">GitHub organization</a> · ' +
    '<a href="https://linktr.ee/cyphermonkey">Linktree</a></p>';
  var style = document.createElement("style");
  style.textContent = ".cml-embed{margin:16px 0;padding:16px;border:2px solid #7c3aed;border-radius:16px;background:linear-gradient(135deg,#ecfeff,#fae8ff);color:#1b1340;font:16px/1.45 system-ui,sans-serif}.cml-embed a{color:#5b21b6;font-weight:700}.cml-embed-kicker{margin:0 0 6px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#6d28d9}";
  script.parentNode.insertBefore(style, script);
  script.parentNode.insertBefore(card, script);
})();
