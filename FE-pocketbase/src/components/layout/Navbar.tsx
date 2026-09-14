/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { BRAND_NAME } from '@/constants/brand';
import { useCart } from '@/contexts/CartContext';

const Navbar: React.FC = () => {
  const { items, openCart } = useCart();
  const cartCount = items.length;
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setMobileMenuOpen(false);

  const handleCartClick = (e: React.MouseEvent) => {
      e.preventDefault();
      setMobileMenuOpen(false);
      openCart();
  }

  // Determine text color based on state
  const textColorClass = (scrolled || mobileMenuOpen) ? 'text-[#2C2A26]' : 'text-[#F5F2EB]';

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out ${
          scrolled || mobileMenuOpen ? 'bg-[#F5F2EB]/90 backdrop-blur-md py-4 shadow-xs' : 'bg-transparent py-8'
        }`}
      >
        <div className="max-w-[1800px] mx-auto px-8 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            onClick={closeMenu}
            className={`text-3xl font-serif font-medium tracking-tight z-50 relative transition-colors duration-500 ${textColorClass}`}
          >
            {BRAND_NAME}
          </Link>

          {/* Center Links - Desktop */}
          <div className={`hidden md:flex items-center gap-12 text-sm font-medium tracking-widest uppercase transition-colors duration-500 ${textColorClass}`}>
            <Link to="/#products" onClick={closeMenu} className="hover:opacity-60 transition-opacity">Shop</Link>
            <Link to="/#about" onClick={closeMenu} className="hover:opacity-60 transition-opacity">About</Link>
            <Link to="/#journal" onClick={closeMenu} className="hover:opacity-60 transition-opacity">Journal</Link>
          </div>

          {/* Right Actions */}
          <div className={`flex items-center gap-4 sm:gap-6 z-50 relative transition-colors duration-500 ${textColorClass}`}>
            <button
              onClick={handleCartClick}
              className="text-sm font-medium uppercase tracking-widest hover:opacity-60 transition-opacity hidden sm:block"
            >
              Cart ({cartCount})
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className={`block md:hidden focus:outline-hidden transition-colors duration-500 ${textColorClass}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
               {mobileMenuOpen ? (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                 </svg>
               )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-[#F5F2EB] z-40 flex flex-col justify-center items-center transition-all duration-500 ease-in-out ${
          mobileMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-10 pointer-events-none'
      }`}>
          <div className="flex flex-col items-center space-y-8 text-xl font-serif font-medium text-[#2C2A26]">
            <Link to="/#products" onClick={closeMenu} className="hover:opacity-60 transition-opacity">Shop</Link>
            <Link to="/#about" onClick={closeMenu} className="hover:opacity-60 transition-opacity">About</Link>
            <Link to="/#journal" onClick={closeMenu} className="hover:opacity-60 transition-opacity">Journal</Link>
            <button
                onClick={handleCartClick}
                className="hover:opacity-60 transition-opacity text-base uppercase tracking-widest font-sans mt-8"
            >
                Cart ({cartCount})
            </button>
          </div>
      </div>
    </>
  );
};

export default Navbar;
