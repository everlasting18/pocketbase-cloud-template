/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import ArticleForm from "@/components/admin/ArticleForm";
import DataState from "@/components/admin/DataState";
import PageHeader from "@/components/admin/PageHeader";
import { useAdminQuery } from "@/hooks/useAdminQuery";
import { errorMessage } from "@/lib/errors";
import {
  ArticleInput,
  createArticle,
  getArticle,
  updateArticle,
} from "@/services/pocketbase";

const ArticleEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const { data, error, loading, reload } = useAdminQuery(
    () => (id ? getArticle(id) : Promise.resolve(null)),
    [id],
  );

  const handleSubmit = async (input: ArticleInput) => {
    try {
      if (id) await updateArticle(id, input);
      else await createArticle(input);
      toast.success(isNew ? "Article created" : "Article saved");
      navigate("/admin/journal");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title={isNew ? "New article" : data ? `Edit ${data.title}` : "Edit article"}
        description={isNew ? "Write the story first, then add its cover and publishing details." : "Refine the story, cover, and publishing details."}
        backTo="/admin/journal"
        backLabel="Journal"
      />
      {!isNew && (error || !data) ? (
        <DataState loading={loading} error={error} onRetry={reload} rows={6} />
      ) : (
        <ArticleForm
          key={data ? String(data.id) : "new"}
          initial={data ?? undefined}
          submitLabel={isNew ? "Create article" : "Save changes"}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
};

export default ArticleEditPage;
