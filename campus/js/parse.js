/* Pure SIP, SDP, and normalization helpers. No DOM. */

export const STATIC_PT = {
  0: "PCMU/8000",
  3: "GSM/8000",
  4: "G723/8000",
  8: "PCMA/8000",
  9: "G722/8000",
  15: "G728/8000",
  18: "G729/8000",
};

const COMPACT = {
  c: "Content-Type",
  e: "Content-Encoding",
  f: "From",
  i: "Call-ID",
  k: "Supported",
  l: "Content-Length",
  m: "Contact",
  s: "Subject",
  t: "To",
  v: "Via",
  o: "Event",
  u: "Allow-Events",
  r: "Refer-To",
  b: "Referred-By",
};

const METHODS = new Set([
  "INVITE", "ACK", "BYE", "CANCEL", "REGISTER", "OPTIONS", "PRACK", "UPDATE",
  "INFO", "REFER", "NOTIFY", "SUBSCRIBE", "MESSAGE", "PUBLISH",
]);

function unfold(text) {
  const raw = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = raw.split("\n");
  const out = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length) {
      out[out.length - 1] += " " + line.trim();
    } else {
      out.push(line);
    }
  }
  return out;
}

function headerName(raw) {
  const compact = raw.length === 1 ? raw.toLowerCase() : null;
  const long = compact && COMPACT[compact] ? COMPACT[compact] : raw;
  return { name: long, compact: compact && COMPACT[compact] ? raw : null };
}

export function dissect(text) {
  const warnings = [];
  const lines = unfold(text);
  while (lines.length && lines[0].trim() === "") lines.shift();
  if (!lines.length || !lines[0].trim()) {
    return { ok: false, warnings: [{ level: "warn", text: "No SIP start line found." }], headers: [], body: "" };
  }
  const start = lines[0].trim();
  const headers = [];
  let i = 1;
  for (; i < lines.length; i++) {
    if (lines[i].trim() === "") { i++; break; }
    const line = lines[i];
    const colon = line.indexOf(":");
    if (colon <= 0) {
      warnings.push({ level: "warn", text: `Header line has no name: ${line.slice(0, 80)}` });
      continue;
    }
    const rawName = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    const named = headerName(rawName);
    headers.push({ ...named, rawName, value });
  }
  const body = lines.slice(i).join("\n");
  const request = METHODS.has(start.split(/\s+/)[0]);
  const response = /^SIP\/2\.0\s+\d{3}/.test(start);
  const result = {
    ok: request || response,
    kind: request ? "request" : response ? "response" : "unknown",
    start,
    method: null,
    uri: null,
    status: null,
    reason: null,
    headers,
    body,
    warnings,
  };
  if (request) {
    const parts = start.split(/\s+/);
    result.method = parts[0];
    result.uri = parts[1] || "";
    if (!/^SIP\/2\.0$/.test(parts[2] || "")) warnings.push({ level: "warn", text: "Request version is not SIP/2.0." });
  } else if (response) {
    const m = start.match(/^SIP\/2\.0\s+(\d{3})\s*(.*)$/);
    result.status = m ? Number(m[1]) : null;
    result.reason = m ? m[2] : "";
  } else {
    warnings.push({ level: "warn", text: "Start line is neither a known request nor a SIP/2.0 response." });
  }
  const has = (name) => headers.some((h) => h.name.toLowerCase() === name.toLowerCase());
  const first = (name) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  for (const required of ["Via", "From", "To", "Call-ID", "CSeq"]) {
    if (!has(required)) warnings.push({ level: "warn", text: `Missing ${required}.` });
  }
  if (request && !has("Max-Forwards")) warnings.push({ level: "warn", text: "Request has no Max-Forwards." });
  const via = first("Via");
  if (via && !/branch=z9hG4bK/i.test(via.value)) {
    warnings.push({ level: "warn", text: "Via branch does not start with the RFC 3261 magic cookie z9hG4bK." });
  }
  const cseq = first("CSeq");
  if (cseq && result.method && !new RegExp(`\\s${result.method}$`, "i").test(cseq.value.trim())) {
    warnings.push({ level: "warn", text: "CSeq method does not match the request method." });
  }
  const len = first("Content-Length");
  if (len) {
    const n = Number(len.value);
    const actual = new TextEncoder().encode(body.replace(/\n/g, "\r\n")).length;
    const lf = new TextEncoder().encode(body).length;
    if (Number.isFinite(n) && n !== actual && n !== lf) {
      warnings.push({ level: "warn", text: `Content-Length is ${n} but the body is ${lf} bytes (LF) / ${actual} bytes (CRLF).` });
    }
  }
  if (result.method === "INVITE" && !has("Contact")) {
    warnings.push({ level: "info", text: "Dialog-forming INVITE has no Contact." });
  }
  const to = first("To");
  if (request && to && /;tag=/i.test(to.value)) result.inDialog = true;
  if (request && to && !/;tag=/i.test(to.value)) result.inDialog = false;
  return result;
}

export function headerValue(msg, name) {
  const h = (msg.headers || []).find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : "";
}

function parseMedia(text) {
  const lines = String(text || "").replace(/\r/g, "").split("\n").map((l) => l.trim()).filter((l) => l.length);
  const session = [];
  const media = [];
  let cur = null;
  for (const line of lines) {
    if (line.startsWith("m=")) {
      const p = line.slice(2).trim().split(/\s+/);
      cur = {
        type: p[0] || "",
        port: Number(p[1]),
        proto: p[2] || "",
        pts: p.slice(3),
        rtpmap: {},
        fmtp: {},
        dir: null,
        raw: [line],
      };
      media.push(cur);
    } else if (cur) {
      cur.raw.push(line);
      if (line.startsWith("a=rtpmap:")) {
        const body = line.slice(9);
        const sp = body.indexOf(" ");
        if (sp > 0) cur.rtpmap[body.slice(0, sp)] = body.slice(sp + 1);
      } else if (line.startsWith("a=fmtp:")) {
        const body = line.slice(7);
        const sp = body.indexOf(" ");
        if (sp > 0) cur.fmtp[body.slice(0, sp)] = body.slice(sp + 1);
      } else if (/^a=(sendrecv|sendonly|recvonly|inactive)$/.test(line)) {
        cur.dir = line.slice(2);
      }
    } else {
      session.push(line);
    }
  }
  return { session, media };
}

function codecName(pt, rtpmap) {
  if (rtpmap[pt]) return rtpmap[pt].split("/")[0].toUpperCase();
  if (Object.prototype.hasOwnProperty.call(STATIC_PT, Number(pt))) return STATIC_PT[Number(pt)].split("/")[0];
  return null;
}

function directionResult(offer, answer) {
  const o = offer || "sendrecv";
  const a = answer || "sendrecv";
  const legal = {
    sendrecv: ["sendrecv", "sendonly", "recvonly", "inactive"],
    sendonly: ["recvonly", "inactive"],
    recvonly: ["sendonly", "inactive"],
    inactive: ["inactive"],
  };
  const ok = (legal[o] || []).includes(a);
  return { offer: o, answer: a, result: a, ok };
}

export function negotiate(offerText, answerText) {
  const offer = parseMedia(offerText);
  const answer = parseMedia(answerText);
  const notes = [];
  if (!offer.media.length) notes.push({ level: "warn", text: "Offer has no m-lines." });
  if (offer.media.length !== answer.media.length) {
    notes.push({ level: "warn", text: `Offer has ${offer.media.length} m-lines and the answer has ${answer.media.length}. RFC 3264 requires the same number, in the same order.` });
  }
  const count = Math.max(offer.media.length, answer.media.length);
  const streams = [];
  for (let i = 0; i < count; i++) {
    const o = offer.media[i];
    const a = answer.media[i];
    if (!o || !a) {
      streams.push({ index: i, missing: !o ? "offer" : "answer" });
      continue;
    }
    const stream = {
      index: i,
      type: o.type,
      answerType: a.type,
      rejected: a.port === 0,
      offerPort: o.port,
      answerPort: a.port,
      offerProto: o.proto,
      answerProto: a.proto,
      codecs: [],
      dropped: [],
      direction: directionResult(o.dir, a.dir),
      dtmf: "none",
    };
    if (o.type !== a.type) notes.push({ level: "warn", text: `m-line ${i + 1} type ${o.type} was answered as ${a.type}.` });
    if (o.proto !== a.proto) notes.push({ level: "warn", text: `m-line ${i + 1} protocol ${o.proto} was answered as ${a.proto}. RTP/AVP and RTP/SAVP do not interchange.` });
    const offerKeys = o.pts.map((pt) => ({ pt, name: codecName(pt, o.rtpmap) || `PT${pt}` }));
    const answerByName = new Map();
    for (const pt of a.pts) {
      const name = codecName(pt, a.rtpmap) || `PT${pt}`;
      if (!answerByName.has(name)) answerByName.set(name, pt);
    }
    for (const item of offerKeys) {
      if (answerByName.has(item.name)) {
        stream.codecs.push({ name: item.name, offerPt: item.pt, answerPt: answerByName.get(item.name) });
      } else {
        stream.dropped.push(item.name);
      }
    }
    const names = new Set(stream.codecs.map((c) => c.name));
    const oDtmf = offerKeys.some((c) => c.name === "TELEPHONE-EVENT");
    const aDtmf = [...answerByName.keys()].includes("TELEPHONE-EVENT");
    stream.dtmf = oDtmf && aDtmf ? "both" : oDtmf ? "offer" : aDtmf ? "answer" : "none";
    if (stream.dtmf === "offer" || stream.dtmf === "answer") {
      notes.push({ level: "info", text: `m-line ${i + 1}: telephone-event is only in the ${stream.dtmf}. RFC 4733 DTMF may not pass.` });
    }
    if (!stream.rejected && stream.codecs.filter((c) => c.name !== "TELEPHONE-EVENT").length === 0) {
      notes.push({ level: "warn", text: `m-line ${i + 1} has no shared audio codec.` });
    }
    if (!stream.direction.ok) {
      notes.push({ level: "warn", text: `m-line ${i + 1}: answer direction ${stream.direction.answer} does not fit an offer of ${stream.direction.offer}.` });
    }
    if (!names.size && !stream.rejected) notes.push({ level: "warn", text: `m-line ${i + 1} negotiated no payload types.` });
    streams.push(stream);
  }
  return { ok: notes.every((n) => n.level !== "warn"), notes, streams };
}

function safeRegExp(source) {
  const src = String(source || "");
  if (src.length > 180) throw new Error("Pattern is longer than 180 characters.");
  if (/(\*|\+|\{[^}]*\})\s*\)?\s*(\*|\+|\{)/.test(src)) throw new Error("Nested quantifiers are blocked in this sandbox.");
  return new RegExp(src, "g");
}

function splitMessage(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const start = lines[0] || "";
  const headers = [];
  let i = 1;
  for (; i < lines.length; i++) {
    if (lines[i] === "") { i++; break; }
    headers.push(lines[i]);
  }
  const body = lines.slice(i).join("\n");
  return { start, headers, body };
}

function joinMessage(start, headers, body) {
  const head = [start, ...headers];
  const bytes = new TextEncoder().encode(body.replace(/\n/g, "\r\n")).length;
  const next = [];
  let seen = false;
  for (const line of head.slice(1)) {
    if (/^content-length\s*:/i.test(line)) {
      next.push(`Content-Length: ${body ? bytes : 0}`);
      seen = true;
    } else next.push(line);
  }
  if (!seen) next.push(`Content-Length: ${body ? bytes : 0}`);
  return [head[0], ...next, "", body].join("\n").replace(/\n$/, body ? "\n" : "\n");
}

function headerKey(line) {
  const i = line.indexOf(":");
  return i > 0 ? line.slice(0, i).trim().toLowerCase() : "";
}

function requestMethod(start) {
  const p = start.split(/\s+/);
  return METHODS.has(p[0]) ? p[0] : null;
}

function responseCode(start) {
  const m = start.match(/^SIP\/2\.0\s+(\d{3})/);
  return m ? m[1] : null;
}

function ruleMatchesMessage(token, start) {
  const t = String(token || "ANY").toUpperCase();
  if (t === "ANY") return true;
  const method = requestMethod(start);
  const code = responseCode(start);
  if (method) return t === method;
  if (code) return t === code || t === code[0] + "XX";
  return false;
}

export function applyCube(rulesText, message) {
  const changes = [];
  const warnings = [];
  let msg = splitMessage(message);
  const lines = String(rulesText || "").split(/\n/);
  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line || line.startsWith("!") || line.startsWith("#") || line.startsWith("voice class")) return;
    const m = line.match(/^(request|response)\s+(\S+)\s+sip-header\s+(\S+)\s+(add|remove|modify)\s*(.*)$/i);
    if (!m) {
      warnings.push(`Line ${idx + 1} is not in the teaching subset (request|response METHOD sip-header NAME add|remove|modify).`);
      return;
    }
    const [, dir, token, header, action, rest] = m;
    const isResp = Boolean(responseCode(msg.start));
    if (dir.toLowerCase() === "request" && isResp) return;
    if (dir.toLowerCase() === "response" && !isResp) return;
    if (!ruleMatchesMessage(token, msg.start)) return;
    const name = header.toLowerCase();
    if (action.toLowerCase() === "remove") {
      const before = msg.headers.length;
      msg.headers = msg.headers.filter((h) => headerKey(h) !== name);
      changes.push({ rule: line, detail: before === msg.headers.length ? "no header removed" : `removed ${header}` });
      return;
    }
    if (action.toLowerCase() === "add") {
      const quoted = rest.match(/^"([\s\S]*)"$/);
      const value = quoted ? quoted[1] : rest.replace(/^"|"$/g, "");
      msg.headers.push(value.includes(":") ? value : `${header}: ${value}`);
      changes.push({ rule: line, detail: `added ${header}` });
      return;
    }
    const parts = [...rest.matchAll(/"([^"]*)"/g)].map((x) => x[1]);
    if (parts.length < 2) {
      warnings.push(`Line ${idx + 1} modify needs two quoted strings.`);
      return;
    }
    let re;
    try { re = safeRegExp(parts[0]); }
    catch (err) { warnings.push(`Line ${idx + 1}: ${err.message}`); return; }
    const repl = parts[1].replace(/\\(\d)/g, "$$$1");
    let hits = 0;
    msg.headers = msg.headers.map((h) => {
      if (headerKey(h) !== name) return h;
      const i = h.indexOf(":");
      const value = h.slice(i + 1);
      re.lastIndex = 0;
      if (!re.test(value)) return h;
      re.lastIndex = 0;
      hits += 1;
      return h.slice(0, i + 1) + value.replace(re, repl);
    });
    changes.push({ rule: line, detail: hits ? `modified ${hits} ${header}` : `no match on ${header}` });
  });
  return { output: joinMessage(msg.start, msg.headers, msg.body), changes, warnings };
}

function parseAcme(text) {
  const blocks = [];
  let cur = null;
  for (const raw of String(text || "").split(/\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (/^header-rule$/i.test(line)) {
      if (cur) blocks.push(cur);
      cur = {};
      continue;
    }
    if (!cur) continue;
    const sp = line.indexOf(" ");
    const key = (sp === -1 ? line : line.slice(0, sp)).toLowerCase();
    const value = sp === -1 ? "" : line.slice(sp + 1).trim();
    cur[key] = value;
  }
  if (cur) blocks.push(cur);
  return blocks;
}

export function applyAcme(rulesText, message) {
  const changes = [];
  const warnings = [];
  const stores = {};
  let msg = splitMessage(message);
  let rejected = false;
  for (const rule of parseAcme(rulesText)) {
    const header = rule["header-name"];
    const action = (rule.action || "").toLowerCase();
    if (!header || !action) {
      warnings.push("A header-rule needs header-name and action.");
      continue;
    }
    const msgType = (rule["msg-type"] || "any").toLowerCase();
    const isResp = Boolean(responseCode(msg.start));
    if (msgType === "request" && isResp) continue;
    if (msgType === "reply" && !isResp) continue;
    const name = header.toLowerCase();
    const matchValue = rule["match-value"] || "";
    const comparison = (rule["comparison-type"] || "boolean").toLowerCase();
    const applyOne = (value) => {
      if (comparison === "boolean" || !matchValue) return { ok: true, value };
      if (comparison === "case-sensitive") {
        return { ok: value.includes(matchValue), value: value.split(matchValue).join(rule["new-value"] || "") };
      }
      try {
        const re = safeRegExp(matchValue);
        if (!re.test(value)) return { ok: false, value };
        re.lastIndex = 0;
        const repl = (rule["new-value"] || "").replace(/\\(\d)/g, "$$$1");
        return { ok: true, value: value.replace(re, repl), found: value.match(safeRegExp(matchValue)) };
      } catch (err) {
        warnings.push(err.message);
        return { ok: false, value };
      }
    };
    if (action === "add") {
      msg.headers.push(`${header}: ${rule["new-value"] || ""}`);
      changes.push({ rule: rule.name || header, detail: `added ${header}` });
      continue;
    }
    let hits = 0;
    const next = [];
    for (const h of msg.headers) {
      if (headerKey(h) !== name) { next.push(h); continue; }
      const i = h.indexOf(":");
      const tested = applyOne(h.slice(i + 1));
      if (!tested.ok && comparison !== "boolean") { next.push(h); continue; }
      hits += 1;
      if (action === "delete") continue;
      if (action === "store") {
        stores[rule.name || header] = h.slice(i + 1).trim();
        next.push(h);
        continue;
      }
      if (action === "reject") {
        rejected = true;
        next.push(h);
        continue;
      }
      if (action === "manipulate") {
        next.push(h.slice(0, i + 1) + (tested.value.startsWith(" ") ? tested.value : " " + tested.value.trim()));
        continue;
      }
      warnings.push(`Action ${action} is outside this teaching subset.`);
      next.push(h);
    }
    msg.headers = next;
    changes.push({ rule: rule.name || header, detail: `${action} on ${header}: ${hits} header(s)` });
  }
  return { output: joinMessage(msg.start, msg.headers, msg.body), changes, warnings, stores, rejected };
}

export function extractMessages(raw) {
  const lines = String(raw || "").replace(/\r/g, "").split("\n").map((line) => {
    return line
      .replace(/^[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\.\d+:\s*/, "")
      .replace(/^\/\/-?\d+\/[0-9A-Fa-fx]+\/SIP\/Msg\/ccsipDisplayMsg:\s*/, "");
  });
  const messages = [];
  let direction = "";
  let buf = [];
  const flush = () => {
    const text = buf.join("\n").trim();
    buf = [];
    if (!text) return;
    const first = text.split("\n")[0];
    if (METHODS.has(first.split(/\s+/)[0]) || first.startsWith("SIP/2.0")) {
      messages.push({ direction, text });
    }
  };
  for (const line of lines) {
    const trim = line.trim();
    if (/^(Sent|Received):?$/i.test(trim)) {
      flush();
      direction = /^sent/i.test(trim) ? "sent" : "received";
      continue;
    }
    const method = trim.split(/\s+/)[0];
    const starts = METHODS.has(method) || trim.startsWith("SIP/2.0 ");
    if (starts && buf.length) flush();
    if (trim || buf.length) buf.push(line);
  }
  flush();
  return messages;
}
