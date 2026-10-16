import { standaloneDocument, markdownDocument, docxDocument, pptxDocument } from "./export-doc.mjs";

function download(name, text, type) {
  var blob = text instanceof Uint8Array ? new Blob([text], { type: type }) : new Blob([text], { type: type });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function slug(value) {
  return String(value || "section").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
}

function plain(section) {
  var lines = [];
  section.querySelectorAll("h2, h3, p, li, dd, figcaption").forEach(function (node) {
    if (node.closest("svg, .export-bar")) return;
    var text = node.textContent.replace(/\s+/g, " ").trim();
    if (!text) return;
    if (node.tagName === "LI") lines.push("- " + text);
    else lines.push(text);
  });
  return lines.join("\n\n");
}

function deeperBundle() {
  var block = document.querySelector("#go-deeper");
  if (!block) {
    return {
      html: "<section id=\"go-deeper\" class=\"go-deeper\"><h2>Sources and go deeper</h2><p>confirm</p></section>",
      markdown: "## Sources and go deeper\n\nconfirm\n",
      plain: "Sources and go deeper\nconfirm"
    };
  }
  var lines = [];
  block.querySelectorAll("li").forEach(function (li) {
    var text = li.textContent.replace(/\s+/g, " ").trim();
    if (text) lines.push(text);
  });
  var plain = ["Sources and go deeper"].concat(lines).join("\n");
  var markdown = "## Sources and go deeper\n\n" + lines.map(function (line) { return "- " + line; }).join("\n") + "\n";
  return { html: block.outerHTML, markdown: markdown, plain: plain };
}

function barFor(section) {
  if (section.querySelector(":scope > .export-bar")) return;
  var heading = section.querySelector("h1, h2, h3");
  var title = heading ? heading.textContent.replace(/\s+/g, " ").trim() : section.id || "Section";
  var bar = document.createElement("div");
  bar.className = "export-bar";
  function button(label, kind, onClick) {
    var node = document.createElement("button");
    node.type = "button";
    node.className = "export-btn ex-" + kind;
    node.textContent = label;
    node.addEventListener("click", onClick);
    bar.appendChild(node);
  }
  button("HTML", "html", function () {
    var clone = section.cloneNode(true);
    clone.querySelectorAll(".export-bar").forEach(function (node) { node.remove(); });
    var deeper = deeperBundle();
    download(slug(title) + ".html", standaloneDocument(title, clone.innerHTML, deeper.html), "text/html");
  });
  button("MD", "md", function () {
    var deeper = deeperBundle();
    download(slug(title) + ".md", markdownDocument(title, plain(section), deeper.markdown), "text/markdown");
  });
  button("DOCX", "docx", function () {
    var deeper = deeperBundle();
    download(slug(title) + ".docx", docxDocument(title, plain(section), deeper.plain), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  });
  button("PPTX", "pptx", function () {
    var deeper = deeperBundle();
    download(slug(title) + ".pptx", pptxDocument(title, plain(section), deeper.plain), "application/vnd.openxmlformats-officedocument.presentationml.presentation");
  });
  if (section.id === "quiz" || section.querySelector(".qcard, [data-quiz]")) {
    button("JSON", "json", function () {
      var questions = [];
      section.querySelectorAll(".qcard, li").forEach(function (node, index) {
        if (node.closest(".export-bar")) return;
        var text = node.textContent.replace(/\s+/g, " ").trim();
        if (text) questions.push({ n: index + 1, text: text.slice(0, 500) });
      });
      download(slug(title) + ".json", JSON.stringify({ title: title, questions: questions }, null, 2), "application/json");
    });
  }
  var svgLink = section.querySelector('a[href$=".svg"], object[data$=".svg"]');
  if (svgLink) {
    var href = svgLink.getAttribute("href") || svgLink.getAttribute("data");
    var anchor = document.createElement("a");
    anchor.className = "export-btn ex-svg";
    anchor.href = href;
    anchor.download = "";
    anchor.textContent = "SVG";
    bar.appendChild(anchor);
  }
  button("Read", "read", function () {
    document.dispatchEvent(new CustomEvent("canon-read-section", { detail: { id: section.id } }));
  });
  if (heading && heading.parentNode === section) heading.insertAdjacentElement("afterend", bar);
  else section.insertBefore(bar, section.firstChild);
}

function mountExports() {
  if (document.body.classList.contains("home-world")) return;
  document.querySelectorAll("main section[id]").forEach(barFor);
}

function mountIdeas() {
  if (document.querySelector(".studio-ideas")) return;
  var lines = document.querySelectorAll(".takeaways li");
  if (!lines.length) return;
  var box = document.createElement("div");
  box.className = "studio-ideas";
  box.setAttribute("aria-hidden", "true");
  Array.prototype.forEach.call(lines, function (li, index) {
    if (index > 2) return;
    var chip = document.createElement("span");
    chip.style.setProperty("--i", String(index));
    chip.textContent = li.textContent.replace(/\s+/g, " ").trim().slice(0, 96);
    box.appendChild(chip);
  });
  var host = document.querySelector(".room-main") || document.querySelector("main");
  if (host) host.appendChild(box);
}

function mountRepoLinks() {
  if (!/downloads\.html$/.test(location.pathname) || document.querySelector("[data-repo-links]")) return;
  var main = document.querySelector("main");
  if (!main) return;
  var p = document.createElement("p");
  p.className = "repo-links";
  p.setAttribute("data-repo-links", "");
  p.innerHTML = '<a class="export-btn ex-html" href="index.html">Open app</a> <a class="export-btn ex-md" href="https://github.com/CypherMonkeyLabs/sip-universe-lab-free-university-mesmerizing">View repo</a>';
  main.insertBefore(p, main.firstChild);
}

function learnFive() {
  if (document.querySelector(".learn-five")) return;
  var aside = document.querySelector("aside.takeaways");
  var heading = document.querySelector("main h1");
  if (!aside || !heading) return;
  var items = aside.querySelectorAll("li");
  if (!items.length) return;
  var box = document.createElement("section");
  box.className = "learn-five";
  box.setAttribute("aria-label", "Learn in 5");
  var title = document.createElement("h2");
  title.textContent = "Learn in 5";
  var list = document.createElement("ol");
  Array.prototype.forEach.call(items, function (item, index) {
    if (index > 4) return;
    var line = document.createElement("li");
    line.textContent = item.textContent.replace(/\s+/g, " ").trim();
    list.appendChild(line);
  });
  box.appendChild(title);
  box.appendChild(list);
  heading.insertAdjacentElement("afterend", box);
}

document.body.classList.add("studio");
learnFive();
mountExports();
mountIdeas();
mountRepoLinks();
