# Mis Gastos · app web (PWA)

App para iPhone (y cualquier navegador) que registra y consulta tus gastos. Se conecta al **mismo script de Google** que usa tu atajo, así que todo termina en tu Excel «Seguimiento de Gastos».

## Qué contiene
| Archivo | Para qué |
|---|---|
| `index.html`, `styles.css`, `app.js` | La app (sin librerías) |
| `demo.js` | Modo demostración con datos de ejemplo (no toca tu Excel) |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | Instalación en la pantalla de inicio y arranque rápido |

## Pantallas
Inicio · Registrar (gasto o ingreso, con lugares sugeridos y categoría automática) · Gastos (historial por mes, búsqueda, filtros, editar y borrar) · Tarjeta y ahorro (deuda, fecha límite automática, conciliación con el banco, ahorro mes a mes, metas) · Más (Presupuesto con topes editables, Gastos fijos, Informes, Ajustes).

## Seguridad
- La página **no contiene tu enlace ni tu PIN**: se escriben una sola vez en el teléfono y se guardan solo ahí.
- Todo lo que consulta o modifica datos pide el **PIN** (definido en el Excel: 💰 Finanzas → 🔑 Definir PIN de la app web). 5 errores seguidos bloquean 15 minutos.
- Registrar un gasto o ingreso usa los mismos tipos que el atajo (no pide PIN, igual que hoy).
- Por eso la página se puede alojar en un repositorio público: solo trae diseño.

## Probarla en el PC (sin publicar)
Abre `index.html` en el navegador y pulsa **Ver demostración**, o usa `index.html#demo`.

## Publicar en GitHub Pages (pendiente de tu visto bueno)
1. Crear el repositorio `mis-gastos` (público) en tu cuenta de GitHub y subir el contenido de esta carpeta.
2. En el repositorio: Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
3. Tu dirección será `https://<tu-usuario>.github.io/mis-gastos/`.

## Instalarla en el iPhone
1. Abre la dirección en **Safari**.
2. Escribe el enlace de tu script (el que termina en `/exec`) y tu PIN → Conectar.
3. Compartir (□↑) → **Agregar a pantalla de inicio**. Ábrela desde el ícono.

Truco: para no escribir el enlace largo en el teléfono, envíate a ti mismo (nota o mensaje) la dirección con el enlace al final: `https://<tu-usuario>.github.io/mis-gastos/#u=<enlace-del-script>`. La pantalla de conexión lo rellena sola. No lo publiques ni lo compartas.

## Actualizaciones
La app se actualiza sola al volver a abrirla con internet. Si cambias el script, publica «Nueva versión» en Apps Script (mismo enlace).

## Novedades v1.1
- **Registrar sin internet:** si no hay señal, el registro se guarda en el teléfono (con su hora real) y se envía solo al volver la conexión. Cada registro lleva un id único: si se reenvía, el script no lo duplica. Requiere el script v3.3.1.
- **Ocultar montos:** ojo en el encabezado (Inicio, Gastos, Tarjeta); se recuerda.
- **Candado de la app:** código de 4 a 6 números, solo de este teléfono (se guarda su huella, no el código). Se pide al abrir y tras 0, 1 o 5 minutos fuera. «Olvidé mi código» cierra la sesión y pide de nuevo el enlace y el PIN del Excel.
- **Modo oscuro:** Automático (sigue al iPhone), Claro u Oscuro, en Ajustes.

## Novedades v1.2 (nueva apariencia y 3 funciones)
- **Nuevo diseño** inspirado en una app de referencia: encabezado con degradado azul y textura de puntos, tarjetas más redondeadas, barra inferior flotante de cristal con indicador que se desliza, hojas que suben suavemente.
- **Animaciones:** pantalla de inicio con el logo, tarjetas que entran escalonadas, barras y números que crecen al abrir, pantalla de carga con puntos que giran sobre fondo borroso, y una confirmación animada al guardar. Se reducen solas si el iPhone tiene activado «Reducir movimiento».
- **Gráfico de dona** en Informes (gasto por categoría con leyenda).
- **Deslizar un gasto** (o ingreso) a la izquierda: botones Editar y Borrar (Borrar siempre pide confirmación).
- **Teclado numérico:** los campos de monto abren directo el teclado de números del iPhone; al abrir Registrar el cursor ya queda en el monto; solo acepta números y un punto o coma.

## Novedades v1.3
- **Registrar igual que el atajo:** Gasto → toca **Lugar** y elige de la lista (frecuentes, búsqueda y «Usar «…»» para un lugar nuevo) → se abre la lista de **categorías con la habitual primero (⭐)** → Pagado con → Detalle → Monto → Guardar. En **Ingreso** eliges Primera/Segunda Quincena o Ingreso Extra. La pestaña **Fijos** (dentro de Registrar) marca y paga los fijos pendientes.
- **Nuevo ícono** («S/» sobre azul) y logo en la pantalla de inicio. Para ver el ícono nuevo hay que quitar la app de la pantalla de inicio y agregarla otra vez.
- **Pantalla completa en iPhone:** colores sólidos en los bordes (hora/batería y barra inferior) y altura completa.

## Novedades v1.4
- **Ojito en «Ahorro disponible» y «Deuda de la tarjeta»** (Inicio y Tarjeta): los montos grandes **arrancan ocultos cada vez que abres la app**; se muestran al tocar el ojito (y vuelven a ocultarse al cerrar). El ojo del encabezado oculta todos los montos de forma permanente.
- **Barra inferior pegada al borde** (por defecto; en Ajustes se puede volver a «Flotante»). Encabezado con degradado que parte del mismo azul que la barra de estado, sin línea de unión.
- Barra de estado en modo «negro» (ventana completa en iPhone 15 Pro Max).

## Novedades v1.5 (requiere el script v3.4.0)
- **Ojos:** solo «Ahorro disponible hoy» y «Deuda de la tarjeta» arrancan ocultos cada vez que abres la app (ojito en cada tarjeta). **Todo lo demás se ve.** El **ojo del encabezado** muestra u oculta **todos** los montos de todas las pantallas (si todo está visible, los oculta; si no, los muestra). En Ajustes hay una casilla para que TODO arranque oculto.
- **Meta de ahorro mensual:** en Inicio, define un % de tus ingresos o un monto fijo; la barra mide lo que realmente sumas a la cuenta (ingresos − gastos con Saldo Disponible). Se guarda en el script.
- **Comparación entre meses** (Informes): total del mes contra el anterior y, por categoría, barra azul (este mes) contra barra gris (mes anterior) con ▲/▼ y la diferencia. Cambia de mes con las flechas.
- **Barra inferior pegada al borde**, de color sólido, para que no quede ninguna franja distinta debajo.

## Ajuste v1.5.1
- **Ahorro disponible y Deuda de la tarjeta son independientes:** cada uno tiene su ojito, **siempre abren ocultos** (y vuelven a ocultarse al salir de la app) y el ojo del encabezado NO los toca.
- **El ojo del encabezado** muestra u oculta **todos los demás** montos de todas las pantallas. Al abrir la app esos montos se ven.
- **Barra inferior pegada** siempre por defecto (se ignora la opción guardada de versiones anteriores); en Ajustes se puede elegir «Flotante».

## Límites conocidos
- Editar, borrar, pagar fijos y actualizar la tarjeta necesitan internet (solo registrar gasto/ingreso funciona sin conexión).
- Las notificaciones push de iPhone solo existen para páginas agregadas a la pantalla de inicio y no están incluidas en esta versión.
- Borrar quita la fila del Excel; no hay «deshacer».


## Ajuste v1.5.2
Cabecera recta. Se corrigió el guardado de la meta de ahorro mensual (necesita el script v3.4.1 o superior).

## Paleta Slate · v1.6.0
Nueva paleta negro/blanco/gris con degradado, modo claro y oscuro (automático por defecto) e icono negro. Para ver el icono nuevo, quita la app de la pantalla de inicio y vuelve a agregarla.

## Novedades · v1.7.0 (necesita el script v3.4.1 o superior)
- Botón «+» central grande; opción de abrir directamente en Registrar.
- Plantillas de gasto (⭐) y dictado (🎤).
- «¿Puedo gastarlo?», «Tu ritmo del mes» (gasto sugerido de hoy y proyección al cierre).
- Metas con anillo y fecha estimada; retos de ahorro.
- Face ID / Touch ID para entrar (el código queda de respaldo).

## Escanear QR · v1.8.0
En Registrar, «📷 Escanear QR» lee el código QR de la boleta o factura electrónica y llena el monto, el detalle y la fecha. La primera vez de cada comercio eliges el lugar; la app lo recuerda por su RUC y la siguiente vez lo llena sola. No se guarda ninguna foto.

## Novedades · v1.9.0 (necesita el script v3.6.0 para las gráficas)
- Saludo según la hora y una frase de ánimo en Inicio.
- Al volver a la app después de unos segundos, empieza en Inicio con la bienvenida y las animaciones.
- Más → «Informes y gráficas»: línea del mes día por día (con proyección), mapa de calor del mes, lugares donde más gastas y evolución de una categoría.
- Más → «Logros»: medallas por tu constancia (racha de días registrando, meta cumplida, dentro de topes…).

## Pantalla de carga e icono · v1.9.1
Nueva pantalla de carga animada (moneda → columnas → línea de crecimiento) con el nombre en pequeño y tu saludo; un toque la salta. Nuevo icono: para verlo, quita la app de la pantalla de inicio del iPhone y vuelve a agregarla.

## Colores · v1.10.0
Más → Ajustes → **Colores**: elige una de 15 combinaciones (o «Original» para el negro y gris de antes) o arma la tuya con **Personalizar**. Cambia los botones, las barras de progreso, la barra inferior, la pantalla de carga y la línea del encabezado. Se guarda en tu teléfono.

## Tu dragón · v1.11.0
Un dragón pasea y hace travesuras mientras la app está abierta (nunca tapa ni bloquea tus toques; en «Registrar» se esconde mientras escribes). Nace como huevito y evoluciona con tus logros: **Joven** con 3 y **Dragón de ahorro** con 7. Tócalo y te regala un corazón. Sus colores siguen la combinación que elijas en Ajustes → Colores. En Ajustes → **Mascota** puedes dejarlo Activo, Tranquilo o Apagado. También aparece en la pantalla de carga y en Logros.
