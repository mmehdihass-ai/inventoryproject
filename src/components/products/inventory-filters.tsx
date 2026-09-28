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

const STOCK_ITEMS = [
  { value: "all", label: "All stock levels" },
  { value: "IN_STOCK", label: "In stock" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
];

const STATUS_ITEMS = [
  { value: "all", label: "All products" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function InventoryFilters({ categories }: { categories: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const categoryItems = [
    { value: "all", label: "All categories" },
    ...categories.map((category) => ({ value: category, label: category })),
  ];

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(params.size ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParam("search", search || null);
        }}
        className="flex items-center gap-2"
      >
        <Input
          placeholder="Search SKU, description, model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Button type="submit" variant="outline" size="sm">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      <Select
        items={categoryItems}
        value={searchParams.get("category") ?? "all"}
        onValueChange={(value) =>
          updateParam("category", value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-48">
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
        items={STOCK_ITEMS}
        value={searchParams.get("stock") ?? "all"}
        onValueChange={(value) =>
          updateParam("stock", value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All stock levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stock levels</SelectItem>
          <SelectItem value="IN_STOCK">In stock</SelectItem>
          <SelectItem value="LOW_STOCK">Low stock</SelectItem>
          <SelectItem value="OUT_OF_STOCK">Out of stock</SelectItem>
        </SelectContent>
      </Select>

      <Select
        items={STATUS_ITEMS}
        value={searchParams.get("status") ?? "all"}
        onValueChange={(value) =>
          updateParam("status", value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All products" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All products</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
