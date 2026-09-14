/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Product } from "@/types";

interface CartContextValue {
  items: Product[];
  isCartOpen: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (index: number) => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = useCallback((product: Product) => {
    setItems((prev) => [...prev, product]);
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const value = useMemo(
    () => ({ items, isCartOpen, addToCart, removeFromCart, openCart, closeCart }),
    [items, isCartOpen, addToCart, removeFromCart, openCart, closeCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
