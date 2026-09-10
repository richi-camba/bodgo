export function SignOutButton({ navy }: { navy?: boolean }) {
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
