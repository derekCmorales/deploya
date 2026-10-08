export abstract class MotorConstruccionPuerto {
  abstract ejecutarConstruccion(construccionId: string, urlRepo: string, rama: string): Promise<void>;
}