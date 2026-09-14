/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import ConfirmDelete from "@/components/admin/ConfirmDelete";
import DataState from "@/components/admin/DataState";
import ListPagination from "@/components/admin/ListPagination";
import ListSearch from "@/components/admin/ListSearch";
import PageHeader from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminQuery } from "@/hooks/useAdminQuery";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { errorMessage } from "@/lib/errors";
import { deleteProduct, listProducts } from "@/services/pocketbase";

const ProductsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search, 300);
  const { data, error, loading, reload } = useAdminQuery(
    () => listProducts({ page, search: query }),
    [page, query],
  );

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteProduct(id);
      toast.success(`Deleted "${name}"`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        description={data ? `${data.totalItems} in the catalog` : "Catalog stored in PocketBase"}
        actions={
          <Button asChild>
            <Link to="/admin/products/new">
              <Plus />
              New product
            </Link>
          </Button>
        }
      />
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm shadow-black/[0.02]">
        <div className="flex min-h-16 items-center border-b bg-muted/20 p-4">
          <ListSearch
            label="Search products"
            placeholder="Search products…"
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
        </div>
        {error || !data ? (
          <div className="p-4">
            <DataState loading={loading} error={error} onRetry={reload} />
          </div>
        ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      {query ? "No products match your search." : "No products yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((p) => (
                    <TableRow key={p.id} className="h-16">
                      <TableCell className="pl-4">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="size-10 rounded-md object-cover" />
                        ) : (
                          <div className="size-10 rounded-md bg-muted" />
                        )}
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="font-medium">{p.name}</div>
                        {p.tagline && <div className="text-xs text-muted-foreground">{p.tagline}</div>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">{p.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ${p.price.toLocaleString("en-US")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link to={`/admin/products/${p.id}/edit`} aria-label={`Edit ${p.name}`}>
                              <Pencil />
                            </Link>
                          </Button>
                          <ConfirmDelete
                            title={`Delete ${p.name}?`}
                            description="This permanently removes the product from PocketBase."
                            onConfirm={() => handleDelete(p.id, p.name)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        )}
      </div>
      {data && !error && (
          <ListPagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}
    </>
  );
};

export default ProductsPage;
