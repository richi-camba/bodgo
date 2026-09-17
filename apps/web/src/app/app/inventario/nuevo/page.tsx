import type { Metadata } from 'next';
import { StepHeader } from '@/components/app/step-header';
import { NewProductForm } from './form';

export const metadata: Metadata = { title: 'Nuevo producto' };

/**
 * Alta de producto, en su propia pantalla.
 *
 * Antes se abría dentro del inventario y empujaba la lista hacia abajo: al
 * guardar no quedaba claro si habías vuelto al mismo lugar. Con pantalla
 * propia el «atrás» significa una sola cosa, igual que en editar.
 */
export default function NewProductPage() {
  return (
    <div>
      <StepHeader titulo="Nuevo producto" volverA="/app/inventario" />
      <NewProductForm />
    </div>
  );
}
