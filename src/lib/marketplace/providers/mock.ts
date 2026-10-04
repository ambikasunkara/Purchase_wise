import type { MarketplaceOffer, MarketplaceProvider, MarketplaceQuery, ProviderStatus } from "../types";

export class MockMarketplaceProvider implements MarketplaceProvider {
  name = "Demo Store";
  status: ProviderStatus = "demo";

  async searchProducts(params: MarketplaceQuery): Promise<MarketplaceOffer[]> {
    const q = params.query.toLowerCase();
    const now = new Date().toISOString();

    let basePrice = 50000;
    if (q.includes("iphone 15")) basePrice = 71900;
    else if (q.includes("sony wh-1000xm5")) basePrice = 29990;
    else if (q.includes("macbook air")) basePrice = 94900;
    else if (q.includes("nike air max")) basePrice = 8999;
    else if (q.includes("cerave")) basePrice = 1200;
    else if (params.maxPrice) basePrice = Math.round(params.maxPrice * 0.9);

    const hash = Array.from(q).reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const offers: MarketplaceOffer[] = [
      {
        marketplace: "Amazon",
        externalProductId: `AMZ-${hash}`,
        productName: params.query,
        brand: params.brand,
        price: Math.round((basePrice * 1.01) / 10) * 10,
        originalPrice: Math.round((basePrice * 1.08) / 10) * 10,
        currency: "INR",
        availability: true,
        deliveryInformation: "Delivery in 2 days",
        productUrl: "https://www.amazon.in/dp/demo",
        source: "demo",
        fetchedAt: now,
        isLive: false,
      },
      {
        marketplace: "Flipkart",
        externalProductId: `FLP-${hash}`,
        productName: params.query,
        brand: params.brand,
        price: Math.round((basePrice * 0.975) / 10) * 10,
        originalPrice: Math.round((basePrice * 1.06) / 10) * 10,
        currency: "INR",
        availability: true,
        deliveryInformation: "Delivery in 3 days",
        productUrl: "https://www.flipkart.com/p/demo",
        source: "demo",
        fetchedAt: now,
        isLive: false,
      },
      {
        marketplace: "Croma",
        externalProductId: `CRM-${hash}`,
        productName: params.query,
        brand: params.brand,
        price: Math.round((basePrice * 1.025) / 10) * 10,
        originalPrice: Math.round((basePrice * 1.05) / 10) * 10,
        currency: "INR",
        availability: true,
        deliveryInformation: "Store pickup available",
        productUrl: "https://www.croma.com/p/demo",
        source: "demo",
        fetchedAt: now,
        isLive: false,
      },
      {
        marketplace: "Tata CLiQ",
        externalProductId: `CLQ-${hash}`,
        productName: params.query,
        brand: params.brand,
        price: Math.round((basePrice * 0.99) / 10) * 10,
        originalPrice: Math.round((basePrice * 1.07) / 10) * 10,
        currency: "INR",
        availability: true,
        deliveryInformation: "Standard Delivery",
        productUrl: undefined,
        source: "demo",
        fetchedAt: now,
        isLive: false,
      },
    ];

    if (params.maxPrice) {
      return offers.filter((o) => o.price <= params.maxPrice!);
    }
    return offers;
  }
}
