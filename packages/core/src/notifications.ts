/**
 * Temas de aviso que el usuario puede apagar.
 *
 * Los de pago y de recepción no están en la lista a propósito: son plata
 * retenida y mercadería que llegó, y enterarse tarde de eso le cuesta al
 * usuario. Ofrecer el interruptor y mandar el aviso igual sería peor que no
 * ofrecerlo.
 */
export const NOTIFICATION_TOPICS = [
  { key: 'pedidos', label: 'Pedidos y despachos', hint: 'Retiros, entregas y cambios de estado' },
  { key: 'stock', label: 'Alertas de stock', hint: 'Quiebres y stock bajo por SKU' },
  { key: 'contratos', label: 'Contratos', hint: 'Vencimientos y renovaciones' },
  { key: 'novedades', label: 'Novedades de BodGo', hint: 'Nuevas bodegas y promociones' },
] as const;

export type NotificationTopic = (typeof NOTIFICATION_TOPICS)[number]['key'];
