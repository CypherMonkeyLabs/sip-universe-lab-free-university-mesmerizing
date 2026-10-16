/**
 * Local study router. Facts come from guide/kb, which is generated from
 * this repo. This file does not fetch, does not invent product claims,
 * and does not touch the DOM.
 */

const STOP = new Set("the a an to of and or in on for is this that with from into your you are be as at by it its do did does how what when where which who why me my i we can not".split(" "));

export function blankSession() {
  return {
    mode: null,
    difficulty: "medium",
    seen: {},
    covered: [],
    lastRoom: "",
    lastFactId: "",
    lastText: "",
    scores: [],
    quizCorrect: 0,
    quizAsked: 0,
    cardCorrect: 0,
    cardAsked: 0,
    asked: 0,
    toursDone: 0,
    gamesPlayed: 0,
    quiz: null,
    card: null,
    lesson: null,
    game: null,
    course: null
  };
}

export function badges(session, streak) {
  const names = [];
  if (session.asked >= 1) names.push("First question");
  if (session.quizAsked >= 3 && session.quizCorrect === session.quizAsked) names.push("Clean quiz");
  else if (session.quizCorrect >= 4) names.push("Quiz run");
  if (session.cardCorrect >= 5) names.push("Card drill");
  if (session.toursDone >= 1) names.push("Tour finished");
  if (session.covered.length >= 5) names.push("Five rooms");
  if (session.gamesPlayed >= 1) names.push("Played a round");
  if ((streak || 0) >= 2) names.push("Streak");
  const tracks = new Set(session.covered.map((id) => String(id).slice(0, 2)));
  if (tracks.size >= 3) names.push("Three tracks");
  return names;
}

function norm(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9+\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(value) {
  return norm(value).split(" ").filter((word) => word && !STOP.has(word) && (word.length > 1 || /\d/.test(word)));
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a || !b) return Math.max(a ? a.length : 0, b ? b.length : 0);
  if (Math.abs(a.length - b.length) > 2) return 3;
  const prev = new Array(b.length + 1);
  const cur = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      const del = prev[j] + 1;
      const ins = cur[j - 1] + 1;
      const sub = prev[j - 1] + cost;
      const next = del < ins ? del : ins;
      cur[j] = next < sub ? next : sub;
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > 2) return 3;
    for (let j = 0; j <= b.length; j += 1) prev[j] = cur[j];
  }
  return prev[b.length];
}

function applySynonyms(message, synonyms) {
  let text = " " + norm(message) + " ";
  const keys = Object.keys(synonyms || {}).sort((a, b) => b.length - a.length);
  keys.forEach((key) => {
    const token = norm(key);
    const extra = norm(synonyms[key]);
    if (!token || !extra) return;
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(" " + escaped + " ", "g"), " " + token + " " + extra + " ");
  });
  return text.trim();
}

function cloneSession(session) {
  return structuredClone(session || blankSession());
}

function linksFrom(doc) {
  if (!doc || !doc.href) return [];
  return [{ href: doc.href, title: doc.cite || doc.roomTitle || doc.href }];
}

function cited(doc, lead) {
  const body = lead ? lead + doc.text : doc.text;
  return {
    kind: "answer",
    text: body + "\n\nFrom " + doc.cite + ".",
    href: doc.href,
    links: linksFrom(doc),
    factId: doc.id,
    room: doc.room || ""
  };
}

export function createGuide(kb, options) {
  const rng = options && options.rng ? options.rng : Math.random;
  const rooms = kb.rooms || [];
  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const lessons = kb.lessons || [];
  const tours = kb.tours || [];
  const pages = kb.pages || [];
  const quizzes = kb.quizzes || [];
  const cards = kb.cards || [];
  const curriculum = kb.curriculum || [];
  const games = kb.games || { ports: [], rooms: [] };
  const intents = kb.intents || [];
  const quizzesByRoom = new Map();
  quizzes.forEach((quiz) => {
    if (quiz && quiz.room && !quizzesByRoom.has(quiz.room)) quizzesByRoom.set(quiz.room, quiz);
  });
  const trackIds = [];
  curriculum.forEach((item) => {
    if (item && trackIds.indexOf(item.track) === -1) trackIds.push(item.track);
  });
  const courseBeats = [];
  curriculum.forEach((item, roomIndex) => {
    const lesson = lessons.find((entry) => entry.id === item.room);
    const reads = ((lesson && lesson.steps) || []).filter((step) => step && step.text && !(step.choices && step.choices.length));
    const notes = (reads.length ? reads : [{ title: item.title, text: item.title, href: item.href }]).slice(0, 3);
    notes.forEach((step) => {
      courseBeats.push({
        kind: "note",
        room: item.room,
        roomTitle: item.title,
        track: item.track,
        trackName: item.trackName || item.track,
        roomIndex: roomIndex,
        href: step.href || item.href,
        text: (step.title ? step.title + ". " : "") + step.text
      });
    });
    const quiz = quizzesByRoom.get(item.room);
    if (quiz && quiz.choices && quiz.choices.length) {
      courseBeats.push({
        kind: "check",
        room: item.room,
        roomTitle: item.title,
        track: item.track,
        trackName: item.trackName || item.track,
        roomIndex: roomIndex,
        href: quiz.href || item.href,
        question: quiz.question,
        choices: quiz.choices,
        answer: quiz.answer,
        why: quiz.why || ""
      });
    }
  });
  const docs = (kb.facts || []).map((fact) => ({
    ...fact,
    keywords: fact.keywords || [],
    _hay: norm([fact.text, fact.roomTitle, fact.cite, fact.room, ...(fact.keywords || [])].join(" "))
  }));
  const keywordDocs = new Map();
  const buckets = new Map();
  docs.forEach((doc, index) => {
    const seen = new Set();
    tokens(doc._hay).forEach((word) => {
      if (seen.has(word)) return;
      seen.add(word);
      if (!keywordDocs.has(word)) keywordDocs.set(word, []);
      keywordDocs.get(word).push(index);
    });
  });
  keywordDocs.forEach((_list, key) => {
    const bucket = key.slice(0, 2);
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket).push(key);
  });

  function remember(session, doc) {
    if (!doc) return;
    if (doc.id) session.seen[doc.id] = 1;
    session.lastFactId = doc.id || session.lastFactId;
    session.lastText = doc.text || session.lastText;
    if (doc.room) {
      session.lastRoom = doc.room;
      if (session.covered.indexOf(doc.room) === -1) session.covered.push(doc.room);
    }
  }

  function nextRoom(session) {
    return curriculum.find((item) => session.covered.indexOf(item.room) === -1) || null;
  }

  function defaultChips(session, context) {
    const chips = ["Start the 1-hour course", "How do I use this?"];
    if (context && context.room) chips.push("Tour this room");
    else chips.push("Quiz me");
    chips.push("Flashcards", "My progress");
    if (session.lastRoom) chips.push("Tell me more");
    return chips;
  }

  function pack(session, reply, context) {
    session.asked += reply.kind === "chat" || reply.kind === "fallback" ? 1 : 1;
    if (!reply.chips) reply.chips = defaultChips(session, context || {});
    if (!reply.links) reply.links = [];
    reply.localOnly = reply.localOnly !== false;
    return { reply, session };
  }

  function search(query, session) {
    const expanded = applySynonyms(query, kb.synonyms);
    const queryNorm = norm(expanded);
    const queryTokens = tokens(queryNorm);
    const candidate = new Map();
    function slotFor(index) {
      if (!candidate.has(index)) candidate.set(index, { exact: 0, fuzzy: 0 });
      return candidate.get(index);
    }
    queryTokens.forEach((word) => {
      (keywordDocs.get(word) || []).forEach((index) => {
        slotFor(index).exact += 1;
      });
      if (word.length < 5) return;
      const limit = word.length >= 8 ? 2 : 1;
      (buckets.get(word.slice(0, 2)) || []).forEach((key) => {
        if (key === word || Math.abs(key.length - word.length) > 2) return;
        if (levenshtein(word, key) > limit) return;
        (keywordDocs.get(key) || []).forEach((index) => {
          slotFor(index).fuzzy += 1;
        });
      });
    });
    const exactNeeded = queryTokens.length >= 3 ? 2 : 1;
    let winner = null;
    candidate.forEach((hit, index) => {
      const loneFuzzy = queryTokens.length === 1 && queryTokens[0].length >= 6 && hit.exact === 0 && hit.fuzzy > 0;
      if (hit.exact < exactNeeded && !loneFuzzy) return;
      const doc = docs[index];
      let raw = hit.exact * 5 + Math.min(hit.fuzzy, 2) * 2 + (doc.weight || 0);
      if (queryNorm.length > 6 && hit.exact > 0 && doc._hay.includes(queryNorm)) raw += 8;
      if (raw < 6) return;
      const seen = !!session.seen[doc.id];
      let adjusted = raw - (seen ? 6 : 0);
      if (session.lastRoom && doc.room === session.lastRoom && queryTokens.length <= 5) adjusted += 2;
      if (session.difficulty === "hard" && doc.difficulty === "hard") adjusted += 1;
      if (session.difficulty === "easy" && doc.difficulty === "easy") adjusted += 1;
      if (!winner || adjusted > winner.adjusted) winner = { doc, raw, adjusted, seen };
    });
    return { winner, queryNorm };
  }

  function fallback(session, context, nearest) {
    const glossary = pages.find((page) => page.file === "glossary.html");
    let text = "I don't know that from these notes, so I won't guess.";
    const linkList = [{ href: "glossary.html", title: glossary ? glossary.title : "Glossary" }];
    if (nearest && nearest.raw >= 4 && nearest.raw < 6) {
      text += " The nearest page is " + (nearest.doc.roomTitle || nearest.doc.cite) + ". That is only a pointer, not an answer.";
      linkList.unshift({ href: nearest.doc.href, title: nearest.doc.roomTitle || nearest.doc.cite });
    } else if (context && context.room && roomById.get(context.room)) {
      const room = roomById.get(context.room);
      text += " You can keep reading " + room.title + ".";
      linkList.unshift({ href: room.href, title: room.title });
    }
    return pack(session, { kind: "fallback", text, href: linkList[0].href, links: linkList }, context);
  }

  function answerDoc(session, doc, context, lead) {
    remember(session, doc);
    return pack(session, cited(doc, lead || ""), context);
  }

  function matchIntent(message) {
    const q = norm(message);
    const words = q.split(" ");
    for (let i = 0; i < intents.length; i += 1) {
      const intent = intents[i];
      for (let p = 0; p < intent.phrases.length; p += 1) {
        const phrase = norm(intent.phrases[p]);
        if (!phrase) continue;
        if (q === phrase || q.startsWith(phrase + " ")) return intent.id;
        if (phrase.length >= 10 && q.indexOf(phrase) !== -1) return intent.id;
      }
      if (intent.id === "tour" && words.indexOf("tour") !== -1) return "tour";
    }
    return "";
  }

  function isStop(message) {
    return /^(stop|cancel|enough|never mind|nevermind|exit|quit|stop quiz|stop cards|stop lesson|stop game|stop course)$/.test(norm(message));
  }

  function isCourseAsk(message) {
    const q = norm(message);
    return q === "start the 1-hour course" || q === "start the course" || q.indexOf("1-hour course") !== -1 || q.indexOf("1 hour course") !== -1 || q.indexOf("one hour course") !== -1;
  }

  function choiceIndex(message, choices) {
    const q = norm(message);
    if (/^[a-d]$/.test(q) && choices.length > q.charCodeAt(0) - 97) return q.charCodeAt(0) - 97;
    let found = -1;
    choices.forEach((choice, index) => {
      if (found !== -1) return;
      const text = norm(choice);
      if (!text) return;
      if (text === q) found = index;
      else if (q.length > 3 && (text.indexOf(q) !== -1 || q.indexOf(text) !== -1)) found = index;
    });
    return found;
  }

  function pickList(list, count) {
    const copy = list.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    if (!copy.length) return [];
    const start = Math.floor(rng() * copy.length) % copy.length;
    return copy.slice(start).concat(copy.slice(0, start)).slice(0, count);
  }

  function pool(difficulty) {
    if (difficulty === "easy") {
      const easy = quizzes.filter((item) => item.difficulty === "easy");
      if (easy.length >= 4) return easy;
    }
    if (difficulty === "hard") {
      const hard = quizzes.filter((item) => item.difficulty === "hard");
      if (hard.length >= 4) return hard;
    }
    if (difficulty === "medium") {
      const medium = quizzes.filter((item) => item.difficulty !== "hard");
      if (medium.length >= 4) return medium;
    }
    return quizzes;
  }

  function quizReply(session, context, intro) {
    const item = session.quiz.items[session.quiz.index];
    return pack(session, {
      kind: "quiz",
      text: (intro ? intro + " " : "") + (session.quiz.index + 1) + "/" + session.quiz.items.length + ". " + item.question,
      question: { prompt: item.question, choices: item.choices.slice() },
      chips: item.choices.slice(),
      extraChips: ["Stop quiz"],
      href: item.href,
      links: []
    }, context);
  }

  function startQuiz(session, context, daily) {
    if (!quizzes.length) return fallback(session, context, null);
    let items;
    let intro;
    if (daily) {
      const day = (context && context.today) || "1970-01-01";
      let hash = 0;
      for (let i = 0; i < day.length; i += 1) hash = (hash * 33 + day.charCodeAt(i)) >>> 0;
      items = [quizzes[hash % quizzes.length]];
      intro = "Daily challenge for " + day + ".";
    } else {
      items = pickList(pool(session.difficulty), 4);
      intro = "Four questions from the room quizzes, at " + session.difficulty + ".";
    }
    session.mode = "quiz";
    session.quiz = { items, index: 0, correct: 0, daily: !!daily };
    return quizReply(session, context, intro);
  }

  function gradeQuiz(session, context, index) {
    const item = session.quiz.items[session.quiz.index];
    const correct = index === item.answer;
    if (correct) {
      session.quiz.correct += 1;
      session.quizCorrect += 1;
    }
    session.quizAsked += 1;
    if (item.room && session.covered.indexOf(item.room) === -1) session.covered.push(item.room);
    session.lastRoom = item.room || session.lastRoom;
    const lead = correct ? "That's the one in the notes. " : "Not this one. ";
    const text = lead + item.why + "\n\nFrom " + item.roomTitle + " (" + item.room + ").";
    session.quiz.index += 1;
    if (session.quiz.index >= session.quiz.items.length) {
      const score = session.quiz.correct + "/" + session.quiz.items.length;
      session.scores.push(score);
      session.mode = null;
      const finished = session.quiz;
      session.quiz = null;
      const upcoming = nextRoom(session);
      let closing = "Score: " + score + ".";
      if (upcoming) closing += " Next room on the path: " + upcoming.title + ".";
      return pack(session, {
        kind: "quiz-grade",
        correct,
        done: true,
        score,
        text: text + " " + closing,
        href: item.href,
        links: [{ href: item.href, title: item.roomTitle }].concat(upcoming ? [{ href: upcoming.href, title: upcoming.title }] : []),
        chips: ["Teach me", "Flashcards", "My progress", "Quiz me"]
      }, context);
    }
    const followItem = session.quiz.items[session.quiz.index];
    return pack(session, {
      kind: "quiz-grade",
      correct,
      done: false,
      text,
      href: item.href,
      links: [{ href: item.href, title: item.roomTitle }],
      follow: {
        kind: "quiz",
        text: (session.quiz.index + 1) + "/" + session.quiz.items.length + ". " + followItem.question,
        question: { prompt: followItem.question, choices: followItem.choices.slice() },
        chips: followItem.choices.slice(),
        extraChips: ["Stop quiz"]
      }
    }, context);
  }

  function startCards(session, context) {
    if (!cards.length) return fallback(session, context, null);
    const queue = pickList(cards, 6);
    session.mode = "cards";
    session.card = { queue, index: 0, phase: "front", correct: 0 };
    const card = queue[0];
    return pack(session, {
      kind: "cards",
      text: "Card 1/" + queue.length + ". " + card.front,
      card: { front: card.front, phase: "front" },
      chips: ["Show answer"],
      extraChips: ["Stop cards"],
      href: card.href,
      links: []
    }, context);
  }

  function advanceCard(session, context, knew) {
    const current = session.card.queue[session.card.index];
    if (session.card.phase === "front") {
      session.card.phase = "back";
      const cite = current.roomTitle ? current.roomTitle + " (" + current.room + ")" : (current.source || "Flashcards");
      return pack(session, {
        kind: "cards",
        text: current.back + "\n\nFrom " + cite + ".",
        card: { front: current.front, back: current.back, phase: "back" },
        href: current.href,
        links: [{ href: current.href, title: cite }],
        chips: ["Know", "Again"],
        extraChips: ["Stop cards"]
      }, context);
    }
    session.cardAsked += 1;
    if (knew) {
      session.card.correct += 1;
      session.cardCorrect += 1;
    }
    if (current.room && session.covered.indexOf(current.room) === -1) session.covered.push(current.room);
    session.lastRoom = current.room || session.lastRoom;
    session.card.index += 1;
    if (session.card.index >= session.card.queue.length) {
      const score = session.card.correct + "/" + session.card.queue.length;
      session.scores.push("cards " + score);
      session.mode = null;
      session.card = null;
      return pack(session, {
        kind: "cards",
        done: true,
        text: "Cards this round: " + score + ". Know means you could say it without the back.",
        chips: ["Quiz me", "Teach me", "My progress"]
      }, context);
    }
    session.card.phase = "front";
    const next = session.card.queue[session.card.index];
    return pack(session, {
      kind: "cards",
      text: "Card " + (session.card.index + 1) + "/" + session.card.queue.length + ". " + next.front,
      card: { front: next.front, phase: "front" },
      chips: ["Show answer"],
      extraChips: ["Stop cards"],
      href: next.href
    }, context);
  }

  function bestLesson(query) {
    const q = norm(query);
    const words = tokens(q);
    let best = null;
    let score = 0;
    lessons.forEach((lesson) => {
      const title = norm(lesson.title + " " + lesson.room);
      let next = 0;
      if (q && title.indexOf(q) !== -1) next += 10;
      words.forEach((word) => {
        if (title.indexOf(word) !== -1) next += 3;
      });
      if (next > score) {
        score = next;
        best = lesson;
      }
    });
    return score >= 3 ? best : null;
  }

  function lessonSteps(lesson, difficulty) {
    const steps = lesson.steps || [];
    if (difficulty === "easy") return steps.slice(0, 3);
    if (difficulty === "hard") return steps;
    return steps.slice(0, Math.min(5, steps.length));
  }

  function showLesson(session, context, intro) {
    const lesson = lessons.find((item) => item.id === session.lesson.id);
    const steps = session.lesson.steps;
    const step = steps[session.lesson.index];
    const cite = lesson.title + " (" + lesson.room + ")";
    if (step.choices && step.choices.length) {
      session.lesson.phase = "check";
      return pack(session, {
        kind: "lesson",
        text: (intro ? intro + " " : "") + "Step " + (session.lesson.index + 1) + "/" + steps.length + ". " + step.title + ". " + step.text,
        href: step.href,
        links: [{ href: step.href, title: cite }],
        chips: step.choices.slice(),
        extraChips: ["Stop lesson"],
        question: { prompt: step.text, choices: step.choices.slice() }
      }, context);
    }
    session.lesson.phase = "read";
    return pack(session, {
      kind: "lesson",
      text: (intro ? intro + " " : "") + "Step " + (session.lesson.index + 1) + "/" + steps.length + ". " + step.title + ". " + step.text + "\n\nFrom " + cite + ".",
      href: step.href,
      links: [{ href: step.href, title: cite }],
      chips: ["Next"],
      extraChips: ["Stop lesson"]
    }, context);
  }

  function startLesson(session, context, message) {
    const topic = norm(message).replace(/^(teach me|lesson on|walk me through|step by step)\s*/, "");
    let lesson = topic ? bestLesson(topic) : null;
    if (!lesson && context && context.room) lesson = lessons.find((item) => item.id === context.room) || null;
    if (!lesson) {
      const upcoming = nextRoom(session);
      lesson = upcoming ? lessons.find((item) => item.id === upcoming.room) : lessons[0];
    }
    if (!lesson || !(lesson.steps || []).length) return fallback(session, context, null);
    const steps = lessonSteps(lesson, session.difficulty);
    session.mode = "lesson";
    session.lesson = { id: lesson.id, index: 0, steps, phase: "read" };
    session.lastRoom = lesson.room;
    if (session.covered.indexOf(lesson.room) === -1) session.covered.push(lesson.room);
    return showLesson(session, context, "Lesson from " + lesson.title + ".");
  }

  function advanceLesson(session, context) {
    session.lesson.index += 1;
    if (session.lesson.index >= session.lesson.steps.length) {
      const lesson = lessons.find((item) => item.id === session.lesson.id);
      session.mode = null;
      session.lesson = null;
      const upcoming = nextRoom(session);
      let text = "That's the end of this lesson from " + (lesson ? lesson.title : "the room") + ".";
      const linkList = lesson ? [{ href: lesson.href, title: lesson.title }] : [];
      if (upcoming) {
        text += " Next on the path: " + upcoming.title + ".";
        linkList.push({ href: upcoming.href, title: upcoming.title });
      }
      return pack(session, { kind: "lesson", done: true, text, links: linkList, chips: ["Quiz me", "Teach me", "My progress"] }, context);
    }
    return showLesson(session, context, "");
  }

  function tourFor(context, message) {
    const q = norm(message).replace(/\b(tour|show me around|guide me|this room|this page|2 minute|two minute|walk me around|a|the|of|please)\b/g, " ").replace(/\s+/g, " ").trim();
    if (q.length > 2) {
      const lesson = bestLesson(q);
      if (lesson) {
        const found = tours.find((tour) => tour.room === lesson.room);
        if (found) return found;
      }
    }
    if (context && context.room) {
      const found = tours.find((tour) => tour.room === context.room);
      if (found) return found;
    }
    const file = String((context && context.page) || "").split("/").pop();
    return tours.find((tour) => (tour.match || []).indexOf(file) !== -1) || tours.find((tour) => tour.id === "home") || null;
  }

  function startTour(session, context, message) {
    const tour = tourFor(context, message);
    if (!tour) return fallback(session, context, null);
    session.toursDone += 1;
    if (tour.room) {
      session.lastRoom = tour.room;
      if (session.covered.indexOf(tour.room) === -1) session.covered.push(tour.room);
    }
    return pack(session, {
      kind: "tour",
      text: "Tour: " + tour.title + ". I'll scroll to what's already on the page, and open the room when the stop is somewhere else.",
      tour: { id: tour.id, title: tour.title, steps: tour.steps },
      href: tour.steps && tour.steps[0] ? tour.steps[0].href : "",
      links: [],
      chips: ["How do I use this?", "Quiz me", "My progress"]
    }, context);
  }

  function help(session, context) {
    const recording = context && context.recording;
    if (context && context.room && roomById.get(context.room)) {
      const room = roomById.get(context.room);
      let text = room.howTo;
      if (recording && recording.title) {
        const slot = (room.audio || []).find((item) => norm(item.title).indexOf(norm(recording.title)) !== -1 || norm(recording.title).indexOf(norm(item.title)) !== -1);
        if (slot) {
          text += " This recording is “" + slot.title + "”.";
          if (slot.prompt) text += " Prompt in the room: " + slot.prompt;
          if (slot.file) text += " Expected file: " + slot.file + ".";
        } else {
          text += " A player is running (" + recording.title + "). If no file is attached, this room has not been recorded yet.";
        }
      } else if (context.section) {
        const sectionHelp = {
          hdr: " You are on the header: title, estimate, and picture.",
          tldr: " You are on the TL;DR. The short lines are cited in the room.",
          map: " You are on the map for this room.",
          core: " You are in the core explanation.",
          trouble: " You are in the symptom, evidence, and fix table.",
          quiz: " You are on the quiz. Reveals stay closed until you open them.",
          audio: " You are on the audio slots. Press play if a file is attached.",
          lab: " You are on the lab checklist. Checks stay in this browser.",
          cites: " You are on the sources for this room."
        };
        text += sectionHelp[context.section] || (" You are around the " + context.section + " section.");
      }
      const doc = { id: "help-" + room.id, text, room: room.id, roomTitle: room.title, href: room.href + (context.section ? "#" + context.section : ""), cite: room.title + " (" + room.id + ")", keywords: [] };
      return answerDoc(session, doc, context, "");
    }
    const file = String((context && context.page) || "index.html").split("/").pop() || "index.html";
    const page = pages.find((item) => item.file === file) || pages.find((item) => item.file === "index.html");
    if (!page) return fallback(session, context, null);
    const doc = {
      id: "help-" + page.id,
      text: page.howTo + (page.lede ? " " + page.lede : ""),
      room: "",
      roomTitle: page.title,
      href: page.file,
      cite: page.title,
      keywords: page.keywords || []
    };
    return answerDoc(session, doc, context, "");
  }

  function progress(session, context) {
    const streak = context && context.streak ? context.streak : 0;
    const names = badges(session, streak);
    const upcoming = nextRoom(session);
    const lines = [
      "We've touched " + session.covered.length + " room" + (session.covered.length === 1 ? "" : "s") + " this session.",
      "Quiz answers marked right: " + session.quizCorrect + " of " + session.quizAsked + ".",
      "Cards marked know: " + session.cardCorrect + " of " + session.cardAsked + ".",
      "Difficulty: " + session.difficulty + ".",
      "Streak days on this browser: " + streak + ".",
      names.length ? "Badges: " + names.join(", ") + "." : "No badges yet. A quiz or a tour will earn the first one."
    ];
    const linkList = [];
    if (upcoming) {
      lines.push("Suggested next: " + upcoming.title + ".");
      linkList.push({ href: upcoming.href, title: upcoming.title });
    } else if (curriculum.length) {
      lines.push("You've touched every room on the path at least once. Review any room you want to say out loud.");
    }
    return pack(session, {
      kind: "progress",
      text: lines.join(" "),
      links: linkList,
      href: upcoming ? upcoming.href : "mastery.html",
      chips: ["Teach me", "Daily challenge", "Quiz me", "Flashcards"]
    }, context);
  }

  function presentGame(session, context, item) {
    const order = item.choices.map((text, index) => ({ text, index }));
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      const swap = order[i];
      order[i] = order[j];
      order[j] = swap;
    }
    const choices = order.map((entry) => entry.text);
    const answer = order.findIndex((entry) => entry.index === item.answer);
    session.mode = "game";
    session.game = { prompt: item.prompt, choices, answer, why: item.why, href: item.href, cite: item.cite };
    session.gamesPlayed += 1;
    return pack(session, {
      kind: "game",
      text: item.prompt,
      question: { prompt: item.prompt, choices },
      chips: choices,
      extraChips: ["Stop"],
      href: item.href
    }, context);
  }

  function startGame(session, context, message) {
    const q = norm(message);
    const which = q.indexOf("room") !== -1 ? games.rooms : games.ports;
    const list = which && which.length ? which : (games.ports.length ? games.ports : games.rooms);
    if (!list || !list.length) return fallback(session, context, null);
    const item = list[Math.floor(rng() * list.length) % list.length];
    return presentGame(session, context, item);
  }

  function courseWhere(beat) {
    const trackNo = trackIds.indexOf(beat.track) + 1;
    return "Track " + trackNo + " of " + trackIds.length + ", " + beat.trackName + ". Room " + (beat.roomIndex + 1) + " of " + curriculum.length + ".";
  }

  function presentCourse(session, context, lead) {
    const beat = courseBeats[session.course.index];
    if (!beat) {
      session.mode = null;
      session.course = null;
      return pack(session, {
        kind: "course",
        done: true,
        text: "That's the full course. Every track has a checkpoint behind you.",
        chips: ["My progress", "Quiz me", "Flashcards"]
      }, context);
    }
    if (beat.room && session.covered.indexOf(beat.room) === -1) session.covered.push(beat.room);
    session.lastRoom = beat.room || session.lastRoom;
    const cite = beat.roomTitle + " (" + beat.room + ")";
    const prefix = (lead ? lead + " " : "") + courseWhere(beat) + " ";
    if (beat.kind === "check") {
      session.course.phase = "check";
      return pack(session, {
        kind: "course",
        text: prefix + "Checkpoint. " + beat.question,
        href: beat.href,
        links: [{ href: beat.href, title: cite }],
        chips: beat.choices.slice(),
        extraChips: ["Stop course"]
      }, context);
    }
    session.course.phase = "read";
    return pack(session, {
      kind: "course",
      text: prefix + beat.text + "\n\nFrom " + cite + ".",
      href: beat.href,
      links: [{ href: beat.href, title: cite }],
      chips: ["Next"],
      extraChips: ["Stop course"]
    }, context);
  }

  function advanceCourse(session, context, lead) {
    const prev = courseBeats[session.course.index];
    session.course.index += 1;
    const next = courseBeats[session.course.index];
    let extra = lead || "";
    if (prev && next && prev.room !== next.room && prev.kind === "check") {
      extra += "Room checkpoint clear for " + prev.roomTitle + ". ";
    }
    if (prev && next && prev.track !== next.track) {
      const done = trackIds.indexOf(next.track);
      extra += "Track checkpoint. " + prev.trackName + " is complete (" + done + " of " + trackIds.length + " tracks). Next track: " + next.trackName + ". ";
    }
    if (prev && !next) {
      extra += "Track checkpoint. " + prev.trackName + " is complete (" + trackIds.length + " of " + trackIds.length + " tracks). ";
    }
    return presentCourse(session, context, extra.trim());
  }

  function startCourse(session, context) {
    if (!courseBeats.length) return fallback(session, context, null);
    session.mode = "course";
    session.quiz = null;
    session.card = null;
    session.lesson = null;
    session.game = null;
    session.course = { index: 0, phase: "read" };
    const shown = presentCourse(session, context, "");
    const intro = "This is the 1-hour course. " + curriculum.length + " rooms across " + trackIds.length + " tracks. Each room is a note from that room, then a checkpoint, and each track ends with a track checkpoint. Stay with it and there is more than an hour of notes. I only repeat what is written.";
    shown.reply.follow = {
      kind: "course",
      text: shown.reply.text,
      chips: shown.reply.chips,
      extraChips: shown.reply.extraChips,
      links: shown.reply.links,
      href: shown.reply.href
    };
    shown.reply.text = intro;
    shown.reply.chips = ["Next"];
    return shown;
  }

  function handleMode(session, context, message) {
    const q = norm(message);
    if (isCourseAsk(message)) {
      session.mode = null;
      session.quiz = null;
      session.card = null;
      session.lesson = null;
      session.game = null;
      session.course = null;
      return null;
    }
    if (session.mode === "course" && session.course) {
      const beat = courseBeats[session.course.index];
      if (session.course.phase === "check" && beat && beat.choices) {
        const index = choiceIndex(message, beat.choices);
        if (index !== -1) {
          const correct = index === beat.answer;
          if (correct) session.quizCorrect += 1;
          session.quizAsked += 1;
          const cite = beat.roomTitle + " (" + beat.room + ")";
          const note = (correct ? "That's the one in the notes. " : "Not this one. ") + beat.why + "\n\nFrom " + cite + ".";
          return advanceCourse(session, context, note);
        }
        if (!matchIntent(message)) {
          return pack(session, {
            kind: "course",
            text: "Pick one of the choices. " + beat.question,
            chips: beat.choices.slice(),
            extraChips: ["Stop course"],
            href: beat.href
          }, context);
        }
      }
      if (/^(next|continue|checkpoint|go on|keep going)$/.test(q)) return advanceCourse(session, context, "");
      if (!matchIntent(message)) return presentCourse(session, context, "Still on this step.");
    }
    if (session.mode === "quiz" && session.quiz) {
      const index = choiceIndex(message, session.quiz.items[session.quiz.index].choices);
      if (index !== -1) return gradeQuiz(session, context, index);
      if (!matchIntent(message)) {
        return pack(session, {
          kind: "quiz",
          text: "Pick one of the choices.",
          question: { prompt: session.quiz.items[session.quiz.index].question, choices: session.quiz.items[session.quiz.index].choices.slice() },
          chips: session.quiz.items[session.quiz.index].choices.slice(),
          extraChips: ["Stop quiz"]
        }, context);
      }
    }
    if (session.mode === "cards" && session.card) {
      if (q === "show answer" || q === "show the answer" || q === "flip") return advanceCard(session, context, false);
      if (q === "know" || q === "got it" || q === "yes") return advanceCard(session, context, true);
      if (q === "again" || q === "no" || q === "missed") return advanceCard(session, context, false);
      if (!matchIntent(message)) {
        const card = session.card.queue[session.card.index];
        return pack(session, {
          kind: "cards",
          text: session.card.phase === "front" ? "Say show answer when you want the back." : "Say know or again.",
          chips: session.card.phase === "front" ? ["Show answer"] : ["Know", "Again"],
          extraChips: ["Stop cards"],
          href: card.href
        }, context);
      }
    }
    if (session.mode === "lesson" && session.lesson) {
      const step = session.lesson.steps[session.lesson.index];
      if (session.lesson.phase === "check" && step && step.choices) {
        const index = choiceIndex(message, step.choices);
        if (index !== -1) {
          const correct = index === step.answer;
          if (correct) session.quizCorrect += 1;
          session.quizAsked += 1;
          const lesson = lessons.find((item) => item.id === session.lesson.id);
          const note = (correct ? "That's the one in the notes. " : "Not this one. ") + (step.why || "") + "\n\nFrom " + (lesson ? lesson.title + " (" + lesson.room + ")" : "this lesson") + ".";
          session.lesson.index += 1;
          if (session.lesson.index >= session.lesson.steps.length) {
            session.mode = null;
            session.lesson = null;
            return pack(session, { kind: "lesson", done: true, text: note + " That's the end of this lesson.", links: lesson ? [{ href: lesson.href, title: lesson.title }] : [], chips: ["Quiz me", "My progress"] }, context);
          }
          const follow = showLesson(session, context, "");
          follow.reply.follow = {
            kind: follow.reply.kind,
            text: follow.reply.text,
            chips: follow.reply.chips,
            extraChips: follow.reply.extraChips,
            links: follow.reply.links,
            href: follow.reply.href
          };
          follow.reply.text = note;
          follow.reply.chips = ["Next"];
          return follow;
        }
      }
      if (/^(next|continue|tell me more|more|go on|keep going)$/.test(q)) return advanceLesson(session, context);
      if (!matchIntent(message)) return showLesson(session, context, "Still on this step.");
    }
    if (session.mode === "game" && session.game) {
      const index = choiceIndex(message, session.game.choices);
      if (index !== -1) {
        const correct = index === session.game.answer;
        if (correct) session.quizCorrect += 1;
        session.quizAsked += 1;
        const game = session.game;
        session.mode = null;
        session.game = null;
        return pack(session, {
          kind: "quiz-grade",
          correct,
          done: true,
          text: (correct ? "That's the one in the notes. " : "Not this one. ") + game.why + "\n\nFrom " + game.cite + ".",
          href: game.href,
          links: [{ href: game.href, title: game.cite }],
          chips: ["Play a game", "Quiz me", "My progress"]
        }, context);
      }
      if (!matchIntent(message)) {
        return pack(session, {
          kind: "game",
          text: "Pick one of the choices. " + session.game.prompt,
          chips: session.game.choices.slice(),
          extraChips: ["Stop"]
        }, context);
      }
    }
    session.mode = null;
    session.quiz = null;
    session.card = null;
    session.lesson = null;
    session.game = null;
    return null;
  }

  function route(message, prior, context) {
    const session = cloneSession(prior);
    const text = String(message || "").trim();
    const ctx = context || {};
    if (!text) {
      return pack(session, {
        kind: "chat",
        text: "Ask about a room, or say how do I use this. I only repeat what the notes say."
      }, ctx);
    }
    if (isStop(text)) {
      session.mode = null;
      session.quiz = null;
      session.card = null;
      session.lesson = null;
      session.game = null;
      return pack(session, { kind: "chat", text: "Stopped. Ask about a room when you want to continue." }, ctx);
    }
    if (session.mode) {
      const handled = handleMode(session, ctx, text);
      if (handled) return handled;
    }
    if (isCourseAsk(text)) return startCourse(session, ctx);
    const intent = matchIntent(text);
    if (intent === "identity") {
      return pack(session, {
        kind: "chat",
        text: "I'm a student sharing what I've read in this Canon. I only use the rooms, glossary, flows, diagrams, flashcards, and cheat sheets. If it isn't written there, I say I don't know."
      }, ctx);
    }
    if (intent === "help") return help(session, ctx);
    if (intent === "tour") return startTour(session, ctx, text);
    if (intent === "quiz") return startQuiz(session, ctx, false);
    if (intent === "daily") return startQuiz(session, ctx, true);
    if (intent === "cards") return startCards(session, ctx);
    if (intent === "lesson") return startLesson(session, ctx, text);
    if (intent === "more") {
      if (!session.lastRoom) {
        return pack(session, { kind: "chat", text: "Ask about a room first. Then I can continue from that room without repeating the same note." }, ctx);
      }
      const upcoming = docs.filter((doc) => doc.room === session.lastRoom && !session.seen[doc.id]);
      if (!upcoming.length) {
        const next = nextRoom(session);
        const room = roomById.get(session.lastRoom);
        let replyText = "That's everything I have marked from " + (room ? room.title : "that room") + " for now.";
        const linkList = room ? [{ href: room.href, title: room.title }] : [];
        if (next) {
          replyText += " Next on the path: " + next.title + ".";
          linkList.push({ href: next.href, title: next.title });
        }
        return pack(session, { kind: "answer", text: replyText, links: linkList, href: next ? next.href : (room && room.href) }, ctx);
      }
      upcoming.sort((a, b) => (b.weight || 0) - (a.weight || 0));
      return answerDoc(session, upcoming[0], ctx, "");
    }
    if (intent === "progress") return progress(session, ctx);
    if (intent === "game") return startGame(session, ctx, text);
    if (intent === "easy" || intent === "medium" || intent === "hard") {
      session.difficulty = intent;
      return pack(session, {
        kind: "chat",
        text: "Difficulty is " + intent + ". Quizzes and lessons follow that. A direct question still uses the note that matches, and I still cite the room."
      }, ctx);
    }
    if (intent === "voice-on" || intent === "voice-off") {
      const on = intent === "voice-on";
      return pack(session, {
        kind: "voice",
        voice: on ? "on" : "off",
        text: on
          ? "Read-aloud is on. I'll use this browser's speech synthesizer. Say voice off to stop."
          : "Read-aloud is off."
      }, ctx);
    }
    if (intent === "start") {
      const page = pages.find((item) => item.file === "start.html");
      if (page) {
        const doc = { id: "page-start", text: (page.lede ? page.lede + " " : "") + page.howTo, room: "", roomTitle: page.title, href: page.file, cite: page.title, keywords: [] };
        return answerDoc(session, doc, ctx, "");
      }
    }
    const found = search(text, session);
    if (found.winner && found.winner.raw >= 6) return answerDoc(session, found.winner.doc, ctx, "");
    let nearest = null;
    if (found.winner && found.winner.raw >= 4) nearest = found.winner;
    return fallback(session, ctx, nearest);
  }

  function touch(prior) {
    const session = cloneSession(prior);
    const unseen = docs.filter((doc) => (doc.kind === "takeaway" || doc.kind === "card") && !session.seen[doc.id]);
    const source = unseen.length ? unseen : docs.filter((doc) => doc.kind === "takeaway" || doc.kind === "card");
    if (!source.length) {
      return pack(session, { kind: "fallback", text: "I don't have a short note left to share.", links: [{ href: "glossary.html", title: "Glossary" }] }, {});
    }
    const doc = source[Math.floor(rng() * source.length) % source.length];
    return answerDoc(session, doc, {}, "Here's one I keep rereading. ");
  }

  return { route, touch, blankSession, badges };
}

export function mergeKb(parts) {
  const index = parts.index || {};
  const files = index.factFiles || [];
  const facts = [];
  files.forEach((name) => {
    const chunk = parts[name];
    if (Array.isArray(chunk)) facts.push(...chunk);
  });
  if (!facts.length && Array.isArray(parts.facts)) facts.push(...parts.facts);
  return {
    intents: index.intents || [],
    synonyms: index.synonyms || {},
    pages: index.pages || [],
    curriculum: index.curriculum || [],
    games: index.games || { ports: [], rooms: [] },
    counts: index.counts || {},
    rooms: parts.rooms || [],
    facts,
    quizzes: parts.quizzes || [],
    cards: parts.cards || [],
    lessons: parts.lessons || [],
    tours: parts.tours || []
  };
}
