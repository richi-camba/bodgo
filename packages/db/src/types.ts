import type { Database } from './database.types';

/** Fila de una tabla: `Row<'warehouses'>`. */
export type Row<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/** Payload de inserción: `Insert<'products'>`. */
export type Insert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/** Payload de actualización: `Update<'orders'>`. */
export type Update<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

/** Fila de una vista: `View<'warehouse_listings'>`. */
export type View<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];

/** Enum de Postgres: `Enum<'order_status'>`. */
export type Enum<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

export type Profile = Row<'profiles'>;
export type PymeProfile = Row<'pyme_profiles'>;
export type BodegueroProfile = Row<'bodeguero_profiles'>;
export type Warehouse = Row<'warehouses'>;
export type WarehouseListing = View<'warehouse_listings'>;
export type Contract = Row<'contracts'>;
export type Payment = Row<'payments'>;
export type PaymentMethod = Row<'payment_methods'>;
export type Payout = Row<'payouts'>;
export type Product = Row<'products'>;
export type InventoryRow = Row<'inventory'>;
export type StockMovement = Row<'stock_movements'>;
export type Shipment = Row<'shipments'>;
export type ShipmentItem = Row<'shipment_items'>;
export type Discrepancy = Row<'discrepancies'>;
export type Order = Row<'orders'>;
export type OrderItem = Row<'order_items'>;
export type OrderEvent = Row<'order_events'>;
export type Conversation = Row<'conversations'>;
export type Message = Row<'messages'>;
export type Ticket = Row<'tickets'>;
export type Notification = Row<'notifications'>;
export type Incident = Row<'incidents'>;
export type Lead = Row<'leads'>;
export type CourierProfile = Row<'courier_profiles'>;
export type Delivery = Row<'deliveries'>;
export type DeliveryOffer = View<'delivery_offers'>;
