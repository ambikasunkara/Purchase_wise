import type { MarketplaceOffer, MarketplaceProvider, MarketplaceQuery, ProviderStatus } from "../types";

export class CromaProvider implements MarketplaceProvider {
  name = "Croma";
  status: ProviderStatus = "no_credentials";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = typeof process !== "undefined" ? process.env?.CROMA_API_KEY : undefined;
    if (this.apiKey) {
      this.status = "live";
    }
  }

  async searchProducts(_params: MarketplaceQuery): Promise<MarketplaceOffer[]> {
    if (!this.apiKey) {
      throw new Error("NOT_CONFIGURED: Croma API credentials not configured.");
    }
    throw new Error("NOT_IMPLEMENTED: Live Croma API integration is not yet connected.");
  }
}
