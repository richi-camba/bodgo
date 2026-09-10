'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { HOME_BY_ROLE } from '@/lib/supabase/middleware';

export type WelcomeState = { error?: string } | null;

const CHANNELS = ['mercadolibre', 'shopify', 'woocommerce', 'manual'] as const;

/** Cierra la bienvenida y manda a la app. También la usa «Saltar por ahora». */
async function terminar(userId: string) {
  const supabase = await createClient();
  await supabase
    .from('profiles')
    .update({ onboarded_at: new Date().toISOString() })
    .eq('id', userId);

  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  revalidatePath('/', 'layout');
  redirect(HOME_BY_ROLE[data?.role ?? 'pyme'] ?? '/');
}

/**
 * Saltar la bienvenida.
 *
 * Marca la cuenta como puesta en marcha igual: la idea es no volver a
 * preguntar, no obligar a completarla. Todo lo que pide se puede editar
 * después desde el perfil o desde la ficha del espacio.
 */
export async function skipWelcome(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/ingresar');
  await terminar(user.id);
}

/** Paso 1 de la PyME: quién es y dónde vende. */
export async function savePymeBusiness(_prev: WelcomeState, formData: FormData): Promise<WelcomeState> {
  const parsed = z
    .object({
      businessName: z.string().trim().min(2, 'Escribe el nombre de tu negocio.'),
      comuna: z.string().trim().min(2, 'Indica tu comuna principal.'),
      giro: z.string().trim().optional(),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró. Vuelve a entrar.' };

  const { error } = await supabase
    .from('pyme_profiles')
    .update({
      business_name: parsed.data.businessName,
      comuna: parsed.data.comuna,
      giro: parsed.data.giro || null,
    })
    .eq('profile_id', user.id);

  if (error) return { error: 'No se pudo guardar. Inténtalo de nuevo.' };

  redirect('/bienvenida?paso=2');
}

/** Paso 3 de la PyME: por dónde vende. Cierra la bienvenida. */
export async function savePymeChannels(_prev: WelcomeState, formData: FormData): Promise<WelcomeState> {
  const elegidos = formData
    .getAll('channels')
    .map(String)
    .filter((c): c is (typeof CHANNELS)[number] => (CHANNELS as readonly string[]).includes(c));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró. Vuelve a entrar.' };

  const { error } = await supabase
    .from('pyme_profiles')
    .update({ sales_channels: elegidos.length ? elegidos : ['manual'] })
    .eq('profile_id', user.id);

  if (error) return { error: 'No se pudo guardar. Inténtalo de nuevo.' };

  await terminar(user.id);
  return null;
}

/** Paso 1 del bodeguero: identidad y datos de contacto. */
export async function saveHostIdentity(_prev: WelcomeState, formData: FormData): Promise<WelcomeState> {
  const parsed = z
    .object({
      fullName: z.string().trim().min(3, 'Escribe tu nombre o razón social.'),
      rut: z.string().trim().min(8, 'Escribe tu RUT con guion.'),
      phone: z.string().trim().optional(),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró. Vuelve a entrar.' };

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from('profiles').update({ full_name: parsed.data.fullName }).eq('id', user.id),
    supabase
      .from('bodeguero_profiles')
      .update({ rut: parsed.data.rut, phone: parsed.data.phone || null })
      .eq('profile_id', user.id),
  ]);

  if (e1 || e2) return { error: 'No se pudo guardar. Inténtalo de nuevo.' };

  redirect('/bienvenida?paso=2');
}

/**
 * Paso 2 del bodeguero: publica el espacio.
 *
 * Queda en revisión, igual que si se publicara desde «Mis espacios»: nadie se
 * autopublica en la red. El trigger de la base le crea el checklist, que es
 * lo que muestra el paso 3.
 */
export async function saveHostSpace(_prev: WelcomeState, formData: FormData): Promise<WelcomeState> {
  const parsed = z
    .object({
      comuna: z.string().trim().min(2, 'Indica la comuna.'),
      address: z.string().trim().min(5, 'Escribe la dirección completa.'),
      totalM2: z.coerce.number().min(1, 'El espacio debe tener al menos 1 m².').max(60),
      pricePerM2: z.coerce.number().int().min(1000, 'Define un precio por m² al mes.'),
      receptionHours: z.string().trim().min(3, 'Di en qué horario recibes.'),
      weekendHours: z.string().trim().optional(),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró. Vuelve a entrar.' };

  const { error } = await supabase.from('warehouses').insert({
    bodeguero_id: user.id,
    comuna: parsed.data.comuna,
    address: parsed.data.address,
    sector_label: `Zona ${parsed.data.comuna}`,
    total_m2: parsed.data.totalM2,
    price_per_m2: parsed.data.pricePerM2,
    reception_hours: parsed.data.receptionHours,
    weekend_hours: parsed.data.weekendHours || null,
    status: 'pending_review',
  });

  if (error) return { error: 'No se pudo publicar el espacio. Inténtalo de nuevo.' };

  redirect('/bienvenida?paso=3');
}
