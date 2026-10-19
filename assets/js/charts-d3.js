(function () {
  var node = document.getElementById("d3-lesson-rows");
  if (!node || !window.d3) return;
  var rows = JSON.parse(node.textContent);
  var svg = d3.select("#d3-lessons");
  svg.attr("viewBox", "0 0 " + Math.max(640, 40 + rows.length * 38) + " 220");
  var max = d3.max(rows, function (row) { return row.value; }) || 1;
  svg.selectAll("rect").data(rows).enter().append("rect")
    .attr("x", function (_d, i) { return 20 + i * 38; })
    .attr("y", function (d) { return 180 - Math.round(d.value / max * 140); })
    .attr("width", 24)
    .attr("height", function (d) { return Math.round(d.value / max * 140); })
    .attr("fill", "#7c3aed");
})();
