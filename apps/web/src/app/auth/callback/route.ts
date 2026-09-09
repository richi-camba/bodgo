import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { HOME_BY_ROLE } from '@/lib/supabase/middleware';

/** Canje del código de OAuth y de los enlaces por correo. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (!code) return NextResponse.redirect(`${origin}/ingresar?error=sin-codigo`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return NextResponse.redirect(`${origin}/ingresar?error=sesion`);

  if (next?.startsWith('/')) return NextResponse.redirect(`${origin}${next}`);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null };

  return NextResponse.redirect(`${origin}${HOME_BY_ROLE[profile?.role ?? 'pyme'] ?? '/'}`);
}
