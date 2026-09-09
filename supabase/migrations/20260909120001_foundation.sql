-- =============================================================================
-- BodGo · cimientos: extensiones, vocabulario del dominio y helpers de RLS.
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- -----------------------------------------------------------------------------
-- Enums. Espejan packages/core/src/domain.ts: agregar un valor obliga a tocar
-- los dos lados.
-- -----------------------------------------------------------------------------
create type public.user_role         as enum ('pyme', 'bodeguero', 'admin');
create type public.warehouse_status  as enum ('draft', 'pending_review', 'active', 'paused', 'rejected');
create type public.contract_status   as enum ('pending_payment', 'active', 'ended', 'cancelled');
create type public.payment_status    as enum ('pending', 'held', 'released', 'refunded', 'failed');
create type public.payout_status     as enum ('scheduled', 'released', 'failed');
create type public.shipment_status   as enum ('draft', 'ready', 'in_transit', 'received', 'discrepancy');
create type public.shipment_method   as enum ('own', 'external_courier');
create type public.order_status      as enum ('pending', 'queued', 'picking', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled');
create type public.delivery_method   as enum ('buyer_pickup', 'external_courier', 'bodgo_courier');
create type public.sales_channel     as enum ('mercadolibre', 'shopify', 'woocommerce', 'manual');
create type public.discrepancy_type   as enum ('units', 'volume', 'both');
create type public.discrepancy_status as enum ('open', 'notified', 'accepted', 'recount', 'escalated', 'resolved');
create type public.movement_type     as enum ('inbound', 'outbound', 'adjustment', 'transfer');
create type public.incident_severity as enum ('low', 'medium', 'high');
create type public.incident_status   as enum ('open', 'in_progress', 'resolved');
create type public.ticket_status     as enum ('open', 'in_progress', 'resolved');

-- -----------------------------------------------------------------------------
-- Constantes del modelo, replicadas de packages/core/src/constants.ts.
-- Se usan en columnas generadas y en los RPC transaccionales.
-- -----------------------------------------------------------------------------
create or replace function public.stack_height_m() returns numeric
  language sql immutable parallel safe as $$ select 1.8::numeric $$;

create or replace function public.platform_commission_rate() returns numeric
  language sql immutable parallel safe as $$ select 0.08::numeric $$;

create or replace function public.host_commission_rate() returns numeric
  language sql immutable parallel safe as $$ select 0.15::numeric $$;

-- -----------------------------------------------------------------------------
-- Secuencias para los códigos que ve el usuario (STR-84120, DSP-3402, …).
-- -----------------------------------------------------------------------------
create sequence public.contract_no_seq   start 84120;
create sequence public.shipment_code_seq start 4821;
create sequence public.order_code_seq    start 3402;
create sequence public.warehouse_code_seq start 1040;
create sequence public.discrepancy_code_seq start 220;
create sequence public.incident_code_seq start 118;
create sequence public.ticket_code_seq   start 512;

-- -----------------------------------------------------------------------------
-- updated_at automático.
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
