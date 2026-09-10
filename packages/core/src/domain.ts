/**
 * Vocabulario del dominio. Estos literales son los mismos que los enums de
 * Postgres (ver supabase/migrations), así que agregar un valor acá obliga a
 * una migración.
 */

/**
 * Roles del producto. La base todavía tiene un valor `repartidor` inerte:
 * sacarlo obligaría a recrear el tipo y no hay forma de llegar a él.
 */
export const ROLES = ['pyme', 'bodeguero', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const WAREHOUSE_STATUSES = ['draft', 'pending_review', 'active', 'paused', 'rejected'] as const;
export type WarehouseStatus = (typeof WAREHOUSE_STATUSES)[number];

export const CONTRACT_STATUSES = ['pending_payment', 'active', 'ended', 'cancelled'] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

/** Estados de la plata: entra en custodia, sale al bodeguero o vuelve a la PyME. */
export const PAYMENT_STATUSES = ['pending', 'held', 'released', 'refunded', 'failed'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const SHIPMENT_STATUSES = ['draft', 'ready', 'in_transit', 'received', 'discrepancy'] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const SHIPMENT_METHODS = ['own', 'external_courier'] as const;
export type ShipmentMethod = (typeof SHIPMENT_METHODS)[number];

export const ORDER_STATUSES = [
  'pending',
  'queued',
  'picking',
  'ready',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const DELIVERY_METHODS = ['buyer_pickup', 'external_courier', 'integrated_courier'] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const SALES_CHANNELS = ['mercadolibre', 'shopify', 'woocommerce', 'manual'] as const;
export type SalesChannel = (typeof SALES_CHANNELS)[number];

export const DISCREPANCY_STATUSES = ['open', 'notified', 'accepted', 'recount', 'escalated', 'resolved'] as const;
export type DiscrepancyStatus = (typeof DISCREPANCY_STATUSES)[number];

export const MOVEMENT_TYPES = ['inbound', 'outbound', 'adjustment', 'transfer'] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const INCIDENT_SEVERITIES = ['low', 'medium', 'high'] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const PRODUCT_CATEGORIES = [
  'Moda y accesorios',
  'Hogar y decoración',
  'Belleza',
  'Electrónica',
  'Alimentos',
  'Deportes',
  'Otro',
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Etiquetas en español para la UI. Postgres guarda el literal en inglés. */
export const LABELS = {
  role: { pyme: 'PyME', bodeguero: 'Bodeguero', admin: 'Administrador' },
  warehouseStatus: {
    draft: 'Borrador',
    pending_review: 'En revisión',
    active: 'Activa',
    paused: 'Pausada',
    rejected: 'Rechazada',
  },
  contractStatus: {
    pending_payment: 'Pago pendiente',
    active: 'Activo',
    ended: 'Finalizado',
    cancelled: 'Cancelado',
  },
  paymentStatus: {
    pending: 'Pendiente',
    held: 'En custodia',
    released: 'Liberado',
    refunded: 'Devuelto',
    failed: 'Rechazado',
  },
  shipmentStatus: {
    draft: 'Borrador',
    ready: 'Preparado',
    in_transit: 'En camino',
    received: 'Recibido',
    discrepancy: 'Con diferencia',
  },
  orderStatus: {
    pending: 'Pendiente',
    queued: 'En cola',
    picking: 'Preparando',
    ready: 'Listo para retiro',
    picked_up: 'Retirado',
    in_transit: 'En ruta',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  },
  deliveryMethod: {
    buyer_pickup: 'Retiro por el comprador',
    external_courier: 'Courier externo',
    // Reservado: una flota integrada por API (Cabify o similar) todavía no
    // existe en el producto y no se puede elegir al crear un pedido.
    integrated_courier: 'Courier integrado',
  },
  discrepancyStatus: {
    open: 'Abierta',
    notified: 'PyME notificada',
    accepted: 'Conteo aceptado',
    recount: 'En recuento',
    escalated: 'Escalada',
    resolved: 'Resuelta',
  },
  discrepancyType: {
    none: 'Sin diferencia',
    units: 'Diferencia de unidades',
    volume: 'Exceso de volumen',
    both: 'Unidades y volumen',
  },
  movementType: {
    inbound: 'Ingreso',
    outbound: 'Salida',
    adjustment: 'Ajuste',
    transfer: 'Traslado',
  },
  incidentStatus: {
    open: 'Abierto',
    in_progress: 'En curso',
    resolved: 'Resuelto',
  },
  salesChannel: {
    mercadolibre: 'Mercado Libre',
    shopify: 'Shopify',
    woocommerce: 'WooCommerce',
    manual: 'Manual',
  },
  ticketStatus: {
    open: 'Abierto',
    in_progress: 'En curso',
    resolved: 'Resuelto',
  },
  incidentSeverity: {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  },
} as const;
