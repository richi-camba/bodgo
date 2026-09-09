import { ButtonLink } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export default function TrackingNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
      <Logo size={24} />
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-navy-900">
          No encontramos este pedido
        </h1>
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-ink-500">
          El enlace puede estar incompleto o haber vencido. Pídeselo de nuevo a la tienda donde
          compraste — ellos pueden volver a enviártelo.
        </p>
      </div>
      <ButtonLink href="/" variant="secondary">
        Conocer BodGo
      </ButtonLink>
    </div>
  );
}
