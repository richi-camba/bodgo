# BodGo

Red de microbodegas urbanas para el e-commerce de las PyMEs chilenas.

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

**3. Capacidad en m³, no sólo en m².** Los metros cuadrados contratados se
traducen a volumen apilable a 1,8 m de altura — 12 m² son 21,6 m³ útiles. Cada
envío se contrasta contra esa capacidad antes de salir.

## Stack

| Pieza | Qué es |
|---|---|
| `apps/web` | Next.js 15 (App Router, React 19, Tailwind v4). Web pública + apps PyME, Bodeguero y Admin |
| `packages/core` | Lógica de negocio pura: tarifas, custodia, volumen, conciliación. Sin dependencias de framework — se reutiliza tal cual desde Expo |
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

### Tests

```bash
pnpm test         # lógica de negocio (vitest)
pnpm typecheck
```

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

## Pagos

El prototipo declara Transbank. Mientras no exista el convenio, el proveedor
`demo` simula el cobro: la tarjeta terminada en `4242` aprueba y la `0002`
rechaza por fondos insuficientes. El punto de integración está aislado en
`create_contract` — cambiar de proveedor no toca el resto del sistema.

## Licencia

Propiedad de Tamayaz SpA. Todos los derechos reservados.
