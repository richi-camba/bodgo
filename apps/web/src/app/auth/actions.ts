'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { HOME_BY_ROLE } from '@/lib/supabase/middleware';

export type AuthState = { error?: string } | null;

const email = z.string().trim().toLowerCase().email('Revisa el correo, no parece válido.');
const password = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.');

const signInSchema = z.object({ email, password: z.string().min(1, 'Escribe tu contraseña.') });

const signUpSchema = z.object({
  email,
  password,
  fullName: z.string().trim().min(2, 'Escribe tu nombre.'),
  businessName: z.string().trim().optional(),
  role: z.enum(['pyme', 'bodeguero']),
  terms: z.literal('on', { errorMap: () => ({ message: 'Debes aceptar los términos para continuar.' }) }),
});

/** Ruta destino tras autenticarse, según el rol del perfil. */
async function homeForCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return '/';

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return HOME_BY_ROLE[data?.role ?? 'pyme'] ?? '/';
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // No distinguimos "usuario no existe" de "clave incorrecta": decirlo
    // permitiría averiguar qué correos tienen cuenta.
    return { error: 'Correo o contraseña incorrectos.' };
  }

  const next = String(formData.get('next') ?? '');
  revalidatePath('/', 'layout');
  redirect(next.startsWith('/') ? next : await homeForCurrentUser());
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };
  }

  const { email, password, fullName, businessName, role } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // El trigger handle_new_user() lee esto para armar el perfil. El rol
      // 'admin' no se puede pedir desde acá: el trigger lo descarta.
      data: { role, full_name: fullName, business_name: businessName || fullName },
    },
  });

  if (error) {
    return {
      error:
        error.message.includes('already registered')
          ? 'Ya existe una cuenta con ese correo. Inicia sesión.'
          : 'No pudimos crear la cuenta. Inténtalo de nuevo.',
    };
  }

  revalidatePath('/', 'layout');
  redirect(role === 'bodeguero' ? '/bodeguero' : '/app');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
