# Arma tu PC · Twenty Seven Tech

Sitio web para que los clientes de **Twenty Seven Tech** (tienda de computación en Caracas, Venezuela) armen su computadora pieza por pieza, con la compatibilidad verificada en tiempo real, y envíen el pedido a la tienda por WhatsApp.

Proyecto de grado.

## Qué problema resuelve

Quien va a comprar una PC por partes suele no saber si el procesador encaja con la placa, si la memoria es la correcta o si la fuente alcanza para la tarjeta gráfica. Hoy eso se resuelve cotizando por mensajes, uno por uno. Este sitio lo hace en pantalla: el cliente elige, la página le avisa **antes de agregar** si algo no encaja, y al final le arma el mensaje del pedido listo para enviar.

## Funciones

- **Configurador por pasos** (procesador → placa → memoria → gráfica → disco → fuente → case). Las piezas que no encajan con lo ya elegido se muestran bloqueadas, con el motivo.
- **Equipos listos** de la tienda (Económico, 1080p, 1440p y 4K), todos verificados como compatibles, que el cliente carga y personaliza.
- **Finalizar pedido:** el cliente deja nombre y teléfono, elige **pagar por WhatsApp** o **pagar en el local**, y se abre WhatsApp con el pedido redactado y un código único (`T27-AAMMDD-XXXX`).
- **Rendimiento estimado:** nivel del equipo y qué juegos corre.
- **Presupuesto descargable** (imagen y PDF) y botón de compartir.
- **Cuenta opcional** (registro e ingreso) para guardar builds en "Mis builds". No hace falta cuenta para armar ni pedir.
- **Autoguardado:** si se recarga la página, el equipo no se pierde.
- **Demo guiada:** arma un equipo completo paso a paso, pensada para presentaciones.
- Diseño responsive (celular y escritorio) con la identidad de la marca.

## Reglas de compatibilidad

| Regla | Qué se valida |
|---|---|
| Procesador y placa | Mismo socket (AM4, AM5 o LGA1700) |
| Memoria y placa | Mismo tipo (DDR4 o DDR5) |
| Gráfica y fuente | Los vatios de la fuente alcanzan para el mínimo recomendado de la gráfica |
| Placa y case | El case acepta el formato de la placa (mATX o ATX) |

No valida altura del cooler ni largo de la tarjeta gráfica.

## Tecnologías

React 18 · TypeScript · Vite · Tailwind CSS 4 · componentes shadcn/ui (Radix) · Lucide · Sonner · html-to-image y jsPDF para el presupuesto.

## Cómo ejecutarlo

Requisitos: [Node.js](https://nodejs.org/) 20 o superior.

```bash
npm install
npm run dev        # servidor local, normalmente en http://localhost:5173
npm run build      # versión de producción en /dist
npm run preview    # probar la versión de producción
```

## Estructura

```
src/app/
├── App.tsx                  Página principal y flujo del configurador
├── components/
│   ├── SiteChrome.tsx       Barra superior y menú
│   ├── Landing.tsx          Portada, equipos listos, cómo comprar, la tienda
│   ├── ComponentCard.tsx    Tarjeta de cada pieza
│   ├── BuildSummary.tsx     Resumen del equipo, totales y botones
│   ├── CheckoutDialog.tsx   Finalizar pedido (WhatsApp o local)
│   ├── LoginPage.tsx        Registro e ingreso
│   └── ui/                  Componentes base (shadcn/ui)
├── data/
│   ├── store-info.ts        WhatsApp, Instagram, dirección, IVA
│   ├── pc-components.ts     Catálogo y precios
│   └── presets.ts           Equipos listos
├── utils/
│   ├── compatibility.ts     Reglas de compatibilidad
│   └── build-performance.ts Nivel de rendimiento y juegos
└── lib/
    ├── auth.ts              Cuentas (demo local)
    ├── builds.ts            Builds guardados y autoguardado
    └── orders.ts            Código y mensaje del pedido
public/img/components/       Imágenes de los productos
scripts/                     Generador de ilustraciones
```

## Personalizar para la tienda

| Qué cambiar | Dónde |
|---|---|
| WhatsApp, Instagram, dirección, RIF, tasa de IVA | `src/app/data/store-info.ts` |
| Productos, precios y stock | `src/app/data/pc-components.ts` |
| Equipos listos | `src/app/data/presets.ts` (usa los `id` del catálogo) |
| Colores de la marca | variables `--t27-*` en `src/styles/globals.css` |

### Imágenes de productos

Cada pieza busca su imagen en `public/img/components/` en este orden:

1. `<id>.webp`: **foto real** del producto (tiene prioridad).
2. `<id>.svg`: ilustración incluida en el proyecto.
3. Un icono, si no existe ninguna.

Para usar fotos reales, guarda cada una con el `id` de la pieza (por ejemplo `gpu-3.webp`), de unos 400×300 px y menos de 40 KB. Si cambias el catálogo y quieres regenerar las ilustraciones:

```bash
npx tsc --outDir .tmp --module commonjs --target es2020 --skipLibCheck src/app/data/pc-components.ts
node scripts/export-catalog.cjs > catalog.json
python3 scripts/generate-product-images.py catalog.json
```

## Publicarlo en internet

El repositorio incluye un flujo de GitHub Actions que publica el sitio en GitHub Pages cada vez que se sube a la rama `main`. Los pasos están en [`docs/PUBLICAR_EN_GITHUB.md`](docs/PUBLICAR_EN_GITHUB.md).

## Limitaciones conocidas

- **No hay servidor.** El pedido llega a la tienda cuando el cliente envía el mensaje de WhatsApp. Las cuentas, los builds y los pedidos se guardan en el navegador (`localStorage`); la contraseña se guarda con hash SHA-256 solo para la demo.
- **Los precios y el stock son referenciales** y deben confirmarse con la tienda.
- El catálogo es pequeño (36 piezas, 3 plataformas) y está pensado para la demostración.

## Trabajo futuro

- API y base de datos para cuentas, pedidos e inventario real (con contraseñas cifradas en el servidor).
- Panel para que la tienda vea y gestione los pedidos y edite precios y stock.
- Más reglas de compatibilidad (cooler, largo de gráfica, consumo real).
- Fotos reales de todos los productos y más marcas.

## Créditos

Logo y datos de contacto © Twenty Seven Tech. Ver [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md) para las demás atribuciones.
