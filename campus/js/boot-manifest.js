if (location.protocol !== "file:") {
  var manifestLink = document.createElement("link");
  manifestLink.rel = "manifest";
  manifestLink.href = "manifest.webmanifest";
  document.head.appendChild(manifestLink);
}
