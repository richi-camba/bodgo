-- La comisión del bodeguero baja de 15% a 10%.
--
-- Viene de la revisión comercial de sep-2026. El número también vive en
-- packages/core/src/constants.ts (HOST_COMMISSION_RATE) y los dos tienen que
-- decir lo mismo: el sitio le promete al bodeguero lo que esta función
-- calcula.
--
-- No toca liquidaciones ya emitidas. `payouts` guarda los montos que se
-- calcularon cuando se generaron, así que lo ya pagado al 15% queda como
-- está: rehacerlo sería reescribir plata que ya cambió de manos.
create or replace function public.host_commission_rate() returns numeric
  language sql immutable parallel safe as $$ select 0.10::numeric $$;
