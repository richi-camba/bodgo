export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="w-full rounded-field px-3 py-2 text-left text-[12.5px] font-semibold text-ink-500 transition-colors hover:bg-surface-50 hover:text-danger-700"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
