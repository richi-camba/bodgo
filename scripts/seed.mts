/**
 * Siembra la base con la red de demostración: los mismos personajes y bodegas
 * del prototipo, más suficientes microbodegas para que el buscador tenga algo
 * que mostrar.
 *
 *   pnpm db:seed
 *
 * Usa la clave de servicio, así que salta RLS y crea usuarios de auth. Es
 * idempotente: correrlo dos veces no duplica nada.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { quoteDeliveryToComuna } from '@bodgo/core';

/** Junta las variables de los dos .env locales, ninguno de los cuales va a git. */
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

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  // Node 20 no trae WebSocket nativo y el cliente lo exige al construirse,
  // aunque este script nunca use realtime.
  realtime: { transport: WebSocket },
});

/**
 * Contraseña de las cuentas de demostración.
 *
 * Sale del entorno a propósito y no está en el repositorio: el repo es público
 * y el sitio desplegado usa esta misma base, así que una constante acá sería
 * la llave del backoffice publicada en GitHub. Se define en
 * `.env.local` (BODGO_DEMO_PASSWORD), que está fuera de git.
 */
const PASSWORD = env.BODGO_DEMO_PASSWORD;

if (!PASSWORD) {
  throw new Error(
    'Falta BODGO_DEMO_PASSWORD en .env.local. Elige una contraseña para las cuentas de demostración.',
  );
}

/** Crea el usuario si no existe y devuelve su id. */
async function upsertUser(email, meta) {
  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
  const found = list?.users.find((u) => u.email === email);
  if (found) return found.id;

  const { data, error } = await db.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) throw new Error(`${email}: ${error.message}`);
  return data.user.id;
}

const log = (...a) => console.log('·', ...a);

// ---------------------------------------------------------------- personajes
log('Creando cuentas…');

const valentinaId = await upsertUser('valentina@boutiquelua.cl', {
  role: 'pyme',
  full_name: 'Valentina Castro',
  business_name: 'Boutique Lúa',
});

const marcelaId = await upsertUser('marcela.rios@gmail.com', {
  role: 'bodeguero',
  full_name: 'Marcela Ríos',
});

const adminId = await upsertUser('admin@bodgo.cl', {
  role: 'pyme',
  full_name: 'Equipo BodGo',
});

// El rol admin no se puede pedir desde el registro: se promueve acá.
await db.from('profiles').update({ role: 'admin', verified: true }).eq('id', adminId);
await db.from('profiles').update({ verified: true }).in('id', [valentinaId, marcelaId]);

const SECOND_PYME = { email: 'diego@casanorte.cl', name: 'Diego Fuentes', business: 'Casa Norte Deco' };

const OTHER_HOSTS = [
  { email: 'rodrigo.pena@gmail.com', name: 'Rodrigo Peña' },
  { email: 'carolina.soto@gmail.com', name: 'Carolina Soto' },
  { email: 'ignacio.vera@gmail.com', name: 'Ignacio Vera' },
  { email: 'paula.mendez@gmail.com', name: 'Paula Méndez' },
  { email: 'tomas.reyes@gmail.com', name: 'Tomás Reyes' },
];

const hostIds = {};
for (const h of OTHER_HOSTS) {
  hostIds[h.email] = await upsertUser(h.email, { role: 'bodeguero', full_name: h.name });
}

const diegoId = await upsertUser(SECOND_PYME.email, {
  role: 'pyme',
  full_name: SECOND_PYME.name,
  business_name: SECOND_PYME.business,
});

await db.from('pyme_profiles').update({
  legal_name: 'Casa Norte Deco SpA',
  rut: '78.112.900-К'.replace('К', 'K'),
  giro: 'Comercio de artículos de decoración',
  phone: '+56 9 5540 1188',
  comuna: 'Ñuñoa',
  address: 'Av. Grecia 1120',
  sales_channels: ['shopify'],
}).eq('profile_id', diegoId);

await db.from('pyme_profiles').update({
  legal_name: 'Boutique Lúa SpA',
  rut: '77.845.220-3',
  giro: 'Venta al por menor',
  phone: '+56 9 8421 5567',
  comuna: 'Providencia',
  address: 'Av. Providencia 1550, of. 402',
  sales_channels: ['mercadolibre', 'shopify'],
}).eq('profile_id', valentinaId);

await db.from('bodeguero_profiles').update({
  rut: '15.882.340-1',
  phone: '+56 9 8123 4455',
  bank_name: 'Banco Estado',
  bank_account_last4: '8890',
  rating: 4.9,
  ratings_count: 37,
  host_since: '2025-12-01',
  preferred_comunas: ['Providencia', 'Ñuñoa'],
}).eq('profile_id', marcelaId);

// ------------------------------------------------------------- microbodegas
log('Publicando microbodegas…');

const WAREHOUSES = [
  { host: marcelaId, comuna: 'Providencia', sector: 'Zona Providencia', address: 'Av. Manuel Montt 1240', m2: 12, price: 45000, lat: -33.4290, lng: -70.6110, rating: 4.9, access: true, services: ['Acceso 24/7', 'Cámaras', 'Extintor', 'Carga y descarga'] },
  { host: marcelaId, comuna: 'Ñuñoa', sector: 'Zona Ñuñoa', address: 'Irarrázaval 3420', m2: 9, price: 41000, lat: -33.4560, lng: -70.5960, rating: 4.8, access: false, services: ['Cámaras', 'Extintor'] },
  { host: hostIds['rodrigo.pena@gmail.com'], comuna: 'Las Condes', sector: 'Zona Las Condes', address: 'Apoquindo 5400', m2: 15, price: 52000, lat: -33.4090, lng: -70.5680, rating: 4.7, access: true, services: ['Acceso 24/7', 'Cámaras', 'Extintor', 'Estacionamiento'] },
  { host: hostIds['carolina.soto@gmail.com'], comuna: 'Maipú', sector: 'Zona Maipú', address: 'Av. Pajaritos 2810', m2: 14, price: 34000, lat: -33.5100, lng: -70.7580, rating: 4.6, access: false, services: ['Extintor', 'Carga y descarga'] },
  { host: hostIds['ignacio.vera@gmail.com'], comuna: 'Santiago Centro', sector: 'Zona Santiago Centro', address: 'San Diego 890', m2: 10, price: 39000, lat: -33.4560, lng: -70.6500, rating: 4.5, access: true, services: ['Acceso 24/7', 'Cámaras'] },
  { host: hostIds['paula.mendez@gmail.com'], comuna: 'La Florida', sector: 'Zona La Florida', address: 'Vicuña Mackenna 7300', m2: 11, price: 32000, lat: -33.5220, lng: -70.5980, rating: 4.8, access: false, services: ['Extintor', 'Estacionamiento'] },
  { host: hostIds['tomas.reyes@gmail.com'], comuna: 'San Miguel', sector: 'Zona San Miguel', address: 'Gran Avenida 4120', m2: 8, price: 30000, lat: -33.4980, lng: -70.6510, rating: 4.4, access: false, services: ['Cámaras', 'Extintor'] },
  { host: hostIds['rodrigo.pena@gmail.com'], comuna: 'Vitacura', sector: 'Zona Vitacura', address: 'Av. Kennedy 6800', m2: 13, price: 58000, lat: -33.3900, lng: -70.5720, rating: 4.9, access: true, services: ['Acceso 24/7', 'Cámaras', 'Extintor', 'Climatizado'] },
];

const warehouseIds = {};
for (const w of WAREHOUSES) {
  const { data: existing } = await db
    .from('warehouses')
    .select('id')
    .eq('bodeguero_id', w.host)
    .eq('address', w.address)
    .maybeSingle();

  if (existing) {
    warehouseIds[w.comuna] = existing.id;
    continue;
  }

  const { data, error } = await db
    .from('warehouses')
    .insert({
      bodeguero_id: w.host,
      comuna: w.comuna,
      sector_label: w.sector,
      address: w.address,
      address_reference: 'Entrada independiente por el patio',
      lat: w.lat,
      lng: w.lng,
      total_m2: w.m2,
      price_per_m2: w.price,
      status: 'active',
      access_24_7: w.access,
      services: w.services,
      rating: w.rating,
      ratings_count: Math.round(w.rating * 8),
      description: `Microbodega de ${w.m2} m² en ${w.comuna}, con acceso independiente y piso despejado.`,
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw new Error(`${w.comuna}: ${error.message}`);
  warehouseIds[w.comuna] = data.id;
}

// ------------------------------------------------------------------ catálogo
log('Cargando catálogo de Boutique Lúa…');

const PRODUCTS = [
  { name: 'Polera algodón talla M', sku: 'SKU-0876', category: 'Moda y accesorios', vol: 0.0035 },
  { name: 'Botella térmica 750 ml', sku: 'SKU-0099', category: 'Hogar y decoración', vol: 0.0042 },
  { name: 'Mochila urbana 20 L', sku: 'SKU-0451', category: 'Deportes', vol: 0.0180 },
  { name: 'Chaleco polar unisex', sku: 'SKU-1204', category: 'Moda y accesorios', vol: 0.0065 },
  { name: 'Set de velas aromáticas', sku: 'SKU-0733', category: 'Hogar y decoración', vol: 0.0028 },
  { name: 'Gorro de lana merino', sku: 'SKU-0512', category: 'Moda y accesorios', vol: 0.0012 },
];

for (const p of PRODUCTS) {
  await db.from('products').upsert(
    { pyme_id: valentinaId, name: p.name, sku: p.sku, category: p.category, unit_volume_m3: p.vol },
    { onConflict: 'pyme_id,sku' },
  );
}

const { data: products } = await db.from('products').select('id, sku, name, unit_volume_m3').eq('pyme_id', valentinaId);
const bySku = Object.fromEntries(products.map((p) => [p.sku, p]));

// --------------------------------------------------------------- medio de pago
{
  const { error } = await db.from('payment_methods').upsert(
    [
      { profile_id: valentinaId, brand: 'Visa', last4: '4242', exp_month: 8, exp_year: 2029, holder_name: 'Valentina Castro', is_default: true },
      // La 0002 rechaza a propósito: sirve para probar el camino del pago fallido.
      { profile_id: valentinaId, brand: 'Mastercard', last4: '0002', exp_month: 3, exp_year: 2028, holder_name: 'Valentina Castro', is_default: false },
    ],
    { onConflict: 'profile_id,last4' },
  );
  if (error) throw new Error(`medios de pago: ${error.message}`);
}

// ------------------------------------------------------------------ contrato
log('Contratando Providencia y recibiendo el primer envío…');

const providencia = warehouseIds['Providencia'];
let { data: contract } = await db
  .from('contracts')
  .select('*')
  .eq('pyme_id', valentinaId)
  .eq('warehouse_id', providencia)
  .maybeSingle();

if (!contract) {
  const base = 12 * 45000;
  const commission = Math.round(base * 0.08);
  const { data, error } = await db
    .from('contracts')
    .insert({
      pyme_id: valentinaId,
      warehouse_id: providencia,
      m2: 12,
      price_per_m2: 45000,
      base_amount: base,
      commission_amount: commission,
      total_amount: base + commission,
      status: 'active',
      start_date: new Date().toISOString().slice(0, 10),
      next_charge_date: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
    })
    .select()
    .single();
  if (error) throw new Error(`contrato: ${error.message}`);
  contract = data;

  await db.from('payments').insert({
    contract_id: contract.id,
    pyme_id: valentinaId,
    amount: contract.total_amount,
    status: 'released',
    held_at: new Date().toISOString(),
    released_at: new Date().toISOString(),
  });
}

// -------------------------------------------------------- envío ya recibido
const { data: shipped } = await db
  .from('shipments')
  .select('id')
  .eq('pyme_id', valentinaId)
  .eq('status', 'received')
  .maybeSingle();

if (!shipped) {
  const { data: shipment, error } = await db
    .from('shipments')
    .insert({
      pyme_id: valentinaId,
      warehouse_id: providencia,
      contract_id: contract.id,
      description: 'Ropa de temporada — cajas surtidas',
      packages_count: 3,
      weight_kg: 18,
      pickup_address: 'Av. Providencia 1550, of. 402',
      method: 'own',
      status: 'draft',
    })
    .select()
    .single();
  if (error) throw new Error(`envío: ${error.message}`);

  const manifest = [
    { sku: 'SKU-0876', qty: 120 },
    { sku: 'SKU-0099', qty: 60 },
    { sku: 'SKU-0451', qty: 24 },
    { sku: 'SKU-1204', qty: 40 },
  ];

  await db.from('shipment_items').insert(
    manifest.map((m) => ({
      shipment_id: shipment.id,
      product_id: bySku[m.sku].id,
      sku: m.sku,
      name: bySku[m.sku].name,
      unit_volume_m3: bySku[m.sku].unit_volume_m3,
      declared_qty: m.qty,
    })),
  );

  // Se despacha y se recibe completo: sirve de línea base con todo cuadrado.
  await db.rpc('dispatch_shipment', { p_shipment_id: shipment.id });
  await db
    .from('shipments')
    .update({ status: 'in_transit', dispatched_at: new Date().toISOString() })
    .eq('id', shipment.id);

  for (const m of manifest) {
    await db.from('shipment_items').update({ received_qty: m.qty }).eq('shipment_id', shipment.id).eq('sku', m.sku);
    await db.from('inventory').upsert(
      { product_id: bySku[m.sku].id, warehouse_id: providencia, quantity: m.qty, position_label: 'A-' + (manifest.indexOf(m) + 1) },
      { onConflict: 'product_id,warehouse_id' },
    );
    await db.from('stock_movements').insert({
      product_id: bySku[m.sku].id,
      warehouse_id: providencia,
      type: 'inbound',
      quantity: m.qty,
      reference_type: 'shipment',
      reference_id: shipment.id,
      note: `Recepción ${shipment.code}`,
      created_by: marcelaId,
    });
  }

  await db
    .from('shipments')
    .update({
      status: 'received',
      received_at: new Date().toISOString(),
      received_volume_m3: 1.06,
      capacity_m3: 21.6,
    })
    .eq('id', shipment.id);
}

// ------------------------------------------ envío en camino, para el bodeguero
const { data: pending } = await db
  .from('shipments')
  .select('id')
  .eq('pyme_id', valentinaId)
  .eq('status', 'in_transit')
  .maybeSingle();

if (!pending) {
  const { data: shipment } = await db
    .from('shipments')
    .insert({
      pyme_id: valentinaId,
      warehouse_id: providencia,
      contract_id: contract.id,
      description: 'Reposición primavera — 3 bultos',
      packages_count: 3,
      weight_kg: 14,
      pickup_address: 'Av. Providencia 1550, of. 402',
      method: 'external_courier',
      status: 'draft',
    })
    .select()
    .single();

  await db.from('shipment_items').insert([
    { shipment_id: shipment.id, product_id: bySku['SKU-0733'].id, sku: 'SKU-0733', name: bySku['SKU-0733'].name, unit_volume_m3: bySku['SKU-0733'].unit_volume_m3, declared_qty: 80 },
    { shipment_id: shipment.id, product_id: bySku['SKU-0512'].id, sku: 'SKU-0512', name: bySku['SKU-0512'].name, unit_volume_m3: bySku['SKU-0512'].unit_volume_m3, declared_qty: 150 },
    { shipment_id: shipment.id, product_id: bySku['SKU-0876'].id, sku: 'SKU-0876', name: bySku['SKU-0876'].name, unit_volume_m3: bySku['SKU-0876'].unit_volume_m3, declared_qty: 60 },
  ]);

  await db.rpc('dispatch_shipment', { p_shipment_id: shipment.id });
}

// -------------------------------------------------------------------- pedido
log('Creando el pedido de Mercado Libre…');

const { data: order } = await db
  .from('orders')
  .select('id')
  .eq('pyme_id', valentinaId)
  .eq('external_ref', 'ML-88213')
  .maybeSingle();

if (!order) {
  const { data: created } = await db
    .from('orders')
    .insert({
      pyme_id: valentinaId,
      warehouse_id: providencia,
      channel: 'mercadolibre',
      external_ref: 'ML-88213',
      buyer_name: 'Javiera Muñoz',
      buyer_phone: '+56 9 6712 4408',
      buyer_address: 'Av. Pajaritos 2900, depto 12',
      buyer_comuna: 'Maipú',
      delivery_notes: 'Dejar en conserjería si no hay nadie.',
      items_total: 42980,
      shipping_zone: 'Zona 3',
      shipping_cost: 3900,
      delivery_method: 'external_courier',
      status: 'pending',
    })
    .select()
    .single();

  await db.from('order_items').insert([
    { order_id: created.id, product_id: bySku['SKU-0876'].id, sku: 'SKU-0876', name: bySku['SKU-0876'].name, quantity: 2, unit_price: 14990 },
    { order_id: created.id, product_id: bySku['SKU-0099'].id, sku: 'SKU-0099', name: bySku['SKU-0099'].name, quantity: 1, unit_price: 13000 },
  ]);

  await db.from('order_events').insert({
    order_id: created.id,
    status: 'pending',
    note: 'Venta recibida desde Mercado Libre',
  });
}

// --------------------------------------------------------------- conversación
const { data: convo } = await db
  .from('conversations')
  .select('id')
  .eq('pyme_id', valentinaId)
  .eq('bodeguero_id', marcelaId)
  .maybeSingle();

if (!convo) {
  const { data: created } = await db
    .from('conversations')
    .insert({ pyme_id: valentinaId, bodeguero_id: marcelaId, warehouse_id: providencia })
    .select()
    .single();

  await db.from('messages').insert([
    { conversation_id: created.id, sender_id: valentinaId, body: 'Hola Marcela, ¿puedo pasar el jueves a dejar tres bultos?' },
    { conversation_id: created.id, sender_id: marcelaId, body: 'Hola Valentina. Sí, entre 9 y 19 sin problema. Te espero.' },
  ]);
}


// ============================================================================
// Segunda PyME: le da al backoffice más de un caso que mirar y prueba que el
// aislamiento entre PyMEs funcione de verdad.
// ============================================================================
log('Sembrando Casa Norte Deco…');

const NORTE_PRODUCTS = [
  { name: 'Lámpara de mesa nórdica', sku: 'CN-2201', category: 'Hogar y decoración', vol: 0.0240 },
  { name: 'Espejo redondo 60 cm', sku: 'CN-2208', category: 'Hogar y decoración', vol: 0.0310 },
  { name: 'Cojín lino 45×45', sku: 'CN-2215', category: 'Hogar y decoración', vol: 0.0090 },
];

for (const p of NORTE_PRODUCTS) {
  await db.from('products').upsert(
    { pyme_id: diegoId, name: p.name, sku: p.sku, category: p.category, unit_volume_m3: p.vol },
    { onConflict: 'pyme_id,sku' },
  );
}

const { data: norteProducts } = await db
  .from('products').select('id, sku, name, unit_volume_m3').eq('pyme_id', diegoId);
const norteBySku = Object.fromEntries(norteProducts.map((p) => [p.sku, p]));

await db.from('payment_methods').upsert(
  { profile_id: diegoId, brand: 'Visa', last4: '1881', exp_month: 11, exp_year: 2028, holder_name: 'Diego Fuentes', is_default: true },
  { onConflict: 'profile_id,last4' },
);

const nunoa = warehouseIds['Ñuñoa'];
let { data: norteContract } = await db
  .from('contracts').select('*').eq('pyme_id', diegoId).maybeSingle();

if (!norteContract) {
  const base = 5 * 41000;
  const commission = Math.round(base * 0.08);
  const { data } = await db.from('contracts').insert({
    pyme_id: diegoId,
    warehouse_id: nunoa,
    m2: 5,
    price_per_m2: 41000,
    base_amount: base,
    commission_amount: commission,
    total_amount: base + commission,
    status: 'active',
    start_date: new Date(Date.now() - 20 * 864e5).toISOString().slice(0, 10),
    next_charge_date: new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10),
  }).select().single();
  norteContract = data;

  await db.from('payments').insert({
    contract_id: norteContract.id,
    pyme_id: diegoId,
    amount: norteContract.total_amount,
    status: 'held',
    held_at: new Date().toISOString(),
  });
}

// ----------------------------------------------------------------------------
// Un envío que llegó con diferencia. Se arma pasando por confirm_reception para
// que la discrepancia salga de la misma lógica que usa la app, no a mano.
// ----------------------------------------------------------------------------
const { data: withGap } = await db
  .from('shipments').select('id').eq('pyme_id', diegoId).eq('status', 'discrepancy').maybeSingle();

if (!withGap) {
  const { data: shipment } = await db.from('shipments').insert({
    pyme_id: diegoId,
    warehouse_id: nunoa,
    contract_id: norteContract.id,
    description: 'Lámparas y espejos — 4 bultos',
    packages_count: 4,
    weight_kg: 26,
    pickup_address: 'Av. Grecia 1120',
    method: 'external_courier',
    status: 'draft',
  }).select().single();

  const lines = [
    { sku: 'CN-2201', declared: 40, received: 36 },
    { sku: 'CN-2208', declared: 25, received: 25 },
    { sku: 'CN-2215', declared: 90, received: 90 },
  ];

  await db.from('shipment_items').insert(
    lines.map((l) => ({
      shipment_id: shipment.id,
      product_id: norteBySku[l.sku].id,
      sku: l.sku,
      name: norteBySku[l.sku].name,
      unit_volume_m3: norteBySku[l.sku].unit_volume_m3,
      declared_qty: l.declared,
    })),
  );

  await db.rpc('dispatch_shipment', { p_shipment_id: shipment.id });

  // El RPC exige ser el bodeguero dueño; acá corre con la clave de servicio,
  // que salta RLS pero igual pasa por la validación de owns_warehouse(). Se
  // resuelve firmando la operación como Marcela.
  const marcela = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: WebSocket },
  });
  await marcela.auth.signInWithPassword({ email: 'marcela.rios@gmail.com', password: PASSWORD });

  const { error } = await marcela.rpc('confirm_reception', {
    p_shipment_id: shipment.id,
    p_counts: lines.filter((l) => l.received !== l.declared).map((l) => ({
      product_id: norteBySku[l.sku].id,
      received: l.received,
    })),
    p_received_volume_m3: 2.4,
    p_note: 'Llegaron 36 lámparas de las 40 declaradas. Una caja venía abierta.',
  });
  if (error) console.warn('  aviso: no se pudo registrar la discrepancia —', error.message);
}

// ----------------------------------------------------------------------------
// Pedidos en distintos estados, para que la bandeja no muestre siempre lo mismo.
// ----------------------------------------------------------------------------
log('Creando pedidos en varios estados…');

const MORE_ORDERS = [
  { ref: 'ML-88240', buyer: 'Camilo Bravo', comuna: 'Ñuñoa', address: 'Av. Irarrázaval 2210', total: 28900, ship: 3200, status: 'delivered', sku: 'SKU-0451', qty: 1, price: 28900 },
  { ref: 'SH-10455', buyer: 'Antonia Lira', comuna: 'Providencia', address: 'Los Leones 440, depto 91', total: 19980, ship: 2900, status: 'picking', sku: 'SKU-1204', qty: 2, price: 9990, channel: 'shopify' },
  { ref: 'ML-88301', buyer: 'Sebastián Ruiz', comuna: 'La Florida', address: 'Froilán Roa 6320', total: 14990, ship: 3900, status: 'queued', sku: 'SKU-0876', qty: 1, price: 14990 },
];

for (const o of MORE_ORDERS) {
  const { data: exists } = await db
    .from('orders').select('id').eq('pyme_id', valentinaId).eq('external_ref', o.ref).maybeSingle();
  if (exists) continue;

  const { data: created } = await db.from('orders').insert({
    pyme_id: valentinaId,
    warehouse_id: providencia,
    channel: o.channel ?? 'mercadolibre',
    external_ref: o.ref,
    buyer_name: o.buyer,
    buyer_address: o.address,
    buyer_comuna: o.comuna,
    items_total: o.total,
    shipping_zone: 'Zona 2',
    shipping_cost: o.ship,
    delivery_method: 'external_courier',
    status: o.status,
    delivered_at: o.status === 'delivered' ? new Date(Date.now() - 2 * 864e5).toISOString() : null,
  }).select().single();

  await db.from('order_items').insert({
    order_id: created.id,
    product_id: bySku[o.sku].id,
    sku: o.sku,
    name: bySku[o.sku].name,
    quantity: o.qty,
    unit_price: o.price,
  });

  // La trazabilidad completa hasta el estado en que quedó el pedido.
  const trail = ['pending', 'queued', 'picking', 'ready', 'picked_up', 'in_transit', 'delivered'];
  const upTo = trail.indexOf(o.status);
  await db.from('order_events').insert(
    trail.slice(0, upTo + 1).map((status, i) => ({
      order_id: created.id,
      status,
      note: status === 'pending' ? 'Venta recibida desde el canal' : null,
      created_at: new Date(Date.now() - (upTo - i + 2) * 36e5).toISOString(),
    })),
  );
}

// ----------------------------------------------------------------------------
// Liquidación del mes al bodeguero e incidentes de red para el backoffice.
// ----------------------------------------------------------------------------
log('Liquidando el mes e ingresando incidentes…');

const periodStart = new Date();
periodStart.setDate(1);
const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);

const gross = 640000;
const commission = Math.round(gross * 0.15);

await db.from('payouts').upsert(
  {
    bodeguero_id: marcelaId,
    period_start: periodStart.toISOString().slice(0, 10),
    period_end: periodEnd.toISOString().slice(0, 10),
    gross_amount: gross,
    commission_amount: commission,
    net_amount: gross - commission,
    status: 'scheduled',
  },
  { onConflict: 'bodeguero_id,period_start,period_end' },
);

const INCIDENTS = [
  { title: 'Humedad detectada en muro sur — Maipú', severity: 'medium', comuna: 'Maipú' },
  { title: 'Extintor vencido en visita de control — San Miguel', severity: 'high', comuna: 'San Miguel' },
];

for (const inc of INCIDENTS) {
  const { data: exists } = await db.from('incidents').select('id').eq('title', inc.title).maybeSingle();
  if (exists) continue;
  await db.from('incidents').insert({
    title: inc.title,
    severity: inc.severity,
    warehouse_id: warehouseIds[inc.comuna],
    status: 'open',
  });
}


// ============================================================================
// Flota de repartidores.
//
// Los viajes se arman pasando por los mismos RPC que usa la app: `advance_order`
// deja el pedido listo y ofrece el viaje, `accept_delivery` lo toma y
// `advance_delivery` lo cierra. Así los datos sembrados no pueden quedar en un
// estado que la aplicación real nunca produciría.
// ============================================================================
log('Sumando repartidores y viajes…');

const COURIERS = [
  {
    email: 'diego.rojas@gmail.com',
    name: 'Diego Rojas',
    vehicle: 'moto',
    plate: 'ABCD-12',
    bank: 'Banco Estado',
    last4: '8821',
    rating: 4.9,
    comunas: ['Providencia', 'Ñuñoa'],
  },
  {
    email: 'karla.soto@gmail.com',
    name: 'Karla Soto',
    vehicle: 'moto',
    plate: 'JKLM-45',
    bank: 'Banco de Chile',
    last4: '3402',
    rating: 4.7,
    comunas: ['Maipú', 'Estación Central'],
  },
  {
    email: 'nicolas.tapia@gmail.com',
    name: 'Nicolás Tapia',
    vehicle: 'bicicleta',
    plate: null,
    bank: 'BCI',
    last4: '7710',
    rating: 4.8,
    comunas: ['Santiago', 'Recoleta'],
  },
];

const courierIds = {};
for (const c of COURIERS) {
  courierIds[c.email] = await upsertUser(c.email, { role: 'repartidor', full_name: c.name });

  await db
    .from('courier_profiles')
    .update({
      vehicle: c.vehicle,
      plate: c.plate,
      phone: '+56 9 7' + String(Math.abs(hash(c.email)) % 9000000 + 1000000),
      bank_name: c.bank,
      bank_account_last4: c.last4,
      rating: c.rating,
      ratings_count: Math.round(c.rating * 40),
      documents_ok: true,
      preferred_comunas: c.comunas,
      is_online: c.email === 'diego.rojas@gmail.com',
      last_online_at: new Date().toISOString(),
    })
    .eq('profile_id', courierIds[c.email]);
}

await db.from('profiles').update({ verified: true }).in('id', Object.values(courierIds));

/** Hash estable para inventar teléfonos que no cambien entre corridas. */
function hash(text) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) | 0;
  return h;
}

/** Firma operaciones como un usuario concreto, para que los RPC vean su auth.uid(). */
async function as(email) {
  const c = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: WebSocket },
  });
  const { error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return c;
}

const marcelaClient = await as('marcela.rios@gmail.com');
const diegoClient = await as('diego.rojas@gmail.com');
const karlaClient = await as('karla.soto@gmail.com');

/**
 * Lleva un pedido desde donde esté hasta el estado pedido, pasando por cada
 * transición legal. Los saltos los rechaza `advance_order`, y con razón.
 */
async function walkOrder(client, orderId, target) {
  const CHAIN = ['pending', 'queued', 'picking', 'ready'];
  const { data: current } = await db.from('orders').select('status').eq('id', orderId).single();
  const from = CHAIN.indexOf(current.status);
  const to = CHAIN.indexOf(target);
  if (from < 0 || to <= from) return;

  for (const next of CHAIN.slice(from + 1, to + 1)) {
    const { error } = await client.rpc('advance_order', { p_order_id: orderId, p_status: next });
    if (error) throw new Error(`${orderId} → ${next}: ${error.message}`);
  }
}

/**
 * Deja el pedido listo y con su viaje ofrecido.
 *
 * `advance_order` ofrece el viaje solo al pasar a 'ready', pero si el pedido ya
 * estaba en ese estado no hay transición que lo dispare. `request_courier` es
 * idempotente: si ya existe un viaje vivo, lo devuelve sin crear otro.
 */
async function readyWithOffer(client, orderId) {
  await walkOrder(client, orderId, 'ready');
  const { error } = await db.rpc('request_courier', { p_order_id: orderId });
  if (error) console.warn('  aviso: no se pudo ofrecer el viaje —', error.message);
}

// Se convierten dos pedidos existentes a despacho con repartidor propio, con la
// tarifa recalculada según la distancia real bodega → comuna.
const { data: courierOrders } = await db
  .from('orders')
  .select('id, code, status, external_ref, buyer_comuna, warehouse_id, warehouses(lat, lng)')
  .in('external_ref', ['ML-88213', 'ML-88301']);

for (const order of courierOrders ?? []) {
  const quote = quoteDeliveryToComuna(
    { lat: order.warehouses?.lat ?? null, lng: order.warehouses?.lng ?? null },
    order.buyer_comuna,
  );
  if (!quote) continue;

  await db
    .from('orders')
    .update({
      delivery_method: 'bodgo_courier',
      shipping_zone: `Zona ${quote.zone}`,
      shipping_cost: quote.buyerFee,
      distance_km: quote.distanceKm,
      eta_minutes: quote.etaMinutes,
    })
    .eq('id', order.id);
}

// El reparto de papeles es fijo, no depende del estado en que esté la base:
// ML-88213 termina siempre como viaje entregado y ML-88301 siempre queda
// esperando en la bolsa. Si no, cada corrida iría vaciando las ofertas.
const mainOrder = (courierOrders ?? []).find((o) => o.external_ref === 'ML-88213');

// Un viaje ya entregado: le da contenido a la pantalla de ganancias.
if (mainOrder) {
  await readyWithOffer(marcelaClient, mainOrder.id);

  const { data: offered } = await db
    .from('deliveries')
    .select('id, status')
    .eq('order_id', mainOrder.id)
    .maybeSingle();

  if (offered?.status === 'offered') {
    const { error: acceptError } = await diegoClient.rpc('accept_delivery', {
      p_delivery_id: offered.id,
    });
    if (acceptError) console.warn('  aviso: no se pudo aceptar el viaje —', acceptError.message);
    else {
      await diegoClient.rpc('advance_delivery', { p_delivery_id: offered.id, p_status: 'picked_up' });
      await diegoClient.rpc('advance_delivery', {
        p_delivery_id: offered.id,
        p_status: 'delivered',
        p_photo_url: 'demo/entrega-puerta.jpg',
      });
    }
  }
}

// Y un viaje esperando en la bolsa, para que la app del repartidor tenga algo
// que ofrecer apenas se abre.
const { data: waiting } = await db
  .from('orders')
  .select('id, status')
  .eq('external_ref', 'ML-88301')
  .maybeSingle();

if (waiting) {
  await readyWithOffer(marcelaClient, waiting.id);
}

// Un tercer pedido, esta vez a la vuelta de la esquina: así la bolsa muestra
// zonas distintas y se ve que la tarifa cambia con la distancia.
let { data: nearby } = await db
  .from('orders')
  .select('id')
  .eq('pyme_id', valentinaId)
  .eq('external_ref', 'ML-88355')
  .maybeSingle();

if (!nearby) {
  const nearbyQuote = quoteDeliveryToComuna(
    { lat: -33.429, lng: -70.611 },
    'Providencia',
  )!;

  const { data: created } = await db
    .from('orders')
    .insert({
      pyme_id: valentinaId,
      warehouse_id: providencia,
      channel: 'mercadolibre',
      external_ref: 'ML-88355',
      buyer_name: 'Matías Herrera',
      buyer_phone: '+56 9 9032 7741',
      buyer_address: 'Av. Pedro de Valdivia 120, of. 8',
      buyer_comuna: 'Providencia',
      delivery_notes: 'Timbre 8, edificio con conserje.',
      items_total: 13000,
      shipping_zone: `Zona ${nearbyQuote.zone}`,
      shipping_cost: nearbyQuote.buyerFee,
      distance_km: nearbyQuote.distanceKm,
      eta_minutes: nearbyQuote.etaMinutes,
      delivery_method: 'bodgo_courier',
      status: 'pending',
    })
    .select()
    .single();

  await db.from('order_items').insert({
    order_id: created.id,
    product_id: bySku['SKU-0099'].id,
    sku: 'SKU-0099',
    name: bySku['SKU-0099'].name,
    quantity: 1,
    unit_price: 13000,
  });

  nearby = created;
}

// Fuera del `if`: si el pedido ya existía pero se quedó sin viaje —porque
// alguien lo tomó probando la app—, la oferta se vuelve a poner.
await readyWithOffer(marcelaClient, nearby.id);

// Karla queda fuera de línea a propósito: sirve para comprobar que estando
// fuera de línea no se ven ofertas.
await karlaClient.rpc('set_courier_online', { p_online: false });

console.log('\nListo. Cuentas de demostración (contraseña: %s)', PASSWORD);
console.table([
  { rol: 'PyME', correo: 'valentina@boutiquelua.cl', negocio: 'Boutique Lúa' },
  { rol: 'PyME', correo: 'diego@casanorte.cl', negocio: 'Casa Norte Deco' },
  { rol: 'Bodeguero', correo: 'marcela.rios@gmail.com', negocio: 'Providencia y Ñuñoa' },
  { rol: 'Bodeguero', correo: 'rodrigo.pena@gmail.com', negocio: 'Las Condes y Vitacura' },
  { rol: 'Repartidor', correo: 'diego.rojas@gmail.com', negocio: 'Moto · en línea' },
  { rol: 'Repartidor', correo: 'karla.soto@gmail.com', negocio: 'Moto · fuera de línea' },
  { rol: 'Admin', correo: 'admin@bodgo.cl', negocio: 'Backoffice' },
]);
