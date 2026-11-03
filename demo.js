/* Modo demostración: datos de ejemplo para ver la app sin conectarla a tu Excel. No se envía nada a ningún sitio. */
(function () {
  "use strict";
  var CATS = [["Supermercado", "🛒"], ["Restaurantes / Antojos", "🍔"], ["Transporte", "🚕"], ["Auto y Combustible", "⛽"], ["Servicios / Casa", "💡"], ["Salud y Farmacia", "💊"], ["Cuidado Personal", "🧴"],
    ["Ropa y Calzado", "👕"], ["Regalos y Familia", "🎁"], ["Ocio y Entretenimiento", "🎉"], ["Colaboraciones y Cuotas", "🤝"], ["Deudas / Pagos en Cuotas", "💳"], ["Suscripciones", "📺"], ["Imprevistos", "🚨"]];
  function emo(n) { for (var i = 0; i < CATS.length; i++) if (CATS[i][0] === n) return CATS[i][1]; return "•"; }
  function pad(n) { return ("0" + n).slice(-2); }
  var hoy = new Date();
  function fh(d, h, m) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(h) + ":" + pad(m); }
  var gastos = [
    { fila: 40, dia: 0, h: 13, lugar: "Adobada", cat: "Restaurantes / Antojos", metodo: "Saldo Disponible", monto: 30, detalle: "Almuerzo" },
    { fila: 39, dia: 1, h: 19, lugar: "Uber", cat: "Transporte", metodo: "Tarjeta de Crédito", monto: 46.5, detalle: "" },
    { fila: 38, dia: 1, h: 9, lugar: "Metro", cat: "Supermercado", metodo: "Saldo Disponible", monto: 87.4, detalle: "Compras de la semana" },
    { fila: 37, dia: 2, h: 20, lugar: "Starbucks", cat: "Restaurantes / Antojos", metodo: "Tarjeta de Crédito", monto: 18.9, detalle: "" },
    { fila: 36, dia: 3, h: 8, lugar: "Netflix", cat: "Suscripciones", metodo: "Tarjeta de Crédito", monto: 44.9, detalle: "" },
    { fila: 35, dia: 4, h: 11, lugar: "Inkafarma", cat: "Salud y Farmacia", metodo: "Saldo Disponible", monto: 32.6, detalle: "" }
  ];
  function ok(o) { return Promise.resolve(Object.assign({ status: "success" }, o)); }
  function estado() {
    return ok({
      version: "demo", nombre: "Fernando", hoy: hoy.toISOString().slice(0, 10), mes: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"][hoy.getMonth()], anio: hoy.getFullYear(),
      ahorro: 3782.92, reserva: 233.54, banco: 3782.92, diferencia: 0, ingresos: 1420, gastos: 260.3, gastosSaldo: 150, gastosTarjeta: 110.3, fijosPendientes: 6, fijosPendientesMonto: 467.08,
      tarjeta: { deuda: 907.75, pendiente: 150.11, porFacturar: 757.64, limite: "2026-11-23", diasLimite: 21, diaCierre: 25, ultimoCierre: "2026-10-25", comprasCiclo: 46.5 },
      presupuesto: CATS.map(function (c, i) { var g = [0, 49.8, 46.5, 0, 0, 32.6, 0, 0, 0, 0, 0, 0, 44.9, 0][i], t = [400, 200, 150, null, 250, 120, null, null, 100, 150, null, null, 80, null][i]; return { categoria: c[0], emoji: c[1], gastado: g, tope: t, referencia: false, pct: t ? Math.round(g / t * 100) : null }; }),
      metaAhorro: { tipo: "monto", valor: 600, objetivo: 600, logrado: 410, pct: 68 }, categorias: [], metas: [{ nombre: "Departamento inicial", objetivo: 50000, avance: 7.6, falta: 46217.08, lograda: false, limite: null }, { nombre: "Viaje Europa", objetivo: 10000, avance: 37.8, falta: 6217.08, lograda: false, limite: "2027-12-31" }, { nombre: "Carro nuevo", objetivo: 50000, avance: 7.6, falta: 46217.08, lograda: false, limite: null }],
      ahorroMeses: [{ mes: "Set", neto: 1494.52, ingresos: 3055.7, gastos: 1134.47, pct: 49, cierre: 3415.75 }, { mes: "Oct", neto: 1921.23, ingresos: 3338.5, gastos: 1417.27, pct: 58, cierre: 3812.37 }, { mes: "Nov", neto: 1159.8, ingresos: 1420, gastos: 260.2, pct: 82, cierre: 3782.92 }],
      frecuentes: ["Starbucks", "Bembos", "Metro", "Uber", "Adobada", "Tambo", "Inkafarma"], avisos: [],
      categoriasActivas: CATS.map(function (c) { return { nombre: c[0], emoji: c[1] }; })
    });
  }
  function gastosOp(b) {
    var p = /^(\d{4})-(\d{2})$/.exec(b.mes || ""), a = p ? +p[1] : hoy.getFullYear(), m = p ? +p[2] - 1 : hoy.getMonth();
    var q = (b.q || "").toLowerCase(), esActual = a === hoy.getFullYear() && m === hoy.getMonth();
    var lista = gastos.map(function (g) { var d = esActual ? new Date(hoy.getFullYear(), hoy.getMonth(), Math.max(1, hoy.getDate() - g.dia)) : new Date(a, m, 24 - g.dia * 2); return { fila: g.fila, fecha: fh(d, g.h, 5), lugar: g.lugar, categoria: g.cat, emoji: emo(g.cat), metodo: g.metodo, monto: g.monto, detalle: g.detalle, fijo: false }; })
      .filter(function (g) { return (!q || (g.lugar + " " + g.detalle).toLowerCase().indexOf(q) > -1) && (!b.categoria || g.categoria === b.categoria) && (!b.metodo || g.metodo === b.metodo); });
    var tot = 0, ts = 0, tt = 0; lista.forEach(function (g) { tot += g.monto; if (g.metodo === "Tarjeta de Crédito") tt += g.monto; else ts += g.monto; });
    var d1 = esActual ? new Date(hoy.getFullYear(), hoy.getMonth(), 1) : new Date(a, m, 15);
    return ok({ mes: a + "-" + pad(m + 1), mesNombre: "", total: tot, totalSaldo: ts, totalTarjeta: tt, cantidad: lista.length, gastos: lista,
      ingresos: (q || b.categoria || b.metodo) ? [] : [{ fila: 12, fecha: fh(d1, 7, 0), descripcion: "Primera Quincena", monto: 1420 }], totalIngresos: 1420 });
  }
  function reportes(b) {
    var p = /^(\d{4})-(\d{2})$/.exec(b.mes || ""), a = p ? +p[1] : hoy.getFullYear(), m = p ? +p[2] - 1 : hoy.getMonth(), esAct = a === hoy.getFullYear() && m === hoy.getMonth();
    var n = new Date(a, m + 1, 0).getDate(), dia = esAct ? hoy.getDate() : n, np = new Date(a, m, 0).getDate(), dias = [], ant = [], i;
    for (i = 1; i <= n; i++) dias.push(i > dia || (i * 37 + m * 11) % 5 === 0 ? 0 : Math.round(((i * 53 + m * 7) % 90 + 8) * 10) / 10);
    for (i = 1; i <= np; i++) ant.push((i * 29 + 3) % 4 === 0 ? 0 : Math.round(((i * 47) % 110 + 10) * 10) / 10);
    var ab = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"], nom = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
    var meses = [], k; for (k = 0; k < 6; k++) meses.push(ab[new Date(a, m - 5 + k, 1).getMonth()]);
    var cats = [["Restaurantes / Antojos", "🍔", [310, 420, 380, 410, 395, 160]], ["Supermercado", "🛒", [540, 610, 580, 620, 600, 260]], ["Transporte", "🚕", [150, 180, 170, 190, 175, 90]], ["Suscripciones", "📺", [45, 45, 45, 45, 45, 45]], ["Salud y Farmacia", "💊", [0, 60, 0, 120, 40, 33]]]
      .map(function (c) { return { categoria: c[0], emoji: c[1], serie: c[2], total: c[2].reduce(function (s, x) { return s + x; }, 0) }; });
    return ok({ mes: a + "-" + pad(m + 1), mesNombre: nom[m], mesAnteriorNombre: nom[(m + 11) % 12], diasEnMes: n, diaActual: dia, dias: dias, diasAnt: ant,
      lugares: [{ lugar: "Metro", monto: 187.4, veces: 3 }, { lugar: "Uber", monto: 146.5, veces: 5 }, { lugar: "Adobada", monto: 90, veces: 3 }, { lugar: "Starbucks", monto: 56.7, veces: 3 }, { lugar: "Inkafarma", monto: 32.6, veces: 1 }],
      meses: meses, categorias: cats, racha: esAct ? 9 : null });
  }
  window.MG_DEMO = function (b) {
    if (b.tipo === "lugares") {
      var base = ["Starbucks", "Bembos", "Metro", "Uber", "Adobada", "Adobada Express", "Tambo", "Inkafarma", "Wong", "Plaza Vea"], q = (b.q || "").toLowerCase();
      return ok({ lugares: base.filter(function (x) { return x.toLowerCase().indexOf(q) > -1; }).concat(["✏️ Usar «" + (b.q || "") + "»"]) });
    }
    if (b.tipo === "sugerir") {
      var map = { adobada: "Restaurantes / Antojos", starbucks: "Restaurantes / Antojos", bembos: "Restaurantes / Antojos", metro: "Supermercado", wong: "Supermercado", uber: "Transporte", inkafarma: "Salud y Farmacia" };
      return ok({ habitual: map[(b.lugar || "").toLowerCase().split(" ")[0]] || "" });
    }
    if (b.tipo === "gasto") return ok({ mensaje: "✅ Guardado: gasto S/ " + Number(b.monto).toFixed(2) + " (" + b.metodoPago + ") · " + emo(b.categoria) + " " + (b.categoria || "Imprevistos") + " (demostración, no se guardó nada)" });
    if (b.tipo === "ingreso") return ok({ mensaje: "✅ Guardado: ingreso S/ " + Number(b.monto).toFixed(2) + " (demostración)" });
    if (b.tipo === "fijos") return ok({ mensaje: "✅ Guardados " + (b.items || []).length + " gasto(s) fijo(s) (demostración)" });
    switch (b.op) {
      case "ping": return ok({ version: "demo", nombre: "Fernando" });
      case "estado": return estado();
      case "gastos": return gastosOp(b);
      case "fijos": return ok({ fijos: [{ nombre: "🚗 Pasajes", monto: 120, pagado: false }, { nombre: "🏠 Cuota Casa", monto: 180, pagado: false }, { nombre: "📱 Celular", monto: 45.9, pagado: false }, { nombre: "🎶 Spotify", monto: 19.9, pagado: false }, { nombre: "📺 Netflix", monto: 44.9, pagado: true }, { nombre: "IPAD", monto: 141.58, pagado: true }], pendientes: 4, montoPendiente: 365.8 });
      case "reportes": return reportes(b);
      case "informes": return ok({ mes: "Noviembre", mesAnteriorNombre: "Octubre", anio: 2026, ingresos: 1420, gastos: 260.3, mesAnteriorGastos: 3310.6, promedioDiario: 13, categorias: [{ categoria: "Restaurantes / Antojos", emoji: "🍔", monto: 48.9, mesAnterior: 410 }, { categoria: "Supermercado", emoji: "🛒", monto: 87.4, mesAnterior: 620 }, { categoria: "Transporte", emoji: "🚕", monto: 46.5, mesAnterior: 190 }, { categoria: "Suscripciones", emoji: "📺", monto: 44.9, mesAnterior: 44.9 }, { categoria: "Salud y Farmacia", emoji: "💊", monto: 32.6, mesAnterior: 0 }],
        top5: [{ lugar: "Metro", monto: 87.4, categoria: "Supermercado", fecha: "2026-11-01", metodo: "Saldo Disponible" }, { lugar: "Uber", monto: 46.5, categoria: "Transporte", fecha: "2026-11-01", metodo: "Tarjeta de Crédito" }, { lugar: "Netflix", monto: 44.9, categoria: "Suscripciones", fecha: "2026-11-01", metodo: "Tarjeta de Crédito" }],
        meses: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"].map(function (m, i) { return { mes: m, ingresos: i === 8 ? 3055 : i === 9 ? 3338 : i === 10 ? 1420 : 0, gastos: i === 8 ? 1134 : i === 9 ? 3310 : i === 10 ? 260 : 0 }; }), necesidades: 12, gustos: 6, ahorro: 82 });
      default: return ok({ mensaje: "✅ Hecho (demostración, no se guardó nada)" });
    }
  };
})();
