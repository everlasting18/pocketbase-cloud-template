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
import { FieldGroup } from "@/components/ui/field";
import type { ArticleInput } from "@/services/pocketbase";
import { JournalArticle } from "@/types";
import FormActions from "./FormActions";
import FormTextField from "./FormTextField";
import ImageUploadField from "./ImageUploadField";
import RichTextEditor from "./RichTextEditor";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  date: z.string().trim(),
  excerpt: z.string().trim().min(1, "Excerpt is required"),
  image: z.union([z.literal(""), z.url("Enter a valid URL")]),
  contentHtml: z.string(),
});

type ArticleValues = z.infer<typeof schema>;

const toValues = (a?: JournalArticle): ArticleValues => ({
  title: a?.title ?? "",
  date: a?.date ?? "",
  excerpt: a?.excerpt ?? "",
  image: a?.imageSourceUrl ?? a?.image ?? "",
  contentHtml: a?.contentHtml ?? (typeof a?.content === "string" ? a.content : ""),
});

interface ArticleFormProps {
  initial?: JournalArticle;
  submitLabel: string;
  onSubmit: (input: ArticleInput) => Promise<void>;
}

const ArticleForm: React.FC<ArticleFormProps> = ({ initial, submitLabel, onSubmit }) => {
  const [imageUpload, setImageUpload] = useState<File | null>(null);
  const [removeImageUpload, setRemoveImageUpload] = useState(false);
  const form = useForm<ArticleValues>({
    resolver: zodResolver(schema),
    defaultValues: toValues(initial),
  });
  const { control, formState } = form;

  return (
    <form
      onSubmit={form.handleSubmit((v) =>
        onSubmit({
          ...v,
          image: v.image ?? "",
          imageUpload: imageUpload ?? undefined,
          removeImageUpload,
        }),
      )}
      noValidate
      className="max-w-7xl"
    >
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <Card>
          <CardHeader>
            <CardTitle>Article content</CardTitle>
            <CardDescription>
              Keep the title and story together so writing remains the main focus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <FormTextField control={control} name="title" label="Title" />
              <FormTextField control={control} name="excerpt" label="Excerpt" rows={3} />
              <Controller
                name="contentHtml"
                control={control}
                render={({ field, fieldState }) => (
                  <RichTextEditor
                    label="Content"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    description="Use the toolbar to structure the article. HTML source remains available for precise edits."
                    minHeight="large"
                  />
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="space-y-6 xl:sticky xl:top-24">
          <Card>
            <CardHeader>
              <CardTitle>Cover image</CardTitle>
              <CardDescription>Upload a cover or keep an external image URL.</CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                name="image"
                control={control}
                render={({ field, fieldState }) => (
                  <ImageUploadField
                    label="Article cover"
                    url={field.value}
                    initialPreviewUrl={initial?.image}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent>
              <FormTextField
                control={control}
                name="date"
                label="Display date"
                description='Shown as written, e.g. "April 12, 2025".'
              />
            </CardContent>
          </Card>

        </div>
      </div>
      <FormActions
        submitLabel={submitLabel}
        cancelTo="/admin/journal"
        isSubmitting={formState.isSubmitting}
      />
    </form>
  );
};

export default ArticleForm;
