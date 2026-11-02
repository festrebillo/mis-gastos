/* Mis Gastos · app web (PWA) · conecta con el script de Google del Seguimiento de Gastos.
   Sin librerías. Los datos viven en tu Excel; aquí solo se guardan el enlace del script, el PIN y la última vista. */
(function () {
  "use strict";
  var VERSION = "1.4";

  /* ---------- utilidades ---------- */
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var PREF = store("mg_pref") || {};
  PREF.tema = PREF.tema || "auto"; PREF.oculto = !!PREF.oculto;
  function guardarPref() { store("mg_pref", PREF); }
  var PUNTOS = "••••••";
  function money(n) { return "S/ " + (PREF.oculto ? PUNTOS : Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })); }
  function bigMoney(n) { return '<sm>S/</sm>' + (PREF.oculto ? PUNTOS : Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })); }
  function nf(n) { return PREF.oculto ? "••" : Number(n || 0).toLocaleString("en-US"); }
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function aplicarTema() {
    var oscuro = PREF.tema === "oscuro" || (PREF.tema === "auto" && mq && mq.matches);
    document.documentElement.setAttribute("data-t", oscuro ? "dark" : "light");
  }
  function aplicarPantalla() { document.documentElement.classList.toggle("dock", PREF.dock !== false); }
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
    cog: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/></svg>'
  };

  /* ---------- estado ---------- */
  var cfg = store("mg_cfg") || null;
  var S = {
    tab: "inicio", sub: null, estado: store("mg_estado"), cargando: false,
    F: nuevoForm(), G: { mes: mesClave(new Date()), q: "", cat: "", metodo: "", data: null, cargando: false },
    T: { cargando: false }, P: {}, FJ: { data: null, sel: {} }, IN: { mes: mesClave(new Date()), data: null }, lugares: []
  };
  function nuevoForm() { return { modo: "gasto", monto: "", lugar: "", cat: "", catAuto: true, metodo: "Saldo Disponible", detalle: "", desc: "", guardando: false }; }

  S.ver = { ahorro: false, deuda: false };            // los montos grandes arrancan ocultos cada vez que abres la app
  function visK(k) { return S.ver[k] === true && !PREF.oculto; }
  function mk(n, k) { return visK(k) ? money(n) : "S/ " + PUNTOS; }
  function bigK(n, k) { return '<sm>S/</sm>' + (visK(k) ? Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : PUNTOS); }
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
    if (PREF.oculto || reducido()) return;
    Array.prototype.forEach.call(document.querySelectorAll("[data-n]"), function (e) {
      var fin = parseFloat(e.getAttribute("data-n")); if (!isFinite(fin)) return;
      var t0 = performance.now(), dur = 850;
      (function f(t) { var k = Math.min(1, (t - t0) / dur), v = fin * (1 - Math.pow(1 - k, 3)); e.innerHTML = bigMoney(v); if (k < 1) requestAnimationFrame(f); })(t0);
    });
  }
  function skel(n) { var h = ""; for (var i = 0; i < (n || 3); i++) h += '<div class="sk" style="height:' + (i === 0 ? 132 : 104) + 'px"></div>'; return h; }
  function ocupado(txt) { $("#busy-t").textContent = txt || "Cargando…"; $("#busy").classList.add("on"); }
  function libre() { $("#busy").classList.remove("on"); }
  function celebrar() { var o = $("#okpop"); o.classList.remove("go"); void o.offsetWidth; o.classList.add("go"); }
  function limpiarNum(v) { v = String(v).replace(/[^0-9.,]/g, ""); var i = v.search(/[.,]/); return i > -1 ? v.slice(0, i + 1) + v.slice(i + 1).replace(/[.,]/g, "") : v; }
  function swr(inner, editA, fila, tipo) {
    return '<div class="swr"><div class="acts"><button class="ed" data-a="' + editA + '" data-v="' + fila + '">' + I.edit + 'Editar</button><button class="bo" data-a="borrarAsk" data-v="' + tipo + ':' + fila + '">' + I.trash + 'Borrar</button></div><div class="fg">' + inner + '</div></div>';
  }
  var refreshBtn = '<button class="ic" data-a="refrescar" aria-label="Actualizar">' + I.refresh + '</button>';
  function accionesHdr() {
    return '<div style="display:flex;gap:8px"><button class="ic" data-a="ojo" aria-label="Mostrar u ocultar montos">' + (PREF.oculto ? I.eyeoff : I.eye) + '</button>' + refreshBtn + '</div>';
  }

  function render() {
    var el = $("#app");
    var ae = document.activeElement, aeId = ae && ae.id === "g-q" ? ae.id : null, aeSel = aeId ? ae.selectionStart : 0;
    if (!cfg) { document.documentElement.setAttribute("data-s", "auth"); el.removeAttribute("data-skel"); el.innerHTML = vistaSetup(); return; }
    if (S.locked) { document.documentElement.setAttribute("data-s", "auth"); cerrarHoja(); el.removeAttribute("data-skel"); el.innerHTML = vistaLock(); return; }
    if (el.getAttribute("data-skel") !== "1") { el.innerHTML = '<div class="hdr" id="hdr"></div><main id="main"></main>' + tabsHtml(); el.setAttribute("data-skel", "1"); S.vk = null; }
    document.documentElement.setAttribute("data-s", "main");
    var h = "", m = "";
    var E = S.estado;
    if (S.tab === "inicio") { h = header(E ? E.mes + " " + E.anio : "Mis Gastos", "Hola, <b>" + esc(E ? E.nombre : "") + '</b>', accionesHdr()); m = vistaInicio(); }
    else if (S.tab === "registrar") { h = header("Nuevo registro", "Registrar"); m = vistaRegistrar(); }
    else if (S.tab === "gastos") { h = header("Historial", "Gastos", accionesHdr()); m = vistaGastos(); }
    else if (S.tab === "tarjeta") { h = header("Tarjeta de crédito", "Tarjeta y ahorro", accionesHdr()); m = vistaTarjeta(); }
    else { var tt2 = { presupuesto: "Presupuesto", fijos: "Gastos fijos", informes: "Informes", ajustes: "Ajustes" }[S.sub] || "Más"; h = header(S.sub ? "Más" : "Menú", tt2); m = vistaMas(); }
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
  }

  /* ---- Inicio ---- */
  function bannerCola() {
    var c = cola(), pend = c.filter(function (x) { return !x.error; }).length, err = c.length - pend;
    if (!c.length) return "";
    return '<div class="alert" style="flex-wrap:wrap">' +
      (pend ? '<span>⏳</span><span style="flex:1;text-align:left">' + pend + ' registro' + (pend > 1 ? "s" : "") + ' pendiente' + (pend > 1 ? "s" : "") + ' de enviar</span><button class="linkbtn" data-a="enviarCola">Enviar ahora</button>' : "") +
      (err ? '<button class="linkbtn" data-a="ir" data-v="ajustes" style="width:100%;text-align:left">⚠️ ' + err + ' no se pudo enviar · revisar</button>' : "") + '</div>';
  }
  function vistaInicio() {
    var E = S.estado;
    if (!E) return skel(3);
    var h = bannerCola() + (S.offline ? '<div class="hint" style="text-align:center">📴 Sin conexión · mostrando tus últimos datos guardados</div>' : ""), pill;
    if (E.banco === null) pill = '<span class="pill w">Escribe el saldo de tu banco en «Tarjeta» para comprobar</span>';
    else if (Math.abs(E.diferencia) < 0.005) pill = '<span class="pill">✔ Cuadra con tu banco</span>';
    else pill = '<span class="pill w">⚠ Difiere ' + money(Math.abs(E.diferencia)) + ' con tu banco</span>';
    h += '<div class="card"><div class="rowh"><span class="lbl">Ahorro disponible hoy</span>' + ojoK("ahorro") + '</div><div class="big"' + (visK("ahorro") ? ' data-n="' + E.ahorro + '"' : "") + '>' + bigK(E.ahorro, "ahorro") + '</div>' + pill +
      (E.reserva > 0 ? '<div class="kv" style="margin-top:8px"><span>🔒 Reservado para fijos</span><b>' + mk(E.reserva, "ahorro") + '</b></div>' : "") + '</div>';
    var t = E.tarjeta;
    if (t) {
      h += '<div class="cc"><div class="rowh"><span class="lbl">Deuda de la tarjeta</span>' + ojoK("deuda", true) + '</div><div class="big"' + (visK("deuda") ? ' data-n="' + t.deuda + '"' : "") + '>' + bigK(t.deuda, "deuda") + '</div>' +
        '<div class="two"><div>A pagar antes del ' + esc(t.limite ? fechaCorta(t.limite).slice(0, 5) : "—") + '<b>' + mk(t.pendiente, "deuda") + '</b></div>' +
        '<div>Quedan<b class="w">' + (t.diasLimite === null ? "—" : t.diasLimite + " días") + '</b></div></div></div>';
    }
    var pc = E.ingresos > 0 ? Math.min(100, Math.round(E.gastos / E.ingresos * 100)) : 0;
    h += '<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="lbl">Gastado este mes</span><span class="hint">de ingresos ' + money(E.ingresos) + '</span></div>' +
      '<div class="med">' + money(E.gastos) + '</div><div class="bar' + (E.gastos > E.ingresos ? ' b' : '') + '"><i ' + wi(pc) + '></i></div>' +
      '<div class="hint" style="margin-top:6px">💵 Saldo ' + money(E.gastosSaldo) + ' · 💳 Tarjeta ' + money(E.gastosTarjeta) + '</div></div>';
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
    h += '<div class="amt"><span>S/</span><input id="f-monto" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" enterkeyhint="done" autocomplete="off" placeholder="0.00" value="' + esc(F.monto) + '" aria-label="Monto"></div>';
    if (F.modo === "gasto") {
      h += '<div><label class="l">Lugar</label><button class="catline" data-a="elegirLugar"><span>' + (F.lugar ? "📍 " + esc(F.lugar) : '<span style="color:var(--mut)">Toca para elegir el lugar</span>') + '</span><em>' + (F.lugar ? "Cambiar" : "Elegir") + '</em></button></div>';
      h += '<div><label class="l">Categoría</label><button class="catline" id="f-cat" data-a="elegirCat">' + catTxt() + '<em>' + (F.catAuto && F.cat ? "Sugerida · Cambiar" : "Cambiar") + '</em></button></div>';
      h += '<div><label class="l">Pagado con</label><div class="mset"><button class="' + (F.metodo === "Saldo Disponible" ? "on" : "") + '" data-a="metodo" data-v="Saldo Disponible">💵 Saldo Disponible</button><button class="' + (F.metodo === "Tarjeta de Crédito" ? "on" : "") + '" data-a="metodo" data-v="Tarjeta de Crédito">💳 Tarjeta</button></div></div>';
      h += '<div><label class="l" for="f-det">Detalle (opcional)</label><input class="field" id="f-det" autocomplete="off" placeholder="Almuerzo, regalo…" value="' + esc(F.detalle) + '"></div>';
    } else {
      h += '<div><label class="l" for="f-desc">Descripción</label><input class="field" id="f-desc" autocomplete="off" placeholder="Ej.: Primera Quincena" value="' + esc(F.desc) + '"><div class="chips">' +
        ["Primera Quincena", "Segunda Quincena", "Ingreso Extra"].map(function (x) { return '<button class="chip' + (F.desc === x ? " sel" : "") + '" data-a="desc" data-v="' + x + '">' + x + '</button>'; }).join("") + '</div></div>';
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
    var m = $("#f-monto"), l = $("#f-lugar"), d = $("#f-det"), ds = $("#f-desc");
    if (m) m.addEventListener("input", function () { var v = limpiarNum(m.value); if (v !== m.value) m.value = v; S.F.monto = v; });
    if (d) d.addEventListener("input", function () { S.F.detalle = d.value; });
    if (ds) ds.addEventListener("input", function () { S.F.desc = ds.value; });
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
    } else body = { tipo: "ingreso", descripcion: F.desc.trim() || "Ingreso Extra", monto: monto };
    body.idr = nuevoId(); body.fecha = fechaLocal(new Date());     // id único (evita duplicados al reenviar) y hora real del registro
    F.guardando = true; render();
    call(body).then(function (j) {
      if (j.status === "error") throw new Error(j.mensaje);
      var modo = F.modo; S.F = nuevoForm(); S.F.modo = modo; S.G.data = null; S.T.cargado = false;
      toast(j.mensaje || "✅ Guardado", "ok", 4800); celebrar(); cargarEstado(true); render(); enviarCola(false);
    }).catch(function (e) {
      F.guardando = false;
      if (esRed(e)) {
        encolar(body, (F.modo === "gasto" ? body.tienda : body.descripcion) + " · " + money(body.monto));
        var modo2 = F.modo; S.F = nuevoForm(); S.F.modo = modo2; render();
        toast("📴 Sin conexión: guardado en el teléfono. Se enviará solo cuando vuelva internet.", "ok", 5600); return;
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
      h += swr('<button class="it" data-a="verGasto" data-v="' + g.fila + '"><span class="ico">' + g.emoji + '</span><span class="t"><b>' + esc(g.lugar) + '</b><small>' + esc(g.categoria) + (g.detalle && !g.fijo ? " · " + esc(g.detalle) : "") + '</small></span>' +
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
    abrirHoja('<div class="grab"></div><h3>' + g.emoji + ' ' + esc(g.lugar) + '</h3><div class="card"><div class="kv"><span>Monto</span><b>' + money(g.monto) + '</b></div><div class="kv"><span>Categoría</span><b>' + esc(g.categoria) + '</b></div><div class="kv"><span>Pagado con</span><b>' + (g.metodo === "Tarjeta de Crédito" ? "💳 Tarjeta de Crédito" : "💵 Saldo Disponible") + '</b></div><div class="kv"><span>Fecha</span><b>' + fechaCorta(g.fecha) + '</b></div>' + (g.detalle ? '<div class="kv"><span>Detalle</span><b>' + esc(g.detalle) + '</b></div>' : "") + '</div>' +
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
      '<div><label class="l">Detalle</label><input class="field" id="e-det" value="' + esc(g.detalle) + '"></div>' +
      '<button class="btn" data-a="guardarGasto" data-v="' + g.fila + '">Guardar cambios</button><button class="btn sec2" data-a="cerrar">Cancelar</button>');
  }
  function guardarGasto(fila) {
    var g = S.G.data.gastos.filter(function (x) { return x.fila === fila; })[0];
    app("editar", { hoja: "gasto", fila: fila, firma: { monto: g.monto, texto: g.lugar },
      nuevo: { lugar: $("#e-lugar").value, monto: $("#e-monto").value.replace(",", "."), fecha: $("#e-fecha").value, categoria: $("#e-cat").value, metodo: $("#e-met").value, detalle: $("#e-det").value } })
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
    h += '<div class="sec"><span>Conciliación con el banco</span></div><div class="card"><div class="rowh"><span class="lbl">Tu ahorro</span>' + ojoK("ahorro") + '</div><div class="kv"><span>Ahorro calculado</span><b>' + mk(E.ahorro, "ahorro") + '</b></div><div class="kv"><span>Saldo real del banco</span><b>' + (E.banco === null ? "—" : mk(E.banco, "ahorro")) + '</b></div>' +
      (E.diferencia !== null ? '<div class="kv"><span>Diferencia</span><b style="color:' + (Math.abs(E.diferencia) < 0.005 ? 'var(--ok)' : 'var(--bad)') + '">' + (Math.abs(E.diferencia) < 0.005 ? "✔ Cuadra" : mk(E.diferencia, "ahorro")) + '</b></div>' : "") +
      '<button class="btn sec2" style="margin-top:8px" data-a="hojaBanco">Escribir saldo del banco</button></div>';
    if (E.ahorroMeses && E.ahorroMeses.length) {
      var max = Math.max.apply(null, E.ahorroMeses.map(function (x) { return Math.abs(x.neto); }).concat([1]));
      h += '<div class="sec"><span>Ahorro mes a mes</span></div><div class="card"><div class="mini">' + E.ahorroMeses.map(function (x, i) {
        var ult = i === E.ahorroMeses.length - 1, hh = Math.max(3, Math.round(Math.abs(x.neto) / max * 70));
        return '<div><b>' + (x.neto >= 0 ? "+" : "−") + nf(Math.abs(Math.round(x.neto))) + '</b><i class="' + (x.neto < 0 ? "neg" : ult ? "cur" : "") + '" style="height:' + hh + 'px"></i>' + esc(x.mes) + (ult ? "*" : "") + '</div>';
      }).join("") + '</div><p class="hint" style="margin-top:6px">Lo que sumaste a tu ahorro (ingresos − gastos con Saldo Disponible). * mes en curso</p></div>';
    }
    if (E.metas && E.metas.length) {
      h += '<div class="sec"><span>Metas · con ' + money(E.ahorro) + ' disponibles</span></div><div class="card">' + E.metas.map(function (m) {
        return '<div class="goal"><div class="h"><b>' + esc(m.nombre) + '</b><span>' + (m.lograda ? "✔ lograda" : m.avance + "% de " + nf(m.objetivo)) + '</span></div><div class="bar g"><i ' + wi(Math.min(100, m.avance)) + '></i></div>' + (m.lograda ? "" : '<div class="hint" style="margin-top:3px">Faltan ' + money(m.falta) + '</div>') + '</div>';
      }).join("") + '</div>';
    }
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
    if (S.sub === "ajustes") return sub(vistaAjustes());
    function it(id, ico, t, d) { return '<button class="it" data-a="ir" data-v="' + id + '"><span class="ico">' + I[ico] + '</span><span class="t"><b>' + t + '</b><small>' + d + '</small></span><span class="chev">›</span></button>'; }
    return '<div class="card menu" style="padding:4px 15px">' + it("presupuesto", "bud", "Presupuesto", "Topes por categoría y avance del mes") + it("fijos", "fix", "Gastos fijos", "Qué falta pagar este mes") + it("informes", "rep", "Informes", "Categorías, meses y los gastos más grandes") + it("ajustes", "cog", "Ajustes", "PIN, conexión e instalación") + '</div>';
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
  function vistaInformes() {
    var D = S.IN.data, h = '<div class="mes"><button data-a="mesI" data-v="-1">‹</button><b>' + mesNombre(S.IN.mes) + '</b><button data-a="mesI" data-v="1">›</button></div>';
    if (!D) return h + skel(3);
    var dif = D.gastos - D.mesAnteriorGastos;
    h += '<div class="card"><div class="kv"><span>Ingresos</span><b>' + money(D.ingresos) + '</b></div><div class="kv"><span>Gastos</span><b>' + money(D.gastos) + '</b></div><div class="kv"><span>Vs. mes anterior</span><b style="color:' + (dif > 0 ? 'var(--bad)' : 'var(--ok)') + '">' + (dif > 0 ? "▲ " : "▼ ") + money(Math.abs(dif)) + '</b></div><div class="kv"><span>Promedio por día</span><b>' + money(D.promedioDiario) + '</b></div></div>';
    if (D.categorias.length) {
      var tot = D.categorias.reduce(function (s, c) { return s + c.monto; }, 0) || 1;
      h += donutCard(D) + '<div class="sec"><span>Detalle por categoría</span></div><div class="card">' + D.categorias.filter(function (c) { return c.monto > 0; }).map(function (c) {
        var p = Math.round(c.monto / tot * 100);
        return '<div style="padding:6px 0"><div style="display:flex;justify-content:space-between;font-size:14px;gap:8px"><b style="font-weight:600">' + c.emoji + ' ' + esc(c.categoria) + '</b><span style="color:var(--mut);font-variant-numeric:tabular-nums">' + money(c.monto) + ' · ' + p + '%</span></div><div class="bar g"><i ' + wi(p) + '></i></div>' +
          (c.mesAnterior > 0 ? '<div class="hint" style="margin-top:3px">Mes anterior: ' + money(c.mesAnterior) + '</div>' : "") + '</div>';
      }).join("") + '</div>';
    }
    var mx = Math.max.apply(null, D.meses.map(function (m) { return Math.max(m.ingresos, m.gastos); }).concat([1]));
    h += '<div class="sec"><span>El año · ingresos y gastos</span></div><div class="card"><div class="mini" style="height:130px;gap:6px">' + D.meses.map(function (m) {
      return '<div style="font-size:10px"><span style="display:flex;gap:2px;align-items:flex-end;justify-content:center;height:100px"><i style="width:9px;margin:0;height:' + Math.max(2, Math.round(m.ingresos / mx * 98)) + 'px;background:var(--steel2)"></i><i style="width:9px;margin:0;height:' + Math.max(2, Math.round(m.gastos / mx * 98)) + 'px;background:var(--navy)"></i></span>' + m.mes.slice(0, 1) + '</div>';
    }).join("") + '</div><p class="hint" style="margin-top:6px"><span style="color:var(--steel2)">■</span> Ingresos &nbsp; <span style="color:var(--navy)">■</span> Gastos</p></div>';
    if (D.top5.length) h += '<div class="sec"><span>Los 5 gastos más grandes</span></div><div class="card" style="padding:4px 15px">' + D.top5.map(function (x, i) { return '<div class="it"><span class="ico">' + (i + 1) + '</span><span class="t"><b>' + esc(x.lugar) + '</b><small>' + esc(x.categoria) + ' · ' + fechaCorta(x.fecha) + '</small></span><span class="m">' + money(x.monto) + '</span></div>'; }).join("") + '</div>';
    h += '<div class="sec"><span>Regla 50 / 30 / 20</span></div><div class="card"><div class="kv"><span>Necesidades (meta 50%)</span><b>' + D.necesidades + '%</b></div><div class="kv"><span>Gustos (meta 30%)</span><b>' + D.gustos + '%</b></div><div class="kv"><span>Ahorro (meta 20%)</span><b>' + D.ahorro + '%</b></div></div>';
    return h;
  }
  var PAL = ["#1F3FA8", "#3B82F6", "#8DB8FF", "#0E9F9A", "#F2A93B", "#E5484D", "#8B6CF0", "#64748B"];
  function donutCard(D) {
    var arr = D.categorias.filter(function (c) { return c.monto > 0; });
    var tot = arr.reduce(function (s, c) { return s + c.monto; }, 0);
    if (tot <= 0) return "";
    var top = arr.slice(0, 7), resto = tot - top.reduce(function (s, c) { return s + c.monto; }, 0);
    if (resto > 0.5) top.push({ categoria: "Otras", emoji: "•", monto: resto });
    var C = 2 * Math.PI * 52, off = 0, segs = "", leg = "";
    top.forEach(function (c, i) {
      var len = c.monto / tot * C, col = PAL[i % PAL.length];
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
    h += '<div class="card"><div class="lbl">Barra inferior</div><div class="seg" style="margin-top:8px">' +
      [[false, "Flotante"], [true, "Pegada abajo"]].map(function (o) { return '<button class="' + ((PREF.dock !== false) === o[0] ? "on" : "") + '" data-a="dock" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join("") +
      '</div><p class="hint" style="margin-top:6px">Si ves una franja vacía bajo la barra, prueba «Pegada abajo».</p></div>';
    h += '<div class="card"><div class="lbl">Privacidad y seguridad</div>' +
      '<button class="cb' + (PREF.oculto ? " on" : "") + '" data-a="ojo" style="margin-top:4px"><span class="box">' + (PREF.oculto ? "✓" : "") + '</span><span style="flex:1">Ocultar los montos (también con el ojo del encabezado)</span></button>' +
      (PREF.lock && !cfg.demo ?
        '<div class="kv"><span>🔒 Candado activado</span><b>' + PREF.lock.len + ' dígitos</b></div><label class="l" style="margin-top:8px">Pedir el código</label><div class="mset">' +
        [[0, "Siempre"], [1, "Tras 1 min"], [5, "Tras 5 min"]].map(function (o) { return '<button class="' + (PREF.lock.min === o[0] ? "on" : "") + '" data-a="lockMin" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join("") +
        '</div><div class="row2" style="margin-top:10px"><button class="btn sec2" data-a="hojaLock">Cambiar código</button><button class="btn sec2" data-a="lockOff">Quitar candado</button></div>' :
        '<button class="btn sec2" style="margin-top:8px" data-a="hojaLock">🔒 Activar candado con código</button><p class="hint" style="margin-top:6px">Un código corto que se pide al abrir la app. Solo vale en este teléfono.</p>') + '</div>';
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
      '<button class="linkbtn lk-forgot" data-a="olvideLock">Olvidé mi código</button></div>';
  }

  /* ---- Acceso ---- */
  function vistaSetup() {
    var pre = ""; try { var m = /[#&]u=([^&]+)/.exec(location.hash); if (m) pre = decodeURIComponent(m[1]); } catch (e) {}
    return '<div class="setup"><h1>Mis <b>Gastos</b></h1><p>Conecta la app con tu Excel. Solo se hace una vez en este teléfono.</p>' +
      (S.setupMsg ? '<div class="err">' + esc(S.setupMsg) + '</div>' : "") +
      '<div><label class="l" for="s-url">Enlace de tu script de Google</label><input class="field" id="s-url" autocomplete="off" autocapitalize="off" placeholder="https://script.google.com/macros/s/…/exec" value="' + esc(pre || (cfg && cfg.url) || "") + '"></div>' +
      '<div><label class="l" for="s-pin">PIN</label><input class="field" id="s-pin" type="password" autocomplete="off" placeholder="El que definiste en tu Excel"></div>' +
      '<button class="btn" data-a="conectar">Conectar</button><button class="btn sec2" style="background:transparent;color:#fff;border-color:#4A6A96" data-a="demo">Ver demostración</button>' +
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
  function cerrarHoja() { var w = $("#sheet"); w.hidden = true; w.innerHTML = ""; }
  $("#sheet").addEventListener("click", function (e) { if (e.target === this) cerrarHoja(); });

  /* ---------- datos ---------- */
  function cargarEstado(silencioso) {
    if (!cfg) return;
    if (!silencioso && !S.estado) render();
    app("estado").then(function (j) { if (!S.estado) S.anim = true; S.estado = j; S.offline = false; store("mg_estado", j); if (S.tab !== "registrar" || !silencioso) render(); })
      .catch(function (e) { if (esRed(e)) { S.offline = true; if (S.tab === "inicio") render(); } else fail(e); });
  }
  function refrescarTodo() { S.G.data = null; cargarEstado(true); if (S.tab === "gastos") { render(); cargarGastos(); } }
  function cargarFijos() { app("fijos").then(function (j) { if (!S.FJ.data) S.anim = true; S.FJ.data = j; S.FJ.sel = {}; if (S.sub === "fijos" || (S.tab === "registrar" && S.F.modo === "fijos")) render(); }).catch(fail); }
  function cargarInformes() { S.IN.data = null; app("informes", { mes: S.IN.mes }).then(function (j) { S.anim = true; S.IN.data = j; if (S.sub === "informes") render(); }).catch(fail); }

  /* ---------- acciones ---------- */
  var acciones = {
    tab: function (v) { if (S.tab !== v || S.sub) S.anim = true; S.tab = v; S.sub = null; if (v === "gastos" && !S.G.data) S.G.animar = true; render(); if (v === "gastos" && !S.G.data) cargarGastos(); if (v === "gastos" || v === "tarjeta" || v === "inicio") cargarEstado(true); if (v === "registrar") { var l = $("#f-lugar"); if (l && S.F.modo === "gasto") pintarSugerencias(!S.F.lugar.trim()); var m0 = $("#f-monto"); if (m0) m0.focus(); } },
    refrescar: function () { toast("Actualizando…"); if (S.tab === "gastos") cargarGastos(); cargarEstado(true); },
    ir: function (v) {
      S.anim = true;
      if (v === "fijos") { S.tab = "mas"; S.sub = "fijos"; render(); cargarFijos(); }
      else if (v === "informes") { S.tab = "mas"; S.sub = "informes"; render(); cargarInformes(); }
      else if (v === "presupuesto" || v === "ajustes") { S.tab = "mas"; S.sub = v; render(); if (v === "presupuesto") cargarEstado(true); }
      else { S.tab = "mas"; S.sub = null; render(); }
    },
    modo: function (v) { S.F.modo = v; render(); if (v === "fijos") cargarFijos(); else { var m1 = $("#f-monto"); if (m1) m1.focus(); } },
    metodo: function (v) { S.F.metodo = v; render(); },
    desc: function (v) { S.F.desc = v; render(); },
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
    mesI: function (v) { S.IN.mes = mesMover(S.IN.mes, +v); render(); cargarInformes(); },
    cambiarPin: function () { cfg = { url: cfg.url, pin: "" }; store("mg_cfg", null); S.setupMsg = "Escribe el PIN nuevo."; render(); },
    salir: function () { cfg = null; S.estado = null; S.G.data = null; store("mg_cfg", null); store("mg_estado", null); S.setupMsg = ""; S.tab = "inicio"; S.sub = null; render(); },
    dock: function (v) { PREF.dock = (v === "true"); guardarPref(); aplicarPantalla(); render(); },
    ver: function (k) {
      if (PREF.oculto) { toast("Los montos están ocultos con el ojo de arriba"); return; }
      S.ver[k] = !S.ver[k]; render(); if (visK(k)) contarNumeros();
    },
    ojo: function () { PREF.oculto = !PREF.oculto; guardarPref(); render(); },
    tema: function (v) { PREF.tema = v; guardarPref(); aplicarTema(); render(); },
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
          if (h === PREF.lock.h) { S.locked = false; S.lockIn = ""; S.lockFallos = 0; S.lockMsg = ""; render(); enviarCola(false); cargarEstado(true); return; }
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
    conectar: conectar,
    demo: function () { cfg = { demo: true }; store("mg_cfg", cfg); S.estado = null; S.tab = "inicio"; cargarEstado(false); render(); }
  };
  document.addEventListener("click", function (e) {
    if (S.swiped && Date.now() - S.swiped < 400) { e.preventDefault(); return; }
    if (e.target.closest(".swr .fg.open")) { cerrarSwipes(null); e.preventDefault(); return; }
    var el = e.target.closest("[data-a]"); if (!el) return;
    var a = acciones[el.getAttribute("data-a")]; if (a) { e.preventDefault(); a(el.getAttribute("data-v")); }
  });
  document.addEventListener("input", function (e) {
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
    if (document.hidden) { oculta = Date.now(); vis = Date.now(); return; }
    if (PREF.lock && cfg && !cfg.demo && !S.locked && oculta && Date.now() - oculta >= PREF.lock.min * 60000) { S.locked = true; S.lockIn = ""; S.lockMsg = ""; render(); }
    if (cfg && !S.locked) { enviarCola(false); if (Date.now() - vis > 60000) { vis = Date.now(); cargarEstado(true); if (S.tab === "gastos") cargarGastos(); } }
  });
  window.addEventListener("online", function () { enviarCola(false); cargarEstado(true); });
  if (cfg && !cfg.demo && PREF.lock) { S.locked = true; S.lockIn = ""; }
  S.anim = true;
  render();
  if (cfg && !S.locked) { cargarEstado(true); enviarCola(false); }
  (function () {
    var s = $("#splash"); if (!s) return;
    setTimeout(function () { s.classList.add("out"); setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 650); }, reducido() ? 250 : 1250);
  })();
  if (/^#demo/.test(location.hash)) {
    cfg = { demo: true }; S.locked = false; S.anim = true;
    var mt = /tab=(\w+)/.exec(location.hash), ms = /sub=(\w+)/.exec(location.hash);
    if (mt) S.tab = mt[1]; if (ms) S.sub = ms[1];
    render(); cargarEstado(false);
    if (S.tab === "gastos") cargarGastos(); if (S.sub === "fijos") cargarFijos(); if (S.sub === "informes") cargarInformes();
  }
})();
