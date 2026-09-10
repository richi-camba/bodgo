# BodGo

Red de microbodegas urbanas para el e-commerce de las PyMEs chilenas.

**En vivo:** https://bodgo.vercel.app

Una PyME que vende online no puede arrendar una bodega completa ni tener su stock
lejos de sus clientes. BodGo conecta esa PyME con vecinos que tienen un espacio de
8 a 15 m² desocupado: la PyME arrienda los metros que necesita cerca de su demanda,
manda su mercadería con un manifiesto, y el bodeguero recibe, cuenta, guarda y
prepara los pedidos.

**Tamayaz SpA** · Proyecto financiado por Corfo, instrumento Semilla Inicia
(25INI2-312540), con el patrocinio de Innovo.

---

## Cómo funciona el modelo

Tres piezas sostienen el negocio, y las tres viven en la base de datos, no en el
cliente:

**1. Pago en custodia.** A la PyME se le cobra por adelantado al contratar y el
monto queda retenido (`payments.status = 'held'`). Al bodeguero se le paga a fin
de mes, neto del 15% de comisión. La custodia se libera recién cuando el
bodeguero confirma que recibió lo que se declaró. Si el contrato se corta antes,
se prorratea sobre 30 días: el bodeguero cobra los días usados y el resto vuelve
a la PyME.

**2. Conciliación de recepción.** El envío lleva un manifiesto con SKU y
cantidades. El bodeguero cuenta línea a línea y mide el volumen real. Si algo no
calza, se abre una discrepancia, se avisa a la PyME y la plata sigue retenida.
El inventario suma lo *recibido*, nunca lo declarado.

**3. El stock que se ve es el que llegó, y se puede auditar.** Cada producto
lleva un objetivo de stock opcional: sin él la ficha muestra el número solo,
con él aparece la barra y el aviso de reposición. La conciliación contra el
conteo físico del bodeguero se muestra tal cual está — si nadie contó a mano,
lo dice, en vez de inventar un número que cuadre.

**4. Capacidad en m³, no sólo en m².** Los metros cuadrados contratados se
traducen a volumen apilable a 1,8 m de altura — 12 m² son 21,6 m³ útiles. Cada
envío se contrasta contra esa capacidad antes de salir.

**5. El último tramo va por courier externo.** BodGo no tiene flota. Al
comprador se le cobra el envío por zona —la distancia se calcula de verdad,
bodega a centro de comuna con factor de rodeo urbano— y después se registra con
qué courier se despachó, cuánto costó realmente y con qué comprobante. La
diferencia entre lo cobrado y lo pagado es el margen de la PyME en el despacho.
Sin courier registrado el pedido no se puede marcar como retirado: el comprador
quedaría sin forma de seguirlo.

**6. El comprador sigue su pedido sin cuenta.** Cada pedido lleva un token
aleatorio propio, porque el código correlativo (DSP-3406) sería adivinable. El
enlace muestra el estado, el courier y lo que compró — nunca lo que el envío le
costó a la PyME ni la dirección de la bodega.

## Stack

| Pieza | Qué es |
|---|---|
| `apps/web` | Next.js 15 (App Router, React 19, Tailwind v4). Web pública, seguimiento del comprador y apps PyME, Bodeguero y Admin |
| `packages/core` | Lógica de negocio pura: tarifas, custodia, volumen, conciliación, zonas de despacho y distancias. Sin dependencias de framework — se reutiliza tal cual desde Expo |
| `packages/db` | Tipos generados del esquema y helpers de cliente |
| `supabase/` | Migraciones, RLS y funciones transaccionales |

Las apps móviles del prototipo se implementan como web responsive/PWA. La lógica
vive en `packages/core` justamente para que una app Expo posterior la importe sin
reescribir nada.

## Empezar

```bash
pnpm install
cp .env.example apps/web/.env.local   # y completar con las claves del proyecto
pnpm dev
```

La app queda en http://localhost:3000.

### Base de datos

```bash
supabase link --project-ref <ref>
pnpm db:push      # aplica las migraciones
pnpm db:types     # regenera packages/db/src/database.types.ts
```

Después de cualquier migración hay que regenerar los tipos: el build falla si el
esquema y `database.types.ts` no coinciden.

### Datos de demostración

```bash
pnpm db:seed      # crea la red de prueba (idempotente)
```

Siembra 8 microbodegas en 8 comunas de Santiago, dos PyMEs con catálogo y
stock objetivo, contratos vigentes, envíos en distintos estados —incluido uno
con discrepancia—, conteos físicos (uno cuadrado y otro con diferencia),
pedidos, una liquidación e incidentes de red. Las cuentas
comparten la contraseña de `BODGO_DEMO_PASSWORD`:

| Rol | Cuenta | Qué se ve al entrar |
|---|---|---|
| PyME | `valentina@boutiquelua.cl` | Contrato en Providencia, 5 pedidos en distintos estados, un envío en camino |
| PyME | `diego@casanorte.cl` | Un envío recibido **con discrepancia** — el caso interesante |
| Bodeguero | `marcela.rios@gmail.com` | Dos espacios, una recepción por verificar, 4 pedidos por preparar |
| Bodeguero | `rodrigo.pena@gmail.com` | Las Condes y Vitacura, sin operación todavía |
| Admin | `admin@bodgo.cl` | La red completa, la discrepancia abierta y los contactos de la web |

También existen `carolina.soto@`, `ignacio.vera@`, `paula.mendez@` y
`tomas.reyes@gmail.com`: bodegueros con un espacio publicado cada uno, para
que el buscador tenga variedad.

El seguimiento del comprador no pide cuenta. Los enlaces salen de
`orders.tracking_token`:

```bash
pnpm db:seed   # los imprime al final si necesitas los actuales
```

### Tests

```bash
pnpm test         # lógica de negocio (vitest)
pnpm typecheck
pnpm smoke        # operaciones y RLS contra la base real
```

La prueba de humo es la que vale para el backend: contrata con la custodia,
confirma una recepción con diferencia, verifica que el pago no se libere y que
el inventario sume lo recibido, comprueba que un pedido no se pueda despachar
sin registrar el courier, y que el enlace del comprador no exponga ni el costo
real del envío ni la tabla de pedidos. Levanta su propia microbodega y la borra
al terminar, así que es segura de correr sobre la base sembrada.

## Seguridad

- **Toda tabla tiene RLS activo.** Lo que no tiene política, no se lee. La clave
  publicable que viaja al navegador no da acceso a nada por sí sola.
- **Lo público sale por vistas**, no por políticas permisivas: `warehouse_listings`
  omite la dirección exacta a propósito (se revela con el contrato firmado), y
  `public_profiles` expone sólo nombre, rol y avatar. El contacto y los datos
  tributarios viven en tablas cerradas.
- **La plata y el stock se mueven por funciones transaccionales** en Postgres
  (`create_contract`, `confirm_reception`, `advance_order`, `terminate_contract`),
  no por escrituras sueltas del cliente.
- **`SUPABASE_SERVICE_ROLE_KEY` salta RLS.** Sólo servidor, nunca con prefijo
  `NEXT_PUBLIC_`, nunca en un commit.
- **La contraseña de las cuentas de demostración no está en el repositorio.**
  Sale de `BODGO_DEMO_PASSWORD` en `.env.local`: este repo es público y el
  sitio desplegado usa la misma base, así que una constante en el código sería
  la llave del backoffice publicada en GitHub.

## Pendiente de revisión legal

`/terminos` y `/privacidad` describen con precisión cómo funciona la
plataforma —la custodia, las discrepancias, qué datos se guardan y con quién
se comparten— pero **no los revisó un abogado**. Antes de abrir el registro a
usuarios reales tienen que pasar por revisión legal en Chile: la Ley 19.628
(y la 21.719, que la sustituye) imponen obligaciones concretas sobre
tratamiento de datos, y el registro hace que el usuario acepte los Términos al
crear su cuenta.

## Lo que falta

- **Carga masiva del catálogo por CSV.** El prototipo pone el botón junto a
  «Crear producto». Hoy los productos se crean de a uno.
- **Enviar el enlace de seguimiento solo.** El prototipo prometía mandarlo por
  correo y WhatsApp al guardarlo. Sin proveedor de correo contratado, decir que
  se envía sería mentira: hoy se copia o se abre WhatsApp con el mensaje ya
  escrito.
- **Courier integrado por API.** `delivery_method` reserva el valor
  `integrated_courier` para el día que se integre una flota tipo Cabify. Hoy no
  se puede elegir al crear un pedido.
- **Envío real de correos.** El enlace de recuperación de contraseña sale por
  el proveedor por defecto de Supabase, que tiene cuota baja y no sirve para
  producción. Hay que conectar un SMTP propio (Resend, Postmark) en el panel
  de Supabase.
- **Variables de entorno de *preview* en Vercel.** Producción está completa;
  los despliegues de rama necesitan que se carguen desde el panel.

## Decisiones de diseño

- **Los colores de texto pasan AA, y se midió.** Una auditoría sobre las
  páginas renderizadas encontró 36 textos bajo el 4.5:1 de la WCAG. El gris
  claro del prototipo (`#93A1B4`) quedaba en 2.6:1 — ilegible para bastante
  gente, y no era una decisión estética sino un descuido. Ahora `ink-400` es
  legible y el gris original sobrevive como `ink-300`, que la norma exceptúa
  por ser sólo para controles deshabilitados. Aun así, un botón apagado se
  puede leer: dice justo lo que falta hacer para habilitarlo. Los semánticos
  vienen en dos tonos: el `-600` rellena, el `-700` escribe sobre el fondo
  teñido.
- **Un flujo por pasos toma la pantalla completa.** Contratar una bodega y
  armar un envío esconden la barra de pestañas y ponen la acción del paso en
  su lugar, como en el prototipo: saltar a otra sección a mitad de un
  formulario largo sólo pierde lo cargado. El envío son seis pasos y el sexto
  es el seguimiento, que ya vive en la ficha del envío — no hay una pantalla
  aparte que repita lo mismo.
- **Iconos, no emoji.** Los emoji se dibujan distinto en cada sistema
  operativo. `components/ui/icon.tsx` nombra cada icono por lo que significa en
  el producto (`recepciones`, `discrepancias`) y no por su forma, así cambiar el
  trazo se hace en un solo lugar.
- **Fotos directo al bucket.** Las fotos de respaldo suben desde el navegador al
  bucket privado y al servidor viaja sólo la ruta: una foto de varios megas no
  pasa por la función. El SDK de Supabase se carga recién al sacar la foto.
- **Lo público sale por vistas y funciones, no por políticas laxas.** El
  buscador de bodegas, los perfiles y el seguimiento del comprador son
  proyecciones deliberadas que listan sus columnas una a una.
- **Cada tema vive en una sola página.** `/precios` y `/para-bodegueros`
  cuentan lo suyo completo; la portada los resume en una tarjeta con la cifra
  real de la red y manda para allá. Contar todo dos veces alarga la portada,
  compite consigo mismo en el buscador y obliga a actualizar dos lugares
  cuando cambia un precio. Las preguntas frecuentes están repartidas por
  audiencia con el mismo criterio: cada página abre con la que le importa a
  quien la está leyendo.
- **Sin testimonios inventados.** El prototipo tenía un carrusel de citas de
  PyMEs. Con cero clientes reales, publicarlas en un sitio en línea sería
  fabricar prueba social: en su lugar la portada muestra respaldos
  comprobables — la custodia, el seguro, la verificación de espacios.
- **La fotografía es la del prototipo**, en `public/fotos/`. Venía en PNG
  (4,5 MB); convertida a JPEG queda en 413 KB y `next/image` la sirve en WebP
  con srcset. El logo de Corfo va en sus colores sobre fondo blanco: la marca
  de un organismo público no se recolorea.

## Pagos

El prototipo declara Transbank. Mientras no exista el convenio, el proveedor
`demo` simula el cobro: la tarjeta terminada en `4242` aprueba y la `0002`
rechaza por fondos insuficientes. El punto de integración está aislado en
`create_contract` — cambiar de proveedor no toca el resto del sistema.

## Despliegue

Vercel, región `gru1` (São Paulo), con la base Supabase en la misma región. El
repositorio está conectado: cada push a `main` despliega a producción.

```bash
vercel deploy --prod
```

El *Root Directory* del proyecto es `apps/web`; Vercel resuelve el workspace
pnpm desde la raíz por su cuenta.

## Licencia

Propiedad de Tamayaz SpA. Todos los derechos reservados.
