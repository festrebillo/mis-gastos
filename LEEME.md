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

## Límites conocidos (v1.0)
- Necesita internet para registrar (no hay cola sin conexión todavía).
- Las notificaciones push de iPhone solo existen para páginas agregadas a la pantalla de inicio y no están incluidas en esta versión.
- Borrar quita la fila del Excel; no hay «deshacer».
