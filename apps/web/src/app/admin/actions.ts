'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export type ActionState = { error?: string; ok?: string } | null;

/**
 * Resolución de una discrepancia.
 *
 * Tres salidas posibles, las mismas del prototipo: dar el conteo por válido,
 * pedir un recuento al bodeguero, o escalar a incidente cuando ninguna de las
 * dos partes cede.
 */
const resolveSchema = z.object({
  discrepancyId: z.string().uuid(),
  outcome: z.enum(['accepted', 'recount', 'escalated']),
  note: z.string().trim().optional(),
});

const OUTCOME_TEXT: Record<string, string> = {
  accepted: 'Conteo del bodeguero dado por válido',
  recount: 'Se pidió un recuento al bodeguero',
  escalated: 'Escalado a incidente para revisión del equipo',
};

export async function resolveDiscrepancy(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resolveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Elige una resolución.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró. Vuelve a entrar.' };

  const { outcome, discrepancyId, note } = parsed.data;
  const closes = outcome === 'accepted';

  const { error } = await supabase
    .from('discrepancies')
    .update({
      status: outcome,
      resolution: OUTCOME_TEXT[outcome],
      resolved_by: closes ? user.id : null,
      resolved_at: closes ? new Date().toISOString() : null,
    })
    .eq('id', discrepancyId);

  if (error) return { error: error.message };

  if (note) {
    await supabase.from('discrepancy_notes').insert({
      discrepancy_id: discrepancyId,
      author_id: user.id,
      body: note,
    });
  }

  // Escalar deja además un incidente en la bandeja del backoffice, para que no
  // se pierda entre las discrepancias que sí se resolvieron.
  if (outcome === 'escalated') {
    const { data: d } = await supabase
      .from('discrepancies')
      .select('code, shipment_id, shipments(pyme_id, warehouse_id)')
      .eq('id', discrepancyId)
      .single();

    if (d) {
      await supabase.from('incidents').insert({
        title: `Discrepancia escalada ${d.code}`,
        severity: 'high',
        warehouse_id: d.shipments?.warehouse_id ?? null,
        pyme_id: d.shipments?.pyme_id ?? null,
        related_type: 'discrepancy',
        related_id: discrepancyId,
      });
    }
  }

  revalidatePath('/admin/discrepancias');
  return { ok: OUTCOME_TEXT[outcome] };
}

/** Habilita una microbodega tras la visita del evaluador. */
export async function approveWarehouse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ warehouseId: z.string().uuid(), decision: z.enum(['active', 'rejected']) })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: 'No se pudo aplicar la decisión.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('warehouses')
    .update({
      status: parsed.data.decision,
      published_at: parsed.data.decision === 'active' ? new Date().toISOString() : null,
    })
    .eq('id', parsed.data.warehouseId);

  if (error) return { error: error.message };

  const { data: warehouse } = await supabase
    .from('warehouses')
    .select('bodeguero_id, comuna')
    .eq('id', parsed.data.warehouseId)
    .single();

  if (warehouse) {
    await supabase.rpc('notify', {
      target: warehouse.bodeguero_id,
      kind: parsed.data.decision === 'active' ? 'warehouse_approved' : 'warehouse_rejected',
      title: parsed.data.decision === 'active' ? 'Tu espacio fue habilitado' : 'Tu espacio no fue habilitado',
      body:
        parsed.data.decision === 'active'
          ? `${warehouse.comuna} ya aparece en el buscador de las PyMEs.`
          : `Revisa el checklist de habilitación de ${warehouse.comuna} y vuelve a enviarlo.`,
      link: '/bodeguero/espacios',
      always: true,
    });
  }

  revalidatePath('/admin/bodegas');
  return { ok: parsed.data.decision === 'active' ? 'Espacio habilitado.' : 'Espacio rechazado.' };
}

// -----------------------------------------------------------------------------
// Incidentes
// -----------------------------------------------------------------------------

/** Anota en la bitácora del incidente. Queda firmada y no se puede editar. */
export async function addIncidentNote(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      incidentId: z.string().uuid(),
      body: z.string().trim().min(3, 'Escribe la nota antes de guardarla.'),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa la nota.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró. Vuelve a entrar.' };

  const { error } = await supabase.from('incident_notes').insert({
    incident_id: parsed.data.incidentId,
    author_id: user.id,
    body: parsed.data.body,
  });

  if (error) return { error: 'No se pudo guardar la nota.' };

  revalidatePath(`/admin/incidentes/${parsed.data.incidentId}`);
  return { ok: 'Nota guardada.' };
}

/**
 * Mueve el estado del incidente.
 *
 * Cerrar deja la marca de tiempo: sin `resolved_at` no hay forma de medir
 * cuánto tardó el equipo, que es lo que después se reporta.
 */
export async function setIncidentStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      incidentId: z.string().uuid(),
      status: z.enum(['open', 'in_progress', 'resolved']),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: 'Estado no válido.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('incidents')
    .update({
      status: parsed.data.status,
      resolved_at: parsed.data.status === 'resolved' ? new Date().toISOString() : null,
    })
    .eq('id', parsed.data.incidentId);

  if (error) return { error: 'No se pudo cambiar el estado.' };

  revalidatePath('/admin/incidentes', 'layout');
  return { ok: 'Estado actualizado.' };
}
