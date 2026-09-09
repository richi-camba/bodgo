import { ButtonLink } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
      <Logo size={24} />
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-navy-900">
          Esta página no existe
        </h1>
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-ink-500">
          Puede que el enlace esté mal escrito, o que apunte a algo que ya no está.
        </p>
      </div>
      <ButtonLink href="/">Ir al inicio</ButtonLink>
    </div>
  );
}
