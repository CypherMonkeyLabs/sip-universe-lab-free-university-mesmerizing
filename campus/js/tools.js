import { esc } from "./draw.js";
import { dissect, negotiate, applyCube, applyAcme, extractMessages } from "./parse.js";
import { playTone } from "./audio.js";

function field(label, id, value, rows = 12) {
  return `<label class="stack" for="${id}"><span>${esc(label)}</span>
    <textarea id="${id}" rows="${rows}" spellcheck="false">${esc(value || "")}</textarea></label>`;
}

export function mountDissector(host, initial = "") {
  host.innerHTML = `
    <div class="tool-grid">
      ${field("SIP message", "dis-in", initial, 16)}
      <div>
        <div class="row-actions"><button type="button" id="dis-run">Dissect</button></div>
        <div id="dis-out" class="tool-out" aria-live="polite"></div>
      </div>
    </div>`;
  const run = () => {
    playTone("click");
    const msg = dissect(host.querySelector("#dis-in").value);
    const headers = (msg.headers || []).map((h) => `<tr><th scope="row">${esc(h.name)}${h.compact ? ` <span class="muted">(${esc(h.compact)})</span>` : ""}</th><td>${esc(h.value)}</td></tr>`).join("");
    const warnings = (msg.warnings || []).map((w) => `<li class="${esc(w.level)}">${esc(w.text)}</li>`).join("");
    const kind = msg.kind === "request" ? `${esc(msg.method)} ${esc(msg.uri)}` : msg.kind === "response" ? `${esc(msg.status)} ${esc(msg.reason)}` : "Unrecognized";
    host.querySelector("#dis-out").innerHTML = `
      <p class="tool-kicker">${kind}</p>
      ${warnings ? `<ul class="warn-list">${warnings}</ul>` : `<p class="ok-line">No structural warnings.</p>`}
      <div class="scroll"><table><tbody>${headers || `<tr><td>No headers</td></tr>`}</tbody></table></div>
      ${msg.body ? `<h3>Body</h3><pre class="sip-view">${esc(msg.body)}</pre>` : ""}`;
  };
  host.querySelector("#dis-run").addEventListener("click", run);
  if (initial) run();
}

export function mountSdp(host, offer = "", answer = "") {
  host.innerHTML = `
    <div class="tool-grid">
      <div>
        ${field("Offer", "sdp-offer", offer, 12)}
        ${field("Answer", "sdp-answer", answer, 12)}
        <button type="button" id="sdp-run">Negotiate</button>
      </div>
      <div id="sdp-out" class="tool-out" aria-live="polite"></div>
    </div>
    <p class="fine">Teaching subset of RFC 3264 and RFC 6337. Payload types match on the encoding name. Static names for PT 0, 8, 9, and 18 come from RFC 3551 when rtpmap is absent.</p>`;
  const run = () => {
    playTone("click");
    const result = negotiate(host.querySelector("#sdp-offer").value, host.querySelector("#sdp-answer").value);
    const notes = result.notes.map((n) => `<li class="${esc(n.level)}">${esc(n.text)}</li>`).join("");
    const streams = result.streams.map((s) => {
      if (s.missing) return `<article class="stream"><h3>m-line ${s.index + 1}</h3><p>Missing from the ${esc(s.missing)}.</p></article>`;
      const codecs = s.codecs.map((c) => `<li>${esc(c.name)} <span class="muted">offer PT ${esc(c.offerPt)} / answer PT ${esc(c.answerPt)}</span></li>`).join("");
      return `<article class="stream">
        <h3>m-line ${s.index + 1}: ${esc(s.type)} ${s.rejected ? "rejected" : "accepted"}</h3>
        <p>Ports ${esc(s.offerPort)} → ${esc(s.answerPort)}. Profile ${esc(s.offerProto)} → ${esc(s.answerProto)}.</p>
        <p>Direction ${esc(s.direction.offer)} answered with ${esc(s.direction.answer)}${s.direction.ok ? "" : " — does not fit the offer"}.</p>
        <p>DTMF telephone-event: ${esc(s.dtmf)}.</p>
        <ul>${codecs || "<li>No shared codecs.</li>"}</ul>
        ${s.dropped.length ? `<p class="muted">Offered but not answered: ${esc(s.dropped.join(", "))}.</p>` : ""}
      </article>`;
    }).join("");
    host.querySelector("#sdp-out").innerHTML = `${notes ? `<ul class="warn-list">${notes}</ul>` : `<p class="ok-line">No warnings.</p>`}${streams}`;
  };
  host.querySelector("#sdp-run").addEventListener("click", run);
  if (offer && answer) run();
}

export function mountSandbox(host, rules = "", message = "", dialect = "cube") {
  host.innerHTML = `
    <div class="seg" role="radiogroup" aria-label="Rule dialect">
      <label><input type="radio" name="dialect" value="cube" ${dialect === "cube" ? "checked" : ""}> CUBE SIP profile subset</label>
      <label><input type="radio" name="dialect" value="acme" ${dialect === "acme" ? "checked" : ""}> Acme header-rule subset</label>
    </div>
    <div class="tool-grid">
      <div>
        ${field("Rules", "sb-rules", rules, 10)}
        ${field("Message", "sb-msg", message, 12)}
        <button type="button" id="sb-run">Apply</button>
      </div>
      <div id="sb-out" class="tool-out" aria-live="polite"></div>
    </div>
    <p class="fine">CUBE subset: <code>request INVITE sip-header From modify "regex" "replacement"</code>. Acme subset: <code>header-rule</code> blocks with header-name, action (add, delete, manipulate, store, reject), comparison-type, match-value, new-value, msg-type. Real copy lists, element rules, and release-specific actions stay in the vendor guides.</p>`;
  const run = () => {
    playTone("click");
    const which = host.querySelector('input[name="dialect"]:checked').value;
    const rulesText = host.querySelector("#sb-rules").value;
    const msg = host.querySelector("#sb-msg").value;
    const result = which === "acme" ? applyAcme(rulesText, msg) : applyCube(rulesText, msg);
    const changes = (result.changes || []).map((c) => `<li>${esc(c.detail)}</li>`).join("");
    const warnings = (result.warnings || []).map((w) => `<li class="warn">${esc(w)}</li>`).join("");
    host.querySelector("#sb-out").innerHTML = `
      ${result.rejected ? `<p class="bad-line">Reject action matched. Check the Oracle HMR guide for the status this release sends.</p>` : ""}
      <ul>${changes || "<li>No rule fired.</li>"}</ul>
      ${warnings ? `<ul class="warn-list">${warnings}</ul>` : ""}
      ${result.stores && Object.keys(result.stores).length ? `<p>Stored: ${esc(JSON.stringify(result.stores))}</p>` : ""}
      <h3>Result</h3>
      <pre class="sip-view">${esc(result.output)}</pre>`;
  };
  host.querySelector("#sb-run").addEventListener("click", run);
  if (rules && message) run();
}

export function mountCapture(host, initial = "") {
  host.innerHTML = `
    <div class="tool-grid">
      ${field("debug ccsip messages or a text capture", "cap-in", initial, 16)}
      <div>
        <button type="button" id="cap-run">Extract SIP</button>
        <div id="cap-out" class="tool-out"></div>
      </div>
    </div>`;
  host.querySelector("#cap-run").addEventListener("click", () => {
    playTone("click");
    const found = extractMessages(host.querySelector("#cap-in").value);
    if (!found.length) {
      host.querySelector("#cap-out").innerHTML = `<p>No SIP start line found.</p>`;
      return;
    }
    host.querySelector("#cap-out").innerHTML = found.map((item, i) => `
      <article class="stream">
        <h3>${esc(item.direction || "message")} ${i + 1}</h3>
        <div class="mini-dissect" data-i="${i}"></div>
      </article>`).join("");
    host.querySelectorAll(".mini-dissect").forEach((node) => {
      const item = found[Number(node.dataset.i)];
      mountDissector(node, item.text);
    });
  });
  if (initial) host.querySelector("#cap-run").click();
}
