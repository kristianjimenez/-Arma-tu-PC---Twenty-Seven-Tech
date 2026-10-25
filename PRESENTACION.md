# Guía para la defensa — Arma TU PC (Twenty Seven Tech)

Esto es un apoyo para ordenar la presentación; las palabras las ponen ustedes.

## Antes del día (checklist)
- [ ] `npm i` y `npm run dev` funcionando en la laptop que van a usar (probar también `npm run build`).
- [ ] Probar SIN internet (las fuentes de Google caen a la fuente del sistema; todo lo demás es local).
- [ ] Crear de antemano una cuenta de prueba y un build guardado en "Mis builds".
- [ ] Confirmar los precios del catálogo con la tienda (`src/app/data/pc-components.ts`).
- [ ] (Opcional) Reemplazar las ilustraciones por fotos reales: `public/img/components/<id>.webp` (cpu-1.webp, gpu-3.webp, ...). Las fotos tienen prioridad sobre las ilustraciones.
- [ ] Publicar en GitHub Pages (ver `docs/PUBLICAR_EN_GITHUB.md`) y abrir la URL desde el celular; llevar ese link como respaldo.
- [ ] Tener el WhatsApp de la tienda abierto en el celular para mostrar que llega la cotización.
- [ ] Llevar el proyecto en USB y en la nube.

## Estructura sugerida (≈ 10-12 min)
1. **Problema (1 min):** el cliente que llega a la tienda no sabe si las piezas son compatibles; el vendedor repite cotizaciones por WhatsApp.
2. **Solución (1 min):** configurador web con compatibilidad verificada y cotización directa a la tienda.
3. **Demo en vivo (4 min):**
   - Registro / login.
   - Botón **"Ver demo guiada"**: arma un PC solo, paso a paso (ideal si hay nervios).
   - Mostrar un **conflicto**: elegir CPU Intel y ver cómo las placas AM5 salen marcadas "Incompatible" con el motivo.
   - Filtro "Solo compatibles" y orden por precio.
   - Panel de **rendimiento** (qué juegos corre).
   - **Finalizar pedido**: elegir pagar por WhatsApp o en el local, escribir nombre y teléfono, y se abre WhatsApp con el pedido (con código T27-...) ya redactado. Mostrar el mensaje en el celular.
   - Descargar presupuesto (banner/PDF) y "Mis builds" (requiere cuenta).
4. **Cómo está hecho (2 min):** React + TypeScript + Vite + Tailwind; reglas de compatibilidad en `utils/compatibility.ts`; datos en `data/`; sesión y builds en localStorage.
5. **Limitaciones y trabajo futuro (1 min):** backend con base de datos, precios desde inventario real, más reglas (altura de cooler, largo de GPU), panel de administración para la tienda.
6. **Cierre + preguntas.**

## Reglas de compatibilidad que implementamos
| Regla | Cómo se valida |
|---|---|
| CPU ↔ Placa | mismo socket (AM4 / AM5 / LGA1700) |
| RAM ↔ Placa | mismo tipo (DDR4 / DDR5) |
| GPU ↔ Fuente | vatios de la fuente ≥ mínimo recomendado de la GPU |
| Placa ↔ Case | el case debe soportar el formato (mATX / ATX) |

## Preguntas que probablemente les hagan
- **¿Por qué React / TypeScript?** Componentes reutilizables y tipos que evitan errores (p. ej. una pieza sin socket).
- **¿Cómo le llega el pedido a la tienda?** Por WhatsApp: la página arma el mensaje y el cliente lo envía. Sin backend, la tienda no ve el pedido hasta que llega ese mensaje (se dice así en pantalla). Siguiente paso: API + panel de pedidos.
- **¿Hay que registrarse para comprar?** No. La cuenta solo sirve para guardar builds.
- **¿Los usuarios son reales?** Es una demo local (hash SHA-256 en el navegador). En producción: backend, hash con sal (bcrypt/argon2) y sesiones/JWT.
- **¿De dónde salen los precios?** Del catálogo de la tienda, cargado en un archivo; el siguiente paso es conectarlo al inventario.
- **¿Qué pasa si la tienda cambia un precio?** Se edita un solo archivo; sin tocar la lógica.
- **¿Qué no valida?** Altura del cooler, largo de la GPU, consumo exacto (usa la potencia recomendada del fabricante).
- **¿Por qué IVA 16%?** Es la tasa general en Venezuela; está en una constante (`TAX_RATE`).
- **¿Cómo escala?** Mover `data/` a una API + base de datos; el front no cambia su lógica.
