/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JOURNAL_ARTICLES } from "@/constants/articles";
import { PRODUCTS } from "@/constants/products";
import type { JournalArticle, Order, OrderStatus, Product } from "@/types";

const STORAGE_KEY = "aura_mock_pb_data";

interface StoredProduct extends Product {
  created: string;
}

interface StoredArticle {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  contentHtml: string;
  created: string;
}

interface StoredOrder extends Order {
  id: string;
  created: string;
}

interface MockDatabase {
  products: StoredProduct[];
  articles: StoredArticle[];
  orders: StoredOrder[];
}

export interface MockPage<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });

const seedDatabase = (): MockDatabase => ({
  products: PRODUCTS.map((product, index) => ({
    ...clone(product),
    created: new Date(Date.UTC(2026, 0, PRODUCTS.length - index)).toISOString(),
  })),
  articles: JOURNAL_ARTICLES.map((article, index) => ({
    id: String(article.id),
    title: article.title,
    date: article.date,
    excerpt: article.excerpt,
    image: article.image,
    contentHtml: `<p>${article.excerpt}</p>`,
    created: new Date(Date.UTC(2026, 1, JOURNAL_ARTICLES.length - index)).toISOString(),
  })),
  orders: [
    {
      id: "mockorder000001",
      customerEmail: "linh@example.com",
      customerName: "Linh Nguyen",
      shippingAddress: "12 Nguyen Hue",
      city: "Ho Chi Minh City",
      postalCode: "700000",
      totalAmount: 429,
      items: [{ id: "p1", name: "Aura Harmony", price: 429, quantity: 1 }],
      status: "pending",
      created: new Date(Date.UTC(2026, 2, 10)).toISOString(),
    },
    {
      id: "mockorder000002",
      customerEmail: "minh@example.com",
      customerName: "Minh Tran",
      shippingAddress: "8 Le Loi",
      city: "Da Nang",
      postalCode: "550000",
      totalAmount: 349,
      items: [{ id: "p2", name: "Aura Epoch", price: 349, quantity: 1 }],
      status: "paid",
      created: new Date(Date.UTC(2026, 2, 9)).toISOString(),
    },
  ],
});

let memoryDatabase: MockDatabase | null = null;

const readDatabase = (): MockDatabase => {
  if (typeof window === "undefined") return memoryDatabase ?? seedDatabase();

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as MockDatabase;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const seeded = seedDatabase();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
};

const writeDatabase = (database: MockDatabase): void => {
  memoryDatabase = database;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  }
};

const nextId = (prefix: string): string =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const paginate = <T>(items: T[], page: number, perPage: number): MockPage<T> => ({
  items: clone(items.slice((page - 1) * perPage, page * perPage)),
  page,
  totalPages: Math.max(1, Math.ceil(items.length / perPage)),
  totalItems: items.length,
});

const includes = (value: string, search?: string): boolean =>
  !search?.trim() || value.toLowerCase().includes(search.trim().toLowerCase());

const missing = (kind: string): never => {
  throw new Error(`Mock ${kind} not found.`);
};

const toArticle = (article: StoredArticle): JournalArticle => ({
  ...clone(article),
  content: article.contentHtml,
});

export const getMockProducts = (): Product[] => clone(readDatabase().products);

export const listMockProducts = (
  page: number,
  perPage: number,
  search?: string,
): MockPage<Product> =>
  paginate(
    readDatabase().products.filter((product) => includes(product.name, search)),
    page,
    perPage,
  );

export const getMockProduct = (id: string): Product => {
  const product = readDatabase().products.find((item) => item.id === id);
  return product ? clone(product) : missing("product");
};

type MockProductInput = Omit<
  Product,
  "id" | "imageFileName" | "imageSourceUrl" | "galleryFileNames" | "gallerySourceUrls"
> & {
  imageUpload?: File;
  removeImageUpload?: boolean;
  galleryUploads?: File[];
  removedGalleryFileNames?: string[];
};

const mockFileName = (file: File): string =>
  `mock_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}_${file.name}`;

const mockProductFields = async (input: MockProductInput, existing?: StoredProduct) => {
  const {
    imageUpload,
    removeImageUpload,
    galleryUploads = [],
    removedGalleryFileNames = [],
    ...fields
  } = input;
  const previousFileNames = existing?.galleryFileNames ?? [];
  const previousUploadedUrls = (existing?.gallery ?? []).slice(0, previousFileNames.length);
  const keptUploads = previousFileNames.flatMap((fileName, index) =>
    removedGalleryFileNames.includes(fileName)
      ? []
      : [{ fileName, url: previousUploadedUrls[index] }],
  );
  const newUploads = await Promise.all(
    galleryUploads.map(async (file) => ({
      fileName: mockFileName(file),
      url: await fileToDataUrl(file),
    })),
  );
  const externalGallery = fields.gallery ?? [];
  const uploadedGallery = [...keptUploads, ...newUploads];
  return {
    ...clone(fields),
    imageUrl: imageUpload
      ? await fileToDataUrl(imageUpload)
      : removeImageUpload
        ? ""
        : fields.imageUrl,
    gallerySourceUrls: clone(externalGallery),
    galleryFileNames: uploadedGallery.map((image) => image.fileName),
    gallery: [...uploadedGallery.map((image) => image.url), ...clone(externalGallery)],
  };
};

export const createMockProduct = async (input: MockProductInput): Promise<Product> => {
  const database = readDatabase();
  const product: StoredProduct = {
    ...(await mockProductFields(input)),
    id: nextId("product"),
    created: new Date().toISOString(),
  };
  database.products.unshift(product);
  writeDatabase(database);
  return clone(product);
};

export const updateMockProduct = async (
  id: string,
  input: MockProductInput,
): Promise<Product> => {
  const database = readDatabase();
  const index = database.products.findIndex((item) => item.id === id);
  if (index < 0) return missing("product");
  const existing = database.products[index];
  database.products[index] = {
    ...(await mockProductFields(input, existing)),
    id,
    created: existing.created,
  };
  writeDatabase(database);
  return clone(database.products[index]);
};

export const deleteMockProduct = (id: string): void => {
  const database = readDatabase();
  const index = database.products.findIndex((item) => item.id === id);
  if (index < 0) return missing("product");
  database.products.splice(index, 1);
  writeDatabase(database);
};

export const getMockArticles = (): JournalArticle[] =>
  readDatabase().articles.map(toArticle);

export const listMockArticles = (
  page: number,
  perPage: number,
  search?: string,
): MockPage<JournalArticle> => {
  const filtered = readDatabase().articles.filter((article) => includes(article.title, search));
  const result = paginate(filtered, page, perPage);
  return { ...result, items: result.items.map(toArticle) };
};

export const getMockArticle = (id: string): JournalArticle => {
  const article = readDatabase().articles.find((item) => item.id === id);
  return article ? toArticle(article) : missing("article");
};

export interface MockArticleInput {
  title: string;
  date: string;
  excerpt: string;
  image: string;
  imageUpload?: File;
  removeImageUpload?: boolean;
  contentHtml: string;
}

const mockArticleFields = async (input: MockArticleInput) => {
  const { imageUpload, removeImageUpload, ...fields } = input;
  return {
    ...clone(fields),
    image: imageUpload
      ? await fileToDataUrl(imageUpload)
      : removeImageUpload
        ? ""
        : fields.image,
  };
};

export const createMockArticle = async (
  input: MockArticleInput,
): Promise<JournalArticle> => {
  const database = readDatabase();
  const article: StoredArticle = {
    ...(await mockArticleFields(input)),
    id: nextId("article"),
    created: new Date().toISOString(),
  };
  database.articles.unshift(article);
  writeDatabase(database);
  return toArticle(article);
};

export const updateMockArticle = async (
  id: string,
  input: MockArticleInput,
): Promise<JournalArticle> => {
  const database = readDatabase();
  const index = database.articles.findIndex((item) => item.id === id);
  if (index < 0) return missing("article");
  database.articles[index] = {
    ...(await mockArticleFields(input)),
    id,
    created: database.articles[index].created,
  };
  writeDatabase(database);
  return toArticle(database.articles[index]);
};

export const deleteMockArticle = (id: string): void => {
  const database = readDatabase();
  const index = database.articles.findIndex((item) => item.id === id);
  if (index < 0) return missing("article");
  database.articles.splice(index, 1);
  writeDatabase(database);
};

export const saveMockOrder = (order: Order): string => {
  const database = readDatabase();
  const id = nextId("order");
  database.orders.unshift({
    ...clone(order),
    id,
    status: order.status ?? "pending",
    created: new Date().toISOString(),
  });
  writeDatabase(database);
  return id;
};

export const listMockOrders = (
  page: number,
  perPage: number,
  status?: OrderStatus,
): MockPage<Order> =>
  paginate(
    readDatabase().orders.filter((order) => !status || order.status === status),
    page,
    perPage,
  );

export const updateMockOrderStatus = (id: string, status: OrderStatus): void => {
  const database = readDatabase();
  const order = database.orders.find((item) => item.id === id);
  if (!order) return missing("order");
  order.status = status;
  writeDatabase(database);
};
