import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  type RouteComponent,
} from "@tanstack/react-router";
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The page reads the visitor pricing region, which calls a server
// function — pin it to ROW so the render stays offline and
// deterministic.
vi.mock("@/lib/useRegion", () => ({ useRegion: () => "ROW" as const }));

import { Reveal } from "@/components/Reveal";
import { Landing } from "@/routes/index";

// Same minimal-router render as the slim-homepage tests: the page
// uses <Link to="/auth">, so mount it with a stub /auth route.
async function renderPage(path: string, component: RouteComponent) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const pageRoute = createRoute({ getParentRoute: () => rootRoute, path, component });
  const authRoute = createRoute({ getParentRoute: () => rootRoute, path: "/auth", component: () => null });
  const testTree = rootRoute.addChildren([pageRoute, authRoute]);
  const router = createRouter({ routeTree: testTree, history: createMemoryHistory({ initialEntries: [path] }) });
  await router.load();
  return render(<RouterProvider router={router} />);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Reveal", () => {
  it("shows content immediately when IntersectionObserver is unavailable", () => {
    // jsdom has no IntersectionObserver — the content must not stay hidden.
    const { container } = render(<Reveal>hello</Reveal>);

    const el = container.firstElementChild;
    expect(el?.classList.contains("reveal")).toBe(true);
    expect(el?.classList.contains("reveal-visible")).toBe(true);
    expect(el?.textContent).toBe("hello");
  });

  it("reveals when the element scrolls into view, once", () => {
    let callback!: IntersectionObserverCallback;
    const observe = vi.fn();
    const disconnect = vi.fn();
    class MockObserver {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
    }
    vi.stubGlobal("IntersectionObserver", MockObserver);

    const { container } = render(<Reveal>hello</Reveal>);
    const el = container.firstElementChild;

    expect(el?.classList.contains("reveal-visible")).toBe(false);
    expect(observe).toHaveBeenCalledTimes(1);

    act(() => {
      callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        new MockObserver(() => {}) as unknown as IntersectionObserver,
      );
    });

    expect(el?.classList.contains("reveal-visible")).toBe(true);
    expect(disconnect).toHaveBeenCalled();
  });

  it("passes a stagger delay through as a transition delay", () => {
    const { container } = render(<Reveal delay={180}>hello</Reveal>);

    const el = container.firstElementChild as HTMLElement;
    expect(el.style.transitionDelay).toBe("180ms");
  });
});

describe("homepage motion CSS", () => {
  it("disables all homepage animation under prefers-reduced-motion", () => {
    // Tests run from the project root, so the stylesheet is read by
    // its project-relative path (import.meta.url is rewritten by the
    // test transform and is not a file URL here).
    const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    // The guard must cover the hero entrance, the float and the
    // scroll reveal, and must leave revealed content visible.
    expect(css).toContain(".anim-hero-1");
    expect(css).toContain(".anim-float");
    expect(css).toContain(".reveal");
    expect(css).toContain("animation: none");
    expect(css).toContain(".reveal { opacity: 1; transform: none; }");
    // Only opacity and transform are animated — no layout properties.
    expect(css).toContain("@keyframes hero-rise");
    expect(css).toContain("@keyframes float-soft");
  });
});

describe("animated homepage", () => {
  it("enters the hero in sequence and floats the phone mockup", async () => {
    const { container } = await renderPage("/", Landing);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.classList.contains("anim-hero-2")).toBe(true);
    expect(container.querySelector(".anim-hero-1")).not.toBeNull();
    expect(container.querySelector(".anim-hero-3")).not.toBeNull();
    expect(container.querySelector(".anim-hero-4")).not.toBeNull();
    expect(container.querySelector(".anim-float")).not.toBeNull();
  });

  it("reveals sections on scroll", async () => {
    const { container } = await renderPage("/", Landing);

    // jsdom has no IntersectionObserver, so every reveal is visible.
    expect(container.querySelectorAll(".reveal").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".reveal-visible").length).toBeGreaterThan(0);
  });

  it("shows the example shops as listing cards with one action each", async () => {
    await renderPage("/", Landing);

    expect(screen.getByText("Thread Studio")).toBeInTheDocument();
    expect(screen.getByText("Glow Lab")).toBeInTheDocument();
    expect(screen.getAllByText("View demo shop")).toHaveLength(3);
    // The old phone-mockup grid and its separate button are gone.
    expect(screen.queryByText("Try a demo shop")).toBeNull();
  });
});
