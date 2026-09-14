/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useId, useState } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

interface ImageUploadFieldProps {
  label: string;
  url: string;
  initialPreviewUrl?: string;
  selectedFile: File | null;
  removed?: boolean;
  urlError?: string;
  aspect?: "portrait" | "landscape";
  onUrlChange: (url: string) => void;
  onFileChange: (file: File) => void;
  onRemove: () => void;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  url,
  initialPreviewUrl,
  selectedFile,
  removed = false,
  urlError,
  aspect = "landscape",
  onUrlChange,
  onFileChange,
  onRemove,
}) => {
  const inputId = useId();
  const urlId = useId();
  const [fileError, setFileError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState("");

  useEffect(() => {
    if (!selectedFile) {
      setObjectUrl("");
      return;
    }
    const nextUrl = URL.createObjectURL(selectedFile);
    setObjectUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [selectedFile]);

  const previewUrl = objectUrl || url || (!removed ? initialPreviewUrl : "") || "";

  const selectFile = (file?: File) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setFileError("Choose a JPG, PNG, WebP, or AVIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setFileError("Image must be 5 MB or smaller.");
      return;
    }
    setFileError(null);
    onFileChange(file);
  };

  return (
    <Field data-invalid={Boolean(urlError || fileError)}>
      <FieldLabel>{label}</FieldLabel>
      <div
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden rounded-lg border bg-muted/60",
          aspect === "portrait" ? "aspect-[4/5]" : "aspect-[4/3]",
        )}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Selected preview" className="size-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 text-center text-muted-foreground">
            <ImageIcon className="size-8 opacity-60" />
            <span className="text-xs">No image selected</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" asChild>
          <label htmlFor={inputId} className="cursor-pointer">
            <Upload />
            {previewUrl ? "Replace image" : "Upload image"}
          </label>
        </Button>
        {previewUrl && (
          <Button type="button" variant="ghost" onClick={onRemove}>
            <X />
            Remove
          </Button>
        )}
      </div>
      <input
        id={inputId}
        className="sr-only"
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={(event) => {
          selectFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {selectedFile && (
        <FieldDescription className="truncate">
          {selectedFile.name} · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
        </FieldDescription>
      )}

      <FieldSeparator>or use an external URL</FieldSeparator>
      <FieldLabel htmlFor={urlId} className="text-xs text-muted-foreground">
        Image URL
      </FieldLabel>
      <Input
        id={urlId}
        type="url"
        value={url}
        placeholder="https://…"
        aria-invalid={Boolean(urlError)}
        onChange={(event) => onUrlChange(event.target.value)}
      />
      <FieldDescription>
        Uploads use the PocketBase <code className="font-mono text-xs">imageFile</code> field.
      </FieldDescription>
      {urlError && <FieldError>{urlError}</FieldError>}
      {fileError && <FieldError>{fileError}</FieldError>}
    </Field>
  );
};

export default ImageUploadField;
