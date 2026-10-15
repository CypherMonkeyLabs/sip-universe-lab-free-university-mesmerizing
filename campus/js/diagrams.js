import { esc } from "./draw.js";

function live() {
  return document.documentElement.dataset.motion !== "reduce";
}

function svg(label, w, h, body) {
  return `<svg class="atlas-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
    <rect width="${w}" height="${h}" rx="18" fill="var(--cc-bg)" stroke="var(--cc-line)"></rect>
    ${body}
  </svg>`;
}

function text(x, y, value, cls = "d-label", anchor = "middle") {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${esc(value)}</text>`;
}

function box(x, y, w, h, title, sub, tone = 0) {
  const stroke = ["var(--cc-accent-1)", "var(--cc-accent-4)", "var(--cc-accent-2)", "var(--cc-accent-3)"][tone % 4];
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="var(--cc-surface-2)" stroke="${stroke}" stroke-width="2"></rect>
    ${text(x + w / 2, y + (sub ? 28 : h / 2 + 5), title)}
    ${sub ? text(x + w / 2, y + 48, sub, "d-sub") : ""}
  </g>`;
}

function arrow(x1, y1, x2, y2, label) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dash = live() ? "6 6" : "0";
  const sign = Math.sign(x2 - x1) || 1;
  return `<g>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--cc-accent-1)" stroke-width="2" stroke-dasharray="${dash}" class="d-march"></line>
    <polygon points="${x2},${y2} ${x2 - sign * 10},${y2 - 5} ${x2 - sign * 10},${y2 + 5}" fill="var(--cc-accent-1)"></polygon>
    ${label ? text(midX, midY - 8, label, "d-sub") : ""}
  </g>`;
}

function packet(x1, y1, x2, y2) {
  if (!live()) return "";
  return `<circle r="5" fill="var(--cc-accent-3)">
    <animate attributeName="cx" values="${x1};${x2}" dur="1.8s" repeatCount="indefinite"></animate>
    <animate attributeName="cy" values="${y1};${y2}" dur="1.8s" repeatCount="indefinite"></animate>
  </circle>`;
}

function ladder(parties, steps, w = 860, row = 52) {
  const top = 48;
  const h = top + steps.length * row + 24;
  const col = w / parties.length;
  const heads = parties.map((name, i) => {
    const x = col * i + col / 2;
    return `${text(x, 28, name)}<line x1="${x}" y1="40" x2="${x}" y2="${h - 16}" stroke="var(--cc-line)" stroke-width="2"></line>`;
  }).join("");
  const hops = steps.map((step, i) => {
    const x1 = col * step.from + col / 2;
    const x2 = col * step.to + col / 2;
    const y = top + i * row + 18;
    return arrow(x1, y, x2, y, step.label) + packet(x1, y, x2, y);
  }).join("");
  return svg(parties.join(" "), w, h, heads + hops);
}

function stack(layers) {
  const body = layers.map((layer, i) => {
    const y = 24 + i * 58;
    return box(40, y, 780, 48, layer.name, layer.detail, i);
  }).join("");
  return svg("stack", 860, 36 + layers.length * 58, body);
}

export const ATLAS = [
  {
    id: "stack",
    title: "Session stack",
    caption: "SIP does not carry the voice. SDP names the media. RTP moves it.",
    cite: { label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261" },
    draw: () => stack([
      { name: "Neighbor systems", detail: "CRM, WFM, analytics. Events, not Via headers." },
      { name: "SIP dialog", detail: "Call-ID, tags, route set. RFC 3261." },
      { name: "SDP offer/answer", detail: "Codecs, ports, direction. RFC 3264 and RFC 8866." },
      { name: "RTP / SRTP", detail: "Media packets. RFC 3550 and RFC 3711." },
      { name: "UDP, TCP, or TLS", detail: "The hop under the message." },
    ]),
  },
  {
    id: "invite-txn",
    title: "INVITE client transaction",
    caption: "Calling, Proceeding, Completed, Terminated. A 100 is not ringing.",
    cite: { label: "RFC 3261 §17", url: "https://www.rfc-editor.org/rfc/rfc3261#section-17" },
    draw: () => ladder(["UAC", "UAS"], [
      { from: 0, to: 1, label: "INVITE" },
      { from: 1, to: 0, label: "100" },
      { from: 1, to: 0, label: "180" },
      { from: 1, to: 0, label: "200" },
      { from: 0, to: 1, label: "ACK" },
    ]),
  },
  {
    id: "noninvite",
    title: "Non-INVITE transaction",
    caption: "BYE, OPTIONS, and most others. The 2xx completes it. There is no separate ACK.",
    cite: { label: "RFC 3261 §17.1.2", url: "https://www.rfc-editor.org/rfc/rfc3261#section-17.1.2" },
    draw: () => ladder(["UAC", "UAS"], [
      { from: 0, to: 1, label: "BYE" },
      { from: 1, to: 0, label: "200" },
    ]),
  },
  {
    id: "dialog",
    title: "Dialog versus transaction",
    caption: "The branch identifies a transaction. The tags identify the dialog.",
    cite: { label: "RFC 3261 §12", url: "https://www.rfc-editor.org/rfc/rfc3261#section-12" },
    draw: () => svg("dialog", 860, 280, [
      box(40, 40, 240, 180, "Transaction", "branch in Via", 0),
      box(310, 40, 240, 180, "Dialog", "Call-ID + tags", 1),
      box(580, 40, 240, 180, "Session", "SDP media", 2),
      text(160, 130, "one request", "d-sub"),
      text(430, 130, "the call", "d-sub"),
      text(700, 130, "the audio", "d-sub"),
    ].join("")),
  },
  {
    id: "offer-answer",
    title: "Offer and answer",
    caption: "The answer picks. Port 0 rejects a stream. Order in the offer is a preference.",
    cite: { label: "RFC 3264", url: "https://www.rfc-editor.org/rfc/rfc3264" },
    draw: () => svg("offer", 860, 300, [
      box(40, 36, 340, 220, "Offer", "PCMU, PCMA, telephone-event", 0),
      box(480, 36, 340, 220, "Answer", "PCMU, telephone-event", 1),
      arrow(390, 140, 470, 140, ""),
      text(210, 150, "m=audio 49170", "d-sub"),
      text(650, 150, "m=audio 19642", "d-sub"),
      text(430, 250, "PCMA dropped", "d-sub"),
    ].join("")),
  },
  {
    id: "rtp-header",
    title: "RTP header fields",
    caption: "Version, marker, payload type, sequence, timestamp, SSRC. Extensions sit behind the X bit.",
    cite: { label: "RFC 3550 §5.1", url: "https://www.rfc-editor.org/rfc/rfc3550#section-5.1" },
    draw: () => {
      const fields = ["V", "P", "X", "CC", "M", "PT", "sequence", "timestamp", "SSRC"];
      const body = fields.map((field, i) => box(24 + (i % 5) * 166, 36 + Math.floor(i / 5) * 100, 150, 72, field, "", i)).join("");
      return svg("rtp", 860, 250, body);
    },
  },
  {
    id: "codecs",
    title: "Clock rates that surprise people",
    caption: "G.722 audio is 16 kHz. Its RTP clock in RFC 3551 is 8000.",
    cite: { label: "RFC 3551 §4.5.2", url: "https://www.rfc-editor.org/rfc/rfc3551#section-4.5.2" },
    draw: () => svg("codecs", 860, 220, [
      box(30, 50, 180, 110, "PCMU", "8000", 0),
      box(230, 50, 180, 110, "G.722", "clock 8000", 3),
      box(430, 50, 180, 110, "G.729", "8000", 1),
      box(630, 50, 180, 110, "Opus", "48000", 2),
    ].join("")),
  },
  {
    id: "dtmf",
    title: "Three ways digits show up",
    caption: "telephone-event is the IETF mechanism in RTP. INFO is a generic method. In-band is just audio.",
    cite: { label: "RFC 4733", url: "https://www.rfc-editor.org/rfc/rfc4733" },
    draw: () => svg("dtmf", 860, 220, [
      box(30, 50, 250, 110, "RFC 4733", "named events", 1),
      box(305, 50, 250, 110, "In-band", "audio tones", 0),
      box(580, 50, 250, 110, "INFO", "RFC 6086, not DTMF", 2),
    ].join("")),
  },
  {
    id: "srtp",
    title: "Two keying paths",
    caption: "SRTP is RFC 3711. SDES and DTLS-SRTP do not match by accident.",
    cite: { label: "RFC 3711", url: "https://www.rfc-editor.org/rfc/rfc3711" },
    draw: () => svg("srtp", 860, 240, [
      box(40, 40, 220, 90, "RTP", "media", 0),
      arrow(270, 85, 340, 85, ""),
      box(350, 30, 220, 70, "SDES", "RFC 4568", 3),
      box(350, 130, 220, 70, "DTLS-SRTP", "RFC 5764", 1),
      arrow(580, 65, 640, 85, ""),
      arrow(580, 165, 640, 120, ""),
      box(650, 60, 170, 80, "SRTP", "RFC 3711", 2),
    ].join("")),
  },
  {
    id: "ice",
    title: "ICE candidate types",
    caption: "Host, server-reflexive, relay. The checklist pairs them. RFC 8445 obsoletes RFC 5245.",
    cite: { label: "RFC 8445", url: "https://www.rfc-editor.org/rfc/rfc8445" },
    draw: () => svg("ice", 860, 260, [
      box(40, 80, 200, 90, "Host", "local address", 0),
      box(320, 30, 220, 90, "STUN", "server-reflexive", 1),
      box(320, 150, 220, 90, "TURN", "relay", 2),
      box(640, 80, 180, 90, "Peer", "checklist", 3),
      arrow(250, 120, 310, 80, ""),
      arrow(250, 130, 310, 180, ""),
      arrow(550, 75, 630, 110, ""),
      arrow(550, 190, 630, 140, ""),
      packet(250, 120, 630, 110),
    ].join("")),
  },
  {
    id: "stun",
    title: "STUN binding",
    caption: "The server tells the client the mapped address. Default port 3478.",
    cite: { label: "RFC 8489", url: "https://www.rfc-editor.org/rfc/rfc8489" },
    draw: () => ladder(["Client", "STUN"], [
      { from: 0, to: 1, label: "Binding" },
      { from: 1, to: 0, label: "XOR-MAPPED" },
    ]),
  },
  {
    id: "turn",
    title: "TURN relay",
    caption: "Allocate, then the peer sends to the relayed address. TLS default is 5349.",
    cite: { label: "RFC 8656", url: "https://www.rfc-editor.org/rfc/rfc8656" },
    draw: () => ladder(["Client", "TURN", "Peer"], [
      { from: 0, to: 1, label: "Allocate" },
      { from: 1, to: 0, label: "relayed" },
      { from: 2, to: 1, label: "media" },
      { from: 1, to: 0, label: "media" },
    ]),
  },
  {
    id: "nat",
    title: "NAT, ALG, and the SDP address",
    caption: "If c= is a private address and the phone is on the public Internet, the return audio has nowhere useful to go.",
    cite: { label: "RFC 7362", url: "https://www.rfc-editor.org/rfc/rfc7362" },
    draw: () => svg("nat", 860, 240, [
      box(30, 70, 180, 90, "Phone", "10.0.0.8", 0),
      box(280, 70, 200, 90, "NAT / ALG", "rewrites or not", 3),
      box(560, 70, 260, 90, "SBC", "sees the packet", 1),
      arrow(220, 110, 270, 110, ""),
      arrow(490, 110, 550, 110, "SDP c="),
      packet(220, 115, 550, 115),
    ].join("")),
  },
  {
    id: "b2bua",
    title: "B2BUA",
    caption: "Two dialogs. One operator call. Media may still go around the SBC.",
    cite: { label: "RFC 7092", url: "https://www.rfc-editor.org/rfc/rfc7092" },
    draw: () => svg("b2bua", 860, 240, [
      box(40, 40, 200, 70, "Dialog A", "Call-ID 1", 0),
      box(330, 40, 200, 70, "SBC", "B2BUA", 2),
      box(620, 40, 200, 70, "Dialog B", "Call-ID 2", 1),
      arrow(250, 75, 320, 75, ""),
      arrow(540, 75, 610, 75, ""),
      text(430, 160, "RTP may bypass this box", "d-sub"),
      text(430, 190, "RFC 5853 discusses that choice", "d-sub"),
    ].join("")),
  },
  {
    id: "dns",
    title: "Locating a SIP server",
    caption: "NAPTR, then SRV, then A or AAAA. The SRV port wins over 5060.",
    cite: { label: "RFC 3263", url: "https://www.rfc-editor.org/rfc/rfc3263" },
    draw: () => svg("dns", 860, 200, [
      box(30, 50, 180, 90, "NAPTR", "transport", 0),
      arrow(220, 95, 250, 95, ""),
      box(260, 50, 180, 90, "SRV", "host + port", 1),
      arrow(450, 95, 490, 95, ""),
      box(500, 50, 160, 90, "A/AAAA", "address", 3),
      arrow(670, 95, 700, 95, ""),
      box(710, 50, 120, 90, "SIP", "", 2),
    ].join("")),
  },
  {
    id: "register",
    title: "Registration",
    caption: "Expires in the request is a wish. The 200 OK sets the binding.",
    cite: { label: "RFC 3261 §10", url: "https://www.rfc-editor.org/rfc/rfc3261#section-10" },
    draw: () => ladder(["UA", "Registrar"], [
      { from: 0, to: 1, label: "REGISTER" },
      { from: 1, to: 0, label: "401" },
      { from: 0, to: 1, label: "REGISTER" },
      { from: 1, to: 0, label: "200" },
    ]),
  },
  {
    id: "prack",
    title: "Provisional reliability",
    caption: "PRACK acknowledges a reliable 1xx. It is its own transaction.",
    cite: { label: "RFC 3262", url: "https://www.rfc-editor.org/rfc/rfc3262" },
    draw: () => ladder(["UAC", "UAS"], [
      { from: 0, to: 1, label: "INVITE" },
      { from: 1, to: 0, label: "183" },
      { from: 0, to: 1, label: "PRACK" },
      { from: 1, to: 0, label: "200 PRACK" },
      { from: 1, to: 0, label: "200 INVITE" },
      { from: 0, to: 1, label: "ACK" },
    ]),
  },
  {
    id: "refer",
    title: "REFER",
    caption: "The transferee sends a new INVITE. Replaces names the dialog to take over.",
    cite: { label: "RFC 3515", url: "https://www.rfc-editor.org/rfc/rfc3515" },
    draw: () => ladder(["Transferor", "Transferee", "Target"], [
      { from: 0, to: 1, label: "REFER" },
      { from: 1, to: 0, label: "202" },
      { from: 1, to: 2, label: "INVITE" },
      { from: 2, to: 1, label: "200" },
    ]),
  },
  {
    id: "early",
    title: "Early media",
    caption: "183 with SDP can carry early media. 180 means alerting. They are not synonyms.",
    cite: { label: "RFC 3960", url: "https://www.rfc-editor.org/rfc/rfc3960" },
    draw: () => ladder(["Caller", "Callee"], [
      { from: 0, to: 1, label: "INVITE+SDP" },
      { from: 1, to: 0, label: "183+SDP" },
      { from: 1, to: 0, label: "180" },
      { from: 1, to: 0, label: "200" },
    ]),
  },
  {
    id: "fork",
    title: "Forking",
    caption: "A proxy may fork. One 200 wins. The other branch is cancelled.",
    cite: { label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261" },
    draw: () => ladder(["Alice", "Proxy", "Bob", "Carol"], [
      { from: 0, to: 1, label: "INVITE" },
      { from: 1, to: 2, label: "INVITE" },
      { from: 1, to: 3, label: "INVITE" },
      { from: 2, to: 1, label: "200" },
      { from: 1, to: 3, label: "CANCEL" },
    ]),
  },
  {
    id: "timer",
    title: "Session timer",
    caption: "The refresh is an UPDATE or a re-INVITE. Miss it and the session ends.",
    cite: { label: "RFC 4028", url: "https://www.rfc-editor.org/rfc/rfc4028" },
    draw: () => ladder(["A", "B"], [
      { from: 0, to: 1, label: "INVITE" },
      { from: 1, to: 0, label: "200 +SE" },
      { from: 0, to: 1, label: "UPDATE" },
      { from: 1, to: 0, label: "200" },
    ]),
  },
  {
    id: "update",
    title: "UPDATE and re-INVITE",
    caption: "UPDATE can change the session before the INVITE completes. re-INVITE needs a confirmed dialog.",
    cite: { label: "RFC 3311", url: "https://www.rfc-editor.org/rfc/rfc3311" },
    draw: () => svg("update", 860, 220, [
      box(40, 50, 340, 110, "UPDATE", "RFC 3311", 0),
      box(480, 50, 340, 110, "re-INVITE", "confirmed dialog", 1),
    ].join("")),
  },
  {
    id: "cancel",
    title: "CANCEL and 487",
    caption: "The 200 OK belongs to the CANCEL. The INVITE should finish with 487.",
    cite: { label: "RFC 3261 §9", url: "https://www.rfc-editor.org/rfc/rfc3261#section-9" },
    draw: () => ladder(["Alice", "Bob"], [
      { from: 0, to: 1, label: "INVITE" },
      { from: 1, to: 0, label: "180" },
      { from: 0, to: 1, label: "CANCEL" },
      { from: 1, to: 0, label: "200 CANCEL" },
      { from: 1, to: 0, label: "487" },
      { from: 0, to: 1, label: "ACK" },
    ]),
  },
  {
    id: "webrtc",
    title: "WebRTC triangle",
    caption: "The browser uses ICE. The signaling server is application-defined. JSEP is RFC 8829.",
    cite: { label: "RFC 8825", url: "https://www.rfc-editor.org/rfc/rfc8825" },
    draw: () => svg("webrtc", 860, 280, [
      box(40, 30, 200, 70, "Browser A", "ICE agent", 0),
      box(620, 30, 200, 70, "Browser B", "ICE agent", 1),
      box(320, 30, 220, 70, "Signaling", "not a SIP proxy", 3),
      box(320, 170, 220, 70, "STUN / TURN", "RFC 8489 / 8656", 2),
      arrow(250, 65, 310, 65, "SDP"),
      arrow(550, 65, 610, 65, "SDP"),
      arrow(150, 110, 400, 165, ""),
      arrow(700, 110, 460, 165, ""),
    ].join("")),
  },
  {
    id: "teams",
    title: "Teams Direct Routing",
    caption: "Certified SBC, TLS to the pstnhub names, SRTP media. Users are homed in Microsoft 365.",
    cite: { label: "Plan Direct Routing", url: "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan" },
    draw: () => svg("teams", 860, 230, [
      box(30, 60, 180, 90, "Carrier", "PSTN", 3),
      box(250, 60, 180, 90, "Certified SBC", "your FQDN", 0),
      box(500, 60, 320, 90, "Teams", "5061 TLS", 1),
      arrow(220, 100, 240, 100, ""),
      arrow(440, 100, 490, 100, "SIP/TLS"),
      packet(250, 105, 500, 105),
    ].join("")),
  },
  {
    id: "lgw",
    title: "Webex Calling Local Gateway",
    caption: "Registration-based trunks use 8934. Certificate-based trunks use 5062. The help page is the authority.",
    cite: { label: "Webex port reference", url: "https://help.webex.com/en-us/article/b2exve" },
    draw: () => svg("lgw", 860, 230, [
      box(30, 60, 200, 90, "CUCM / PSTN", "inside", 3),
      box(300, 60, 220, 90, "Local Gateway", "CUBE or peer", 0),
      box(590, 60, 230, 90, "Webex Calling", "8934 or 5062", 1),
      arrow(240, 100, 290, 100, ""),
      arrow(530, 100, 580, 100, "SIP-TLS"),
    ].join("")),
  },
  {
    id: "siprec",
    title: "SIPREC",
    caption: "The recording session is a second SIP dialog, with metadata.",
    cite: { label: "RFC 7866", url: "https://www.rfc-editor.org/rfc/rfc7866" },
    draw: () => svg("siprec", 860, 250, [
      box(40, 40, 180, 70, "Caller", "", 0),
      box(300, 40, 200, 70, "SRC / SBC", "anchors media", 2),
      box(600, 40, 200, 70, "Callee", "", 1),
      box(300, 150, 200, 70, "SRS", "recorder", 3),
      arrow(230, 75, 290, 75, ""),
      arrow(510, 75, 590, 75, ""),
      arrow(400, 120, 400, 145, "RFC 7866"),
    ].join("")),
  },
  {
    id: "stir",
    title: "STIR Identity",
    caption: "The PASSporT rides in Identity. SHAKEN is the carrier profile, not a different method.",
    cite: { label: "RFC 8224", url: "https://www.rfc-editor.org/rfc/rfc8224" },
    draw: () => ladder(["Signer", "Verifier"], [
      { from: 0, to: 1, label: "INVITE" },
      { from: 1, to: 0, label: "Identity ok" },
    ]),
  },
  {
    id: "qos",
    title: "Voice marking",
    caption: "Expedited Forwarding is the PHB in RFC 3246. Whether a hop honors it is network policy.",
    cite: { label: "RFC 3246", url: "https://www.rfc-editor.org/rfc/rfc3246" },
    draw: () => svg("qos", 860, 200, [
      box(40, 50, 220, 90, "Phone", "marks EF", 0),
      box(320, 50, 220, 90, "Switch", "may trust it", 3),
      box(600, 50, 220, 90, "WAN", "queue", 1),
      arrow(270, 95, 310, 95, ""),
      arrow(550, 95, 590, 95, ""),
    ].join("")),
  },
  {
    id: "mind",
    title: "Ecosystem mind map",
    caption: "SIP is the session seam. The neighbors are not SIP elements.",
    cite: { label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261" },
    draw: () => {
      const spokes = [
        ["SDP", 80, 50], ["RTP", 250, 40], ["SBC", 450, 40], ["ICE", 680, 50],
        ["E911", 80, 180], ["SIPREC", 250, 190], ["CRM", 450, 190], ["WFM", 680, 180],
      ];
      const lines = spokes.map(([, x, y]) => `<line x1="430" y1="120" x2="${x + 70}" y2="${y + 28}" stroke="var(--cc-line)" stroke-width="2"></line>`).join("");
      const nodes = spokes.map(([label, x, y], i) => box(x, y, 140, 56, label, "", i)).join("");
      return svg("mind", 860, 270, lines + box(330, 90, 200, 60, "SIP dialog", "", 2) + nodes);
    },
  },
  {
    id: "timeline",
    title: "Specification timeline",
    caption: "Months are the dates printed on the RFC headers.",
    cite: { label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261" },
    draw: () => {
      const rows = [
        ["1999", "RFC 2543"], ["2002", "RFC 3261"], ["2003", "RFC 3550"],
        ["2006", "RFC 4566"], ["2018", "RFC 8445"], ["2020", "RFC 8489"], ["2021", "RFC 8866"],
      ];
      const body = rows.map((row, i) => `${text(40, 48 + i * 36, row[0], "d-sub", "start")}${text(140, 48 + i * 36, row[1], "d-label", "start")}`).join("");
      return svg("timeline", 860, 40 + rows.length * 36, `<line x1="28" y1="20" x2="28" y2="${rows.length * 36}" stroke="var(--cc-accent-1)"></line>${body}`);
    },
  },
  {
    id: "hold",
    title: "Hold with re-INVITE",
    caption: "Hold is a new offer. a=sendonly asks the other side to stop sending. A confirmed dialog is required for re-INVITE.",
    cite: { label: "RFC 3264 §8.4", url: "https://www.rfc-editor.org/rfc/rfc3264#section-8.4" },
    draw: () => ladder(["Alice", "Bob"], [
      { from: 0, to: 1, label: "re-INVITE sendonly" },
      { from: 1, to: 0, label: "200 recvonly" },
      { from: 0, to: 1, label: "ACK" },
      { from: 0, to: 1, label: "re-INVITE sendrecv" },
      { from: 1, to: 0, label: "200" },
      { from: 0, to: 1, label: "ACK" },
    ]),
  },
  {
    id: "tls",
    title: "SIP over TLS",
    caption: "The handshake is TLS. The INVITE rides after it. SIPS and 5061 are the usual signal. TLS 1.0 and 1.1 are deprecated.",
    cite: { label: "RFC 3261 §18 / RFC 8996", url: "https://www.rfc-editor.org/rfc/rfc8996" },
    draw: () => ladder(["Client", "Server"], [
      { from: 0, to: 1, label: "ClientHello" },
      { from: 1, to: 0, label: "ServerHello" },
      { from: 0, to: 1, label: "INVITE" },
      { from: 1, to: 0, label: "100" },
      { from: 1, to: 0, label: "200" },
    ]),
  },
  {
    id: "srtp-flow",
    title: "SRTP after SDES",
    caption: "This ladder is the SDES path: keys travel in SDP. DTLS-SRTP (RFC 5764) keys the media in the media path instead.",
    cite: { label: "RFC 4568", url: "https://www.rfc-editor.org/rfc/rfc4568" },
    draw: () => ladder(["Alice", "Bob"], [
      { from: 0, to: 1, label: "INVITE a=crypto" },
      { from: 1, to: 0, label: "200 a=crypto" },
      { from: 0, to: 1, label: "ACK" },
      { from: 0, to: 1, label: "SRTP" },
    ]),
  },
  {
    id: "cutover",
    title: "Parallel trunk cutover",
    caption: "A teaching sequence: prove the new trunk, then retire the old one. It is not a record of any carrier procedure.",
    cite: { label: "RFC 3261", url: "https://www.rfc-editor.org/rfc/rfc3261" },
    draw: () => ladder(["Pilot", "Old SBC", "New SBC"], [
      { from: 0, to: 1, label: "INVITE" },
      { from: 1, to: 0, label: "200" },
      { from: 0, to: 2, label: "INVITE" },
      { from: 2, to: 0, label: "200" },
      { from: 0, to: 1, label: "BYE" },
    ]),
  },
  {
    id: "fault-tree",
    title: "One-way audio path",
    caption: "Status code first, then the SDP address, then whether RTP actually arrives. Private c= on a public hop is a common dead end.",
    cite: { label: "RFC 7362", url: "https://www.rfc-editor.org/rfc/rfc7362" },
    draw: () => svg("fault-tree", 860, 280, [
      box(40, 30, 200, 70, "One-way audio", "start here", 0),
      box(320, 20, 220, 70, "SDP c= private?", "RFC 7362", 3),
      box(620, 20, 200, 70, "Latch or rewrite", "media", 1),
      box(320, 160, 220, 70, "RTP present?", "even port", 2),
      box(620, 160, 200, 70, "Codec / ptime", "488 or silence", 0),
      arrow(250, 65, 310, 55, ""),
      arrow(550, 55, 610, 55, ""),
      arrow(430, 100, 430, 150, "no"),
      arrow(550, 195, 610, 195, ""),
      packet(250, 65, 610, 55),
    ].join("")),
  },
  {
    id: "mermaid-register",
    title: "REGISTER, from Mermaid",
    caption: "Mermaid 11.12.0 drew this at build time from the same registration sequence. The hand ladder is the one that animates.",
    cite: { label: "RFC 3261 §10", url: "https://www.rfc-editor.org/rfc/rfc3261#section-10" },
    draw: () => `<img class="atlas-svg" alt="REGISTER sequence drawn by Mermaid" src="diagrams/register.svg">`,
  },
  {
    id: "mermaid-border",
    title: "Border paths, from Mermaid",
    caption: "A teaching sketch of a phone, an SBC, a call agent, and a carrier. Mermaid 11.12.0 drew it at build time. It is not a customer topology.",
    cite: { label: "RFC 7092", url: "https://www.rfc-editor.org/rfc/rfc7092" },
    draw: () => `<img class="atlas-svg" alt="Phone, SBC, CUCM, and carrier drawn by Mermaid" src="diagrams/border.svg">`,
  },
];

const ANIMATED = new Set([
  "invite-txn", "noninvite", "stun", "turn", "nat", "ice",
  "register", "prack", "refer", "early", "fork", "timer", "cancel", "stir",
  "hold", "tls", "srtp-flow", "cutover", "fault-tree",
]);
for (const item of ATLAS) item.animated = ANIMATED.has(item.id);

export function figureHTML(item) {
  return `<figure class="atlas-fig${item.animated ? " is-animated" : ""}" id="atlas-${esc(item.id)}" data-animated="${item.animated ? "1" : "0"}">
    ${item.draw()}
    <figcaption><strong>${esc(item.title)}.</strong> ${esc(item.caption)} <a href="${esc(item.cite.url)}">${esc(item.cite.label)}</a></figcaption>
  </figure>`;
}

export function mountSpotlight(host) {
  if (!host) return;
  const picks = ["stack", "invite-txn", "ice", "b2bua"].map((id) => ATLAS.find((item) => item.id === id)).filter(Boolean);
  host.innerHTML = `<div class="atlas-grid">${picks.map(figureHTML).join("")}</div>`;
}
