import { describe, it, expect } from "vitest";
import { getPageMode, visiblePageItems } from "./page-mode";

describe("exclusive page modes", () => {
  it("empty page has no mode yet", () => {
    expect(getPageMode([])).toBe("empty");
    expect(getPageMode([{ kind: "link", enabled: false }])).toBe("empty");
  });
  it("links only give a link page", () => {
    expect(getPageMode([{ kind: "link", enabled: true }])).toBe("links");
  });
  it("a product or a service gives a store/service page", () => {
    expect(getPageMode([{ kind: "product", enabled: true }])).toBe("shop");
    expect(getPageMode([{ kind: "service", enabled: true }])).toBe("shop");
  });
  it("legacy mixed pages show as store/service, never a mix", () => {
    const items = [
      { id: "1", kind: "link", enabled: true },
      { id: "2", kind: "product", enabled: true },
    ];
    expect(getPageMode(items)).toBe("shop");
    expect(visiblePageItems(items).map((i) => i.id)).toEqual(["2"]);
  });
  it("link pages hide products and services from visitors", () => {
    const items = [
      { id: "1", kind: "link", enabled: true },
      { id: "2", kind: "product", enabled: false },
    ];
    expect(getPageMode(items)).toBe("links");
    expect(visiblePageItems(items).map((i) => i.id)).toEqual(["1"]);
  });
  it("disabled rows do not set the mode", () => {
    expect(getPageMode([{ kind: "product", enabled: false }, { kind: "link", enabled: true }])).toBe("links");
  });
  it("rows without an enabled flag count as enabled (public-page data)", () => {
    expect(getPageMode([{ kind: "product" }])).toBe("shop");
    expect(getPageMode([{ kind: "link" }])).toBe("links");
  });
});
