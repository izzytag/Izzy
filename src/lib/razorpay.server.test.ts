import { describe, it, expect } from "vitest";
import { verifyRazorpaySignature } from "./razorpay.server";

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
