const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function HomePage() {
  return (
    <main>
      <h1>Deploya</h1>
      <p>
        Plataforma como servicio para publicar aplicaciones. Esta pantalla es un
        placeholder neutro: el sistema de diseño y los mockups están en curso; no
        hay UI canónica todavía.
      </p>
      <p>
        API: <a href={`${api}/health`}>{api}/health</a>
      </p>
      <nav aria-label="Áreas del panel">
        <ul>
          <li>
            <a href="/auth">Cuenta</a> — Eddy (M1)
          </li>
          <li>
            <a href="/billing">Planes</a> — Javier (M2)
          </li>
          <li>
            <a href="/projects">Proyectos</a> — Eduardo (M3)
          </li>
          <li>
            <a href="/admin">Administración</a> — Javier (M9)
          </li>
        </ul>
      </nav>
    </main>
  );
}
