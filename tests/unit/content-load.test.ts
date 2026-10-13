import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { loadAndCheck } from "../../src/lib/content/load";

const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)).replace(/\/$/, "");

describe("loadAndCheck", () => {
  it("ne signale rien sur un contenu valide", () => {
    expect(loadAndCheck(fixture("content-ok")).errors).toEqual([]);
  });
  it("cite le fichier et le champ fautifs", () => {
    const { errors } = loadAndCheck(fixture("content-bad"));
    const fields = errors.map((e) => `${e.file}#${e.field}`);
    expect(fields).toEqual(
      expect.arrayContaining([
        "src/content/projects/demo/meta.yaml#fr.mdx",
        "src/content/projects/demo/meta.yaml#stack",
        "src/content/projects/dates/meta.yaml#end",
      ]),
    );
  });
  it("nomme le skill inconnu", () => {
    const { errors } = loadAndCheck(fixture("content-bad"));
    expect(errors.find((e) => e.field === "stack")?.message).toBe("skill inconnu : inconnu");
  });
});
