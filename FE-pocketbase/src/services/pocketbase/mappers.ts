/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { JournalArticle, Order, Product } from "@/types";
import { getPocketBase } from "./client";

const uploadedImage = (record: any): { fileName: string; url: string } => {
  const fileName = Array.isArray(record.imageFile)
    ? (record.imageFile[0] ?? "")
    : (record.imageFile ?? "");
  return {
    fileName,
    url: fileName ? getPocketBase().files.getURL(record, fileName) : "",
  };
};

const uploadedGallery = (record: any): { fileNames: string[]; urls: string[] } => {
  const fileNames = Array.isArray(record.galleryFiles)
    ? record.galleryFiles.filter(Boolean)
    : record.galleryFiles
      ? [record.galleryFiles]
      : [];
  return {
    fileNames,
    urls: fileNames.map((fileName) => getPocketBase().files.getURL(record, fileName)),
  };
};

/**
 * Field Mappers: Map between PocketBase records and Project TypeScript models
 */
export const mapPbRecordToProduct = (record: any): Product => {
  const upload = uploadedImage(record);
  const galleryUpload = uploadedGallery(record);
  const gallerySourceUrls = Array.isArray(record.gallery) ? record.gallery : [];
  const gallery = [...galleryUpload.urls, ...gallerySourceUrls];
  const sourceUrl = record.imageUrl || gallery[0] || "";
  return {
    id: record.id,
    name: record.name || "Untitled Product",
    tagline: record.tagline || "",
    description: record.description || "",
    longDescription: record.longDescription || "",
    price: Number(record.price) || 0,
    category: (record.category as Product["category"]) || "Audio",
    imageUrl: upload.url || sourceUrl,
    imageSourceUrl: record.imageUrl || "",
    imageFileName: upload.fileName,
    gallerySourceUrls,
    galleryFileNames: galleryUpload.fileNames,
    gallery: gallery.length ? gallery : (record.imageUrl ? [record.imageUrl] : []),
    features: Array.isArray(record.features) ? record.features : [],
    slug: record.slug || record.id,
  };
};

export const mapPbRecordToArticle = (record: any): JournalArticle => {
  const upload = uploadedImage(record);
  return {
    id: record.id,
    title: record.title || "Untitled Article",
    date: record.date ||
      new Date(record.created).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    excerpt: record.excerpt || "",
    image: upload.url || record.image || "",
    imageSourceUrl: record.image || "",
    imageFileName: upload.fileName,
    content: record.contentHtml || "",
    contentHtml: record.contentHtml || "",
  };
};

export const mapPbRecordToOrder = (record: any): Order => ({
  id: record.id,
  customerEmail: record.customerEmail || "",
  customerName: record.customerName || "",
  shippingAddress: record.shippingAddress || "",
  city: record.city || "",
  postalCode: record.postalCode || "",
  totalAmount: Number(record.totalAmount) || 0,
  items: Array.isArray(record.items) ? record.items : [],
  status: record.status || "pending",
  created: record.created,
});
