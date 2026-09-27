import { ClonFallido } from "../../modules/construccion/dominio/errores";
import { ClonadorGit } from "./clonador-git";

describe("ClonadorGit", () => {
  it.each(["file:///etc", "git@github.com:a/b.git", "--upload-pack=touch /tmp/x", "http://github.com/a/b"])(
    "rechaza %s antes de ejecutar git: solo https públicos",
    async (url) => {
      await expect(new ClonadorGit("/tmp/deploya").clonar({ url, rama: "main", despliegueId: "d" })).rejects.toThrow(ClonFallido);
    },
  );
});
