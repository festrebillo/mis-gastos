/* Mis Gastos · app web (PWA) · conecta con el script de Google del Seguimiento de Gastos.
   Sin librerías. Los datos viven en tu Excel; aquí solo se guardan el enlace del script, el PIN y la última vista. */
(function () {
  "use strict";
  var VERSION = "1.0";

  /* ---------- utilidades ---------- */
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(n) { return "S/ " + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function bigMoney(n) { return '<sm>S/</sm>' + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
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

  /* ---------- conexión ---------- */
  function call(body) {
    if (cfg && cfg.demo) return window.MG_DEMO(body);
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
    toast(e && e.message && e.message.indexOf("Failed to fetch") < 0 ? e.message : "Sin conexión. Inténtalo de nuevo.", "err");
  }
  var tt;
  function toast(msg, tipo, ms) {
    var t = $("#toast"); t.textContent = msg; t.className = "show " + (tipo || ""); clearTimeout(tt);
    tt = setTimeout(function () { t.className = ""; }, ms || 3200);
  }

  /* ---------- pantallas ---------- */
  function header(peq, tit, accion) {
    return '<div class="hdr"><div><small>' + esc(peq) + '</small><h1>' + tit + '</h1></div>' + (accion || "") + '</div>';
  }
  function tabs() {
    var t = S.tab;
    function b(id, ico, txt) { return '<button class="tab' + (t === id ? " on" : "") + '" data-a="tab" data-v="' + id + '">' + I[ico] + txt + '</button>'; }
    return '<nav class="tabs">' + b("inicio", "home", "Inicio") + b("gastos", "list", "Gastos") +
      '<button class="tab plus" data-a="tab" data-v="registrar"><span class="c">' + I.plus + '</span>Registrar</button>' +
      b("tarjeta", "card", "Tarjeta") + b("mas", "dots", "Más") + '</nav>';
  }
  var refreshBtn = '<button class="ic" data-a="refrescar" aria-label="Actualizar">' + I.refresh + '</button>';

  function render() {
    var el = $("#app");
    var ae = document.activeElement, aeId = ae && ae.id === "g-q" ? ae.id : null, aeSel = aeId ? ae.selectionStart : 0;
    if (!cfg) { el.innerHTML = vistaSetup(); return; }
    var h = "", m = "";
    var E = S.estado;
    if (S.tab === "inicio") { h = header("Mis Gastos", "Hola, " + esc(E ? E.nombre : "") + ' · <b>' + esc(E ? E.mes : "") + '</b>', refreshBtn); m = vistaInicio(); }
    else if (S.tab === "registrar") { h = header("Nuevo registro", "Registrar"); m = vistaRegistrar(); }
    else if (S.tab === "gastos") { h = header("Historial", "Gastos", refreshBtn); m = vistaGastos(); }
    else if (S.tab === "tarjeta") { h = header("Tarjeta de crédito", "Tarjeta y ahorro", refreshBtn); m = vistaTarjeta(); }
    else { var tt2 = { presupuesto: "Presupuesto", fijos: "Gastos fijos", informes: "Informes", ajustes: "Ajustes" }[S.sub] || "Más"; h = header(S.sub ? "Más" : "Menú", tt2); m = vistaMas(); }
    el.innerHTML = h + '<main id="main">' + m + '</main>' + tabs();
    if (S.tab === "registrar") enlazarRegistrar();
    if (aeId && $("#" + aeId)) { var n = $("#" + aeId); n.focus(); try { n.setSelectionRange(aeSel, aeSel); } catch (x) {} }
  }

  /* ---- Inicio ---- */
  function vistaInicio() {
    var E = S.estado;
    if (!E) return '<div class="empty"><span class="spin" style="border-color:#2A5DA8;border-right-color:transparent"></span><p style="margin-top:10px">Cargando tus datos…</p></div>';
    var h = "", pill;
    if (E.banco === null) pill = '<span class="pill w">Escribe el saldo de tu banco en «Tarjeta» para comprobar</span>';
    else if (Math.abs(E.diferencia) < 0.005) pill = '<span class="pill">✔ Cuadra con tu banco</span>';
    else pill = '<span class="pill w">⚠ Difiere ' + money(Math.abs(E.diferencia)) + ' con tu banco</span>';
    h += '<div class="card"><div class="lbl">Ahorro disponible hoy</div><div class="big">' + bigMoney(E.ahorro) + '</div>' + pill +
      (E.reserva > 0 ? '<div class="kv" style="margin-top:8px"><span>🔒 Reservado para fijos</span><b>' + money(E.reserva) + '</b></div>' : "") + '</div>';
    var t = E.tarjeta;
    if (t) {
      h += '<div class="cc"><div class="lbl">Deuda de la tarjeta</div><div class="big">' + bigMoney(t.deuda) + '</div>' +
        '<div class="two"><div>A pagar antes del ' + esc(t.limite ? fechaCorta(t.limite).slice(0, 5) : "—") + '<b>' + money(t.pendiente) + '</b></div>' +
        '<div>Quedan<b class="w">' + (t.diasLimite === null ? "—" : t.diasLimite + " días") + '</b></div></div></div>';
    }
    var pc = E.ingresos > 0 ? Math.min(100, Math.round(E.gastos / E.ingresos * 100)) : 0;
    h += '<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="lbl">Gastado este mes</span><span class="hint">de ingresos ' + money(E.ingresos) + '</span></div>' +
      '<div class="med">' + money(E.gastos) + '</div><div class="bar' + (E.gastos > E.ingresos ? ' b' : '') + '"><i style="width:' + pc + '%"></i></div>' +
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
      (p.tope ? '<div class="bar ' + c + '"><i style="width:' + pct + '%"></i></div><div class="hint" style="margin-top:4px">' + textoEstado(p.pct) + (p.referencia ? " (promedio de meses anteriores)" : "") + '</div>' : '<div class="hint" style="margin-top:2px">Sin tope · toca para fijar uno</div>');
    return editable ? '<button class="it" style="display:block" data-a="topeEditar" data-v="' + esc(p.categoria) + '">' + inner + '</button>' : '<div style="padding:7px 0">' + inner + '</div>';
  }

  /* ---- Registrar ---- */
  function vistaRegistrar() {
    var F = S.F, E = S.estado, h = "";
    h += '<div class="seg" role="tablist"><button class="' + (F.modo === "gasto" ? "on" : "") + '" data-a="modo" data-v="gasto">Gasto</button><button class="' + (F.modo === "ingreso" ? "on" : "") + '" data-a="modo" data-v="ingreso">Ingreso</button></div>';
    h += '<div class="amt"><span>S/</span><input id="f-monto" inputmode="decimal" autocomplete="off" placeholder="0.00" value="' + esc(F.monto) + '" aria-label="Monto"></div>';
    if (F.modo === "gasto") {
      h += '<div><label class="l" for="f-lugar">Lugar</label><input class="field" id="f-lugar" autocomplete="off" autocapitalize="words" placeholder="¿Dónde gastaste?" value="' + esc(F.lugar) + '"><div class="chips" id="f-sug"></div></div>';
      h += '<div><label class="l">Categoría</label><button class="catline" id="f-cat" data-a="elegirCat" style="width:100%">' + catTxt() + '<em>' + (F.catAuto && F.cat ? "Sugerida · Cambiar" : "Cambiar") + '</em></button></div>';
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
    if (m) m.addEventListener("input", function () { S.F.monto = m.value; });
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
    F.guardando = true; render();
    call(body).then(function (j) {
      if (j.status === "error") throw new Error(j.mensaje);
      var modo = F.modo; S.F = nuevoForm(); S.F.modo = modo; S.G.data = null; S.T.cargado = false;
      toast(j.mensaje || "✅ Guardado", "ok", 4800); cargarEstado(true); render();
    }).catch(function (e) { F.guardando = false; render(); fail(e); });
  }
  function hojaCategorias() {
    var cats = (S.estado && S.estado.categoriasActivas) || [];
    abrirHoja('<div class="grab"></div><h3>Categoría</h3><div class="stack">' + cats.map(function (c) {
      return '<button class="it" data-a="cat" data-v="' + esc(c.nombre) + '"><span class="ico">' + c.emoji + '</span><span class="t"><b>' + esc(c.nombre) + '</b></span>' + (S.F.cat === c.nombre ? "✔" : "") + '</button>';
    }).join("") + '</div>');
  }

  /* ---- Gastos ---- */
  function vistaGastos() {
    var G = S.G, h = "";
    h += '<div class="mes"><button data-a="mesG" data-v="-1" aria-label="Mes anterior">‹</button><b>' + mesNombre(G.mes) + '</b><button data-a="mesG" data-v="1" aria-label="Mes siguiente">›</button></div>';
    h += '<div class="search">' + I.search + '<input id="g-q" placeholder="Buscar lugar o detalle" value="' + esc(G.q) + '" autocomplete="off"></div>';
    h += '<div class="filt"><button class="' + (!G.metodo ? "on" : "") + '" data-a="metG" data-v="">Todos</button><button class="' + (G.metodo === "Saldo Disponible" ? "on" : "") + '" data-a="metG" data-v="Saldo Disponible">💵 Saldo</button><button class="' + (G.metodo === "Tarjeta de Crédito" ? "on" : "") + '" data-a="metG" data-v="Tarjeta de Crédito">💳 Tarjeta</button><button class="' + (G.cat ? "on" : "") + '" data-a="catG">' + (G.cat ? esc(G.cat) : "Categoría ▾") + '</button></div>';
    var D = G.data;
    if (!D) return h + '<div class="empty"><span class="spin" style="border-color:#2A5DA8;border-right-color:transparent"></span></div>';
    h += '<div class="card" style="padding:10px 15px"><div class="kv"><span>Total del mes</span><b>' + money(D.total) + '</b></div><div class="kv"><span>💵 Saldo · 💳 Tarjeta</span><b>' + money(D.totalSaldo) + ' · ' + money(D.totalTarjeta) + '</b></div></div>';
    if (!D.gastos.length) h += '<div class="empty">No hay gastos con esos filtros.</div>';
    var dia = "", abierto = false;
    D.gastos.forEach(function (g) {
      var k = g.fecha.slice(0, 10);
      if (k !== dia) {
        if (abierto) h += '</div>'; dia = k;
        var tot = D.gastos.filter(function (x) { return x.fecha.slice(0, 10) === k; }).reduce(function (s, x) { return s + x.monto; }, 0);
        h += '<div class="day"><span>' + etiquetaDia(k) + '</span><span>' + money(tot) + '</span></div><div class="card" style="padding:4px 15px">'; abierto = true;
      }
      h += '<button class="it" data-a="verGasto" data-v="' + g.fila + '"><span class="ico">' + g.emoji + '</span><span class="t"><b>' + esc(g.lugar) + '</b><small>' + esc(g.categoria) + (g.detalle && !g.fijo ? " · " + esc(g.detalle) : "") + '</small></span>' +
        '<span class="m">' + money(g.monto) + '<small class="' + (g.metodo === "Tarjeta de Crédito" ? "tc" : "") + '">' + (g.metodo === "Tarjeta de Crédito" ? "💳 Tarjeta" : "Saldo") + '</small></span></button>';
    });
    if (abierto) h += '</div>';
    if (D.ingresos && D.ingresos.length) {
      h += '<div class="sec"><span>Ingresos del mes</span><span>' + money(D.totalIngresos) + '</span></div><div class="card" style="padding:4px 15px">';
      D.ingresos.forEach(function (x) {
        h += '<button class="it" data-a="verIngreso" data-v="' + x.fila + '"><span class="ico">💰</span><span class="t"><b>' + esc(x.descripcion) + '</b><small>' + fechaCorta(x.fecha) + '</small></span><span class="m" style="color:var(--ok)">+' + money(x.monto) + '</span></button>';
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
    app("gastos", { mes: G.mes, q: G.q, categoria: G.cat, metodo: G.metodo }).then(function (j) { G.data = j; G.cargando = false; if (S.tab === "gastos") render(); })
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
      '<div class="row2"><div><label class="l">Monto (S/)</label><input class="field" id="e-monto" inputmode="decimal" value="' + g.monto + '"></div><div><label class="l">Fecha</label><input class="field" id="e-fecha" type="date" value="' + g.fecha.slice(0, 10) + '"></div></div>' +
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
      '<div class="row2"><div><label class="l">Monto (S/)</label><input class="field" id="i-monto" inputmode="decimal" value="' + x.monto + '"></div><div><label class="l">Fecha</label><input class="field" id="i-fecha" type="date" value="' + x.fecha.slice(0, 10) + '"></div></div>' +
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
    if (!E) return '<div class="empty"><span class="spin" style="border-color:#2A5DA8;border-right-color:transparent"></span></div>';
    var t = E.tarjeta;
    if (t) {
      h += '<div class="cc"><div class="lbl">Deuda real</div><div class="big">' + bigMoney(t.deuda) + '</div><div class="two"><div>Fecha límite (automática)<b>' + esc(fechaCorta(t.limite)) + '</b></div><div>Quedan<b class="w">' + (t.diasLimite === null ? "—" : t.diasLimite + " días") + '</b></div></div></div>';
      h += '<div class="card"><div class="kv"><span>A pagar antes de la fecha límite</span><b>' + money(t.pendiente) + '</b></div><div class="kv"><span>Por facturar (próximo estado)</span><b>' + money(t.porFacturar) + '</b></div><div class="kv"><span>Compras tras el cierre (día ' + t.diaCierre + ')</span><b>' + money(t.comprasCiclo) + '</b></div><div class="kv"><span>Último cierre</span><b>' + esc(fechaCorta(t.ultimoCierre)) + '</b></div></div>';
      h += '<button class="btn sec2" data-a="hojaTarjeta">Llegó un estado de cuenta nuevo</button>';
    } else h += '<div class="card"><p class="hint">Aún no está configurada la hoja «Tarjeta» en tu Excel (menú 💰 Finanzas → Crear hojas nuevas).</p></div>';
    h += '<div class="sec"><span>Conciliación con el banco</span></div><div class="card"><div class="kv"><span>Ahorro calculado</span><b>' + money(E.ahorro) + '</b></div><div class="kv"><span>Saldo real del banco</span><b>' + (E.banco === null ? "—" : money(E.banco)) + '</b></div>' +
      (E.diferencia !== null ? '<div class="kv"><span>Diferencia</span><b style="color:' + (Math.abs(E.diferencia) < 0.005 ? 'var(--ok)' : 'var(--bad)') + '">' + (Math.abs(E.diferencia) < 0.005 ? "✔ Cuadra" : money(E.diferencia)) + '</b></div>' : "") +
      '<button class="btn sec2" style="margin-top:8px" data-a="hojaBanco">Escribir saldo del banco</button></div>';
    if (E.ahorroMeses && E.ahorroMeses.length) {
      var max = Math.max.apply(null, E.ahorroMeses.map(function (x) { return Math.abs(x.neto); }).concat([1]));
      h += '<div class="sec"><span>Ahorro mes a mes</span></div><div class="card"><div class="mini">' + E.ahorroMeses.map(function (x, i) {
        var ult = i === E.ahorroMeses.length - 1, hh = Math.max(3, Math.round(Math.abs(x.neto) / max * 70));
        return '<div><b>' + (x.neto >= 0 ? "+" : "−") + Math.abs(Math.round(x.neto)).toLocaleString("en-US") + '</b><i class="' + (x.neto < 0 ? "neg" : ult ? "cur" : "") + '" style="height:' + hh + 'px"></i>' + esc(x.mes) + (ult ? "*" : "") + '</div>';
      }).join("") + '</div><p class="hint" style="margin-top:6px">Lo que sumaste a tu ahorro (ingresos − gastos con Saldo Disponible). * mes en curso</p></div>';
    }
    if (E.metas && E.metas.length) {
      h += '<div class="sec"><span>Metas · con ' + money(E.ahorro) + ' disponibles</span></div><div class="card">' + E.metas.map(function (m) {
        return '<div class="goal"><div class="h"><b>' + esc(m.nombre) + '</b><span>' + (m.lograda ? "✔ lograda" : m.avance + "% de " + Number(m.objetivo).toLocaleString("en-US")) + '</span></div><div class="bar g"><i style="width:' + Math.min(100, m.avance) + '%"></i></div>' + (m.lograda ? "" : '<div class="hint" style="margin-top:3px">Faltan ' + money(m.falta) + '</div>') + '</div>';
      }).join("") + '</div>';
    }
    return h;
  }
  function hojaTarjeta() {
    abrirHoja('<div class="grab"></div><h3>Estado de cuenta nuevo</h3><p class="hint">Escribe lo que dice tu estado de cuenta. La fecha límite se calcula sola.</p>' +
      '<div><label class="l">Pendiente del estado (S/)</label><input class="field" id="t-pend" inputmode="decimal" placeholder="Ej.: 150.11"></div>' +
      '<div><label class="l">Deuda total hoy según tu app del banco (opcional)</label><input class="field" id="t-deuda" inputmode="decimal" placeholder="Solo si quieres re-sincronizar"></div>' +
      '<button class="btn" data-a="guardarTarjeta">Guardar</button><button class="btn sec2" data-a="cerrar">Cancelar</button>');
  }
  function guardarTarjeta() {
    var p = $("#t-pend").value.trim().replace(",", "."), d = $("#t-deuda").value.trim().replace(",", ".");
    if (!p && !d) { toast("Escribe al menos el pendiente", "err"); return; }
    app("tarjeta_guardar", { pendiente: p, deuda: d }).then(function (j) { cerrarHoja(); toast(j.mensaje, "ok"); cargarEstado(true); }).catch(fail);
  }
  function hojaBanco() {
    abrirHoja('<div class="grab"></div><h3>Saldo real del banco</h3><p class="hint">Mira el saldo de tu cuenta de ahorros en la app del banco y escríbelo aquí. Si coincide con tu ahorro calculado, tus registros están completos.</p>' +
      '<div><label class="l">Saldo (S/)</label><input class="field" id="b-saldo" inputmode="decimal" value="' + (S.estado && S.estado.banco !== null ? S.estado.banco : "") + '"></div>' +
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
    if (!D) return '<div class="empty"><span class="spin" style="border-color:#2A5DA8;border-right-color:transparent"></span></div>';
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
    if (!D) return h + '<div class="empty"><span class="spin" style="border-color:#2A5DA8;border-right-color:transparent"></span></div>';
    var dif = D.gastos - D.mesAnteriorGastos;
    h += '<div class="card"><div class="kv"><span>Ingresos</span><b>' + money(D.ingresos) + '</b></div><div class="kv"><span>Gastos</span><b>' + money(D.gastos) + '</b></div><div class="kv"><span>Vs. mes anterior</span><b style="color:' + (dif > 0 ? 'var(--bad)' : 'var(--ok)') + '">' + (dif > 0 ? "▲ " : "▼ ") + money(Math.abs(dif)) + '</b></div><div class="kv"><span>Promedio por día</span><b>' + money(D.promedioDiario) + '</b></div></div>';
    if (D.categorias.length) {
      var tot = D.categorias.reduce(function (s, c) { return s + c.monto; }, 0) || 1;
      h += '<div class="sec"><span>En qué gastaste</span></div><div class="card">' + D.categorias.filter(function (c) { return c.monto > 0; }).map(function (c) {
        var p = Math.round(c.monto / tot * 100);
        return '<div style="padding:6px 0"><div style="display:flex;justify-content:space-between;font-size:14px;gap:8px"><b style="font-weight:600">' + c.emoji + ' ' + esc(c.categoria) + '</b><span style="color:var(--mut);font-variant-numeric:tabular-nums">' + money(c.monto) + ' · ' + p + '%</span></div><div class="bar g"><i style="width:' + p + '%"></i></div>' +
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
  function vistaAjustes() {
    var E = S.estado;
    return '<div class="card"><div class="kv"><span>Versión de la app</span><b>' + VERSION + '</b></div><div class="kv"><span>Versión del script</span><b>' + esc(E ? E.version : "—") + '</b></div><div class="kv"><span>Conexión</span><b>' + (cfg.demo ? "Demostración" : "Tu script de Google") + '</b></div></div>' +
      '<div class="card stack"><div class="lbl">Instalar en tu iPhone</div><p class="hint">En Safari toca Compartir (□↑) → «Agregar a pantalla de inicio». Ábrela desde el ícono y funciona a pantalla completa.</p></div>' +
      (cfg.demo ? '<button class="btn" data-a="salir">Salir de la demostración</button>' :
        '<button class="btn sec2" data-a="cambiarPin">Cambiar el PIN guardado</button><button class="btn bad" data-a="salir">Cerrar sesión y borrar datos del teléfono</button>' +
        '<p class="hint">El PIN se define en tu Excel: menú 💰 Finanzas → 🔑 Definir PIN de la app web. Cerrar sesión solo borra lo guardado en este teléfono.</p>');
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
    var b = document.querySelector('[data-a="conectar"]'); b.disabled = true; b.innerHTML = '<span class="spin"></span> Conectando…';
    cfg = { url: url, pin: pin };
    app("ping").then(function () { store("mg_cfg", cfg); S.setupMsg = ""; history.replaceState(null, "", location.pathname); cargarEstado(false); render(); })
      .catch(function (e) { cfg = null; S.setupMsg = e.message && e.message.indexOf("Failed to fetch") < 0 ? e.message : "No se pudo conectar. Revisa el enlace y tu conexión."; render(); });
  }

  /* ---------- hojas (diálogos) ---------- */
  function abrirHoja(html) { var w = $("#sheet"); w.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>'; w.hidden = false; }
  function cerrarHoja() { var w = $("#sheet"); w.hidden = true; w.innerHTML = ""; }
  $("#sheet").addEventListener("click", function (e) { if (e.target === this) cerrarHoja(); });

  /* ---------- datos ---------- */
  function cargarEstado(silencioso) {
    if (!cfg) return;
    if (!silencioso && !S.estado) render();
    app("estado").then(function (j) { S.estado = j; store("mg_estado", j); if (S.tab !== "registrar" || !silencioso) render(); }).catch(fail);
  }
  function refrescarTodo() { S.G.data = null; cargarEstado(true); if (S.tab === "gastos") { render(); cargarGastos(); } }
  function cargarFijos() { app("fijos").then(function (j) { S.FJ.data = j; S.FJ.sel = {}; if (S.sub === "fijos") render(); }).catch(fail); }
  function cargarInformes() { S.IN.data = null; app("informes", { mes: S.IN.mes }).then(function (j) { S.IN.data = j; if (S.sub === "informes") render(); }).catch(fail); }

  /* ---------- acciones ---------- */
  var acciones = {
    tab: function (v) { S.tab = v; S.sub = null; render(); if (v === "gastos" && !S.G.data) cargarGastos(); if (v === "gastos" || v === "tarjeta" || v === "inicio") cargarEstado(true); if (v === "registrar") { var l = $("#f-lugar"); if (l && S.F.modo === "gasto") pintarSugerencias(!S.F.lugar.trim()); } },
    refrescar: function () { toast("Actualizando…"); if (S.tab === "gastos") cargarGastos(); cargarEstado(true); },
    ir: function (v) {
      if (v === "fijos") { S.tab = "mas"; S.sub = "fijos"; render(); cargarFijos(); }
      else if (v === "informes") { S.tab = "mas"; S.sub = "informes"; render(); cargarInformes(); }
      else if (v === "presupuesto" || v === "ajustes") { S.tab = "mas"; S.sub = v; render(); if (v === "presupuesto") cargarEstado(true); }
      else { S.tab = "mas"; S.sub = null; render(); }
    },
    modo: function (v) { S.F.modo = v; render(); },
    metodo: function (v) { S.F.metodo = v; render(); },
    desc: function (v) { S.F.desc = v; render(); },
    lugar: function (v) { S.F.lugar = v; var l = $("#f-lugar"); if (l) l.value = v; S.lugares = []; pintarSugerencias(false); sugerirCat(v); },
    elegirCat: function () { hojaCategorias(); },
    cat: function (v) { S.F.cat = v; S.F.catAuto = false; cerrarHoja(); var b = $("#f-cat"); if (b) b.innerHTML = catTxt() + '<em>Cambiar</em>'; },
    guardar: guardar,
    mesG: function (v) { S.G.mes = mesMover(S.G.mes, +v); S.G.data = null; render(); cargarGastos(); },
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
      abrirHoja('<div class="grab"></div><h3>' + p.emoji + ' ' + esc(v) + '</h3><p class="hint">Gastado este mes: ' + money(p.gastado) + '</p><div><label class="l">Tope mensual (S/)</label><input class="field" id="p-tope" inputmode="decimal" value="' + (p.tope && !p.referencia ? p.tope : "") + '" placeholder="Ej.: 300"></div><button class="btn" data-a="topeGuardar" data-v="' + esc(v) + '">Guardar tope</button><button class="btn sec2" data-a="topeQuitar" data-v="' + esc(v) + '">Quitar tope</button><button class="btn sec2" data-a="cerrar">Cancelar</button>');
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
    conectar: conectar,
    demo: function () { cfg = { demo: true }; store("mg_cfg", cfg); S.estado = null; S.tab = "inicio"; cargarEstado(false); render(); }
  };
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-a]"); if (!el) return;
    var a = acciones[el.getAttribute("data-a")]; if (a) { e.preventDefault(); a(el.getAttribute("data-v")); }
  });
  document.addEventListener("input", function (e) {
    if (e.target.id !== "g-q") return;
    S.G.q = e.target.value; clearTimeout(S.tq);
    S.tq = setTimeout(function () { var pos = e.target.selectionStart; S.G.data = null; cargarGastos(); }, 350);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.id === "s-pin") conectar(); });

  /* ---------- arranque ---------- */
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) navigator.serviceWorker.register("sw.js").catch(function () {});
  var vis = Date.now();
  document.addEventListener("visibilitychange", function () { if (!document.hidden && cfg && Date.now() - vis > 60000) { vis = Date.now(); cargarEstado(true); if (S.tab === "gastos") cargarGastos(); } else if (document.hidden) vis = Date.now(); });
  render();
  if (cfg) cargarEstado(true);
  if (/^#demo/.test(location.hash)) {
    cfg = { demo: true };
    var mt = /tab=(\w+)/.exec(location.hash), ms = /sub=(\w+)/.exec(location.hash);
    if (mt) S.tab = mt[1]; if (ms) S.sub = ms[1];
    render(); cargarEstado(false);
    if (S.tab === "gastos") cargarGastos(); if (S.sub === "fijos") cargarFijos(); if (S.sub === "informes") cargarInformes();
  }
})();
