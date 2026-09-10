import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-navy-950">
      <header className="px-5 py-6">
        <Link href="/" aria-label="BodGo, ir al inicio">
          <Logo size={22} tone="light" />
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-4 sm:items-center sm:pt-0">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>

      <footer className="px-5 pb-8 text-center text-[11.5px] text-white/70">
        Tamayaz SpA · Corfo Semilla Inicia 25INI2-312540
      </footer>
    </div>
  );
}
