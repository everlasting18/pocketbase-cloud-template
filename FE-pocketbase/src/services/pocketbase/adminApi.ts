/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { JournalArticle, Order, OrderStatus, Product } from "@/types";
import { getPocketBase } from "./client";
import {
  mapPbRecordToArticle,
  mapPbRecordToOrder,
  mapPbRecordToProduct,
} from "./mappers";
import {
  createMockArticle,
  createMockProduct,
  deleteMockArticle,
  deleteMockProduct,
  getMockArticle,
  getMockProduct,
  isMockPocketBaseEnabled,
  listMockArticles,
  listMockOrders,
  listMockProducts,
  updateMockArticle,
  updateMockOrderStatus,
  updateMockProduct,
} from "./mock";

export interface Page<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
}

export interface ListParams {
  page: number;
  perPage?: number;
  search?: string;
}

export type ProductInput = Omit<
  Product,
  "id" | "imageFileName" | "imageSourceUrl" | "galleryFileNames" | "gallerySourceUrls"
> & {
  imageUpload?: File;
  removeImageUpload?: boolean;
  galleryUploads?: File[];
  removedGalleryFileNames?: string[];
};

export interface ArticleInput {
  title: string;
  date: string;
  excerpt: string;
  image: string;
  imageUpload?: File;
  removeImageUpload?: boolean;
  contentHtml: string;
}

const PER_PAGE = 20;

const listPage = async <T>(
  collection: string,
  page: number,
  perPage: number,
  filter: string,
  map: (record: any) => T,
): Promise<Page<T>> => {
  const res = await getPocketBase()
    .collection(collection)
    .getList(page, perPage, { sort: "-created", filter, requestKey: null });
  return {
    items: res.items.map(map),
    page: res.page,
    totalPages: res.totalPages,
    totalItems: res.totalItems,
  };
};

// `field` is always a literal from this module; the user's text is bound as a parameter.
const searchFilter = (field: string, search?: string): string => {
  const q = search?.trim();
  return q ? getPocketBase().filter(`${field} ~ {:q}`, { q }) : "";
};

const withImageUpload = <T extends {
  imageUpload?: File;
  removeImageUpload?: boolean;
}>(input: T): Omit<T, "imageUpload" | "removeImageUpload"> & {
  imageFile?: File | never[];
} => {
  const { imageUpload, removeImageUpload, ...fields } = input;
  return {
    ...fields,
    ...(imageUpload
      ? { imageFile: imageUpload }
      : removeImageUpload
        ? { imageFile: [] }
        : {}),
  };
};

const withProductUploads = (input: ProductInput, update = false): Record<string, unknown> => {
  const {
    galleryUploads,
    removedGalleryFileNames,
    imageUpload,
    removeImageUpload,
    ...fields
  } = input;
  return {
    ...fields,
    ...(imageUpload
      ? { imageFile: imageUpload }
      : removeImageUpload
        ? { imageFile: [] }
        : {}),
    ...(galleryUploads?.length
      ? { [update ? "galleryFiles+" : "galleryFiles"]: galleryUploads }
      : {}),
    ...(update && removedGalleryFileNames?.length
      ? { "galleryFiles-": removedGalleryFileNames }
      : {}),
  };
};

// Products

export const listProducts = ({ page, perPage = PER_PAGE, search }: ListParams) =>
  isMockPocketBaseEnabled
    ? Promise.resolve(listMockProducts(page, perPage, search))
    : listPage("products", page, perPage, searchFilter("name", search), mapPbRecordToProduct);

export const getProduct = async (id: string): Promise<Product> =>
  isMockPocketBaseEnabled
    ? getMockProduct(id)
    : mapPbRecordToProduct(
        await getPocketBase().collection("products").getOne(id, { requestKey: null }),
      );

export const createProduct = async (input: ProductInput): Promise<Product> =>
  isMockPocketBaseEnabled
    ? createMockProduct(input)
    : mapPbRecordToProduct(
        await getPocketBase().collection("products").create(withProductUploads(input)),
      );

export const updateProduct = async (
  id: string,
  input: ProductInput,
): Promise<Product> =>
  isMockPocketBaseEnabled
    ? updateMockProduct(id, input)
    : mapPbRecordToProduct(
        await getPocketBase().collection("products").update(id, withProductUploads(input, true)),
      );

export const deleteProduct = async (id: string): Promise<void> => {
  if (isMockPocketBaseEnabled) {
    deleteMockProduct(id);
    return;
  }
  await getPocketBase().collection("products").delete(id);
};

// Journal articles

export const listArticles = ({ page, perPage = PER_PAGE, search }: ListParams) =>
  isMockPocketBaseEnabled
    ? Promise.resolve(listMockArticles(page, perPage, search))
    : listPage(
        "journal_articles",
        page,
        perPage,
        searchFilter("title", search),
        mapPbRecordToArticle,
      );

export const getArticle = async (id: string): Promise<JournalArticle> =>
  isMockPocketBaseEnabled
    ? getMockArticle(id)
    : mapPbRecordToArticle(
        await getPocketBase()
          .collection("journal_articles")
          .getOne(id, { requestKey: null }),
      );

export const createArticle = async (input: ArticleInput): Promise<JournalArticle> =>
  isMockPocketBaseEnabled
    ? createMockArticle(input)
    : mapPbRecordToArticle(
        await getPocketBase()
          .collection("journal_articles")
          .create(withImageUpload(input)),
      );

export const updateArticle = async (
  id: string,
  input: ArticleInput,
): Promise<JournalArticle> =>
  isMockPocketBaseEnabled
    ? updateMockArticle(id, input)
    : mapPbRecordToArticle(
        await getPocketBase()
          .collection("journal_articles")
          .update(id, withImageUpload(input)),
      );

export const deleteArticle = async (id: string): Promise<void> => {
  if (isMockPocketBaseEnabled) {
    deleteMockArticle(id);
    return;
  }
  await getPocketBase().collection("journal_articles").delete(id);
};

// Orders

export const listOrders = ({
  page,
  perPage = PER_PAGE,
  status,
}: {
  page: number;
  perPage?: number;
  status?: OrderStatus;
}): Promise<Page<Order>> =>
  isMockPocketBaseEnabled
    ? Promise.resolve(listMockOrders(page, perPage, status))
    : listPage(
        "orders",
        page,
        perPage,
        status ? getPocketBase().filter("status = {:s}", { s: status }) : "",
        mapPbRecordToOrder,
      );

export const updateOrderStatus = async (
  id: string,
  status: OrderStatus,
): Promise<void> => {
  if (isMockPocketBaseEnabled) {
    updateMockOrderStatus(id, status);
    return;
  }
  await getPocketBase().collection("orders").update(id, { status });
};
