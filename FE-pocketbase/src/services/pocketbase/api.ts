/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JOURNAL_ARTICLES } from "@/constants/articles";
import { PRODUCTS } from "@/constants/products";
import type { JournalArticle, Order, Product } from "@/types";
import { getPocketBase } from "./client";
import { mapPbRecordToArticle, mapPbRecordToProduct } from "./mappers";
import {
  getMockArticles,
  getMockProducts,
  saveMockOrder,
} from "./mock";
import { isMockMode } from "./dataSource";

/**
 * Data Retrieval with local fallbacks
 */
export const fetchProductsFromPocketBase = async (): Promise<{
  products: Product[];
  fromRemote: boolean;
  error?: string;
}> => {
  if (isMockMode()) {
    return { products: getMockProducts(), fromRemote: true };
  }

  try {
    const pb = getPocketBase();
    const records = await pb.collection("products").getFullList({
      sort: "-created",
      requestKey: null,
    });

    if (records && records.length > 0) {
      return {
        products: records.map(mapPbRecordToProduct),
        fromRemote: true,
      };
    }
    // Remote collection exists but is empty
    return {
      products: PRODUCTS,
      fromRemote: false,
      error:
        'PocketBase collection "products" is currently empty. Showing local catalog.',
    };
  } catch (err: any) {
    return {
      products: PRODUCTS,
      fromRemote: false,
      error: err.message ||
        "Could not fetch from PocketBase. Using local static catalog.",
    };
  }
};

export const fetchArticlesFromPocketBase = async (): Promise<{
  articles: JournalArticle[];
  fromRemote: boolean;
  error?: string;
}> => {
  if (isMockMode()) {
    return { articles: getMockArticles(), fromRemote: true };
  }

  try {
    const pb = getPocketBase();
    const records = await pb.collection("journal_articles").getFullList({
      sort: "-created",
      requestKey: null,
    });

    if (records && records.length > 0) {
      return {
        articles: records.map(mapPbRecordToArticle),
        fromRemote: true,
      };
    }
    return {
      articles: JOURNAL_ARTICLES,
      fromRemote: false,
      error: 'PocketBase collection "journal_articles" is currently empty.',
    };
  } catch (err: any) {
    return {
      articles: JOURNAL_ARTICLES,
      fromRemote: false,
      error: err.message || "Could not fetch from PocketBase.",
    };
  }
};

/**
 * Save Order to PocketBase
 */
export const saveOrderToPocketBase = async (
  order: Order,
): Promise<{ success: boolean; id?: string; error?: string }> => {
  if (isMockMode()) {
    return { success: true, id: saveMockOrder(order) };
  }

  try {
    const pb = getPocketBase();
    const record = await pb.collection("orders").create({
      customerEmail: order.customerEmail,
      customerName: order.customerName || "",
      shippingAddress: order.shippingAddress || "",
      city: order.city || "",
      totalAmount: order.totalAmount,
      items: order.items,
      status: "pending",
    });
    return { success: true, id: record.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};
