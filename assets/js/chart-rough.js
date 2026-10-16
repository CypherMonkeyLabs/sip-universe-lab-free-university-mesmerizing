import rough from "../../vendor/rough.esm.js";

var host = document.getElementById("rough-frame");
if (host) {
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 80");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Sketch frame. The numbers are in the charts below.");
  host.appendChild(svg);
  rough.svg(svg).rectangle(8, 8, 624, 64, { roughness: 1.4, stroke: "#7c3aed", strokeWidth: 2, fill: "#fae8ff" });
  var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", "24");
  label.setAttribute("y", "46");
  label.setAttribute("fill", "#1b1340");
  label.setAttribute("font-size", "18");
  label.textContent = "Counts from this repository. Not traffic.";
  svg.appendChild(label);
}
