import type { Product } from "@/lib/catalog";
import type {
  MarketplaceComparison,
  MarketplaceOffer,
  MarketplaceProvider,
  ProviderStatus,
} from "./types";
import { ProductMatcher } from "./matcher";
import { MockMarketplaceProvider } from "./providers/mock";
import { AmazonProvider } from "./providers/amazon";
import { FlipkartProvider } from "./providers/flipkart";
import { CromaProvider } from "./providers/croma";

export class MarketplaceService {
  private providers: MarketplaceProvider[];
  private cache: Map<string, MarketplaceComparison>;

  constructor(providers?: MarketplaceProvider[]) {
    this.providers = providers ?? [
      new MockMarketplaceProvider(),
      new AmazonProvider(),
      new FlipkartProvider(),
      new CromaProvider(),
    ];
    this.cache = new Map();
  }

  clearCache(): void {
    this.cache.clear();
  }

  async getComparison(product: Product, screenshotPrice?: number): Promise<MarketplaceComparison> {
    const cacheKey = `${product.product_id}:${screenshotPrice ?? "none"}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const allOffers: MarketplaceOffer[] = [];
    const checkedMarketplaces: string[] = [];
    const providerStatus: Record<string, ProviderStatus> = {};

    const queryStr = `${product.brand ? `${product.brand} ` : ""}${product.name}`;

    for (const provider of this.providers) {
      checkedMarketplaces.push(provider.name);
      try {
        const rawOffers = await provider.searchProducts({
          query: queryStr,
          category: product.category,
          brand: product.brand,
          maxPrice: product.price_inr ? product.price_inr * 1.5 : undefined,
        });

        if (!rawOffers || rawOffers.length === 0) {
          providerStatus[provider.name] = "no_results";
        } else {
          const validOffers = rawOffers.filter((offer) => ProductMatcher.isMatch(product, offer));

          if (validOffers.length === 0) {
            providerStatus[provider.name] = "no_results";
          } else {
            allOffers.push(...validOffers);
            const isDemo = validOffers.some((o) => !o.isLive || o.source === "demo");
            providerStatus[provider.name] = isDemo ? "demo" : "live";
          }
        }
      } catch (err: any) {
        const msg = String(err?.message || err);
        if (msg.includes("NOT_CONFIGURED")) {
          providerStatus[provider.name] = "no_credentials";
        } else {
          providerStatus[provider.name] = "error";
        }
      }
    }

    // Deduplicate duplicate results from the SAME provider
    const dedupedOffers: MarketplaceOffer[] = [];
    const seenKeys = new Set<string>();

    for (const offer of allOffers) {
      const mkt = (offer.marketplace || "").trim().toLowerCase();
      const key = offer.externalProductId
        ? `${mkt}:id:${offer.externalProductId}`
        : `${mkt}:${(offer.productName || "").trim().toLowerCase()}:${(offer.productUrl || "").trim().toLowerCase()}`;

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        dedupedOffers.push(offer);
      }
    }

    // Sort offers: Available products first (availability=true before false), then lowest price
    const sortedOffers = [...dedupedOffers].sort((a, b) => {
      if (a.availability !== b.availability) {
        return a.availability ? -1 : 1;
      }
      return a.price - b.price;
    });

    const availablePrices = sortedOffers.filter((o) => o.availability).map((o) => o.price);
    const lowestPrice = availablePrices.length > 0 ? Math.min(...availablePrices) : null;
    const highestPrice = availablePrices.length > 0 ? Math.max(...availablePrices) : null;
    const priceDifference = lowestPrice !== null && highestPrice !== null ? highestPrice - lowestPrice : null;

    const cheapestOffer = sortedOffers.find((o) => o.availability && o.price === lowestPrice) ?? null;

    const screenshotSavings =
      screenshotPrice !== undefined && lowestPrice !== null ? screenshotPrice - lowestPrice : null;

    let overallStatus: MarketplaceComparison["status"] = "success";
    if (this.providers.length === 0) {
      overallStatus = "no_providers_configured";
    } else if (sortedOffers.length === 0) {
      overallStatus = "no_results";
    } else if (Object.values(providerStatus).some((s) => s === "error" || s === "no_credentials")) {
      overallStatus = "partial";
    }

    const comparison: MarketplaceComparison = {
      productId: product.product_id,
      offers: sortedOffers,
      checkedMarketplaces,
      providerStatus,
      screenshotPrice,
      cheapestOffer,
      lowestPrice,
      highestPrice,
      priceDifference,
      screenshotSavings,
      status: overallStatus,
    };

    this.cache.set(cacheKey, comparison);
    return comparison;
  }
}

export const defaultMarketplaceService = new MarketplaceService();
