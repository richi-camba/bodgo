import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/stat';
import { NewWarehouseForm } from './form';

export const metadata: Metadata = { title: 'Publicar espacio' };

export default function NewSpacePage() {
  return (
    <div>
      <Link href="/bodeguero/espacios" className="mb-4 inline-block text-[13px] font-bold text-brand-600 hover:underline">
        ← Volver a mis espacios
      </Link>

      <PageHeader
        title="Publicar una microbodega"
        subtitle="Los datos de dirección sólo se muestran a la PyME una vez firmado el contrato."
      />

      <NewWarehouseForm />
    </div>
  );
}
