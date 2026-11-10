import { describe, it, expect, vi, afterEach } from "vitest";
import { verifyRazorpaySignature, cancellationDecision, cancelRazorpaySubscription } from "./razorpay.server";

// Known vector, computed with node:crypto HMAC-SHA256:
// secret "test_secret", payload "pay_123|sub_456".
const VALID = "30a82807e3eb0b23f19cc33d65f4c31447bfcf100cbc3a0233f1973be689c80b";

describe("verifyRazorpaySignature", () => {
  it("accepts the known-good signature", () => {
    expect(
      verifyRazorpaySignature({ paymentId: "pay_123", subscriptionId: "sub_456", signature: VALID, secret: "test_secret" }),
    ).toBe(true);
  });
  it("rejects a tampered signature", () => {
    expect(
      verifyRazorpaySignature({ paymentId: "pay_123", subscriptionId: "sub_456", signature: "00".repeat(32), secret: "test_secret" }),
    ).toBe(false);
  });
  it("rejects the right signature under the wrong secret", () => {
    expect(
      verifyRazorpaySignature({ paymentId: "pay_123", subscriptionId: "sub_456", signature: VALID, secret: "another_secret" }),
    ).toBe(false);
  });
  it("rejects non-hex or wrong-length signatures without throwing", () => {
    expect(
      verifyRazorpaySignature({ paymentId: "pay_123", subscriptionId: "sub_456", signature: "not-hex!!", secret: "test_secret" }),
    ).toBe(false);
    expect(
      verifyRazorpaySignature({ paymentId: "pay_123", subscriptionId: "sub_456", signature: "abcd", secret: "test_secret" }),
    ).toBe(false);
  });
  it("rejects empty inputs", () => {
    expect(
      verifyRazorpaySignature({ paymentId: "", subscriptionId: "sub_456", signature: VALID, secret: "test_secret" }),
    ).toBe(false);
    expect(
      verifyRazorpaySignature({ paymentId: "pay_123", subscriptionId: "sub_456", signature: VALID, secret: "" }),
    ).toBe(false);
  });
});

describe("cancellationDecision", () => {
  it("cancels live subscriptions at cycle end", () => {
    expect(cancellationDecision("active")).toBe("cancel");
    expect(cancellationDecision("authenticated")).toBe("cancel");
  });
  it("treats finished subscriptions as already ended", () => {
    expect(cancellationDecision("cancelled")).toBe("already_ended");
    expect(cancellationDecision("completed")).toBe("already_ended");
    expect(cancellationDecision("expired")).toBe("already_ended");
  });
  it("refuses to guess for any other status", () => {
    expect(cancellationDecision("created")).toBe("unavailable");
    expect(cancellationDecision("pending")).toBe("unavailable");
    expect(cancellationDecision("halted")).toBe("unavailable");
    expect(cancellationDecision("paused")).toBe("unavailable");
    expect(cancellationDecision("")).toBe("unavailable");
  });
});

describe("cancelRazorpaySubscription", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs a cycle-end cancel for the given subscription", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: "sub_123", status: "active", current_end: 1797000000 }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await cancelRazorpaySubscription({
      keyId: "rzp_test_key",
      keySecret: "test_secret",
      subscriptionId: "sub_123",
    });
    expect(result.id).toBe("sub_123");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.razorpay.com/v1/subscriptions/sub_123/cancel");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ cancel_at_cycle_end: 1 });
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe(
      `Basic ${Buffer.from("rzp_test_key:test_secret").toString("base64")}`,
    );
  });

  it("throws a generic error (no response body) when Razorpay rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 400, json: async () => ({ error: "sensitive" }) })),
    );
    await expect(
      cancelRazorpaySubscription({ keyId: "rzp_test_key", keySecret: "test_secret", subscriptionId: "sub_123" }),
    ).rejects.toThrow("Razorpay request failed");
  });
});
