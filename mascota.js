/* Mis Gastos · la mascota: un dragón que se mueve por la pantalla mientras la app está abierta.
   Vive en una capa aparte que NO recibe toques (solo el propio dragón, y solo cuando está quieto), así que nunca estorba al registrar. */
(function () {
  "use strict";
  var A = null, root, md, bub, svgBox, hit;
  var NOMBRES = ["Huevito", "Joven", "Dragón de ahorro"], DW = 84, DH = 68;
  var gen = 0, activo = false, ocupado = false, bucle = false, x = 8, ultima = "", etapaAct = 0, colorKey = "", leyendo = false;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function reducido() { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }

  /* ---------- el dibujo ---------- */
  var uid = 0;
  function paleta() {
    var c = A.color(), a1 = c.a1 || "#22D3EE", a2 = c.a2 || "#8B5CF6", m = A.mix;
    return { b1: m(a1, "#FFFFFF", 0.25), b2: m(m(a1, a2, 0.45), "#000000", 0.22), belly: m(a1, "#FFFFFF", 0.86), wing: a2, wedge: m(a2, "#000000", 0.35), horn: "#FFF1C9", spike: m(a2, "#000000", 0.2), cheek: "#FF9FB0", a2: m(a2, "#FFFFFF", 0.3) };
  }
  function dragon(st, P, o) {
    o = o || {}; var id = "md" + (++uid);
    var S = [null, { br: 23, bh: 21, hr: 27, hv: 24, horn: 7, wing: 0.55, sp: 0, tail: 28, by: 86 }, { br: 27, bh: 24, hr: 28, hv: 24, horn: 12, wing: 0.85, sp: 3, tail: 36, by: 84 }, { br: 30, bh: 26, hr: 29, hv: 24, horn: 18, wing: 1.15, sp: 5, tail: 44, by: 82 }][st];
    var f = function (n) { return n.toFixed(1); }, cx = 60, hy = 50, by = S.by;
    var g = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.b1 + '"/><stop offset="1" stop-color="' + P.b2 + '"/></linearGradient></defs><g transform="translate(14 0)"><g class="md-bd">';
    var bx = cx + S.br - 6, ty = by + S.bh - 10, ex = bx + S.tail, ey = ty - 16;
    g += '<g class="md-tw" style="transform-origin:' + bx + 'px ' + ty + 'px"><path d="M' + bx + " " + ty + " Q" + f(bx + S.tail * 0.8) + " " + (ty + 10) + " " + ex + " " + ey + '" stroke="' + P.b2 + '" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M0 -7L6 0L0 7L-6 0Z" transform="translate(' + ex + " " + ey + ') rotate(-30)" fill="' + P.spike + '"/></g>';
    var wing = '<path d="M0 0C6 -18 22 -32 44 -30C40 -22 42 -14 36 -8C34 -2 30 2 26 4C22 -2 14 -2 8 6Z" fill="' + P.wing + '" stroke="' + P.wedge + '" stroke-width="1.6" stroke-linejoin="round"/><path d="M0 0L44 -30M8 4L36 -8" stroke="' + P.wedge + '" stroke-width="1.3" fill="none" opacity=".7"/>';
    g += '<g class="md-wf md-l" style="transform-origin:46px 64px"><g transform="translate(46 64) scale(' + (-S.wing) + " " + S.wing + ')">' + wing + '</g></g><g class="md-wf md-r" style="transform-origin:74px 64px"><g transform="translate(74 64) scale(' + S.wing + " " + S.wing + ')">' + wing + "</g></g>";
    g += '<ellipse cx="' + cx + '" cy="' + by + '" rx="' + S.br + '" ry="' + S.bh + '" fill="url(#' + id + ')"/><ellipse cx="' + cx + '" cy="' + (by + 3) + '" rx="' + f(S.br * 0.62) + '" ry="' + f(S.bh * 0.78) + '" fill="' + P.belly + '"/>';
    if (st >= 2) for (var k = 0; k < 3; k++) { var yy = by - 6 + k * 8; g += '<path d="M' + f(cx - S.br * 0.45) + " " + yy + " Q" + cx + " " + (yy + 3) + " " + f(cx + S.br * 0.45) + " " + yy + '" stroke="' + P.b1 + '" stroke-width="1.5" fill="none" opacity=".4" stroke-linecap="round"/>'; }
    [-1, 1].forEach(function (d) {
      var fx = cx + d * S.br * 0.55, fy = by + S.bh - 2;
      g += '<ellipse cx="' + f(fx) + '" cy="' + fy + '" rx="10" ry="6" fill="' + P.b2 + '"/>' + [-4, 0, 4].map(function (t) { return '<circle cx="' + f(fx + t) + '" cy="' + (fy + 2) + '" r="1.6" fill="' + P.horn + '"/>'; }).join("");
      var ax = cx + d * (S.br - 1), ay = by - 6; g += '<ellipse cx="' + ax + '" cy="' + ay + '" rx="5" ry="8" fill="' + P.b1 + '" transform="rotate(' + d * 18 + " " + ax + " " + ay + ')"/>';
    });
    if (st === 3) g += '<circle cx="' + cx + '" cy="' + (by + 2) + '" r="8.5" fill="#F4F4F6" stroke="#BDBDC4" stroke-width="1.2"/><text x="' + cx + '" y="' + (by + 5.2) + '" text-anchor="middle" font-family="Arial" font-weight="800" font-size="8.5" fill="#3A3A40">S/</text>';
    var h = S.horn, horn = '<path d="M40 30Q' + f(40 - h * 0.35) + " " + f(30 - h * 0.7) + " " + f(36 - h * 0.1) + " " + f(28 - h) + "Q47 " + f(26 - h * 0.2) + ' 51 30Z" fill="' + P.horn + '" stroke="' + P.spike + '" stroke-width=".8"/>';
    g += horn + '<g transform="translate(120 0) scale(-1 1)">' + horn + "</g>";
    for (var i = 0; i < S.sp; i++) { var sx = cx + (i - (S.sp - 1) / 2) * 7.5, y0 = hy - S.hv + 1; g += '<path d="M' + f(sx - 3.5) + " " + y0 + "L" + f(sx) + " " + f(y0 - 6 - (S.sp > 3 ? 2 : 0)) + "L" + f(sx + 3.5) + " " + y0 + 'Z" fill="' + P.spike + '"/>'; }
    g += '<ellipse cx="' + cx + '" cy="' + hy + '" rx="' + S.hr + '" ry="' + S.hv + '" fill="url(#' + id + ')"/><ellipse cx="' + cx + '" cy="59" rx="14" ry="10" fill="' + P.belly + '"/><ellipse cx="55" cy="57" rx="1.8" ry="2.4" fill="' + P.b2 + '"/><ellipse cx="65" cy="57" rx="1.8" ry="2.4" fill="' + P.b2 + '"/>';
    g += '<path d="M53 63Q60 69 67 63" stroke="#16161A" stroke-width="2" fill="none" stroke-linecap="round"/>' + (st === 3 ? '<path d="M55.5 64.6l1.6 3 1.6-2.2M64.5 64.6l-1.6 3-1.6-2.2" fill="#fff" stroke="#fff" stroke-width=".6"/>' : "");
    g += '<circle cx="36" cy="56" r="5" fill="' + P.cheek + '" opacity=".5"/><circle cx="84" cy="56" r="5" fill="' + P.cheek + '" opacity=".5"/>';
    g += '<g class="md-ey" style="transform-origin:60px 45px"><ellipse cx="47" cy="45" rx="7" ry="8.5" fill="#16161A"/><ellipse cx="73" cy="45" rx="7" ry="8.5" fill="#16161A"/><circle cx="49.2" cy="42" r="2.7" fill="#fff"/><circle cx="75.2" cy="42" r="2.7" fill="#fff"/><circle cx="45" cy="48" r="1.2" fill="#fff"/><circle cx="71" cy="48" r="1.2" fill="#fff"/></g>';
    if (st === 1) g += '<path d="M37 38L42 30L48 36L54 28L60 36L66 28L72 36L78 30L83 38Q60 20 37 38Z" fill="#F4F4F6" stroke="#CFCFD6" stroke-width="1.2" stroke-linejoin="round"/>';
    if (st === 3) g += '<path d="M60 27L65.5 34L60 41L54.5 34Z" fill="' + P.a2 + '" stroke="#fff" stroke-width=".9"/><path d="M57.8 32L60 29.6" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>';
    return '<svg viewBox="0 0 148 120" class="md-svg ' + (o.cls || "") + '"' + (o.w ? ' width="' + o.w + '" height="' + Math.round(o.w * 120 / 148) + '"' : "") + ">" + g + "</g></g></svg>";
  }
  function etapa() { var e = A ? A.etapa() : 1; return e < 1 ? 1 : e > 3 ? 3 : e; }
  function svgActual(o) { return dragon(etapa(), paleta(), o); }

  /* ---------- geometría de la pantalla real ---------- */
  function geo() {
    var ap = $("#app") ? $("#app").getBoundingClientRect() : { left: 0, width: innerWidth };
    var tb = $("#tabs"), top = tb ? tb.getBoundingClientRect().top : innerHeight - 80;
    return { X0: ap.left, W: ap.width, floor: Math.max(40, innerHeight - top - 6), H: innerHeight };
  }
  function ledge() {            // una tarjeta visible donde sentarse
    var g = geo(), m = $("main"), hd = $("#hdr"), minTop = (hd ? hd.getBoundingClientRect().bottom : 100) + 70, maxTop = innerHeight - g.floor - DH - 30, c = [];
    if (!m) return null;
    Array.prototype.forEach.call(m.querySelectorAll(".card, .cc"), function (e) { var r = e.getBoundingClientRect(); if (r.top > minTop && r.top < maxTop && r.width > 160) c.push(r); });
    if (!c.length) return null;
    var r = c[Math.floor(Math.random() * c.length)];
    return { bottom: innerHeight - r.top - 3, x0: Math.max(6, r.left - g.X0 + 10), x1: Math.min(g.W - DW - 6, r.right - g.X0 - DW - 10) };
  }
  function colgadero() { var hd = $("#hdr"); if (!hd) return null; var r = hd.getBoundingClientRect(); return r.bottom > 40 ? innerHeight - r.bottom - DH + 12 : null; }

  /* ---------- movimiento ---------- */
  function w(ms) { var g = gen; return sleep(ms).then(function () { if (g !== gen) throw "cancel"; }); }
  function pos(nx, ny, dur, ease) {
    var g = geo(); md.style.transition = "left " + dur + "s " + (ease || "linear") + ", bottom " + Math.max(0.35, dur / 1.5) + "s ease-out";
    md.style.left = (g.X0 + nx) + "px"; md.style.bottom = ny + "px";
  }
  function tocable(si) { hit.style.pointerEvents = si ? "auto" : "none"; }
  function lejosDelMas() { var g = geo(), c = g.W / 2 - DW / 2; return Math.abs(x - c) > 62; }
  function walk(nx, ny) {
    var g = geo(), d = Math.abs(nx - x), dur = Math.max(0.5, d / 62);
    md.classList.toggle("flip", nx < x); md.classList.add("walk"); tocable(false);
    pos(nx, ny == null ? g.floor : ny, dur); x = nx;
    return w(dur * 1000 + 60).then(function () { md.classList.remove("walk"); tocable(lejosDelMas()); });
  }
  function bubble(t) { bub.textContent = t; bub.classList.remove("on"); void bub.offsetWidth; bub.classList.add("on"); }
  function tmp(el) { el.className += " md-tmp"; root.appendChild(el); return el; }
  function fx(txt, left, bottom, dx, dy, ms) {
    var e = tmp(document.createElement("span")); e.className = "md-fx"; e.textContent = txt; e.style.left = left + "px"; e.style.bottom = bottom + "px";
    requestAnimationFrame(function () { requestAnimationFrame(function () { e.style.transform = "translate(" + dx + "px," + dy + "px)"; e.style.opacity = "0"; }); });
    setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, ms || 950);
  }
  function sparks(n) {
    var g = geo(), fl = md.classList.contains("flip");
    for (var i = 0; i < n; i++) {
      var s = tmp(document.createElement("i")); s.className = "md-sp"; s.style.left = (g.X0 + x + (fl ? 14 : 66)) + "px"; s.style.bottom = (parseFloat(md.style.bottom) + 34) + "px";
      s.style.setProperty("--x", (fl ? -1 : 1) * rnd(24, 64) + "px"); s.style.setProperty("--y", rnd(-26, 24) + "px");
      (function (e) { setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 750); })(s);
    }
  }
  function coin(cx, from) { var c = tmp(document.createElement("div")); c.className = "md-coin"; c.textContent = "S/"; c.style.left = (geo().X0 + cx) + "px"; c.style.bottom = from + "px"; return c; }
  function limpiar() {
    Array.prototype.forEach.call(root.querySelectorAll(".md-tmp"), function (e) { e.parentNode.removeChild(e); });
    var m = md.querySelector(".md-mc"); if (m) m.parentNode.removeChild(m);
    md.classList.remove("walk", "sleep", "hang", "hop", "dance", "wave");
  }
  function alSuelo() { var g = geo(); x = Math.max(0, Math.min(g.W - DW, x)); pos(x, g.floor, 0.5, "ease-in"); tocable(lejosDelMas()); }

  /* ---------- travesuras ---------- */
  var ACTS = {
    pasear: function () { var g = geo(); return walk(rnd(6, g.W - DW - 6)).then(function () { return walk(rnd(6, g.W - DW - 6)); }); },
    dormir: function () { md.classList.add("sleep"); bubble("💤"); return w(1800).then(function () { bubble("💤"); return w(1800); }).then(function () { md.classList.remove("sleep"); }); },
    bostezar: function () { bubble("🥱"); md.classList.add("wave"); return w(1700).then(function () { md.classList.remove("wave"); }); },
    fuego: function () { bubble("🔥"); sparks(10); return w(450).then(function () { sparks(10); return w(800); }); },
    moneda: function () {
      var g = geo(), cx = rnd(24, g.W - 50), c = coin(cx, innerHeight - 90);
      return w(30).then(function () { c.style.bottom = (g.floor + 4) + "px"; return w(800); })
        .then(function () { return walk(Math.max(0, Math.min(g.W - DW, cx - 40))); })
        .then(function () { md.classList.add("hop"); c.parentNode && c.parentNode.removeChild(c); bubble("✨"); sparks(7); return w(550); }).then(function () { md.classList.remove("hop"); });
    },
    asomarse: function () { var g = geo(); return walk(g.W - DW * 0.55).then(function () { md.classList.add("wave"); bubble("👋"); return w(1700); }).then(function () { md.classList.remove("wave"); return walk(g.W - DW - 40); }); },
    travesura: function () {
      var L = ledge(), g = geo(); if (!L) return Promise.resolve();
      var lx = rnd(L.x0, Math.max(L.x0, L.x1));
      return walk(lx).then(function () { md.classList.add("hop"); pos(lx, L.bottom, 0.6, "ease-out"); return w(900); })
        .then(function () { md.classList.remove("hop"); bubble("😈"); var c = coin(lx + DW + 4, L.bottom + 8); return w(500).then(function () { c.style.bottom = (g.floor + 4) + "px"; return w(900); }).then(function () { pos(lx, g.floor, 0.7, "ease-in"); return w(800); }).then(function () { md.classList.add("hop"); c.parentNode && c.parentNode.removeChild(c); bubble("🪙"); sparks(6); return w(550); }); })
        .then(function () { md.classList.remove("hop"); });
    },
    robar: function () {
      var L = ledge(), g = geo(); if (!L) return Promise.resolve();
      var lx = rnd(L.x0, Math.max(L.x0, L.x1));
      return walk(lx).then(function () { md.classList.add("hop"); pos(lx, L.bottom, 0.6, "ease-out"); return w(900); })
        .then(function () { md.classList.remove("hop"); var c = coin(lx + DW + 4, L.bottom + 8); return w(450).then(function () { c.parentNode && c.parentNode.removeChild(c); var m = document.createElement("span"); m.className = "md-mc"; m.textContent = "S/"; md.appendChild(m); bubble("😏"); return w(450); }); })
        .then(function () { pos(lx, g.floor, 0.6, "ease-in"); return w(700); })
        .then(function () { return walk(g.W - DW * 0.55); })
        .then(function () { var m = md.querySelector(".md-mc"); if (m) m.parentNode.removeChild(m); bubble("🏃"); return walk(Math.max(8, g.W - 160)); })
        .then(function () { bubble("😇"); return w(800); });
    },
    colgarse: function () {
      var hb = colgadero(), g = geo(); if (hb == null) return Promise.resolve();
      var hx = rnd(30, Math.max(31, g.W - DW - 30));
      return walk(hx).then(function () { pos(hx, hb, 0.6, "ease-out"); return w(700); })
        .then(function () { md.classList.add("hang"); bubble("🦇"); return w(2800); })
        .then(function () { md.classList.remove("hang"); pos(hx, g.floor, 0.7, "ease-in"); return w(900); });
    },
    bailar: function () {
      md.classList.add("dance"); var g = geo(), p = Promise.resolve();
      [0, 1, 2, 3].forEach(function (i) { p = p.then(function () { md.classList.add("hop"); fx(i % 2 ? "🎶" : "🎵", g.X0 + x + (i % 2 ? 6 : 64), parseFloat(md.style.bottom) + 54, i % 2 ? -14 : 14, -44); return w(520); }).then(function () { md.classList.remove("hop"); return w(80); }); });
      return p.then(function () { md.classList.remove("dance"); });
    },
    mariposa: function () {
      var g = geo(), b = tmp(document.createElement("span")); b.className = "md-fx md-bf"; b.textContent = "🦋"; b.style.left = (g.X0 + g.W - 60) + "px"; b.style.bottom = (g.floor + 120) + "px";
      var p = Promise.resolve();
      [0, 1, 2].forEach(function () { p = p.then(function () { var bx = rnd(30, g.W - 60); b.style.left = (g.X0 + bx) + "px"; b.style.bottom = (g.floor + rnd(60, 190)) + "px"; return walk(Math.max(0, Math.min(g.W - DW, bx - 40))); }).then(function () { return w(250); }); });
      return p.then(function () { md.classList.add("hop"); bubble("😤"); b.style.bottom = innerHeight + "px"; return w(600); }).then(function () { md.classList.remove("hop"); });
    },
    quemar: function () {
      var g = geo(), px = Math.max(110, g.W - 70), e = tmp(document.createElement("span")); e.className = "md-fx md-big"; e.textContent = "🧾"; e.style.left = (g.X0 + px) + "px"; e.style.bottom = (g.floor + 4) + "px";
      return walk(Math.max(0, px - 110)).then(function () { bubble("🔥"); sparks(10); return w(350); }).then(function () { e.classList.add("md-burn"); sparks(10); return w(900); }).then(function () { e.parentNode && e.parentNode.removeChild(e); bubble("✨"); return w(700); });
    }
  };
  var NECESITA = { travesura: "ledge", robar: "ledge", colgarse: "hang" }, QUIETAS = ["dormir", "bostezar", "fuego"];
  function disponibles() {
    var modo = A.pref().mascota || "activa", nombres = Object.keys(ACTS);
    if (modo === "tranquila" || reducido()) nombres = QUIETAS;
    return nombres.filter(function (k) { if (k === ultima) return false; if (NECESITA[k] === "ledge") return !!ledge(); if (NECESITA[k] === "hang") return colgadero() != null; return true; });
  }
  function puedeActuar() {
    var s = A.estado(), modo = A.pref().mascota || "activa", ae = document.activeElement;
    return activo && !document.hidden && modo !== "apagada" && s.cfg && !s.locked && !s.hoja && s.tab !== "registrar" && !(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName));
  }
  function ejecutar(k) {
    var g = gen; ocupado = true; ultima = k;
    return Promise.resolve().then(function () { return ACTS[k](); }).catch(function (e) { if (e !== "cancel") { try { console.error(e); } catch (x) {} } })
      .then(function () { if (g === gen) { limpiar(); alSuelo(); } ocupado = false; });
  }
  function ciclo() {
    if (bucle) return; bucle = true;
    (function paso() {
      var espera = rnd(3200, 7200);
      setTimeout(function () {
        if (!activo) { bucle = false; return; }
        if (!ocupado && puedeActuar()) { var d = disponibles(); if (d.length) { ejecutar(d[Math.floor(Math.random() * d.length)]).then(paso); return; } }
        paso();
      }, espera);
    })();
  }
  function interrumpir() { gen++; ocupado = false; limpiar(); }

  /* ---------- puesta en escena ---------- */
  function pintar(forzar) {
    var e = etapa(), k = (A.color().id || "") + "|" + (A.color().a1 || "") + (A.color().a2 || "") + "|" + e;
    if (!forzar && k === colorKey) return; colorKey = k;
    svgBox.innerHTML = svgActual();
  }
  function reposo() { var g = geo(); x = 8; md.classList.remove("flip"); md.style.transition = "none"; md.style.left = (g.X0 + x) + "px"; md.style.bottom = g.floor + "px"; tocable(lejosDelMas()); }
  function pantalla() {
    if (!A || !root) return;
    var s = A.estado(), modo = A.pref().mascota || "activa", visible = modo !== "apagada" && s.cfg && !s.locked;
    root.hidden = !visible;
    if (!visible) { activo = false; interrumpir(); return; }
    pintar(false);
    var ae = document.activeElement, tecleando = !!(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName));
    md.style.opacity = (s.tab === "registrar" && tecleando) ? "0" : "1";
    if (!activo) { activo = true; reposo(); setTimeout(function () { if (activo && puedeActuar()) { bubble("👋"); } }, 2600); ciclo(); }
    if (s.tab === "registrar" || s.hoja) { if (ocupado) { interrumpir(); alSuelo(); } }
    var e = etapa(), pref = A.pref();
    if (pref.mascotaEtapa == null) { pref.mascotaEtapa = e; A.guardar(); }
    else if (e > pref.mascotaEtapa) { pref.mascotaEtapa = e; A.guardar(); evolucion(e); }
  }
  function evolucion(e) {
    pintar(true); A.toast("🐉 ¡Tu dragón evolucionó: " + NOMBRES[e - 1] + "!", "ok", 4800);
    if (puedeActuar()) { interrumpir(); md.classList.add("hop"); bubble("🎉"); sparks(14); setTimeout(function () { md.classList.remove("hop"); }, 600); }
  }
  function reaccionar(tipo) {
    if (!activo || !puedeActuar()) return;
    if (tipo === "logro" && !ocupado) { ejecutar("bailar"); return; }
    if (tipo === "gasto" && !ocupado) { md.classList.add("hop"); bubble("🪙"); sparks(6); setTimeout(function () { md.classList.remove("hop"); }, 560); }
  }
  function visibilidad(v) { if (!activo) return; if (!v) { interrumpir(); alSuelo(); } }
  function tarjeta() {
    var e = etapa(), n = A.logros(), sig = e === 1 ? 3 : e === 2 ? 7 : 0;
    return '<div class="card md-card">' + dragon(e, paleta(), { w: 118 }) + '<div><div class="lbl">Tu dragón</div><div class="med">' + NOMBRES[e - 1] + '</div><div class="hint">' + (sig ? "Evoluciona con " + sig + " logros (llevas " + n + ")." : "¡Ya es un dragón de ahorro!") + "</div></div></div>";
  }
  function init(api) {
    A = api; if (root) return;
    root = document.createElement("div"); root.id = "mascota"; root.setAttribute("aria-hidden", "true"); root.hidden = true;
    md = document.createElement("div"); md.className = "md"; md.id = "md";
    svgBox = document.createElement("div"); svgBox.className = "md-box"; bub = document.createElement("span"); bub.className = "md-bub"; hit = document.createElement("i"); hit.className = "md-hit";
    md.appendChild(svgBox); md.appendChild(bub); md.appendChild(hit); root.appendChild(md); document.body.appendChild(root);
    hit.addEventListener("click", function () { if (ocupado) return; md.classList.add("hop"); bubble("💖"); var g = geo(); fx("💖", g.X0 + x + 34, parseFloat(md.style.bottom) + 60, 0, -40); setTimeout(function () { md.classList.remove("hop"); }, 540); });
    document.addEventListener("scroll", function () { if (ocupado && (NECESITA[ultima] || ultima === "travesura")) { interrumpir(); alSuelo(); } }, true);
    window.addEventListener("resize", function () { if (activo) { interrumpir(); reposo(); } });
    document.addEventListener("focusin", pantalla); document.addEventListener("focusout", function () { setTimeout(pantalla, 120); });
    if (/mgtest/.test(location.hash)) window.__mdActs = { ACTS: ACTS, ejecutar: ejecutar, etapa: etapa, geo: geo };
    pantalla();
  }
  window.MGM = { ok: function () { return !!A; }, init: init, pantalla: pantalla, reaccionar: reaccionar, visibilidad: visibilidad, tarjeta: tarjeta, svg: function (o) { return svgActual(o); }, NOMBRES: NOMBRES };
})();
