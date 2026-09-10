import { Icon, type IconName } from '@/components/ui/icon';

/**
 * «Cómo funciona BodGo»: carrusel horizontal de tres pasos.
 *
 * Los degradados, el número fantasma y sus opacidades crecientes salen medidos
 * del prototipo — el navy abre y va aclarando hacia el azul de marca, que es lo
 * que da la sensación de avance sin necesidad de flechas.
 */
const PASOS: { icon: IconName; titulo: string; texto: string; grad: string; numero: string }[] = [
  {
    icon: 'buscar',
    titulo: 'Contrata una microbodega',
    texto: 'Elige un espacio cerca de tu demanda y paga por mes. Tu pago queda en custodia.',
    grad: 'linear-gradient(160deg, #16365A, #0F2742)',
    numero: 'rgba(255,255,255,0.22)',
  },
  {
    icon: 'envios',
    titulo: 'Administra toda tu operación',
    texto: 'Llevas o despachas tu stock a la bodega. El bodeguero confirma la recepción con foto.',
    grad: 'linear-gradient(160deg, #2C72B7, #1B5088)',
    numero: 'rgba(255,255,255,0.26)',
  },
  {
    icon: 'pedidos',
    titulo: 'Decide desde dónde despachar',
    texto: 'Cuando vendes, el bodeguero prepara el pedido y sale del punto más cercano.',
    grad: 'linear-gradient(160deg, #5199D8, #2C72B7)',
    numero: 'rgba(255,255,255,0.30)',
  },
];

export function HowItWorks() {
  return (
    <section>
      <h2 className="mb-3 text-[15px] font-extrabold text-navy-900">Cómo funciona BodGo</h2>

      <ol
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
        // El carrusel es la forma del prototipo; en pantallas anchas las tres
        // caben a la vez y el scroll simplemente no aparece.
      >
        {PASOS.map((paso, i) => (
          <li
            key={paso.titulo}
            style={{ backgroundImage: paso.grad }}
            className="flex w-[172px] shrink-0 snap-start flex-col rounded-[20px] p-[18px] text-white sm:flex-1"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-white/15">
                <Icon name={paso.icon} size={17} />
              </span>
              <span
                aria-hidden
                style={{ color: paso.numero }}
                className="text-[34px] font-extrabold leading-none"
              >
                {i + 1}
              </span>
            </div>

            <h3 className="mt-4 text-[16px] font-extrabold leading-tight">{paso.titulo}</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/70">{paso.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
