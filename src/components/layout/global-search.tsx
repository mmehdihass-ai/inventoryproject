"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { SearchResponse, SearchResultItem } from "@/app/api/search/route";

const GROUPS: { key: keyof SearchResponse; label: string; href: string }[] = [
  { key: "products", label: "Products", href: "/inventory" },
  { key: "customers", label: "Customers", href: "/customers" },
  { key: "sales", label: "Sales", href: "/sales" },
];

export function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResponse>({
    products: [],
    customers: [],
    sales: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    const timeout = setTimeout(async () => {
      if (trimmed.length < 2) {
        setResults({ products: [], customers: [], sales: [] });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          setResults(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goTo(href: string) {
    router.push(href);
    setOpen(false);
    setQuery("");
  }

  const hasResults =
    results.products.length > 0 ||
    results.customers.length > 0 ||
    results.sales.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <InputGroup className="h-9 border-sidebar-border bg-sidebar-accent/40">
        <InputGroupAddon>
          <Search className="h-4 w-4 text-sidebar-foreground/60" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search products, customers, invoices..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          className="text-sidebar-foreground placeholder:text-sidebar-foreground/50"
        />
      </InputGroup>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10">
          {loading && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Searching...
            </p>
          )}
          {!loading && !hasResults && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No matches.
            </p>
          )}
          {!loading &&
            GROUPS.map((group) => {
              const items = results[group.key] as SearchResultItem[];
              if (items.length === 0) return null;
              return (
                <div key={group.key} className="py-1">
                  <p className="px-3 py-1 text-xs font-medium text-muted-foreground">
                    {group.label}
                  </p>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="block w-full truncate px-3 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => goTo(`${group.href}/${item.id}`)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
