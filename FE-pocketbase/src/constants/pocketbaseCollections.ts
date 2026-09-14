/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PbCollectionDefinition } from "@/types";

/**
 * Collection Definitions Matrix for UI mapping view
 */
export const POCKETBASE_COLLECTIONS_MAPPING: PbCollectionDefinition[] = [
  {
    collectionName: "products",
    projectModel: "Product (src/types/index.ts)",
    description:
      "E-commerce product catalog with category tags, pricing, specifications, and media.",
    rules: {
      list: 'Public ("")',
      view: 'Public ("")',
      create: 'Public for seed / Auth (@request.auth.id != "")',
      update: 'Auth (@request.auth.id != "")',
      delete: 'Auth (@request.auth.id != "")',
    },
    fields: [
      {
        projectProperty: "id",
        pbFieldName: "id",
        pbFieldType: "text",
        required: true,
        notes: "System unique 15-char record ID",
      },
      {
        projectProperty: "name",
        pbFieldName: "name",
        pbFieldType: "text",
        required: true,
        notes: "Product title / model name",
      },
      {
        projectProperty: "tagline",
        pbFieldName: "tagline",
        pbFieldType: "text",
        required: false,
        notes: "Short sensory headline",
      },
      {
        projectProperty: "description",
        pbFieldName: "description",
        pbFieldType: "text",
        required: true,
        notes: "Primary overview for catalog cards",
      },
      {
        projectProperty: "longDescription",
        pbFieldName: "longDescription",
        pbFieldType: "editor",
        required: false,
        notes: "Rich storytelling and materials narrative",
      },
      {
        projectProperty: "price",
        pbFieldName: "price",
        pbFieldType: "number",
        required: true,
        notes: "Price in USD (min 0)",
      },
      {
        projectProperty: "category",
        pbFieldName: "category",
        pbFieldType: "select",
        required: true,
        notes: "Audio | Wearable | Mobile | Home",
      },
      {
        projectProperty: "imageUrl",
        pbFieldName: "imageUrl",
        pbFieldType: "url",
        required: false,
        notes: "Optional external primary image URL",
      },
      {
        projectProperty: "imageUpload",
        pbFieldName: "imageFile",
        pbFieldType: "file",
        required: false,
        notes: "Primary image upload (single image, recommended max 5 MB)",
      },
      {
        projectProperty: "gallery",
        pbFieldName: "gallery",
        pbFieldType: "json",
        required: false,
        notes: "Array of optional external gallery photo URLs",
      },
      {
        projectProperty: "galleryUploads",
        pbFieldName: "galleryFiles",
        pbFieldType: "file",
        required: false,
        notes: "Multiple gallery image uploads (max select 10, recommended max 5 MB each)",
      },
      {
        projectProperty: "features",
        pbFieldName: "features",
        pbFieldType: "json",
        required: false,
        notes: "Array of key highlight bullet points",
      },
      {
        projectProperty: "slug",
        pbFieldName: "slug",
        pbFieldType: "text",
        required: false,
        notes: "SEO-friendly URL identifier",
      },
    ],
  },
  {
    collectionName: "journal_articles",
    projectModel: "JournalArticle (src/types/index.ts)",
    description:
      "Minimalist editorial magazine with sensory essays, poetry, and imagery.",
    rules: {
      list: 'Public ("")',
      view: 'Public ("")',
      create: 'Public for seed / Auth (@request.auth.id != "")',
      update: 'Auth (@request.auth.id != "")',
      delete: 'Auth (@request.auth.id != "")',
    },
    fields: [
      {
        projectProperty: "id",
        pbFieldName: "id",
        pbFieldType: "text",
        required: true,
        notes: "System unique 15-char record ID",
      },
      {
        projectProperty: "title",
        pbFieldName: "title",
        pbFieldType: "text",
        required: true,
        notes: "Editorial article title",
      },
      {
        projectProperty: "date",
        pbFieldName: "date",
        pbFieldType: "text",
        required: false,
        notes: 'Published date (e.g., "April 12, 2025")',
      },
      {
        projectProperty: "excerpt",
        pbFieldName: "excerpt",
        pbFieldType: "text",
        required: true,
        notes: "Summary preview text",
      },
      {
        projectProperty: "image",
        pbFieldName: "image",
        pbFieldType: "url",
        required: false,
        notes: "Optional external cover image URL",
      },
      {
        projectProperty: "imageUpload",
        pbFieldName: "imageFile",
        pbFieldType: "file",
        required: false,
        notes: "Cover image upload (single image, recommended max 5 MB)",
      },
      {
        projectProperty: "contentHtml",
        pbFieldName: "contentHtml",
        pbFieldType: "editor",
        required: false,
        notes: "HTML story text with blockquotes and poetry",
      },
    ],
  },
  {
    collectionName: "orders",
    projectModel: "Order (src/types/index.ts)",
    description:
      "Customer checkout orders with purchased line items and shipping details.",
    rules: {
      list: 'Auth (@request.auth.id != "")',
      view: 'Auth (@request.auth.id != "")',
      create: 'Public ("")',
      update: 'Auth (@request.auth.id != "")',
      delete: 'Auth (@request.auth.id != "")',
    },
    fields: [
      {
        projectProperty: "id",
        pbFieldName: "id",
        pbFieldType: "text",
        required: true,
        notes: "Generated order reference ID",
      },
      {
        projectProperty: "customerEmail",
        pbFieldName: "customerEmail",
        pbFieldType: "email",
        required: true,
        notes: "Recipient notification email",
      },
      {
        projectProperty: "customerName",
        pbFieldName: "customerName",
        pbFieldType: "text",
        required: false,
        notes: "Customer full name",
      },
      {
        projectProperty: "shippingAddress",
        pbFieldName: "shippingAddress",
        pbFieldType: "text",
        required: false,
        notes: "Delivery address",
      },
      {
        projectProperty: "city",
        pbFieldName: "city",
        pbFieldType: "text",
        required: false,
        notes: "Delivery destination city",
      },
      {
        projectProperty: "totalAmount",
        pbFieldName: "totalAmount",
        pbFieldType: "number",
        required: true,
        notes: "Total checkout price in USD",
      },
      {
        projectProperty: "items",
        pbFieldName: "items",
        pbFieldType: "json",
        required: true,
        notes: "Array of cart products with quantities",
      },
      {
        projectProperty: "status",
        pbFieldName: "status",
        pbFieldType: "select",
        required: false,
        notes: "pending | paid | shipped | cancelled",
      },
    ],
  },
];
