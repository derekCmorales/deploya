<<<<<<< HEAD
/// <reference types="jest" />
import { puertoDesdeExpose } from "./puerto-expose";

describe("puertoDesdeExpose", () => {
  it("un EXPOSE", () => {
=======
import { puertoDesdeExpose } from "./puerto-expose";

describe("puertoDesdeExpose", () => {
  it("Puerto desde EXPOSE: un EXPOSE", () => {
>>>>>>> origin/main
    expect(puertoDesdeExpose("EXPOSE 3000")).toBe(3000);
  });

  it("EXPOSE 3000/tcp", () => {
    expect(puertoDesdeExpose("EXPOSE 3000/tcp")).toBe(3000);
  });

<<<<<<< HEAD
  it("varios EXPOSE", () => {
    expect(puertoDesdeExpose("EXPOSE 3000 8080")).toBe(3000);
  });

  it("sin EXPOSE", () => {
=======
  it("Puerto desde EXPOSE: con varios gana el primero", () => {
    expect(puertoDesdeExpose("EXPOSE 3000 8080")).toBe(3000);
  });

  it("Puerto desde EXPOSE: sin EXPOSE devuelve null", () => {
>>>>>>> origin/main
    expect(puertoDesdeExpose("FROM node:18")).toBeNull();
  });

  it("comentarios EXPOSE se ignoran", () => {
    expect(puertoDesdeExpose("# EXPOSE 9999\nEXPOSE 4000")).toBe(4000);
  });
<<<<<<< HEAD
});
=======
});
>>>>>>> origin/main
