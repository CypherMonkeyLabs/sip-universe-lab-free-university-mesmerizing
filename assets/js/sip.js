/* Room quiz, search, and progress. No network. */
(function () {
  function readSet() {
    try { return JSON.parse(localStorage.getItem("sip-read") || "[]"); }
    catch (err) { return []; }
  }
  var room = document.body.getAttribute("data-room");
  if (room) {
    var seen = readSet();
    if (seen.indexOf(room) === -1) {
      seen.push(room);
      try { localStorage.setItem("sip-read", JSON.stringify(seen)); } catch (err) { /* private mode */ }
    }
  }
  document.querySelectorAll("[data-progress]").forEach(function (node) {
    var total = Number(node.getAttribute("data-progress-max") || "0");
    var count = readSet().length;
    node.textContent = total ? count + " / " + total + " rooms opened" : count + " rooms opened";
  });

  var search = document.querySelector("[data-canon-search]");
  if (search) {
    search.addEventListener("input", function () {
      var term = search.value.trim().toLowerCase();
      var shown = 0;
      document.querySelectorAll("[data-title]").forEach(function (row) {
        var hay = (row.getAttribute("data-title") || "").toLowerCase();
        var on = !term || hay.indexOf(term) !== -1;
        row.hidden = !on;
        if (on) shown += 1;
      });
      var empty = document.querySelector("[data-empty-search]");
      if (empty) empty.hidden = shown !== 0;
    });
  }

  document.querySelectorAll("form[data-quiz]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var sets = form.querySelectorAll("fieldset[data-answer]");
      var correct = 0;
      sets.forEach(function (set) {
        var want = set.getAttribute("data-answer");
        var picked = set.querySelector("input:checked");
        var why = set.querySelector(".why");
        var ok = picked && picked.value === want;
        if (ok) correct += 1;
        if (why) why.hidden = false;
        set.classList.toggle("is-correct", Boolean(ok));
      });
      var score = form.querySelector(".quiz-score");
      if (score) score.textContent = correct + " of " + sets.length;
      if (sets.length && correct === sets.length && window.confetti) {
        window.confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      }
    });
  });
})();
