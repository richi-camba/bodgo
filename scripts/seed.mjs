/**
 * Siembra la base con la red de demostración: los mismos personajes y bodegas
 * del prototipo, más suficientes microbodegas para que el buscador tenga algo
 * que mostrar.
 *
 *   node scripts/seed.mjs
 *
 * Usa la clave de servicio, así que salta RLS y crea usuarios de auth. Es
 * idempotente: correrlo dos veces no duplica nada.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const env = Object.fromEntries(
  readFileSync(new URL('../apps/web/.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  // Node 20 no trae WebSocket nativo y el cliente lo exige al construirse,
  // aunque este script nunca use realtime.
  realtime: { transport: WebSocket },
});

const PASSWORD = 'BodGoDemo2026!';

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

console.log('\nListo. Cuentas de demostración (contraseña: %s)', PASSWORD);
console.table([
  { rol: 'PyME', correo: 'valentina@boutiquelua.cl' },
  { rol: 'Bodeguero', correo: 'marcela.rios@gmail.com' },
  { rol: 'Admin', correo: 'admin@bodgo.cl' },
]);
