/**
 * Guide companion for the Webex Canon lab.
 *
 * Everything factual is loaded from guide/kb, which is built from the
 * rooms, glossary, flows, diagrams, flashcards, and cheat sheets.
 * No request leaves the browser while window.CANON_GUIDE.endpoint is null.
 *
 * Future cloud agent:
 *   window.CANON_GUIDE.endpoint is intentionally unset (null).
 *   Assign a URL string later to POST { message, href, context } only when
 *   the local notes have no match. Expected JSON: { text, href, links }.
 *   Leave it null and every answer stays in this browser.
 */
import { createGuide, mergeKb, blankSession } from "./engine.mjs";

var guideBase = baseUrl();
var session = loadSession();
var guide = null;
var kbPromise = null;
var nudged = false;
var along = { active: false, paused: false, sections: [], index: 0, sentence: 0 };
var alongToken = 0;
var ambience = { ctx: null, nodes: [] };

var host = document.createElement("div");
host.className = "cg-root";
host.style.fontSize = getComputedStyle(document.body).fontSize;

var monkey = document.createElement("button");
monkey.type = "button";
monkey.className = "cg-monkey";
monkey.setAttribute("aria-expanded", "false");
monkey.setAttribute("aria-controls", "cg-panel");
monkey.setAttribute("aria-label", "Study notes. A student who has read these rooms.");
monkey.innerHTML = monkeySvg();

var nudge = document.createElement("div");
nudge.className = "cg-nudge";
nudge.hidden = true;
nudge.setAttribute("role", "status");

var panel = document.createElement("section");
panel.id = "cg-panel";
panel.className = "cg-panel";
panel.hidden = true;
panel.setAttribute("role", "dialog");
panel.setAttribute("aria-modal", "true");
panel.setAttribute("aria-labelledby", "cg-title");
panel.innerHTML =
  '<button type="button" class="cg-handle" data-sheet-handle aria-label="Drag to resize the guide"></button>' +
  '<header class="cg-bar">' +
  '<div class="cg-who"><span class="cg-avatar" aria-hidden="true">' + avatarSvg() + '</span>' +
  '<div class="cg-id"><h2 id="cg-title">SIP Guide</h2><p class="cg-status"><i class="cg-dot" aria-hidden="true"></i> In the notes</p></div></div>' +
  '<button type="button" class="cg-close" data-close aria-label="Close">Close</button>' +
  '</header>' +
  '<div class="cg-readbar">' +
  '<div class="cg-along" role="group" aria-label="Read along">' +
  '<button type="button" data-along-start>Read along</button>' +
  '<button type="button" data-along-pause>Pause</button>' +
  '<button type="button" data-along-resume>Resume</button>' +
  '<button type="button" data-along-next>Next section</button></div>' +
  '<div class="cg-voice cg-voice-live" data-voice-row>' +
  '<label>Voice <select data-voice-name aria-label="Speaking voice"><option value="">Browser default</option></select></label>' +
  '<label>Speed <select data-voice-rate aria-label="Speaking speed">' +
  '<option value="0.85">0.85×</option><option value="0.92" selected>0.92×</option><option value="1">1×</option>' +
  '<option value="1.08">1.08×</option></select></label>' +
  '<label>Pitch <select data-voice-pitch aria-label="Speaking pitch">' +
  '<option value="0.9">Lower</option><option value="0.95" selected>Calm</option><option value="1">Even</option><option value="1.05">Brighter</option></select></label>' +
  '</div></div>' +
  '<div class="cg-offers" data-offers></div>' +
  '<div class="cg-log" role="log" aria-label="Messages"></div>' +
  '<details class="cg-more"><summary>Sound and type size</summary>' +
  '<div class="cg-tools">' +
  '<button type="button" data-font-dec aria-label="Smaller text">A−</button>' +
  '<button type="button" data-font-inc aria-label="Larger text">A+</button>' +
  '<button type="button" data-voice aria-pressed="false" aria-label="Read answers aloud">Read chat</button>' +
  '<button type="button" data-voice-pause>Pause</button>' +
  '<button type="button" data-voice-resume>Resume</button>' +
  '<button type="button" data-voice-stop>Stop</button>' +
  '</div>' +
  '<label class="cg-amb">Sound theme <select data-ambience aria-label="Sound theme">' +
  '<option value="" selected>Off</option><option value="pad">Soft pad</option><option value="rain">Soft rain</option></select></label>' +
  '</details>' +
  '<section class="cg-talk" data-talk hidden>' +
  '<p class="cg-talk-status" data-talk-status>Voice input is ready when this browser supports it.</p>' +
  '<p class="cg-transcript" data-transcript aria-live="polite"></p>' +
  '<p class="cg-spoken" data-spoken hidden></p>' +
  '<div class="cg-talk-actions">' +
  '<button type="button" data-talk-send>Send what I said</button>' +
  '<button type="button" data-talk-close>Close voice input</button></div>' +
  '<p class="cg-talk-fallback" data-talk-fallback hidden>This browser has no speech recognition. Type in the box. Read-aloud still uses the speech voices this browser offers.</p></section>' +
  '<ol class="cg-outline" data-outline hidden></ol>' +
  '<div class="cg-live" aria-live="polite" aria-atomic="true"></div>' +
  '<div class="cg-chips" role="group" aria-label="Quick replies"></div>' +
  '<form class="cg-form"><button type="button" class="cg-mic" data-mic hidden aria-label="Voice input">Mic</button>' +
  '<input type="text" aria-label="Ask about this page" placeholder="Ask about this page" autocomplete="off">' +
  '<button type="submit">Send</button></form>' +
  '<span class="cg-pointer" aria-hidden="true"></span>';

var tourLayer = document.createElement("div");
tourLayer.className = "cg-tour";
tourLayer.hidden = true;
tourLayer.innerHTML =
  '<div class="cg-tour-back" data-tour-end></div>' +
  '<div class="cg-spot" hidden></div>' +
  '<div class="cg-callout" role="dialog" aria-modal="true" aria-label="Page tour">' +
  '<p></p><div class="cg-callout-actions"><button type="button" data-tour-next>Next</button>' +
  '<button type="button" data-tour-end>Done</button></div></div>';

host.appendChild(nudge);
host.appendChild(monkey);
host.appendChild(panel);
host.appendChild(tourLayer);
document.body.appendChild(host);

var css = document.createElement("link");
css.rel = "stylesheet";
css.href = guideBase + "guide/guide.css?v=21";
document.head.appendChild(css);

var log = panel.querySelector(".cg-log");
var live = panel.querySelector(".cg-live");
var chipRow = panel.querySelector(".cg-chips");
var form = panel.querySelector(".cg-form");
var input = form.querySelector("input");
var voiceBtn = panel.querySelector("[data-voice]");
var voiceRow = panel.querySelector("[data-voice-row]");
var voiceName = panel.querySelector("[data-voice-name]");
var voiceRate = panel.querySelector("[data-voice-rate]");
var voicePitch = panel.querySelector("[data-voice-pitch]");
var micBtn = panel.querySelector("[data-mic]");
var talk = panel.querySelector("[data-talk]");
var talkStatus = panel.querySelector("[data-talk-status]");
var transcriptEl = panel.querySelector("[data-transcript]");
var spokenEl = panel.querySelector("[data-spoken]");
var talkFallback = panel.querySelector("[data-talk-fallback]");
var tourState = null;
var targetEl = null;
var greetedPath = "";
var fontScale = loadFontScale();
var voicePref = loadVoice();
var recognition = null;

installApi();
streakDays();
syncFont();
place();
bind();
resumeTour();
scheduleNudge();

function baseUrl() {
  var nodes = document.querySelectorAll("script[src]");
  for (var i = 0; i < nodes.length; i += 1) {
    var src = nodes[i].src || "";
    var at = src.indexOf("guide/guide.js");
    if (at !== -1) return src.slice(0, at);
  }
  return new URL("./", location.href).href;
}

function abs(href) {
  if (!href) return "";
  if (/^(https?:|mailto:)/i.test(href)) return href;
  if (/^\s*javascript:/i.test(href)) return "";
  try {
    return new URL(String(href).replace(/^\//, ""), guideBase || location.href).href;
  } catch (error) {
    return "";
  }
}

function motionReduced() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  return document.documentElement.dataset.motion === "reduce";
}

function loadFontScale() {
  try {
    var saved = Number(sessionStorage.getItem("cg-font"));
    if (saved >= 0.85 && saved <= 1.4) return saved;
  } catch (error) { /* keep the page size */ }
  return 1;
}

function syncFont() {
  var base = parseFloat(getComputedStyle(document.body).fontSize) || 16.5;
  host.style.fontSize = (base * fontScale) + "px";
}

function stepFont(dir) {
  var steps = [0.9, 1, 1.12, 1.28];
  var index = 0;
  steps.forEach(function (step, at) {
    if (Math.abs(step - fontScale) < 0.05) index = at;
  });
  index = Math.max(0, Math.min(steps.length - 1, index + dir));
  fontScale = steps[index];
  try { sessionStorage.setItem("cg-font", String(fontScale)); } catch (error) { /* page size still applies */ }
  syncFont();
}

function fileOf(href) {
  var clean = String(href || "").split("#")[0].split("?")[0];
  var parts = clean.split("/");
  var last = parts[parts.length - 1];
  return last || "index.html";
}

function hereFile() {
  var last = location.pathname.split("/").pop();
  return last || "index.html";
}

function context() {
  var recording = null;
  var audios = document.querySelectorAll("audio");
  for (var i = 0; i < audios.length; i += 1) {
    if (!audios[i].paused && !audios[i].ended) {
      var slot = audios[i].closest(".audio-slot, [data-audio-player], .lab-audio");
      var heading = slot && slot.querySelector("h3, p");
      recording = {
        title: heading ? heading.textContent.trim() : "Recording",
        src: audios[i].currentSrc || ""
      };
      break;
    }
  }
  return {
    room: document.body.getAttribute("data-room") || "",
    roomTitle: document.body.getAttribute("data-room-title") || "",
    page: hereFile(),
    section: visibleSection(),
    recording: recording,
    streak: streakDays(),
    today: new Date().toISOString().slice(0, 10)
  };
}

function visibleSection() {
  var sections = document.querySelectorAll("main section[id], article section[id]");
  var best = "";
  var bestTop = Infinity;
  for (var i = 0; i < sections.length; i += 1) {
    var rect = sections[i].getBoundingClientRect();
    if (rect.bottom > 90 && rect.top < 180) return sections[i].id;
    if (rect.top >= 0 && rect.top < bestTop) {
      bestTop = rect.top;
      best = sections[i].id;
    }
  }
  return best;
}

function loadSession() {
  try {
    var saved = JSON.parse(sessionStorage.getItem("cg-session") || "null");
    if (saved && typeof saved === "object" && saved.seen) return saved;
  } catch (error) {
    return blankSession();
  }
  return blankSession();
}

function saveSession() {
  try {
    sessionStorage.setItem("cg-session", JSON.stringify(session));
  } catch (error) {
    return;
  }
}

function streakDays() {
  var today = new Date().toISOString().slice(0, 10);
  var days = [];
  try {
    days = JSON.parse(localStorage.getItem("cg-days") || "[]");
  } catch (error) {
    days = [];
  }
  if (days.indexOf(today) === -1) days.push(today);
  days = days.slice(-30);
  try {
    localStorage.setItem("cg-days", JSON.stringify(days));
  } catch (error) {
    return 1;
  }
  var have = {};
  days.forEach(function (day) { have[day] = 1; });
  var streak = 0;
  var cursor = new Date(today + "T00:00:00Z");
  while (have[cursor.toISOString().slice(0, 10)]) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function loadVoice() {
  var pref = { on: false, rate: "0.92", pitch: "0.95", uri: "" };
  try {
    var saved = JSON.parse(localStorage.getItem("cg-voice") || "null");
    if (saved && typeof saved === "object") {
      pref.on = !!saved.on;
      if (saved.rate) pref.rate = String(saved.rate);
      if (saved.pitch) pref.pitch = String(saved.pitch);
      if (saved.uri) pref.uri = saved.uri;
    }
  } catch (error) {
    return pref;
  }
  return pref;
}

function saveVoice() {
  try {
    localStorage.setItem("cg-voice", JSON.stringify(voicePref));
  } catch (error) {
    return;
  }
}

function ensureKb() {
  if (kbPromise) return kbPromise;
  kbPromise = fetch(guideBase + "guide/kb/index.json")
    .then(function (res) { if (!res.ok) throw new Error("kb"); return res.json(); })
    .then(function (index) {
      var names = ["rooms.json", "quizzes.json", "cards.json", "lessons.json", "tours.json"].concat(index.factFiles || []);
      var parts = { index: index };
      var chain = Promise.resolve();
      names.forEach(function (name) {
        chain = chain.then(function () {
          return fetch(guideBase + "guide/kb/" + name).then(function (res) {
            if (!res.ok) throw new Error(name);
            return res.json();
          }).then(function (json) {
            parts[name] = json;
            return new Promise(function (resolve) { window.setTimeout(resolve, 0); });
          });
        });
      });
      return chain.then(function () {
        parts.rooms = parts["rooms.json"];
        parts.quizzes = parts["quizzes.json"];
        parts.cards = parts["cards.json"];
        parts.lessons = parts["lessons.json"];
        parts.tours = parts["tours.json"];
        guide = createGuide(mergeKb(parts));
        return guide;
      });
    })
    .catch(function (error) {
      kbPromise = null;
      throw error;
    });
  return kbPromise;
}

function installApi() {
  var api = window.CANON_GUIDE || {};
  if (!("endpoint" in api)) api.endpoint = null;
  api.endpointNote = "Leave endpoint null. Set a URL later to POST {message, href, context} only when local notes have no match.";
  api.askLocal = function (message, ctx) {
    return ensureKb().then(function (ready) {
      return ready.route(message, blankSession(), ctx || context()).reply;
    });
  };
  api.ask = function (message) {
    return ask(message).then(function (reply) { return reply; });
  };
  window.CANON_GUIDE = api;
}

function ask(message) {
  var ctx = context();
  return ensureKb().then(function (ready) {
    var local = ready.route(message, session, ctx);
    session = local.session;
    saveSession();
    var endpoint = window.CANON_GUIDE && window.CANON_GUIDE.endpoint;
    if (!endpoint || local.reply.kind !== "fallback") return local.reply;
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message, href: location.href, context: ctx })
    }).then(function (res) {
      if (!res.ok) throw new Error("endpoint");
      return res.json();
    }).then(function (data) {
      if (!data || typeof data.text !== "string" || !data.text) return local.reply;
      return {
        kind: "answer",
        text: "From the connected agent, not from the local notes: " + data.text,
        href: typeof data.href === "string" ? data.href : "",
        links: Array.isArray(data.links) ? data.links : [],
        chips: local.reply.chips,
        localOnly: false
      };
    }).catch(function () {
      return local.reply;
    });
  });
}

function focusables(root) {
  return Array.prototype.slice.call(root.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])")).filter(function (el) {
    return !el.hidden && el.offsetParent !== null;
  });
}

function trap(event, root) {
  if (event.key !== "Tab") return;
  var nodes = focusables(root);
  if (!nodes.length) return;
  var first = nodes[0];
  var last = nodes[nodes.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function scrollLog() {
  log.scrollTop = log.scrollHeight;
}

function say(text, links, who) {
  var bubble = document.createElement("div");
  bubble.className = "cg-bubble " + (who === "user" ? "is-user" : "is-bot");
  var body = document.createElement("p");
  bubble.appendChild(body);
  log.appendChild(bubble);
  scrollLog();
  function finish() {
    var usable = (links || []).filter(function (link) { return link && link.href; });
    if (usable.length) {
      var nav = document.createElement("p");
      nav.className = "cg-links";
      usable.forEach(function (link, index) {
        if (index) nav.appendChild(document.createTextNode(" "));
        var anchor = document.createElement("a");
        anchor.href = abs(link.href);
        anchor.textContent = link.title || link.href;
        nav.appendChild(anchor);
      });
      bubble.appendChild(nav);
    }
    scrollLog();
    if (who !== "user") {
      live.textContent = text;
      speak(text);
    }
  }
  if (who === "user" || motionReduced()) {
    body.textContent = text;
    finish();
    return;
  }
  var typing = document.createElement("span");
  typing.className = "cg-typing";
  typing.setAttribute("aria-hidden", "true");
  typing.innerHTML = "<i></i><i></i><i></i>";
  body.appendChild(typing);
  window.setTimeout(function () {
    body.textContent = text;
    finish();
  }, 220);
}

function setChips(labels, extra) {
  chipRow.innerHTML = "";
  (labels || []).concat(extra || []).forEach(function (label) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "cg-chip" + (label === "Start the 1-hour course" ? " is-course" : "");
    button.textContent = label;
    button.addEventListener("click", function () {
      submitText(label);
    });
    chipRow.appendChild(button);
  });
}

function deliver(reply) {
  if (!reply) return;
  if (reply.correct === true) setPose("yes");
  else if (reply.correct === false) setPose("no");
  else if (reply.kind === "fallback") setPose("think");
  else setPose("greet");
  if (reply.kind === "voice") applyVoice(reply.voice === "on");
  if (reply.kind === "tour" && reply.tour) {
    say(reply.text, reply.links, "bot");
    setChips(reply.chips, reply.extraChips);
    beginTour(reply.tour.steps || [], 0);
    return;
  }
  say(reply.text, reply.links, "bot");
  if (reply.follow) {
    say(reply.follow.text, reply.follow.links, "bot");
    setChips(reply.follow.chips || reply.chips, reply.follow.extraChips || reply.extraChips);
    return;
  }
  setChips(reply.chips, reply.extraChips);
}

function pageClip() {
  var title = document.body.getAttribute("data-room-title") || document.querySelector("h1");
  var name = title && title.textContent ? title.textContent.trim() : String(title || document.title);
  var lede = document.querySelector("main .lede, .world-lede");
  var bits = [];
  document.querySelectorAll(".takeaways li").forEach(function (li, index) {
    if (index < 3) bits.push(li.textContent.replace(/\s+/g, " ").trim());
  });
  var line = "One-minute clip for " + name + ". ";
  if (lede) line += lede.textContent.replace(/\s+/g, " ").trim() + " ";
  if (bits.length) line += bits.join(" ");
  else line += "Open Start here, then a room. I only read what is already on the page.";
  say(line, [{ href: "start.html", title: "Start here" }], "bot");
}

function pageTrailer() {
  var names = [];
  document.querySelectorAll(".track-card h2, .track-code").forEach(function (node) {
    var text = node.textContent.replace(/\s+/g, " ").trim();
    if (text && names.length < 8) names.push(text);
  });
  var line = names.length
    ? "Ten-minute trailer. The tracks on this page are: " + names.join(". ") + ". Start with the first track, then a ladder, then SDP. Each room has a diagram, a worked example, and a quiz."
    : "Ten-minute trailer. Start with what SIP is for, then a ladder, then SDP and RTP. Vendor menus come after the trace. I do not add facts that are not in the rooms.";
  say(line, [{ href: "start.html", title: "Start here" }, { href: "index.html#rooms", title: "All rooms" }], "bot");
}

function submitText(text) {
  var value = String(text || "").trim();
  if (!value) return;
  hideNudge(false);
  if (/^read along$/i.test(value) || /read this page/i.test(value)) {
    say(value, [], "user");
    startAlong();
    return;
  }
  if (/1-minute clip/i.test(value)) {
    say(value, [], "user");
    pageClip();
    return;
  }
  if (/10-minute trailer/i.test(value)) {
    say(value, [], "user");
    pageTrailer();
    return;
  }
  if (/mute me and just read/i.test(value)) {
    say(value, [], "user");
    applyVoice(false);
    say("Voice stays off. Read the page. The Help room explains the menu, the course, and downloads.", [{ href: "help.html", title: "Help" }], "bot");
    return;
  }
  if (/1-hour guided walk/i.test(value)) value = "Start the 1-hour course";
  if (/teach me this room/i.test(value)) value = "Teach me this room";
  if (/interview practice/i.test(value)) {
    say(value, [], "user");
    say("Interview practice lives on the interview page. The answers there are generic study examples with citations. I do not invent anyone's work history.", [{ href: "interviews.html", title: "Interview prep" }], "bot");
    return;
  }
  say(value, [], "user");
  setPose("think");
  var pending = document.createElement("div");
  pending.className = "cg-bubble is-bot";
  pending.innerHTML = '<p><span class="cg-typing" aria-hidden="true"><i></i><i></i><i></i></span></p>';
  log.appendChild(pending);
  scrollLog();
  ask(value).then(function (reply) {
    pending.remove();
    deliver(reply);
  }).catch(function () {
    pending.remove();
    say("I couldn't read the study notes in this browser, so I won't guess.", [{ href: "glossary.html", title: "Glossary" }], "bot");
  });
}

function openPanel() {
  panel.hidden = false;
  monkey.setAttribute("aria-expanded", "true");
  hideNudge(false);
  if (greetedPath !== location.pathname) {
    greetedPath = location.pathname;
    setPose("greet");
    say("Welcome to CypherMonkey Labs, I'm your SIP guide. I only repeat the notes in this lab.", [], "bot");
    var choices = [
      ["Finish in 10 minutes", "Play the 10-minute trailer", "film"],
      ["Full course", "Start the 1-hour guided walk", "clock"],
      ["Just download", "Open cheat codes", "spark"],
      ["Cheat codes", "Open cheat codes", "spark"],
      ["Quiz me", "Quiz me", "quiz"],
      ["Teach me this room", "Teach me this room", "book"],
      ["Interview practice", "Interview practice", "mic"],
      ["Games", "Play a game", "game"],
      ["Read this page", "Read this page", "read"],
      ["Mute me and just read", "Mute me and just read", "mute"]
    ];
    var row = document.createElement("div");
    row.className = "cg-choices";
    choices.forEach(function (choice) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "cg-choice cg-choice-" + choice[2];
      button.innerHTML = choiceIcon(choice[2]) + "<span>" + choice[0] + "</span>";
      button.addEventListener("click", function () {
        if (choice[0] === "Cheat codes" || choice[0] === "Just download") {
          location.href = abs("downloads.html");
          return;
        }
        if (choice[0] === "Full course") {
          location.href = abs("index.html#rooms");
          return;
        }
        if (choice[0] === "Games") {
          location.href = abs("play.html");
          return;
        }
        if (choice[0] === "Read this page") {
          startAlong();
          return;
        }
        submitText(choice[1]);
      });
      row.appendChild(button);
    });
    panel.querySelector("[data-offers]").appendChild(row);
    scrollLog();
  }
  host.classList.toggle("is-open", true);
  input.focus();
  place();
}

function closePanel() {
  if (panel.hidden) return;
  panel.hidden = true;
  host.classList.remove("is-open");
  host.classList.remove("is-sheet");
  monkey.setAttribute("aria-expanded", "false");
  monkey.focus();
  place();
}

function boop() {
  monkey.classList.remove("is-boop");
  void monkey.offsetWidth;
  monkey.classList.add("is-boop");
}

function applyVoice(on) {
  voicePref.on = !!on;
  saveVoice();
  voiceBtn.setAttribute("aria-pressed", voicePref.on ? "true" : "false");
  if (voiceRow) voiceRow.hidden = false;
  if (!voicePref.on && window.speechSynthesis && !along.active) window.speechSynthesis.cancel();
  fillVoices();
}

function voiceRank(voice) {
  var name = String(voice.name || "").toLowerCase();
  var lang = String(voice.lang || "").toLowerCase();
  var score = 0;
  if (lang.indexOf("en") === 0) score += 40;
  else score -= 30;
  if (/natural|neural|enhanced|premium|online/.test(name)) score += 55;
  if (/aria|jenny|guy|sonia|libby|ryan|sara|michelle|emma|brian|andrew|ava|serena/.test(name)) score += 36;
  if (/samantha|daniel|karen|moira|fiona|alex|victoria|allison/.test(name)) score += 16;
  if (/compact|espeak|zarvox|bad news|bells|boing/.test(name)) score -= 40;
  if (voice.localService === false) score += 10;
  return score;
}

function fillVoices() {
  if (!window.speechSynthesis || !voiceName) return;
  var voices = window.speechSynthesis.getVoices().slice().sort(function (a, b) { return voiceRank(b) - voiceRank(a); });
  if (!voices.length) {
    if (!voiceName.options.length) {
      var fallback = document.createElement("option");
      fallback.value = "";
      fallback.textContent = "Browser default";
      voiceName.appendChild(fallback);
    }
    return;
  }
  var current = voiceName.value || voicePref.uri;
  voiceName.innerHTML = "";
  voices.forEach(function (voice) {
    var option = document.createElement("option");
    option.value = voice.voiceURI;
    option.textContent = voice.name + " (" + voice.lang + ")";
    voiceName.appendChild(option);
  });
  var match = voices.some(function (voice) { return voice.voiceURI === current; });
  voiceName.value = match ? current : voices[0].voiceURI;
  voicePref.uri = voiceName.value;
  if (!voicePref.rate) voicePref.rate = "0.92";
  if (!voicePref.pitch) voicePref.pitch = "0.95";
  saveVoice();
}

function splitSentences(text) {
  return String(text || "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).filter(function (part) { return part.length > 0; });
}

function showSpoken(parts, index) {
  if (!spokenEl) return;
  spokenEl.hidden = false;
  spokenEl.innerHTML = parts.map(function (part, at) {
    return (at === index ? "<mark>" : "<span>") + part.replace(/[&<>]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch];
    }) + (at === index ? "</mark>" : "</span>");
  }).join(" ");
}

function chosenVoice() {
  var voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  var chosen = null;
  voices.forEach(function (voice) {
    if (!chosen && voice.voiceURI === voicePref.uri) chosen = voice;
  });
  if (!chosen && voices.length) {
    voices = voices.slice().sort(function (a, b) { return voiceRank(b) - voiceRank(a); });
    chosen = voices[0];
  }
  return chosen;
}

function speak(text) {
  if (along.active) return;
  if (!voicePref.on || !window.speechSynthesis) return;
  var parts = splitSentences(text);
  if (!parts.length) return;
  window.speechSynthesis.cancel();
  var voice = chosenVoice();
  var rate = Number(voicePref.rate || (voiceRate && voiceRate.value) || 0.92);
  var pitch = Number(voicePref.pitch || (voicePitch && voicePitch.value) || 0.95);
  var index = 0;
  function next() {
    if (!voicePref.on || index >= parts.length) {
      if (spokenEl) spokenEl.hidden = true;
      setPose("idle");
      return;
    }
    showSpoken(parts, index);
    var utter = new SpeechSynthesisUtterance(parts[index]);
    utter.rate = rate > 0 ? rate : 0.92;
    utter.pitch = pitch > 0 ? pitch : 0.95;
    if (voice) utter.voice = voice;
    utter.onend = function () { index += 1; next(); };
    utter.onerror = function () { if (spokenEl) spokenEl.hidden = true; };
    window.speechSynthesis.speak(utter);
  }
  next();
}

function setupMic() {
  var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  micBtn.hidden = false;
  if (!Rec) {
    recognition = null;
    return;
  }
  recognition = new Rec();
  recognition.lang = document.documentElement.lang || "en-US";
  recognition.interimResults = true;
  recognition.onresult = function (event) {
    var said = "";
    for (var i = 0; i < event.results.length; i += 1) {
      said += event.results[i][0].transcript + " ";
    }
    said = said.trim();
    if (transcriptEl) transcriptEl.textContent = said;
    input.value = said;
    setPose("listen");
  };
  recognition.onend = function () {
    micBtn.setAttribute("aria-pressed", "false");
    if (talkStatus && !talk.hidden) talkStatus.textContent = "Stopped. Send the transcript or tap the mic again.";
  };
  recognition.onerror = function () {
    if (talkStatus) talkStatus.textContent = "The mic did not start. Type in the box instead.";
    if (talkFallback) talkFallback.hidden = false;
  };
}

function onScreen(el) {
  if (!el || el.hidden || el.closest(".cg-root")) return null;
  if (el.matches(".v4-toc, .toc, .section-dock") && !el.querySelector("a, button")) return null;
  var style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none") return null;
  var rect = el.getBoundingClientRect();
  if (rect.width < 12 || rect.height < 12) return null;
  if (rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) return null;
  return rect;
}

function overlap(a, b, pad) {
  return a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
}

var placeQueued = false;
function queuePlace() {
  if (placeQueued) return;
  placeQueued = true;
  window.requestAnimationFrame(function () {
    placeQueued = false;
    place();
  });
}

function obstacleBoxes() {
  var boxes = [];
  var selectors = [
    ".topbar", ".nav-panel", ".phone-dock", ".phone-menu", ".phone-menu-btn",
    ".site-footer", ".lab-footer", ".v4-toc", ".toc", ".section-dock",
    ".hud-panel", ".hud-sheet-toggle", ".to-top", ".settings-panel",
    ".uni-menu", ".lab-links", ".v4-sidebar", ".monkey", ".monkey-note",
    ".v4-suggest", ".theme-pop", ".v4-menu"
  ];
  selectors.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (selector === ".to-top" && !el.classList.contains("show")) return;
      var rect = onScreen(el);
      if (rect) boxes.push(rect);
    });
  });
  return boxes;
}

function boxAt(right, bottom, width, height) {
  return {
    left: window.innerWidth - right - width,
    right: window.innerWidth - right,
    top: window.innerHeight - bottom - height,
    bottom: window.innerHeight - bottom
  };
}

function fits(box, boxes) {
  if (box.left < 6 || box.top < 6 || box.right > window.innerWidth - 6 || box.bottom > window.innerHeight - 6) return false;
  return !boxes.some(function (obstacle) { return overlap(box, obstacle, 14); });
}

function findSlot(monkeyBox, boxes) {
  var heights = [480, 440, 420, 380];
  var anchors = [
    { bottom: window.innerHeight - (monkeyBox.top - 18), right: window.innerWidth - monkeyBox.right },
    { bottom: window.innerHeight - monkeyBox.bottom, right: window.innerWidth - (monkeyBox.left - 16) }
  ];
  var anchorIndex = 0;
  var shift = 0;
  var heightIndex = 0;
  for (anchorIndex = 0; anchorIndex < anchors.length; anchorIndex += 1) {
    for (shift = 0; shift <= 320; shift += 32) {
      for (heightIndex = 0; heightIndex < heights.length; heightIndex += 1) {
        var right = anchors[anchorIndex].right + shift;
        var bottom = anchors[anchorIndex].bottom;
        var width = Math.min(380, window.innerWidth - right - 8);
        var height = heights[heightIndex];
        if (width < 240) continue;
        var slot = boxAt(right, bottom, width, height);
        if (overlap(slot, monkeyBox, 2)) continue;
        if (!fits(slot, boxes)) continue;
        return { right: right, bottom: bottom, width: width, height: height, side: anchorIndex === 0 ? "above" : "beside" };
      }
    }
  }
  return null;
}

function contentBoxes() {
  var boxes = [];
  document.querySelectorAll(".world-title, .world-lede, .world-kicker, .hero-copy, .hero-actions, main h1, main h2").forEach(function (el) {
    var rect = onScreen(el);
    if (rect) boxes.push(rect);
  });
  return boxes;
}

function dockBottom() {
  var saved = null;
  try {
    var data = JSON.parse(localStorage.getItem("cg-dock") || "null");
    /* The old vertical-only spot is ignored. dragbot.js saves the new one. */
  } catch (error) { saved = null; }
  var dock = 0;
  if (window.matchMedia("(max-width: 720px)").matches) {
    var bar = document.querySelector(".phone-dock");
    if (bar && getComputedStyle(bar).display !== "none") dock = Math.round(bar.getBoundingClientRect().height) || 84;
  }
  var bottom = saved == null ? dock + 28 : saved;
  if (bottom < dock + 12) bottom = dock + 12;
  var max = Math.max(dock + 12, window.innerHeight - monkeySize().height - 8);
  if (bottom > max) bottom = max;
  return bottom;
}

function monkeySize() {
  if (window.matchMedia("(max-width: 430px)").matches) return { width: 48, height: 56 };
  if (window.matchMedia("(max-width: 720px)").matches) return { width: 156, height: 184 };
  return { width: 200, height: 236 };
}

function phoneDockHeight() {
  if (!window.matchMedia("(max-width: 720px)").matches) return 0;
  var bar = document.querySelector(".phone-dock");
  if (!bar || getComputedStyle(bar).display === "none") return 0;
  return Math.round(bar.getBoundingClientRect().height) || 84;
}

function syncMenuHide() {
  var away = document.body.classList.contains("edge-open") || document.body.classList.contains("phone-menu-open");
  host.classList.toggle("is-menu-away", away);
}

function intersects(a, b, pad) {
  return a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
}

function placeGreeting() {
  var phone = window.matchMedia("(max-width: 720px)").matches;
  var monkeyW = phone ? 148 : 200;
  var monkeyH = phone ? 172 : 236;
  var cardW = Math.min(phone ? 230 : 420, window.innerWidth - monkeyW - 28);
  if (!phone) cardW = Math.min(420, window.innerWidth - 24);
  var cardH = Math.max(112, Math.round(nudge.getBoundingClientRect().height) || 140);
  var dock = phoneDockHeight();
  if (phone && dock < 64) dock = 76;
  if (phone) {
    var cardFixed = 150;
    var cardTop = window.innerHeight - dock - cardFixed - 8;
    var cardWidth = Math.max(168, window.innerWidth - monkeyW - 22);
    host.dataset.greetLayout = "overlay";
    host.style.setProperty("--cg-greet-card-left", "10px");
    host.style.setProperty("--cg-greet-card-top", Math.round(cardTop) + "px");
    host.style.setProperty("--cg-greet-card-width", Math.round(cardWidth) + "px");
    host.style.setProperty("--cg-greet-left", Math.round(window.innerWidth - monkeyW - 8) + "px");
    host.style.setProperty("--cg-greet-top", Math.round(cardTop + cardFixed - monkeyH - 14) + "px");
    return;
  }
  var obstacles = [];
  document.querySelectorAll(".track-tile, .hud-panel, .hud-stats, .uni-menu a, .hero-actions a, .stat, .world-title, .world-lede, .canon-banner, .topbar, .phone-dock, .hero-live h1").forEach(function (el) {
    var rect = el.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    obstacles.push(rect);
  });
  function clearOf(box) {
    return !obstacles.some(function (ob) { return intersects(box, ob, 8); });
  }
  var layout = "stack";
  var stackW = Math.max(phone ? cardW : Math.min(420, window.innerWidth - 24), monkeyW);
  var stackCardW = phone ? cardW : Math.min(420, window.innerWidth - 24);
  var stackH = monkeyH + 8 + cardH;
  var cols = [12, Math.round((window.innerWidth - stackW) / 2), Math.round(window.innerWidth - stackW - 12)];
  var chosen = null;
  var y = window.innerHeight - dock - stackH - 12;
  var guard = 0;
  while (!chosen && y > 64 && guard < 24) {
    var c;
    for (c = 0; c < cols.length && !chosen; c += 1) {
      var left = Math.max(8, Math.min(cols[c], window.innerWidth - stackW - 8));
      var box = { left: left, top: y, right: left + stackW, bottom: y + stackH };
      if (clearOf(box)) chosen = { left: left, top: y, layout: "stack", cardW: stackCardW, monkeyW: monkeyW, monkeyH: monkeyH };
    }
    y -= 28;
    guard += 1;
  }
  if (!chosen) {
    var rowTop = Math.max(72, window.innerHeight - dock - Math.max(monkeyH, cardH) - 12);
    var rowCardW = Math.max(160, window.innerWidth - monkeyW - 28);
    var rowBox = { left: 8, top: rowTop, right: window.innerWidth - 8, bottom: rowTop + Math.max(monkeyH, cardH) };
    layout = "row";
    chosen = clearOf(rowBox) ? { left: 8, top: rowTop, layout: "row", cardW: rowCardW, monkeyW: monkeyW, monkeyH: monkeyH } : { left: 8, top: rowTop, layout: "row", cardW: rowCardW, monkeyW: monkeyW, monkeyH: monkeyH };
  } else layout = "stack";
  host.dataset.greetLayout = chosen.layout;
  if (chosen.layout === "row") {
    host.style.setProperty("--cg-greet-left", Math.round(window.innerWidth - chosen.monkeyW - 10) + "px");
    host.style.setProperty("--cg-greet-top", Math.round(chosen.top) + "px");
    host.style.setProperty("--cg-greet-card-left", "10px");
    host.style.setProperty("--cg-greet-card-top", Math.round(chosen.top + Math.max(0, (chosen.monkeyH - cardH) / 2)) + "px");
    host.style.setProperty("--cg-greet-card-width", Math.round(chosen.cardW) + "px");
    return;
  }
  host.style.setProperty("--cg-greet-left", Math.round(chosen.left + (stackW - chosen.monkeyW) / 2) + "px");
  host.style.setProperty("--cg-greet-top", Math.round(chosen.top) + "px");
  host.style.setProperty("--cg-greet-card-left", Math.round(chosen.left + (stackW - chosen.cardW) / 2) + "px");
  host.style.setProperty("--cg-greet-card-top", Math.round(chosen.top + chosen.monkeyH + 8) + "px");
  host.style.setProperty("--cg-greet-card-width", Math.round(chosen.cardW) + "px");
}

function place() {
  syncFont();
  syncMenuHide();
  if (host.dataset.dragging === "1") return;
  if (host.classList.contains("is-greeting")) {
    placeGreeting();
    return;
  }
  var sheetNow = window.innerWidth <= 720 && !panel.hidden;
  if (host.classList.contains("is-moved") && !sheetNow) {
    // The reader parked the guide. dragbot.js owns the position and the panel slot.
    host.classList.toggle("is-compact", window.matchMedia("(max-width: 420px)").matches);
    host.classList.toggle("is-sheet", false);
    host.classList.toggle("is-open", !panel.hidden);
    return;
  }
  var boxes = obstacleBoxes();
  var story = contentBoxes();
  var size = monkeySize();
  var width = size.width;
  var height = size.height;
  var needSlot = !panel.hidden || !nudge.hidden;
  var right = 8;
  var bottom = dockBottom();
  var footerMark = document.querySelector(".brand-icons");
  if (footerMark) {
    var footerBox = footerMark.getBoundingClientRect();
    if (footerBox.top < window.innerHeight && footerBox.bottom > 0) {
      var lift = Math.round(window.innerHeight - footerBox.top + 16);
      var cap = Math.max(lift, window.innerHeight - 180);
      if (lift > bottom) bottom = Math.min(lift, cap);
    }
  }
  // Step aside, up or down, when the home spot would cover a heading's text.
  var heads = [];
  document.querySelectorAll("main h1, main h2, main h3, .hero-live h1").forEach(function (h) {
    if (h.closest(".cg-root, [hidden]")) return;
    var g = document.createRange();
    g.selectNodeContents(h);
    var r = g.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight) heads.push(r);
  });
  function coversHead(b) {
    var top = window.innerHeight - b - height, left = window.innerWidth - right - width;
    return heads.some(function (r) { return left < r.right + 6 && left + width > r.left - 6 && top < r.bottom + 6 && top + height > r.top - 6; });
  }
  if (heads.length && coversHead(bottom)) {
    var floorB = window.innerWidth <= 720 ? Math.max(12, phoneDockHeight() + 12) : 12;
    var ceilB = Math.max(floorB, window.innerHeight - height - 8);
    var bestB = null, k;
    for (k = floorB; k <= ceilB; k += 12) {
      if (coversHead(k)) continue;
      if (bestB === null || Math.abs(k - bottom) < Math.abs(bestB - bottom)) bestB = k;
    }
    if (bestB !== null) bottom = bestB;
  }
  var monkeyBox = boxAt(right, bottom, width, height);
  var chosen = { right: right, bottom: bottom, slot: needSlot ? findSlot(monkeyBox, boxes.concat(story)) : null };
  host.style.setProperty("--cg-right", chosen.right + "px");
  host.style.setProperty("--cg-bottom", chosen.bottom + "px");
  host.style.setProperty("--cg-nudge-right", (chosen.right + 4) + "px");
  host.style.setProperty("--cg-nudge-bottom", (chosen.bottom + height + 10) + "px");
  var sheet = window.innerWidth <= 720 && !panel.hidden;
  host.classList.toggle("is-sheet", sheet);
  host.classList.toggle("is-open", !panel.hidden);
  if (sheet) {
    var dockH = phoneDockHeight();
    host.style.setProperty("--cg-panel-right", "8px");
    if (dockH < 64) dockH = 76;
    var sheetGap = 12;
    host.style.setProperty("--cg-panel-bottom", (dockH + sheetGap) + "px");
    host.style.setProperty("--cg-panel-width", "calc(100vw - 16px)");
    host.style.setProperty("--cg-panel-max", "min(62vh, calc(100dvh - " + (dockH + sheetGap) + "px))");
    panel.classList.add("is-above");
    panel.classList.remove("is-beside");
  } else if (chosen.slot) {
    host.style.setProperty("--cg-panel-right", chosen.slot.right + "px");
    host.style.setProperty("--cg-panel-bottom", chosen.slot.bottom + "px");
    host.style.setProperty("--cg-panel-width", chosen.slot.width + "px");
    host.style.setProperty("--cg-panel-max", chosen.slot.height + "px");
    host.style.setProperty("--cg-nudge-right", chosen.slot.right + "px");
    host.style.setProperty("--cg-nudge-bottom", chosen.slot.bottom + "px");
    panel.classList.toggle("is-above", chosen.slot.side !== "beside");
    panel.classList.toggle("is-beside", chosen.slot.side === "beside");
  } else {
    host.style.setProperty("--cg-panel-right", chosen.right + "px");
    host.style.setProperty("--cg-panel-bottom", (chosen.bottom + height + 16) + "px");
    host.style.setProperty("--cg-panel-width", Math.min(380, window.innerWidth - chosen.right - 8) + "px");
    host.style.setProperty("--cg-panel-max", Math.max(220, window.innerHeight - chosen.bottom - height - 24) + "px");
    panel.classList.add("is-above");
    panel.classList.remove("is-beside");
  }
}

function hideNudge() {
  nudge.hidden = true;
  nudge.className = "cg-nudge";
}

function pokeStopped() {
  try { return localStorage.getItem("cg-poke-off") === "1"; } catch (error) { return true; }
}

function pokeCount() {
  try { return Number(localStorage.getItem("cg-poke-count") || "0") || 0; } catch (error) { return 3; }
}

function showPoke() {
  if (pokeStopped() || pokeCount() >= 3) return;
  if (!panel.hidden || !tourLayer.hidden || document.body.classList.contains("onboard-open") || host.classList.contains("is-greeting") || host.classList.contains("is-menu-away")) {
    window.setTimeout(showPoke, 20000);
    return;
  }
  try { localStorage.setItem("cg-poke-count", String(pokeCount() + 1)); } catch (error) { return; }
  nudge.innerHTML = "";
  nudge.className = "cg-nudge cg-poke";
  var copy = document.createElement("p");
  copy.textContent = "I can read this page with you, or stay quiet.";
  var actions = document.createElement("div");
  actions.className = "cg-nudge-actions";
  function add(label, fn) {
    var button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", fn);
    actions.appendChild(button);
  }
  add("Read this page", function () {
    hideNudge();
    startAlong();
  });
  add("Not now", function () {
    hideNudge();
    if (pokeCount() < 3 && !pokeStopped()) window.setTimeout(showPoke, 180000);
  });
  add("Stop offering", function () {
    try { localStorage.setItem("cg-poke-off", "1"); } catch (error) { /* storage off */ }
    hideNudge();
  });
  nudge.appendChild(copy);
  nudge.appendChild(actions);
  nudge.hidden = false;
  place();
}

function scheduleNudge() {
  if (pokeStopped() || pokeCount() >= 3) return;
  window.setTimeout(showPoke, 150000);
}

function beginGreet() {
  try {
    if (localStorage.getItem("cg-greet-done") === "1") return;
    localStorage.setItem("cg-greet-done", "1");
  } catch (error) { return; }
  var closed = false;
  host.classList.add("is-greeting");
  setPose("greet");
  host._finishGreet = finish;
  nudge.innerHTML = "";
  nudge.className = "cg-nudge cg-greet";
  var copy = document.createElement("p");
  copy.textContent = "Welcome to CypherMonkey Labs, I'm your SIP guide. I only repeat the notes in this lab.";
  var actions = document.createElement("div");
  actions.className = "cg-nudge-actions";
  var hear = document.createElement("button");
  hear.type = "button";
  hear.textContent = "Hear it";
  var dock = document.createElement("button");
  dock.type = "button";
  dock.textContent = "Dock on the right";
  hear.addEventListener("click", function () {
    if (!window.speechSynthesis) {
      copy.textContent = "This browser has no speech synthesis. The words stay on screen.";
      return;
    }
    window.speechSynthesis.cancel();
    var utter = new SpeechSynthesisUtterance("Welcome to CypherMonkey Labs, I'm your SIP guide. I only repeat the notes in this lab.");
    utter.rate = 0.92;
    utter.pitch = 0.95;
    var voice = chosenVoice();
    if (voice) utter.voice = voice;
    window.speechSynthesis.speak(utter);
  });
  function finish() {
    if (closed) return;
    closed = true;
    host._finishGreet = null;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    host.classList.remove("is-greeting");
    hideNudge();
    setPose("idle");
    place();
  }
  dock.addEventListener("click", finish);
  actions.appendChild(hear);
  actions.appendChild(dock);
  nudge.appendChild(copy);
  nudge.appendChild(actions);
  nudge.hidden = false;
  place();
  window.requestAnimationFrame(function () { place(); });
  window.setTimeout(finish, 8000);
}

function clearTarget() {
  if (targetEl) targetEl.classList.remove("cg-target");
  targetEl = null;
}

function findStep(step) {
  if (!step) return null;
  if (step.selector) {
    var parts = step.selector.split(",");
    for (var i = 0; i < parts.length; i += 1) {
      var el = document.querySelector(parts[i].trim());
      if (el) return el;
    }
  }
  if (step.find && step.matchText) {
    var nodes = document.querySelectorAll(step.find);
    var want = step.matchText.toLowerCase();
    for (var n = 0; n < nodes.length; n += 1) {
      if ((nodes[n].textContent || "").toLowerCase().indexOf(want) !== -1) return nodes[n].closest("article") || nodes[n];
    }
  }
  return null;
}

function placeTour() {
  if (!tourState) return;
  var step = tourState.steps[tourState.index];
  if (!step) {
    endTour();
    return;
  }
  if (fileOf(step.href) !== hereFile()) {
    try {
      sessionStorage.setItem("cg-tour", JSON.stringify({ steps: tourState.steps, index: tourState.index, at: Date.now() }));
    } catch (error) {
      return;
    }
    location.href = abs(step.href);
    return;
  }
  var el = findStep(step);
  if (!el) {
    tourState.index += 1;
    if (tourState.index >= tourState.steps.length) endTour();
    else placeTour();
    return;
  }
  clearTarget();
  targetEl = el;
  el.classList.add("cg-target");
  el.style.scrollMarginTop = "88px";
  el.style.scrollMarginBottom = "140px";
  el.scrollIntoView({ block: "center", inline: "nearest", behavior: motionReduced() ? "auto" : "smooth" });
  window.setTimeout(function () {
    if (!tourState) return;
    var rect = el.getBoundingClientRect();
    var spot = tourLayer.querySelector(".cg-spot");
    var callout = tourLayer.querySelector(".cg-callout");
    spot.hidden = false;
    spot.style.top = Math.max(8, rect.top - 6) + "px";
    spot.style.left = Math.max(8, rect.left - 6) + "px";
    spot.style.width = Math.min(rect.width + 12, window.innerWidth - 16) + "px";
    spot.style.height = Math.min(rect.height + 12, window.innerHeight - 16) + "px";
    callout.querySelector("p").textContent = step.text || "";
    var next = tourLayer.querySelector("[data-tour-next]");
    next.textContent = tourState.index === tourState.steps.length - 1 ? "Finish" : "Next";
    var top = rect.bottom + 12;
    if (top > window.innerHeight - 160) top = Math.max(12, rect.top - 160);
    callout.style.top = top + "px";
    callout.style.left = Math.max(12, Math.min(rect.left, window.innerWidth - 320)) + "px";
    next.focus();
  }, motionReduced() ? 0 : 280);
}

function beginTour(steps, index) {
  if (!steps.length) return;
  tourState = { steps: steps, index: index || 0 };
  tourLayer.hidden = false;
  hideNudge(false);
  try { sessionStorage.removeItem("cg-tour"); } catch (error) { /* keep going */ }
  placeTour();
}

function endTour() {
  tourState = null;
  tourLayer.hidden = true;
  clearTarget();
  try { sessionStorage.removeItem("cg-tour"); } catch (error) { return; }
  if (!panel.hidden) input.focus();
  else monkey.focus();
}

function resumeTour() {
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem("cg-tour") || "null"); } catch (error) { saved = null; }
  if (!saved || !saved.steps || Date.now() - saved.at > 10 * 60 * 1000) return;
  var step = saved.steps[saved.index];
  if (!step || fileOf(step.href) !== hereFile()) {
    try { sessionStorage.removeItem("cg-tour"); } catch (error) { return; }
    return;
  }
  window.setTimeout(function () { beginTour(saved.steps, saved.index); }, 350);
}

function sectionBits(section) {
  var bits = [];
  section.querySelectorAll("h1, h2, h3, p, li, dd, figcaption").forEach(function (node) {
    if (node.closest("svg, .export-bar, .studio-ideas")) return;
    var text = node.textContent.replace(/\s+/g, " ").trim();
    if (text) bits.push(text);
  });
  return bits.join(" ");
}

function collectSections() {
  var list = [];
  document.querySelectorAll("main section[id]").forEach(function (section) {
    if (section.closest(".cg-root")) return;
    var heading = section.querySelector("h1, h2, h3");
    var title = heading ? heading.textContent.replace(/\s+/g, " ").trim() : section.id;
    var sentences = splitSentences(sectionBits(section));
    if (!sentences.length) return;
    list.push({ id: section.id, title: title, el: section, sentences: sentences });
  });
  return list;
}

function clearSpokenMark() {
  if (window.CSS && CSS.highlights) CSS.highlights.delete("spoken");
  document.querySelectorAll(".is-read-along, .is-read-along-head").forEach(function (el) {
    el.classList.remove("is-read-along");
    el.classList.remove("is-read-along-head");
  });
  document.querySelectorAll(".toc a.is-reading, .cg-outline .is-reading").forEach(function (el) { el.classList.remove("is-reading"); });
}

function findRange(root, sentence) {
  var target = String(sentence || "").replace(/\s+/g, " ").trim();
  if (!target || target.length < 8) return null;
  var records = [];
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      if (!node.parentElement || node.parentElement.closest("svg, script, style, .export-bar")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  var plain = "";
  while (walker.nextNode()) {
    var value = walker.currentNode.nodeValue.replace(/\s+/g, " ");
    records.push({ node: walker.currentNode, start: plain.length, value: value, raw: walker.currentNode.nodeValue });
    plain += value;
  }
  var at = plain.indexOf(target);
  var length = target.length;
  if (at < 0) {
    var snippet = target.slice(0, 48);
    at = plain.indexOf(snippet);
    length = snippet.length;
  }
  if (at < 0) return null;
  function point(index) {
    var i;
    for (i = 0; i < records.length; i += 1) {
      var rec = records[i];
      if (index <= rec.start + rec.value.length) {
        return { node: rec.node, offset: Math.max(0, Math.min(rec.raw.length, index - rec.start)) };
      }
    }
    var last = records[records.length - 1];
    return { node: last.node, offset: last.raw.length };
  }
  var range = document.createRange();
  var start = point(at);
  var end = point(at + length);
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  return range;
}

function markSentence(section, sentence) {
  if (!(window.CSS && CSS.highlights && window.Highlight)) return;
  try {
    var range = findRange(section.el, sentence);
    if (!range) return;
    CSS.highlights.set("spoken", new Highlight(range));
  } catch (error) { /* the outline still shows the sentence */ }
}

function markSection(section) {
  clearSpokenMark();
  section.el.classList.add("is-read-along");
  var heading = section.el.querySelector("h1, h2, h3");
  if (heading) heading.classList.add("is-read-along-head");
  var link = document.querySelector('.toc a[href="#' + section.id + '"]');
  if (link) {
    link.classList.add("is-reading");
    try { link.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (error) { /* older browsers */ }
  }
  var reduce = document.documentElement.dataset.motion === "reduce" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var focus = heading || section.el;
  try { focus.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); } catch (error) { focus.scrollIntoView(); }
}

function paintOutline() {
  var list = panel.querySelector("[data-outline]");
  if (!list) return;
  list.hidden = !along.sections.length;
  list.innerHTML = "";
  along.sections.forEach(function (section, index) {
    var item = document.createElement("li");
    var button = document.createElement("button");
    button.type = "button";
    button.textContent = section.title;
    if (index === along.index) {
      button.className = "is-reading";
      item.className = "is-reading";
    }
    button.addEventListener("click", function () {
      along.active = true;
      along.paused = false;
      along.index = index;
      along.sentence = 0;
      alongToken += 1;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      speakSection();
    });
    item.appendChild(button);
    list.appendChild(item);
  });
}

function finishAlong() {
  along.active = false;
  along.paused = false;
  alongToken += 1;
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  clearSpokenMark();
  if (spokenEl) spokenEl.hidden = true;
  setPose("idle");
}

function speakSentence() {
  if (!along.active || along.paused) return;
  var section = along.sections[along.index];
  if (!section) { finishAlong(); return; }
  if (along.sentence >= section.sentences.length) {
    along.index += 1;
    along.sentence = 0;
    speakSection();
    return;
  }
  var sentence = section.sentences[along.sentence];
  markSentence(section, sentence);
  showSpoken(section.sentences, along.sentence);
  setPose("listen");
  if (!window.speechSynthesis) return;
  var token = ++alongToken;
  window.speechSynthesis.cancel();
  var utter = new SpeechSynthesisUtterance(sentence);
  var voice = chosenVoice();
  utter.rate = Number(voicePref.rate || 0.92) || 0.92;
  utter.pitch = Number(voicePref.pitch || 0.95) || 0.95;
  if (voice) utter.voice = voice;
  utter.onend = function () {
    if (token !== alongToken || !along.active || along.paused) return;
    along.sentence += 1;
    speakSentence();
  };
  window.speechSynthesis.speak(utter);
}

function speakSection() {
  if (!along.active) return;
  var section = along.sections[along.index];
  if (!section) { finishAlong(); return; }
  markSection(section);
  paintOutline();
  speakSentence();
}

function startAlong(id) {
  along.sections = collectSections();
  if (!along.sections.length) {
    say("This page has no sections I can read aloud. Open a room.", [{ href: "index.html#rooms", title: "Rooms" }], "bot");
    return;
  }
  var start = 0;
  if (id) along.sections.forEach(function (section, index) { if (section.id === id) start = index; });
  along.active = true;
  along.paused = false;
  along.index = start;
  along.sentence = 0;
  if (panel.hidden) openPanel();
  paintOutline();
  var note = window.speechSynthesis
    ? "Reading this page aloud. Pause, Resume, and Next section are the buttons above the outline."
    : "This browser has no speech synthesis. The outline still follows the section. Use Next section.";
  say(note, [], "bot");
  speakSection();
}

function stopAmbience() {
  ambience.nodes.forEach(function (node) {
    try { node.stop && node.stop(); } catch (error) { /* already stopped */ }
    try { node.disconnect(); } catch (error) { /* already disconnected */ }
  });
  ambience.nodes = [];
}

function startAmbience(name) {
  stopAmbience();
  if (!name) return;
  var Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) {
    say("This browser cannot play a generated sound theme.", [], "bot");
    return;
  }
  if (!ambience.ctx) ambience.ctx = new Ctx();
  ambience.ctx.resume();
  var gain = ambience.ctx.createGain();
  gain.gain.value = 0.02;
  gain.connect(ambience.ctx.destination);
  ambience.nodes.push(gain);
  if (name === "pad") {
    [196, 247, 294].forEach(function (freq) {
      var osc = ambience.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start();
      ambience.nodes.push(osc);
    });
    return;
  }
  var length = ambience.ctx.sampleRate * 2;
  var buffer = ambience.ctx.createBuffer(1, length, ambience.ctx.sampleRate);
  var data = buffer.getChannelData(0);
  for (var i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  var noise = ambience.ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  var filter = ambience.ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  noise.connect(filter);
  filter.connect(gain);
  noise.start();
  ambience.nodes.push(noise, filter);
}

function bind() {
  // Drag, edge snap, tilt and reset live in guide/dragbot.js. It drives the --cg-right and --cg-bottom
  // variables and calls place() again when the spot is reset.
  window.CG_PLACE = place;
  var botTag = document.querySelector("script[src*='guide/guide.js']");
  var botScript = document.createElement("script");
  botScript.src = botTag ? botTag.src.replace(/guide\.js(\?.*)?$/, "dragbot.js") : "guide/dragbot.js";
  document.body.appendChild(botScript);
  host.addEventListener("click", function (event) {
    if (!host.classList.contains("is-greeting") || typeof host._finishGreet !== "function") return;
    if (event.target.closest(".cg-monkey, .cg-nudge")) return;
    host._finishGreet();
  });
  var sheetDrag = { id: null, y: 0, h: 0 };
  var handle = panel.querySelector("[data-sheet-handle]");
  handle.addEventListener("pointerdown", function (event) {
    if (!host.classList.contains("is-sheet")) return;
    sheetDrag.id = event.pointerId;
    sheetDrag.y = event.clientY;
    sheetDrag.h = panel.getBoundingClientRect().height;
    try { handle.setPointerCapture(event.pointerId); } catch (error) { /* optional */ }
  });
  handle.addEventListener("pointermove", function (event) {
    if (sheetDrag.id !== event.pointerId) return;
    var dockH = phoneDockHeight();
    var max = Math.round(window.innerHeight * 0.6);
    var room = window.innerHeight - dockH - 16;
    if (max > room) max = room;
    var min = Math.round(window.innerHeight * 0.34);
    var next = sheetDrag.h + (sheetDrag.y - event.clientY);
    if (next < min) next = min;
    if (next > max) next = max;
    host.style.setProperty("--cg-sheet-h", Math.round(next) + "px");
  });
  handle.addEventListener("pointerup", function (event) {
    if (sheetDrag.id !== event.pointerId) return;
    sheetDrag.id = null;
  });
  handle.addEventListener("pointercancel", function () { sheetDrag.id = null; });
  monkey.addEventListener("click", function (event) {
    boop();
    if (panel.hidden) {
      openPanel();
      return;
    }
    ensureKb().then(function (ready) {
      var touched = ready.touch(session);
      session = touched.session;
      saveSession();
      deliver(touched.reply);
    }).catch(function () {
      say("I couldn't read the study notes in this browser, so I won't guess.", [], "bot");
    });
  });
  panel.querySelector("[data-close]").addEventListener("click", closePanel);
  panel.querySelector("[data-font-dec]").addEventListener("click", function () { stepFont(-1); });
  panel.querySelector("[data-font-inc]").addEventListener("click", function () { stepFont(1); });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var text = input.value;
    input.value = "";
    submitText(text);
  });
  voiceBtn.addEventListener("click", function () {
    if (!window.speechSynthesis) {
      say("Read-aloud isn't available in this browser.", [], "bot");
      return;
    }
    applyVoice(!voicePref.on);
    say(voicePref.on ? "Read-aloud is on. Pick a voice and a speed if you want." : "Read-aloud is off.", [], "bot");
  });
  voiceName.addEventListener("change", function () {
    voicePref.uri = voiceName.value;
    saveVoice();
  });
  voiceRate.addEventListener("change", function () {
    voicePref.rate = voiceRate.value;
    saveVoice();
  });
  if (voicePitch) {
    voicePitch.value = voicePref.pitch || "0.95";
    voicePitch.addEventListener("change", function () {
      voicePref.pitch = voicePitch.value;
      saveVoice();
    });
  }
  panel.querySelector("[data-voice-pause]").addEventListener("click", function () {
    if (window.speechSynthesis) window.speechSynthesis.pause();
  });
  panel.querySelector("[data-voice-resume]").addEventListener("click", function () {
    if (window.speechSynthesis) window.speechSynthesis.resume();
  });
  panel.querySelector("[data-voice-stop]").addEventListener("click", function () {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (spokenEl) spokenEl.hidden = true;
    setPose("idle");
  });
  if (window.speechSynthesis) {
    fillVoices();
    window.speechSynthesis.addEventListener("voiceschanged", fillVoices);
    voiceRate.value = voicePref.rate || "0.92";
    applyVoice(voicePref.on);
  } else {
    voiceBtn.disabled = true;
    voiceBtn.title = "Read aloud isn't available in this browser.";
  }
  setupMic();
  function openTalk() {
    talk.hidden = false;
    setPose("listen");
    if (!recognition) {
      talkFallback.hidden = false;
      talkStatus.textContent = "Voice input is not in this browser. Type below and send.";
      input.focus();
      return;
    }
    talkFallback.hidden = true;
    talkStatus.textContent = "Listening. Speak, then send the transcript.";
    try {
      micBtn.setAttribute("aria-pressed", "true");
      recognition.start();
    } catch (error) {
      talkStatus.textContent = "The mic is already on, or this page blocked it. You can still type.";
    }
  }
  micBtn.addEventListener("click", openTalk);
  panel.querySelector("[data-talk-close]").addEventListener("click", function () {
    talk.hidden = true;
    if (recognition) {
      try { recognition.stop(); } catch (error) { /* already stopped */ }
    }
    micBtn.setAttribute("aria-pressed", "false");
    setPose("idle");
  });
  panel.querySelector("[data-talk-send]").addEventListener("click", function () {
    var said = (transcriptEl.textContent || input.value || "").trim();
    if (!said) {
      talkStatus.textContent = "Nothing to send yet. Speak again or type in the box.";
      return;
    }
    talk.hidden = true;
    submitText(said);
  });
  tourLayer.querySelector("[data-tour-next]").addEventListener("click", function () {
    if (!tourState) return;
    tourState.index += 1;
    if (tourState.index >= tourState.steps.length) endTour();
    else placeTour();
  });
  tourLayer.querySelectorAll("[data-tour-end]").forEach(function (button) {
    button.addEventListener("click", endTour);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Tab") {
      if (!tourLayer.hidden) trap(event, tourLayer.querySelector(".cg-callout"));
      else if (!panel.hidden) trap(event, panel);
      return;
    }
    if (event.key !== "Escape") return;
    if (!tourLayer.hidden) endTour();
    else if (!panel.hidden) closePanel();
  });
  panel.querySelector("[data-along-start]").addEventListener("click", function () { startAlong(); });
  panel.querySelector("[data-along-pause]").addEventListener("click", function () {
    along.paused = true;
    if (window.speechSynthesis) window.speechSynthesis.pause();
    setPose("think");
  });
  panel.querySelector("[data-along-resume]").addEventListener("click", function () {
    if (!along.active) { startAlong(); return; }
    along.paused = false;
    if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPose("listen");
      return;
    }
    speakSentence();
  });
  panel.querySelector("[data-along-next]").addEventListener("click", function () {
    if (!along.active) { startAlong(); return; }
    along.paused = false;
    along.index += 1;
    along.sentence = 0;
    alongToken += 1;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    speakSection();
  });
  panel.querySelector("[data-ambience]").addEventListener("change", function (event) {
    startAmbience(event.target.value);
  });
  document.addEventListener("canon-read-section", function (event) {
    var id = event.detail && event.detail.id;
    startAlong(id);
  });
  document.addEventListener("canon-tour-finished", function () { beginGreet(); });
  window.setTimeout(function () {
    var tour = "";
    try { tour = localStorage.getItem("canon-tour-done") || ""; } catch (error) { tour = ""; }
    if (tour === "1" || tour === "skip") beginGreet();
  }, 900);
  var menuWatch = new MutationObserver(syncMenuHide);
  menuWatch.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("scroll", queuePlace, { passive: true });
  window.addEventListener("resize", queuePlace);
  window.setTimeout(queuePlace, 400);
  window.setTimeout(queuePlace, 1200);
  var fontWatch = new MutationObserver(syncFont);
  fontWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class", "data-font", "data-motion"] });
  fontWatch.observe(document.body, { attributes: true, attributeFilter: ["style", "class", "data-font"] });
}

function avatarSvg() {
  return '<svg viewBox="0 0 64 64" aria-hidden="true">' +
    '<circle cx="14" cy="30" r="9" fill="#f5a524"/><circle cx="14" cy="30" r="4.5" fill="#fb7185"/>' +
    '<circle cx="50" cy="30" r="9" fill="#f5a524"/><circle cx="50" cy="30" r="4.5" fill="#fb7185"/>' +
    '<circle cx="32" cy="34" r="18" fill="#f5a524"/>' +
    '<ellipse cx="32" cy="40" rx="10" ry="8" fill="#ffe7b0"/>' +
    '<ellipse cx="25" cy="33" rx="4" ry="4.6" fill="#fff"/><ellipse cx="39" cy="33" rx="4" ry="4.6" fill="#fff"/>' +
    '<circle cx="26.2" cy="33.6" r="2" fill="#1c1917"/><circle cx="40.2" cy="33.6" r="2" fill="#1c1917"/>' +
    '<circle cx="25" cy="33" r="6.2" fill="none" stroke="#7c3aed" stroke-width="1.7"/>' +
    '<circle cx="39" cy="33" r="6.2" fill="none" stroke="#22d3ee" stroke-width="1.7"/>' +
    '<path d="M31 33h2" stroke="#7c3aed" stroke-width="1.6"/>' +
    '<path d="M26 44c2.2 2.4 9.6 2.4 12 0" fill="none" stroke="#7c2d12" stroke-width="1.8" stroke-linecap="round"/>' +
    '</svg>';
}

function choiceIcon(kind) {
  var paths = {
    clip: '<path d="M7 4.5v11l9-5.5z"/>',
    film: '<rect x="3" y="5" width="14" height="10" rx="1.5"/><path d="M3 8.5h14M3 12h14"/>',
    clock: '<circle cx="10" cy="10" r="6.5"/><path d="M10 7v3.5l2.4 1.6"/>',
    spark: '<path d="M10 2.5l1.3 4.2h4.4l-3.5 2.6 1.3 4.2L10 11.2 6.5 13.5l1.3-4.2L4.3 6.7h4.4z"/>',
    quiz: '<circle cx="10" cy="10" r="6.5"/><path d="M8 8.2a2 2 0 1 1 2.6 1.9c-.7.4-.9.8-.9 1.6M10 14.2h.01"/>',
    book: '<path d="M4 4.5h5.2v11H4zM10.8 4.5H16v11h-5.2z"/>',
    mic: '<rect x="8" y="3" width="4" height="8" rx="2"/><path d="M6.5 9.2a3.5 3.5 0 0 0 7 0M10 12.8V16"/>',
    game: '<rect x="3" y="7" width="14" height="7.5" rx="3"/><path d="M7 10.8h2.2M8.1 9.7v2.2M13 10h.01M15 11.6h.01"/>',
    read: '<path d="M3.5 5h6v10.5h-6zM10.5 5h6v10.5h-6z"/>',
    mute: '<path d="M4 8h2.8l3.4-2.6v9.2L6.8 12H4zM14 8.2l3.6 3.6M17.6 8.2 14 11.8"/>'
  };
  return '<svg class="cg-choice-ico" viewBox="0 0 20 20" aria-hidden="true">' + (paths[kind] || paths.spark) + "</svg>";
}

function monkeySvg() {
  return '<span class="cg-float" aria-hidden="true"><svg viewBox="0 0 220 260" role="img" aria-hidden="true">' +
    "<defs>" +
    '<radialGradient id="cgfur" cx="38%" cy="30%" r="78%"><stop offset="0" stop-color="#ffe08a"/><stop offset=".48" stop-color="#f5a524"/><stop offset="1" stop-color="#c2410c"/></radialGradient>' +
    '<radialGradient id="cgmuz" cx="50%" cy="28%" r="80%"><stop offset="0" stop-color="#fff7dc"/><stop offset="1" stop-color="#f0c27a"/></radialGradient>' +
    '<radialGradient id="cgear" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fecdd3"/><stop offset="1" stop-color="#e11d48"/></radialGradient>' +
    '<linearGradient id="cgglass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#7c3aed"/><stop offset="1" stop-color="#f472b6"/></linearGradient>' +
    '<linearGradient id="cgscarf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#22d3ee"/><stop offset=".34" stop-color="#a78bfa"/><stop offset=".67" stop-color="#f472b6"/><stop offset="1" stop-color="#fbbf24"/></linearGradient>' +
    "</defs>" +
    '<ellipse cx="110" cy="248" rx="58" ry="8" fill="#1e1b4b" opacity=".2"/>' +
    '<path class="cg-tail" d="M172 200c26 6 34 26 16 38-16 10-30-4-24-16" fill="none" stroke="#ea580c" stroke-width="12" stroke-linecap="round"/>' +
    '<path d="M74 168c6 22 22 48 36 52s32-16 38-40c2 22-10 52-40 56s-46-20-34-68z" fill="url(#cgfur)"/>' +
    '<path class="cg-scarf" d="M80 162h62c-2 16-16 24-32 24s-28-8-30-24z" fill="url(#cgscarf)"/>' +
    '<g class="cg-head">' +
    '<circle class="cg-ear" cx="46" cy="92" r="30" fill="url(#cgfur)"/><circle cx="46" cy="92" r="16" fill="url(#cgear)"/>' +
    '<circle class="cg-ear" cx="174" cy="92" r="30" fill="url(#cgfur)"/><circle cx="174" cy="92" r="16" fill="url(#cgear)"/>' +
    '<circle cx="110" cy="102" r="64" fill="url(#cgfur)"/>' +
    '<ellipse cx="110" cy="122" rx="38" ry="30" fill="url(#cgmuz)"/>' +
    '<ellipse cx="76" cy="116" rx="11" ry="7" fill="#fb7185" opacity=".7"/>' +
    '<ellipse cx="144" cy="116" rx="11" ry="7" fill="#fb7185" opacity=".7"/>' +
    '<g class="cg-eye"><ellipse cx="86" cy="96" rx="14" ry="16" fill="#fff"/><circle cx="90" cy="98" r="7" fill="#1c1917"/><circle cx="93" cy="95" r="2.6" fill="#fff"/></g>' +
    '<g class="cg-eye"><ellipse cx="134" cy="96" rx="14" ry="16" fill="#fff"/><circle cx="138" cy="98" r="7" fill="#1c1917"/><circle cx="141" cy="95" r="2.6" fill="#fff"/></g>' +
    '<g class="cg-glasses" fill="none" stroke="url(#cgglass)" stroke-width="5" stroke-linecap="round">' +
    '<circle cx="86" cy="96" r="20"/><circle cx="134" cy="96" r="20"/><path d="M106 96h12"/>' +
    '<path d="M66 92c-10-2-16 4-16 10M154 92c10-2 16 4 16 10"/>' +
    "</g>" +
    '<ellipse cx="110" cy="120" rx="8" ry="5.5" fill="#9a3412"/>' +
    '<path class="cg-mouth" d="M90 136c8 12 32 12 40 0" fill="none" stroke="#7c2d12" stroke-width="4" stroke-linecap="round"/>' +
    "</g>" +
    '<g class="cg-arm cg-arm-left"><path d="M76 172v40" fill="none" stroke="#ea580c" stroke-width="16" stroke-linecap="round"/>' +
    '<circle cx="76" cy="218" r="14" fill="url(#cgfur)"/><circle cx="76" cy="218" r="7" fill="url(#cgmuz)"/></g>' +
    '<g class="cg-arm cg-arm-right"><path d="M146 172v40" fill="none" stroke="#ea580c" stroke-width="16" stroke-linecap="round"/>' +
    '<circle cx="146" cy="218" r="14" fill="url(#cgfur)"/><circle cx="146" cy="218" r="7" fill="url(#cgmuz)"/></g>' +
    '<g class="cg-pop" aria-hidden="true"><path d="M186 36l2.2 6.2 6.4.2-5 4 1.8 6.2-5.4-3.6-5.4 3.6 1.8-6.2-5-4 6.4-.2z" fill="#fde047"/>' +
    '<path d="M34 40l1.6 4.4 4.6.2-3.6 2.8 1.3 4.4-3.9-2.6-3.9 2.6 1.3-4.4-3.6-2.8 4.6-.2z" fill="#22d3ee"/></g>' +
    '</svg></span>';
}

function setPose(name) {
  if (name === "yes") name = "celebrate";
  if (name === "no") name = "encourage";
  host.dataset.pose = name || "idle";
}
