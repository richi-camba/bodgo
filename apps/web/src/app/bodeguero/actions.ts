'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export type ActionState = { error?: string; ok?: string } | null;

function readableError(message: string | undefined): string {
  if (!message) return 'Algo salió mal. Inténtalo de nuevo.';
  if (/permission denied|row-level security|42501/i.test(message)) {
    return 'No tienes permiso para hacer esto.';
  }
  return message;
}

// -----------------------------------------------------------------------------
// Confirmar la recepción de un envío
// -----------------------------------------------------------------------------
const countsSchema = z.array(
  z.object({ product_id: z.string().uuid(), received: z.number().int().min(0) }),
);

const receptionSchema = z.object({
  shipmentId: z.string().uuid(),
  /** JSON con el conteo real, sólo de las líneas que el bodeguero corrigió. */
  counts: z.string(),
  receivedVolumeM3: z.coerce.number().min(0).optional(),
  note: z.string().trim().optional(),
  photoPath: z.string().trim().optional(),
});

export async function confirmReception(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = receptionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Revisa el conteo antes de confirmar.' };

  let counts;
  try {
    counts = countsSchema.parse(JSON.parse(parsed.data.counts));
  } catch {
    return { error: 'El conteo no es válido.' };
  }

  const supabase = await createClient();
  // La foto es el respaldo de la recepción: sin ella una diferencia posterior
  // queda en la palabra de uno contra la del otro.
  if (!parsed.data.photoPath) {
    return { error: 'Saca la foto de lo recibido antes de confirmar.' };
  }

  const { error } = await supabase.rpc('confirm_reception', {
    p_shipment_id: parsed.data.shipmentId,
    p_counts: counts,
    p_received_volume_m3: parsed.data.receivedVolumeM3,
    p_photo_url: parsed.data.photoPath,
    p_note: parsed.data.note || undefined,
  });

  if (error) return { error: readableError(error.message) };

  revalidatePath('/bodeguero', 'layout');
  redirect(`/bodeguero/recepciones/${parsed.data.shipmentId}`);
}

// -----------------------------------------------------------------------------
// Publicar una microbodega
// -----------------------------------------------------------------------------
const warehouseSchema = z.object({
  comuna: z.string().trim().min(2, 'Indica la comuna.'),
  address: z.string().trim().min(5, 'Escribe la dirección completa.'),
  addressReference: z.string().trim().optional(),
  totalM2: z.coerce.number().min(1, 'El espacio debe tener al menos 1 m².').max(60),
  pricePerM2: z.coerce.number().int().min(1000, 'Define un precio por m² al mes.'),
  description: z.string().trim().optional(),
  access247: z.string().optional(),
});

export async function createWarehouse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = warehouseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró. Vuelve a entrar.' };

  const { data, error } = await supabase
    .from('warehouses')
    .insert({
      bodeguero_id: user.id,
      comuna: parsed.data.comuna,
      address: parsed.data.address,
      address_reference: parsed.data.addressReference || null,
      sector_label: `Zona ${parsed.data.comuna}`,
      total_m2: parsed.data.totalM2,
      price_per_m2: parsed.data.pricePerM2,
      description: parsed.data.description || null,
      access_24_7: parsed.data.access247 === 'on',
      // No se publica sola: un evaluador de BodGo hace la visita de
      // habilitación y recién ahí pasa a 'active'.
      status: 'pending_review',
    })
    .select('id')
    .single();

  if (error || !data) return { error: readableError(error?.message) };

  revalidatePath('/bodeguero/espacios');
  redirect('/bodeguero/espacios');
}

/** Pausa o reactiva un espacio ya habilitado. */
export async function toggleWarehouse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const schema = z.object({
    warehouseId: z.string().uuid(),
    next: z.enum(['active', 'paused']),
  });

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'No se pudo cambiar el estado.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('warehouses')
    .update({ status: parsed.data.next })
    .eq('id', parsed.data.warehouseId);

  if (error) return { error: readableError(error.message) };

  revalidatePath('/bodeguero/espacios');
  return { ok: parsed.data.next === 'active' ? 'Espacio reactivado.' : 'Espacio pausado.' };
}

// -----------------------------------------------------------------------------
// Preparación de pedidos
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

  revalidatePath('/bodeguero/pedidos');
  return { ok: 'Pedido actualizado.' };
}
