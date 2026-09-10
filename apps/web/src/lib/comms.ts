/**
 * Motivos de ticket de soporte.
 *
 * Fijos y no un campo libre: el motivo es lo que enruta el caso al equipo y
 * lo que después se cuenta para saber qué falla más seguido. Escrito a mano
 * cada uno pondría lo suyo y no se podría agrupar nada.
 */
export const TICKET_REASONS = [
  { key: 'recepcion', label: 'Problema con una recepción' },
  { key: 'cobro', label: 'Cobro o liquidación' },
  { key: 'espacio', label: 'Estado del espacio' },
  { key: 'pedido', label: 'Pedido o despacho' },
  { key: 'cuenta', label: 'Mi cuenta y datos' },
  { key: 'otro', label: 'Otro' },
] as const;

export type TicketReason = (typeof TICKET_REASONS)[number]['key'];

export function reasonLabel(key: string | null): string {
  return TICKET_REASONS.find((r) => r.key === key)?.label ?? 'Otro';
}

/** Iniciales para el avatar de una contraparte. */
export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}
