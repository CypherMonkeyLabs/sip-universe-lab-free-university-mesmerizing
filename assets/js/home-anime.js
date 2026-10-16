import { animate } from "../../vendor/anime.esm.min.js";

var cards = document.querySelectorAll(".mascot-card");
if (cards.length && document.documentElement.dataset.motion !== "reduce") {
  animate(cards, { y: [-4, 4], duration: 1600, loop: true, alternate: true, delay: function (_el, i) { return i * 120; } });
}
