import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PublicProfile, type PublicData } from "@/components/PublicProfile";

const ITEM = { id: "1", title: "Chocolate cake", url: "#", kind: "product", price: "₹499", description: "Rich Belgian chocolate.", image_urls: ["/examples/chocolate-cake.webp"], category: null };

const SHOP: PublicData = {
  display_name: "Test Shop",
  username: "testshop",
  bio: "A shop for testing.",
  category: "Bakery",
  avatar_url: "/examples/chocolate-cake.webp",
  socials: {},
  whatsapp: "919999999999",
  upi_id: null,
  links: [ITEM],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubObserver() {
  let callback!: IntersectionObserverCallback;
  class MockObserver {
    constructor(cb: IntersectionObserverCallback) {
      callback = cb;
    }
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
  }
  vi.stubGlobal("IntersectionObserver", MockObserver);
  return (isIntersecting: boolean) =>
    act(() => {
      callback([{ isIntersecting } as IntersectionObserverEntry], {} as unknown as IntersectionObserver);
    });
}

describe("Sticky shop header", () => {
  it("slides the logo and name in at the top once the store header scrolls away, and hides it again at the top", () => {
    const setIntersecting = stubObserver();
    render(<PublicProfile data={SHOP} theme="light" showBranding />);

    const mini = screen.getByTestId("sticky-shop-header");
    expect(mini.classList.contains("-translate-y-full")).toBe(true);
    expect(mini.getAttribute("aria-hidden")).toBe("true");

    setIntersecting(false);
    expect(mini.classList.contains("translate-y-0")).toBe(true);
    expect(mini.classList.contains("opacity-100")).toBe(true);
    expect(mini.getAttribute("aria-hidden")).toBe("false");
    // Logo and shop name, top-left.
    expect(mini.querySelector("img")?.getAttribute("src")).toBe("/examples/chocolate-cake.webp");
    expect(mini.textContent).toContain("Test Shop");

    setIntersecting(true);
    expect(mini.classList.contains("-translate-y-full")).toBe(true);
    expect(mini.getAttribute("aria-hidden")).toBe("true");
  });

  it("falls back to the initial-letter logo when the shop has no avatar", () => {
    stubObserver();
    render(<PublicProfile data={{ ...SHOP, avatar_url: null }} theme="light" showBranding />);

    const mini = screen.getByTestId("sticky-shop-header");
    expect(mini.querySelector("img")).toBeNull();
    expect(mini.textContent).toContain("T");
    expect(mini.textContent).toContain("Test Shop");
  });

  it("never renders in compact mode (dashboard previews and mockups)", () => {
    stubObserver();
    render(<PublicProfile data={SHOP} theme="light" showBranding compact />);

    expect(screen.queryByTestId("sticky-shop-header")).toBeNull();
  });

  it("stays hidden and does not crash when IntersectionObserver is unavailable", () => {
    // jsdom has no IntersectionObserver by default.
    render(<PublicProfile data={SHOP} theme="light" showBranding />);

    const mini = screen.getByTestId("sticky-shop-header");
    expect(mini.classList.contains("-translate-y-full")).toBe(true);
  });
});
