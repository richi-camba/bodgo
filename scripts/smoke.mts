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
import { quoteDeliveryToComuna, shippingMargin } from '@bodgo/core';

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
const outsider = await signIn('diego@casanorte.cl');
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
console.log('\nDespacho y seguimiento');

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
    delivery_method: 'external_courier',
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

{
  const { error } = await host.rpc('advance_order', { p_order_id: testOrder.id, p_status: 'picked_up' });
  check('no se despacha sin registrar con qué courier va', error != null);
}

{
  const { error } = await pyme.rpc('register_courier', {
    p_order_id: testOrder.id,
    p_courier_name: '   ',
  });
  check('el courier no puede quedar en blanco', error != null);
}

const { error: registerError } = await pyme.rpc('register_courier', {
  p_order_id: testOrder.id,
  p_courier_name: 'Chilexpress',
  p_tracking_number: '990099887766',
  p_tracking_url: 'https://www.chilexpress.cl/seguimiento?n=990099887766',
  p_courier_cost: 3_100,
});
check('la PyME registra el despacho', registerError == null, registerError?.message);

{
  const { data: order } = await admin
    .from('orders').select('courier_name, courier_cost, shipping_cost').eq('id', testOrder.id).single();
  check(
    'queda el margen del envío a la vista',
    shippingMargin(order!.shipping_cost, order!.courier_cost!) === quote!.buyerFee - 3_100,
    `${order!.shipping_cost} − ${order!.courier_cost}`,
  );
}

{
  const { error } = await host.rpc('advance_order', { p_order_id: testOrder.id, p_status: 'picked_up' });
  check('con courier registrado sí se despacha', error == null, error?.message);
}

{
  const { error } = await outsider.rpc('register_courier', {
    p_order_id: testOrder.id,
    p_courier_name: 'Starken',
  });
  check('una PyME ajena no puede tocar el despacho de otra', error != null);
}

// --------------------------------------------------- seguimiento del comprador
const { data: tokenRow } = await admin
  .from('orders').select('tracking_token').eq('id', testOrder.id).single();

const token = tokenRow!.tracking_token;
const anonymous = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, opts);

{
  const { data } = await anonymous.rpc('track_order', { p_token: token });
  const tracked = data?.[0];
  check('con el enlace, un comprador sin cuenta ve su pedido', tracked?.code === testOrder.code);
  check('el seguimiento muestra el courier', tracked?.courier_name === 'Chilexpress');
  check(
    'el seguimiento no expone lo que le costó el envío a la PyME',
    tracked != null && !('courier_cost' in tracked),
  );
  check(
    'el seguimiento no expone a la PyME ni la dirección de la bodega',
    tracked != null && !('pyme_id' in tracked) && !('address' in tracked),
  );

  const { data: lines } = await anonymous.rpc('track_order_items', { p_token: token });
  check('el seguimiento lista lo que compró', (lines?.length ?? 0) === 1);

  const { data: trail } = await anonymous.rpc('track_order_events', { p_token: token });
  check('el seguimiento trae la trazabilidad', (trail?.length ?? 0) >= 4, `${trail?.length} hitos`);
}

{
  const { data } = await anonymous.rpc('track_order', {
    p_token: '00000000-0000-0000-0000-000000000000',
  });
  check('un token inventado no devuelve nada', (data?.length ?? 0) === 0);
}

{
  const { data } = await anonymous.from('orders').select('buyer_address');
  check('el enlace no abre la tabla de pedidos', (data?.length ?? 0) === 0);
}

// ------------------------------------------------------- custodia del bodeguero
{
  const { data: mia } = await host.from('host_escrow').select('*');
  check(
    'el bodeguero ve su propia custodia',
    (mia?.length ?? 0) === 1 && Number(mia[0].held_base_amount) > 0,
    `${mia?.[0]?.held_payments ?? 0} en custodia`,
  );

  // Es el punto de la vista: atraviesa el RLS de `payments` pero sólo para
  // devolverle a cada quien su propia fila.
  const { data: ajena } = await outsider.from('host_escrow').select('*');
  check('la custodia de un bodeguero no la ve nadie más', (ajena?.length ?? 0) === 0);

  const { data: pagos } = await host.from('payments').select('id, amount');
  check('el bodeguero sigue sin poder leer pagos individuales', (pagos?.length ?? 0) === 0);
}

// ------------------------------------------- publicar un espacio de verdad
{
  // El trigger que arma el checklist corre como definer: sin eso el insert
  // moría contra el RLS de `warehouse_checklist` y no se podía publicar una
  // microbodega desde la aplicación. El seed no lo mostraba porque escribe
  // con la clave de servicio.
  const { data: creada, error } = await host
    .from('warehouses')
    .insert({
      bodeguero_id: (await host.auth.getUser()).data.user.id,
      comuna: 'Prueba de humo',
      address: 'Calle Falsa 123',
      sector_label: 'Zona de prueba',
      total_m2: 6,
      price_per_m2: 30000,
      reception_hours: 'Lun a Vie 9:00–18:00',
      status: 'pending_review',
    })
    .select('id')
    .single();

  check('el bodeguero puede publicar un espacio', !error, error?.message ?? '');

  if (creada) {
    const { data: items } = await host
      .from('warehouse_checklist')
      .select('item')
      .eq('warehouse_id', creada.id);
    check('y le queda armado el checklist de habilitación', (items?.length ?? 0) === 5);

    await admin.from('warehouse_checklist').delete().eq('warehouse_id', creada.id);
    await admin.from('warehouses').delete().eq('id', creada.id);
  }
}

// ------------------------------------------------------- chat y tickets
{
  const { data: mios } = await pyme.from('conversations').select('id, bodeguero_id');
  check('la PyME ve su conversación', (mios?.length ?? 0) >= 1);

  const { data: ajenas } = await outsider.from('conversations').select('id');
  check(
    'una PyME no ve las conversaciones de otra',
    !(ajenas ?? []).some((c) => (mios ?? []).some((m) => m.id === c.id)),
  );

  if (mios?.length) {
    const hilo = mios[0].id;
    const { data: leidos } = await outsider
      .from('messages')
      .select('id')
      .eq('conversation_id', hilo);
    check('ni los mensajes de esa conversación', (leidos?.length ?? 0) === 0);

    const { error: colada } = await outsider
      .from('messages')
      .insert({ conversation_id: hilo, sender_id: (await outsider.auth.getUser()).data.user.id, body: 'hola' });
    check('ni puede escribir en ella', !!colada);
  }

  // El trigger que ordena la bandeja corre como definer: sin eso el update
  // moría contra el RLS de `conversations` y la fecha del hilo mentía.
  if (mios?.length) {
    const hilo = mios[0].id;
    const { data: antes } = await admin
      .from('conversations').select('last_message_at').eq('id', hilo).single();

    await pyme.from('messages').insert({
      conversation_id: hilo,
      sender_id: (await pyme.auth.getUser()).data.user.id,
      body: 'prueba de humo',
    });

    const { data: despues } = await admin
      .from('conversations').select('last_message_at').eq('id', hilo).single();

    check(
      'mandar un mensaje mueve la conversación al tope de la bandeja',
      despues.last_message_at !== antes.last_message_at,
    );

    await admin.from('messages').delete().eq('conversation_id', hilo).eq('body', 'prueba de humo');
  }

  const { data: tix } = await pyme.from('tickets').select('id, subject, status');
  check('la PyME ve sus tickets', (tix?.length ?? 0) >= 1);

  const { data: tixAjenos } = await outsider.from('tickets').select('id');
  check(
    'una PyME no ve los tickets de otra',
    !(tixAjenos ?? []).some((t) => (tix ?? []).some((m) => m.id === t.id)),
  );

  if (tix?.length) {
    // El estado lo mueve el equipo: quien abre no se da por atendido solo.
    const { error } = await pyme
      .from('tickets')
      .update({ status: 'resolved' })
      .eq('id', tix[0].id);
    const { data: sigue } = await pyme.from('tickets').select('status').eq('id', tix[0].id).single();
    check(
      'quien abre un ticket no puede cerrarlo',
      !!error || sigue.status === tix[0].status,
    );
  }
}

// -------------------------------------------------------------------- limpieza
await admin.from('orders').delete().eq('warehouse_id', testWarehouse.id);
await admin.from('shipments').delete().eq('warehouse_id', testWarehouse.id);
await admin.from('inventory').delete().eq('warehouse_id', testWarehouse.id);
await admin.from('stock_movements').delete().eq('warehouse_id', testWarehouse.id);
await admin.from('contracts').delete().eq('warehouse_id', testWarehouse.id);
await admin.from('warehouses').delete().eq('id', testWarehouse.id);
await admin.from('notifications').delete().gte('created_at', startedAt);

console.log(`\n${passed} pasaron, ${failed} fallaron`);
process.exit(failed > 0 ? 1 : 0);
