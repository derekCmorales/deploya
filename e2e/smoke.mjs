const api = process.env.API_URL ?? "http://localhost:3001";
const web = process.env.WEB_URL ?? "http://localhost:3000";

const modules = [
  "identidad",
  "notificaciones",
  "suscripciones",
  "administracion",
  "proyectos",
  "observabilidad",
  "construccion",
  "orquestacion",
  "enrutamiento",
  "herramientas",
];

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res;
}

async function main() {
  const health = await (await get(`${api}/health`)).json();
  if (health.status !== "ok") throw new Error("API health no ok");
  for (const mod of modules) {
    const body = await (await get(`${api}/${mod}/health`)).json();
    if (body.module !== mod) throw new Error(`health ${mod}`);
  }
  const home = await get(web);
  const html = await home.text();
  if (!html.includes("Deploya")) throw new Error("web home sin Deploya");
  console.log("smoke e2e ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
