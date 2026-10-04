import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CATEGORY_LABEL,
  formatINR,
  PRODUCTS,
  specKeysFor,
  specLabel,
  type Category,
  type Product,
} from "@/lib/catalog";
import { downloadCsv } from "@/lib/export";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Products — PurchaseWise" },
      {
        name: "description",
        content:
          "Compare laptops, smartphones and headphones side by side in an aligned specification matrix drawn from the PurchaseWise catalog.",
      },
      { property: "og:title", content: "Compare Products — PurchaseWise" },
      {
        property: "og:description",
        content: "Side-by-side catalog comparison with an aligned specification matrix.",
      },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const [category, setCategory] = useState<Category>("laptop");
  const inCategory = useMemo(() => PRODUCTS.filter((p) => p.category === category), [category]);
  const [ids, setIds] = useState<string[]>([]);

  const selected = ids
    .map((id) => inCategory.find((p) => p.product_id === id))
    .filter((p): p is Product => Boolean(p));

  const setSlot = (index: number, id: string) => {
    setIds((prev) => {
      const next = [...prev];
      next[index] = id;
      return next;
    });
  };

  const changeCategory = (c: Category) => {
    setCategory(c);
    setIds([]);
  };

  const keys = specKeysFor(selected);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Compare products</h1>
      <p className="mt-2 max-w-2xl text-foreground">
        Pick a category, then choose up to three catalog products. Specifications are aligned row by row so differences
        are easy to read.
      </p>

      <Card className="mt-8 border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-card-foreground">Selection</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(v) => changeCategory(v as Category)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Label htmlFor={`slot-${i}`}>Product {i + 1}</Label>
              <Select value={ids[i] ?? ""} onValueChange={(v) => setSlot(i, v)}>
                <SelectTrigger id={`slot-${i}`}>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {inCategory.map((p) => (
                    <SelectItem key={p.product_id} value={p.product_id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      {selected.length < 2 ? (
        <p className="mt-8 rounded-lg border border-border bg-muted p-4 text-foreground">
          Choose at least two products to see the comparison matrix.
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="min-w-40 text-foreground">Attribute</TableHead>
                  {selected.map((p) => (
                    <TableHead key={p.product_id} className="min-w-52 text-foreground">
                      {p.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <Row label="Brand" values={selected.map((p) => p.brand)} />
                <Row label="Price" values={selected.map((p) => formatINR(p.price_inr))} />
                <Row label="Rating" values={selected.map((p) => `${p.rating} / 5`)} />
                {keys.map((k) => (
                  <Row
                    key={k}
                    label={specLabel(k)}
                    values={selected.map((p) => {
                      const v = p.specifications[k];
                      return v === undefined ? "—" : String(v);
                    })}
                  />
                ))}
                <Row label="Top strength" values={selected.map((p) => p.pros[0] ?? "—")} />
                <Row label="Main drawback" values={selected.map((p) => p.cons[0] ?? "—")} />
              </TableBody>
            </Table>
          </div>

          <Button
            variant="outline"
            onClick={() =>
              downloadCsv("purchasewise-comparison.csv", [
                ["Attribute", ...selected.map((p) => p.name)],
                ["Brand", ...selected.map((p) => p.brand)],
                ["Price (INR)", ...selected.map((p) => p.price_inr)],
                ["Rating", ...selected.map((p) => p.rating)],
                ...keys.map((k) => [specLabel(k), ...selected.map((p) => String(p.specifications[k] ?? "—"))]),
              ])
            }
          >
            <Download aria-hidden className="size-4" /> Export comparison (CSV)
          </Button>
        </div>
      )}
    </div>
  );
}

function Row({ label, values }: { label: string; values: string[] }) {
  const allSame = values.every((v) => v === values[0]);
  return (
    <TableRow>
      <TableCell className="font-semibold text-foreground">{label}</TableCell>
      {values.map((v, i) => (
        <TableCell key={i} className={allSame ? "text-muted-foreground" : "font-medium text-foreground"}>
          {v}
        </TableCell>
      ))}
    </TableRow>
  );
}
