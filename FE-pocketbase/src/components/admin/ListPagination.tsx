/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ListPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ListPagination: React.FC<ListPaginationProps> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const go = (target: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (target >= 1 && target <= totalPages) onPageChange(target);
  };
  const disabled = (off: boolean) => (off ? "pointer-events-none opacity-50" : undefined);

  return (
    <Pagination className="mt-4 justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={page <= 1}
            className={disabled(page <= 1)}
            onClick={go(page - 1)}
          />
        </PaginationItem>
        <PaginationItem>
          <span className="px-3 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={page >= totalPages}
            className={disabled(page >= totalPages)}
            onClick={go(page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default ListPagination;
