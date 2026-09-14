/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Outlet, ScrollRestoration, useLocation, useNavigate } from "react-router";
import CartDrawer from "@/components/cart/CartDrawer";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { useCart } from "@/contexts/CartContext";

const MainLayout: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { items, isCartOpen, closeCart, removeFromCart } = useCart();

  // Checkout is a focused flow without site chrome
  const showChrome = pathname !== "/checkout";

  return (
    <div className="storefront min-h-screen bg-[#F5F2EB] font-sans text-[#2C2A26] selection:bg-[#D6D1C7] selection:text-[#2C2A26]">
      {showChrome && <Navbar />}

      <main>
        <Outlet />
      </main>

      {showChrome && <Footer />}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        items={items}
        onRemoveItem={removeFromCart}
        onCheckout={() => {
          closeCart();
          navigate("/checkout");
        }}
      />

      <ScrollRestoration />
    </div>
  );
};

export default MainLayout;
