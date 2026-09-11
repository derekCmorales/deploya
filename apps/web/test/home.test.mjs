import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("el home es placeholder neutro", () => {
  const page = readFileSync(join(root, "src/app/page.tsx"), "utf8");
  assert.match(page, /placeholder neutro/i);
  assert.doesNotMatch(page, /#121212|#0D6EFD|\bInter\b/);
});
