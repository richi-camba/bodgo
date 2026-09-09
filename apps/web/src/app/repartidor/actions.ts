'use server';

import { revalidatePath } from 'next/cache';
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

/** Entrar o salir de la bolsa de viajes. */
export async function setOnline(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ online: z.enum(['true', 'false']) })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: 'No se pudo cambiar el estado.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('set_courier_online', {
    p_online: parsed.data.online === 'true',
  });

  if (error) return { error: readableError(error.message) };

  revalidatePath('/repartidor', 'layout');
  return { ok: parsed.data.online === 'true' ? 'Estás en línea.' : 'Estás fuera de línea.' };
}

/**
 * Tomar un viaje.
 *
 * Dos repartidores pueden apretar «Aceptar» sobre la misma oferta; el RPC
 * bloquea la fila y sólo uno gana. Al otro se le dice qué pasó, sin
 * inventarle un error genérico.
 */
export async function acceptDelivery(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ deliveryId: z.string().uuid() })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: 'Viaje no válido.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('accept_delivery', { p_delivery_id: parsed.data.deliveryId });

  if (error) return { error: readableError(error.message) };

  revalidatePath('/repartidor', 'layout');
  return { ok: 'Viaje aceptado.' };
}

/** Confirmar el retiro en bodega o la entrega al comprador. */
export async function advanceDelivery(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      deliveryId: z.string().uuid(),
      status: z.enum(['picked_up', 'in_transit', 'delivered', 'cancelled']),
      photoPath: z.string().trim().optional(),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: 'No se pudo actualizar el viaje.' };

  if (parsed.data.status === 'delivered' && !parsed.data.photoPath) {
    return { error: 'Saca la foto de la entrega antes de confirmar.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('advance_delivery', {
    p_delivery_id: parsed.data.deliveryId,
    p_status: parsed.data.status,
    p_photo_url: parsed.data.photoPath || undefined,
  });

  if (error) return { error: readableError(error.message) };

  revalidatePath('/repartidor', 'layout');
  revalidatePath('/app/pedidos');
  revalidatePath('/bodeguero/pedidos');
  return { ok: parsed.data.status === 'delivered' ? '¡Entrega registrada!' : 'Viaje actualizado.' };
}

/** Datos del vehículo y de pago. */
export async function updateCourierProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      vehicle: z.enum(['moto', 'bicicleta', 'auto', 'furgon']),
      plate: z.string().trim().max(12).optional(),
      phone: z.string().trim().max(24).optional(),
      bankName: z.string().trim().max(60).optional(),
      bankLast4: z
        .string()
        .trim()
        .regex(/^\d{4}$/, 'Los últimos 4 dígitos de la cuenta deben ser 4 números.')
        .optional()
        .or(z.literal('')),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró. Vuelve a entrar.' };

  const { error } = await supabase
    .from('courier_profiles')
    .update({
      vehicle: parsed.data.vehicle,
      plate: parsed.data.plate || null,
      phone: parsed.data.phone || null,
      bank_name: parsed.data.bankName || null,
      bank_account_last4: parsed.data.bankLast4 || null,
    })
    .eq('profile_id', user.id);

  if (error) return { error: readableError(error.message) };

  revalidatePath('/repartidor/perfil');
  return { ok: 'Datos actualizados.' };
}
