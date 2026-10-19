/* In-browser call-flow simulation. No network. Not a vendor system. */
(function () {
  var root = document.querySelector("[data-sip-sim]");
  if (!root) return;
  var form = root.querySelector("form");
  if (form) form.addEventListener("submit", function (event) { event.preventDefault(); });
  var state = { phase: "idle", who: "Alice", cLine: "203.0.113.20", port: "49170", loose: true, requestUri: "sip:bob@example.com" };
  var log = [];
  var ladder = root.querySelector("[data-ladder]");
  var result = root.querySelector("[data-result]");
  var phase = root.querySelector("[data-phase]");

  function line(from, text) {
    log.push(from + ": " + text);
    var row = document.createElement("div");
    row.className = "sim-row";
    var who = document.createElement("span");
    who.textContent = from;
    var arrow = document.createElement("span");
    arrow.className = "sim-arrow";
    arrow.textContent = " " + text;
    row.append(who, arrow);
    ladder.appendChild(row);
    ladder.scrollTop = ladder.scrollHeight;
  }

  function explain() {
    var bits = ["Simulation only. Nothing left this browser."];
    bits.push("Phase: " + state.phase + ".");
    bits.push("Request-URI " + state.requestUri + ".");
    if (!state.loose) bits.push("No lr on the route, so a strict router would rewrite the Request-URI. This sim keeps the URI you typed and flags that.");
    else bits.push("lr is set, so the Request-URI stays the remote target.");
    if (String(state.port) === "0") bits.push("m-line port 0 rejects that stream. No media is negotiated for it.");
    else if (state.phase === "up" && String(state.cLine).indexOf("10.") === 0) bits.push("The 200 is fine and the media address is private. That is a one-way-audio shape, not a signaling failure.");
    else if (state.phase === "up") bits.push("Signaling is up and c= is a documentation address. RTP would be a separate flow.");
    else if (state.phase === "ringing") bits.push("180 does not mean media is flowing.");
    else if (state.phase === "trying") bits.push("100 Trying is hop-by-hop. It does not create the dialog by itself.");
    result.textContent = bits.join(" ");
    phase.textContent = state.phase;
  }

  function act(kind) {
    if (kind === "invite" && state.phase === "idle") {
      state.phase = "trying";
      line(state.who, "INVITE " + state.requestUri);
      line("Proxy", "100 Trying");
    } else if (kind === "ring" && state.phase === "trying") {
      state.phase = "ringing";
      line("Bob", "180 Ringing");
    } else if (kind === "ok" && (state.phase === "ringing" || state.phase === "trying")) {
      state.phase = "up";
      line("Bob", "200 OK c=" + state.cLine + " m=audio " + state.port);
      line("Alice", "ACK");
    } else if (kind === "bye" && state.phase === "up") {
      state.phase = "ended";
      line(state.who, "BYE");
      line("Peer", "200 OK");
    } else if (kind === "reset") {
      state.phase = "idle";
      log = [];
      ladder.replaceChildren();
    } else {
      result.textContent = "That step does not fit the phase " + state.phase + ". Simulation only.";
      return;
    }
    explain();
  }

  root.querySelectorAll("[data-node]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.who = button.getAttribute("data-node");
      root.querySelectorAll("[data-node]").forEach(function (other) {
        other.setAttribute("aria-pressed", other === button ? "true" : "false");
      });
      explain();
    });
  });
  root.querySelector("[data-uri]").addEventListener("input", function (event) {
    state.requestUri = event.target.value || "sip:bob@example.com";
    explain();
  });
  root.querySelector("[data-port]").addEventListener("input", function (event) {
    state.port = event.target.value;
    explain();
  });
  root.querySelector("[data-cline]").addEventListener("change", function (event) {
    state.cLine = event.target.value;
    explain();
  });
  root.querySelector("[data-loose]").addEventListener("change", function (event) {
    state.loose = event.target.checked;
    explain();
  });
  root.querySelectorAll("[data-act]").forEach(function (button) {
    button.addEventListener("click", function () { act(button.getAttribute("data-act")); });
  });
  explain();
})();
