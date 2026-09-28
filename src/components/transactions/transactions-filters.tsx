"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TRANSACTION_TYPE_LABELS } from "@/lib/types/transaction";
import type { Product } from "@/lib/types/product";
import type { Customer } from "@/lib/types/customer";

const TYPE_ITEMS = [
  { value: "all", label: "All types" },
  ...Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export function TransactionsFilters({
  products,
  categories,
  customers,
}: {
  products: Product[];
  categories: string[];
  customers: Customer[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [reference, setReference] = useState(searchParams.get("reference") ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(params.size ? `${pathname}?${params.toString()}` : pathname);
  }

  const productItems = products.map((product) => ({
    value: product.id,
    label: `${product.sku} — ${product.description}`,
  }));

  const categoryItems = [
    { value: "all", label: "All categories" },
    ...categories.map((category) => ({ value: category, label: category })),
  ];

  const customerItems = [
    { value: "all", label: "All customers" },
    ...customers.map((customer) => ({
      value: customer.id,
      label: customer.customer_name,
    })),
  ];

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">From</label>
        <Input
          type="date"
          className="w-40"
          defaultValue={searchParams.get("from") ?? ""}
          onChange={(e) => updateParam("from", e.target.value || null)}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">To</label>
        <Input
          type="date"
          className="w-40"
          defaultValue={searchParams.get("to") ?? ""}
          onChange={(e) => updateParam("to", e.target.value || null)}
        />
      </div>

      <Select
        items={TYPE_ITEMS}
        value={searchParams.get("type") ?? "all"}
        onValueChange={(value) =>
          updateParam("type", value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          {TYPE_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="w-56 space-y-1">
        <label className="text-xs text-muted-foreground">Product</label>
        <SearchableSelect
          items={productItems}
          value={searchParams.get("product") ?? ""}
          onValueChange={(value) => updateParam("product", value || null)}
          placeholder="All products"
        />
      </div>

      <Select
        items={categoryItems}
        value={searchParams.get("category") ?? "all"}
        onValueChange={(value) =>
          updateParam("category", value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={customerItems}
        value={searchParams.get("customer") ?? "all"}
        onValueChange={(value) =>
          updateParam("customer", value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All customers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All customers</SelectItem>
          {customers.map((customer) => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.customer_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParam("reference", reference || null);
        }}
        className="flex items-end gap-2"
      >
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Reference</label>
          <Input
            placeholder="Search reference..."
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-48"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          <Search className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
