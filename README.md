# BodGo

Red de microbodegas urbanas para el e-commerce de las PyMEs chilenas.

**En vivo:** https://bodgo.cl

Una PyME que vende online no puede arrendar una bodega completa ni tener su stock
lejos de sus clientes. BodGo conecta esa PyME con vecinos que tienen un espacio
desocupado que se pueda dividir en módulos: la PyME arrienda los metros que
necesita cerca de su demanda,
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
de mes, neto del 10% de comisión. La custodia se libera recién cuando el
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

**6. Cada quien habla con quien le toca.** El chat es entre PyME y bodeguero,
uno por bodega, para la coordinación del día a día. Los tickets son con el
equipo BodGo y los mueve sólo el equipo: quien abre uno puede seguir
respondiendo, pero no darse por atendido solo.

**7. El comprador sigue su pedido sin cuenta.** Cada pedido lleva un token
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
| PyME | `valentina@boutiquelua.cl` | Dos contratos (Providencia y Las Condes), envíos y pedidos en distintos estados — la cuenta más completa |
| PyME | `diego@casanorte.cl` | Un envío recibido **con discrepancia** — el caso interesante |
| Bodeguero | `marcela.rios@gmail.com` | Dos espacios, recepciones por verificar, pedidos por preparar |
| Bodeguero | `rodrigo.pena@gmail.com` | Vitacura y Las Condes, con un contrato ya recibido |
| Admin | `admin@bodgo.cl` | La red completa, la discrepancia abierta y los contactos de la web |

El seed es idempotente pero no borra: si alguien contrata o despacha desde la
app, ese movimiento queda y la tabla de arriba cambia. Para ver el estado real
en cualquier momento, mira la base, no esta tabla.

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
  omite la dirección exacta a propósito (se revela con el contrato firmado) y
  redondea las coordenadas a tres decimales —unos 110 metros—, porque con el
  par exacto la promesa no se sostenía: basta un geocodificador inverso para
  sacar la calle igual. `public_profiles` expone sólo nombre, rol y avatar. El contacto y los datos
  tributarios viven en tablas cerradas.
- **`host_escrow` es la excepción medida.** El bodeguero no puede leer
  `payments` —ahí están el medio de pago de la PyME, los intentos fallidos y
  el motivo del rechazo— pero sí necesita saber cuánta plata suya está
  retenida. La vista devuelve un agregado, filtrado por `auth.uid()` adentro,
  y la prueba de humo verifica que nadie vea la custodia de otro.
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

Ojo con la cláusula 8: mientras `INSURANCE_POLICY_ACTIVE` esté en `false`,
los términos **afirman** que no hay póliza contratada sobre la mercadería. Es
una declaración legal igual que la anterior y también tiene que pasar por
revisión — decir de más y decir de menos se pagan distinto, pero los dos se
pagan.

## Lo que falta

- **El modelo comercial de sep-2026 está escrito, no implementado.** La
  revisión del cliente («TMA Revision.docx») cambió tres cosas que hoy la
  portada promete y el software no hace. Es lo primero que hay que resolver:

  - *La entrega al comprador va incluida en $3.500 + IVA por despacho.* La app
    hace otra cosa: le cobra el envío al comprador por zona
    (`quoteDeliveryToComuna`), y después la PyME registra con qué courier salió
    y cuánto costó de verdad; la diferencia es su margen. Hay que decidir cuál
    de los dos modelos vale y alinear `orders`, el formulario de pedido y el
    seguimiento.
  - *El bodeguero gana $400 por pedido preparado* (`PICKING_FEE_CLP`, con
    `PICKING_TAX_WITHHOLDING`). No se calcula en ninguna parte: la liquidación
    es sólo arriendo menos comisión.
  - *«Módulos desde 1 m³».* El buscador, los precios, los contratos y la
    capacidad están todos en m², con los m³ derivados apilando a 1,8 m. Si la
    unidad comercial pasa de verdad a módulos de m³, toca buscador, precios y
    contratos.

  Lo que sí se aplicó completo: la comisión del bodeguero bajó a 10% en los dos
  lugares donde vive —`HOST_COMMISSION_RATE` y `host_commission_rate()` en
  Postgres— y las liquidaciones ya emitidas quedaron como estaban.

- **El seguro no existe todavía.** `INSURANCE_POLICY_ACTIVE` está en `false` y
  de él cuelgan las once menciones que había de la cobertura: portada, banda de
  confianza, perfil de la PyME, ayuda, preguntas frecuentes, metadatos, imagen
  para compartir y la cláusula 8 de los términos. En falso, la pregunta «¿está
  asegurada mi mercadería?» contesta que no, y la cláusula 8 dice que no hay
  póliza. Se enciende el día que esté firmada, y ese día `INSURANCE_COVERAGE_CLP`
  tiene que coincidir con la que se firmó. **No publicar la cobertura antes**:
  quien guarda su stock creyendo que hay seguro se entera el día que le pasa
  algo, y ese día ya no se arregla.

- **Registro público bloqueado por la cuota de correo.** Supabase confirma el
  correo con su proveedor por defecto y la cuota es baja: al superarla, el
  alta devuelve «email rate limit exceeded» y nadie puede crear cuenta. Es el
  mismo SMTP pendiente de más abajo, pero acá no degrada una función, la
  corta. Hay que conectar un proveedor propio antes de abrir el registro.

- **Chat en tiempo real.** Los mensajes existen y se mandan, pero llegan al
  recargar: no hay suscripción todavía. Por eso tampoco hay indicador de «en
  línea» — sería decorar una promesa que la app no cumple.
- **Audio y video en el chat.** El esquema los soporta y el prototipo los
  ofrece. Falta el grabador y la reproducción desde el bucket privado; hoy el
  chat es sólo texto.
- **Plazo de respuesta en los tickets.** El prototipo promete «responde en
  ~4 min». Sin turnos de soporte definidos, un número inventado sólo sirve
  para incumplirlo.
- **Agregar tarjeta desde el perfil.** La captura de datos de tarjeta la hace
  el proveedor de pagos. Mientras no exista el convenio, un formulario propio
  pidiendo el número sería pedir datos que no podemos procesar.
- **Verificación en dos pasos.** El prototipo la ofrece por SMS y no hay
  proveedor de mensajería contratado. Un interruptor que no protege nada da
  por segura una cuenta que no lo está.
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
- **Los triggers que hacen contabilidad corren como definer.** Dos daban
  error sólo con usuarios reales: el que mantiene `last_message_at` y el que
  arma el checklist al publicar un espacio. Los dos escriben en tablas que
  por RLS nadie puede tocar a mano —y está bien que así sea, porque no son
  datos del usuario sino del sistema—, así que corrían como el usuario y
  fallaban en silencio o directamente cortaban la operación. El seed no los
  mostraba nunca porque escribe con la clave de servicio. Ahora son
  `security definer` con `search_path` fijo, y la prueba de humo los cubre.
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
- **El CSV se lee una sola vez, en un solo lugar.** El parser de la carga
  masiva vive en `packages/core` porque lo corren los dos lados: el navegador
  para la revisión previa y el servidor para importar. Con un parser por lado,
  lo que se revisa y lo que se guarda podrían no coincidir. Lee el punto y
  coma y la coma decimal que exporta Excel en español, se traga el BOM y no
  parte los nombres que llevan coma adentro.
- **La carga masiva no importa stock.** El prototipo pide las columnas `stock`
  y `bodega`; acá se ignoran y la pantalla dice por qué. Las unidades las
  mueven las recepciones y los pedidos: dejar que un archivo las escriba
  rompería la trazabilidad y la conciliación contra el conteo físico.
- **El mapa es un mapa, no un dibujo.** El prototipo pinta los precios en
  posiciones fijas sobre una trama. Acá van sobre teselas de OpenStreetMap en
  las coordenadas reales, porque la pregunta que lleva a alguien al mapa
  —«¿me queda cerca?»— no se contesta con una ilustración. Leaflet se carga
  recién al abrir la pestaña: la lista es la vista por defecto y no tiene por
  qué pagar esos 40 kB. En la ficha, el sector se dibuja como un círculo y no
  como un punto: hace visible el margen de cien metros en vez de fingir una
  precisión que la fila no tiene.
- **Fotos directo al bucket.** Las fotos de respaldo suben desde el navegador al
  bucket privado y al servidor viaja sólo la ruta: una foto de varios megas no
  pasa por la función. El SDK de Supabase se carga recién al sacar la foto.
- **Lo público sale por vistas y funciones, no por políticas laxas.** El
  buscador de bodegas, los perfiles y el seguimiento del comprador son
  proyecciones deliberadas que listan sus columnas una a una.
- **La portada es una sola página que se recorre**, como el prototipo. Hubo
  un tiempo con `/precios` y `/para-bodegueros` aparte, y terminó repitiendo
  la calculadora y la banda de bodegueros: dos versiones del mismo texto que
  había que mantener sincronizadas. Las dos URLs siguen existiendo como
  redirección 308 a su sección (`#precios`, `#bodegueros`) porque estaban
  indexadas y enlazadas desde fuera. El salto al ancla lo rehace
  `ScrollToHash` con la página ya cargada: el salto nativo del navegador
  ocurre antes de que las fotos reserven su alto y aterriza dos mil píxeles
  más arriba.
- **Lo que no se puede apagar, no se ofrece apagar.** Las preferencias de
  aviso dejan fuera los de pago y recepción: son plata retenida y mercadería
  que llegó. Mostrar el interruptor y mandar el aviso igual sería peor que no
  mostrarlo.
- **Sin testimonios inventados.** El prototipo tenía un carrusel de citas de
  PyMEs. Con cero clientes reales, publicarlas en un sitio en línea sería
  fabricar prueba social: en su lugar la portada muestra respaldos
  comprobables — la custodia, la recepción contada y fotografiada, la
  verificación de espacios.
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
