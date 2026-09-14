/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import About from "@/components/home/About";
import Hero from "@/components/home/Hero";
import JournalList from "@/components/journal/JournalList";
import ProductGrid from "@/components/product/ProductGrid";
import { useCatalog } from "@/contexts/CatalogContext";

const HomePage: React.FC = () => {
  const { products, articles } = useCatalog();

  return (
    <>
      <Hero />
      <ProductGrid products={products} />
      <About />
      <JournalList articles={articles} />
    </>
  );
};

export default HomePage;
