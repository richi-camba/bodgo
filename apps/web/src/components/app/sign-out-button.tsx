/**
 * Cerrar sesión.
 *
 * `navy` es la fila discreta del panel lateral; `destacado` es el botón con
 * borde rojo del perfil, que en el prototipo cierra la pantalla. Es un
 * formulario POST y no un enlace: cerrar sesión cambia estado, y un GET lo
 * dispararía cualquier prefetch.
 */
export function SignOutButton({
  navy,
  destacado,
}: {
  navy?: boolean;
  destacado?: boolean;
}) {
  if (destacado) {
    return (
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="w-full rounded-[14px] border-[1.5px] border-danger-600/30 bg-white p-3.5 text-[14px] font-bold text-danger-700 transition-colors hover:bg-danger-50"
        >
          Cerrar sesión
        </button>
      </form>
    );
  }

  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className={`w-full rounded-field px-3 py-2 text-left text-[12.5px] font-semibold transition-colors ${
          navy
            ? 'text-white/60 hover:bg-white/[0.07] hover:text-white'
            : 'text-ink-500 hover:bg-surface-50 hover:text-danger-700'
        }`}
      >
        Cerrar sesión
      </button>
    </form>
  );
}
