(function () {
  var raw = document.getElementById("mind-md").textContent;
  if (!window.markmap || !window.d3) return;
  var root = JSON.parse(raw);
  window.markmap.Markmap.create("svg#mindmap", null, root);
})();
