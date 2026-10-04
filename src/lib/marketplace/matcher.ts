import type { Product } from "@/lib/catalog";
import type { MarketplaceOffer } from "./types";

export class ProductMatcher {
  isMatch(canonical: Product, offer: MarketplaceOffer): boolean {
    return ProductMatcher.isMatch(canonical, offer);
  }

  static isMatch(canonical: Product, offer: MarketplaceOffer): boolean {
    // 0. External product ID match
    if (offer.externalProductId && (canonical as any).externalProductId) {
      if (offer.externalProductId === (canonical as any).externalProductId) {
        return true;
      }
    }

    // 1. Brand match
    const canonBrand = (canonical.brand || "").trim().toLowerCase();
    const offerBrand = (offer.brand || "").trim().toLowerCase();
    const offerNameLower = offer.productName.toLowerCase();

    if (canonBrand) {
      if (offerBrand) {
        if (offerBrand !== canonBrand && !canonBrand.includes(offerBrand) && !offerBrand.includes(canonBrand)) {
          return false;
        }
      } else {
        if (!offerNameLower.includes(canonBrand)) {
          return false;
        }
      }
    }

    // 2. Name word overlap match (excluding brand words)
    const canonNameLower = canonical.name.toLowerCase();
    const canonTokens = new Set(canonNameLower.match(/\b[a-z0-9]+\b/g) ?? []);
    const offerTokens = new Set(offerNameLower.match(/\b[a-z0-9]+\b/g) ?? []);

    if (canonBrand) {
      const brandTokens = new Set(canonBrand.match(/\b[a-z0-9]+\b/g) ?? []);
      brandTokens.forEach((t) => canonTokens.delete(t));
    }

    if (canonTokens.size > 0) {
      let overlapCount = 0;
      canonTokens.forEach((t) => {
        if (offerTokens.has(t)) overlapCount++;
      });
      if (overlapCount / canonTokens.size < 0.5) {
        return false;
      }
    }

    // 3. Electronics Specific Variant Match (RAM & Storage)
    const specs = canonical.specifications || {};
    const ram = typeof specs.ram_gb === "number" ? specs.ram_gb : null;
    const storage = typeof specs.storage_gb === "number" ? specs.storage_gb : null;

    if (ram !== null || storage !== null) {
      const capacityPattern = /\b(\d+)\s*(gb|g|tb|t)\b/gi;
      const foundRams = new Set<number>();
      const foundStorages = new Set<number>();

      let match: RegExpExecArray | null;
      while ((match = capacityPattern.exec(offerNameLower)) !== null) {
        const val = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        const valGb = unit === "tb" || unit === "t" ? val * 1024 : val;

        if ([4, 6, 8, 12, 16, 24, 32, 64].includes(valGb)) {
          foundRams.add(valGb);
        }
        if ([32, 64, 128, 256, 512, 1000, 1024, 2000, 2048, 4096].includes(valGb)) {
          foundStorages.add(valGb);
        }
      }

      if (ram !== null && foundRams.size > 0 && !foundRams.has(ram)) {
        return false;
      }
      if (storage !== null && foundStorages.size > 0 && !foundStorages.has(storage)) {
        return false;
      }
    }

    // 4. Non-electronics Variant Mismatch Checks (Size, Volume)
    const sizePattern = /\b(?:size|uk|us|eu)\s*(\d+(?:\.\d+)?)\b/gi;
    const canonSizes = new Set(Array.from(canonNameLower.matchAll(sizePattern), (m) => m[1]));
    const offerSizes = new Set(Array.from(offerNameLower.matchAll(sizePattern), (m) => m[1]));
    if (canonSizes.size > 0 && offerSizes.size > 0) {
      let hasOverlap = false;
      canonSizes.forEach((s) => {
        if (offerSizes.has(s)) hasOverlap = true;
      });
      if (!hasOverlap) return false;
    }

    const volPattern = /\b(\d+)\s*(ml|l|g|kg|oz)\b/gi;
    const canonVols = new Set(Array.from(canonNameLower.matchAll(volPattern), (m) => `${m[1]}${m[2].toLowerCase()}`));
    const offerVols = new Set(Array.from(offerNameLower.matchAll(volPattern), (m) => `${m[1]}${m[2].toLowerCase()}`));
    if (canonVols.size > 0 && offerVols.size > 0) {
      let hasOverlap = false;
      canonVols.forEach((v) => {
        if (offerVols.has(v)) hasOverlap = true;
      });
      if (!hasOverlap) return false;
    }

    return true;
  }
}
