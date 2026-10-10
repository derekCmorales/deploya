import React from 'react';

export default async function ProyectoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ proyecto: string }>;
}) {
  const { proyecto } = await params;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Cabecera y pestañas del proyecto */}
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold">Proyecto: {proyecto}</h1>
        <nav className="mt-2 flex gap-4 text-sm text-muted-foreground">
          <span className="cursor-not-allowed">Resumen (Llega en el Avance 3)</span>
          <span className="cursor-not-allowed">Despliegues (Llega en el Avance 3)</span>
          <span className="cursor-not-allowed">Variables (M3-03)</span>
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}