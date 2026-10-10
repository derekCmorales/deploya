/// <reference types="jest" />

import { CifradorAesGcm } from './cifrador-aes-gcm';
import { VariableIlegible } from '../dominio/errores';

describe('CifradorAesGcm', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('Cifrado y descifrado (ida y vuelta) exitoso con AES-256-GCM', () => {
    process.env.CLAVE_CIFRADO_VARIABLES = '12345678901234567890123456789012'; // 32 bytes exactos
    const cifrador = new CifradorAesGcm();
    const original = 'secreto_super_seguro';
    
    const cifrado = cifrador.cifrar(original);
    const descifrado = cifrador.descifrar(cifrado);
    
    expect(descifrado).toBe(original);
    expect(cifrado.startsWith('v1:')).toBe(true);
  });

  it('El IV es distinto en cada cifrado para un mismo texto', () => {
    process.env.CLAVE_CIFRADO_VARIABLES = '12345678901234567890123456789012';
    const cifrador = new CifradorAesGcm();
    const texto = 'mismo_valor';
    
    const c1 = cifrador.cifrar(texto);
    const c2 = cifrador.cifrar(texto);
    
    expect(c1).not.toBe(c2);
  });

  it('Valor cifrado alterado o formato inválido lanza VariableIlegible', () => {
    process.env.CLAVE_CIFRADO_VARIABLES = '12345678901234567890123456789012';
    const cifrador = new CifradorAesGcm();
    const cifrado = cifrador.cifrar('hola');
    
    // Alterar un carácter en la parte del texto cifrado
    const partes = cifrado.split(':');
    partes[3] = 'A' + partes[3].slice(1);
    const alterado = partes.join(':');
    
    expect(() => cifrador.descifrar(alterado)).toThrow(VariableIlegible);
    expect(() => cifrador.descifrar('v1:invalido')).toThrow(VariableIlegible);
  });

  it('Clave con longitud distinta de 32 bytes rechaza al instanciar', () => {
    process.env.CLAVE_CIFRADO_VARIABLES = 'clave_corta';
    expect(() => new CifradorAesGcm()).toThrow();
  });
});