"use client";

import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";

export type SearchableSelectItem = {
  value: string;
  label: string;
};

export function SearchableSelect({
  items,
  value,
  onValueChange,
  placeholder,
  emptyText = "No matches.",
}: {
  items: SearchableSelectItem[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
}) {
  const selected = items.find((item) => item.value === value) ?? null;

  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={(next) =>
        onValueChange(next ? (next as SearchableSelectItem).value : "")
      }
    >
      <ComboboxInput placeholder={placeholder} />
      <ComboboxContent>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item: SearchableSelectItem) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
