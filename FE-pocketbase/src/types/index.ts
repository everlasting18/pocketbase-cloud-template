/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from "react";

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  longDescription?: string;
  price: number;
  category: "Audio" | "Wearable" | "Mobile" | "Home";
  imageUrl: string;
  /** Raw external URL before an uploaded PocketBase file takes precedence. */
  imageSourceUrl?: string;
  /** PocketBase filename when the primary image comes from its file storage. */
  imageFileName?: string;
  /** Raw external gallery URLs, excluding uploaded PocketBase files. */
  gallerySourceUrls?: string[];
  /** PocketBase filenames for the uploaded gallery images. */
  galleryFileNames?: string[];
  gallery?: string[];
  features: string[];
  slug?: string;
}

export interface JournalArticle {
  id: number | string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  /** Raw external URL before an uploaded PocketBase file takes precedence. */
  imageSourceUrl?: string;
  /** PocketBase filename when the cover comes from its file storage. */
  imageFileName?: string;
  content: React.ReactNode | string; // JSX locally, HTML string from PocketBase
  contentHtml?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";

export interface Order {
  id?: string;
  customerEmail: string;
  customerName?: string;
  shippingAddress?: string;
  city?: string;
  postalCode?: string;
  totalAmount: number;
  items: OrderItem[];
  status?: OrderStatus;
  created?: string;
}

// PocketBase collection definitions and field mappings
export interface PbFieldMapping {
  projectProperty: string;
  pbFieldName: string;
  pbFieldType:
    | "text"
    | "number"
    | "bool"
    | "email"
    | "url"
    | "date"
    | "select"
    | "json"
    | "file"
    | "relation"
    | "editor";
  required: boolean;
  notes: string;
}

export interface PbCollectionDefinition {
  collectionName: string;
  projectModel: string;
  description: string;
  fields: PbFieldMapping[];
  rules: {
    list: string;
    view: string;
    create: string;
    update: string;
    delete: string;
  };
}
