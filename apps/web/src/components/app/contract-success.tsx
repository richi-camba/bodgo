import Link from 'next/link';
import { Icon, type IconName } from '@/components/ui/icon';
import { formatCLP, formatNumber } from '@bodgo/core';

type Props = {
  contractNo: string;
  comuna: string;
  m2: number;
  total: number;
  bodeguero: string;
  telefono: string | null;
  direccion: string | null;
};

/**
 * Confirmación de contrato.
 *
 * No termina en «listo»: entrega los datos que la PyME necesita para el paso
 * siguiente —dónde despachar, en qué horario y a quién preguntar— porque ese
 * es el momento en que va a buscarlos.
 */
export function ContractSuccess({
  contractNo,
  comuna,
  m2,
  total,
  bodeguero,
  telefono,
  direccion,
}: Props) {
  const datos: { icon: IconName; label: string; valor: string }[] = [
    { icon: 'ubicacion', label: 'Dirección de la bodega', valor: direccion ?? `Zona ${comuna}` },
    {
      icon: 'reloj',
      label: 'Horario de recepción',
      valor: 'Lun a Vie 9:00–19:00 · Sáb 10:00–14:00',
    },
    {
      icon: 'bodegueros',
      label: 'Contacto en bodega',
      valor: telefono ? `${bodeguero} · ${telefono}` : bodeguero,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center pt-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-700">
          <Icon name="listo" size={30} />
        </span>
        <h1 className="mt-4 text-[24px] font-extrabold tracking-tight text-navy-900">
          Pago en custodia ✓
        </h1>
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-ink-500">
          Reservaste <strong className="font-bold text-navy-900">{comuna}</strong> (
          {formatNumber(m2, 0)} m²). Liberaremos el pago a {bodeguero} cuando confirme la
          recepción.
        </p>
      </div>

      <dl className="space-y-2.5 rounded-[16px] bg-white p-4 text-[13.5px]">
        <Linea label="N° de contrato" valor={contractNo} />
        <Linea label="Superficie" valor={`${formatNumber(m2, 0)} m² · mensual`} />
        <Linea label="Total" valor={formatCLP(total)} />
      </dl>

      <section className="rounded-[16px] bg-white p-4">
        <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-navy-900">
          <Icon name="envios" size={17} className="text-brand-600" />
          Cómo enviar tu mercancía
        </h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
          Ya puedes despachar tu stock a la bodega. Estos son los datos de recepción:
        </p>

        <dl className="mt-4 space-y-3.5">
          {datos.map((d) => (
            <div key={d.label} className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-ink-400">
                <Icon name={d.icon} size={15} />
              </span>
              <div>
                <dt className="text-[11.5px] text-ink-500">{d.label}</dt>
                <dd className="text-[13.5px] font-bold text-navy-900">{d.valor}</dd>
              </div>
            </div>
          ))}

          <div className="flex gap-3">
            <span className="mt-0.5 shrink-0 text-ink-400">
              <Icon name="listo" size={15} />
            </span>
            <div>
              <dt className="text-[11.5px] text-ink-500">Antes de enviar</dt>
              <dd className="text-[13px] leading-relaxed text-ink-700">
                Etiqueta cada bulto con tu nombre de negocio y el N° de contrato. El bodeguero
                confirmará la recepción con foto.
              </dd>
            </div>
          </div>
        </dl>

        <p className="mt-4 rounded-[12px] bg-brand-50 p-3.5 text-[12.5px] leading-relaxed text-navy-800">
          Arma el envío desde{' '}
          <Link href="/app/despachos/nuevo" className="font-bold underline">
            Envíos a bodega
          </Link>{' '}
          para que el bodeguero reciba el manifiesto y cuente contra él.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        <Link
          href="/app/despachos/nuevo"
          className="flex h-12 items-center justify-center rounded-field border border-line-200 bg-white text-[14px] font-bold text-navy-800 transition-colors hover:border-navy-800"
        >
          Preparar envío
        </Link>
        <Link
          href="/app"
          className="flex h-12 items-center justify-center rounded-field bg-navy-800 text-[14px] font-bold text-white transition-colors hover:bg-navy-950"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}

function Linea({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-bold text-navy-900 tabular-nums">{valor}</dd>
    </div>
  );
}
