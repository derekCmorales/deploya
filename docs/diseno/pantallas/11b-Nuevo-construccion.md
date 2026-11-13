# 11b · Nuevo proyecto · 2 Construcción

| | |
|---|---|
| Ruta | `/projects/nuevo` |
| Dueño | Eduardo (+ Derek) |
| Historias | M3-02 · alta guiada |
| Entrega | Sprint fuera de alcance · change `feat-m3-alta-guiada` |
| Diseño | Se construye desde esta ficha con el patrón E del asistente (sin artboard propio) |

## Qué es

Paso 2 de 5. Tarjeta con lo que detectó el paso Repositorio y dos comandos opcionales: **Comando de construcción** (solo si la receta lo aplica: Node, Python, Go) y **Comando de inicio** (siempre). Con `Dockerfile` propio o sitio estático, en lugar del primer campo va un `Sunken` que explica por qué no aplica. Los mismos campos están en Configuración (19).

## Componentes

`Card`, `Sunken`, `Field`, `Input` con icono (`Hammer`, `Terminal`), `Pasos` en la columna. Reglas: [../README.md](../README.md).

## Textos de la pantalla

```text
Paso 2 · Construcción
¿Cómo se construye y arranca?
Déjalos vacíos para usar lo que detectamos. Los puedes cambiar después en Configuración.
Comando de construcción (opcional)
Reemplaza npm run build. Corre después de instalar dependencias.
Tu Dockerfile manda: el build lo definen sus instrucciones RUN.
Comando de inicio (opcional)
Sobrescribe el CMD de la imagen. Útil para correr un worker con la misma imagen, p. ej. node dist/worker.js
Paso 2 de 5 · opcional
```

## Errores

`comando-invalido` va bajo su campo: «El comando de construcción va en una sola línea.», «Falta cerrar una comilla.», «El comando admite hasta 512 caracteres.».
