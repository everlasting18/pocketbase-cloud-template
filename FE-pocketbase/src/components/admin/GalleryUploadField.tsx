/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useId, useMemo, useState } from "react";
import { Images, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_GALLERY_FILES = 10;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export interface ExistingGalleryImage {
  fileName: string;
  url: string;
}

interface GalleryUploadFieldProps {
  urls: string;
  selectedFiles: File[];
  existingImages: ExistingGalleryImage[];
  removedFileNames: string[];
  urlError?: string;
  onUrlsChange: (urls: string) => void;
  onFilesChange: (files: File[]) => void;
  onRemoveExisting: (fileName: string) => void;
}

const urlLines = (value: string): string[] =>
  value
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean);

const GalleryUploadField: React.FC<GalleryUploadFieldProps> = ({
  urls,
  selectedFiles,
  existingImages,
  removedFileNames,
  urlError,
  onUrlsChange,
  onFilesChange,
  onRemoveExisting,
}) => {
  const inputId = useId();
  const urlsId = useId();
  const [fileError, setFileError] = useState<string | null>(null);
  const [objectUrls, setObjectUrls] = useState<string[]>([]);

  useEffect(() => {
    const nextUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setObjectUrls(nextUrls);
    return () => nextUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  const activeExisting = useMemo(
    () => existingImages.filter((image) => !removedFileNames.includes(image.fileName)),
    [existingImages, removedFileNames],
  );
  const externalUrls = urlLines(urls);
  const previewCount = activeExisting.length + selectedFiles.length + externalUrls.length;

  const selectFiles = (incoming: File[]) => {
    const invalidType = incoming.find((file) => !ACCEPTED_IMAGE_TYPES.includes(file.type));
    if (invalidType) {
      setFileError(`${invalidType.name} is not a JPG, PNG, WebP, or AVIF image.`);
      return;
    }
    const oversized = incoming.find((file) => file.size > MAX_IMAGE_BYTES);
    if (oversized) {
      setFileError(`${oversized.name} is larger than 5 MB.`);
      return;
    }
    if (activeExisting.length + selectedFiles.length + incoming.length > MAX_GALLERY_FILES) {
      setFileError(`Upload up to ${MAX_GALLERY_FILES} gallery images.`);
      return;
    }
    setFileError(null);
    onFilesChange([...selectedFiles, ...incoming]);
  };

  const removeExternalUrl = (index: number) => {
    onUrlsChange(externalUrls.filter((_, itemIndex) => itemIndex !== index).join("\n"));
  };

  return (
    <Field data-invalid={Boolean(urlError || fileError)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <FieldLabel>Gallery</FieldLabel>
          <FieldDescription className="mt-1">
            Add up to {MAX_GALLERY_FILES} uploaded images, plus optional external URLs.
          </FieldDescription>
        </div>
        {previewCount > 0 && (
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            {previewCount} {previewCount === 1 ? "image" : "images"}
          </span>
        )}
      </div>

      {previewCount > 0 ? (
        <div className="grid grid-cols-2 gap-2" data-testid="gallery-previews">
          {activeExisting.map((image) => (
            <div key={image.fileName} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <img src={image.url} alt="Existing gallery preview" className="size-full object-cover" />
              <button
                type="button"
                aria-label={`Remove ${image.fileName}`}
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-background/90 text-foreground opacity-100 shadow-sm transition hover:bg-background lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                onClick={() => onRemoveExisting(image.fileName)}
              >
                <X className="size-4" />
              </button>
              <span className="absolute bottom-1.5 left-1.5 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                Saved
              </span>
            </div>
          ))}
          {selectedFiles.map((file, index) => (
            <div key={`${file.name}-${file.lastModified}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              {objectUrls[index] && (
                <img src={objectUrls[index]} alt={`Preview ${file.name}`} className="size-full object-cover" />
              )}
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-background/90 text-foreground opacity-100 shadow-sm transition hover:bg-background lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                onClick={() => onFilesChange(selectedFiles.filter((_, itemIndex) => itemIndex !== index))}
              >
                <X className="size-4" />
              </button>
              <span className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-0.75rem)] truncate rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                {file.name}
              </span>
            </div>
          ))}
          {externalUrls.map((url, index) => (
            <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <img src={url} alt="External gallery preview" className="size-full object-cover" />
              <button
                type="button"
                aria-label={`Remove gallery URL ${index + 1}`}
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-background/90 text-foreground opacity-100 shadow-sm transition hover:bg-background lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                onClick={() => removeExternalUrl(index)}
              >
                <X className="size-4" />
              </button>
              <span className="absolute bottom-1.5 left-1.5 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                URL
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex aspect-[2/1] items-center justify-center rounded-lg border border-dashed bg-muted/40">
          <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
            <Images className="size-7 opacity-60" />
            <span className="text-xs">No gallery images yet</span>
          </div>
        </div>
      )}

      <Button type="button" variant="outline" asChild>
        <label htmlFor={inputId} className="cursor-pointer">
          <Upload />
          Upload gallery images
        </label>
      </Button>
      <input
        id={inputId}
        className="sr-only"
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={(event) => {
          selectFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      <FieldSeparator>or add external URLs</FieldSeparator>
      <FieldLabel htmlFor={urlsId} className="text-xs text-muted-foreground">
        Gallery URLs
      </FieldLabel>
      <Textarea
        id={urlsId}
        value={urls}
        rows={3}
        placeholder={"https://…\nhttps://…"}
        aria-invalid={Boolean(urlError)}
        onChange={(event) => onUrlsChange(event.target.value)}
      />
      <FieldDescription>One optional URL per line. Valid URLs appear in the preview above.</FieldDescription>
      {urlError && <FieldError>{urlError}</FieldError>}
      {fileError && <FieldError>{fileError}</FieldError>}
    </Field>
  );
};

export default GalleryUploadField;
