/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductInput } from "@/services/pocketbase";
import { Product } from "@/types";
import FormActions from "./FormActions";
import FormTextField from "./FormTextField";
import GalleryUploadField from "./GalleryUploadField";
import ImageUploadField from "./ImageUploadField";
import RichTextEditor from "./RichTextEditor";

const CATEGORIES = ["Audio", "Wearable", "Mobile", "Home"] as const;

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  tagline: z.string(),
  description: z.string().trim().min(1, "Description is required"),
  longDescription: z.string(),
  price: z
    .string()
    .trim()
    .refine((v) => v !== "" && Number.isFinite(Number(v)) && Number(v) >= 0, "Enter a price of 0 or more"),
  category: z.enum(CATEGORIES),
  imageUrl: z.union([z.literal(""), z.url("Enter a valid URL")]),
  gallery: z.string().refine(
    (value) =>
      value
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean)
        .every((url) => z.url().safeParse(url).success),
    "Enter one valid URL per line",
  ),
  features: z.string(),
  slug: z.string().trim(),
});

type ProductValues = z.infer<typeof schema>;

const lines = (text: string) =>
  text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

const toValues = (p?: Product): ProductValues => ({
  name: p?.name ?? "",
  tagline: p?.tagline ?? "",
  description: p?.description ?? "",
  longDescription: p?.longDescription ?? "",
  price: p ? String(p.price) : "",
  category: p?.category ?? "Audio",
  imageUrl: p?.imageSourceUrl ?? p?.imageUrl ?? "",
  gallery: (p?.gallerySourceUrls ?? p?.gallery ?? []).join("\n"),
  features: (p?.features ?? []).join("\n"),
  // The mapper falls back to the record id when no slug is stored.
  slug: p?.slug && p.slug !== p.id ? p.slug : "",
});

const toInput = (
  v: ProductValues,
  imageUpload: File | null,
  removeImageUpload: boolean,
  galleryUploads: File[],
  removedGalleryFileNames: string[],
): ProductInput => ({
  name: v.name,
  tagline: v.tagline,
  description: v.description,
  longDescription: v.longDescription,
  price: Number(v.price),
  category: v.category,
  imageUrl: v.imageUrl,
  imageUpload: imageUpload ?? undefined,
  removeImageUpload,
  gallery: lines(v.gallery),
  galleryUploads,
  removedGalleryFileNames,
  features: lines(v.features),
  slug: v.slug,
});

interface ProductFormProps {
  initial?: Product;
  submitLabel: string;
  onSubmit: (input: ProductInput) => Promise<void>;
}

const ProductForm: React.FC<ProductFormProps> = ({ initial, submitLabel, onSubmit }) => {
  const [imageUpload, setImageUpload] = useState<File | null>(null);
  const [removeImageUpload, setRemoveImageUpload] = useState(false);
  const [galleryUploads, setGalleryUploads] = useState<File[]>([]);
  const [removedGalleryFileNames, setRemovedGalleryFileNames] = useState<string[]>([]);
  const form = useForm<ProductValues>({
    resolver: zodResolver(schema),
    defaultValues: toValues(initial),
  });
  const { control, formState } = form;
  const existingGalleryImages = (initial?.galleryFileNames ?? []).flatMap(
    (fileName, index) => {
      const url = initial?.gallery?.[index];
      return url ? [{ fileName, url }] : [];
    },
  );

  return (
    <form
      onSubmit={form.handleSubmit((v) =>
        onSubmit(
          toInput(
            v,
            imageUpload,
            removeImageUpload,
            galleryUploads,
            removedGalleryFileNames,
          ),
        ),
      )}
      noValidate
      className="max-w-7xl"
    >
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product story</CardTitle>
              <CardDescription>
                Lead with the information customers use to understand the product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-5 md:grid-cols-2">
                  <FormTextField control={control} name="name" label="Name" />
                  <FormTextField control={control} name="tagline" label="Tagline" />
                </div>
                <FormTextField
                  control={control}
                  name="description"
                  label="Summary"
                  description="A short plain-text introduction used in product cards and previews."
                  rows={3}
                />
                <Controller
                  name="longDescription"
                  control={control}
                  render={({ field, fieldState }) => (
                    <RichTextEditor
                      label="Description"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                      description="Format the full product story with headings, lists, links, and emphasis."
                    />
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product details</CardTitle>
              <CardDescription>Pricing, organization, and scannable highlights.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid items-start gap-6 md:grid-cols-2">
                <FieldGroup>
                  <FormTextField control={control} name="price" label="Price (USD)" type="number" />
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="category">Category</FieldLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="category" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />
                  <FormTextField
                    control={control}
                    name="slug"
                    label="Slug"
                    description="Empty uses the record ID."
                  />
                </FieldGroup>
                <FormTextField
                  control={control}
                  name="features"
                  label="Features"
                  description="One feature per line."
                  rows={8}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>Choose a clear primary image, then add supporting gallery views.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Controller
                name="imageUrl"
                control={control}
                render={({ field, fieldState }) => (
                  <ImageUploadField
                    label="Product image"
                    aspect="portrait"
                    url={field.value}
                    initialPreviewUrl={initial?.imageUrl}
                    selectedFile={imageUpload}
                    removed={removeImageUpload}
                    urlError={fieldState.error?.message}
                    onFileChange={(file) => {
                      field.onChange("");
                      setImageUpload(file);
                      setRemoveImageUpload(false);
                    }}
                    onUrlChange={(url) => {
                      field.onChange(url);
                      if (url) {
                        setImageUpload(null);
                        setRemoveImageUpload(Boolean(initial?.imageFileName));
                      }
                    }}
                    onRemove={() => {
                      field.onChange("");
                      setImageUpload(null);
                      setRemoveImageUpload(true);
                    }}
                  />
                )}
              />
              <Controller
                name="gallery"
                control={control}
                render={({ field, fieldState }) => (
                  <GalleryUploadField
                    urls={field.value}
                    selectedFiles={galleryUploads}
                    existingImages={existingGalleryImages}
                    removedFileNames={removedGalleryFileNames}
                    urlError={fieldState.error?.message}
                    onUrlsChange={field.onChange}
                    onFilesChange={setGalleryUploads}
                    onRemoveExisting={(fileName) =>
                      setRemovedGalleryFileNames((current) => [...current, fileName])
                    }
                  />
                )}
              />
            </CardContent>
          </Card>

        </div>
      </div>
      <FormActions
        submitLabel={submitLabel}
        cancelTo="/admin/products"
        isSubmitting={formState.isSubmitting}
      />
    </form>
  );
};

export default ProductForm;
