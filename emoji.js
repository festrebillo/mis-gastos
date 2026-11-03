/* Mis Gastos · emoticones de Microsoft (Fluent Emoji, licencia MIT) en lugar de los del teléfono.
   Cambia cada emoji del texto por un dibujo del paquete emoji.svg; si falta alguno (o el paquete no carga) se deja el emoji normal. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg", set = {}, listo = false, activo = false, obs = null, RE = null;
  try { RE = new RegExp("(?:\\p{Regional_Indicator}{2}|[#*0-9]\\uFE0F?\\u20E3|\\p{Extended_Pictographic}(?:\\uFE0F|[\\u{1F3FB}-\\u{1F3FF}])?(?:\\u200D\\p{Extended_Pictographic}\\uFE0F?)*)", "gu"); } catch (e) { RE = null; }
  var SALTAR = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, OPTION: 1, SELECT: 1, TITLE: 1, SVG: 1, svg: 1 };

  function clave(s) {
    var r = [], i = 0, c;
    while (i < s.length) { c = s.codePointAt(i); i += c > 0xFFFF ? 2 : 1; if (c !== 0xFE0F) r.push(c.toString(16)); }
    return r.join("-");
  }
  function nodoEm(k, alt) {
    var s = document.createElementNS(NS, "svg"), u = document.createElementNS(NS, "use");
    s.setAttribute("class", "em"); s.setAttribute("role", "img"); s.setAttribute("aria-label", alt); s.setAttribute("viewBox", "0 0 32 32");
    u.setAttribute("href", "#e-" + k); s.appendChild(u); return s;
  }
  function texto(n) {
    var t = n.nodeValue; if (!t || t.length > 4000) return;
    var p = n.parentNode; if (!p || SALTAR[p.nodeName] || (p.closest && p.closest("svg"))) return;
    RE.lastIndex = 0; if (!RE.test(t)) return;
    RE.lastIndex = 0;
    var frag = document.createDocumentFragment(), ult = 0, m, hubo = false;
    while ((m = RE.exec(t))) {
      var k = clave(m[0]);
      if (!set[k]) continue;                                  // sin dibujo en el paquete: queda el emoji del teléfono
      if (m.index > ult) frag.appendChild(document.createTextNode(t.slice(ult, m.index)));
      frag.appendChild(nodoEm(k, m[0])); ult = m.index + m[0].length; hubo = true;
    }
    if (!hubo) return;
    if (ult < t.length) frag.appendChild(document.createTextNode(t.slice(ult)));
    p.replaceChild(frag, n);
  }
  function procesar(raiz) {
    if (!raiz) return;
    if (raiz.nodeType === 3) { texto(raiz); return; }
    if (raiz.nodeType !== 1 || SALTAR[raiz.nodeName] || (raiz.closest && raiz.closest("svg"))) return;
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, null), arr = [], n;
    while ((n = w.nextNode())) arr.push(n);
    arr.forEach(texto);
  }
  function activar() {
    if (!listo || !RE || activo) return; activo = true;
    procesar(document.body);
    obs = new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === "characterData") texto(m.target);
        else Array.prototype.forEach.call(m.addedNodes, function (n) { procesar(n); });
      });
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  function desactivar() {
    activo = false; if (obs) { obs.disconnect(); obs = null; }
    Array.prototype.forEach.call(document.querySelectorAll("svg.em"), function (s) { s.parentNode.replaceChild(document.createTextNode(s.getAttribute("aria-label") || ""), s); });
  }
  function quiere() { try { var p = JSON.parse(localStorage.getItem("mg_pref")) || {}; return p.emoji !== "sys"; } catch (e) { return true; } }
  function cargar() {
    if (!RE || !window.fetch) return;
    try {
      fetch("emoji.svg").then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (t) {
        var d = document.createElement("div"); d.id = "emoji-pack"; d.setAttribute("aria-hidden", "true"); d.style.cssText = "position:absolute;width:0;height:0;overflow:hidden"; d.innerHTML = t; document.body.appendChild(d);
        Array.prototype.forEach.call(d.querySelectorAll("symbol[id^=e-]"), function (s) { set[s.id.slice(2)] = 1; });
        listo = true; if (quiere()) activar();
      }).catch(function () {});
    } catch (e) {}
  }
  window.MGE = { set: function (si) { if (si) activar(); else desactivar(); }, ok: function () { return listo; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", cargar); else cargar();
})();
