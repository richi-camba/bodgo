-- -----------------------------------------------------------------------------
-- Lo que el bodeguero tiene en custodia.
--
-- `payments` está cerrado al bodeguero por RLS, y con razón: ahí viven el
-- medio de pago de la PyME, los intentos fallidos y el motivo del rechazo.
-- Pero el bodeguero sí tiene que poder ver cuánta plata suya está retenida
-- esperando que confirme recepciones, que es la mitad de la pantalla de pagos.
--
-- Suma el arriendo base y no `payments.amount`: lo que la PyME pagó incluye la
-- comisión de plataforma, que nunca fue del bodeguero. Sobre esta base se
-- descuenta después su propia comisión del 15%.
--
-- La vista devuelve un agregado y sólo la fila del que consulta. Corre con
-- permisos del dueño porque tiene que atravesar el RLS de `payments`; el
-- filtro por `auth.uid()` está adentro justamente para que eso no abra nada
-- más.
-- -----------------------------------------------------------------------------
drop view if exists public.host_escrow;

create view public.host_escrow
  with (security_invoker = off) as
  select
    w.bodeguero_id,
    coalesce(sum(c.base_amount), 0)::bigint as held_base_amount,
    count(*)::int                           as held_payments
  from public.payments p
  join public.contracts c  on c.id = p.contract_id
  join public.warehouses w on w.id = c.warehouse_id
  where p.status = 'held'
    and w.bodeguero_id = auth.uid()
  group by w.bodeguero_id;

comment on view public.host_escrow is
  'Agregado de la custodia del bodeguero que consulta, en arriendo base. No expone pagos individuales ni datos de la PyME.';

revoke all on public.host_escrow from public;
grant select on public.host_escrow to authenticated;
