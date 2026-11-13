"""Regenera el índice (<ol class="indice">) de un documento de docs/sitio/doc a partir de sus h2/h3
y, si se le pasa el PDF ya generado, escribe el número de página de cada entrada.

Uso: python3 scripts/docs-sitio/indice.py <doc.html> [<doc.pdf>]
"""
import html
import re
import subprocess
import sys


def entradas(documento: str) -> list[tuple[int, str, str]]:
    cuerpo = documento[documento.index('<main class="cuerpo">'):]
    encontradas = []
    for nivel, ident, titulo in re.findall(r'<h([23]) id="([^"]+)"[^>]*>(.*?)</h\1>', cuerpo, re.S):
        texto = html.unescape(re.sub(r"<[^>]+>", "", titulo)).strip()
        encontradas.append((int(nivel), ident, texto))
    return encontradas


def paginas_del_pdf(pdf: str) -> list[str]:
    salida = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True, check=True).stdout
    return [re.sub(r"\s+", " ", pagina) for pagina in salida.split("\f")]


def ubicar(paginas: list[str], titulo: str, desde: int) -> int | None:
    buscado = re.sub(r"\s+", " ", titulo)
    for indice in range(desde, len(paginas)):
        if buscado in paginas[indice]:
            return indice
    return None


def construir(entradas_doc, paginas) -> str:
    filas, capitulo, seccion, pagina_actual = [], 0, 0, 0
    if paginas:  # el índice está en las primeras páginas: se busca después de él
        pagina_actual = next((i + 1 for i, p in enumerate(paginas) if "contenido" in p.lower()), 0)
    for nivel, ident, titulo in entradas_doc:
        if nivel == 2:
            capitulo, seccion = capitulo + 1, 0
            numero, clase = f"{capitulo:02d}", "n2"
        else:
            seccion += 1
            numero, clase = f"{capitulo}.{seccion}", "n3"
        numero_pagina = ""
        if paginas:
            encontrada = ubicar(paginas, titulo, pagina_actual)
            if encontrada is not None:
                pagina_actual = encontrada
                numero_pagina = str(encontrada + 1)
        filas.append(
            f'<li class="{clase}"><span class="numero">{numero}</span><a href="#{ident}">{html.escape(titulo, quote=False)}</a>'
            f'<span class="relleno"></span><span class="pagina">{numero_pagina}</span></li>'
        )
    return '<ol class="indice">' + "\n".join(filas) + "</ol>"


def main() -> None:
    ruta_html = sys.argv[1]
    paginas = paginas_del_pdf(sys.argv[2]) if len(sys.argv) > 2 else []
    documento = open(ruta_html, encoding="utf-8").read()
    inicio = documento.index('<ol class="indice">')
    fin = documento.index("</ol>", inicio) + len("</ol>")
    documento = documento[:inicio] + construir(entradas(documento), paginas) + documento[fin:]
    open(ruta_html, "w", encoding="utf-8").write(documento)


if __name__ == "__main__":
    main()
