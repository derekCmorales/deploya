import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { CifradorVariables } from '../puertos/cifrador-variables.puerto';
import { VariableIlegible } from '../dominio/errores';

@Injectable()
export class CifradorAesGcm extends CifradorVariables {
  private readonly key: Buffer;

  constructor() {
    super();
    const rawKey = process.env.CLAVE_CIFRADO_VARIABLES || '';
    const keyBuffer = Buffer.from(rawKey, 'utf-8');
    
    if (keyBuffer.length !== 32) {
      throw new Error('CLAVE_CIFRADO_VARIABLES debe tener exactamente 32 bytes de longitud.');
    }
    this.key = keyBuffer;
  }

  cifrar(valor: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(valor, 'utf-8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  descifrar(valorCifrado: string): string {
    try {
      const partes = valorCifrado.split(':');
      if (partes.length !== 4 || partes[0] !== 'v1') {
        throw new VariableIlegible();
      }
      const [, ivBase64, tagBase64, textoBase64] = partes;
      const iv = Buffer.from(ivBase64, 'base64');
      const tag = Buffer.from(tagBase64, 'base64');
      const encrypted = Buffer.from(textoBase64, 'base64');

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString('utf-8');
    } catch {
      throw new VariableIlegible();
    }
  }
}