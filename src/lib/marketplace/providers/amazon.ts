import type { MarketplaceOffer, MarketplaceProvider, MarketplaceQuery, ProviderStatus } from "../types";

export class AmazonProvider implements MarketplaceProvider {
  name = "Amazon";
  status: ProviderStatus = "no_credentials";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = typeof process !== "undefined" ? process.env?.AMAZON_API_KEY : undefined;
    if (this.apiKey) {
      this.status = "live";
    }
  }

  async searchProducts(_params: MarketplaceQuery): Promise<MarketplaceOffer[]> {
    if (!this.apiKey) {
      throw new Error("NOT_CONFIGURED: Amazon API credentials not configured.");
    }
    throw new Error("NOT_IMPLEMENTED: Live Amazon API integration is not yet connected.");
  }
}
