import test from 'node:test';
import assert from 'node:assert';
import {
  fusionarLineas,
  lineaDeError,
  textoParaCopiar,
  tiempoTranscurrido,
  avisoVersionAnterior
} from '../src/lib/despliegues.ts';

test('Construcción en curso: las líneas nuevas se agregan en orden sin duplicar', () => {
  const previas = [{ n: 1, marca: '10:00:00', etapa: 'setup', texto: 'Iniciando' }];
  const nuevas = [
    { n: 1, marca: '10:00:00', etapa: 'setup', texto: 'Iniciando' },
    { n: 2, marca: '10:00:01', etapa: 'build', texto: 'Compilando' }
  ];
  const resultado = fusionarLineas(previas, nuevas);
  assert.strictEqual(resultado.length, 2);
  assert.strictEqual(resultado[1].n, 2);
  assert.strictEqual(resultado[1].texto, 'Compilando');
});

test('Construcción fallida: línea del error y aviso de la versión anterior', () => {
  const lineas = [
    { n: 1, marca: '10:00:00', etapa: 'build', texto: 'Compilando' },
    { n: 2, marca: '10:00:05', etapa: 'build', texto: 'Error de sintaxis', nivel: 'error' }
  ];
  const err = lineaDeError(lineas);
  assert.strictEqual(err?.n, 2);
  assert.strictEqual(err?.nivel, 'error');

  const aviso = avisoVersionAnterior(2);
  assert.strictEqual(aviso, 'La versión #2 sigue sirviendo tráfico');
});

test('Copiar bitácora', () => {
  const lineas = [
    { n: 1, marca: '10:00:00', etapa: 'setup', texto: 'Iniciando proceso' }
  ];
  const texto = textoParaCopiar(lineas);
  assert.strictEqual(texto, '1 10:00:00 Iniciando proceso');
});

test('Tiempo transcurrido con ahora fijo', () => {
  const desde = '2026-06-06T10:00:00.000Z';
  const ahora = '2026-06-06T10:01:25.000Z';
  const t = tiempoTranscurrido(desde, ahora);
  assert.strictEqual(t, '1m 25s');
});