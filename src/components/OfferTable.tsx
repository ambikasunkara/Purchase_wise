import { ExternalLink } from "lucide-react";
import { formatINR } from "@/lib/catalog";
import type { MarketplaceComparison, MarketplaceOffer, ProviderStatus } from "@/lib/marketplace/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OfferTableProps {
  offers?: MarketplaceOffer[];
  comparison?: MarketplaceComparison | null;
}

const PROVIDER_STATUS_LABELS: Record<ProviderStatus, { label: string; cls: string }> = {
  live: { label: "Live", cls: "bg-success-soft text-success-soft-foreground" },
  demo: { label: "Demo", cls: "bg-info-soft text-info-soft-foreground" },
  no_credentials: { label: "No Credentials", cls: "bg-muted text-muted-foreground" },
  no_results: { label: "No Results", cls: "bg-warning-soft text-warning-soft-foreground" },
  error: { label: "Error", cls: "bg-danger-soft text-danger-soft-foreground" },
};

export function OfferTable({ offers: directOffers, comparison }: OfferTableProps) {
  const offers = comparison?.offers ?? directOffers ?? [];
  const providerStatus = comparison?.providerStatus ?? {
    "PurchaseWise Demo": "demo",
    Amazon: "no_credentials",
    Flipkart: "no_credentials",
    Croma: "no_credentials",
  };

  const availableOffers = offers.filter((o) => o.availability);
  const bestPrice =
    comparison?.lowestPrice ??
    (availableOffers.length > 0 ? Math.min(...availableOffers.map((o) => o.price)) : null);

  const hasDemo = Object.values(providerStatus).includes("demo") || offers.some((o) => o.source === "demo" || !o.isLive);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-foreground">Available offers from checked marketplaces</h4>
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(providerStatus).map(([provider, status]) => {
            const info = PROVIDER_STATUS_LABELS[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
            return (
              <span key={provider} className={`rounded-md px-2 py-1 text-xs font-semibold ${info.cls}`}>
                {provider}: {info.label}
              </span>
            );
          })}
        </div>
      </div>

      {hasDemo ? (
        <div
          role="note"
          className="rounded-md border border-warning-soft-foreground/25 bg-warning-soft px-3 py-2 text-xs font-medium text-warning-soft-foreground"
        >
          Demo marketplace data included — live credentials not set for external APIs. Non-live offers are clearly marked.
        </div>
      ) : null}

      {offers.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
          No marketplace offers were returned by the checked providers for this product.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-foreground">Store</TableHead>
                <TableHead className="text-foreground">Offer Product</TableHead>
                <TableHead className="text-foreground">Price</TableHead>
                <TableHead className="text-foreground">Was</TableHead>
                <TableHead className="text-foreground">Availability</TableHead>
                <TableHead className="text-foreground">Delivery</TableHead>
                <TableHead className="text-foreground">Store Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((o, idx) => {
                const isBest = Boolean(o.availability && bestPrice !== null && o.price === bestPrice);
                return (
                  <TableRow key={`${o.marketplace}-${idx}`}>
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{o.marketplace}</span>
                        {!o.isLive ? (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            demo
                          </span>
                        ) : (
                          <span className="rounded bg-success-soft px-1.5 py-0.5 text-[10px] font-medium text-success-soft-foreground">
                            live
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {o.productName}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {formatINR(o.price)}
                      {isBest ? (
                        <span className="ml-2 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success-soft-foreground">
                          Best price
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground line-through">
                      {o.originalPrice && o.originalPrice > o.price ? formatINR(o.originalPrice) : "—"}
                    </TableCell>
                    <TableCell className={o.availability ? "font-medium text-success" : "font-medium text-destructive"}>
                      {o.availability ? "In stock" : "Out of stock"}
                    </TableCell>
                    <TableCell className="text-foreground text-sm">{o.deliveryInformation ?? "Standard delivery"}</TableCell>
                    <TableCell>
                      {o.productUrl && o.productUrl.trim().length > 0 ? (
                        <a
                          href={o.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline hover:text-primary/80"
                        >
                          View Offer <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Link unavailable</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
