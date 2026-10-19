try {
  var saved = JSON.parse(localStorage.getItem("sip-universe-settings") || "{}");
  if (saved.theme) document.documentElement.dataset.theme = saved.theme;
  if (saved.font) document.documentElement.dataset.font = saved.font;
  if (saved.motion) document.documentElement.dataset.motion = saved.motion;
  else if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.dataset.motion = "reduce";
  if (saved.lang) {
    document.documentElement.lang = saved.lang;
    document.documentElement.dir = saved.lang === "ar" ? "rtl" : "ltr";
  }
} catch (e) {}
