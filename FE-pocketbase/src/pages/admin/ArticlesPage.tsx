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
import { deleteArticle, listArticles } from "@/services/pocketbase";

const ArticlesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search, 300);
  const { data, error, loading, reload } = useAdminQuery(
    () => listArticles({ page, search: query }),
    [page, query],
  );

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteArticle(id);
      toast.success(`Deleted "${title}"`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    }
  };

  return (
    <>
      <PageHeader
        title="Journal"
        description={data ? `${data.totalItems} articles` : "Editorial articles stored in PocketBase"}
        actions={
          <Button asChild>
            <Link to="/admin/journal/new">
              <Plus />
              New article
            </Link>
          </Button>
        }
      />
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm shadow-black/[0.02]">
        <div className="flex min-h-16 items-center border-b bg-muted/20 p-4">
          <ListSearch
            label="Search articles"
            placeholder="Search articles…"
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
                  <TableHead className="w-16">Cover</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden w-40 sm:table-cell">Date</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      {query ? "No articles match your search." : "No articles yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((a) => (
                    <TableRow key={a.id} className="h-16">
                      <TableCell className="pl-4">
                        {a.image ? (
                          <img src={a.image} alt="" className="size-10 rounded-md object-cover" />
                        ) : (
                          <div className="size-10 rounded-md bg-muted" />
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="font-medium">{a.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{a.excerpt}</div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">{a.date}</TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link to={`/admin/journal/${a.id}/edit`} aria-label={`Edit ${a.title}`}>
                              <Pencil />
                            </Link>
                          </Button>
                          <ConfirmDelete
                            title={`Delete ${a.title}?`}
                            description="This permanently removes the article from PocketBase."
                            onConfirm={() => handleDelete(String(a.id), a.title)}
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

export default ArticlesPage;
