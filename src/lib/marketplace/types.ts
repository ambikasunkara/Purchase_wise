export type ProviderStatus = "demo" | "live" | "no_credentials" | "no_results" | "error";

export interface MarketplaceOffer {
  marketplace: string;
  externalProductId?: string;
  productName: string;
  brand?: string;
  modelName?: string;
  imageUrl?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  availability: boolean;
  deliveryInformation?: string;
  productUrl?: string;
  source: string;
  fetchedAt: string;
  isLive: boolean;
}

export interface MarketplaceComparison {
  productId: string;
  offers: MarketplaceOffer[];
  checkedMarketplaces: string[];
  providerStatus: Record<string, ProviderStatus>;
  screenshotPrice?: number;
  cheapestOffer: MarketplaceOffer | null;
  lowestPrice: number | null;
  highestPrice: number | null;
  priceDifference: number | null;
  screenshotSavings?: number | null;
  status: "success" | "partial" | "no_results" | "no_providers_configured";
}

export interface MarketplaceQuery {
  query: string;
  category?: string;
  brand?: string;
  maxPrice?: number;
}

export interface MarketplaceProvider {
  name: string;
  status: ProviderStatus;
  searchProducts(params: MarketplaceQuery): Promise<MarketplaceOffer[]>;
}
