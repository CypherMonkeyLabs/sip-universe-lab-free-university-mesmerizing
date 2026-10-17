/* First-open tour. Six numbered steps, stored in this browser. Help can open it again. */
(function () {
  var KEY = "canon-tour-done";
  var soundOn = false;
  var audio = null;
  var layer = null;
  var step = 0;
  var reduce = false;

  var STEPS = [
    {
      title: "Home",
      selectors: ["a.brand"],
      body: "This is Home. The name in the header brings you back to the front door, where the tracks start."
    },
    {
      title: "Menu",
      selectors: [".header-menu", "[data-open-menu]"],
      body: "Menu is the top-left button on a wide screen, and the left side of the bottom bar on a phone. It slides open. Escape, Close, or a tap outside puts it away."
    },
    {
      title: "Learn",
      selectors: [".phone-dock a[href$='index.html']", "a.section-chip[href$='index.html']", "a[href='start.html']"],
      body: "Learn opens the course. Start here, then a track, then a room. Each room has takeaways, a picture, a worked example, and a quiz."
    },
    {
      title: "Diagrams",
      selectors: [".phone-dock a[href*='diagrams.html']", "a.section-chip[href*='diagrams.html']", "a.glow-ico[href*='diagrams.html']"],
      body: "Diagrams are the moving study drawings. Open one, then use its download button if you want the SVG."
    },
    {
      title: "Play and Listen",
      selectors: [".phone-dock a[href*='play.html']", ".phone-dock [data-listen]", "a.section-chip[href*='play.html']", "[data-listen]"],
      body: "Play is the practice page. Listen reads the page with this browser's voice. Both stay buttons you can tap."
    },
    {
      title: "Downloads and the guide",
      selectors: ["a.section-chip[href*='downloads.html']", "a.glow-ico[href*='downloads.html']", ".cg-monkey"],
      body: "Downloads holds the sheets, the card deck, and the zip. The monkey on the right is the guide. After this tour it greets you once in the middle, then sits on the right edge. You can drag it and close it."
    }
  ];

  function ls(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (error) { return null; }
    return null;
  }

  function motionOff() {
    if (document.documentElement.dataset.motion === "reduce") return true;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function chime() {
    if (!soundOn || reduce) return;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audio) audio = new Ctx();
    audio.resume();
    var osc = audio.createOscillator();
    var gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = 520;
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.03, audio.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.3);
  }

  function visible(el) {
    if (!el || el.closest("[hidden]")) return false;
    var style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 8 && rect.height > 8 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
  }

  function targets() {
    var found = [];
    var selectors = STEPS[step].selectors || [];
    selectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el) {
        if (found.indexOf(el) !== -1 || !visible(el)) return;
        var scroller = el.closest(".banner-scroll");
        if (scroller) {
          var left = el.offsetLeft - 24;
          if (left < scroller.scrollLeft || left > scroller.scrollLeft + scroller.clientWidth - 80) scroller.scrollLeft = Math.max(0, left);
        }
        found.push(el);
      });
    });
    return found.slice(0, 3);
  }

  function headingBottom() {
    var heading = document.querySelector("h1");
    if (!heading) return 72;
    var rect = heading.getBoundingClientRect();
    if (rect.height < 8 || rect.bottom < 0 || rect.top > window.innerHeight) return 72;
    return rect.bottom;
  }

  function dockTop() {
    var bar = document.querySelector(".phone-dock");
    if (!bar) return window.innerHeight;
    var style = getComputedStyle(bar);
    if (style.display === "none" || style.visibility === "hidden") return window.innerHeight;
    var rect = bar.getBoundingClientRect();
    if (rect.height < 20 || rect.top >= window.innerHeight) return window.innerHeight;
    return rect.top;
  }

  function placeCard() {
    var card = layer.querySelector(".ob-card");
    var margin = 8;
    var dockGap = 12;
    var limit = dockTop();
    var below = headingBottom() + margin;
    var botCol = window.innerWidth <= 600 && document.querySelector(".cg-root") ? 72 : 0; /* keep the guide monkey's column free */
    var maxW = Math.min(420, window.innerWidth - margin * 2 - botCol);
    card.style.boxSizing = "border-box";
    card.style.width = maxW + "px";
    card.style.maxWidth = (window.innerWidth - margin * 2 - botCol) + "px";
    card.style.left = (botCol ? margin : Math.max(margin, Math.round((window.innerWidth - maxW) / 2))) + "px";
    card.style.right = "auto";
    card.style.transform = "none";
    var room = Math.max(96, limit - dockGap - below);
    card.style.maxHeight = room + "px";
    card.style.overflow = "auto";
    var cardH = Math.min(card.scrollHeight || 160, room);
    var top = limit - dockGap - cardH;
    if (top < below) top = below;
    if (top + cardH > limit - dockGap) top = Math.max(margin, limit - dockGap - cardH);
    card.style.top = Math.round(top) + "px";
    card.style.bottom = "auto";
  }

  function paintSpots(nodes) {
    layer.querySelectorAll(".ob-spot").forEach(function (spot) { spot.remove(); });
    nodes.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      var spot = document.createElement("div");
      spot.className = "ob-spot";
      spot.style.top = Math.max(4, rect.top - 6) + "px";
      spot.style.left = Math.max(4, rect.left - 6) + "px";
      spot.style.width = Math.min(window.innerWidth - 8, rect.width + 12) + "px";
      spot.style.height = rect.height + 12 + "px";
      layer.appendChild(spot);
    });
    placeCard();
  }

  function paint() {
    var card = layer.querySelector(".ob-card");
    var item = STEPS[step];
    card.querySelector("[data-ob-num]").textContent = String(step + 1);
    card.querySelector("h2").textContent = item.title;
    card.querySelector(".ob-body").textContent = item.body;
    card.querySelector("[data-ob-count]").textContent = (step + 1) + " of " + STEPS.length;
    var next = card.querySelector("[data-ob-next]");
    next.textContent = step === STEPS.length - 1 ? "OK" : "Next";
    card.querySelector("[data-ob-back]").hidden = step === 0;
    paintSpots(targets());
  }

  function close(finished) {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.body.classList.remove("onboard-open");
    if (layer) layer.remove();
    layer = null;
    if (finished === "done" || finished === "skip") {
      ls(KEY, finished === "done" ? "1" : "skip");
      document.dispatchEvent(new CustomEvent("canon-tour-finished"));
    }
  }

  function open() {
    if (layer) return;
    reduce = motionOff();
    document.body.classList.add("onboard-open");
    layer = document.createElement("div");
    layer.className = "ob-layer" + (reduce ? " is-still" : "");
    layer.setAttribute("role", "region");
    layer.setAttribute("aria-labelledby", "ob-title");
    layer.innerHTML =
      '<div class="ob-card"><p class="ob-count"><span class="ob-num" data-ob-num>1</span> <span data-ob-count></span></p><h2 id="ob-title"></h2><p class="ob-body"></p>' +
      '<div class="ob-actions">' +
      '<button type="button" data-ob-sound aria-pressed="false">Sound off</button>' +
      '<button type="button" data-ob-back hidden>Back</button>' +
      '<button type="button" data-ob-skip>Skip</button>' +
      '<button type="button" data-ob-next>Next</button></div></div>';
    document.body.appendChild(layer);
    step = 0;
    paint();
    placeCard();
    layer.addEventListener("click", function (event) {
      if (event.target.closest("[data-ob-sound]")) {
        soundOn = !soundOn;
        var button = layer.querySelector("[data-ob-sound]");
        button.setAttribute("aria-pressed", soundOn ? "true" : "false");
        button.textContent = soundOn ? "Sound on" : "Sound off";
        if (soundOn) chime();
        return;
      }
      if (event.target.closest("[data-ob-back]")) {
        if (step > 0) { step -= 1; paint(); }
        return;
      }
      if (event.target.closest("[data-ob-skip]")) {
        close("skip");
        return;
      }
      if (event.target.closest("[data-ob-next]")) {
        chime();
        if (step >= STEPS.length - 1) close("done");
        else { step += 1; paint(); }
      }
    });
    layer.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close("skip");
    });
    window.addEventListener("resize", function () {
      if (layer) paintSpots(targets());
    });
  }

  function shouldShow() {
    var params = new URLSearchParams(location.search);
    if (params.get("tour") === "1") return true;
    return !ls(KEY);
  }

  document.addEventListener("click", function (event) {
    if (!event.target.closest("[data-replay-onboard]")) return;
    event.preventDefault();
    ls(KEY, null);
    open();
  });

  if (shouldShow()) window.setTimeout(open, 400);
})();
