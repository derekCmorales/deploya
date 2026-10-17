"""Arma la pista de voz y la línea de tiempo de la presentación.

Uso: python3 construir.py <carpeta-con-los-mp3-por-escena>

Lee guion.json, ajusta el ritmo de cada locución, mide sus pausas reales con
ffmpeg (silencedetect) para saber cuándo empieza cada frase, y escribe:
  - voz.mp3      una sola pista con la voz, el fondo ambiental y el golpe del logo
                 (sfx-fondo.mp3 y sfx-sting6.mp3 en la misma carpeta, si existen)
  - timeline.js  window.TIMELINE con inicio, duración y frases de cada escena
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

AQUI = Path(__file__).parent
RITMO = 1.0             # sin estirar la voz: cualquier cambio de ritmo resta calidad
ENTRADA = 0.7           # silencio antes de la voz de cada escena
SALIDA = 1.2            # respiro al terminar cada escena
ESPECIAL = {            # (entrada, salida) de escenas con más imagen que voz
    "s00-intro": (5.5, 1.6),
    "s02-publicar": (0.7, 3.0),
    "s04-stack": (0.7, 2.0),
    "s10-cierre": (0.7, 4.5),
}
CAPITULOS = {
    "s01-numeros": "Cómo vamos",
    "s02-publicar": "Publicar en vivo",
    "s03-cifrado": "Variables cifradas",
    "s04-stack": "Detección de stack",
    "s05-sin-corte": "Actualizar sin corte",
    "s06-cobro": "Planes y cobro",
    "s07-bloqueos": "Bloqueos por plan",
    "s08-cuentas": "Cuentas y seguridad",
    "s09-capo": "Bajo el capó",
}
TASA = 44100
CARACTERES_POR_SEGUNDO = 16  # ritmo medido de la voz de Valeria


def limpiar(texto):
    return re.sub(r"\s+", " ", re.sub(r"\[[^\]]*\]\s*", "", texto)).strip()


def ffmpeg(*args):
    return subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-y", *args], capture_output=True, text=True, check=True)


def duracion(ruta):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(ruta)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def silencios(ruta):
    err = ffmpeg("-i", str(ruta), "-af", "silencedetect=noise=-35dB:d=0.18", "-f", "null", "-").stderr
    ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    fin = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    return list(zip(ini, fin))


def trozos(texto):
    """Parte el texto en tramos que terminan en signo de puntuación."""
    res, a = [], 0
    for m in re.finditer(r"[,.…:;?!]+\s*", texto):
        b = m.end()
        if texto[a:b].strip():
            res.append((a, b))
        a = b
    if texto[a:].strip():
        res.append((a, len(texto)))
    return res


def alinear(texto, dur, sil):
    """Empareja los límites entre tramos con las pausas medidas (programación dinámica)."""
    tr = trozos(texto)
    peso = [len(re.sub(r"[^\w]", "", texto[a:b])) or 1 for a, b in tr]
    # Pausas internas (no las del principio ni del final)
    inicial = silencios_bordes(sil, dur)
    sil = [(s, e) for s, e in sil if s > 0.15 and e < dur - 0.1]
    total_sil = sum(e - s for s, e in sil)
    habla = max(0.1, dur - total_sil - inicial[0] - inicial[1])
    # posición de cada pausa en «tiempo hablado»
    pos_sil, acum, prev = [], 0.0, inicial[0]
    for s, e in sil:
        acum += s - prev
        pos_sil.append(acum)
        prev = e
    W = sum(peso)
    lim = []  # tiempo hablado esperado de cada límite entre tramos
    c = 0
    for p in peso[:-1]:
        c += p
        lim.append(c / W * habla)
    n, m = len(lim), len(pos_sil)
    INF = float("inf")
    PEN_LIM, PEN_SIL = 0.9, 1.2
    f = [[INF] * (m + 1) for _ in range(n + 1)]
    g = [[None] * (m + 1) for _ in range(n + 1)]
    f[0][0] = 0
    for i in range(n + 1):
        for j in range(m + 1):
            if f[i][j] == INF:
                continue
            if i < n and j < m:
                costo = f[i][j] + abs(lim[i] - pos_sil[j])
                if costo < f[i + 1][j + 1]:
                    f[i + 1][j + 1], g[i + 1][j + 1] = costo, (i, j, "par")
            if i < n:
                costo = f[i][j] + PEN_LIM
                if costo < f[i + 1][j]:
                    f[i + 1][j], g[i + 1][j] = costo, (i, j, "lim")
            if j < m:
                dur_s = sil[j][1] - sil[j][0]
                costo = f[i][j] + PEN_SIL * min(1.0, dur_s / 0.5)
                if costo < f[i][j + 1]:
                    f[i][j + 1], g[i][j + 1] = costo, (i, j, "sil")
    pares = {}
    i, j = n, m
    while (i, j) != (0, 0):
        pi, pj, tipo = g[i][j]
        if tipo == "par":
            pares[pi] = pj
        i, j = pi, pj
    # Tiempos reales de inicio y fin de cada tramo
    anclas = [(0, inicial[0])]  # (índice de límite+1, tiempo real)
    for li in sorted(pares):
        s, e = sil[pares[li]]
        anclas.append((li + 1, (s, e)))
    fin_habla = dur - inicial[1]
    frases = []
    # Interpolar los límites sin pausa entre anclas vecinas, por peso
    t_ini = [None] * len(tr)
    t_fin = [None] * len(tr)
    t_ini[0] = inicial[0]
    for li, sj in pares.items():
        t_fin[li] = sil[sj][0]
        t_ini[li + 1] = sil[sj][1]
    t_fin[-1] = fin_habla
    k = 0
    while k < len(tr):
        if t_fin[k] is None:
            # buscar el siguiente tramo con fin conocido
            q = k
            while t_fin[q] is None:
                q += 1
            a0 = t_ini[k]
            span = t_fin[q] - a0
            ws = sum(peso[k:q + 1])
            acc = 0
            for r in range(k, q + 1):
                if t_ini[r] is None:
                    t_ini[r] = a0 + span * acc / ws
                acc += peso[r]
                if r < q:
                    t_fin[r] = a0 + span * acc / ws
            k = q + 1
        else:
            k += 1
    for (a, b), t0, t1 in zip(tr, t_ini, t_fin):
        frases.append({"a": a, "b": b, "t0": round(t0, 3), "t1": round(t1, 3)})
    return frases


def silencios_bordes(sil, dur):
    """Silencio al principio y al final de la locución."""
    ini = next((e for s, e in sil if s <= 0.15), 0.0)
    fin = next((dur - s for s, e in sil if e >= dur - 0.1), 0.0)
    return (ini, fin)


def subtitulos(texto, frases):
    subs, grupo = [], []
    for f in frases:
        grupo.append(f)
        trozo = texto[grupo[0]["a"]:f["b"]].strip()
        if re.search(r"[.…?!]\s*$", texto[f["a"]:f["b"]]) or len(trozo) > 80:
            subs.append({"a": grupo[0]["a"], "b": f["b"], "t0": grupo[0]["t0"], "t1": f["t1"]})
            grupo = []
    if grupo:
        subs.append({"a": grupo[0]["a"], "b": grupo[-1]["b"], "t0": grupo[0]["t0"], "t1": grupo[-1]["t1"]})
    return subs


def main():
    origen = Path(sys.argv[1])
    guion = json.loads((AQUI / "guion.json").read_text())
    tmp = Path(tempfile.mkdtemp())
    piezas, escenas, t = [], [], 0.0
    for e in guion:
        crudo = origen / f"{e['id']}.mp3"
        ent, sal = ESPECIAL.get(e["id"], (ENTRADA, SALIDA))
        texto = limpiar(e["texto"])
        if crudo.exists():
            ajustado = tmp / f"{e['id']}.wav"
            ritmo = ["-af", f"atempo={RITMO}"] if RITMO != 1.0 else []
            ffmpeg("-i", str(crudo), *ritmo, "-ar", str(TASA), "-ac", "1", "-c:a", "pcm_s16le", str(ajustado))
            voz = duracion(ajustado)
            frases = alinear(texto, voz, silencios(ajustado))
            piezas += [("silencio", ent), ("voz", ajustado), ("silencio", sal)]
        else:
            # Sin locución todavía: la escena corre con su texto en pantalla y el tiempo estimado
            voz, frases = len(texto) / CARACTERES_POR_SEGUNDO, []
            piezas += [("silencio", ent + voz + sal)]
            print(f"  aviso: falta {crudo.name}; {e['id']} queda sin voz")
        escenas.append({
            "id": e["id"], "capitulo": CAPITULOS.get(e["id"]), "start": round(t, 3), "lead": ent,
            "voz": round(voz, 3), "dur": round(ent + voz + sal, 3), "texto": e["texto"],
            "sinVoz": not crudo.exists(), "frases": frases, "subs": subtitulos(texto, frases),
        })
        t += ent + voz + sal
    # Pista única: voz + fondo ambiental (se agacha bajo la voz) + golpe del logo
    total = round(t, 3)
    entradas, filtros = [], []
    for i, (tipo, val) in enumerate(piezas):
        if tipo == "silencio":
            entradas += ["-f", "lavfi", "-t", f"{val:.3f}", "-i", f"anullsrc=r={TASA}:cl=mono"]
        else:
            entradas += ["-i", str(val)]
        filtros.append(f"[{i}:a]")
    n = len(piezas)
    grafo = "".join(filtros) + f"concat=n={n}:v=0:a=1,aformat=channel_layouts=stereo,asplit=2[voz][guia];"
    mezcla, k = "[voz]", 1
    fondo, golpe = origen / "sfx-fondo.mp3", origen / "sfx-sting6.mp3"
    if fondo.exists():
        entradas += ["-stream_loop", "-1", "-i", str(fondo)]
        grafo += (f"[{n}:a]aformat=sample_rates={TASA}:channel_layouts=stereo,atrim=0:{total},volume=0.08,"
                  f"afade=t=in:d=3,afade=t=out:st={total - 5}:d=5[f0];"
                  "[f0][guia]sidechaincompress=threshold=0.015:ratio=5:attack=60:release=700[fondo];")
        mezcla += "[fondo]"; k += 1; n += 1
    else:
        grafo += "[guia]anullsink;"
    if golpe.exists():
        entradas += ["-i", str(golpe)]
        grafo += f"[{n}:a]aformat=sample_rates={TASA}:channel_layouts=stereo,adelay=1300|1300,volume=0.35[golpe];"
        mezcla += "[golpe]"; k += 1; n += 1
    grafo += f"{mezcla}amix=inputs={k}:normalize=0:duration=first[out]"
    mezcla_wav = tmp / "mezcla.wav"
    ffmpeg(*entradas, "-filter_complex", grafo, "-map", "[out]", "-ar", str(TASA), "-ac", "2", "-c:a", "pcm_s24le", str(mezcla_wav))
    # Volumen: una ganancia fija hasta -16 LUFS (sin compresión dinámica) y un limitador suave
    medida = ffmpeg("-i", str(mezcla_wav), "-af", "loudnorm=I=-16:TP=-1.5:print_format=json", "-f", "null", "-").stderr
    entrada_i = float(re.findall(r'"input_i" : "(-?[\d.]+)"', medida)[-1])
    ganancia = -16 - entrada_i
    ffmpeg("-i", str(mezcla_wav), "-af", f"volume={ganancia:.2f}dB,alimiter=limit=0.89:attack=5:release=60",
           "-ar", str(TASA), "-c:a", "libmp3lame", "-b:a", "192k", str(AQUI / "voz.mp3"))
    total = round(t, 3)
    (AQUI / "timeline.js").write_text(
        "/* Generado por construir.py: no editar a mano. */\nwindow.TIMELINE = "
        + json.dumps({"total": total, "ritmo": RITMO, "escenas": escenas}, ensure_ascii=False, indent=1)
        + ";\n"
    )
    print(f"total {total:.1f} s · {len(escenas)} escenas")
    for s in escenas:
        print(f"  {s['id']:<16} inicio {s['start']:7.2f}  dur {s['dur']:6.2f}  frases {len(s['frases'])}")


if __name__ == "__main__":
    main()
