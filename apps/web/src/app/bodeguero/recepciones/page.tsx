import { redirect } from 'next/navigation';

/**
 * Las recepciones viven dentro de Pedidos, como en el prototipo: son el mismo
 * turno de trabajo. La ruta vieja se queda apuntando ahí para no romper
 * enlaces ya guardados.
 */
export default function ReceptionsPage() {
  redirect('/bodeguero/pedidos?tipo=recibir');
}
