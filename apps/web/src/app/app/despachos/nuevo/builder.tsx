'use client';

import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createShipment, type ActionState } from '@/app/app/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, Textarea } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { PhotoCapture } from '@/components/app/photo-capture';
import { StepHeader, StickyBar } from '@/components/app/step-header';
import { checkCapacityM3, formatNumber, shipmentVolumeM3, USABLE_STACK_HEIGHT_M } from '@bodgo/core';

type Contract = {
  id: string;
  warehouseId: string;
  comuna: string;
  m2: number;
  capacityM3: number;
  bodeguero: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  unitVolumeM3: number;
};

/** El sexto paso es el seguimiento, y vive en la ficha del envío ya creado. */
const TOTAL_PASOS = 6;

/**
 * Armado de un envío a bodega, en los pasos del prototipo.
 *
 * Los cinco primeros pasos son de carga y viven en el cliente: hasta que no se
 * confirma no hay borrador en la base ni aviso al bodeguero, porque un envío a
 * medio armar no le sirve a nadie y le ensuciaría la bandeja. Al crearlo se
 * salta a la ficha, que es el paso 6 —el seguimiento.
 */
export function ShipmentBuilder({
  contracts,
  products,
  defaultPickupAddress,
}: {
  contracts: Contract[];
  products: Product[];
  defaultPickupAddress: string;
}) {
  const [paso, setPaso] = useState(1);
  const [contractId, setContractId] = useState(contracts[0]!.id);
  const [descripcion, setDescripcion] = useState('');
  const [bultos, setBultos] = useState(1);
  const [peso, setPeso] = useState('');
  const [retiro, setRetiro] = useState(defaultPickupAddress);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<'own' | 'external_courier'>('own');
  const [foto, setFoto] = useState('');
  const [state, action] = useActionState<ActionState, FormData>(createShipment, null);

  const contract = contracts.find((c) => c.id === contractId)!;

  const items = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([productId, qty]) => ({ productId, qty })),
    [quantities],
  );

  const volume = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return shipmentVolumeM3(
      items.map((i) => ({
        unitVolumeM3: byId.get(i.productId)?.unitVolumeM3 ?? 0,
        quantity: i.qty,
      })),
    );
  }, [items, products]);

  const capacity = checkCapacityM3(volume, contract.capacityM3);
  const unidades = items.reduce((s, i) => s + i.qty, 0);

  const puedeAvanzar =
    paso === 1 ? Boolean(contractId)
    : paso === 2 ? descripcion.trim().length >= 3 && bultos >= 1
    : paso === 3 ? items.length > 0
    : paso === 4 ? Boolean(method)
    : Boolean(foto);

  const TITULOS = [
    '',
    '¿A qué bodega envías?',
    'Detalle de la mercancía',
    'Detalle de inventario',
    'Método de envío',
    'Foto de los bultos',
  ];

  const BAJADAS = [
    '',
    'Selecciona una de tus bodegas contratadas.',
    `Describe lo que enviarás a ${contract.comuna}.`,
    'Marca qué productos van en este envío y cuántas unidades. El bodeguero verifica contra esta lista al recibir.',
    '¿Cómo llevas tu mercadería a la bodega?',
    'Fotografía los bultos etiquetados antes de despachar. Es tu respaldo si hay diferencias en la recepción.',
  ];

  /** Marcar el producto lo suma con una unidad; desmarcarlo lo saca del manifiesto. */
  function toggle(id: string) {
    setQuantities((q) => ({ ...q, [id]: q[id] ? 0 : 1 }));
  }

  function setQty(id: string, value: number) {
    setQuantities((q) => ({ ...q, [id]: Math.max(1, value) }));
  }

  return (
    <form action={action} className="pb-28">
      <StepHeader titulo="Envío a bodega" paso={paso} total={TOTAL_PASOS} volverA="/app/despachos" />

      {/* Los campos viajan ocultos: se ve sólo el paso actual, pero al confirmar
          se manda el formulario entero. */}
      <input type="hidden" name="warehouseId" value={contract.warehouseId} />
      <input type="hidden" name="contractId" value={contract.id} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="method" value={method} />
      <input type="hidden" name="description" value={descripcion} />
      <input type="hidden" name="packagesCount" value={bultos} />
      <input type="hidden" name="weightKg" value={peso} />
      <input type="hidden" name="pickupAddress" value={retiro} />
      <input type="hidden" name="photoPath" value={foto} />

      <h2 className="text-[19px] font-extrabold tracking-tight text-navy-900">{TITULOS[paso]}</h2>
      <p className="mb-4 mt-1 text-[13px] leading-relaxed text-ink-500">{BAJADAS[paso]}</p>

      {/* ------------------------------------------------------- paso 1 */}
      {paso === 1 ? (
        <ul className="space-y-2.5">
          {contracts.map((c) => {
            const activo = contractId === c.id;
            return (
              <li key={c.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-[16px] bg-white p-3.5 transition-colors ${
                    activo ? 'border-2 border-navy-800' : 'border border-line-200 hover:border-line-300'
                  }`}
                >
                  <span aria-hidden className="h-[46px] w-[46px] shrink-0 rounded-[12px] bg-rayado" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold text-navy-900">{c.comuna}</span>
                    <span className="mt-0.5 block text-[12px] text-ink-500">
                      {formatNumber(c.m2, 0)} m² · {c.bodeguero}
                    </span>
                  </span>
                  <input
                    type="radio"
                    name="destino"
                    checked={activo}
                    onChange={() => setContractId(c.id)}
                    className="sr-only"
                  />
                  <Radio activo={activo} />
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* ------------------------------------------------------- paso 2 */}
      {paso === 2 ? (
        <div className="space-y-3.5">
          <Field label="Descripción" htmlFor="descripcion">
            <Textarea
              id="descripcion"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ropa de temporada — cajas surtidas"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="N° de bultos" htmlFor="bultos">
              <Input
                id="bultos"
                type="number"
                min={1}
                value={bultos}
                onChange={(e) => setBultos(Math.max(1, Number(e.target.value)))}
              />
            </Field>
            <Field label="Peso aprox. (kg)" htmlFor="peso">
              <Input
                id="peso"
                type="number"
                min={0}
                step="0.1"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="18"
              />
            </Field>
          </div>

          <Field label="Dirección de retiro" htmlFor="retiro">
            <Input
              id="retiro"
              value={retiro}
              onChange={(e) => setRetiro(e.target.value)}
              placeholder="Av. Providencia 1550, of. 402"
            />
          </Field>

          <Aviso icon="bultos">
            Etiqueta cada bulto con el código que generaremos para agilizar la recepción del
            bodeguero.
          </Aviso>
        </div>
      ) : null}

      {/* ------------------------------------------------------- paso 3 */}
      {paso === 3 ? (
        <div>
          <ul className="space-y-2.5">
            {products.map((p) => {
              const qty = quantities[p.id] ?? 0;
              const elegido = qty > 0;
              return (
                <li
                  key={p.id}
                  className={`rounded-[15px] bg-white p-3.5 ${
                    elegido ? 'border-[1.5px] border-brand-600' : 'border-[1.5px] border-line-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      id={`sel-${p.id}`}
                      type="checkbox"
                      checked={elegido}
                      onChange={() => toggle(p.id)}
                      className="h-[22px] w-[22px] shrink-0 cursor-pointer appearance-none rounded-[7px] border-2 border-line-300 bg-white bg-center bg-no-repeat checked:border-brand-600 checked:bg-brand-600 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223.2%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M20 6L9 17l-5-5%22/></svg>')] checked:bg-[length:13px_13px]"
                    />

                    <label htmlFor={`sel-${p.id}`} className="min-w-0 flex-1 cursor-pointer">
                      <span className="block truncate text-[14px] font-bold text-navy-900">
                        {p.name}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-ink-500">
                        {p.sku}
                        {p.category ? ` · ${p.category}` : ''} ·{' '}
                        {formatNumber(p.unitVolumeM3 * 1000, 1)} L/u
                      </span>
                      {elegido ? (
                        <span className="mt-[3px] block text-[11.5px] font-bold text-brand-600">
                          {formatNumber(qty * p.unitVolumeM3, 2)} m³
                        </span>
                      ) : null}
                    </label>

                    {elegido ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <Mini
                          label={`Quitar una unidad de ${p.name}`}
                          tono="gris"
                          onClick={() => setQty(p.id, qty - 1)}
                          disabled={qty <= 1}
                        >
                          −
                        </Mini>
                        <label className="sr-only" htmlFor={`qty-${p.id}`}>
                          Unidades de {p.name}
                        </label>
                        <input
                          id={`qty-${p.id}`}
                          type="number"
                          min={1}
                          value={qty}
                          onChange={(e) => setQty(p.id, Number(e.target.value))}
                          className="h-8 w-14 rounded-[9px] border border-line-200 text-center text-[14px] font-extrabold text-navy-800 tabular-nums"
                        />
                        <Mini
                          label={`Agregar una unidad de ${p.name}`}
                          tono="azul"
                          onClick={() => setQty(p.id, qty + 1)}
                        >
                          +
                        </Mini>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          {items.length ? (
            <>
              <Volumen capacity={capacity} volume={volume} contractM2={contract.m2} />
              <div className="mt-3 flex items-center justify-between gap-4 rounded-[15px] bg-navy-800 px-4 py-3.5 text-white">
                <div>
                  <p className="text-[13.5px] font-extrabold">Manifiesto del envío</p>
                  <p className="mt-[3px] text-[11.5px] text-white/70">
                    {items.length} {items.length === 1 ? 'producto seleccionado' : 'productos seleccionados'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[22px] font-extrabold leading-none tracking-tight tabular-nums">
                    {formatNumber(unidades)}
                  </p>
                  <p className="mt-1 text-[11px] text-white/70">unidades</p>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-4 text-[12.5px] leading-relaxed text-ink-500">
              Selecciona al menos un producto para continuar.
            </p>
          )}
        </div>
      ) : null}

      {/* ------------------------------------------------------- paso 4 */}
      {paso === 4 ? (
        <div className="space-y-3">
          <Metodo
            activo={method === 'own'}
            icon="envios"
            tono="azul"
            titulo="Envío propio"
            texto="Tú o tu conductor lleva la mercadería"
            onClick={() => setMethod('own')}
          />
          <Metodo
            activo={method === 'external_courier'}
            icon="externo"
            tono="gris"
            titulo="App de delivery externa"
            texto="Usa tu propio courier (Uber, PedidosYa…)"
            onClick={() => setMethod('external_courier')}
          />
        </div>
      ) : null}

      {/* ------------------------------------------------------- paso 5 */}
      {paso === 5 ? (
        <PhotoCapture
          name="fotoVisible"
          folder="despachos"
          hint="Con todos los bultos y etiquetas a la vista"
          onSubido={setFoto}
        />
      ) : null}

      <div className="mt-4">
        <FormError>{state?.error}</FormError>
      </div>

      <StickyBar>
        <div className="flex items-center gap-3">
          {paso > 1 ? (
            <Button type="button" variant="secondary" size="lg" onClick={() => setPaso((p) => p - 1)}>
              Atrás
            </Button>
          ) : null}

          <div className="flex-1">
            {paso < 5 ? (
              <Button
                type="button"
                size="lg"
                full
                disabled={!puedeAvanzar}
                onClick={() => setPaso((p) => p + 1)}
              >
                Continuar
              </Button>
            ) : (
              <Continuar listo={puedeAvanzar} />
            )}
          </div>
        </div>
      </StickyBar>
    </form>
  );
}

function Continuar({ listo }: { listo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={!listo || pending}>
      {pending ? 'Creando el envío…' : 'Continuar'}
    </Button>
  );
}

/**
 * Volumen declarado contra la capacidad contratada.
 *
 * El aviso llega antes de despachar, que es cuando todavía se puede dividir el
 * envío o ampliar el contrato; enterarse en la recepción ya es tarde.
 */
function Volumen({
  capacity,
  volume,
  contractM2,
}: {
  capacity: ReturnType<typeof checkCapacityM3>;
  volume: number;
  contractM2: number;
}) {
  const color = capacity.exceeds
    ? 'text-danger-700'
    : capacity.percentUsed > 85
      ? 'text-warning-700'
      : 'text-success-700';
  const barra = capacity.exceeds
    ? 'bg-danger-600'
    : capacity.percentUsed > 85
      ? 'bg-warning-600'
      : 'bg-success-600';

  return (
    <section className="card mt-4 p-4">
      <div className="flex items-center gap-2.5">
        <span className="text-brand-600">
          <Icon name="volumen" size={17} />
        </span>
        <h3 className="text-[14px] font-extrabold text-navy-900">Volumen del envío</h3>
      </div>

      <div className="mt-3.5 flex gap-2.5">
        <Caja rotulo="Volumen total" valor={`${formatNumber(volume, 2)} m³`} />
        <Caja rotulo="Capacidad contratada" valor={`${formatNumber(capacity.capacityM3, 1)} m³`} />
      </div>

      <div className="mb-2 mt-4 flex items-center justify-between gap-3 text-[12px]">
        <span className="text-ink-500">
          Ocupa de tu capacidad ({formatNumber(contractM2, 0)} m² ·{' '}
          {formatNumber(capacity.capacityM3, 1)} m³)
        </span>
        <span className={`font-extrabold ${color}`}>{capacity.percentUsed}%</span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={Math.min(100, capacity.percentUsed)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Ocupación de la capacidad contratada"
        className="h-2 overflow-hidden rounded-pill bg-line-100"
      >
        <div
          className={`h-full rounded-pill transition-[width] ${barra}`}
          style={{ width: `${Math.min(100, capacity.percentUsed)}%` }}
        />
      </div>

      <p className="mt-2.5 text-[11px] text-ink-500">
        Capacidad estimada con apilado hasta {formatNumber(USABLE_STACK_HEIGHT_M, 1)} m de altura
      </p>

      {capacity.exceeds ? (
        <p className="mt-3.5 flex gap-2.5 rounded-[12px] bg-danger-50 p-3 text-[12px] leading-relaxed text-danger-700">
          <span className="mt-px shrink-0">
            <Icon name="discrepancias" size={16} />
          </span>
          Excedes tu capacidad en {formatNumber(capacity.excessM3, 2)} m³. Puedes ampliar el
          contrato o dividir el envío; si llega así, el bodeguero puede rechazar el excedente.
        </p>
      ) : (
        <p className="mt-3.5 flex items-center gap-2.5 rounded-[12px] bg-success-50 p-3 text-[12px] font-semibold text-success-700">
          <span className="shrink-0">
            <Icon name="listo" size={16} />
          </span>
          Cabe en tu espacio contratado.
        </p>
      )}
    </section>
  );
}

function Caja({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex-1 rounded-[12px] bg-surface-50 p-3">
      <p className="text-[11px] font-semibold text-ink-500">{rotulo}</p>
      <p className="mt-1 text-[20px] font-extrabold text-navy-800 tabular-nums">{valor}</p>
    </div>
  );
}

function Metodo({
  activo,
  icon,
  tono,
  titulo,
  texto,
  onClick,
}: {
  activo: boolean;
  icon: 'envios' | 'externo';
  tono: 'azul' | 'gris';
  titulo: string;
  texto: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[16px] bg-white p-3.5 text-left transition-colors ${
        activo ? 'border-2 border-navy-800' : 'border border-line-200 hover:border-line-300'
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ${
          tono === 'azul' ? 'bg-brand-50 text-brand-600' : 'bg-surface-100 text-ink-500'
        }`}
      >
        <Icon name={icon} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-navy-900">{titulo}</span>
        <span className="mt-0.5 block text-[12px] text-ink-500">{texto}</span>
      </span>
      <Radio activo={activo} />
    </button>
  );
}

function Radio({ activo }: { activo: boolean }) {
  return (
    <span
      aria-hidden
      className={`h-[22px] w-[22px] shrink-0 rounded-full ${
        activo ? 'border-[7px] border-navy-800' : 'border-2 border-line-300'
      }`}
    />
  );
}

function Aviso({ icon, children }: { icon: 'bultos'; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-[13px] bg-brand-50 p-3.5">
      <span className="mt-px shrink-0 text-brand-600">
        <Icon name={icon} size={16} />
      </span>
      <p className="text-[12px] leading-relaxed text-navy-800">{children}</p>
    </div>
  );
}

function Mini({
  children,
  label,
  tono,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  tono: 'gris' | 'azul';
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-[9px] text-[17px] font-bold transition-colors disabled:text-ink-400 ${
        tono === 'azul'
          ? 'bg-brand-50 text-brand-600 hover:bg-brand-100'
          : 'bg-surface-100 text-navy-800 hover:bg-line-100 disabled:hover:bg-surface-100'
      }`}
    >
      {children}
    </button>
  );
}
