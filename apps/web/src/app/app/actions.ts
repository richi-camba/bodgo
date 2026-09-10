'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { quoteDeliveryToComuna } from '@bodgo/core';
import { createClient } from '@/lib/supabase/server';

export type ActionState = { error?: string; ok?: string } | null;

/**
 * Traduce un error de Postgres a algo que la PyME pueda entender.
 * Los RPC levantan mensajes en español, así que casi siempre sirven tal cual;
 * lo que se filtra acá son los errores de plomería.
 */
function readableError(message: string | undefined): string {
  if (!message) return 'Algo salió mal. Inténtalo de nuevo.';
  if (/permission denied|row-level security|42501/i.test(message)) {
    return 'No tienes permiso para hacer esto.';
  }
  if (/JWT|not authenticated/i.test(message)) return 'Tu sesión expiró. Vuelve a entrar.';
  return message;
}

// -----------------------------------------------------------------------------
// Contratar una microbodega
// -----------------------------------------------------------------------------
const contractSchema = z.object({
  warehouseId: z.string().uuid(),
  m2: z.coerce.number().positive('Elige cuántos m² necesitas.'),
  paymentMethodId: z.string().uuid('Elige un medio de pago.'),
});

export async function createContract(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = contractSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_contract', {
    p_warehouse_id: parsed.data.warehouseId,
    p_m2: parsed.data.m2,
    p_payment_method_id: parsed.data.paymentMethodId,
  });

  if (error) return { error: readableError(error.message) };

  revalidatePath('/app', 'layout');

  // Un contrato que vuelve sin activar es un cobro rechazado: el detalle lo
  // explica y ofrece reintentar con otra tarjeta. El que sí quedó activo
  // aterriza en la pantalla de confirmación con los datos de recepción.
  redirect(
    data.status === 'active'
      ? `/app/contratos/${data.id}?nuevo=1`
      : `/app/contratos/${data.id}`,
  );
}

// -----------------------------------------------------------------------------
// Terminar un contrato antes de tiempo
// -----------------------------------------------------------------------------
const terminateSchema = z.object({
  contractId: z.string().uuid(),
  daysUsed: z.coerce.number().int().min(0).max(30),
});

export async function terminateContract(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = terminateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Revisa los días usados.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('terminate_contract', {
    p_contract_id: parsed.data.contractId,
    p_days_used: parsed.data.daysUsed,
  });

  if (error) return { error: readableError(error.message) };

  revalidatePath('/app', 'layout');
  return { ok: 'Contrato finalizado. Tu devolución está en camino.' };
}

// -----------------------------------------------------------------------------
// Catálogo
// -----------------------------------------------------------------------------
const productSchema = z.object({
  name: z.string().trim().min(2, 'Escribe el nombre del producto.'),
  sku: z.string().trim().min(1, 'El SKU es obligatorio.'),
  category: z.string().trim().optional(),
  unitVolumeM3: z.coerce
    .number()
    .min(0, 'El volumen no puede ser negativo.')
    .max(5, 'Un producto de más de 5 m³ no cabe en una microbodega.'),
  // Opcional a propósito: sin objetivo el inventario muestra el número solo,
  // sin barra ni aviso de reposición.
  targetStock: z
    .union([z.literal(''), z.coerce.number().int().positive('El stock objetivo debe ser mayor que cero.')])
    .optional(),
});

export async function createProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró. Vuelve a entrar.' };

  const { error } = await supabase.from('products').insert({
    pyme_id: user.id,
    name: parsed.data.name,
    sku: parsed.data.sku,
    category: parsed.data.category || null,
    unit_volume_m3: parsed.data.unitVolumeM3,
    target_stock: parsed.data.targetStock || null,
  });

  if (error) {
    return {
      error: error.code === '23505' ? 'Ya tienes un producto con ese SKU.' : readableError(error.message),
    };
  }

  revalidatePath('/app/inventario');
  return { ok: 'Producto creado.' };
}

/** Editar un producto del catálogo. El stock no se toca acá: lo mueven las
 *  recepciones y los pedidos, nunca una edición a mano. */
export async function updateProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = productSchema
    .extend({ productId: z.string().uuid() })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('products')
    .update({
      name: parsed.data.name,
      sku: parsed.data.sku,
      category: parsed.data.category || null,
      unit_volume_m3: parsed.data.unitVolumeM3,
      target_stock: parsed.data.targetStock || null,
    })
    .eq('id', parsed.data.productId);

  if (error) {
    return {
      error: error.code === '23505' ? 'Ya tienes otro producto con ese SKU.' : readableError(error.message),
    };
  }

  revalidatePath('/app/inventario');
  redirect(`/app/inventario/${parsed.data.productId}`);
}

// -----------------------------------------------------------------------------
// Envío a bodega
// -----------------------------------------------------------------------------
const shipmentSchema = z.object({
  warehouseId: z.string().uuid('Elige a qué bodega envías.'),
  contractId: z.string().uuid().optional(),
  description: z.string().trim().min(3, 'Describe brevemente qué envías.'),
  packagesCount: z.coerce.number().int().min(1, 'Indica cuántos bultos son.'),
  weightKg: z.coerce.number().min(0).optional(),
  pickupAddress: z.string().trim().optional(),
  method: z.enum(['own', 'external_courier']),
  /** JSON: `[{ "productId": "...", "qty": 12 }]` */
  items: z.string(),
  photoPath: z.string().trim().optional(),
});

const itemsSchema = z
  .array(z.object({ productId: z.string().uuid(), qty: z.number().int().positive() }))
  .min(1, 'Selecciona al menos un producto.');

export async function createShipment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = shipmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };

  let items;
  try {
    items = itemsSchema.parse(JSON.parse(parsed.data.items));
  } catch {
    return { error: 'Selecciona al menos un producto para el manifiesto.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró. Vuelve a entrar.' };

  const { data: shipment, error } = await supabase
    .from('shipments')
    .insert({
      pyme_id: user.id,
      warehouse_id: parsed.data.warehouseId,
      contract_id: parsed.data.contractId ?? null,
      description: parsed.data.description,
      packages_count: parsed.data.packagesCount,
      weight_kg: parsed.data.weightKg ?? null,
      pickup_address: parsed.data.pickupAddress || null,
      method: parsed.data.method,
      dispatch_photo_url: parsed.data.photoPath || null,
    })
    .select('id')
    .single();

  if (error || !shipment) return { error: readableError(error?.message) };

  // El manifiesto guarda una copia del nombre, SKU y volumen: si después
  // renombras el producto, el envío histórico no cambia.
  const { data: products } = await supabase
    .from('products')
    .select('id, sku, name, category, unit_volume_m3')
    .in('id', items.map((i) => i.productId));

  const byId = new Map((products ?? []).map((p) => [p.id, p]));

  const { error: itemsError } = await supabase.from('shipment_items').insert(
    items.flatMap((i) => {
      const p = byId.get(i.productId);
      if (!p) return [];
      return [{
        shipment_id: shipment.id,
        product_id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        unit_volume_m3: p.unit_volume_m3,
        declared_qty: i.qty,
      }];
    }),
  );

  if (itemsError) {
    // Sin manifiesto el envío no sirve para nada, y el borrador vacío
    // ensuciaría la bandeja del bodeguero.
    await supabase.from('shipments').delete().eq('id', shipment.id);
    return { error: readableError(itemsError.message) };
  }

  // El asistente pide la foto de los bultos etiquetados en el paso 5, que es
  // justo lo que exige el despacho: si ya está, el envío sale ahora y el
  // bodeguero queda avisado. Si el despacho falla, el envío queda en borrador
  // y la ficha ofrece el botón para reintentarlo.
  if (parsed.data.photoPath) {
    await supabase.rpc('dispatch_shipment', {
      p_shipment_id: shipment.id,
      p_photo_url: parsed.data.photoPath,
    });
  }

  revalidatePath('/app/despachos');
  // `nuevo=1` hace que la ficha se muestre como el último paso del asistente:
  // el seguimiento recién creado, con la acción de cerrar el flujo.
  redirect(`/app/despachos/${shipment.id}?nuevo=1`);
}

/** Marca el envío como despachado: a partir de acá lo espera el bodeguero. */
export async function dispatchShipment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ shipmentId: z.string().uuid(), photoPath: z.string().trim().optional() })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: 'Envío no válido.' };

  if (!parsed.data.photoPath) {
    return { error: 'Fotografía los bultos etiquetados antes de despachar.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('dispatch_shipment', {
    p_shipment_id: parsed.data.shipmentId,
    p_photo_url: parsed.data.photoPath,
  });

  if (error) return { error: readableError(error.message) };

  revalidatePath('/app/despachos');
  return { ok: 'Envío despachado. Avisamos al bodeguero.' };
}

// -----------------------------------------------------------------------------
// Pedidos de salida
// -----------------------------------------------------------------------------
export async function advanceOrder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const schema = z.object({
    orderId: z.string().uuid(),
    status: z.enum(['queued', 'picking', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled']),
    note: z.string().trim().optional(),
  });

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'No se pudo actualizar el pedido.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('advance_order', {
    p_order_id: parsed.data.orderId,
    p_status: parsed.data.status,
    p_note: parsed.data.note || undefined,
  });

  if (error) return { error: readableError(error.message) };

  revalidatePath('/app/pedidos');
  revalidatePath('/bodeguero/pedidos');
  return { ok: 'Pedido actualizado.' };
}

// -----------------------------------------------------------------------------
// Crear un pedido de salida
// -----------------------------------------------------------------------------
const orderSchema = z.object({
  warehouseId: z.string().uuid('Elige desde qué bodega despachas.'),
  buyerName: z.string().trim().min(2, 'Escribe el nombre del comprador.'),
  buyerPhone: z.string().trim().optional(),
  buyerAddress: z.string().trim().min(5, 'Escribe la dirección de entrega.'),
  buyerComuna: z.string().trim().min(2, 'Indica la comuna de entrega.'),
  deliveryNotes: z.string().trim().optional(),
  deliveryMethod: z.enum(['buyer_pickup', 'external_courier']),
  /** JSON: `[{ "productId": "...", "qty": 2, "unitPrice": 14990 }]` */
  items: z.string(),
});

const orderItemsSchema = z
  .array(
    z.object({
      productId: z.string().uuid(),
      qty: z.number().int().positive(),
      unitPrice: z.number().int().min(0),
    }),
  )
  .min(1, 'Agrega al menos un producto al pedido.');

export async function createOrder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = orderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };

  let items;
  try {
    items = orderItemsSchema.parse(JSON.parse(parsed.data.items));
  } catch {
    return { error: 'Agrega al menos un producto al pedido.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró. Vuelve a entrar.' };

  // Hay que poder despachar lo que se vende: si no hay stock en esa bodega, el
  // pedido no debería nacer.
  const { data: stock } = await supabase
    .from('inventory')
    .select('product_id, quantity, products(name, sku)')
    .eq('warehouse_id', parsed.data.warehouseId)
    .in('product_id', items.map((i) => i.productId));

  const stockByProduct = new Map((stock ?? []).map((s) => [s.product_id, s]));

  for (const item of items) {
    const row = stockByProduct.get(item.productId);
    if (!row || row.quantity < item.qty) {
      return {
        error: `No hay stock suficiente de ${row?.products?.name ?? 'un producto'} en esa bodega (${row?.quantity ?? 0} unidades).`,
      };
    }
  }

  // La tarifa se congela ahora: la distancia se calcula desde las coordenadas
  // de la bodega hasta el centro de la comuna de destino.
  const { data: warehouse } = await supabase
    .from('warehouses')
    .select('lat, lng')
    .eq('id', parsed.data.warehouseId)
    .single();

  const quote =
    parsed.data.deliveryMethod === 'buyer_pickup'
      ? null
      : quoteDeliveryToComuna(
          { lat: warehouse?.lat ?? null, lng: warehouse?.lng ?? null },
          parsed.data.buyerComuna,
        );

  const itemsTotal = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      pyme_id: user.id,
      warehouse_id: parsed.data.warehouseId,
      channel: 'manual',
      buyer_name: parsed.data.buyerName,
      buyer_phone: parsed.data.buyerPhone || null,
      buyer_address: parsed.data.buyerAddress,
      buyer_comuna: parsed.data.buyerComuna,
      delivery_notes: parsed.data.deliveryNotes || null,
      delivery_method: parsed.data.deliveryMethod,
      items_total: itemsTotal,
      shipping_zone: quote ? `Zona ${quote.zone}` : null,
      shipping_cost: quote?.buyerFee ?? 0,
      distance_km: quote?.distanceKm ?? null,
      eta_minutes: quote?.etaMinutes ?? null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !order) return { error: readableError(error?.message) };

  const { data: products } = await supabase
    .from('products')
    .select('id, sku, name')
    .in('id', items.map((i) => i.productId));

  const byId = new Map((products ?? []).map((p) => [p.id, p]));

  const { error: itemsError } = await supabase.from('order_items').insert(
    items.flatMap((i) => {
      const p = byId.get(i.productId);
      if (!p) return [];
      return [{
        order_id: order.id,
        product_id: p.id,
        sku: p.sku,
        name: p.name,
        quantity: i.qty,
        unit_price: i.unitPrice,
      }];
    }),
  );

  if (itemsError) {
    // Un pedido sin líneas no le sirve a nadie y ensuciaría la bandeja del
    // bodeguero.
    await supabase.from('orders').delete().eq('id', order.id);
    return { error: readableError(itemsError.message) };
  }

  await supabase.from('order_events').insert({
    order_id: order.id,
    status: 'pending',
    note: 'Pedido creado a mano desde la app',
    actor_id: user.id,
  });

  revalidatePath('/app/pedidos');
  redirect(`/app/pedidos/${order.id}`);
}

// -----------------------------------------------------------------------------
// Despacho con courier externo
// -----------------------------------------------------------------------------
const courierSchema = z.object({
  orderId: z.string().uuid(),
  courierName: z.string().trim().min(2, 'Indica con qué courier despachas.'),
  trackingNumber: z.string().trim().optional(),
  trackingUrl: z
    .string()
    .trim()
    .url('El enlace de seguimiento no parece una dirección válida.')
    .optional()
    .or(z.literal('')),
  courierCost: z.coerce.number().int().min(0).optional(),
  receiptPath: z.string().trim().optional(),
});

/**
 * Deja registrado con quién se despachó el pedido.
 *
 * Es lo que habilita el enlace de seguimiento del comprador: sin courier
 * registrado, `advance_order` no deja marcar el pedido como retirado.
 */
export async function registerCourier(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = courierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('register_courier', {
    p_order_id: parsed.data.orderId,
    p_courier_name: parsed.data.courierName,
    p_tracking_number: parsed.data.trackingNumber || undefined,
    p_tracking_url: parsed.data.trackingUrl || undefined,
    p_courier_cost: parsed.data.courierCost,
    p_receipt_url: parsed.data.receiptPath || undefined,
  });

  if (error) return { error: readableError(error.message) };

  revalidatePath('/app/pedidos');
  revalidatePath('/bodeguero/pedidos');
  return { ok: 'Despacho registrado. Ya puedes compartir el seguimiento con el comprador.' };
}
