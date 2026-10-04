import { describe, expect, test } from "bun:test";
import { parseRequirement } from "../src/lib/engine";

describe("Requirement Engine — Category and Priority Parsing", () => {
  test("correctly parses headphones requirement without matching phone", () => {
    const req = parseRequirement("Noise cancelling headphones under 20000 for daily commute");
    expect(req.category).toBe("headphone");
    expect(req.budget_max).toBe(20000);
    expect(req.priorities).toContain("noise_cancellation");
  });

  test("correctly parses smartphone requirement", () => {
    const req = parseRequirement("Phone under 30000 with a great camera and 5G");
    expect(req.category).toBe("smartphone");
    expect(req.budget_max).toBe(30000);
    expect(req.priorities).toContain("camera");
  });

  test("correctly parses laptop requirement", () => {
    const req = parseRequirement("Laptop under 60000 with good battery life for coding");
    expect(req.category).toBe("laptop");
    expect(req.budget_max).toBe(60000);
    expect(req.priorities).toContain("battery");
  });

  test("correctly parses shoes requirement", () => {
    const req = parseRequirement("Running shoes under 12000 for marathon training");
    expect(req.category).toBe("shoes");
    expect(req.budget_max).toBe(12000);
    expect(req.priorities).toContain("running");
  });

  test("correctly parses skincare requirement", () => {
    const req = parseRequirement("Hydrating moisturizer for dry skin under 3000");
    expect(req.category).toBe("skincare");
    expect(req.budget_max).toBe(3000);
    expect(req.priorities).toContain("dry_skin");
  });

  test("correctly parses furniture requirement", () => {
    const req = parseRequirement("Ergonomic chair under 15000 for work");
    expect(req.category).toBe("furniture");
    expect(req.budget_max).toBe(15000);
    expect(req.priorities).toContain("comfort");
  });
});
