import { describe, expect, test } from "bun:test";
import { PRODUCTS } from "../src/lib/catalog";
import { ProductMatcher } from "../src/lib/marketplace/matcher";
import { AmazonProvider } from "../src/lib/marketplace/providers/amazon";
import { CromaProvider } from "../src/lib/marketplace/providers/croma";
import { FlipkartProvider } from "../src/lib/marketplace/providers/flipkart";
import { MockMarketplaceProvider } from "../src/lib/marketplace/providers/mock";
import { MarketplaceService } from "../src/lib/marketplace/service";

describe("Marketplace System — Providers, Matcher & Service", () => {
  test("MockMarketplaceProvider returns demo offers with isLive = false", async () => {
    const provider = new MockMarketplaceProvider();
    expect(provider.status).toBe("demo");
    const offers = await provider.searchProducts({ query: "Sony WH-1000XM5" });
    expect(offers.length).toBeGreaterThan(0);
    expect(offers[0].source).toBe("demo");
    expect(offers[0].isLive).toBe(false);
  });

  test("Amazon, Flipkart, Croma return no_credentials status and throw NOT_CONFIGURED when API keys are unconfigured", async () => {
    const amazon = new AmazonProvider();
    const flipkart = new FlipkartProvider();
    const croma = new CromaProvider();

    expect(amazon.status).toBe("no_credentials");
    expect(flipkart.status).toBe("no_credentials");
    expect(croma.status).toBe("no_credentials");

    expect(amazon.searchProducts({ query: "Sony WH-1000XM5" })).rejects.toThrow("NOT_CONFIGURED");
    expect(flipkart.searchProducts({ query: "Sony WH-1000XM5" })).rejects.toThrow("NOT_CONFIGURED");
    expect(croma.searchProducts({ query: "Sony WH-1000XM5" })).rejects.toThrow("NOT_CONFIGURED");
  });

  test("ProductMatcher correctly matches and rejects offers based on brand/RAM/storage", () => {
    const product = PRODUCTS.find((p) => p.category === "headphone")!;
    const matcher = new ProductMatcher();

    const matchOffer = {
      marketplace: "Amazon",
      productName: `${product.brand} ${product.name} Wireless Headphones`,
      brand: product.brand,
      price: product.price_inr,
      currency: "INR",
      availability: true,
      source: "live",
      fetchedAt: new Date().toISOString(),
      isLive: true,
    };

    const wrongBrandOffer = {
      ...matchOffer,
      productName: "Unrelated Brand Product 45",
      brand: "UnrelatedBrand",
    };

    expect(matcher.isMatch(product, matchOffer)).toBe(true);
    expect(matcher.isMatch(product, wrongBrandOffer)).toBe(false);
  });

  test("MarketplaceService generates comparison with provider status tracking", async () => {
    const service = new MarketplaceService([
      new MockMarketplaceProvider(),
      new AmazonProvider(),
      new FlipkartProvider(),
      new CromaProvider(),
    ]);

    const product = PRODUCTS[0];
    const comparison = await service.getComparison(product);

    expect(comparison.productId).toBe(product.product_id);
    expect(comparison.providerStatus["Demo Store"]).toBe("demo");
    expect(comparison.providerStatus["Amazon"]).toBe("no_credentials");
    expect(comparison.providerStatus["Flipkart"]).toBe("no_credentials");
    expect(comparison.providerStatus["Croma"]).toBe("no_credentials");

    expect(comparison.offers.length).toBeGreaterThan(0);
    expect(comparison.cheapestOffer).not.toBeNull();
  });
});
