import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/lib/engine";

describe("Recommendation Engine — Category-Agnostic Matching", () => {
  test("headphone query returns a headphone product and never a smartphone", () => {
    const decision = evaluate("Noise cancelling headphones under 20000 for daily commute");
    expect(decision.product).not.toBeNull();
    expect(decision.product?.category).toBe("headphone");
    expect(decision.product?.name).not.toContain("Motorola");
  });

  test("shoes query returns a shoe product", () => {
    const decision = evaluate("Running shoes under 12000 for marathon training");
    expect(decision.product).not.toBeNull();
    expect(decision.product?.category).toBe("shoes");
  });

  test("skincare query returns a skincare product", () => {
    const decision = evaluate("Hydrating moisturizer for dry skin under 3000");
    expect(decision.product).not.toBeNull();
    expect(decision.product?.category).toBe("skincare");
  });

  test("furniture query returns a furniture product", () => {
    const decision = evaluate("Ergonomic chair under 15000 for work");
    expect(decision.product).not.toBeNull();
    expect(decision.product?.category).toBe("furniture");
  });

  test("returns explicit no matching products message when category is not in catalog", () => {
    const decision = evaluate("Novel books under 500");
    expect(decision.product).toBeNull();
    expect(decision.explanation).toContain("No matching products were found in the current catalog for this category");
  });
});
