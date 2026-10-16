/* Offline helpers for the Canon hub, track pages, and rooms. No network. */
(function () {
  var search = document.querySelector("[data-canon-search]");
  var rows = document.querySelectorAll("[data-title]");
  var cards = document.querySelectorAll(".track-card");
  var empty = document.querySelector("[data-empty-search]");
  var count = document.querySelector("[data-search-count]");

  function applySearch() {
    if (!search) return;
    var term = search.value.trim().toLowerCase();
    var shown = 0;
    rows.forEach(function (row) {
      var hay = (row.getAttribute("data-title") + " " + (row.getAttribute("data-code") || "")).toLowerCase();
      var match = !term || hay.indexOf(term) !== -1;
      row.hidden = !match;
      if (match) shown += 1;
    });
    cards.forEach(function (card) {
      var any = false;
      card.querySelectorAll("[data-title]").forEach(function (row) {
        if (!row.hidden) any = true;
      });
      card.classList.toggle("dim", Boolean(term) && !any);
      card.hidden = Boolean(term) && !any;
    });
    if (empty) empty.classList.toggle("show", Boolean(term) && shown === 0);
    if (count) {
      count.textContent = term ? shown + " title" + (shown === 1 ? "" : "s") : rows.length + " rooms";
    }
  }

  if (search) {
    search.addEventListener("input", applySearch);
    applySearch();
  }

  var room = document.body.getAttribute("data-room");
  if (room) {
    try {
      localStorage.setItem(
        "canon-last",
        JSON.stringify({
          code: room,
          title: document.body.getAttribute("data-room-title") || document.title,
          href: location.pathname.split("/").pop() ? location.href : location.href,
          ts: new Date().toISOString()
        })
      );
    } catch (err) {
      /* private mode or blocked storage — the room still reads */
    }
  }

  var lastSlot = document.querySelector("[data-last-opened]");
  if (lastSlot) {
    try {
      var raw = localStorage.getItem("canon-last");
      if (raw) {
        var last = JSON.parse(raw);
        var link = lastSlot.querySelector("a");
        if (link && last.href && last.title) {
          link.href = last.href;
          link.textContent = (last.code ? last.code + " · " : "") + last.title;
          lastSlot.hidden = false;
        }
      }
    } catch (err) {
      lastSlot.hidden = true;
    }
  }

  var lab = document.querySelector("#lab .lab");
  if (lab && room) {
    var key = "canon-lab-" + room;
    var saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(key) || "{}");
    } catch (err) {
      saved = {};
    }
    lab.querySelectorAll("input[type=checkbox]").forEach(function (box, index) {
      if (saved[index]) {
        box.checked = true;
        box.closest("li").classList.add("checked");
      }
      box.addEventListener("change", function () {
        saved[index] = box.checked;
        box.closest("li").classList.toggle("checked", box.checked);
        try {
          localStorage.setItem(key, JSON.stringify(saved));
        } catch (err) {
          /* ignore */
        }
      });
    });
  }

  var tocLinks = document.querySelectorAll(".toc a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    tocLinks.forEach(function (link) {
      var id = (link.getAttribute("href") || "").slice(1);
      if (id) byId[id] = link;
    });
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          tocLinks.forEach(function (link) { link.classList.remove("active"); });
          var link = byId[entry.target.id];
          if (link) link.classList.add("active");
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0.01 }
    );
    document.querySelectorAll(".room-main section[id]").forEach(function (section) {
      observer.observe(section);
    });
  }

  var expand = document.querySelector("[data-expand-all]");
  if (expand) {
    expand.addEventListener("click", function () {
      var open = expand.getAttribute("data-state") !== "open";
      document.querySelectorAll("details").forEach(function (node) { node.open = open; });
      expand.setAttribute("data-state", open ? "open" : "closed");
      expand.textContent = open ? "Collapse sections" : "Expand all sections";
    });
  }

  window.addEventListener("beforeprint", function () {
    document.querySelectorAll("details").forEach(function (node) {
      node.dataset.wasOpen = node.open ? "1" : "0";
      node.open = true;
    });
  });
  window.addEventListener("afterprint", function () {
    document.querySelectorAll("details").forEach(function (node) {
      if (node.dataset.wasOpen === "0") node.open = false;
    });
  });

  var quiz = document.querySelector("#quiz");
  var quizCount = document.querySelector("[data-quiz-count]");
  if (quiz && quizCount) {
    var cards = quiz.querySelectorAll(".qcard");
    function tally() {
      var revealed = quiz.querySelectorAll(".reveal[open]").length;
      quizCount.textContent = revealed + " of " + cards.length + " revealed";
    }
    quiz.querySelectorAll(".reveal").forEach(function (node) {
      node.addEventListener("toggle", tally);
    });
    tally();
  }

  var progress = {};
  try { progress = JSON.parse(localStorage.getItem("canon-progress") || "{}"); } catch (err) { progress = {}; }
  if (!progress.rooms) progress.rooms = {};
  function saveProgress() {
    try { localStorage.setItem("canon-progress", JSON.stringify(progress)); } catch (err) { /* private mode */ }
  }
  if (room) {
    var slot = progress.rooms[room] || { quiz: 0, lab: 0 };
    slot.opened = new Date().toISOString();
    slot.title = document.body.getAttribute("data-room-title") || document.title;
    slot.href = location.pathname + location.search;
    slot.track = document.body.getAttribute("data-track") || "";
    if (quiz) slot.quizTotal = quiz.querySelectorAll(".qcard").length;
    if (lab) slot.labTotal = lab.querySelectorAll("input[type=checkbox]").length;
    progress.rooms[room] = slot;
    saveProgress();
    if (quiz) {
      quiz.querySelectorAll(".reveal").forEach(function (node) {
        node.addEventListener("toggle", function () {
          slot.quiz = quiz.querySelectorAll(".reveal[open]").length;
          saveProgress();
        });
      });
    }
    if (lab) {
      lab.querySelectorAll("input[type=checkbox]").forEach(function (box) {
        box.addEventListener("change", function () {
          slot.lab = lab.querySelectorAll("input[type=checkbox]:checked").length;
          saveProgress();
        });
      });
    }
  }

  var dash = document.querySelector("[data-dashboard]");
  if (dash && window.CANON_INDEX) {
    var drafts = [];
    window.CANON_INDEX.tracks.forEach(function (track) {
      track.rooms.forEach(function (item) {
        if (item.status === "written" || item.status === "draft") drafts.push(item);
      });
    });
    var opened = drafts.filter(function (item) { return progress.rooms[item.code]; }).length;
    var pct = drafts.length ? Math.round((opened / drafts.length) * 100) : 0;
    var summary = dash.querySelector("[data-dash-summary]");
    if (summary) summary.textContent = opened + " of " + drafts.length + " written rooms opened in this browser. Lab checks and quiz reveals stay on this machine.";
    var ring = dash.querySelector("[data-ring-value]");
    var ringLabel = dash.querySelector("[data-ring-label]");
    requestAnimationFrame(function () {
      if (ring) ring.style.strokeDashoffset = String(327 - (327 * pct) / 100);
      if (ringLabel) ringLabel.textContent = pct + "%";
    });
    var bars = dash.querySelector("[data-track-bars]");
    if (bars) {
      window.CANON_INDEX.tracks.forEach(function (track) {
        var mine = track.rooms.filter(function (item) { return item.status === "written" || item.status === "draft"; });
        var done = mine.filter(function (item) { return progress.rooms[item.code]; }).length;
        var width = mine.length ? Math.round((done / mine.length) * 100) : 0;
        var li = document.createElement("li");
        li.innerHTML = '<span class="room-code">' + track.id + '</span><span class="bar"><i style="background:' + track.color + '"></i></span><span>' + done + '/' + mine.length + '</span>';
        bars.appendChild(li);
        requestAnimationFrame(function () { li.querySelector("i").style.width = width + "%"; });
      });
    }
  }

  function rootPrefix() {
    var nodes = document.querySelectorAll("script[src]");
    var mark = "assets/js/search-index.js";
    for (var i = 0; i < nodes.length; i++) {
      var src = nodes[i].getAttribute("src") || "";
      var at = src.indexOf(mark);
      if (at !== -1) return src.slice(0, at);
    }
    return "";
  }
  var prefix = rootPrefix();
  function escHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function fromRoot(href) {
    if (!href) return "";
    if (/^(https?:|mailto:)/.test(href)) return href;
    return prefix + href.replace(/^\//, "");
  }
  var cmdk = document.querySelector("[data-cmdk]");
  if (!cmdk) {
    cmdk = document.createElement("div");
    cmdk.className = "cmdk";
    cmdk.setAttribute("data-cmdk", "");
    cmdk.hidden = true;
    cmdk.innerHTML = '<div class="cmdk-panel" role="dialog" aria-modal="true" aria-label="Command search"><input data-cmdk-input type="search" placeholder="Rooms and glossary terms" autocomplete="off"><ul data-cmdk-list></ul><p class="cmdk-hint">Enter opens. Esc closes. Arrow keys move.</p></div>';
    document.body.appendChild(cmdk);
  }
  var cmdkInput = cmdk.querySelector("[data-cmdk-input]");
  var cmdkList = cmdk.querySelector("[data-cmdk-list]");
  var active = 0;
  function catalog() {
    var rows = [];
    if (!window.CANON_INDEX) return rows;
    window.CANON_INDEX.tracks.forEach(function (track) {
      track.rooms.forEach(function (item) {
        rows.push({
          kind: "Room",
          title: item.code + " · " + item.title,
          href: fromRoot(item.href || ""),
          hay: (item.code + " " + item.title + " " + (item.status || "")).toLowerCase(),
          note: item.status === "planned" ? "planned" : ""
        });
      });
    });
    (window.CANON_INDEX.terms || []).forEach(function (term) {
      rows.push({
        kind: "Glossary",
        title: term.term,
        href: fromRoot(term.href || ""),
        hay: (term.term + " " + term.def + " " + term.room).toLowerCase(),
        note: term.room
      });
    });
    return rows;
  }
  var allRows = catalog();
  function renderCmd(q) {
    if (!cmdkList) return;
    var query = (q || "").trim().toLowerCase();
    var hits = allRows.filter(function (row) { return !query || row.hay.indexOf(query) !== -1; }).slice(0, 12);
    if (!hits.length) hits = [{ kind: "Empty", title: "No room or glossary term matches.", href: "", hay: "" }];
    if (active >= hits.length) active = 0;
    cmdkList.innerHTML = "";
    hits.forEach(function (hit, index) {
      var li = document.createElement("li");
      if (index === active) li.className = "active";
      var label = '<span class="cmdk-kind">' + escHtml(hit.kind) + '</span> ' + escHtml(hit.title) + (hit.note ? ' <span class="cmdk-kind">' + escHtml(hit.note) + '</span>' : "");
      if (hit.href) {
        var a = document.createElement("a");
        a.href = hit.href;
        a.innerHTML = label;
        li.appendChild(a);
      } else {
        li.innerHTML = label;
      }
      cmdkList.appendChild(li);
    });
    cmdkList._hits = hits;
  }
  function openCmd() {
    if (!cmdk) return;
    cmdk.hidden = false;
    renderCmd(cmdkInput ? cmdkInput.value : "");
    if (cmdkInput) cmdkInput.focus();
  }
  function closeCmd() { if (cmdk) cmdk.hidden = true; }
  document.querySelectorAll("[data-cmdk-open]").forEach(function (btn) {
    btn.addEventListener("click", openCmd);
  });
  document.addEventListener("keydown", function (event) {
    var key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === "k") {
      event.preventDefault();
      if (cmdk && cmdk.hidden) openCmd(); else closeCmd();
      return;
    }
    if (!cmdk || cmdk.hidden) return;
    if (event.key === "Escape") closeCmd();
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      var n = (cmdkList && cmdkList._hits) ? cmdkList._hits.length : 0;
      if (!n) return;
      active = event.key === "ArrowDown" ? (active + 1) % n : (active - 1 + n) % n;
      renderCmd(cmdkInput.value);
    }
    if (event.key === "Enter" && cmdkList && cmdkList._hits && cmdkList._hits[active] && cmdkList._hits[active].href) {
      location.href = cmdkList._hits[active].href;
    }
  });
  if (cmdk) {
    cmdk.addEventListener("click", function (event) { if (event.target === cmdk) closeCmd(); });
  }
  if (cmdkInput) {
    cmdkInput.addEventListener("input", function () { active = 0; renderCmd(cmdkInput.value); });
  }
})();
