-- =============================================================================
-- Agrega el rol de repartidor al vocabulario.
--
-- Va solo en su propia migración: Postgres no deja usar un valor de enum
-- recién agregado dentro de la misma transacción que lo agregó, y las
-- políticas de la migración siguiente sí lo usan.
-- =============================================================================

alter type public.user_role add value if not exists 'repartidor';
