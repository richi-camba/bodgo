/**
 * Prueba de humo contra la base real.
 *
 * Ejercita las operaciones que mueven plata y stock, y además verifica que RLS
 * bloquee lo que tiene que bloquear. Crea sus propios datos y los borra al
 * terminar, así que es seguro correrla sobre la base sembrada.
 *
 *   node scripts/smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

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

// -------------------------------------------------------------------- limpieza
await admin.from('shipments').delete().eq('warehouse_id', testWarehouse.id);
await admin.from('inventory').delete().eq('warehouse_id', testWarehouse.id);
await admin.from('stock_movements').delete().eq('warehouse_id', testWarehouse.id);
await admin.from('contracts').delete().eq('warehouse_id', testWarehouse.id);
await admin.from('warehouses').delete().eq('id', testWarehouse.id);
await admin.from('notifications').delete().gte('created_at', startedAt);

console.log(`\n${passed} pasaron, ${failed} fallaron`);
process.exit(failed > 0 ? 1 : 0);
