/**
 * Prueba de humo contra la base real.
 *
 * Ejercita las operaciones que mueven plata y stock, y además verifica que RLS
 * bloquee lo que tiene que bloquear. Crea sus propios datos y los borra al
 * terminar, así que es seguro correrla sobre la base sembrada.
 *
 *   pnpm smoke
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { quoteDeliveryToComuna } from '@bodgo/core';

function readEnv(...paths) {
  const out = {};
  for (const path of paths) {
    let raw;
    try {
      raw = readFileSync(new URL(path, import.meta.url), 'utf8');
    } catch {
      continue;
    }
    for (const line of raw.split('\n')) {
      if (!line.includes('=') || line.trimStart().startsWith('#')) continue;
      out[line.slice(0, line.indexOf('=')).trim()] = line.slice(line.indexOf('=') + 1).trim();
    }
  }
  return out;
}

const env = readEnv('../apps/web/.env.local', '../.env.local');

const opts = { auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: WebSocket } };
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, opts);

async function signIn(email) {
  const c = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, opts);
  const { error } = await c.auth.signInWithPassword({ email, password: env.BODGO_DEMO_PASSWORD });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return c;
}

let passed = 0;
let failed = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  ok ? passed++ : failed++;
};

// Marca de tiempo para poder borrar después exactamente lo que genere esta
// corrida, sin tocar los avisos de la red de demostración.
const startedAt = new Date().toISOString();

const pyme = await signIn('valentina@boutiquelua.cl');
const host = await signIn('marcela.rios@gmail.com');

const { data: { user: pymeUser } } = await pyme.auth.getUser();
const { data: { user: hostUser } } = await host.auth.getUser();

// ---------------------------------------------------------------------- RLS
console.log('\nRLS');

{
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, opts);

  const { data: listings } = await anon.from('warehouse_listings').select('*');
  check('un visitante ve el buscador de bodegas', (listings?.length ?? 0) > 0, `${listings?.length} bodegas`);
  check(
    'el buscador no expone la dirección exacta',
    listings?.length > 0 && !('address' in listings[0]),
  );

  const { data: rows } = await anon.from('warehouses').select('address');
  check('un visitante no lee la tabla warehouses', (rows?.length ?? 0) === 0);

  const { data: leaked } = await anon.from('contracts').select('*');
  check('un visitante no lee contratos', (leaked?.length ?? 0) === 0);
}

{
  const { data } = await host.from('products').select('sku').eq('sku', 'SKU-0876');
  check('el bodeguero ve la ficha de lo que almacena', (data?.length ?? 0) === 1);

  const { data: others } = await host.from('payment_methods').select('last4');
  check('el bodeguero no ve los medios de pago de la PyME', (others?.length ?? 0) === 0);

  const { data: contact } = await pyme.from('bodeguero_profiles').select('phone').eq('profile_id', hostUser.id);
  check('la PyME ve el contacto de su bodeguero', contact?.[0]?.phone != null);

  const { data: foreign } = await pyme
    .from('bodeguero_profiles')
    .select('phone')
    .neq('profile_id', hostUser.id);
  check('la PyME no ve el contacto de bodegueros sin contrato', (foreign?.length ?? 0) === 0);
}

// ------------------------------------------------------------------ custodia
console.log('\nCustodia');

// La prueba levanta su propia microbodega en vez de usar una de la red de
// demostración: así no compite por metros con los contratos sembrados, y una
// corrida que muera a la mitad no deja espacio reservado a nadie.
const TEST_ADDRESS = 'Calle de Prueba 1 — smoke test';

await admin.from('warehouses').delete().eq('address', TEST_ADDRESS);

const { data: testWarehouse, error: whError } = await admin
  .from('warehouses')
  .insert({
    bodeguero_id: hostUser.id,
    comuna: 'Ñuñoa',
    sector_label: 'Zona de prueba',
    address: TEST_ADDRESS,
    total_m2: 10,
    price_per_m2: 41_000,
    status: 'active',
  })
  .select('id, price_per_m2')
  .single();

if (whError) throw new Error(`bodega de prueba: ${whError.message}`);

const { data: listing } = await pyme
  .from('warehouse_listings')
  .select('id, price_per_m2, available_m2')
  .eq('id', testWarehouse.id)
  .single();

const { data: card } = await pyme
  .from('payment_methods')
  .select('id, last4')
  .eq('profile_id', pymeUser.id);

const visa = card.find((c) => c.last4 === '4242');
const declined = card.find((c) => c.last4 === '0002');

const { data: badContract, error: badErr } = await pyme.rpc('create_contract', {
  p_warehouse_id: listing.id,
  p_m2: 3,
  p_payment_method_id: declined.id,
});
check('una tarjeta sin fondos deja el contrato sin activar',
  !badErr && badContract?.status === 'pending_payment', badContract?.status);

{
  const { data: pay } = await admin
    .from('payments').select('status, failure_reason').eq('contract_id', badContract.id).single();
  check('el cobro rechazado queda registrado', pay?.status === 'failed', pay?.failure_reason);
}

const { data: contract, error: cErr } = await pyme.rpc('create_contract', {
  p_warehouse_id: listing.id,
  p_m2: 4,
  p_payment_method_id: visa.id,
});
check('una tarjeta válida activa el contrato', !cErr && contract?.status === 'active', cErr?.message);
check('el total es arriendo + 8%',
  contract?.total_amount === contract?.base_amount + Math.round(contract?.base_amount * 0.08),
  `${contract?.base_amount} + ${contract?.commission_amount} = ${contract?.total_amount}`);

{
  const { data: pay } = await admin.from('payments').select('status').eq('contract_id', contract.id).single();
  check('la plata queda en custodia, no liberada', pay?.status === 'held', pay?.status);
}

const { error: overErr } = await pyme.rpc('create_contract', {
  p_warehouse_id: listing.id,
  p_m2: 999,
  p_payment_method_id: visa.id,
});
check('no se puede contratar más superficie de la disponible', overErr != null);

// -------------------------------------------------------------- conciliación
console.log('\nConciliación de recepción');

const { data: prods } = await pyme.from('products').select('id, sku, name, unit_volume_m3').limit(2);

const { data: shipment } = await pyme
  .from('shipments')
  .insert({
    pyme_id: pymeUser.id,
    warehouse_id: listing.id,
    contract_id: contract.id,
    description: 'Prueba de humo',
    packages_count: 1,
  })
  .select()
  .single();

await pyme.from('shipment_items').insert(
  prods.map((p) => ({
    shipment_id: shipment.id,
    product_id: p.id,
    sku: p.sku,
    name: p.name,
    unit_volume_m3: p.unit_volume_m3,
    declared_qty: 10,
  })),
);

{
  const { data: s } = await pyme.from('shipments').select('declared_volume_m3').eq('id', shipment.id).single();
  const expected = Math.round(prods.reduce((a, p) => a + p.unit_volume_m3 * 10, 0) * 100) / 100;
  check('el volumen declarado se calcula solo desde el manifiesto',
    Number(s.declared_volume_m3) === expected, `${s.declared_volume_m3} m³`);
}

const { error: wrongHost } = await pyme.rpc('confirm_reception', { p_shipment_id: shipment.id });
check('la PyME no puede confirmar su propia recepción', wrongHost != null);

await pyme.rpc('dispatch_shipment', { p_shipment_id: shipment.id });

const { data: received, error: recErr } = await host.rpc('confirm_reception', {
  p_shipment_id: shipment.id,
  p_counts: [{ product_id: prods[0].id, received: 7 }],
  p_received_volume_m3: 0.5,
  p_note: 'Faltaron tres unidades en el bulto 1.',
});
check('el bodeguero confirma y el envío queda con diferencia',
  !recErr && received?.status === 'discrepancy', recErr?.message ?? received?.status);

{
  const { data: disc } = await host.from('discrepancies').select('*').eq('shipment_id', shipment.id).single();
  check('se abre la discrepancia con el faltante exacto',
    disc?.type === 'units' && disc?.units_short === 3, `${disc?.type}, faltan ${disc?.units_short}`);

  const { data: inv } = await host
    .from('inventory').select('quantity').eq('product_id', prods[0].id).eq('warehouse_id', listing.id).single();
  check('el inventario suma lo recibido, no lo declarado', inv?.quantity === 7, `${inv?.quantity} u`);

  const { data: pay } = await admin.from('payments').select('status').eq('contract_id', contract.id).single();
  check('con diferencia, la custodia NO se libera', pay?.status === 'held', pay?.status);

  const { data: notif } = await admin
    .from('notifications').select('kind').eq('user_id', pymeUser.id).eq('kind', 'reception_discrepancy');
  check('la PyME queda notificada de la diferencia', (notif?.length ?? 0) > 0);
}

const { error: twiceErr } = await host.rpc('confirm_reception', { p_shipment_id: shipment.id });
check('no se puede confirmar dos veces la misma recepción', twiceErr != null);

// ----------------------------------------------------------------- devolución
console.log('\nTérmino anticipado');

const { data: ended } = await pyme.rpc('terminate_contract', {
  p_contract_id: contract.id,
  p_days_used: 12,
});
const expectedHost = Math.round((contract.base_amount / 30) * 12);
check('se devuelve la parte proporcional no usada',
  ended?.refund_amount === contract.base_amount - expectedHost,
  `${ended?.refund_amount} de ${contract.base_amount}`);

{
  const { data: pay } = await admin.from('payments').select('status, refund_amount').eq('contract_id', contract.id).single();
  check('el pago queda como devuelto', pay?.status === 'refunded', pay?.status);
}

// ------------------------------------------------------------- último tramo
console.log('\nRepartidores');

const courier = await signIn('diego.rojas@gmail.com');
const rival = await signIn('karla.soto@gmail.com');
const { data: { user: courierUser } } = await courier.auth.getUser();

// Un pedido que sale de la bodega de prueba, con las 7 unidades que quedaron
// de la recepción anterior.
const quote = quoteDeliveryToComuna({ lat: -33.4569, lng: -70.5975 }, 'Las Condes');

const { data: testOrder } = await pyme
  .from('orders')
  .insert({
    pyme_id: pymeUser.id,
    warehouse_id: testWarehouse.id,
    channel: 'manual',
    buyer_name: 'Comprador de prueba',
    buyer_phone: '+56 9 0000 0000',
    buyer_address: 'Secreto 123, depto 4',
    buyer_comuna: 'Las Condes',
    items_total: 10_000,
    shipping_zone: `Zona ${quote!.zone}`,
    shipping_cost: quote!.buyerFee,
    distance_km: quote!.distanceKm,
    eta_minutes: quote!.etaMinutes,
    delivery_method: 'bodgo_courier',
    status: 'pending',
  })
  .select()
  .single();

await pyme.from('order_items').insert({
  order_id: testOrder.id,
  product_id: prods[0].id,
  sku: prods[0].sku,
  name: prods[0].name,
  quantity: 2,
  unit_price: 5_000,
});

for (const step of ['queued', 'picking', 'ready']) {
  const { error } = await host.rpc('advance_order', { p_order_id: testOrder.id, p_status: step });
  if (error) throw new Error(`pedido → ${step}: ${error.message}`);
}

const { data: offer } = await admin
  .from('deliveries')
  .select('*')
  .eq('order_id', testOrder.id)
  .single();

check('dejar el pedido listo ofrece el viaje solo', offer?.status === 'offered', offer?.code);
check(
  'la tarifa del viaje se parte entre BodGo y el repartidor',
  offer?.buyer_fee === offer?.commission_amount + offer?.courier_fee,
  `${offer?.buyer_fee} = ${offer?.commission_amount} + ${offer?.courier_fee}`,
);

{
  await courier.rpc('set_courier_online', { p_online: false });
  const { data: hidden } = await courier.from('delivery_offers').select('id');
  check('fuera de línea no se ven ofertas', (hidden?.length ?? 0) === 0);

  await courier.rpc('set_courier_online', { p_online: true });
  const { data: visible } = await courier.from('delivery_offers').select('*');
  check('en línea sí se ven', (visible?.length ?? 0) > 0, `${visible?.length} ofertas`);
  check(
    'la oferta no revela la dirección del comprador',
    visible!.length > 0 && !('buyer_address' in visible![0]) && !('buyer_name' in visible![0]),
  );

  const { data: peek } = await courier.from('orders').select('buyer_address').eq('id', testOrder.id);
  check('antes de aceptar, el repartidor no ve el pedido', (peek?.length ?? 0) === 0);

  const { data: warehousePeek } = await courier
    .from('warehouses').select('address').eq('id', testWarehouse.id);
  check('antes de aceptar, tampoco ve la dirección de retiro', (warehousePeek?.length ?? 0) === 0);
}

{
  const { data: pymePeek } = await pyme.from('delivery_offers').select('id');
  check('una PyME no ve la bolsa de viajes', (pymePeek?.length ?? 0) === 0);
}

// Dos repartidores sobre la misma oferta: sólo uno se la puede llevar.
await rival.rpc('set_courier_online', { p_online: true });

const [mine, theirs] = await Promise.all([
  courier.rpc('accept_delivery', { p_delivery_id: offer.id }),
  rival.rpc('accept_delivery', { p_delivery_id: offer.id }),
]);

const winners = [mine, theirs].filter((r) => !r.error).length;
check('dos repartidores sobre el mismo viaje: gana uno solo', winners === 1);

const { data: claimed } = await admin.from('deliveries').select('courier_id, status').eq('id', offer.id).single();
const winnerIsCourier = claimed?.courier_id === courierUser.id;
const winner = winnerIsCourier ? courier : rival;
const loser = winnerIsCourier ? rival : courier;

check('el viaje queda aceptado y con dueño', claimed?.status === 'accepted' && claimed?.courier_id != null);

{
  const { data: nowVisible } = await winner
    .from('warehouses').select('address').eq('id', testWarehouse.id);
  check('ya aceptado, el repartidor sí ve dónde retirar', (nowVisible?.length ?? 0) === 1);

  const { data: stillHidden } = await loser
    .from('orders').select('buyer_address').eq('id', testOrder.id);
  check('el que no se lo ganó sigue sin ver nada', (stillHidden?.length ?? 0) === 0);
}

{
  const { error } = await loser.rpc('advance_delivery', { p_delivery_id: offer.id, p_status: 'picked_up' });
  check('un repartidor no puede mover el viaje de otro', error != null);
}

await winner.rpc('advance_delivery', { p_delivery_id: offer.id, p_status: 'picked_up' });

{
  const { data: order } = await admin.from('orders').select('status').eq('id', testOrder.id).single();
  check('el retiro arrastra al pedido a "retirado"', order?.status === 'picked_up', order?.status);
}

{
  const { error } = await winner.rpc('advance_delivery', { p_delivery_id: offer.id, p_status: 'delivered' });
  check('no se puede cerrar una entrega sin foto', error != null);
}

const { data: before } = await admin
  .from('courier_profiles').select('trips_count').eq('profile_id', claimed!.courier_id!).single();

await winner.rpc('advance_delivery', {
  p_delivery_id: offer.id,
  p_status: 'delivered',
  p_photo_url: 'prueba/entrega.jpg',
});

{
  const { data: order } = await admin.from('orders').select('status, delivered_at').eq('id', testOrder.id).single();
  check('la entrega cierra el pedido', order?.status === 'delivered' && order?.delivered_at != null);

  const { data: after } = await admin
    .from('courier_profiles').select('trips_count').eq('profile_id', claimed!.courier_id!).single();
  check('el viaje se suma al contador del repartidor', after!.trips_count === before!.trips_count + 1);

  const { data: events } = await admin
    .from('order_events').select('status').eq('order_id', testOrder.id);
  check(
    'la trazabilidad guarda cada paso del viaje',
    ['picked_up', 'delivered'].every((st) => events!.some((e) => e.status === st)),
  );
}

await rival.rpc('set_courier_online', { p_online: false });

// -------------------------------------------------------------------- limpieza
await admin.from('deliveries').delete().eq('warehouse_id', testWarehouse.id);
await admin.from('orders').delete().eq('warehouse_id', testWarehouse.id);
await admin.from('shipments').delete().eq('warehouse_id', testWarehouse.id);
await admin.from('inventory').delete().eq('warehouse_id', testWarehouse.id);
await admin.from('stock_movements').delete().eq('warehouse_id', testWarehouse.id);
await admin.from('contracts').delete().eq('warehouse_id', testWarehouse.id);
await admin.from('warehouses').delete().eq('id', testWarehouse.id);
await admin.from('notifications').delete().gte('created_at', startedAt);

console.log(`\n${passed} pasaron, ${failed} fallaron`);
process.exit(failed > 0 ? 1 : 0);
