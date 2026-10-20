# Presentación · Avance 2 (50 %)

Video-presentación de 4:50 con voz femenina en español (ElevenLabs, voz «Valeria – Dynamic, Confident and Vibrant», `22VndfJPBU7AZORAZZTT`, modelo v4), motion graphic de inicio y demo animada de lo que entró en el sprint del 50 %. Todo está dibujado con el design system v4.1 (tokens de `docs/diseno/tokens.json`, tema oscuro, Geist y Geist Mono, riel de cinco etapas).

## Cómo verla

Sirve esta carpeta y abre `index.html` (el audio necesita servidor, no `file://`):

```bash
npx http-server docs/presentaciones/avance-2 -p 8765
```

Controles: espacio (reproducir o pausar), ← → (5 s), `C` (subtítulos), `F` (pantalla completa). La barra marca los capítulos.

## Escenas

| # | Escena | Qué se ve |
|---|---|---|
| — | Intro | Motion graphic: riel de cinco etapas → wordmark → «Imagina esto…» → repo publicado |
| 01 | Cómo vamos | Del 32 % de la primera entrega al 57 %; 12 funciones, 625 pruebas y la lista de lo nuevo |
| 02 | Detección de stack | Lo más importante del sprint: archivo → receta, Dockerfile escrito por la receta, «Stack detectado: Node.js 22» (M4-03) |
| 03 | Publicar en vivo | Alta con `SALUDO`, riel y bitácora en vivo (M7-01), «Visitar» |
| 04 | Variables cifradas | Pantalla → cifrado AES-256-GCM → base → trabajador (M3-03) |
| 05 | Actualizar sin corte | Relevo v1 → v2, reiniciar y detener (M5-02) |
| 06 | Planes y cobro | Planes, tarjetas de prueba, Mi suscripción (M2-02 a M2-04) |
| 07 | Bloqueos por plan | Vencida y cuota agotada (M5-03) |
| 08 | Cuentas y seguridad | Recuperar contraseña, sesiones cerradas, 403 (M1-04, M1-05) |
| 09 | Bajo el capó | Web → API → fila → trabajador → internet; puertos y patrones |
| — | Cierre | Lo que viene en el 85 % y el equipo. **Sin voz por ahora**: ElevenLabs bloqueó la cuenta gratis antes de generarla; ver abajo |

## Pendiente: la voz del cierre

Falta `s10-cierre.mp3`. Para completarla, genera en ElevenLabs el texto de `s10-cierre` de `guion.json` con la misma voz y modelo, guarda el mp3 junto a los demás y vuelve a correr `construir.py`: la escena toma la voz y se resincroniza sola.

La calidad se revisa midiendo el espectro: una voz sana conserva energía por encima de 8 kHz. La voz anterior («Andrea») llegaba cortada a ~7 kHz desde ElevenLabs y por eso sonaba a radio.

## Archivos

| Archivo | Qué es |
|---|---|
| `guion.json` | Texto que dice la voz, por escena (con etiquetas de entonación de ElevenLabs v4) |
| `construir.py` | Une las locuciones, mide sus pausas y escribe `voz.mp3` y `timeline.js` |
| `timeline.js` | Generado: inicio, duración y frases medidas de cada escena |
| `motor.js` | Reloj único y animaciones; todo se calcula a partir del tiempo de la voz |
| `index.html` | Escenas y reproductor |
| `voz.mp3` | Voz + fondo ambiental muy bajo (≈ 13 dB bajo la voz y se agacha cuando habla) + golpe del logo |

Las animaciones se sincronizan con frases del guion (`data-at="@Le das a Desplegar"`): si cambia el texto o se regenera la voz, basta con correr `construir.py` con la carpeta de los mp3 por escena.

`index.html?render=1` expone `window.__render(t)` para exportar el video cuadro por cuadro (Playwright + ffmpeg a 30 fps).
