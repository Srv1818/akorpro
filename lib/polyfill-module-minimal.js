// Replaces next/dist/build/polyfills/polyfill-module.js
// All other polyfills in that file (trimEnd, flat, fromEntries, at, hasOwn)
// are natively supported by our targets: chrome 96+, firefox 94+, safari 15.4+, edge 96+.
// URL.canParse was added in Safari 17, so it still needs the polyfill.
"canParse" in URL || (URL.canParse = function (url, base) {
  try { return !!new URL(url, base); } catch { return false; }
});
