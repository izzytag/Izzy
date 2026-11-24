import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  type RouteComponent,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// The pages read the visitor pricing region, which calls a server
// function — pin it to ROW so the render stays offline and
// deterministic.
vi.mock("@/lib/useRegion", () => ({ useRegion: () => "ROW" as const }));

import { buttonVariants } from "@/components/ui/button";
import { Landing } from "@/routes/index";

// The Pinterest look lives in the design tokens, so pin them by reading
// the stylesheet itself — a token regression shows up here first.
// (Read from disk: ?raw imports come back empty under vitest, and
// import.meta.url is not a file:// URL here, so fs + cwd is the
// reliable route. Tests run from the repo root.)
const css = readFileSync(join(process.cwd(), "src/styles.css"), "utf-8");

// Same minimal test tree as the slim-homepage tests: the page plus a
// stub /auth, without mounting the app root (Supabase auth).
async function renderPage(path: string, component: RouteComponent) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const pageRoute = createRoute({ getParentRoute: () => rootRoute, path, component });
  const authRoute = createRoute({ getParentRoute: () => rootRoute, path: "/auth", component: () => null });
  const testTree = rootRoute.addChildren([pageRoute, authRoute]);
  const router = createRouter({ routeTree: testTree, history: createMemoryHistory({ initialEntries: [path] }) });
  await router.load();
  return render(<RouterProvider router={router} />);
}

describe("pinterest brand tokens", () => {
  it("the stylesheet was actually read (guards against vacuous passes)", () => {
    expect(css.length).toBeGreaterThan(1000);
    expect(css).toContain(":root");
  });

  it("page background is pure white and the action accent is Pin Red", () => {
    expect(css).toContain("--background: #FFFFFF;");
    expect(css).toContain("--primary: #E60023;");
    expect(css).toContain("--ring: #E60023;");
    expect(css).toContain("--primary-soft: #FDE8EB;");
  });

  it("no violet or cream tokens remain", () => {
    expect(css).not.toContain("#7457E8");
    expect(css).not.toContain("#FAF9F6");
    expect(css).not.toContain("#EFEAFB");
  });

  it("WhatsApp green is untouched", () => {
    expect(css).toContain("--whatsapp: #25D366;");
  });

  it("buttons are pill-shaped", () => {
    const classes = buttonVariants();
    expect(classes).toContain("rounded-full");
    expect(classes).not.toContain("rounded-lg");
  });

  it("homepage showcase cards are 16px pins", async () => {
    await renderPage("/", Landing);
    const links = screen.getAllByText("View demo shop");
    expect(links).toHaveLength(3);
    for (const link of links) {
      expect(link.closest("a")).toHaveClass("rounded-xl");
    }
  });
});
