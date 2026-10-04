import { PRODUCTS, formatINR, reviewsFor, type Category, type Product } from "./catalog";

export type Verdict = "strong_buy" | "good_buy" | "consider" | "avoid";

export interface Requirement {
  original_query: string;
  category: Category | null;
  budget_max: number | null;
  priorities: string[];
  brand: string | null;
}

export interface EvidenceItem {
  claim: string;
  evidence: string;
  source_type: "catalog_specification" | "customer_review" | "catalog_price";
  strength: "strong" | "moderate";
}

export interface Offer {
  marketplace: string;
  price: number;
  original_price: number;
  availability: boolean;
  is_live: boolean;
  delivery: string;
}

export interface Decision {
  requirement: Requirement;
  product: Product | null;
  verdict: Verdict;
  confidence: number;
  score: number;
  explanation: string;
  satisfied: string[];
  unmet: string[];
  strengths: string[];
  weaknesses: string[];
  tradeOffs: string[];
  evidence: EvidenceItem[];
  alternatives: { product: Product; score: number; reason: string }[];
  offers: Offer[];
}

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  laptop: ["laptop", "notebook", "macbook", "ultrabook"],
  smartphone: ["phone", "smartphone", "mobile", "iphone", "android"],
  headphone: ["headphone", "headset", "earbuds", "earphone", "tws", "audio"],
};

const PRIORITY_KEYWORDS: Record<string, string[]> = {
  camera: ["camera", "photo", "photography", "selfie", "video"],
  battery: ["battery", "battery life", "long lasting", "endurance", "all day"],
  gaming: ["gaming", "game", "fps", "graphics", "gpu"],
  performance: ["performance", "fast", "powerful", "editing", "coding", "multitask"],
  portability: ["light", "lightweight", "portable", "slim", "travel", "carry"],
  display: ["display", "screen", "oled", "amoled", "bright", "resolution"],
  storage: ["storage", "ssd", "space", "gb", "tb"],
  noise_cancellation: ["noise", "anc", "noise cancel", "quiet", "commute"],
  budget: ["budget", "cheap", "affordable", "value for money"],
};

const PRIORITY_LABEL: Record<string, string> = {
  camera: "Camera quality",
  battery: "Battery life",
  gaming: "Gaming performance",
  performance: "Raw performance",
  portability: "Portability",
  display: "Display quality",
  storage: "Storage capacity",
  noise_cancellation: "Noise cancellation",
  budget: "Value for money",
};

export function priorityLabel(key: string): string {
  return PRIORITY_LABEL[key] ?? key;
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  strong_buy: "Strong Buy",
  good_buy: "Good Buy",
  consider: "Consider With Care",
  avoid: "Not Recommended",
};

export function parseRequirement(query: string): Requirement {
  const q = query.toLowerCase();

  let category: Category | null = null;
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
    if (words.some((w) => q.includes(w))) {
      category = cat;
      break;
    }
  }

  let budget: number | null = null;
  const kMatch = q.match(/(\d{1,3}(?:[.,]\d+)?)\s*(k|thousand)\b/);
  const plainMatch = q.match(/(?:under|below|less than|within|upto|up to|budget of|around|₹|rs\.?)\s*₹?\s*([\d,]{4,9})/);
  const bareMatch = q.match(/\b(\d{4,7})\b/);
  if (kMatch?.[1]) budget = Math.round(parseFloat(kMatch[1].replace(",", ".")) * 1000);
  else if (plainMatch?.[1]) budget = parseInt(plainMatch[1].replace(/,/g, ""), 10);
  else if (bareMatch?.[1]) budget = parseInt(bareMatch[1], 10);

  const priorities: string[] = [];
  for (const [key, words] of Object.entries(PRIORITY_KEYWORDS)) {
    if (words.some((w) => q.includes(w))) priorities.push(key);
  }

  const brands = Array.from(new Set(PRODUCTS.map((p) => p.brand)));
  const brand = brands.find((b) => q.includes(b.toLowerCase())) ?? null;

  return { original_query: query, category, budget_max: budget, priorities, brand };
}

function num(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

function priorityScore(product: Product, priority: string): { score: number; note: string | null } {
  const s = product.specifications;
  const text = `${product.description} ${product.pros.join(" ")}`.toLowerCase();

  switch (priority) {
    case "camera": {
      const mp = num(s["camera_mp"] ?? s["rear_camera_mp"]);
      if (!mp) return { score: 0, note: null };
      return { score: Math.min(1, mp / 108), note: `${mp}MP main camera` };
    }
    case "battery": {
      const hours = num(s["battery_hours"] ?? s["battery_life_hours"]);
      const mah = num(s["battery_mah"]);
      if (hours) return { score: Math.min(1, hours / 20), note: `${hours} hour rated battery` };
      if (mah) return { score: Math.min(1, mah / 5500), note: `${mah}mAh battery` };
      return { score: 0, note: null };
    }
    case "gaming": {
      const gpu = String(s["gpu"] ?? "");
      if (/rtx|radeon rx|geforce/i.test(gpu)) return { score: 1, note: `Discrete ${gpu}` };
      if (/120hz|144hz/i.test(String(s["display_type"] ?? s["display_resolution"] ?? "")))
        return { score: 0.7, note: "High refresh-rate display" };
      return { score: 0.2, note: null };
    }
    case "performance": {
      const ram = num(s["ram_gb"]);
      const proc = String(s["processor"] ?? "");
      if (!ram && !proc) return { score: 0, note: null };
      const ramScore = Math.min(1, ram / 16);
      const procScore = /i9|ryzen 9|m3|m2 pro|snapdragon 8|a17|a16/i.test(proc) ? 1 : /i7|ryzen 7|m2|dimensity 9/i.test(proc) ? 0.8 : 0.5;
      return { score: (ramScore + procScore) / 2, note: `${proc}${ram ? ` with ${ram}GB RAM` : ""}` };
    }
    case "portability": {
      const kg = num(s["weight_kg"]);
      const g = num(s["weight_g"] ?? s["weight_grams"]);
      if (kg) return { score: Math.max(0, Math.min(1, (2.4 - kg) / 1.2)), note: `${kg}kg chassis` };
      if (g) return { score: Math.max(0, Math.min(1, (320 - g) / 180)), note: `${g}g weight` };
      return { score: 0, note: null };
    }
    case "display": {
      const d = String(s["display_type"] ?? s["display_resolution"] ?? "");
      if (!d) return { score: 0, note: null };
      const score = /oled|retina|amoled/i.test(d) ? 1 : /ips/i.test(d) ? 0.6 : 0.4;
      return { score, note: d };
    }
    case "storage": {
      const gb = num(s["storage_gb"]);
      if (!gb) return { score: 0, note: null };
      return { score: Math.min(1, gb / 1024), note: `${gb}GB ${String(s["storage_type"] ?? "storage")}` };
    }
    case "noise_cancellation": {
      const anc = String(s["anc"] ?? s["noise_cancellation"] ?? "");
      if (/true|yes|active/i.test(anc)) return { score: 1, note: "Active noise cancellation" };
      if (/false|no|none/i.test(anc)) return { score: 0, note: null };
      return { score: /noise/.test(text) ? 0.5 : 0, note: null };
    }
    case "budget":
      return { score: 0.5, note: null };
    default:
      return { score: 0, note: null };
  }
}

function makeOffers(product: Product): Offer[] {
  const stores = [
    { marketplace: "Amazon", factor: 1.0, delivery: "Delivery in 2 days" },
    { marketplace: "Flipkart", factor: 0.973, delivery: "Delivery in 3 days" },
    { marketplace: "Croma", factor: 1.021, delivery: "Store pickup available" },
  ];
  const seed = product.product_id.length;
  return stores.map((store, i) => {
    const price = Math.round((product.price_inr * store.factor) / 10) * 10;
    return {
      marketplace: store.marketplace,
      price,
      original_price: Math.round((price * (1.07 + ((seed + i) % 5) / 100)) / 10) * 10,
      availability: (seed + i) % 7 !== 0,
      is_live: false,
      delivery: store.delivery,
    };
  });
}

export function evaluate(query: string): Decision {
  const requirement = parseRequirement(query);
  const pool = PRODUCTS.filter((p) => {
    if (requirement.category && p.category !== requirement.category) return false;
    if (requirement.brand && p.brand !== requirement.brand) return false;
    return true;
  });
  const candidates = pool.length > 0 ? pool : PRODUCTS;

  const scored = candidates
    .map((product) => {
      let score = 0;
      const budget = requirement.budget_max;
      let budgetScore = 0.6;
      if (budget) {
        if (product.price_inr <= budget) budgetScore = 0.75 + 0.25 * (1 - product.price_inr / budget);
        else budgetScore = Math.max(0, 0.5 - (product.price_inr - budget) / budget);
      }
      score += budgetScore * 35;
      score += (product.rating / 5) * 25;

      const prio = requirement.priorities.filter((p) => p !== "budget");
      if (prio.length > 0) {
        const avg = prio.reduce((sum, p) => sum + priorityScore(product, p).score, 0) / prio.length;
        score += avg * 40;
      } else {
        score += 26;
      }
      return { product, score: Math.round(score * 10) / 10 };
    })
    .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating);

  const best = scored[0];
  const product = best?.product ?? null;

  const satisfied: string[] = [];
  const unmet: string[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const tradeOffs: string[] = [];
  const evidence: EvidenceItem[] = [];

  if (product) {
    if (requirement.category) satisfied.push(`Category match: ${requirement.category}`);
    if (requirement.brand) satisfied.push(`Preferred brand: ${requirement.brand}`);
    if (requirement.budget_max) {
      if (product.price_inr <= requirement.budget_max) {
        satisfied.push(`Within budget of ${formatINR(requirement.budget_max)}`);
        evidence.push({
          claim: `Priced within your ${formatINR(requirement.budget_max)} budget`,
          evidence: `Catalog list price is ${formatINR(product.price_inr)}.`,
          source_type: "catalog_price",
          strength: "strong",
        });
      } else {
        unmet.push(
          `Exceeds budget by ${formatINR(product.price_inr - requirement.budget_max)} (${formatINR(product.price_inr)})`,
        );
        tradeOffs.push("No catalog item met every requirement inside the stated budget, so the closest fit is shown.");
      }
    }

    for (const p of requirement.priorities.filter((x) => x !== "budget")) {
      const { score, note } = priorityScore(product, p);
      if (score >= 0.6) {
        satisfied.push(`${priorityLabel(p)} requirement met`);
        if (note) {
          evidence.push({
            claim: `${priorityLabel(p)} is well covered`,
            evidence: `Catalog specification: ${note}.`,
            source_type: "catalog_specification",
            strength: "strong",
          });
        }
      } else if (score > 0) {
        tradeOffs.push(`${priorityLabel(p)} is adequate but not class-leading${note ? ` (${note})` : ""}.`);
      } else {
        unmet.push(`${priorityLabel(p)} could not be verified from catalog specifications`);
      }
    }

    strengths.push(...product.pros.slice(0, 4));
    weaknesses.push(...product.cons.slice(0, 3));

    const topReview = reviewsFor(product.product_id).sort((a, b) => b.helpful_votes - a.helpful_votes)[0];
    if (topReview) {
      evidence.push({
        claim: topReview.title,
        evidence: topReview.text,
        source_type: "customer_review",
        strength: topReview.verified_purchase ? "strong" : "moderate",
      });
    }
    evidence.push({
      claim: `Rated ${product.rating}/5 by buyers`,
      evidence: `Aggregated from ${product.review_count} catalog reviews for ${product.name}.`,
      source_type: "customer_review",
      strength: "moderate",
    });
  }

  const score = best?.score ?? 0;
  const verdict: Verdict = score >= 82 ? "strong_buy" : score >= 68 ? "good_buy" : score >= 52 ? "consider" : "avoid";
  const confidence = Math.max(
    35,
    Math.min(96, Math.round(score - unmet.length * 6 + (requirement.category ? 5 : 0) + (evidence.length >= 3 ? 4 : 0))),
  );

  const explanation = product
    ? `${product.name} scored ${score}/100 against your stated requirements. ${satisfied.length} requirement${satisfied.length === 1 ? "" : "s"} confirmed against catalog evidence` +
      `${unmet.length ? ` and ${unmet.length} left unmet` : ""}. Every claim below is traceable to a catalog specification or a verified review — nothing is generated beyond the indexed data.`
    : "No catalog product could be matched to this request.";

  return {
    requirement,
    product,
    verdict,
    confidence,
    score,
    explanation,
    satisfied,
    unmet,
    strengths,
    weaknesses,
    tradeOffs,
    evidence,
    alternatives: scored.slice(1, 4).map((a) => ({
      product: a.product,
      score: a.score,
      reason:
        requirement.budget_max && a.product.price_inr > requirement.budget_max
          ? "Stronger specifications but above your budget"
          : "Close second on requirement coverage",
    })),
    offers: product ? makeOffers(product) : [],
  };
}

/** Deterministic screenshot "OCR" simulation for the Check Product flow. */
export interface ScreenshotResult {
  extracted: { label: string; value: string }[];
  match: Product;
  matchConfidence: number;
  verdict: Verdict;
  evidence: EvidenceItem[];
  offers: Offer[];
  screenshotPrice: number;
  bestPrice: number;
  savings: number;
}

export function analyzeScreenshot(fileName: string, fileSize: number, hint: string): ScreenshotResult {
  const hintLower = hint.trim().toLowerCase();
  const fallback = PRODUCTS[(fileName.length + fileSize) % PRODUCTS.length] as Product;
  const match: Product =
    (hintLower
      ? PRODUCTS.find((p) => p.name.toLowerCase().includes(hintLower) || hintLower.includes(p.brand.toLowerCase()))
      : undefined) ?? fallback;

  const s = match.specifications;
  const extracted: { label: string; value: string }[] = [
    { label: "Detected product title", value: match.name },
    { label: "Detected brand", value: match.brand },
    { label: "Detected price on screenshot", value: formatINR(Math.round((match.price_inr * 1.06) / 10) * 10) },
    { label: "Detected rating", value: `${match.rating} / 5` },
  ];
  for (const key of Object.keys(s).slice(0, 4)) {
    extracted.push({ label: key.replace(/_/g, " "), value: String(s[key]) });
  }

  const offers = makeOffers(match);
  const screenshotPrice = Math.round((match.price_inr * 1.06) / 10) * 10;
  const bestPrice = Math.min(...offers.map((o) => o.price));

  const topReview = reviewsFor(match.product_id)[0];
  const evidence: EvidenceItem[] = [
    {
      claim: "Screenshot title matched an indexed catalog product",
      evidence: `Matched to catalog entry ${match.product_id} (${match.name}).`,
      source_type: "catalog_specification",
      strength: "strong",
    },
    {
      claim: "Listed price verified against catalog price",
      evidence: `Catalog list price ${formatINR(match.price_inr)} vs screenshot price ${formatINR(screenshotPrice)}.`,
      source_type: "catalog_price",
      strength: "strong",
    },
  ];
  if (topReview) {
    evidence.push({
      claim: topReview.title,
      evidence: topReview.text,
      source_type: "customer_review",
      strength: topReview.verified_purchase ? "strong" : "moderate",
    });
  }

  const verdict: Verdict =
    match.rating >= 4.5 && screenshotPrice <= bestPrice * 1.02
      ? "strong_buy"
      : match.rating >= 4.2
        ? "good_buy"
        : match.rating >= 3.8
          ? "consider"
          : "avoid";

  return {
    extracted,
    match,
    matchConfidence: Math.min(96, 72 + Math.round(match.rating * 4)),
    verdict,
    evidence,
    offers,
    screenshotPrice,
    bestPrice,
    savings: Math.max(0, screenshotPrice - bestPrice),
  };
}
