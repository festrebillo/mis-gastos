/* Mis Gastos · app web (PWA) · conecta con el script de Google del Seguimiento de Gastos.
   Sin librerías. Los datos viven en tu Excel; aquí solo se guardan el enlace del script, el PIN y la última vista. */
(function () {
  "use strict";
  var VERSION = "1.12.2";

  /* ---------- utilidades ---------- */
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var PREF = store("mg_pref") || {};
  PREF.tema = PREF.tema || "auto"; PREF.ocultarAlAbrir = PREF.ocultarAlAbrir === true; delete PREF.oculto; delete PREF.dock;
  function guardarPref() { store("mg_pref", PREF); }
  var PUNTOS = "••••••";
  function money(n) { return "S/ " + (S.ocultoTodo ? PUNTOS : Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })); }
  function fmt2(n) { return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function moneyRaw(n) { return "S/ " + fmt2(n); }
  function bigRaw(n) { return '<sm>S/</sm>' + fmt2(n); }
  function bigMoney(n) { return '<sm>S/</sm>' + (S.ocultoTodo ? PUNTOS : Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })); }
  function nf(n) { return S.ocultoTodo ? "••" : Number(n || 0).toLocaleString("en-US"); }
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function aplicarTema() {
    var oscuro = PREF.tema === "oscuro" || (PREF.tema === "auto" && mq && mq.matches);
    document.documentElement.setAttribute("data-t", oscuro ? "dark" : "light");
  }
  function aplicarPantalla() { document.documentElement.classList.toggle("dock", PREF.flotante !== true); }
  /* ---------- colores de acento (negro de base + combinación de colores a elegir) ---------- */
  var COLORES = [
    { id: "neutro", n: "Original" },
    { id: "aurora", n: "Aurora", a1: "#22D3EE", a2: "#8B5CF6", t: "#10143A" },
    { id: "fogata", n: "Fogata", a1: "#FFC24A", a2: "#FF6A1F", t: "#1E150E" },
    { id: "coral", n: "Coral", a1: "#22D3EE", a2: "#FF7A59", t: "#241410" },
    { id: "oceano", n: "Océano", a1: "#2DD4BF", a2: "#3B82F6", t: "#0A1A33" },
    { id: "atardecer", n: "Atardecer", a1: "#FB923C", a2: "#F0629F", t: "#22102A" },
    { id: "neon", n: "Neón", a1: "#22D3EE", a2: "#E879F9", t: "#1A0F2E" },
    { id: "hielo", n: "Hielo y fuego", a1: "#67E8F9", a2: "#FB7185", t: "#1E1020" },
    { id: "galaxia", n: "Galaxia", a1: "#22D3EE", a2: "#F472B6", t: "#150F2E" },
    { id: "selva", n: "Selva", a1: "#34D399", a2: "#06B6D4", t: "#08201C" },
    { id: "sakura", n: "Sakura", a1: "#F9A8D4", a2: "#A78BFA", t: "#261022" },
    { id: "lava", n: "Lava", a1: "#FB923C", a2: "#EF4444", t: "#240D0A" },
    { id: "lima", n: "Lima", a1: "#A3E635", a2: "#22C55E", t: "#0E1E0A" },
    { id: "medianoche", n: "Medianoche", a1: "#60A5FA", a2: "#6366F1", t: "#070B24" },
    { id: "cereza", n: "Cereza", a1: "#FB7185", a2: "#F43F5E", t: "#250A12" },
    { id: "mandarina", n: "Mandarina", a1: "#FBBF24", a2: "#F97316", t: "#231409" }
  ];
  function hexRgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16) || 0; }); }
  function hexLum(h) { var c = hexRgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function hexMix(a, b, t) { var x = hexRgb(a), y = hexRgb(b); return "#" + x.map(function (v, i) { return ("0" + Math.round(v + (y[i] - v) * t).toString(16)).slice(-2); }).join(""); }
  function colorActual() {
    var id = PREF.color || "aurora";
    if (id === "custom" && PREF.colorCustom) return { id: "custom", n: "Tu combinación", a1: PREF.colorCustom.a1, a2: PREF.colorCustom.a2, t: hexMix(PREF.colorCustom.a2, "#000000", 0.85) };
    return COLORES.filter(function (x) { return x.id === id; })[0] || COLORES[1];
  }
  function aplicarColor() {
    var c = colorActual(), r = document.documentElement.style, k = ["--a1", "--a2", "--tint", "--onacc", "--focus"];
    if (!c.a1) { k.forEach(function (p) { r.removeProperty(p); }); document.documentElement.removeAttribute("data-c"); return; }
    var rgb = hexRgb(c.a1);
    r.setProperty("--a1", c.a1); r.setProperty("--a2", c.a2); r.setProperty("--tint", c.t);
    r.setProperty("--onacc", Math.min(hexLum(c.a1), hexLum(c.a2)) < 0.15 ? "#FFFFFF" : "#05131B");     // texto legible sobre el degradado
    r.setProperty("--focus", "rgba(" + rgb.join(",") + ",.28)");
    document.documentElement.setAttribute("data-c", "1");
  }
  aplicarColor();
  aplicarTema(); aplicarPantalla();
  if (mq && mq.addEventListener) mq.addEventListener("change", aplicarTema);
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; }
  var MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
  var MABR = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SET", "OCT", "NOV", "DIC"];
  var DABR = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  function pad(n) { return ("0" + n).slice(-2); }
  function parseF(s) { var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(s || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)) : null; }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function fechaCorta(s) { var d = parseF(s); return d ? pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() : ""; }
  function mesClave(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1); }
  function mesMover(clave, delta) { var p = clave.split("-"); return mesClave(new Date(+p[0], +p[1] - 1 + delta, 1)); }
  function mesNombre(clave) { var p = clave.split("-"); return MESES[+p[1] - 1] + " " + p[0]; }

  var I = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>',
    card: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/></svg>',
    dots: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/></svg>',
    bud: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    fix: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4M9 15l2 2 4-4"/></svg>',
    rep: '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-9-9v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeoff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 6.7C3.9 8.4 2 12 2 12s3.6 6 10 6c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    medal: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="6"/><path d="M8.6 14 7 21l5-3 5 3-1.6-7"/></svg>',
    cog: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/></svg>'
  };

  /* ---------- estado ---------- */
  var cfg = store("mg_cfg") || null;
  var S = {
    tab: "inicio", sub: null, estado: store("mg_estado"), cargando: false,
    F: nuevoForm(), G: { mes: mesClave(new Date()), q: "", cat: "", metodo: "", data: null, cargando: false },
    T: { cargando: false }, P: {}, FJ: { data: null, sel: {} }, IN: { mes: mesClave(new Date()), data: null }, lugares: []
  };
  function nuevoForm() { return { modo: "gasto", monto: "", lugar: "", cat: "", catAuto: true, metodo: "Saldo Disponible", detalle: "", desc: "", extra: "", ruc: "", fechaDoc: "", guardando: false }; }
  function esExtra(d) { d = String(d || "").trim(); return !d || /^ingreso extra$/i.test(d); }   // sin descripción o «Ingreso Extra»: se pide un pequeño detalle

  S.ver = { ahorro: false, deuda: false };
  S.ocultoTodo = PREF.ocultarAlAbrir === true;      // por defecto solo «Ahorro» y «Deuda» arrancan ocultos; lo demás se ve
              // los montos grandes arrancan ocultos cada vez que abres la app
  function visK(k) { return S.ver[k] === true; }              // «Ahorro» y «Deuda» solo dependen de su propio ojito
  function mk(n, k) { return visK(k) ? moneyRaw(n) : "S/ " + PUNTOS; }
  function bigK(n, k) { return visK(k) ? bigRaw(n) : '<sm>S/</sm>' + PUNTOS; }
  function ojoK(k, claro) { return '<button class="eye' + (claro ? " w" : "") + '" data-a="ver" data-v="' + k + '" aria-label="Mostrar u ocultar">' + (visK(k) ? I.eye : I.eyeoff) + '</button>'; }

  /* ---------- conexión ---------- */
  function call(body) {
    if (cfg && cfg.demo) return window.MG_OFFLINE ? Promise.reject(new TypeError("Failed to fetch")) : window.MG_DEMO(body);
    return fetch(cfg.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body), redirect: "follow" })
      .then(function (r) { return r.json(); });
  }
  function app(op, extra) {
    return call(Object.assign({ tipo: "app", op: op, pin: cfg.pin }, extra || {})).then(function (j) {
      if (j && j.status === "error") { var e = new Error(j.mensaje || "Error"); e.codigo = j.codigo; throw e; }
      return j;
    });
  }
  function fail(e) {
    if (e && (e.codigo === "pin" || e.codigo === "sin_pin" || e.codigo === "bloqueado")) { S.setupMsg = e.message; cfg = null; store("mg_cfg", null); render(); return; }
    toast(esRed(e) ? "Sin conexión. Inténtalo de nuevo." : ((e && e.message) || "Error"), "err");
  }
  function esRed(e) { return !!e && (e instanceof TypeError || /Failed to fetch|Load failed|NetworkError|network/i.test(e.message || "")); }
  var tt;
  function toast(msg, tipo, ms) {
    var t = $("#toast"); t.textContent = msg; t.className = "show " + (tipo || ""); clearTimeout(tt);
    tt = setTimeout(function () { t.className = ""; }, ms || 3200);
  }

  /* ---------- pantallas ---------- */
  function header(peq, tit, accion) {
    return '<div><small>' + esc(peq) + '</small><h1>' + tit + '</h1></div>' + (accion || "");
  }
  function tabsHtml() {
    function b(id, ico, txt) { return '<button class="tab" data-a="tab" data-v="' + id + '">' + I[ico] + txt + '</button>'; }
    return '<nav class="tabs" id="tabs"><span class="ind" id="ind"></span>' + b("inicio", "home", "Inicio") + b("gastos", "list", "Gastos") +
      '<button class="tab plus" data-a="tab" data-v="registrar"><span class="c">' + I.plus + '</span>Registrar</button>' +
      b("tarjeta", "card", "Tarjeta") + b("mas", "dots", "Más") + '</nav>';
  }
  function marcarTabs() {
    var orden = ["inicio", "gastos", "registrar", "tarjeta", "mas"], i = Math.max(0, orden.indexOf(S.tab));
    Array.prototype.forEach.call(document.querySelectorAll("#tabs .tab"), function (b) { b.classList.toggle("on", b.getAttribute("data-v") === S.tab); });
    var ind = $("#ind"); if (ind) { ind.style.transform = "translateX(" + (i * 100) + "%)"; ind.style.opacity = S.tab === "registrar" ? "0" : "1"; }
  }
  /* barras que crecen al entrar la pantalla y números que suben contando */
  function wi(p) { p = Math.max(0, Math.min(100, Number(p) || 0)); return S.anim ? 'style="width:0%" data-w="' + p + '"' : 'style="width:' + p + '%"'; }
  function reducido() { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function animar() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-w]"), function (e) { requestAnimationFrame(function () { requestAnimationFrame(function () { e.style.width = e.getAttribute("data-w") + "%"; }); }); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-da]"), function (e) { requestAnimationFrame(function () { requestAnimationFrame(function () { e.style.strokeDasharray = e.getAttribute("data-da"); }); }); });
    contarNumeros();
  }
  function contarNumeros() {
    if (reducido()) return;
    Array.prototype.forEach.call(document.querySelectorAll("[data-n]"), function (e) {
      var fin = parseFloat(e.getAttribute("data-n")); if (!isFinite(fin)) return;
      var t0 = performance.now(), dur = 850;
      (function f(t) { var k = Math.min(1, (t - t0) / dur), v = fin * (1 - Math.pow(1 - k, 3)); e.innerHTML = bigRaw(v); if (k < 1) requestAnimationFrame(f); })(t0);
    });
  }
  function skel(n) { var h = ""; for (var i = 0; i < (n || 3); i++) h += '<div class="sk" style="height:' + (i === 0 ? 132 : 104) + 'px"></div>'; return h; }
  function ocupado(txt) { $("#busy-t").textContent = txt || "Cargando…"; $("#busy").classList.add("on"); }
  function libre() { $("#busy").classList.remove("on"); }
  function celebrar() { var o = $("#okpop"); o.classList.remove("go"); void o.offsetWidth; o.classList.add("go"); if (window.MGM) MGM.reaccionar("gasto"); }
  function limpiarNum(v) { v = String(v).replace(/[^0-9.,]/g, ""); var i = v.search(/[.,]/); return i > -1 ? v.slice(0, i + 1) + v.slice(i + 1).replace(/[.,]/g, "") : v; }
  function swr(inner, editA, fila, tipo) {
    return '<div class="swr"><div class="acts"><button class="ed" data-a="' + editA + '" data-v="' + fila + '">' + I.edit + 'Editar</button><button class="bo" data-a="borrarAsk" data-v="' + tipo + ':' + fila + '">' + I.trash + 'Borrar</button></div><div class="fg">' + inner + '</div></div>';
  }
  var refreshBtn = '<button class="ic" data-a="refrescar" aria-label="Actualizar">' + I.refresh + '</button>';
  function accionesHdr() {
    return '<div style="display:flex;gap:8px"><button class="ic" data-a="ojo" aria-label="Mostrar u ocultar montos">' + (S.ocultoTodo ? I.eyeoff : I.eye) + '</button>' + refreshBtn + '</div>';
  }

  function render() {
    var el = $("#app");
    var ae = document.activeElement, aeId = ae && ae.id === "g-q" ? ae.id : null, aeSel = aeId ? ae.selectionStart : 0;
    if (!cfg) { document.documentElement.setAttribute("data-s", "auth"); el.removeAttribute("data-skel"); el.innerHTML = vistaSetup(); mascotaPantalla(); return; }
    if (S.locked) { document.documentElement.setAttribute("data-s", "auth"); cerrarHoja(); el.removeAttribute("data-skel"); el.innerHTML = vistaLock(); if (PREF.bio && !S.bioT) { S.bioT = true; setTimeout(bioEntrar, 450); } mascotaPantalla(); return; }
    if (el.getAttribute("data-skel") !== "1") { el.innerHTML = '<div class="hdr" id="hdr"></div><main id="main"></main>' + tabsHtml(); el.setAttribute("data-skel", "1"); S.vk = null; }
    document.documentElement.setAttribute("data-s", "main");
    var h = "", m = "";
    var E = S.estado;
    if (S.tab === "inicio") { h = header(fechaHoyLarga(), saludo() + ", <b>" + esc(E ? E.nombre : "") + '</b> ' + saludoIco(), accionesHdr()); m = vistaInicio(); }
    else if (S.tab === "registrar") { h = header("Nuevo registro", "Registrar"); m = vistaRegistrar(); }
    else if (S.tab === "gastos") { h = header("Historial", "Gastos", accionesHdr()); m = vistaGastos(); }
    else if (S.tab === "tarjeta") { h = header("Tarjeta de crédito", "Tarjeta y ahorro", accionesHdr()); m = vistaTarjeta(); }
    else { var tt2 = { presupuesto: "Presupuesto", fijos: "Gastos fijos", informes: "Informes", logros: "Logros", ajustes: "Ajustes" }[S.sub] || "Más"; h = header(S.sub ? "Más" : "Menú", tt2); m = vistaMas(); }
    var main = $("#main"), vk = S.tab + "/" + (S.sub || ""), sc = S.vk === vk ? main.scrollTop : 0;
    $("#hdr").innerHTML = h; main.innerHTML = m; main.scrollTop = sc; S.vk = vk;
    marcarTabs();
    if (S.anim) {
      main.classList.add("anim");
      Array.prototype.forEach.call(main.children, function (c, i) { c.style.setProperty("--i", Math.min(i, 8)); });
      animar(); clearTimeout(S.ta); S.ta = setTimeout(function () { main.classList.remove("anim"); }, 1200); S.anim = false;
    } else main.classList.remove("anim");
    if (S.tab === "registrar") enlazarRegistrar();
    if (aeId && $("#" + aeId)) { var n = $("#" + aeId); n.focus(); try { n.setSelectionRange(aeSel, aeSel); } catch (x) {} }
    mascotaPantalla();
  }

  /* ---- Inicio ---- */
  function bannerCola() {
    var c = cola(), pend = c.filter(function (x) { return !x.error; }).length, err = c.length - pend;
    if (!c.length) return "";
    return '<div class="alert" style="flex-wrap:wrap">' +
      (pend ? '<span>⏳</span><span style="flex:1;text-align:left">' + pend + ' registro' + (pend > 1 ? "s" : "") + ' pendiente' + (pend > 1 ? "s" : "") + ' de enviar</span><button class="linkbtn" data-a="enviarCola">Enviar ahora</button>' : "") +
      (err ? '<button class="linkbtn" data-a="ir" data-v="ajustes" style="width:100%;text-align:left">⚠️ ' + err + ' no se pudo enviar · revisar</button>' : "") + '</div>';
  }
  function metaCard(E) {
    var m = E.metaAhorro;
    if (!m) return '<button class="card" data-a="hojaMeta"><div class="rowh"><span class="lbl">Meta de ahorro mensual</span><span class="linkbtn">Definir</span></div><p class="hint" style="margin-top:4px">Elige cuánto quieres ahorrar cada mes y sigue tu avance aquí.</p></button>';
    var ok = m.logrado >= m.objetivo && m.objetivo > 0, pc = m.objetivo > 0 ? Math.max(0, Math.min(100, Math.round(m.logrado / m.objetivo * 100))) : 0;
    var falta = Math.max(0, m.objetivo - m.logrado);
    return '<button class="card" data-a="hojaMeta"><div class="rowh"><span class="lbl">Meta de ahorro del mes</span><span class="hint">' + (m.tipo === "pct" ? m.valor + " % de tus ingresos" : money(m.valor) + " al mes") + '</span></div>' +
      '<div class="med" style="margin-top:4px">' + money(m.logrado) + ' <span style="font-size:14px;color:var(--mut);font-weight:600">de ' + money(m.objetivo) + '</span></div>' +
      '<div class="bar' + (ok ? " ok" : "") + '"><i ' + wi(pc) + '></i></div>' +
      '<div class="hint" style="margin-top:6px">' + (m.logrado < 0 ? "Este mes llevas más gastos que ingresos." : ok ? "🎉 ¡Meta cumplida este mes!" : "Te faltan " + money(falta) + " para tu meta") + '</div></button>';
  }
  function hojaMeta() {
    var m = S.estado && S.estado.metaAhorro, tipo = m ? m.tipo : "pct"; S.metaTipo = tipo;
    abrirHoja('<div class="grab"></div><h3>Meta de ahorro mensual</h3><p class="hint">Cuánto quieres ahorrar cada mes. Se mide con lo que realmente sumas a tu cuenta: ingresos menos gastos con Saldo Disponible.</p>' +
      '<div class="seg" id="m-seg"><button class="' + (tipo === "pct" ? "on" : "") + '" data-a="metaTipo" data-v="pct">% de ingresos</button><button class="' + (tipo === "monto" ? "on" : "") + '" data-a="metaTipo" data-v="monto">Monto fijo</button></div>' +
      '<div><label class="l" id="m-lbl">' + (tipo === "pct" ? "Porcentaje (%)" : "Monto al mes (S/)") + '</label><input class="field" id="m-val" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" enterkeyhint="done" autocomplete="off" value="' + (m ? m.valor : "") + '" placeholder="' + (tipo === "pct" ? "Ej.: 20" : "Ej.: 600") + '"></div>' +
      '<button class="btn" data-a="metaGuardar">Guardar meta</button>' + (m ? '<button class="btn sec2" data-a="metaQuitar">Quitar meta</button>' : "") + '<button class="btn sec2" data-a="cerrar">Cancelar</button>');
  }
  function vistaInicio() {
    var E = S.estado;
    if (!E) return skel(3);
    var h = fraseHtml() + bannerCola() + (S.offline ? '<div class="hint" style="text-align:center">📴 Sin conexión · mostrando tus últimos datos guardados</div>' : ""), pill;
    pill = "";   // el ahorro ya es el saldo de la cuenta; el saldo del banco fue solo un corte inicial
    h += '<div class="cc"><div class="rowh"><span class="lbl">Ahorro disponible hoy</span>' + ojoK("ahorro", true) + '</div><div class="big"' + (visK("ahorro") ? ' data-n="' + E.ahorro + '"' : "") + '>' + bigK(E.ahorro, "ahorro") + '</div>' + pill +
      (E.reserva > 0 ? '<div class="kv" style="margin-top:8px"><span>🔒 Reservado para fijos</span><b>' + mk(E.reserva, "ahorro") + '</b></div>' : "") + '</div>';
    var t = E.tarjeta;
    if (t) {
      h += '<div class="cc"><div class="rowh"><span class="lbl">Deuda de la tarjeta</span>' + ojoK("deuda", true) + '</div><div class="big"' + (visK("deuda") ? ' data-n="' + t.deuda + '"' : "") + '>' + bigK(t.deuda, "deuda") + '</div>' +
        '<div class="two"><div>A pagar antes del ' + esc(t.limite ? fechaCorta(t.limite).slice(0, 5) : "—") + '<b>' + mk(t.pendiente, "deuda") + '</b></div>' +
        '<div>Quedan<b class="w">' + (t.diasLimite === null ? "—" : t.diasLimite + " días") + '</b></div></div></div>';
    }
    var pc = E.ingresos > 0 ? Math.min(100, Math.round(E.gastos / E.ingresos * 100)) : 0;
    h += '<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="lbl">Gastado este mes</span></div>' +
      '<div class="med">' + money(E.gastos) + '</div><div class="bar' + (E.gastos > E.ingresos ? ' b' : '') + '"><i ' + wi(pc) + '></i></div>' +
      '<div class="hint" style="margin-top:6px">💵 Saldo ' + money(E.gastosSaldo) + ' · 💳 Tarjeta ' + money(E.gastosTarjeta) + '</div></div>';
    h += metaCard(E) + ritmoCard() + retoCard() + atajosInicio();
    if (E.fijosPendientes > 0) h += '<button class="alert" data-a="ir" data-v="fijos"><span>⚠️</span><span style="flex:1;text-align:left">Fijos pendientes: <b>' + money(E.fijosPendientesMonto) + '</b> (' + E.fijosPendientes + ')</span><span class="chev">›</span></button>';
    var conTope = E.presupuesto.filter(function (p) { return p.tope && !p.referencia; }).sort(function (a, b) { return (b.pct || 0) - (a.pct || 0); }).slice(0, 4);
    if (conTope.length) {
      h += '<div class="sec"><span>Presupuesto</span><button class="linkbtn" data-a="ir" data-v="presupuesto">Ver todo</button></div><div class="card">';
      conTope.forEach(function (p) { h += filaPres(p, false); });
      h += '</div>';
    }
    (E.avisos || []).forEach(function (a) { h += '<div class="alert">ℹ️ ' + esc(a) + '</div>'; });
    return h;
  }
  function claseEstado(pct) { return pct === null ? "" : pct > 100 ? "b" : pct >= 80 ? "w" : "ok"; }
  function textoEstado(pct) { return pct === null ? "Sin tope" : pct > 100 ? "🔴 Excedido" : pct >= 80 ? "🟠 Al límite" : "🟢 En control"; }
  function filaPres(p, editable) {
    var pct = p.tope ? Math.min(100, p.pct || 0) : 0, c = claseEstado(p.pct);
    var inner = '<div style="display:flex;justify-content:space-between;gap:8px;font-size:14px"><b style="font-weight:600">' + p.emoji + ' ' + esc(p.categoria) + '</b><span style="color:var(--mut);font-variant-numeric:tabular-nums">' +
      money(p.gastado) + (p.tope ? ' / ' + money(p.tope) + (p.referencia ? ' ref.' : '') : "") + '</span></div>' +
      (p.tope ? '<div class="bar ' + c + '"><i ' + wi(pct) + '></i></div><div class="hint" style="margin-top:4px">' + textoEstado(p.pct) + (p.referencia ? " (promedio de meses anteriores)" : "") + '</div>' : '<div class="hint" style="margin-top:2px">Sin tope · toca para fijar uno</div>');
    return editable ? '<button class="it" style="display:block" data-a="topeEditar" data-v="' + esc(p.categoria) + '">' + inner + '</button>' : '<div style="padding:7px 0">' + inner + '</div>';
  }

  /* ---- Registrar ---- */
  function vistaRegistrar() {
    var F = S.F, E = S.estado, h = bannerCola();
    h += '<div class="seg" role="tablist"><button class="' + (F.modo === "gasto" ? "on" : "") + '" data-a="modo" data-v="gasto">Gasto</button><button class="' + (F.modo === "ingreso" ? "on" : "") + '" data-a="modo" data-v="ingreso">Ingreso</button><button class="' + (F.modo === "fijos" ? "on" : "") + '" data-a="modo" data-v="fijos">Fijos</button></div>';
    if (F.modo === "fijos") return h + vistaFijos();
    if (F.modo === "gasto" && F.fechaDoc) h += '<div class="hint">🧾 Fecha de la boleta: <b>' + esc(fechaCorta(F.fechaDoc)) + '</b> · <button class="linkbtn" data-a="quitarFechaDoc">usar hoy</button></div>';
    if (F.modo === "gasto") h += '<div class="filt"><button class="chip" data-a="hojaQR">📷 Escanear QR</button><button class="chip" data-a="hojaVoz">🎤 Dictar</button>' + tplLista().map(function (x, i) { return '<button class="chip" data-a="tpl" data-v="' + i + '">⭐ ' + esc(x.n) + ' · S/ ' + x.monto + '</button>'; }).join("") + '</div>';
    h += '<div class="amt"><span>S/</span><input id="f-monto" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" enterkeyhint="done" autocomplete="off" placeholder="0.00" value="' + esc(F.monto) + '" aria-label="Monto"></div>';
    if (F.modo === "gasto") {
      h += '<div><label class="l">Lugar</label><button class="catline" data-a="elegirLugar"><span>' + (F.lugar ? "📍 " + esc(F.lugar) : '<span style="color:var(--mut)">Toca para elegir el lugar</span>') + '</span><em>' + (F.lugar ? "Cambiar" : "Elegir") + '</em></button></div>';
      h += '<div><label class="l">Categoría</label><button class="catline" id="f-cat" data-a="elegirCat">' + catTxt() + '<em>' + (F.catAuto && F.cat ? "Sugerida · Cambiar" : "Cambiar") + '</em></button></div>';
      h += '<div><label class="l">Pagado con</label><div class="mset"><button class="' + (F.metodo === "Saldo Disponible" ? "on" : "") + '" data-a="metodo" data-v="Saldo Disponible">💵 Saldo Disponible</button><button class="' + (F.metodo === "Tarjeta de Crédito" ? "on" : "") + '" data-a="metodo" data-v="Tarjeta de Crédito">💳 Tarjeta</button></div></div>';
      h += '<div><label class="l" for="f-det">Detalle (opcional)</label><input class="field" id="f-det" autocomplete="off" placeholder="Almuerzo, regalo…" value="' + esc(F.detalle) + '"></div>';
      h += '<div id="puedo-w">' + puedoHtml() + '</div>';
      h += '<button class="btn sec2 mini2" data-a="tplGuardar">⭐ Guardar como plantilla</button>';
    } else {
      h += '<div><label class="l" for="f-desc">Descripción</label><input class="field" id="f-desc" autocomplete="off" placeholder="Ej.: Primera Quincena" value="' + esc(F.desc) + '"><div class="chips">' +
        ["Primera Quincena", "Segunda Quincena", "Ingreso Extra"].map(function (x) { return '<button class="chip' + (F.desc === x ? " sel" : "") + '" data-a="desc" data-v="' + x + '">' + x + '</button>'; }).join("") + '</div></div>';
      h += '<div id="f-extra-w"' + (esExtra(F.desc) ? "" : " hidden") + '><label class="l" for="f-extra">¿De qué fue? (un pequeño detalle)</label><input class="field" id="f-extra" autocomplete="off" placeholder="Ej.: venta de laptop, bono, reembolso" value="' + esc(F.extra) + '"><div class="chips">' +
        ["Venta", "Bono", "Reembolso", "Regalo", "Préstamo devuelto"].map(function (x) { return '<button class="chip" data-a="extraDet" data-v="' + x + '">' + x + '</button>'; }).join("") + '</div></div>';
    }
    h += '<button class="btn" id="f-ok" data-a="guardar"' + (F.guardando ? " disabled" : "") + '>' + (F.guardando ? '<span class="spin"></span> Guardando…' : (F.modo === "gasto" ? "Guardar gasto" : "Guardar ingreso")) + '</button>';
    return h;
  }
  function catTxt() {
    var F = S.F; if (!F.cat) return '<span style="color:var(--mut)">Se sugiere al elegir el lugar</span>';
    var c = (S.estado && S.estado.categoriasActivas || []).filter(function (x) { return x.nombre === F.cat; })[0];
    return '<span>' + (c ? c.emoji + " " : "") + esc(F.cat) + '</span>';
  }
  function pintarSugerencias(frecuentes) {
    var box = $("#f-sug"); if (!box) return;
    var lista = frecuentes ? ((S.estado && S.estado.frecuentes) || []) : S.lugares;
    box.innerHTML = (frecuentes && lista.length ? '<span class="hint" style="width:100%">Frecuentes · un toque</span>' : "") +
      lista.map(function (l) { return '<button class="chip' + (S.F.lugar === l ? " sel" : "") + '" data-a="lugar" data-v="' + esc(l) + '">' + esc(l) + '</button>'; }).join("");
  }
  var tl;
  function enlazarRegistrar() {
    var m = $("#f-monto"), l = $("#f-lugar"), d = $("#f-det"), ds = $("#f-desc"), ex = $("#f-extra");
    if (m) m.addEventListener("input", function () { var v = limpiarNum(m.value); if (v !== m.value) m.value = v; S.F.monto = v; pintarPuedo(); });
    if (d) d.addEventListener("input", function () { S.F.detalle = d.value; });
    if (ds) ds.addEventListener("input", function () { S.F.desc = ds.value; var w = $("#f-extra-w"); if (w) w.hidden = !esExtra(ds.value); });
    if (ex) ex.addEventListener("input", function () { S.F.extra = ex.value; });
    if (l) {
      l.addEventListener("input", function () {
        S.F.lugar = l.value; clearTimeout(tl);
        if (!l.value.trim()) { S.lugares = []; pintarSugerencias(true); return; }
        tl = setTimeout(function () {
          call({ tipo: "lugares", q: l.value.trim() }).then(function (j) {
            S.lugares = (j.lugares || []).filter(function (x) { return !/^(✏️|🔍)/.test(x); }).slice(0, 8); pintarSugerencias(false);
          }).catch(function () {});
        }, 250);
      });
      l.addEventListener("change", function () { sugerirCat(l.value.trim()); });
      pintarSugerencias(!S.F.lugar.trim());
    }
  }
  function sugerirCat(lugar) {
    if (!lugar || !S.F.catAuto) return;
    call({ tipo: "sugerir", lugar: lugar }).then(function (j) {
      if (j && j.habitual && S.F.catAuto) { S.F.cat = j.habitual; var b = $("#f-cat"); if (b) b.innerHTML = catTxt() + '<em>Sugerida · Cambiar</em>'; }
    }).catch(function () {});
  }
  function guardar() {
    var F = S.F, monto = parseFloat(String(F.monto).replace(",", "."));
    if (!(monto > 0)) { toast("Escribe un monto mayor que 0", "err"); return; }
    var body;
    if (F.modo === "gasto") {
      if (!F.lugar.trim()) { toast("Escribe o elige el lugar", "err"); return; }
      body = { tipo: "gasto", tienda: F.lugar.trim(), categoria: F.cat, metodoPago: F.metodo, monto: monto, descripcion: F.detalle.trim() };
    } else {
      var dsc = F.desc.trim();
      if (esExtra(dsc)) {                                                           // ingreso extra: se pide qué fue, como en el atajo
        var det = F.extra.trim();
        if (!det) { toast("Cuéntame de qué fue el ingreso: escribe un pequeño detalle", "err"); var ee = $("#f-extra"); if (ee) ee.focus(); return; }
        dsc = det;                                                                  // se guarda con lo que escribes, para saber de qué fue
      }
      body = { tipo: "ingreso", descripcion: dsc, monto: monto };
    }
    if (F.modo === "gasto") {
      if (F.fechaDoc) body.fecha = F.fechaDoc + "T12:00:00";                       // fecha impresa en la boleta
      if (F.ruc && F.lugar.trim()) { PREF.rucs = PREF.rucs || {}; PREF.rucs[F.ruc] = F.lugar.trim(); guardarPref(); }   // la próxima vez este RUC se reconoce solo
    }
    enviar(body, (F.modo === "gasto" ? body.tienda : body.descripcion) + " · " + money(body.monto), true);
  }
  function enviar(body, nota, desdeForm) {
    body.idr = nuevoId(); body.fecha = body.fecha || fechaLocal(new Date());     // id único (evita duplicados al reenviar) y hora real del registro
    if (desdeForm) { S.F.guardando = true; render(); }
    return call(body).then(function (j) {
      if (j.status === "error") throw new Error(j.mensaje);
      if (desdeForm) { var modo = S.F.modo; S.F = nuevoForm(); S.F.modo = modo; }
      S.G.data = null; S.T.cargado = false; S.retoTs = 0;
      toast(j.mensaje || "✅ Guardado", "ok", 4800); celebrar(); cargarEstado(true); render(); enviarCola(false);
    }).catch(function (e) {
      if (desdeForm) S.F.guardando = false;
      if (esRed(e)) {
        encolar(body, nota);
        if (desdeForm) { var modo2 = S.F.modo; S.F = nuevoForm(); S.F.modo = modo2; }
        render(); toast("📴 Sin conexión: guardado en el teléfono. Se enviará solo cuando vuelva internet.", "ok", 5600); return;
      }
      render(); fail(e);
    });
  }
  /* ---- registros pendientes (sin conexión) ---- */
  var COLA_K = "mg_cola", enviando = false;
  function nuevoId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function fechaLocal(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()); }
  function cola() { return store(COLA_K) || []; }
  function encolar(body, nota) { var c = cola(); c.push({ id: body.idr, body: body, nota: nota, ts: Date.now() }); store(COLA_K, c); }
  function repintar() { var a = document.activeElement; if (!a || (a.tagName !== "INPUT" && a.tagName !== "TEXTAREA")) render(); }
  function enviarCola(manual) {
    if (enviando || !cfg || S.locked) return;
    if (!cola().some(function (x) { return !x.error; })) { if (manual) toast("No hay nada pendiente"); return; }
    enviando = true; var enviados = 0;
    (function paso() {
      var it = cola().filter(function (x) { return !x.error; })[0];
      if (!it) {
        enviando = false;
        if (enviados) { toast("✅ Se enviaron " + enviados + " registro" + (enviados > 1 ? "s" : "") + " pendiente" + (enviados > 1 ? "s" : ""), "ok", 4200); S.G.data = null; cargarEstado(true); if (S.tab === "gastos") cargarGastos(); }
        repintar(); return;
      }
      call(it.body).then(function (j) {
        var c2 = cola();
        if (j && j.status === "error") c2.forEach(function (x) { if (x.id === it.id) x.error = j.mensaje || "Rechazado"; });
        else { c2 = c2.filter(function (x) { return x.id !== it.id; }); enviados++; }
        store(COLA_K, c2); paso();
      }).catch(function (e) { enviando = false; if (manual) toast(esRed(e) ? "Aún sin conexión" : e.message, "err"); repintar(); });
    })();
  }
  function hojaCategorias() {
    var cats = (S.estado && S.estado.categoriasActivas) || [], hab = S.F.habitual || "";
    var orden = cats.slice().sort(function (x, y) { return (y.nombre === hab) - (x.nombre === hab); });
    abrirHoja('<div class="grab"></div><h3>Categoría</h3>' + (hab ? '<p class="hint">⭐ = la habitual de este lugar</p>' : "") + '<div class="pick">' + orden.map(function (c) {
      return '<button class="it" data-a="cat" data-v="' + esc(c.nombre) + '"><span class="ico">' + c.emoji + '</span><span class="t"><b>' + (c.nombre === hab ? "⭐ " : "") + esc(c.nombre) + '</b></span>' + (S.F.cat === c.nombre ? '<span class="ok">✔</span>' : "") + '</button>';
    }).join("") + '</div>');
  }
  /* lista de lugares: frecuentes, búsqueda y «Usar …», igual que el atajo */
  function hojaLugar() {
    S.pick = { lista: (S.estado && S.estado.frecuentes) || [] };
    abrirHoja('<div class="grab"></div><h3>¿Dónde fue?</h3><div class="search">' + I.search + '<input id="p-q" placeholder="Buscar o escribir otro lugar" autocomplete="off" autocapitalize="words"></div><div class="pick" id="p-list"></div>');
    pintarLugares();
    var q = $("#p-q");
    q.addEventListener("input", function () {
      clearTimeout(tl); var v = q.value.trim();
      if (!v) { S.pick.lista = (S.estado && S.estado.frecuentes) || []; pintarLugares(); return; }
      tl = setTimeout(function () {
        call({ tipo: "lugares", q: v }).then(function (j) { S.pick.lista = (j.lugares || []).filter(function (x) { return !/^(✏️|🔍)/.test(x); }).slice(0, 10); pintarLugares(); }).catch(function () {});
      }, 220);
    });
  }
  function pintarLugares() {
    var q = $("#p-q") ? $("#p-q").value.trim() : "", h = (S.pick && S.pick.lista || []).map(function (l) {
      return '<button class="it" data-a="lugar" data-v="' + esc(l) + '"><span class="ico">📍</span><span class="t"><b>' + esc(l) + '</b></span>' + (S.F.lugar === l ? '<span class="ok">✔</span>' : "") + '</button>';
    }).join("");
    if (q) h += '<button class="it" data-a="lugar" data-v="' + esc(q) + '"><span class="ico">✏️</span><span class="t"><b>Usar «' + esc(q) + '»</b><small>Lugar nuevo: se recordará la próxima vez</small></span></button>';
    var box = $("#p-list"); if (box) box.innerHTML = h || '<div class="empty">Escribe el nombre del lugar</div>';
  }
  /* ---- Gastos ---- */
  function vistaGastos() {
    var G = S.G, h = bannerCola();
    h += '<div class="mes"><button data-a="mesG" data-v="-1" aria-label="Mes anterior">‹</button><b>' + mesNombre(G.mes) + '</b><button data-a="mesG" data-v="1" aria-label="Mes siguiente">›</button></div>';
    h += '<div class="search">' + I.search + '<input id="g-q" placeholder="Buscar lugar o detalle" value="' + esc(G.q) + '" autocomplete="off"></div>';
    h += '<div class="filt"><button class="' + (!G.metodo ? "on" : "") + '" data-a="metG" data-v="">Todos</button><button class="' + (G.metodo === "Saldo Disponible" ? "on" : "") + '" data-a="metG" data-v="Saldo Disponible">💵 Saldo</button><button class="' + (G.metodo === "Tarjeta de Crédito" ? "on" : "") + '" data-a="metG" data-v="Tarjeta de Crédito">💳 Tarjeta</button><button class="' + (G.cat ? "on" : "") + '" data-a="catG">' + (G.cat ? esc(G.cat) : "Categoría ▾") + '</button></div>';
    var D = G.data;
    if (!D) return h + skel(3);
    h += '<div class="card" style="padding:10px 15px"><div class="kv"><span>Total del mes</span><b>' + money(D.total) + '</b></div><div class="kv"><span>💵 Saldo · 💳 Tarjeta</span><b>' + money(D.totalSaldo) + ' · ' + money(D.totalTarjeta) + '</b></div></div>';
    if (!D.gastos.length) h += '<div class="empty">No hay gastos con esos filtros.</div>';
    var dia = "", abierto = false;
    D.gastos.forEach(function (g) {
      var k = g.fecha.slice(0, 10);
      if (k !== dia) {
        if (abierto) h += '</div>'; dia = k;
        var tot = D.gastos.filter(function (x) { return x.fecha.slice(0, 10) === k; }).reduce(function (s, x) { return s + x.monto; }, 0);
        h += '<div class="day"><span>' + etiquetaDia(k) + '</span><span>' + money(tot) + '</span></div><div class="card lista">'; abierto = true;
      }
      h += swr('<button class="it" data-a="verGasto" data-v="' + g.fila + '"><span class="ico">' + g.emoji + '</span><span class="t"><b>' + esc(g.lugar) + '</b><small>' + esc(g.categoria) + (detLimpio(g.detalle) && !g.fijo ? " · " + esc(detLimpio(g.detalle)) : "") + (detLink(g.detalle) ? " 📎" : "") + '</small></span>' +
        '<span class="m">' + money(g.monto) + '<small class="' + (g.metodo === "Tarjeta de Crédito" ? "tc" : "") + '">' + (g.metodo === "Tarjeta de Crédito" ? "💳 Tarjeta" : "Saldo") + '</small></span></button>', "editarGasto", g.fila, "gasto");
    });
    if (abierto) h += '</div>';
    if (D.ingresos && D.ingresos.length) {
      h += '<div class="sec"><span>Ingresos del mes</span><span>' + money(D.totalIngresos) + '</span></div><div class="card lista">';
      D.ingresos.forEach(function (x) {
        h += swr('<button class="it" data-a="verIngreso" data-v="' + x.fila + '"><span class="ico">💰</span><span class="t"><b>' + esc(x.descripcion) + '</b><small>' + fechaCorta(x.fecha) + '</small></span><span class="m" style="color:var(--ok)">+' + money(x.monto) + '</span></button>', "verIngreso", x.fila, "ingreso");
      });
      h += '</div>';
    }
    return h;
  }
  function etiquetaDia(k) {
    var d = parseF(k), hoy = new Date(), ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);
    var r = DABR[d.getDay()] + " · " + d.getDate() + " " + MABR[d.getMonth()];
    return k === ymd(hoy) ? "HOY · " + d.getDate() + " " + MABR[d.getMonth()] : k === ymd(ayer) ? "AYER · " + d.getDate() + " " + MABR[d.getMonth()] : r;
  }
  function cargarGastos() {
    var G = S.G; G.cargando = true;
    app("gastos", { mes: G.mes, q: G.q, categoria: G.cat, metodo: G.metodo }).then(function (j) { if (G.animar) { S.anim = true; G.animar = false; } G.data = j; G.cargando = false; if (S.tab === "gastos") render(); })
      .catch(function (e) { G.cargando = false; fail(e); });
  }
  function hojaGasto(fila) {
    var g = S.G.data.gastos.filter(function (x) { return x.fila === fila; })[0]; if (!g) return;
    abrirHoja('<div class="grab"></div><h3>' + g.emoji + ' ' + esc(g.lugar) + '</h3><div class="card"><div class="kv"><span>Monto</span><b>' + money(g.monto) + '</b></div><div class="kv"><span>Categoría</span><b>' + esc(g.categoria) + '</b></div><div class="kv"><span>Pagado con</span><b>' + (g.metodo === "Tarjeta de Crédito" ? "💳 Tarjeta de Crédito" : "💵 Saldo Disponible") + '</b></div><div class="kv"><span>Fecha</span><b>' + fechaCorta(g.fecha) + '</b></div>' + (detLimpio(g.detalle) ? '<div class="kv"><span>Detalle</span><b>' + esc(detLimpio(g.detalle)) + '</b></div>' : "") + '</div>' + (detLink(g.detalle) ? '<a class="btn sec2" href="' + esc(detLink(g.detalle)) + '" target="_blank" rel="noopener">📎 Ver comprobante</a>' : "") +
      '<div class="row2"><button class="btn sec2" data-a="editarGasto" data-v="' + g.fila + '">Editar</button><button class="btn bad" data-a="borrarAsk" data-v="gasto:' + g.fila + '">Borrar</button></div><button class="btn sec2" data-a="cerrar">Cerrar</button>');
  }
  function hojaEditarGasto(fila) {
    var g = S.G.data.gastos.filter(function (x) { return x.fila === fila; })[0]; if (!g) return;
    var cats = (S.estado && S.estado.categoriasActivas) || [{ nombre: g.categoria, emoji: g.emoji }];
    abrirHoja('<div class="grab"></div><h3>Editar gasto</h3>' +
      '<div><label class="l">Lugar</label><input class="field" id="e-lugar" value="' + esc(g.lugar) + '"></div>' +
      '<div class="row2"><div><label class="l">Monto (S/)</label><input class="field" id="e-monto" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" enterkeyhint="done" autocomplete="off" value="' + g.monto + '"></div><div><label class="l">Fecha</label><input class="field" id="e-fecha" type="date" value="' + g.fecha.slice(0, 10) + '"></div></div>' +
      '<div><label class="l">Categoría</label><select class="field" id="e-cat">' + cats.map(function (c) { return '<option' + (c.nombre === g.categoria ? " selected" : "") + ' value="' + esc(c.nombre) + '">' + c.emoji + ' ' + esc(c.nombre) + '</option>'; }).join("") + '</select></div>' +
      '<div><label class="l">Pagado con</label><select class="field" id="e-met"><option value="Saldo Disponible"' + (g.metodo !== "Tarjeta de Crédito" ? " selected" : "") + '>💵 Saldo Disponible</option><option value="Tarjeta de Crédito"' + (g.metodo === "Tarjeta de Crédito" ? " selected" : "") + '>💳 Tarjeta de Crédito</option></select></div>' +
      '<div><label class="l">Detalle</label><input class="field" id="e-det" value="' + esc(detLimpio(g.detalle)) + '"></div>' +
      '<button class="btn" data-a="guardarGasto" data-v="' + g.fila + '">Guardar cambios</button><button class="btn sec2" data-a="cerrar">Cancelar</button>');
  }
  function guardarGasto(fila) {
    var g = S.G.data.gastos.filter(function (x) { return x.fila === fila; })[0];
    app("editar", { hoja: "gasto", fila: fila, firma: { monto: g.monto, texto: g.lugar },
      nuevo: { lugar: $("#e-lugar").value, monto: $("#e-monto").value.replace(",", "."), fecha: $("#e-fecha").value, categoria: $("#e-cat").value, metodo: $("#e-met").value, detalle: $("#e-det").value.trim() + (detLink(g.detalle) ? " 📎 " + detLink(g.detalle) : "") } })
      .then(function (j) { cerrarHoja(); toast(j.mensaje, "ok"); refrescarTodo(); }).catch(fail);
  }
  function hojaIngreso(fila) {
    var x = S.G.data.ingresos.filter(function (y) { return y.fila === fila; })[0]; if (!x) return;
    abrirHoja('<div class="grab"></div><h3>💰 ' + esc(x.descripcion) + '</h3>' +
      '<div><label class="l">Descripción</label><input class="field" id="i-desc" value="' + esc(x.descripcion) + '"></div>' +
      '<div class="row2"><div><label class="l">Monto (S/)</label><input class="field" id="i-monto" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" enterkeyhint="done" autocomplete="off" value="' + x.monto + '"></div><div><label class="l">Fecha</label><input class="field" id="i-fecha" type="date" value="' + x.fecha.slice(0, 10) + '"></div></div>' +
      '<button class="btn" data-a="guardarIngreso" data-v="' + x.fila + '">Guardar cambios</button><button class="btn bad" data-a="borrarAsk" data-v="ingreso:' + x.fila + '">Borrar ingreso</button><button class="btn sec2" data-a="cerrar">Cancelar</button>');
  }
  function guardarIngreso(fila) {
    var x = S.G.data.ingresos.filter(function (y) { return y.fila === fila; })[0];
    app("editar", { hoja: "ingreso", fila: fila, firma: { monto: x.monto, texto: x.descripcion },
      nuevo: { descripcion: $("#i-desc").value, monto: $("#i-monto").value.replace(",", "."), fecha: $("#i-fecha").value } })
      .then(function (j) { cerrarHoja(); toast(j.mensaje, "ok"); refrescarTodo(); }).catch(fail);
  }
  function borrarAsk(v) {
    abrirHoja('<div class="grab"></div><h3>¿Borrar este registro?</h3><p class="hint">Se elimina de tu Excel y no se puede deshacer desde la app.</p><button class="btn bad" data-a="borrarOk" data-v="' + esc(v) + '">Sí, borrar</button><button class="btn sec2" data-a="cerrar">No, volver</button>');
  }
  function borrarOk(v) {
    var p = v.split(":"), fila = +p[1], reg = p[0] === "gasto" ? S.G.data.gastos.filter(function (x) { return x.fila === fila; })[0] : S.G.data.ingresos.filter(function (x) { return x.fila === fila; })[0];
    app("borrar", { hoja: p[0], fila: fila, firma: { monto: reg.monto, texto: p[0] === "gasto" ? reg.lugar : reg.descripcion } })
      .then(function (j) { cerrarHoja(); toast(j.mensaje, "ok"); refrescarTodo(); }).catch(function (e) { cerrarHoja(); fail(e); });
  }

  /* ---- Tarjeta y ahorro ---- */
  function vistaTarjeta() {
    var E = S.estado, h = "";
    if (!E) return skel(3);
    var t = E.tarjeta;
    if (t) {
      h += '<div class="cc"><div class="rowh"><span class="lbl">Deuda real</span>' + ojoK("deuda", true) + '</div><div class="big"' + (visK("deuda") ? ' data-n="' + t.deuda + '"' : "") + '>' + bigK(t.deuda, "deuda") + '</div><div class="two"><div>Fecha límite (automática)<b>' + esc(fechaCorta(t.limite)) + '</b></div><div>Quedan<b class="w">' + (t.diasLimite === null ? "—" : t.diasLimite + " días") + '</b></div></div></div>';
      h += '<div class="card"><div class="kv"><span>A pagar antes de la fecha límite</span><b>' + mk(t.pendiente, "deuda") + '</b></div><div class="kv"><span>Por facturar (próximo estado)</span><b>' + mk(t.porFacturar, "deuda") + '</b></div><div class="kv"><span>Compras tras el cierre (día ' + t.diaCierre + ')</span><b>' + mk(t.comprasCiclo, "deuda") + '</b></div><div class="kv"><span>Último cierre</span><b>' + esc(fechaCorta(t.ultimoCierre)) + '</b></div></div>';
      h += '<button class="btn sec2" data-a="hojaTarjeta">Llegó un estado de cuenta nuevo</button>';
    } else h += '<div class="card"><p class="hint">Aún no está configurada la hoja «Tarjeta» en tu Excel (menú 💰 Finanzas → Crear hojas nuevas).</p></div>';
    h += '<div class="sec"><span>Conciliación con el banco</span></div><div class="card"><div class="rowh"><span class="lbl">Tu ahorro</span>' + ojoK("ahorro") + '</div><div class="kv"><span>Ahorro calculado</span><b>' + mk(E.ahorro, "ahorro") + '</b></div><div class="kv"><span>Saldo del banco (corte inicial)</span><b>' + (E.banco === null ? "—" : mk(E.banco, "ahorro")) + '</b></div>' +
      '<p class="hint">Ese saldo fue el punto de partida. Desde ahí, tu ahorro suma ingresos y resta gastos, y debe coincidir con tu cuenta.</p>' +
      '<button class="btn sec2" style="margin-top:8px" data-a="hojaBanco">Actualizar corte del banco</button></div>';
    if (E.ahorroMeses && E.ahorroMeses.length) {
      var max = Math.max.apply(null, E.ahorroMeses.map(function (x) { return Math.abs(x.neto); }).concat([1]));
      h += '<div class="sec"><span>Ahorro mes a mes</span></div><div class="card"><div class="mini">' + E.ahorroMeses.map(function (x, i) {
        var ult = i === E.ahorroMeses.length - 1, hh = Math.max(3, Math.round(Math.abs(x.neto) / max * 70));
        return '<div><b>' + (x.neto >= 0 ? "+" : "−") + nf(Math.abs(Math.round(x.neto))) + '</b><i class="' + (x.neto < 0 ? "neg" : ult ? "cur" : "") + '" style="height:' + hh + 'px"></i>' + esc(x.mes) + (ult ? "*" : "") + '</div>';
      }).join("") + '</div><p class="hint" style="margin-top:6px">Lo que sumaste a tu ahorro (ingresos − gastos con Saldo Disponible). * mes en curso</p></div>';
    }
    if (E.metas && E.metas.length) h += metasHtml(E);
    return h;
  }
  function hojaTarjeta() {
    abrirHoja('<div class="grab"></div><h3>Estado de cuenta nuevo</h3><p class="hint">Escribe lo que dice tu estado de cuenta. La fecha límite se calcula sola.</p>' +
      '<div><label class="l">Pendiente del estado (S/)</label><input class="field" id="t-pend" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" enterkeyhint="done" autocomplete="off" placeholder="Ej.: 150.11"></div>' +
      '<div><label class="l">Deuda total hoy según tu app del banco (opcional)</label><input class="field" id="t-deuda" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" enterkeyhint="done" autocomplete="off" placeholder="Solo si quieres re-sincronizar"></div>' +
      '<button class="btn" data-a="guardarTarjeta">Guardar</button><button class="btn sec2" data-a="cerrar">Cancelar</button>');
  }
  function guardarTarjeta() {
    var p = $("#t-pend").value.trim().replace(",", "."), d = $("#t-deuda").value.trim().replace(",", ".");
    if (!p && !d) { toast("Escribe al menos el pendiente", "err"); return; }
    app("tarjeta_guardar", { pendiente: p, deuda: d }).then(function (j) { cerrarHoja(); toast(j.mensaje, "ok"); cargarEstado(true); }).catch(fail);
  }
  function hojaBanco() {
    abrirHoja('<div class="grab"></div><h3>Saldo real del banco</h3><p class="hint">Mira el saldo de tu cuenta de ahorros en la app del banco y escríbelo aquí. Si coincide con tu ahorro calculado, tus registros están completos.</p>' +
      '<div><label class="l">Saldo (S/)</label><input class="field" id="b-saldo" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" enterkeyhint="done" autocomplete="off" value="' + (S.estado && S.estado.banco !== null ? S.estado.banco : "") + '"></div>' +
      '<button class="btn" data-a="guardarBanco">Guardar</button><button class="btn sec2" data-a="cerrar">Cancelar</button>');
  }

  /* ---- Más ---- */
  function vistaMas() {
    if (S.sub === "presupuesto") return sub('<div class="sec"><span>Gastado este mes / tope</span></div><div class="card" style="padding:4px 15px">' + (S.estado ? S.estado.presupuesto.map(function (p) { return filaPres(p, true); }).join('<div style="border-top:1px solid var(--line)"></div>') : "") + '</div><p class="hint">Toca una categoría para fijar o cambiar su tope mensual. Los cambios se guardan en la hoja Presupuesto de tu Excel.</p>');
    if (S.sub === "fijos") return sub(vistaFijos());
    if (S.sub === "informes") return sub(vistaInformes());
    if (S.sub === "logros") return sub(vistaLogros());
    if (S.sub === "ajustes") return sub(vistaAjustes());
    function it(id, ico, t, d) { return '<button class="it" data-a="ir" data-v="' + id + '"><span class="ico">' + I[ico] + '</span><span class="t"><b>' + t + '</b><small>' + d + '</small></span><span class="chev">›</span></button>'; }
    return '<div class="card menu" style="padding:4px 15px">' + it("presupuesto", "bud", "Presupuesto", "Topes por categoría y avance del mes") + it("fijos", "fix", "Gastos fijos", "Qué falta pagar este mes") + it("informes", "rep", "Informes y gráficas", "Línea del mes, calor, lugares y categorías") + it("logros", "medal", "Logros", "Medallas por tu constancia") + it("ajustes", "cog", "Ajustes", "PIN, conexión e instalación") + '</div>';
  }
  function sub(c) { return '<button class="back" data-a="ir" data-v="">‹ Volver</button>' + c; }
  function vistaFijos() {
    var D = S.FJ.data;
    if (!D) return skel(3);
    var pend = D.fijos.filter(function (x) { return !x.pagado; }), h = "";
    h += '<div class="card"><div class="kv"><span>Pendientes este mes</span><b>' + D.pendientes + ' · ' + money(D.montoPendiente) + '</b></div></div>';
    if (pend.length) {
      var n = 0, tot = 0;
      h += '<div class="card" style="padding:4px 15px">' + pend.map(function (x, i) {
        var on = S.FJ.sel[x.nombre]; if (on) { n++; tot += x.monto; }
        return '<button class="cb' + (on ? " on" : "") + '" data-a="selFijo" data-v="' + i + '"><span class="box">' + (on ? "✓" : "") + '</span><span style="flex:1">' + esc(x.nombre) + '</span><b>' + money(x.monto) + '</b></button>';
      }).join("") + '</div>';
      h += '<button class="btn" data-a="pagarFijos"' + (n ? "" : " disabled") + '>' + (n ? "Pagar " + n + " seleccionado" + (n > 1 ? "s" : "") + " · " + money(tot) : "Marca los que ya pagaste") + '</button>';
      h += '<p class="hint">Al pagar se registra un gasto con Saldo Disponible y se marca el fijo en tu Excel.</p>';
    } else h += '<div class="empty">✅ Todos los fijos de este mes están pagados.</div>';
    var pag = D.fijos.filter(function (x) { return x.pagado; });
    if (pag.length) h += '<div class="sec"><span>Ya pagados</span></div><div class="card" style="padding:4px 15px">' + pag.map(function (x) { return '<div class="cb done"><span class="box">✓</span><span style="flex:1">' + esc(x.nombre) + '</span><b>' + money(x.monto) + '</b></div>'; }).join("") + '</div>';
    return h;
  }
  function comparaCard(D) {
    var ant = D.mesAnteriorNombre || "el mes anterior";
    var filas = D.categorias.filter(function (c) { return c.monto > 0 || c.mesAnterior > 0; });
    if (!filas.length) return "";
    filas.sort(function (x, y) { return Math.abs(y.monto - y.mesAnterior) - Math.abs(x.monto - x.mesAnterior); });
    var mx = Math.max.apply(null, filas.map(function (c) { return Math.max(c.monto, c.mesAnterior); }).concat([1]));
    var tot = D.gastos, tAnt = D.mesAnteriorGastos, d = tot - tAnt, dp = tAnt > 0 ? Math.round(d / tAnt * 100) : null;
    var resumen = '<div class="kv"><span>Este mes</span><b>' + money(tot) + '</b></div><div class="kv"><span>' + esc(ant) + '</span><b>' + money(tAnt) + '</b></div>' +
      '<div class="kv"><span>Diferencia</span><b style="color:' + (d > 0 ? "var(--bad)" : "var(--ok)") + '">' + (d > 0 ? "▲ " : d < 0 ? "▼ " : "") + money(Math.abs(d)) + (dp === null ? "" : " (" + (d > 0 ? "+" : d < 0 ? "−" : "") + Math.abs(dp) + " %)") + '</b></div>';
    var barras = filas.map(function (c) {
      var dd = c.monto - c.mesAnterior;
      return '<div style="padding:9px 0;border-top:1px solid var(--line)"><div style="display:flex;justify-content:space-between;gap:8px;font-size:14px"><b style="font-weight:600">' + c.emoji + ' ' + esc(c.categoria) + '</b>' +
        '<span style="font-variant-numeric:tabular-nums;font-weight:600;color:' + (dd > 0.5 ? "var(--bad)" : dd < -0.5 ? "var(--ok)" : "var(--mut)") + '">' + (dd > 0.5 ? "▲ " : dd < -0.5 ? "▼ " : "= ") + money(Math.abs(dd)) + '</span></div>' +
        '<div class="bar g"><i ' + wi(c.monto / mx * 100) + '></i></div><div class="bar" style="margin-top:4px;height:6px"><i style="background:var(--field);width:' + Math.round(c.mesAnterior / mx * 100) + '%"></i></div>' +
        '<div class="hint" style="margin-top:4px;display:flex;justify-content:space-between;gap:8px"><span>Este mes ' + money(c.monto) + '</span><span>' + esc(ant) + ' ' + money(c.mesAnterior) + '</span></div></div>';
    }).join("");
    return '<div class="sec"><span>Comparación con ' + esc(ant) + '</span></div><div class="card">' + resumen + '<p class="hint" style="margin:8px 0 2px">Barra azul = este mes · barra gris = ' + esc(ant) + '</p>' + barras + '</div>';
  }
  function vistaInformes() {
    var D = S.IN.data, h = '<div class="mes"><button data-a="mesI" data-v="-1">‹</button><b>' + mesNombre(S.IN.mes) + '</b><button data-a="mesI" data-v="1">›</button></div>';
    if (!D) return h + skel(3);
    var dif = D.gastos - D.mesAnteriorGastos;
    h += '<div class="card"><div class="kv"><span>Ingresos</span><b>' + money(D.ingresos) + '</b></div><div class="kv"><span>Gastos</span><b>' + money(D.gastos) + '</b></div><div class="kv"><span>Vs. mes anterior</span><b style="color:' + (dif > 0 ? 'var(--bad)' : 'var(--ok)') + '">' + (dif > 0 ? "▲ " : "▼ ") + money(Math.abs(dif)) + '</b></div><div class="kv"><span>Promedio por día</span><b>' + money(D.promedioDiario) + '</b></div></div>';
    if (D.categorias.length) {
      var tot = D.categorias.reduce(function (s, c) { return s + c.monto; }, 0) || 1;
      h += donutCard(D) + comparaCard(D);
    }
    h += reportesHtml();
    var mx = Math.max.apply(null, D.meses.map(function (m) { return Math.max(m.ingresos, m.gastos); }).concat([1]));
    h += '<div class="sec"><span>El año · ingresos y gastos</span></div><div class="card"><div class="mini" style="height:130px;gap:6px">' + D.meses.map(function (m) {
      return '<div style="font-size:10px"><span style="display:flex;gap:2px;align-items:flex-end;justify-content:center;height:100px"><i style="width:9px;margin:0;height:' + Math.max(2, Math.round(m.ingresos / mx * 98)) + 'px;background:var(--steel2)"></i><i style="width:9px;margin:0;height:' + Math.max(2, Math.round(m.gastos / mx * 98)) + 'px;background:var(--navy)"></i></span>' + m.mes.slice(0, 1) + '</div>';
    }).join("") + '</div><p class="hint" style="margin-top:6px"><span style="color:var(--steel2)">■</span> Ingresos &nbsp; <span style="color:var(--navy)">■</span> Gastos</p></div>';
    if (D.top5.length) h += '<div class="sec"><span>Los 5 gastos más grandes</span></div><div class="card" style="padding:4px 15px">' + D.top5.map(function (x, i) { return '<div class="it"><span class="ico">' + (i + 1) + '</span><span class="t"><b>' + esc(x.lugar) + '</b><small>' + esc(x.categoria) + ' · ' + fechaCorta(x.fecha) + '</small></span><span class="m">' + money(x.monto) + '</span></div>'; }).join("") + '</div>';
    h += '<div class="sec"><span>Regla 50 / 30 / 20</span></div><div class="card"><div class="kv"><span>Necesidades (meta 50%)</span><b>' + D.necesidades + '%</b></div><div class="kv"><span>Gustos (meta 30%)</span><b>' + D.gustos + '%</b></div><div class="kv"><span>Ahorro (meta 20%)</span><b>' + D.ahorro + '%</b></div></div>';
    return h;
  }
  var PAL_L = ["#0B0B0D", "#34343A", "#5B5B63", "#82828A", "#A6A6AE", "#C2C2C9", "#D6D6DB", "#E4E4E8"];
  function PALc() { return document.documentElement.getAttribute("data-t") === "dark" ? PAL_L.slice().reverse() : PAL_L; }
  function donutCard(D) {
    var arr = D.categorias.filter(function (c) { return c.monto > 0; });
    var tot = arr.reduce(function (s, c) { return s + c.monto; }, 0);
    if (tot <= 0) return "";
    var top = arr.slice(0, 7), resto = tot - top.reduce(function (s, c) { return s + c.monto; }, 0);
    if (resto > 0.5) top.push({ categoria: "Otras", emoji: "•", monto: resto });
    var C = 2 * Math.PI * 52, off = 0, segs = "", leg = "";
    top.forEach(function (c, i) {
      var len = c.monto / tot * C, col = PALc()[i % 8];
      var da = Math.max(0, len - (top.length > 1 ? 2.5 : 0)).toFixed(2) + " " + C.toFixed(2);
      segs += '<circle cx="70" cy="70" r="52" fill="none" stroke="' + col + '" stroke-width="16" transform="rotate(-90 70 70)" stroke-dashoffset="' + (-off).toFixed(2) + '" ' +
        (S.anim ? 'style="stroke-dasharray:0 ' + C.toFixed(2) + '" data-da="' + da + '"' : 'stroke-dasharray="' + da + '"') + '/>';
      off += len;
      leg += '<div class="lg"><span class="dot" style="background:' + col + '"></span><span class="ln">' + c.emoji + ' ' + esc(c.categoria) + '</span><b>' + money(c.monto) + '</b><span class="pc">' + Math.round(c.monto / tot * 100) + '%</span></div>';
    });
    return '<div class="sec"><span>En qué gastaste</span></div><div class="card"><div class="dwrap"><svg viewBox="0 0 140 140" class="donut" role="img" aria-label="Gasto por categoría"><circle cx="70" cy="70" r="52" fill="none" stroke="var(--track)" stroke-width="16"/>' + segs + '</svg><div class="dc"><span>Gastos</span><b>' + money(tot) + '</b></div></div>' + leg + '</div>';
  }
  function diagnostico() {
    var sonda = document.createElement("div");
    sonda.style.cssText = "position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)";
    document.body.appendChild(sonda); var cs = getComputedStyle(sonda), sat = cs.paddingTop, sab = cs.paddingBottom; document.body.removeChild(sonda);
    var app = $("#app") ? $("#app").getBoundingClientRect() : null, vv = window.visualViewport;
    var modo = (navigator.standalone === true || (window.matchMedia && matchMedia("(display-mode: standalone)").matches)) ? "App de la pantalla de inicio" : "Navegador (Safari)";
    return [["Se abrió como", modo], ["Ventana (ancho × alto)", innerWidth + " × " + innerHeight], ["Pantalla del equipo", screen.width + " × " + screen.height],
      ["Área visible (visualViewport)", vv ? Math.round(vv.width) + " × " + Math.round(vv.height) + " · arriba " + Math.round(vv.offsetTop) : "—"],
      ["Margen seguro arriba / abajo", sat + " / " + sab], ["La app ocupa", app ? "de " + Math.round(app.top) + " a " + Math.round(app.bottom) : "—"]]
      .map(function (r) { return '<div class="kv"><span>' + r[0] + '</span><b>' + esc(r[1]) + '</b></div>'; }).join("");
  }
  function vistaAjustes() {
    var E = S.estado, c = cola(), h = "";
    h += '<div class="card"><div class="lbl">Apariencia</div><div class="seg" style="margin-top:8px">' +
      [["auto", "Automático"], ["claro", "Claro"], ["oscuro", "Oscuro"]].map(function (o) { return '<button class="' + (PREF.tema === o[0] ? "on" : "") + '" data-a="tema" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join("") +
      '</div><p class="hint" style="margin-top:6px">«Automático» sigue el modo claro u oscuro de tu iPhone.</p></div>';
    var cc = colorActual(), pk = cc.a1 ? cc : COLORES[1];
    h += '<div class="card"><div class="lbl">Colores</div><p class="hint" style="margin-top:4px">El negro sigue de base; elige la combinación de colores de botones, barras y pantalla de carga.</p><div class="csw">' +
      COLORES.map(function (x) { return '<button class="cs' + (cc.id === x.id ? " on" : "") + '" data-a="color" data-v="' + x.id + '" aria-label="' + esc(x.n) + '"><i style="background:' + (x.a1 ? "linear-gradient(135deg," + x.a1 + "," + x.a2 + ")" : "linear-gradient(135deg,#0B0B0B,#8A8A92)") + '"></i><span>' + esc(x.n) + '</span></button>'; }).join("") +
      '</div><div class="lbl" style="margin-top:14px">Personalizar</div><div class="row2" style="margin-top:6px"><label class="cpk"><input type="color" id="c-a1" value="' + pk.a1 + '"><span>Color 1</span></label><label class="cpk"><input type="color" id="c-a2" value="' + pk.a2 + '"><span>Color 2</span></label></div>' +
      (cc.id === "custom" ? '<p class="hint" style="margin-top:6px">Usando tu combinación personalizada.</p>' : "") + '</div>';
    h += '<div class="card"><div class="lbl">Mascota</div><div class="seg" style="margin-top:8px">' +
      [["activa", "Activa"], ["tranquila", "Tranquila"], ["apagada", "Apagada"]].map(function (o) { return '<button class="' + ((PREF.mascota || "activa") === o[0] ? "on" : "") + '" data-a="mascota" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join("") +
      '</div><p class="hint" style="margin-top:6px">Tu dragón pasea y hace travesuras mientras la app está abierta, sin tapar nada ni bloquear tus toques. «Tranquila»: solo duerme y escupe chispas en su sitio. En «Registrar» se esconde mientras escribes. Evoluciona con tus logros.</p></div>';
    h += '<div class="card"><div class="lbl">Emoticones</div><div class="seg" style="margin-top:8px">' +
      [["ms", "Microsoft"], ["sys", "Del teléfono"]].map(function (o) { return '<button class="' + ((PREF.emoji || "ms") === o[0] ? "on" : "") + '" data-a="emoji" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join("") +
      '</div><p class="hint" style="margin-top:6px">Los emoticones de Microsoft se ven igual en todos los teléfonos. «Del teléfono» usa los de Apple.</p></div>';
    h += '<div class="card"><div class="lbl">Inicio rápido</div><button class="cb' + (PREF.abrirRegistrar ? " on" : "") + '" data-a="abrirRegistrar" style="margin-top:4px"><span class="box">' + (PREF.abrirRegistrar ? "✓" : "") + '</span><span style="flex:1">Abrir la app directamente en «Registrar» con el teclado de números</span></button></div>';
    h += '<div class="card"><div class="lbl">Barra inferior</div><div class="seg" style="margin-top:8px">' +
      [[false, "Pegada abajo"], [true, "Flotante"]].map(function (o) { return '<button class="' + ((PREF.flotante === true) === o[0] ? "on" : "") + '" data-a="barra" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join("") +
      '</div><p class="hint" style="margin-top:6px">«Pegada abajo» es lo recomendado: no deja ninguna franja bajo la barra.</p></div>';
    h += '<div class="card"><div class="lbl">Privacidad y seguridad</div>' +
      '<button class="cb' + (PREF.ocultarAlAbrir ? " on" : "") + '" data-a="ocultarInicio" style="margin-top:4px"><span class="box">' + (PREF.ocultarAlAbrir ? "✓" : "") + '</span><span style="flex:1">Ocultar los montos al abrir (el ojo de arriba; «Ahorro» y «Deuda» siempre abren ocultos)</span></button>' +
      (PREF.lock && !cfg.demo ?
        '<div class="kv"><span>🔒 Candado activado</span><b>' + PREF.lock.len + ' dígitos</b></div><label class="l" style="margin-top:8px">Pedir el código</label><div class="mset">' +
        [[0, "Siempre"], [1, "Tras 1 min"], [5, "Tras 5 min"]].map(function (o) { return '<button class="' + (PREF.lock.min === o[0] ? "on" : "") + '" data-a="lockMin" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join("") +
        '</div>' + (S.bioOk ? '<button class="cb' + (PREF.bio ? " on" : "") + '" data-a="bioToggle" style="margin-top:6px"><span class="box">' + (PREF.bio ? "✓" : "") + '</span><span style="flex:1">Entrar con Face ID / Touch ID (el código queda como respaldo)</span></button>' : '<p class="hint" style="margin-top:8px">Face ID: ' + (S.bioOk === false || !window.PublicKeyCredential ? "tu iPhone no lo ofrece a las apps web instaladas; se usa el código." : "comprobando…") + '</p>') + '<div class="row2" style="margin-top:10px"><button class="btn sec2" data-a="hojaLock">Cambiar código</button><button class="btn sec2" data-a="lockOff">Quitar candado</button></div>' :
        '<button class="btn sec2" style="margin-top:8px" data-a="hojaLock">🔒 Activar candado con código</button><p class="hint" style="margin-top:6px">Un código corto que se pide al abrir la app. Solo vale en este teléfono. Con el candado activo verás aquí la opción de Face ID si tu iPhone la permite.</p>') + '</div>';
    if (c.length) {
      h += '<div class="sec"><span>Registros pendientes</span></div><div class="card" style="padding:4px 15px">' + c.map(function (x) {
        return '<div class="it"><span class="ico">' + (x.error ? "⚠️" : "⏳") + '</span><span class="t"><b>' + esc(x.nota || "Registro") + '</b><small>' + (x.error ? esc(x.error) : "Esperando conexión") + '</small></span>' +
          (x.error ? '<button class="linkbtn" data-a="colaDescartar" data-v="' + esc(x.id) + '">Descartar</button>' : "") + '</div>';
      }).join("") + '</div>' + (c.some(function (x) { return !x.error; }) ? '<button class="btn" data-a="enviarCola">Enviar ahora</button>' : "");
    }
    h += '<div class="card diag"><div class="lbl">Diagnóstico de pantalla</div>' + diagnostico() + '<p class="hint" style="margin-top:6px">Si la app no ocupa toda la pantalla, mándame una captura de esto.</p></div>';
    h += '<div class="card"><div class="kv"><span>Versión de la app</span><b>' + VERSION + '</b></div><div class="kv"><span>Versión del script</span><b>' + esc(E ? E.version : "—") + '</b></div><div class="kv"><span>Conexión</span><b>' + (cfg.demo ? "Demostración" : "Tu script de Google") + '</b></div></div>' +
      '<div class="card stack"><div class="lbl">Instalar en tu iPhone</div><p class="hint">En Safari toca Compartir (□↑) → «Agregar a pantalla de inicio». Ábrela desde el ícono y funciona a pantalla completa.</p></div>';
    h += cfg.demo ? '<button class="btn" data-a="salir">Salir de la demostración</button>' :
      '<button class="btn sec2" data-a="cambiarPin">Cambiar el PIN guardado</button><button class="btn bad" data-a="salir">Cerrar sesión y borrar datos del teléfono</button>' +
      '<p class="hint">El PIN se define en tu Excel: menú 💰 Finanzas → 🔑 Definir PIN de la app web. Cerrar sesión solo borra lo guardado en este teléfono.</p>';
    return h;
  }

  /* ---- Candado de la app ---- */
  function hashLock(code, salt) {
    var txt = "mg|" + salt + "|" + code;
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); });
    }
    var h = 5381; for (var i = 0; i < txt.length; i++) h = ((h << 5) + h + txt.charCodeAt(i)) | 0;
    return Promise.resolve("w" + h);
  }
  function vistaLock() {
    var n = PREF.lock.len, dots = "";
    for (var i = 0; i < n; i++) dots += '<i class="' + (i < S.lockIn.length ? "on" : "") + '"></i>';
    var keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "<"];
    return '<div class="lock"><div class="lk-top"><div class="lk-ic">' + I.lock + '</div><h1>Mis <b>Gastos</b></h1><p>' + esc(S.lockMsg || "Escribe tu código para entrar") + '</p><div class="dots' + (S.lockErr ? " err" : "") + '">' + dots + '</div></div>' +
      '<div class="keys">' + keys.map(function (k) { return k === "" ? '<span></span>' : '<button data-a="tecla" data-v="' + k + '" aria-label="' + (k === "<" ? "Borrar" : k) + '">' + (k === "<" ? "⌫" : k) + '</button>'; }).join("") + '</div>' +
      (PREF.bio ? '<button class="linkbtn lk-forgot" data-a="bioEntrar">Usar Face ID</button>' : "") + '<button class="linkbtn lk-forgot" data-a="olvideLock">Olvidé mi código</button></div>';
  }

  /* ---- Acceso ---- */
  function vistaSetup() {
    var pre = ""; try { var m = /[#&]u=([^&]+)/.exec(location.hash); if (m) pre = decodeURIComponent(m[1]); } catch (e) {}
    return '<div class="setup"><h1>Mis <b>Gastos</b></h1><p>Conecta la app con tu Excel. Solo se hace una vez en este teléfono.</p>' +
      (S.setupMsg ? '<div class="err">' + esc(S.setupMsg) + '</div>' : "") +
      '<div><label class="l" for="s-url">Enlace de tu script de Google</label><input class="field" id="s-url" autocomplete="off" autocapitalize="off" placeholder="https://script.google.com/macros/s/…/exec" value="' + esc(pre || (cfg && cfg.url) || "") + '"></div>' +
      '<div><label class="l" for="s-pin">PIN</label><input class="field" id="s-pin" type="password" autocomplete="off" placeholder="El que definiste en tu Excel"></div>' +
      '<button class="btn" data-a="conectar">Conectar</button><button class="btn sec2" style="background:transparent;color:#fff;border-color:#6B6B73" data-a="demo">Ver demostración</button>' +
      '<p style="font-size:12px">Tu enlace y tu PIN se guardan solo en este teléfono. Nadie más los ve.</p></div>';
  }
  function conectar() {
    var url = $("#s-url").value.trim(), pin = $("#s-pin").value.trim();
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[^\s]+\/exec$/.test(url)) { S.setupMsg = "El enlace debe empezar con https://script.google.com/macros/s/ y terminar en /exec"; render(); return; }
    if (!pin) { S.setupMsg = "Escribe tu PIN."; render(); return; }
    var b = document.querySelector('[data-a="conectar"]'); b.disabled = true; b.innerHTML = '<span class="spin"></span> Conectando…'; ocupado("Conectando…");
    cfg = { url: url, pin: pin };
    app("ping").then(function () { libre(); S.anim = true; store("mg_cfg", cfg); S.setupMsg = ""; history.replaceState(null, "", location.pathname); cargarEstado(false); render(); })
      .catch(function (e) { libre(); cfg = null; S.setupMsg = e.message && e.message.indexOf("Failed to fetch") < 0 ? e.message : "No se pudo conectar. Revisa el enlace y tu conexión."; render(); });
  }

  /* ---------- hojas (diálogos) ---------- */
  function abrirHoja(html) { var w = $("#sheet"); w.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>'; w.hidden = false; }
  function cerrarHoja() { qrParar(); vozParar(); var w = $("#sheet"); w.hidden = true; w.innerHTML = ""; }
  $("#sheet").addEventListener("click", function (e) { if (e.target === this) cerrarHoja(); });

  /* ---------- datos ---------- */
  function cargarEstado(silencioso) {
    if (!cfg) return;
    if (!silencioso && !S.estado) render();
    app("estado").then(function (j) { if (!S.estado) S.anim = true; S.estado = j; S.offline = false; store("mg_estado", j); if (S.tab !== "registrar" || !silencioso) render(); if (PREF.reto) cargarReto(); evaluarLogros(); cargarRP(); })
      .catch(function (e) { if (esRed(e)) { S.offline = true; if (S.tab === "inicio") render(); } else fail(e); });
  }
  function refrescarTodo() { S.G.data = null; cargarEstado(true); if (S.tab === "gastos") { render(); cargarGastos(); } }
  function cargarFijos() { app("fijos").then(function (j) { if (!S.FJ.data) S.anim = true; S.FJ.data = j; S.FJ.sel = {}; if (S.sub === "fijos" || (S.tab === "registrar" && S.F.modo === "fijos")) render(); }).catch(fail); }
  function cargarInformes() {
    S.IN.data = null; S.IN.rep = null; S.IN.repErr = "";
    var rep = app("reportes", { mes: S.IN.mes }).then(function (j) { return j; }, function (e) { S.IN.repErr = msgRep(e); return null; });
    Promise.all([app("informes", { mes: S.IN.mes }), rep]).then(function (r) { S.anim = true; S.IN.data = r[0]; S.IN.rep = r[1]; S.IN.dia = null; S.IN.catI = 0; if (S.sub === "informes") render(); }).catch(fail);
  }

  /* ---------- ritmo del mes, ¿puedo gastarlo?, metas y retos ---------- */
  function hoyE() { var E = S.estado, d = E && E.hoy ? parseF(E.hoy) : null; return d || new Date(); }
  function ritmo() {
    var E = S.estado; if (!E) return null;
    var h = hoyE(), dm = new Date(h.getFullYear(), h.getMonth() + 1, 0).getDate(), dia = h.getDate(), rest = dm - dia + 1;
    var cerrados = (E.ahorroMeses || []).slice(0, -1), ingEsp = E.ingresos;
    if (cerrados.length) ingEsp = Math.max(E.ingresos, cerrados.reduce(function (s, x) { return s + x.ingresos; }, 0) / cerrados.length);
    var m = E.metaAhorro, obj = m ? (m.tipo === "pct" ? m.valor / 100 * ingEsp : m.valor) : 0, fp = E.fijosPendientesMonto || 0;
    var disp = ingEsp - obj - E.gastos - fp;
    var proy = E.gastosSaldo + (E.gastosSaldo / dia) * (dm - dia) + fp;
    return { ingEsp: ingEsp, obj: obj, hoyPuede: Math.max(0, disp / rest), sobra: disp, ritmoDia: E.gastos / dia, proyGastos: proy, proyNeto: ingEsp - proy };
  }
  function ritmoCard() {
    var R = ritmo(); if (!R) return "";
    var m = S.estado.metaAhorro, buena = m ? R.proyNeto >= R.obj : R.proyNeto >= 0;
    return '<div class="card"><div class="lbl">Tu ritmo del mes</div>' +
      '<div class="two2"><div><span class="hint">Puedes gastar hoy</span><div class="med">' + money(R.hoyPuede) + '</div></div><div><span class="hint">Llevas por día</span><div class="med">' + money(R.ritmoDia) + '</div></div></div>' +
      '<div class="kv" style="margin-top:8px"><span>Si sigues así, gastarás con Saldo</span><b>' + money(R.proyGastos) + '</b></div>' +
      '<div class="kv"><span>Ahorro estimado al cierre</span><b style="color:' + (buena ? "var(--ok)" : "var(--bad)") + '">' + money(R.proyNeto) + '</b></div>' +
      '<div class="hint" style="margin-top:6px">' + (m ? (buena ? "🎯 Cumplirías tu meta de " + money(R.obj) + ". " : "⚠️ Quedarías " + money(R.obj - R.proyNeto) + " por debajo de tu meta de " + money(R.obj) + ". ") : "") +
      'Es una estimación según tus hábitos de este mes y de los anteriores.</div></div>';
  }
  function puedoHtml() {
    var F = S.F, E = S.estado, monto = parseFloat(String(F.monto).replace(",", "."));
    if (!E || F.modo !== "gasto" || !(monto > 0)) return "";
    var lines = [], nivel = 0, tarj = F.metodo === "Tarjeta de Crédito", R = ritmo();
    var p = F.cat ? E.presupuesto.filter(function (c) { return c.categoria === F.cat; })[0] : null;
    if (p && p.tope && !p.referencia) {
      var rest = p.tope - p.gastado - monto;
      if (rest < 0) { lines.push("Te pasarías del tope de " + esc(p.categoria) + " por " + money(-rest)); nivel = 2; }
      else { lines.push("En " + esc(p.categoria) + " te quedarían " + money(rest) + " de " + money(p.tope)); if (rest < p.tope * 0.2) nivel = Math.max(nivel, 1); }
    }
    if (tarj) { if (E.tarjeta) lines.push("Tu deuda de la tarjeta subiría a " + mk(E.tarjeta.deuda + monto, "deuda")); }
    else {
      lines.push("Tu ahorro quedaría en " + mk(E.ahorro - monto, "ahorro"));
      if (E.ahorro - monto < (E.reserva || 0)) { lines.push("⚠️ Usarías dinero reservado para tus fijos"); nivel = 2; }
    }
    var m = E.metaAhorro;
    if (m && !tarj) {
      var lg = m.logrado - monto;
      if (m.logrado >= m.objetivo && lg < m.objetivo) { lines.push("Te sacaría de tu meta de ahorro del mes"); nivel = Math.max(nivel, 1); }
      else if (lg < m.objetivo) lines.push("Te faltarían " + money(m.objetivo - lg) + " para tu meta del mes");
    }
    if (R && R.sobra < 0) { lines.push("Este mes ya vas por encima de lo previsto"); nivel = Math.max(nivel, 1); }
    else if (R && monto > R.hoyPuede) { lines.push("Pasa de los " + money(R.hoyPuede) + " sugeridos para hoy"); nivel = Math.max(nivel, 1); }
    return '<div class="puedo n' + nivel + '"><b>' + ["✅ Puedes gastarlo", "🟠 Hazlo con cuidado", "🔴 Mejor no"][nivel] + '</b>' + lines.map(function (x) { return '<div>· ' + x + '</div>'; }).join("") + '</div>';
  }
  function pintarPuedo() { var b = $("#puedo-w"); if (b) b.innerHTML = puedoHtml(); }

  /* ---- dictado: «30 soles en Adobada, almuerzo» -> monto, lugar, detalle ---- */
  var NUMP = { cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
    veinte: 20, veintiun: 21, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
    cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500, seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900, mil: 1000 };
  function sinTilde(s) { return s.normalize ? s.normalize("NFD").replace(/[̀-ͯ]/g, "") : s; }
  function numP(w) { var k = sinTilde(String(w || "").toLowerCase()); return Object.prototype.hasOwnProperty.call(NUMP, k) ? NUMP[k] : undefined; }
  function palabrasADigitos(txt) {
    var w = txt.split(/\s+/).filter(Boolean), out = [], i = 0;
    while (i < w.length) {
      var v = numP(w[i]), k = sinTilde(w[i].toLowerCase());
      if (v === undefined || ((k === "un" || k === "una" || k === "uno") && !(i + 1 < w.length && (/^sol/i.test(w[i + 1]) || numP(w[i + 1]) === 1000)))) { out.push(w[i]); i++; continue; }
      var tot = 0, cur = 0, j = i, usado = false;
      while (j < w.length) {
        var n = numP(w[j]);
        if (n !== undefined) { if (n === 1000) { tot += (cur || 1) * 1000; cur = 0; } else cur += n; usado = true; j++; }
        else if (usado && sinTilde(w[j].toLowerCase()) === "y" && j + 1 < w.length && numP(w[j + 1]) !== undefined) j++;
        else break;
      }
      out.push(String(tot + cur)); i = j;
    }
    return out.join(" ");
  }
  function cap(s) { s = String(s || "").trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
  function titulo(s) { return String(s || "").trim().split(/\s+/).map(function (x) { return x ? x.charAt(0).toUpperCase() + x.slice(1).toLowerCase() : ""; }).join(" "); }
  function quitarPal(s, lista) { return s.replace(new RegExp("(^|\\s)(?:" + lista + ")(?=\\s|$)", "ig"), " ").replace(/\s+/g, " ").trim(); }
  function parseVoz(txt) {
    var r = { monto: "", lugar: "", detalle: "", metodo: "" };
    var t = palabrasADigitos(String(txt || "").replace(/[\n,;]+/g, " , ").replace(/\s+/g, " ").trim());
    if (!t) return r;
    var re = /(s\/\.?\s*)?(\d+(?:[.,]\d{1,2})?)(\s*(?:soles?|sol|s\/))?(?:\s+con\s+(\d{2})(?=\s|$)|\s+con\s+(\d{1,2})\s*c[eé]ntimos?)?/gi, best = null, x;
    while ((x = re.exec(t))) { var marc = !!(x[1] || x[3]); if (!best || (marc && !best.marc)) best = { x: x, marc: marc }; }
    var resto = t;
    if (best) {
      var x0 = best.x, ent = x0[2].replace(",", "."), cen = x0[4] || x0[5];
      r.monto = cen && ent.indexOf(".") < 0 ? ent + "." + (cen.length < 2 ? "0" + cen : cen) : ent;
      resto = (t.slice(0, x0.index) + " " + t.slice(x0.index + x0[0].length)).replace(/\s+/g, " ").trim();
    }
    if (/(^|\s)(tarjeta|cr[eé]dito|visa)(?=\s|$)/i.test(resto)) { r.metodo = "Tarjeta de Crédito"; resto = quitarPal(resto, "(?:con|en|pagu[eé] con|pagado con)\\s+(?:la\\s+|mi\\s+)?tarjeta(?:\\s+de\\s+cr[eé]dito)?|(?:con\\s+)?(?:la\\s+|mi\\s+)?tarjeta|cr[eé]dito|visa"); }
    else if (/(^|\s)(efectivo|yape|plin|saldo|d[eé]bito)(?=\s|$)/i.test(resto)) { r.metodo = "Saldo Disponible"; resto = quitarPal(resto, "(?:con|en|pagu[eé] con)\\s+(?:el\\s+|mi\\s+)?(?:efectivo|yape|plin|saldo|d[eé]bito)|efectivo|yape|plin|saldo|d[eé]bito"); }
    resto = quitarPal(resto, "gast[eé]|pagu[eé]|compr[eé]|fueron|fue|registra|registrar|anota|anotar|soles|sol|,");
    var fr = (S.estado && S.estado.frecuentes) || [], lugar = "", i;
    var em = /(?:^|\s)en\s+(.+?)(?=\s+(?:por|para|de|con|y|que)\s|$)/i.exec(resto);
    if (em) { lugar = em[1]; resto = (resto.slice(0, em.index) + " " + resto.slice(em.index + em[0].length)).replace(/\s+/g, " ").trim(); }
    else for (i = 0; i < fr.length; i++) { var p0 = resto.toLowerCase().indexOf(fr[i].toLowerCase()); if (p0 >= 0) { lugar = fr[i]; resto = (resto.slice(0, p0) + " " + resto.slice(p0 + fr[i].length)).replace(/\s+/g, " ").trim(); break; } }
    for (i = 0; i < fr.length; i++) if (lugar && lugar.length > fr[i].length && lugar.toLowerCase().indexOf(fr[i].toLowerCase()) === 0 && /\s/.test(lugar.charAt(fr[i].length))) { resto = (lugar.slice(fr[i].length) + " " + resto).trim(); lugar = fr[i]; break; }
    for (i = 0; i < fr.length; i++) if (lugar && fr[i].toLowerCase() === lugar.toLowerCase()) { lugar = fr[i]; break; }
    if (lugar && i === fr.length) lugar = titulo(lugar);
    resto = resto.replace(/^(?:(?:por|para|de|del|el|la|los|las|un|una|y|en|a|al)\s+)+/i, "").replace(/(?:\s+(?:por|para|de|del|el|la|y|en|a|al))+$/i, "").trim();
    r.lugar = lugar; r.detalle = cap(resto);
    return r;
  }
  function pintarVoz() {
    var p = parseVoz($("#v-txt").value), b = $("#v-prev"); if (!b) return;
    b.innerHTML = (p.monto || p.lugar || p.detalle) ? 'Entendí: <b>' + (p.monto ? "S/ " + esc(p.monto) : "(sin monto)") + '</b> · ' + (p.lugar ? "📍 " + esc(p.lugar) : "(sin lugar)") + (p.detalle ? " · " + esc(p.detalle) : "") + (p.metodo ? " · " + (p.metodo === "Tarjeta de Crédito" ? "💳 Tarjeta" : "💵 Saldo") : "") : "Aquí verás cómo lo entendí.";
  }
  function hojaVoz() {
    var rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    abrirHoja('<div class="grab"></div><h3>🎤 Dictar gasto</h3><p class="hint">Di o escribe algo como «30 soles de almuerzo en Adobada» o «46 con cincuenta en Uber con tarjeta». ' + (rec ? "" : "Para dictar, toca el micrófono 🎤 del teclado del iPhone.") + '</p>' +
      '<textarea class="field" id="v-txt" rows="3" placeholder="Ej.: 30 soles de almuerzo en Adobada" autocapitalize="sentences"></textarea>' + (rec ? '<button class="btn sec2" data-a="vozMic" id="v-mic">🎤 Hablar</button>' : "") +
      '<div id="v-prev" class="card hint">Aquí verás cómo lo entendí.</div><button class="btn" data-a="vozUsar">Usar en el formulario</button><button class="btn sec2" data-a="cerrar">Cancelar</button>');
    var t = $("#v-txt"); t.addEventListener("input", pintarVoz); t.focus();
  }
  var VZ = null, vzT = 0;
  function vozParar() {
    clearTimeout(vzT);
    if (VZ) { var r = VZ; VZ = null; try { r.onresult = r.onerror = r.onend = null; r.abort(); } catch (e) {} }
    var a = document.activeElement; if (a && a.blur && (a.tagName === "TEXTAREA" || a.tagName === "INPUT")) a.blur();   // al soltar el teclado se apaga también el dictado del iPhone
  }
  function vozMic() {
    var Rec = window.SpeechRecognition || window.webkitSpeechRecognition; if (!Rec) return;
    vozParar();
    var rc = new Rec(), b = $("#v-mic"); VZ = rc; rc.lang = "es-PE"; rc.interimResults = true; rc.continuous = false;
    rc.onresult = function (ev) { var s = "", fin = false; for (var i = 0; i < ev.results.length; i++) { s += ev.results[i][0].transcript; if (ev.results[i].isFinal) fin = true; } var t = $("#v-txt"); if (t) { t.value = s; pintarVoz(); } if (fin) { try { rc.stop(); } catch (e) {} } };
    rc.onerror = function () { if (b) b.textContent = "🎤 Hablar"; toast("El dictado no está disponible aquí. Usa el micrófono del teclado.", "err", 4500); };
    rc.onend = function () { VZ = null; clearTimeout(vzT); if (b) b.textContent = "🎤 Hablar"; };
    try { rc.start(); vzT = setTimeout(vozParar, 15000); if (b) b.textContent = "🎙️ Escuchando…"; } catch (e) { toast("No se pudo iniciar el micrófono", "err"); }
  }

  /* ---- Escanear el QR de la boleta o factura electrónica (SUNAT): RUC|tipo|serie|número|IGV|total|fecha|… ---- */
  function parseQR(txt) {
    var p = String(txt || "").trim().split("|");
    if (p.length < 7 || !/^\d{11}$/.test(p[0].trim())) return null;
    var total = parseFloat(String(p[5]).replace(",", "."));
    if (!(total > 0)) return null;
    var f = String(p[6]).trim(), fecha = "", m;
    if ((m = /^(\d{4})-(\d{2})-(\d{2})/.exec(f))) fecha = m[1] + "-" + m[2] + "-" + m[3];
    else if ((m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(f))) fecha = m[3] + "-" + m[2] + "-" + m[1];
    var tipo = p[1].trim();
    return { ruc: p[0].trim(), doc: { "01": "Factura", "03": "Boleta", "07": "Nota de crédito", "08": "Nota de débito" }[tipo] || "Comprobante", serie: p[2].trim(), numero: p[3].trim().replace(/^0+(?=\d)/, ""), total: total, fecha: fecha };
  }
  function aplicarQR(q) {
    var F = S.F; F.modo = "gasto"; F.monto = String(Math.round(q.total * 100) / 100); F.ruc = q.ruc;
    if (!F.detalle) F.detalle = q.doc + " " + q.serie + "-" + q.numero;
    F.fechaDoc = q.fecha && q.fecha !== ymd(new Date()) ? q.fecha : "";
    var lug = (PREF.rucs || {})[q.ruc];
    cerrarHoja();
    if (lug) { F.lugar = lug; F.catAuto = true; F.cat = ""; }
    render(); celebrar();
    if (lug) call({ tipo: "sugerir", lugar: lug }).then(function (j) { if (j && j.habitual && S.F.catAuto && !S.F.cat) { S.F.cat = j.habitual; S.F.habitual = j.habitual; if (S.tab === "registrar") render(); } }).catch(function () {});
    else { toast("Leído: " + moneyRaw(q.total) + ". Elige el lugar; la próxima vez este comercio se llena solo.", "ok", 5200); hojaLugar(); }
  }
  var QRS = null;
  function cargarJsQR(ok, mal) {
    if (window.jsQR) { ok(); return; }
    var s = document.createElement("script"); s.src = "jsqr.js"; s.onload = ok; s.onerror = mal; document.head.appendChild(s);
  }
  function qrParar() {
    if (!QRS) return;
    QRS.vivo = false; if (QRS.raf) cancelAnimationFrame(QRS.raf);
    try { if (QRS.stream) QRS.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    QRS = null;
  }
  function qrMsg(t) { var m = $("#qr-msg"); if (m) m.textContent = t; }
  function qrIntentar(txt) {          // devuelve true si era el QR de una boleta o factura
    var q = parseQR(txt);
    if (!q) { qrMsg("Leí un QR, pero no es de una boleta o factura electrónica. Prueba con el de la boleta."); return false; }
    qrParar(); aplicarQR(q); return true;
  }
  function decodificar(img, w, h, fuerte) {
    var c = document.createElement("canvas"), k = Math.min(1, 900 / Math.max(w, h));
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    var x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0, c.width, c.height);
    var d = x.getImageData(0, 0, c.width, c.height);
    return window.jsQR(d.data, d.width, d.height, { inversionAttempts: fuerte ? "attemptBoth" : "dontInvert" });
  }
  function hojaQR() {
    abrirHoja('<div class="grab"></div><h3>📷 Escanear QR</h3><p class="hint">Apunta al código QR de tu boleta o factura electrónica. Se leen el monto, la fecha y el RUC del comercio.</p>' +
      '<div class="qrbox"><video id="qr-v" playsinline muted autoplay></video><i class="qrframe"></i></div><div id="qr-msg" class="hint" style="text-align:center">Abriendo la cámara…</div>' +
      '<button class="btn sec2" data-a="qrFoto">Usar una foto del QR</button><input type="file" id="qr-f" accept="image/*" hidden><button class="btn sec2" data-a="cerrar">Cancelar</button>');
    var f = $("#qr-f"); if (f) f.addEventListener("change", function () { qrDeFoto(f.files && f.files[0]); });
    cargarJsQR(function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { qrMsg("Este teléfono no deja usar la cámara aquí. Usa «Usar una foto del QR»."); return; }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false }).then(function (stream) {
        var v = $("#qr-v"); if (!v || $("#sheet").hidden) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
        QRS = { stream: stream, vivo: true, ult: 0 }; v.srcObject = stream; var pl = v.play(); if (pl && pl.catch) pl.catch(function () {});
        qrMsg("Busca el QR de la boleta y mantenlo quieto.");
        (function ciclo(t) {
          if (!QRS || !QRS.vivo) return;
          QRS.raf = requestAnimationFrame(ciclo);
          if (t - QRS.ult < 160 || !v.videoWidth) return;
          QRS.ult = t;
          var r = decodificar(v, v.videoWidth, v.videoHeight, false);
          if (r && r.data) qrIntentar(r.data);
        })(0);
      }).catch(function () { qrMsg("No se pudo abrir la cámara (revisa el permiso). Usa «Usar una foto del QR»."); });
    }, function () { qrMsg("No se pudo cargar el lector. Revisa tu conexión e inténtalo de nuevo."); });
  }
  function qrDeFoto(file) {
    if (!file) return;
    qrMsg("Leyendo la foto…");
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        cargarJsQR(function () {
          var r = decodificar(img, img.width, img.height, true);
          if (r && r.data) qrIntentar(r.data); else qrMsg("No pude leer el QR en la foto. Acércate, que se vea completo, nítido y sin reflejos.");
        }, function () { qrMsg("No se pudo cargar el lector."); });
      };
      img.onerror = function () { qrMsg("No se pudo abrir la foto."); };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  var RE_ADJ = /\s*📎\s*(https:\/\/\S+)\s*$/;
  function detLimpio(d) { return String(d || "").replace(RE_ADJ, "").trim(); }
  function detLink(d) { var m = RE_ADJ.exec(String(d || "")); return m ? m[1] : ""; }

  /* ---- plantillas de gasto (se guardan en este teléfono) ---- */
  function tplLista() { return PREF.plantillas || []; }
  function hojaTpl(i) {
    var t = tplLista()[i]; if (!t) return;
    abrirHoja('<div class="grab"></div><h3>⭐ ' + esc(t.n) + '</h3><div class="card"><div class="kv"><span>Monto</span><b>' + money(t.monto) + '</b></div><div class="kv"><span>Lugar</span><b>' + esc(t.lugar) + '</b></div><div class="kv"><span>Categoría</span><b>' + esc(t.cat || "Automática") + '</b></div><div class="kv"><span>Pagado con</span><b>' + (t.metodo === "Tarjeta de Crédito" ? "💳 Tarjeta" : "💵 Saldo") + '</b></div></div>' +
      '<button class="btn" data-a="tplYa" data-v="' + i + '">Registrar ahora</button><button class="btn sec2" data-a="tplUsar" data-v="' + i + '">Llenar el formulario</button><button class="btn sec2" data-a="tplBorrar" data-v="' + i + '">Borrar plantilla</button><button class="btn sec2" data-a="cerrar">Cerrar</button>');
  }
  function cuerpoTpl(t) { return { tipo: "gasto", tienda: t.lugar, categoria: t.cat, metodoPago: t.metodo, monto: t.monto, descripcion: t.detalle || "" }; }

  /* ---- metas: avance, y fecha estimada con tu ritmo de ahorro ---- */
  function durMeses(n) { if (n < 12) return n + (n === 1 ? " mes" : " meses"); var a = Math.floor(n / 12), r = n % 12; return a + (a === 1 ? " año" : " años") + (r ? " " + r + (r === 1 ? " mes" : " m.") : ""); }
  function metasHtml(E) {
    var cer = (E.ahorroMeses || []).slice(0, -1).filter(function (x) { return x.neto > 0; }).slice(-3);
    var avg = cer.length ? cer.reduce(function (s, x) { return s + x.neto; }, 0) / cer.length : 0, hoy = hoyE(), C = 2 * Math.PI * 20;
    return '<div class="sec"><span>Metas · con ' + money(E.ahorro) + ' disponibles</span></div><div class="card">' + E.metas.map(function (m) {
      var pct = Math.max(0, Math.min(100, m.avance)), da = (pct / 100 * C).toFixed(2) + " " + C.toFixed(2), est;
      if (m.lograda) est = "✔ Lograda";
      else if (avg > 0) {
        var meses = Math.ceil(m.falta / avg), f = new Date(hoy.getFullYear(), hoy.getMonth() + meses, 1), lim = m.limite ? parseF(m.limite) : null;
        est = "A tu ritmo (" + money(avg) + " al mes) llegas ~ " + MESES[f.getMonth()] + " " + f.getFullYear() + " · " + durMeses(meses);
        if (lim) { var ml = (lim.getFullYear() - hoy.getFullYear()) * 12 + lim.getMonth() - hoy.getMonth(); est += ml >= meses ? " · ✔ a tiempo" : " · ⚠ " + (meses - ml) + " m. tarde"; }
      } else est = "Aún no hay ahorro mensual positivo para estimar la fecha";
      return '<div class="goal2"><svg class="rg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke="var(--track)" stroke-width="6"/><circle cx="24" cy="24" r="20" fill="none" stroke="var(--navy)" stroke-width="6" stroke-linecap="round" transform="rotate(-90 24 24)" ' +
        (S.anim ? 'style="stroke-dasharray:0 ' + C.toFixed(2) + '" data-da="' + da + '"' : 'stroke-dasharray="' + da + '"') + '/><text x="24" y="28" text-anchor="middle" font-size="11" font-weight="700" fill="var(--navy)">' + Math.round(pct) + '%</text></svg>' +
        '<div class="gt"><div class="h"><b>' + esc(m.nombre) + '</b><span>' + (m.lograda ? "" : "de " + nf(m.objetivo)) + '</span></div>' + (m.lograda ? "" : '<div class="hint">Faltan ' + money(m.falta) + '</div>') + '<div class="hint est">' + est + '</div></div></div>';
    }).join("") + '</div>';
  }

  /* ---- reto de ahorro (se guarda en este teléfono) ---- */
  function diasReto(r) { var h = hoyE(), a = parseF(r.ini), t0 = new Date(h.getFullYear(), h.getMonth(), h.getDate()); return Math.round((t0 - a) / 864e5) + 1; }
  function finReto(r) { var a = parseF(r.ini); return ymd(new Date(a.getFullYear(), a.getMonth(), a.getDate() + r.dias - 1)); }
  function cargarReto(forzar) {
    var r = PREF.reto; if (!r || !cfg) return;
    if (!forzar && S.retoTs && Date.now() - S.retoTs < 20000) return;
    S.retoTs = Date.now();
    var ini = parseF(r.ini), fin = parseF(finReto(r)), ms = [mesClave(ini)]; if (mesClave(fin) !== ms[0]) ms.push(mesClave(fin));
    Promise.all(ms.map(function (mes) { return app("gastos", { mes: mes, categoria: r.cat }); })).then(function (rs) {
      var tot = 0, f2 = finReto(r); rs.forEach(function (j) { (j.gastos || []).forEach(function (g) { var d = g.fecha.slice(0, 10); if (d >= r.ini && d <= f2 && g.categoria === r.cat) tot += g.monto; }); });
      S.reto = { tot: tot, key: r.ini + r.cat };
      if (diasReto(r) > r.dias && !r.contado && (r.tope > 0 ? tot <= r.tope : tot === 0)) { r.contado = true; PREF.retosOk = (PREF.retosOk || 0) + 1; guardarPref(); }
      if (S.tab === "inicio") render();
    }).catch(function () {});
  }
  function retoCard() {
    var r = PREF.reto;
    if (!r) return '<button class="card" data-a="hojaReto"><div class="rowh"><span class="lbl">🎯 Reto de ahorro</span><span class="linkbtn">Crear</span></div><p class="hint" style="margin-top:4px">Por ejemplo: una semana sin antojos. Te muestro cómo vas.' + (PREF.retosOk ? " 🏅 Cumplidos: " + PREF.retosOk : "") + '</p></button>';
    var n = diasReto(r), fin = n > r.dias, dia = Math.max(1, Math.min(n, r.dias)), R = S.reto, tot = R && R.key === r.ini + r.cat ? R.tot : null;
    var roto = tot !== null && (r.tope > 0 ? tot > r.tope : tot > 0);
    var est = tot === null ? "Calculando…" : roto ? "❌ " + (r.tope > 0 ? "Pasaste el límite: gastaste " : "Se rompió: gastaste ") + money(tot) : fin ? "🎉 ¡Reto cumplido! Gastaste " + money(tot) : "✅ Vas bien · gastado " + money(tot) + (r.tope > 0 ? " de " + money(r.tope) : "");
    return '<button class="card" data-a="hojaRetoDet"><div class="rowh"><span class="lbl">🎯 ' + esc(r.nombre) + '</span><span class="hint">' + (fin ? "terminó" : "día " + dia + " de " + r.dias) + '</span></div>' +
      '<div class="bar' + (roto ? " b" : fin ? " ok" : "") + '"><i ' + wi(dia / r.dias * 100) + '></i></div><div class="hint" style="margin-top:6px">' + est + '</div>' +
      (PREF.retosOk ? '<div class="hint" style="margin-top:2px">🏅 Retos cumplidos: ' + PREF.retosOk + '</div>' : "") + '</button>';
  }
  function hojaReto() {
    var cats = (S.estado && S.estado.categoriasActivas) || [], RT = S.RT = S.RT || {};
    if (!RT.cat) { var a = cats.filter(function (c) { return /antojo/i.test(c.nombre); })[0] || cats[0]; RT.cat = a ? a.nombre : ""; RT.dias = 7; RT.modo = "cero"; RT.tope = ""; }
    abrirHoja('<div class="grab"></div><h3>🎯 Nuevo reto</h3><p class="hint">Elige en qué categoría quieres gastar menos y por cuántos días. Empieza hoy.</p>' +
      '<div><label class="l">Categoría</label><select class="field" id="rt-cat">' + cats.map(function (c) { return '<option value="' + esc(c.nombre) + '"' + (c.nombre === RT.cat ? " selected" : "") + '>' + c.emoji + ' ' + esc(c.nombre) + '</option>'; }).join("") + '</select></div>' +
      '<div><label class="l">Duración</label><div class="mset">' + [7, 14, 30].map(function (d) { return '<button class="' + (RT.dias === d ? "on" : "") + '" data-a="rtDias" data-v="' + d + '">' + d + ' días</button>'; }).join("") + '</div></div>' +
      '<div><label class="l">Meta del reto</label><div class="mset"><button class="' + (RT.modo === "cero" ? "on" : "") + '" data-a="rtModo" data-v="cero">Sin gastar nada</button><button class="' + (RT.modo === "max" ? "on" : "") + '" data-a="rtModo" data-v="max">Gastar menos de…</button></div></div>' +
      (RT.modo === "max" ? '<div><label class="l">Máximo en todo el reto (S/)</label><input class="field" id="rt-tope" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" enterkeyhint="done" autocomplete="off" value="' + esc(RT.tope) + '" placeholder="Ej.: 50"></div>' : "") +
      '<button class="btn" data-a="rtCrear">Empezar reto</button><button class="btn sec2" data-a="cerrar">Cancelar</button>');
  }

  /* ---- Face ID / Touch ID (verificación del propio teléfono; el código sigue como respaldo) ---- */
  function b64u(buf) { var s = ""; new Uint8Array(buf).forEach(function (x) { s += String.fromCharCode(x); }); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function ub64(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
  function bioDetectar() {
    try { if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(function (ok) { S.bioOk = !!ok; if (S.sub === "ajustes") render(); }).catch(function () {}); } catch (e) {}
  }
  function bioActivar() {
    var ch = crypto.getRandomValues(new Uint8Array(32)), uid = crypto.getRandomValues(new Uint8Array(16));
    return navigator.credentials.create({ publicKey: { challenge: ch, rp: { name: "Mis Gastos" }, user: { id: uid, name: "mis-gastos", displayName: "Mis Gastos" },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }], authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "discouraged" }, timeout: 60000, attestation: "none" } })
      .then(function (c) { PREF.bio = b64u(c.rawId); guardarPref(); });
  }
  function bioEntrar() {
    if (!PREF.bio || !S.locked || !navigator.credentials) return;
    var ch = crypto.getRandomValues(new Uint8Array(32));
    navigator.credentials.get({ publicKey: { challenge: ch, allowCredentials: [{ type: "public-key", id: ub64(PREF.bio) }], userVerification: "required", timeout: 60000 } })
      .then(function () { desbloquear(); }).catch(function () {});
  }
  function desbloquear() { S.locked = false; S.lockIn = ""; S.lockFallos = 0; S.lockMsg = ""; S.bioT = false; render(); enviarCola(false); cargarEstado(true); }

  /* ---------- saludo, frase de ánimo, gráficas del mes y logros ---------- */
  var DIAS_L = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  function esNoche() { var h = new Date().getHours(); return h < 5 || h >= 19; }
  function saludo() { return esNoche() ? "Buenas noches" : new Date().getHours() < 12 ? "Buenos días" : "Buenas tardes"; }
  function saludoIco() { return esNoche() ? "🌙" : new Date().getHours() < 12 ? "☀️" : "🌤️"; }
  function fechaHoyLarga() { var d = new Date(); return DIAS_L[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()].toLowerCase(); }
  var FRASES = ["Cada sol que registras es un sol que controlas.", "Gastar con calma también es ahorrar.", "Lo pequeño suma: hoy cuenta.", "Tu yo del futuro te lo va a agradecer.", "Ahorrar no es privarte, es elegir.",
    "Un día a la vez, un registro a la vez.", "La constancia le gana a la perfección.", "Vas construyendo algo grande, poco a poco.", "Registrar es ver; ver es decidir mejor.", "Con calma y constancia llegas lejos.", "Hoy es buen día para ir un paso adelante."];
  /* días de ahorro: un día SIN gastar es bueno (cuentan los gastos variables, sin fijos ni pago de la tarjeta) */
  function ahorroDatos() {
    var rp = S.RP; if (!rp) return null;
    var v = rp.diasVar || rp.dias || [], va = rp.diasVarAnt || rp.diasAnt || [], dia = Math.min(rp.diaActual, rp.diasEnMes), sin = 0, i;
    for (i = 0; i < dia; i++) if ((v[i] || 0) <= 0) sin++;
    var racha = rp.rachaAhorro;
    if (racha == null) { var sv = va.concat(v.slice(0, dia)), iz = sv.length - 1; racha = 0; while (iz >= 0 && sv[iz] <= 0) { racha++; iz--; } }
    return { racha: racha, dias: rp.diasSinGasto != null ? rp.diasSinGasto : sin, hoy: rp.hoySinGasto != null ? rp.hoySinGasto : ((v[dia - 1] || 0) <= 0) };
  }
  function frase() {
    var E = S.estado; if (!E) return "";
    var m = E.metaAhorro, rp = S.RP, dia = hoyE().getDate(), r = ritmo();
    if (m && m.objetivo > 0 && m.logrado >= m.objetivo) return "🎉 ¡Ya cumpliste tu meta de ahorro de este mes! Sigue así.";
    var ah = ahorroDatos();
    if (ah && ah.racha >= 2) return "💰 " + ah.racha + " días seguidos sin gastar. ¡Así se ahorra!";
    if (ah && ah.hoy && dia >= 2) return "💪 Hoy no has gastado nada: ¡día de ahorro!";
    if ((E.presupuesto || []).some(function (p) { return p.tope && !p.referencia && p.pct >= 100; })) return "💪 Un tope se pasó, no pasa nada: lo importante es retomar el rumbo.";
    if (r && dia >= 8 && r.proyNeto >= Math.max(0, r.obj)) return "👏 Vas a buen ritmo: así cerrarías el mes cumpliendo lo que planeaste.";
    if (dia <= 3) return "🌱 Mes nuevo, hoja en blanco. ¡Tú puedes!";
    var hoy = new Date(), n = Math.floor((hoy - new Date(hoy.getFullYear(), 0, 0)) / 864e5);
    return "💬 " + FRASES[n % FRASES.length];
  }
  function fraseHtml() { var f = frase(); return f ? '<p class="frase">' + esc(f) + '</p>' : ""; }

  /* datos de las gráficas (op «reportes» del script v3.6.0) */
  function cargarRP(forzar) {
    if (!cfg) return;
    if (!forzar && S.RP && Date.now() - (S.RPt || 0) < 300000) return;
    S.RPt = Date.now();
    app("reportes", { mes: mesClave(new Date()) }).then(function (j) {
      S.RP = j;
      var ah = ahorroDatos();
      if (ah && ah.racha > (PREF.ahorroMax || 0)) { PREF.ahorroMax = ah.racha; guardarPref(); }
      if (ah && ah.hoy && PREF.ahorroHoy !== ymd(new Date())) { PREF.ahorroHoy = ymd(new Date()); guardarPref(); if (window.MGM) MGM.reaccionar("ahorro"); }
      evaluarLogros(); if (S.tab === "inicio" || S.sub === "logros") render();
    }).catch(function () { S.RPt = 0; });
  }
  function msgRep(e) { return /desconocida/i.test((e && e.message) || "") ? "Para ver estas gráficas, actualiza el script de Google a la v3.6.0 (está en la carpeta del proyecto)." : "No se pudieron cargar las gráficas. Inténtalo de nuevo."; }

  /* línea del mes día por día: acumulado, mes anterior y proyección */
  function lineaMes(Rp) {
    var n = Rp.diasEnMes, dia = Math.max(1, Math.min(Rp.diaActual, n)), W = 320, H = 150, L = 6, Rr = 10, T = 14, B = 24, i, c = 0, a = 0, cur = [], ant = [];
    for (i = 0; i < n; i++) { c += Rp.dias[i] || 0; cur.push(c); a += (Rp.diasAnt || [])[i] || 0; ant.push(a); }
    var totAnt = (Rp.diasAnt || []).reduce(function (s, x) { return s + x; }, 0), hoyV = cur[dia - 1], proy = dia < n ? hoyV / dia * n : hoyV;
    var ymax = Math.max(hoyV, ant[n - 1], proy, 1);
    function X(k) { return L + (W - L - Rr) * (n > 1 ? k / (n - 1) : 0); }
    function Y(v) { return T + (H - T - B) * (1 - v / ymax); }
    function pth(arr, d0, d1) { var s = ""; for (var k = d0; k <= d1; k++) s += (k === d0 ? "M" : "L") + X(k).toFixed(1) + " " + Y(arr[k]).toFixed(1) + " "; return s; }
    var dCur = pth(cur, 0, dia - 1), base = H - B;
    var area = dCur + "L" + X(dia - 1).toFixed(1) + " " + base + " L" + X(0).toFixed(1) + " " + base + " Z";
    var grid = [0, 0.5, 1].map(function (f) { var y = (T + (H - T - B) * f).toFixed(1); return '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + y + '" y2="' + y + '" stroke="var(--line)" stroke-width="1"/>'; }).join("");
    var xl = [1, Math.round(n / 2), n].map(function (d) { return '<text x="' + X(d - 1).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + (d === 1 ? "start" : d === n ? "end" : "middle") + '" font-size="10" fill="var(--mut)">' + d + '</text>'; }).join("");
    var yl = S.ocultoTodo ? "" : '<text x="' + (L + 2) + '" y="' + (T - 4) + '" font-size="10" fill="var(--mut)">S/ ' + Math.round(ymax).toLocaleString("en-US") + '</text>';
    var pr = dia < n ? '<path d="M' + X(dia - 1).toFixed(1) + ' ' + Y(hoyV).toFixed(1) + ' L' + X(n - 1).toFixed(1) + ' ' + Y(proy).toFixed(1) + '" fill="none" stroke="var(--steel2)" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>' : "";
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="lnsvg" role="img" aria-label="Gasto acumulado del mes">' + grid + yl + xl +
      '<path d="' + pth(ant, 0, n - 1) + '" fill="none" stroke="var(--field)" stroke-width="2" stroke-dasharray="3 4" stroke-linecap="round" stroke-linejoin="round"/>' + pr +
      '<path class="ar" d="' + area + '" fill="var(--navy)" fill-opacity=".08"/>' +
      '<path class="ln1" pathLength="1" d="' + dCur + '" fill="none" stroke="var(--navy)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" ' + (S.anim ? 'style="stroke-dasharray:0 1" data-da="1 1"' : 'stroke-dasharray="1 1"') + '/>' +
      '<circle class="dot2" cx="' + X(dia - 1).toFixed(1) + '" cy="' + Y(hoyV).toFixed(1) + '" r="4.5" fill="var(--navy)" stroke="var(--card)" stroke-width="2"/></svg>';
    var dif = hoyV - ant[dia - 1], mejor = dif <= 0;
    return svg + '<div class="lgd"><span><i></i>Este mes</span><span><i class="d1"></i>' + esc(Rp.mesAnteriorNombre) + '</span>' + (dia < n ? '<span><i class="d2"></i>Proyección</span>' : "") + '</div>' +
      '<div style="margin-top:8px"><div class="kv"><span>Llevas gastado</span><b>' + money(hoyV) + '</b></div>' +
      (ant[dia - 1] > 0 ? '<div class="kv"><span>' + esc(Rp.mesAnteriorNombre) + ' a esta fecha</span><b>' + money(ant[dia - 1]) + '</b></div><div class="kv"><span>Diferencia</span><b style="color:' + (mejor ? "var(--ok)" : "var(--bad)") + '">' + (mejor ? "▼ " : "▲ ") + money(Math.abs(dif)) + '</b></div>' : "") +
      (dia < n ? '<div class="kv"><span>A este ritmo cerrarías en</span><b>' + money(proy) + '</b></div>' : "") +
      (totAnt > 0 ? '<div class="kv"><span>' + esc(Rp.mesAnteriorNombre) + ' cerró en</span><b>' + money(totAnt) + '</b></div>' : "") + '</div>';
  }

  /* mapa de calor: un calendario donde cada día es más oscuro cuanto más gastaste */
  function calTexto(Rp, d) {
    var p = Rp.mes.split("-"), f = new Date(+p[0], +p[1] - 1, d), v = Rp.dias[d - 1] || 0;
    return DIAS_L[f.getDay()] + " " + d + " · " + (d > Rp.diaActual ? "aún no llega" : ((Rp.diasVar || Rp.dias)[d - 1] || 0) <= 0 ? "💰 día sin gastar" + (v > 0 ? " (solo fijos: " + money(v) + ")" : "") : money(v));
  }
  function calor(Rp) {
    var n = Rp.diasEnMes, dia = Math.min(Rp.diaActual, n), p = Rp.mes.split("-"), off = (new Date(+p[0], +p[1] - 1, 1).getDay() + 6) % 7, d, v;
    var libres = 0, mx = Math.max.apply(null, Rp.dias.slice(0, dia).concat([1])), suma = [0, 0, 0, 0, 0, 0, 0], cnt = [0, 0, 0, 0, 0, 0, 0];
    var h = '<div class="hmh">' + ["L", "M", "M", "J", "V", "S", "D"].map(function (x) { return "<span>" + x + "</span>"; }).join("") + '</div><div class="hmg">';
    for (d = 0; d < off; d++) h += "<i></i>";
    for (d = 1; d <= n; d++) {
      v = Rp.dias[d - 1] || 0;
      var lv = d > dia ? "f" : v <= 0 ? 0 : Math.min(4, Math.max(1, Math.ceil(v / mx * 4)));
      if (d <= dia && ((Rp.diasVar || Rp.dias)[d - 1] || 0) <= 0) { lv = "z"; libres++; }
      if (d <= dia) { suma[(off + d - 1) % 7] += v; cnt[(off + d - 1) % 7]++; }
      h += '<button class="hc l' + lv + (S.IN.dia === d ? " sel" : "") + '" data-a="calDia" data-v="' + d + '" aria-label="' + esc(calTexto(Rp, d)) + '">' + d + '</button>';
    }
    h += '</div><div class="hrd" id="cal-read" aria-live="polite">' + (S.IN.dia ? esc(calTexto(Rp, S.IN.dia)) : "Toca un día para ver cuánto gastaste.") + '</div>' +
      '<div class="hsc">menos <i style="background:var(--track)"></i><i style="background:var(--h1)"></i><i style="background:var(--h2)"></i><i style="background:var(--h3)"></i><i style="background:var(--h4)"></i> más</div>';
    var best = -1, bv = 0, nombres = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"];
    for (d = 0; d < 7; d++) if (cnt[d] > 0 && suma[d] / cnt[d] > bv) { bv = suma[d] / cnt[d]; best = d; }
    h += '<p class="hint" style="margin-top:8px">🌱 Los días con borde de color son días en que <b>no gastaste</b>: cada uno es ahorro. Llevas <b>' + libres + '</b> este mes.</p>';
    if (best >= 0 && dia >= 7) h += '<p class="hint" style="margin-top:8px">📅 Gastas más los <b>' + nombres[best] + '</b>: en promedio ' + money(bv) + ' cada uno.</p>';
    return h;
  }

  /* lugares donde más gastas */
  function topLugares(Rp) {
    var Ls = (Rp.lugares || []).slice(0, 6); if (!Ls.length) return "";
    var mx = Ls[0].monto || 1;
    return '<div class="sec"><span>Dónde más gastas</span></div><div class="card" style="padding:6px 16px 10px">' + Ls.map(function (x, i) {
      return '<div class="tl"><div class="rowh"><span class="tln"><i>' + (i + 1) + '</i>' + esc(x.lugar) + '</span><b>' + money(x.monto) + '</b></div><div class="bar g"><i ' + wi(x.monto / mx * 100) + '></i></div><div class="hint">' + x.veces + (x.veces === 1 ? " vez" : " veces") + ' este mes</div></div>';
    }).join("") + '</div>';
  }

  /* evolución de una categoría en los últimos 6 meses */
  function evoCat(Rp) {
    var C = Rp.categorias || []; if (!C.length) return "";
    var i0 = Math.min(S.IN.catI || 0, C.length - 1), c = C[i0], W = 320, H = 140, L = 16, Rr = 16, T = 24, B = 24, n = c.serie.length;
    var mx = Math.max.apply(null, c.serie.concat([1]));
    var pts = c.serie.map(function (v, k) { return [L + (W - L - Rr) * k / (n - 1), T + (H - T - B) * (1 - v / mx)]; });
    var d = pts.map(function (p, k) { return (k ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" "), base = H - B;
    var area = d + " L" + pts[n - 1][0].toFixed(1) + " " + base + " L" + pts[0][0].toFixed(1) + " " + base + " Z";
    var marks = pts.map(function (p, k) {
      return '<text x="' + p[0].toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10" fill="var(--mut)">' + esc(Rp.meses[k]) + '</text>' +
        (S.ocultoTodo ? "" : '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] - 8).toFixed(1) + '" text-anchor="middle" font-size="9.5" font-weight="600" fill="var(--ink)">' + Math.round(c.serie[k]).toLocaleString("en-US") + '</text>') +
        '<circle class="dot2" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (k === n - 1 ? 4.5 : 3) + '" fill="var(--navy)" stroke="var(--card)" stroke-width="2"/>';
    }).join("");
    var prom = c.serie.slice(0, n - 1).reduce(function (s, x) { return s + x; }, 0) / Math.max(1, n - 1), last = c.serie[n - 1], pc = prom > 0 ? Math.round((last - prom) / prom * 100) : null;
    return '<div class="sec"><span>Evolución por categoría</span></div><div class="card"><div class="filt" style="margin-bottom:10px">' +
      C.map(function (x, k) { return '<button class="chip' + (k === i0 ? " sel" : "") + '" data-a="evoCat" data-v="' + k + '">' + x.emoji + " " + esc(x.categoria) + '</button>'; }).join("") + '</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" class="lnsvg" role="img" aria-label="Evolución de ' + esc(c.categoria) + '"><line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + base + '" y2="' + base + '" stroke="var(--line)"/>' +
      '<path class="ar" d="' + area + '" fill="var(--navy)" fill-opacity=".08"/><path class="ln1" pathLength="1" d="' + d + '" fill="none" stroke="var(--navy)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" ' + (S.anim ? 'style="stroke-dasharray:0 1" data-da="1 1"' : 'stroke-dasharray="1 1"') + '/>' + marks + '</svg>' +
      '<div class="hint" style="margin-top:6px">' + (pc === null ? "Sin gastos en los meses anteriores para comparar." : "Este mes vas " + (pc > 0 ? "<b>" + pc + " % por encima</b>" : pc < 0 ? "<b>" + (-pc) + " % por debajo</b>" : "<b>igual</b>") + " de tu promedio de los 5 meses anteriores (" + money(prom) + ").") + '</div></div>';
  }
  function reportesHtml() {
    var Rp = S.IN.rep;
    if (!Rp) return S.IN.repErr ? '<div class="card"><p class="hint">' + esc(S.IN.repErr) + '</p></div>' : "";
    return '<div class="sec"><span>El mes, día por día</span></div><div class="card">' + lineaMes(Rp) + '</div>' +
      '<div class="sec"><span>Mapa de calor del mes</span></div><div class="card">' + calor(Rp) + '</div>' + topLugares(Rp) + evoCat(Rp);
  }

  /* logros */
  function logrosDef() {
    var E = S.estado || {}, rp = S.RP, m = E.metaAhorro, dia = hoyE().getDate(), cur = 0, ant = 0, i;
    var topes = (E.presupuesto || []).filter(function (p) { return p.tope && !p.referencia; });
    if (rp) { var dd = Math.min(rp.diaActual, rp.diasEnMes); for (i = 0; i < dd; i++) { cur += rp.dias[i] || 0; ant += (rp.diasAnt || [])[i] || 0; } }
    var ah = ahorroDatos() || { racha: 0, dias: 0 }, rm = Math.max(PREF.ahorroMax || 0, ah.racha), pasados = topes.filter(function (p) { return p.pct >= 100; }).length;
    return [
      { id: "ahorro1", e: "💰", t: "Día de ahorro", d: "Pasa un día entero sin gastar.", ok: rm >= 1 || ah.dias >= 1, p: "Aún sin un día sin gastos" },
      { id: "ahorro3", e: "💪", t: "Tres días sin gastar", d: "Pasa 3 días seguidos sin gastar.", ok: rm >= 3, p: Math.min(rm, 3) + " de 3 días" },
      { id: "ahorro7", e: "🏆", t: "Semana de ahorro", d: "Pasa 7 días seguidos sin gastar.", ok: rm >= 7, p: Math.min(rm, 7) + " de 7 días" },
      { id: "libres10", e: "🌟", t: "10 días sin gastar", d: "Llega a 10 días sin gastos en un mismo mes.", ok: ah.dias >= 10, p: ah.dias + " de 10 este mes" },
      { id: "meta", e: "🎯", t: "Meta cumplida", d: "Cumple tu meta de ahorro de un mes.", ok: !!(m && m.objetivo > 0 && m.logrado >= m.objetivo), p: m && m.objetivo > 0 ? Math.max(0, Math.min(100, Math.round(m.logrado / m.objetivo * 100))) + " % este mes" : "Define tu meta" },
      { id: "topes", e: "🛡️", t: "Dentro de tus topes", d: "Llega al día 25 sin pasarte de ningún tope.", ok: topes.length > 0 && dia >= 25 && pasados === 0, p: !topes.length ? "Fija un tope en Presupuesto" : pasados ? "Un tope ya se pasó" : "Vas bien, hasta el día 25" },
      { id: "menos", e: "📉", t: "Mejor que el mes pasado", d: "Pasado el día 10, gasta menos que el mes anterior a la misma fecha.", ok: !!rp && dia >= 10 && ant > 0 && cur < ant, p: rp && ant > 0 ? (cur < ant ? "Vas por debajo" : "Todavía no") : "Aún sin datos" },
      { id: "reto", e: "🏅", t: "Reto cumplido", d: "Completa un reto de ahorro.", ok: (PREF.retosOk || 0) >= 1, p: "Crea uno en Inicio" },
      { id: "mitad", e: "⛰️", t: "A mitad de camino", d: "Llega al 50 % de alguna de tus metas.", ok: (E.metas || []).some(function (x) { return x.avance >= 50; }), p: "Sigue ahorrando" },
      { id: "qr", e: "🧾", t: "Lector de boletas", d: "Escanea el QR de una boleta o factura.", ok: Object.keys(PREF.rucs || {}).length >= 1, p: "Prueba «Escanear QR»" },
      { id: "plantilla", e: "⭐", t: "Atajo propio", d: "Guarda tu primera plantilla.", ok: (PREF.plantillas || []).length >= 1, p: "Guárdala en Registrar" },
      { id: "candado", e: "🔐", t: "App protegida", d: "Activa el candado con código o Face ID.", ok: !!(PREF.lock || PREF.bio), p: "En Ajustes" }
    ];
  }
  /* ---------- mascota: etapa según tus logros y puente con mascota.js ---------- */
  function logrosGanados() { return logrosDef().filter(logroOn).length; }
  function dragonEtapa() { var n = logrosGanados(); return n >= 7 ? 3 : n >= 3 ? 2 : 1; }
  function mascotaPantalla() { if (window.MGM) MGM.pantalla(); }
  function evaluarLogros() {
    var L = logrosDef(), prim = !PREF.logros, nuevos = [];
    PREF.logros = PREF.logros || {};
    L.forEach(function (x) { if (x.ok && !PREF.logros[x.id]) { PREF.logros[x.id] = ymd(new Date()); nuevos.push(x); } });
    if (!nuevos.length) { if (prim) guardarPref(); return; }
    guardarPref();
    if (!prim) { toast("🏅 Nuevo logro: " + nuevos[0].t + (nuevos.length > 1 ? " (+" + (nuevos.length - 1) + " más)" : ""), "ok", 4800); celebrar(); if (window.MGM) MGM.reaccionar("logro"); }
  }
  function logroOn(x) { return x.ok || !!(PREF.logros && PREF.logros[x.id]); }
  function atajosInicio() {
    var L = logrosDef(), n = L.filter(logroOn).length;
    return '<div class="filt"><button class="chip" data-a="ir" data-v="informes">📈 Mis gráficas</button><button class="chip" data-a="ir" data-v="logros">🏅 Logros ' + n + '/' + L.length + '</button></div>';
  }
  function vistaLogros() {
    var L = logrosDef(), n = L.filter(logroOn).length, rp = S.RP;
    var h = '<div class="cc"><div class="lbl">Tus logros</div><div class="big">' + n + ' <sm>de ' + L.length + '</sm></div>' +
      (function () { var q = ahorroDatos(); return q ? '<div class="kv" style="margin-top:8px"><span>💰 Sin gastar (seguidos)</span><b>' + q.racha + (q.racha === 1 ? " día" : " días") + '</b></div><div class="kv"><span>🌱 Días sin gastar este mes</span><b>' + q.dias + '</b></div>' : ""; })() + '</div>' + (window.MGM && MGM.ok() ? MGM.tarjeta() : "") + '<div class="lgg">';
    L.forEach(function (x) {
      var f = PREF.logros && PREF.logros[x.id], on = logroOn(x);
      h += '<div class="logro' + (on ? " on" : "") + '"><span class="le">' + x.e + '</span><b>' + esc(x.t) + '</b><small>' + esc(x.d) + '</small><em>' + (on ? "✓ " + (f ? fechaCorta(f) : "Hoy") : esc(x.p)) + '</em></div>';
    });
    return h + '</div>';
  }

  /* al volver a la app (iPhone la deja en la pantalla donde quedó): empieza de nuevo en Inicio con la bienvenida */
  var SPLASH_HTML = $("#splash") ? $("#splash").outerHTML : "";
  function splashMostrar(nuevo, ms) {
    var s = $("#splash");
    if (nuevo || !s) { if (s && s.parentNode) s.parentNode.removeChild(s); if (!SPLASH_HTML) return; document.body.insertAdjacentHTML("beforeend", SPLASH_HTML); s = $("#splash"); }
    if (!s) return;
    var spv = s.querySelector("svg.sp");
    if (spv && window.MGM && MGM.ok() && !spv.querySelector(".sp-dr")) {          // el dragón se sienta sobre la columna más alta
      try { var dd = document.createElement("div"); dd.innerHTML = MGM.svg(); var ds = dd.firstChild; ds.setAttribute("class", "sp-dr md-svg"); ds.setAttribute("x", "118"); ds.setAttribute("y", "40"); ds.setAttribute("width", "84"); ds.setAttribute("height", "68"); spv.appendChild(ds); } catch (e) {}
    }
    var p = s.querySelector(".sp-sd"), E = S.estado; if (p) p.textContent = saludo() + (E && E.nombre ? ", " + E.nombre : "") + " " + saludoIco();
    function salir() { clearTimeout(S.tsp); s.classList.add("out"); setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 650); }
    s.addEventListener("click", salir);                                         // un toque y pasa de largo
    clearTimeout(S.tsp); S.tsp = setTimeout(salir, reducido() ? 250 : (ms || 6000));      // tope de seguridad
    if (p && p.getAnimations && !reducido()) Promise.all(p.getAnimations().map(function (an) { return an.finished; })).then(function () { clearTimeout(S.tsp); S.tsp = setTimeout(salir, 800); }).catch(function () {});   // al terminar el saludo se queda un instante y pasa a la app
  }
  function inicioNuevo() {
    S.tab = PREF.abrirRegistrar ? "registrar" : "inicio"; S.sub = null; S.vk = null; S.anim = true; cerrarHoja();
    if (!S.locked) splashMostrar(true, 2200);
  }

  /* ---------- acciones ---------- */
  var acciones = {
    tab: function (v) { if (S.tab !== v || S.sub) S.anim = true; S.tab = v; S.sub = null; if (v === "gastos" && !S.G.data) S.G.animar = true; render(); if (v === "gastos" && !S.G.data) cargarGastos(); if (v === "gastos" || v === "tarjeta" || v === "inicio") cargarEstado(true); if (v === "registrar") { var l = $("#f-lugar"); if (l && S.F.modo === "gasto") pintarSugerencias(!S.F.lugar.trim()); var m0 = $("#f-monto"); if (m0) m0.focus(); } },
    refrescar: function () { toast("Actualizando…"); if (S.tab === "gastos") cargarGastos(); cargarEstado(true); },
    ir: function (v) {
      S.anim = true;
      if (v === "fijos") { S.tab = "mas"; S.sub = "fijos"; render(); cargarFijos(); }
      else if (v === "informes") { S.tab = "mas"; S.sub = "informes"; render(); cargarInformes(); }
      else if (v === "logros") { S.tab = "mas"; S.sub = "logros"; render(); cargarEstado(true); cargarRP(true); }
      else if (v === "presupuesto" || v === "ajustes") { S.tab = "mas"; S.sub = v; render(); if (v === "presupuesto") cargarEstado(true); }
      else { S.tab = "mas"; S.sub = null; render(); }
    },
    modo: function (v) { S.F.modo = v; render(); if (v === "fijos") cargarFijos(); else { var m1 = $("#f-monto"); if (m1) m1.focus(); } },
    metodo: function (v) { S.F.metodo = v; render(); },
    desc: function (v) { S.F.desc = v; render(); },
    extraDet: function (v) { S.F.extra = v; var e = $("#f-extra"); if (e) { e.value = v; e.focus(); } },
    elegirLugar: function () { hojaLugar(); },
    lugar: function (v) {
      S.F.lugar = v; S.F.catAuto = true; S.F.habitual = ""; cerrarHoja();
      call({ tipo: "sugerir", lugar: v }).then(function (j) { if (j && j.habitual) { S.F.habitual = j.habitual; S.F.cat = j.habitual; } })
        .catch(function () {}).then(function () { render(); hojaCategorias(); });
    },
    elegirCat: function () { hojaCategorias(); },
    cat: function (v) { S.F.catAuto = (v === S.F.habitual); S.F.cat = v; cerrarHoja(); render(); if (!S.F.monto) { var mm = $("#f-monto"); if (mm) mm.focus(); } },
    guardar: guardar,
    mesG: function (v) { S.G.mes = mesMover(S.G.mes, +v); S.G.animar = true; S.G.data = null; render(); cargarGastos(); },
    metG: function (v) { S.G.metodo = v; S.G.data = null; render(); cargarGastos(); },
    catG: function () {
      var cats = (S.estado && S.estado.categoriasActivas) || [];
      abrirHoja('<div class="grab"></div><h3>Filtrar por categoría</h3><div class="stack"><button class="it" data-a="catGSet" data-v=""><span class="ico">•</span><span class="t"><b>Todas</b></span></button>' + cats.map(function (c) { return '<button class="it" data-a="catGSet" data-v="' + esc(c.nombre) + '"><span class="ico">' + c.emoji + '</span><span class="t"><b>' + esc(c.nombre) + '</b></span></button>'; }).join("") + '</div>');
    },
    catGSet: function (v) { S.G.cat = v; S.G.data = null; cerrarHoja(); render(); cargarGastos(); },
    verGasto: function (v) { hojaGasto(+v); },
    verIngreso: function (v) { hojaIngreso(+v); },
    editarGasto: function (v) { hojaEditarGasto(+v); },
    guardarGasto: function (v) { guardarGasto(+v); },
    guardarIngreso: function (v) { guardarIngreso(+v); },
    borrarAsk: borrarAsk, borrarOk: borrarOk,
    cerrar: cerrarHoja,
    hojaTarjeta: hojaTarjeta, guardarTarjeta: guardarTarjeta,
    hojaBanco: hojaBanco,
    guardarBanco: function () { app("saldo_banco", { saldo: $("#b-saldo").value.trim().replace(",", ".") }).then(function (j) { cerrarHoja(); toast(j.mensaje, "ok"); cargarEstado(true); }).catch(fail); },
    topeEditar: function (v) {
      var p = S.estado.presupuesto.filter(function (x) { return x.categoria === v; })[0];
      abrirHoja('<div class="grab"></div><h3>' + p.emoji + ' ' + esc(v) + '</h3><p class="hint">Gastado este mes: ' + money(p.gastado) + '</p><div><label class="l">Tope mensual (S/)</label><input class="field" id="p-tope" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" enterkeyhint="done" autocomplete="off" value="' + (p.tope && !p.referencia ? p.tope : "") + '" placeholder="Ej.: 300"></div><button class="btn" data-a="topeGuardar" data-v="' + esc(v) + '">Guardar tope</button><button class="btn sec2" data-a="topeQuitar" data-v="' + esc(v) + '">Quitar tope</button><button class="btn sec2" data-a="cerrar">Cancelar</button>');
    },
    topeGuardar: function (v) { app("presupuesto_guardar", { categoria: v, tope: $("#p-tope").value.trim().replace(",", ".") }).then(function (j) { cerrarHoja(); toast(j.mensaje, "ok"); cargarEstado(true); }).catch(fail); },
    topeQuitar: function (v) { app("presupuesto_guardar", { categoria: v, tope: 0 }).then(function (j) { cerrarHoja(); toast(j.mensaje, "ok"); cargarEstado(true); }).catch(fail); },
    selFijo: function (v) { var x = S.FJ.data.fijos.filter(function (y) { return !y.pagado; })[+v]; S.FJ.sel[x.nombre] = !S.FJ.sel[x.nombre]; render(); },
    pagarFijos: function () {
      var items = S.FJ.data.fijos.filter(function (x) { return !x.pagado && S.FJ.sel[x.nombre]; }).map(function (x) { return x.nombre + " - S/ " + x.monto.toFixed(2); });
      if (!items.length) return;
      call({ tipo: "fijos", items: items }).then(function (j) { if (j.status === "error") throw new Error(j.mensaje); toast(j.mensaje, "ok", 4200); cargarFijos(); cargarEstado(true); S.G.data = null; }).catch(fail);
    },
    calDia: function (v) {
      S.IN.dia = +v; var r = $("#cal-read"); if (r && S.IN.rep) r.textContent = calTexto(S.IN.rep, S.IN.dia);
      Array.prototype.forEach.call(document.querySelectorAll(".hc"), function (b) { b.classList.toggle("sel", b.getAttribute("data-v") === String(v)); });
    },
    evoCat: function (v) { S.IN.catI = +v; render(); },
    mesI: function (v) { S.IN.mes = mesMover(S.IN.mes, +v); render(); cargarInformes(); },
    cambiarPin: function () { cfg = { url: cfg.url, pin: "" }; store("mg_cfg", null); S.setupMsg = "Escribe el PIN nuevo."; render(); },
    salir: function () { cfg = null; S.estado = null; S.G.data = null; store("mg_cfg", null); store("mg_estado", null); S.setupMsg = ""; S.tab = "inicio"; S.sub = null; render(); },
    barra: function (v) { PREF.flotante = (v === "true"); guardarPref(); aplicarPantalla(); render(); },
    ver: function (k) {
      S.ver[k] = !S.ver[k]; render(); if (visK(k)) contarNumeros();
    },
    ojo: function () { S.ocultoTodo = !S.ocultoTodo; render(); },     // muestra u oculta todos los montos MENOS «Ahorro» y «Deuda»
    ocultarInicio: function () { PREF.ocultarAlAbrir = !PREF.ocultarAlAbrir; guardarPref(); render(); },
    tema: function (v) { PREF.tema = v; guardarPref(); aplicarTema(); render(); },
    color: function (v) { PREF.color = v; guardarPref(); aplicarColor(); render(); },
    mascota: function (v) { PREF.mascota = v; guardarPref(); mascotaPantalla(); render(); },
    emoji: function (v) { PREF.emoji = v; guardarPref(); if (window.MGE) MGE.set(v !== "sys"); render(); },
    enviarCola: function () { enviarCola(true); },
    colaDescartar: function (v) { store(COLA_K, cola().filter(function (x) { return x.id !== v; })); render(); },
    hojaLock: function () {
      abrirHoja('<div class="grab"></div><h3>Candado de la app</h3><p class="hint">Un código de 4 a 6 números que se pide al abrir la app. Es solo de este teléfono; no cambia tu PIN del Excel.</p>' +
        '<div><label class="l">Código</label><input class="field" id="l-1" type="password" inputmode="numeric" maxlength="6" autocomplete="off"></div>' +
        '<div><label class="l">Repite el código</label><input class="field" id="l-2" type="password" inputmode="numeric" maxlength="6" autocomplete="off"></div>' +
        '<button class="btn" data-a="lockGuardar">Guardar candado</button><button class="btn sec2" data-a="cerrar">Cancelar</button>');
    },
    lockGuardar: function () {
      var a = $("#l-1").value.trim(), b = $("#l-2").value.trim();
      if (!/^\d{4,6}$/.test(a)) { toast("El código debe tener de 4 a 6 números", "err"); return; }
      if (a !== b) { toast("Los dos códigos no coinciden", "err"); return; }
      var salt = nuevoId();
      hashLock(a, salt).then(function (h) {
        PREF.lock = { s: salt, h: h, len: a.length, min: PREF.lock && PREF.lock.min != null ? PREF.lock.min : 1 };
        guardarPref(); cerrarHoja(); toast("🔒 Candado activado", "ok"); render();
      });
    },
    lockOff: function () { PREF.lock = null; guardarPref(); toast("Candado desactivado"); render(); },
    lockMin: function (v) { PREF.lock.min = +v; guardarPref(); render(); },
    tecla: function (v) {
      if (S.lockBloq && Date.now() < S.lockBloq) return;
      if (v === "<") { S.lockIn = S.lockIn.slice(0, -1); S.lockErr = false; render(); return; }
      if (S.lockIn.length >= PREF.lock.len) return;
      S.lockIn += v; S.lockErr = false; render();
      if (S.lockIn.length === PREF.lock.len) {
        hashLock(S.lockIn, PREF.lock.s).then(function (h) {
          if (h === PREF.lock.h) { desbloquear(); return; }
          S.lockFallos = (S.lockFallos || 0) + 1; S.lockIn = ""; S.lockErr = true;
          if (S.lockFallos >= 5) { S.lockBloq = Date.now() + 30000; S.lockFallos = 0; S.lockMsg = "Demasiados intentos. Espera 30 segundos."; } else S.lockMsg = "Código incorrecto";
          render();
        });
      }
    },
    olvideLock: function () {
      abrirHoja('<div class="grab"></div><h3>¿Olvidaste el código?</h3><p class="hint">Para entrar sin él se cierra la sesión de este teléfono y tendrás que volver a conectar la app con el enlace de tu script y tu PIN del Excel. Tus datos del Excel no se tocan.</p>' +
        '<button class="btn bad" data-a="lockReset">Cerrar sesión y entrar</button><button class="btn sec2" data-a="cerrar">Cancelar</button>');
    },
    lockReset: function () { PREF.lock = null; guardarPref(); S.locked = false; cerrarHoja(); acciones.salir(); },
    hojaMeta: hojaMeta,
    metaTipo: function (v) {
      S.metaTipo = v;
      Array.prototype.forEach.call(document.querySelectorAll("#m-seg button"), function (b) { b.classList.toggle("on", b.getAttribute("data-v") === v); });
      $("#m-lbl").textContent = v === "pct" ? "Porcentaje (%)" : "Monto al mes (S/)"; $("#m-val").placeholder = v === "pct" ? "Ej.: 20" : "Ej.: 600";
    },
    metaGuardar: function () { app("meta_ahorro_guardar", { modo: S.metaTipo, valor: $("#m-val").value.trim().replace(",", ".") }).then(function (j) { cerrarHoja(); toast(j.mensaje, "ok"); cargarEstado(true); }).catch(fail); },
    metaQuitar: function () { app("meta_ahorro_guardar", { valor: 0 }).then(function (j) { cerrarHoja(); toast(j.mensaje, "ok"); cargarEstado(true); }).catch(fail); },
    /* --- v1.7: registrar más rápido, plantillas, dictado, comprobante, retos, Face ID --- */
    hojaVoz: hojaVoz, vozMic: vozMic,
    vozUsar: function () {
      var p = parseVoz($("#v-txt").value);
      if (!p.monto && !p.lugar && !p.detalle) { toast("Dime el monto y el lugar", "err"); return; }
      S.F.modo = "gasto"; if (p.monto) S.F.monto = p.monto; if (p.lugar) { S.F.lugar = p.lugar; S.F.catAuto = true; S.F.cat = ""; } if (p.detalle) S.F.detalle = p.detalle; if (p.metodo) S.F.metodo = p.metodo;
      cerrarHoja(); render();
      if (p.lugar) call({ tipo: "sugerir", lugar: p.lugar }).then(function (j) { if (j && j.habitual && S.F.catAuto && !S.F.cat) { S.F.cat = j.habitual; S.F.habitual = j.habitual; if (S.tab === "registrar") render(); } }).catch(function () {});
    },
    hojaQR: hojaQR,
    qrFoto: function () { var f = $("#qr-f"); if (f) f.click(); },
    quitarFechaDoc: function () { S.F.fechaDoc = ""; render(); },
    tpl: function (v) { hojaTpl(+v); },
    tplGuardar: function () {
      var F = S.F, monto = parseFloat(String(F.monto).replace(",", "."));
      if (!(monto > 0) || !F.lugar.trim()) { toast("Primero escribe el monto y elige el lugar", "err"); return; }
      if (tplLista().length >= 8) { toast("Ya tienes 8 plantillas. Borra alguna primero.", "err"); return; }
      abrirHoja('<div class="grab"></div><h3>⭐ Guardar plantilla</h3><p class="hint">Se guarda el monto, el lugar, la categoría y el método de pago.</p><div><label class="l">Nombre</label><input class="field" id="tp-n" maxlength="24" autocomplete="off" value="' + esc(F.detalle || F.lugar) + '"></div><button class="btn" data-a="tplOk">Guardar</button><button class="btn sec2" data-a="cerrar">Cancelar</button>');
    },
    tplOk: function () {
      var F = S.F, n = $("#tp-n").value.trim(); if (!n) { toast("Ponle un nombre", "err"); return; }
      PREF.plantillas = tplLista().concat([{ n: n, monto: parseFloat(String(F.monto).replace(",", ".")), lugar: F.lugar.trim(), cat: F.cat, metodo: F.metodo, detalle: F.detalle.trim() }]);
      guardarPref(); cerrarHoja(); toast("⭐ Plantilla guardada", "ok"); render();
    },
    tplUsar: function (v) {
      var t = tplLista()[+v]; if (!t) return;
      S.F.modo = "gasto"; S.F.monto = String(t.monto); S.F.lugar = t.lugar; S.F.cat = t.cat; S.F.catAuto = false; S.F.metodo = t.metodo; S.F.detalle = t.detalle || ""; cerrarHoja(); render();
    },
    tplYa: function (v) { var t = tplLista()[+v]; if (!t) return; cerrarHoja(); enviar(cuerpoTpl(t), t.lugar + " · " + money(t.monto), false); },
    tplBorrar: function (v) { PREF.plantillas = tplLista().filter(function (x, i) { return i !== +v; }); guardarPref(); cerrarHoja(); render(); },
    hojaReto: hojaReto,
    rtDias: function (v) { S.RT.dias = +v; hojaReto(); },
    rtModo: function (v) { S.RT.modo = v; hojaReto(); },
    rtCrear: function () {
      var RT = S.RT, tope = parseFloat(String(RT.tope || "").replace(",", "."));
      if (RT.modo === "max" && !(tope > 0)) { toast("Escribe el máximo en soles", "err"); return; }
      PREF.reto = { cat: RT.cat, nombre: (RT.modo === "max" ? "Menos en " : "Sin ") + RT.cat, ini: ymd(hoyE()), dias: RT.dias, tope: RT.modo === "max" ? tope : 0 };
      S.RT = null; S.reto = null; S.retoTs = 0; guardarPref(); cerrarHoja(); toast("🎯 ¡Reto empezado!", "ok"); S.anim = true; render(); cargarReto(true);
    },
    hojaRetoDet: function () {
      var r = PREF.reto; if (!r) return; var n = diasReto(r), fin = n > r.dias, R = S.reto, tot = R && R.key === r.ini + r.cat ? R.tot : null;
      abrirHoja('<div class="grab"></div><h3>🎯 ' + esc(r.nombre) + '</h3><div class="card"><div class="kv"><span>Categoría</span><b>' + esc(r.cat) + '</b></div><div class="kv"><span>Duración</span><b>' + r.dias + ' días</b></div><div class="kv"><span>Empezó</span><b>' + esc(fechaCorta(r.ini)) + '</b></div><div class="kv"><span>Termina</span><b>' + esc(fechaCorta(finReto(r))) + '</b></div><div class="kv"><span>Meta</span><b>' + (r.tope > 0 ? "Menos de " + money(r.tope) : "Sin gastar nada") + '</b></div><div class="kv"><span>Gastado en el reto</span><b>' + (tot === null ? "…" : money(tot)) + '</b></div></div>' +
        (fin ? '<button class="btn" data-a="retoNuevo">Crear otro reto</button>' : "") + '<button class="btn bad" data-a="retoQuitar">' + (fin ? "Quitar este reto" : "Abandonar el reto") + '</button><button class="btn sec2" data-a="cerrar">Cerrar</button>');
    },
    retoNuevo: function () { PREF.reto = null; S.reto = null; guardarPref(); hojaReto(); render(); },
    retoQuitar: function () { PREF.reto = null; S.reto = null; guardarPref(); cerrarHoja(); render(); },
    abrirRegistrar: function () { PREF.abrirRegistrar = !PREF.abrirRegistrar; guardarPref(); render(); },
    bioToggle: function () {
      if (PREF.bio) { PREF.bio = null; guardarPref(); toast("Face ID desactivado"); render(); return; }
      if (!PREF.lock) { toast("Primero activa el candado con código", "err"); return; }
      bioActivar().then(function () { toast("✅ Face ID activado", "ok"); render(); }).catch(function () { toast("No se pudo activar Face ID. Sigue usando tu código.", "err", 4500); });
    },
    bioEntrar: bioEntrar,
    conectar: conectar,
    demo: function () { cfg = { demo: true }; store("mg_cfg", cfg); S.estado = null; S.tab = "inicio"; cargarEstado(false); render(); }
  };
  document.addEventListener("click", function (e) {
    if (S.swiped && Date.now() - S.swiped < 400) { e.preventDefault(); return; }
    if (e.target.closest(".swr .fg.open")) { cerrarSwipes(null); e.preventDefault(); return; }
    var el = e.target.closest("[data-a]"); if (!el) return;
    var a = acciones[el.getAttribute("data-a")]; if (a) { e.preventDefault(); a(el.getAttribute("data-v")); }
  });
  document.addEventListener("change", function (e) { if (e.target.id === "rt-cat" && S.RT) S.RT.cat = e.target.value; });
  document.addEventListener("input", function (e) {
    if (e.target.id === "rt-tope" && S.RT) { S.RT.tope = e.target.value; return; }
    if (e.target.id !== "g-q") return;
    S.G.q = e.target.value; clearTimeout(S.tq);
    S.tq = setTimeout(function () { var pos = e.target.selectionStart; S.G.data = null; cargarGastos(); }, 350);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.id === "s-pin") conectar(); });

  /* ---------- deslizar una fila para editar o borrar ---------- */
  var SWW = 148, SW = null;
  function cerrarSwipes(salvo) {
    Array.prototype.forEach.call(document.querySelectorAll(".swr .fg.open"), function (f) { if (f !== salvo) { f.classList.remove("open"); f.style.transform = ""; } });
  }
  document.addEventListener("touchstart", function (e) {
    var fg = e.target.closest(".swr .fg");
    if (!fg) { cerrarSwipes(null); return; }
    cerrarSwipes(fg);
    var t0 = e.touches[0]; SW = { fg: fg, x: t0.clientX, y: t0.clientY, base: fg.classList.contains("open") ? -SWW : 0, mode: null, v: 0 };
  }, { passive: true });
  document.addEventListener("touchmove", function (e) {
    if (!SW) return;
    var t0 = e.touches[0], dx = t0.clientX - SW.x, dy = t0.clientY - SW.y;
    if (!SW.mode) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { SW.mode = "h"; SW.fg.parentNode.classList.add("drag"); }
      else if (Math.abs(dy) > 8) { SW = null; return; }
      else return;
    }
    e.preventDefault();
    SW.v = Math.max(-SWW - 24, Math.min(0, SW.base + dx)); SW.fg.style.transform = "translateX(" + SW.v + "px)";
  }, { passive: false });
  document.addEventListener("touchend", function () {
    if (!SW) return;
    if (SW.mode === "h") {
      var abre = SW.v < -SWW / 2;
      SW.fg.parentNode.classList.remove("drag"); SW.fg.classList.toggle("open", abre); SW.fg.style.transform = abre ? "translateX(-" + SWW + "px)" : "";
      S.swiped = Date.now();
    }
    SW = null;
  });

  /* ---------- arranque ---------- */
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) navigator.serviceWorker.register("sw.js").catch(function () {});
  var vis = Date.now(), oculta = 0;
  document.addEventListener("visibilitychange", function () {
    if (window.MGM) MGM.visibilidad(!document.hidden);
    if (document.hidden) { vozParar(); qrParar(); oculta = Date.now(); vis = Date.now(); S.ver.ahorro = false; S.ver.deuda = false; return; }
    if (PREF.lock && cfg && !cfg.demo && !S.locked && oculta && Date.now() - oculta >= PREF.lock.min * 60000) { S.locked = true; S.bioT = false; S.lockIn = ""; S.lockMsg = ""; render(); }
    if (cfg && oculta && Date.now() - oculta >= 10000) inicioNuevo();      // el iPhone deja la app donde quedó: al volver, empieza en Inicio
    if (cfg && !S.locked) { render(); enviarCola(false); if (Date.now() - vis > 60000) { vis = Date.now(); cargarEstado(true); if (S.tab === "gastos") cargarGastos(); } }
  });
  window.addEventListener("online", function () { enviarCola(false); cargarEstado(true); });
  if (cfg && !cfg.demo && PREF.lock) { S.locked = true; S.lockIn = ""; }
  if (PREF.abrirRegistrar) S.tab = "registrar";
  document.addEventListener("input", function (e) {                  // selector «Personalizar» de Ajustes
    if (e.target.id !== "c-a1" && e.target.id !== "c-a2") return;
    PREF.color = "custom"; PREF.colorCustom = { a1: $("#c-a1").value, a2: $("#c-a2").value }; guardarPref(); aplicarColor();
  });
  document.addEventListener("change", function (e) { if (e.target.id === "c-a1" || e.target.id === "c-a2") render(); });
  bioDetectar();
  S.anim = true;
  render();
  if (window.MGM) MGM.init({ pref: function () { return PREF; }, guardar: guardarPref, color: colorActual, mix: hexMix, toast: toast, etapa: dragonEtapa, logros: logrosGanados,
    estado: function () { var h = $("#sheet"); return { tab: S.tab, locked: !!S.locked, cfg: !!cfg, hoja: !!(h && !h.hidden) }; } });
  if (cfg && !S.locked) { cargarEstado(true); enviarCola(false); }
  splashMostrar(false);
  if (/^#demo/.test(location.hash)) {
    cfg = { demo: true }; S.locked = false; S.anim = true;
    var mt = /tab=(\w+)/.exec(location.hash), ms = /sub=(\w+)/.exec(location.hash);
    if (mt) S.tab = mt[1]; if (ms) S.sub = ms[1];
    render(); cargarEstado(false);
    if (S.tab === "gastos") cargarGastos(); if (S.sub === "fijos") cargarFijos(); if (S.sub === "informes") cargarInformes();
  }
})();
