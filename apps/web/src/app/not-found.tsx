import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="bg-blueprint flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="font-data text-[64px] font-semibold leading-none tracking-tight text-brand">404</p>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Este plano no existe</h1>
        <p className="max-w-sm text-sm text-muted">La página que buscas no está en el libro de obra.</p>
      </div>
      <Link
        href="/"
        className="inline-flex h-11 items-center rounded-md bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-strong"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
