import { describe, it, expect } from "vitest";
import { localize, visibleProjects } from "../../src/lib/content/select";

describe("localize", () => {
  it("renvoie la langue demandée", () => {
    expect(localize({ fr: "Bonjour", en: "Hello" }, "en")).toEqual({ text: "Hello", lang: "en" });
  });
  it("retombe sur le français, signalé par lang=fr, si l'anglais est vide", () => {
    expect(localize({ fr: "Bonjour", en: "" }, "en")).toEqual({ text: "Bonjour", lang: "fr" });
    expect(localize({ fr: "Bonjour", en: "   " }, "en")).toEqual({ text: "Bonjour", lang: "fr" });
  });
});

describe("visibleProjects", () => {
  const e = (id: string, status: string, order: number) => ({ id, data: { status, order } });
  const all = [e("b", "published", 2), e("a", "published", 1), e("d", "draft", 0), e("z", "archived", 0)];
  it("garde les publiés, triés par ordre", () => {
    expect(visibleProjects(all, { includeDrafts: false }).map((x) => x.id)).toEqual(["a", "b"]);
  });
  it("inclut les brouillons en dev, jamais les archivés", () => {
    expect(visibleProjects(all, { includeDrafts: true }).map((x) => x.id)).toEqual(["d", "a", "b"]);
  });
  it("départage un ordre égal par identifiant", () => {
    const tie = [e("z", "published", 1), e("m", "published", 1)];
    expect(visibleProjects(tie, { includeDrafts: false }).map((x) => x.id)).toEqual(["m", "z"]);
  });
});
