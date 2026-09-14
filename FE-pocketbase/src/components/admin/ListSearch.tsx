/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ListSearchProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

const ListSearch: React.FC<ListSearchProps> = ({ label, placeholder, value, onChange }) => (
  <div className="relative w-full max-w-sm">
    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      type="search"
      placeholder={placeholder}
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="bg-background pl-9 pr-9 shadow-none [&::-webkit-search-cancel-button]:hidden"
    />
    {value && (
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Clear search"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        onClick={() => onChange("")}
      >
        <X />
      </Button>
    )}
  </div>
);

export default ListSearch;
