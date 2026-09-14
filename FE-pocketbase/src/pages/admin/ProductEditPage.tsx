/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import DataState from "@/components/admin/DataState";
import PageHeader from "@/components/admin/PageHeader";
import ProductForm from "@/components/admin/ProductForm";
import { useAdminQuery } from "@/hooks/useAdminQuery";
import { errorMessage } from "@/lib/errors";
import {
  createProduct,
  getProduct,
  ProductInput,
  updateProduct,
} from "@/services/pocketbase";

const ProductEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const { data, error, loading, reload } = useAdminQuery(
    () => (id ? getProduct(id) : Promise.resolve(null)),
    [id],
  );

  const handleSubmit = async (input: ProductInput) => {
    try {
      if (id) await updateProduct(id, input);
      else await createProduct(input);
      toast.success(isNew ? "Product created" : "Product saved");
      navigate("/admin/products");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title={isNew ? "New product" : data ? `Edit ${data.name}` : "Edit product"}
        description={isNew ? "Create the product story, pricing, and media in one focused workspace." : "Update product content, organization, and media."}
        backTo="/admin/products"
        backLabel="Products"
      />
      {!isNew && (error || !data) ? (
        <DataState loading={loading} error={error} onRetry={reload} rows={6} />
      ) : (
        <ProductForm
          key={data?.id ?? "new"}
          initial={data ?? undefined}
          submitLabel={isNew ? "Create product" : "Save changes"}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
};

export default ProductEditPage;
