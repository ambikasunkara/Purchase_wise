import { formatINR } from "@/lib/catalog";
import type { Offer } from "@/lib/engine";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function OfferTable({ offers }: { offers: Offer[] }) {
  const best = Math.min(...offers.filter((o) => o.availability).map((o) => o.price));
  return (
    <div className="space-y-3">
      <div
        role="note"
        className="rounded-md border border-warning-soft-foreground/25 bg-warning-soft px-3 py-2 text-sm font-medium text-warning-soft-foreground"
      >
        Demo marketplace data — prices are derived from the local catalog, not live retailer APIs.
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="text-foreground">Store</TableHead>
              <TableHead className="text-foreground">Price</TableHead>
              <TableHead className="text-foreground">Was</TableHead>
              <TableHead className="text-foreground">Availability</TableHead>
              <TableHead className="text-foreground">Delivery</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((o) => (
              <TableRow key={o.marketplace}>
                <TableCell className="font-semibold text-foreground">{o.marketplace}</TableCell>
                <TableCell className="font-semibold text-foreground">
                  {formatINR(o.price)}
                  {o.availability && o.price === best ? (
                    <span className="ml-2 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success-soft-foreground">
                      Best price
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-muted-foreground line-through">{formatINR(o.original_price)}</TableCell>
                <TableCell className={o.availability ? "font-medium text-success" : "font-medium text-destructive"}>
                  {o.availability ? "In stock" : "Out of stock"}
                </TableCell>
                <TableCell className="text-foreground">{o.delivery}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
