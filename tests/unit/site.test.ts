import { describe, it, expect } from "vitest";
import { resolveSite } from "../../src/lib/site";

describe("resolveSite", () => {
  it("prend SITE_URL en priorité, sans slash final", () => {
    expect(
      resolveSite({ SITE_URL: "https://exemple.dev/", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" }),
    ).toBe("https://exemple.dev");
  });
  it("sinon le domaine de production fourni par Vercel", () => {
    expect(resolveSite({ VERCEL_PROJECT_PRODUCTION_URL: "portfolio-x.vercel.app" })).toBe(
      "https://portfolio-x.vercel.app",
    );
  });
  it("sinon localhost", () => {
    expect(resolveSite({})).toBe("http://localhost:4321");
  });
});
