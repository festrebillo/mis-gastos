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

## Límites conocidos
- Editar, borrar, pagar fijos y actualizar la tarjeta necesitan internet (solo registrar gasto/ingreso funciona sin conexión).
- Las notificaciones push de iPhone solo existen para páginas agregadas a la pantalla de inicio y no están incluidas en esta versión.
- Borrar quita la fila del Excel; no hay «deshacer».
