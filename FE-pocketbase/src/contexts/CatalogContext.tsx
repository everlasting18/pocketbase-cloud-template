/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { JOURNAL_ARTICLES } from "@/constants/articles";
import { PRODUCTS } from "@/constants/products";
import {
  fetchArticlesFromPocketBase,
  fetchProductsFromPocketBase,
  testPocketBaseConnection,
} from "@/services/pocketbase";
import { JournalArticle, Product } from "@/types";

interface CatalogContextValue {
  products: Product[];
  articles: JournalArticle[];
  isConnected: boolean;
  isRemoteActive: boolean;
  isLoading: boolean;
  reload: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [articles, setArticles] = useState<JournalArticle[]>(JOURNAL_ARTICLES);
  const [isConnected, setIsConnected] = useState(false);
  const [isRemoteActive, setIsRemoteActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const health = await testPocketBaseConnection();
      setIsConnected(health.connected);

      if (health.connected) {
        const [prodRes, artRes] = await Promise.all([
          fetchProductsFromPocketBase(),
          fetchArticlesFromPocketBase(),
        ]);
        const remoteProducts = prodRes.fromRemote && prodRes.products.length > 0;
        setProducts(remoteProducts ? prodRes.products : PRODUCTS);
        setIsRemoteActive(remoteProducts);
        setArticles(
          artRes.fromRemote && artRes.articles.length > 0
            ? artRes.articles
            : JOURNAL_ARTICLES,
        );
      } else {
        setProducts(PRODUCTS);
        setArticles(JOURNAL_ARTICLES);
        setIsRemoteActive(false);
      }
    } catch {
      setProducts(PRODUCTS);
      setArticles(JOURNAL_ARTICLES);
      setIsRemoteActive(false);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(
    () => ({ products, articles, isConnected, isRemoteActive, isLoading, reload }),
    [products, articles, isConnected, isRemoteActive, isLoading, reload],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export const useCatalog = (): CatalogContextValue => {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
};
