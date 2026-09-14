/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import RichTextContent from '@/components/common/RichTextContent';
import { useCart } from '@/contexts/CartContext';
import { useCatalog } from '@/contexts/CatalogContext';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, isLoading } = useCatalog();
  const { addToCart: onAddToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const product = products.find((p) => p.slug === id || p.id === id);
  if (!product) return isLoading ? null : <Navigate to="/" replace />;

  const onBack = () => navigate('/#products');

  // Mock sizes for demonstration if not in data
  const sizes = ['S', 'M', 'L'];
  const showSizes = product.category === 'Wearable';
  const galleryImages = Array.from(
    new Set([product.imageUrl, ...(product.gallery ?? [])].filter(Boolean)),
  );
  const activeImage = selectedImage && galleryImages.includes(selectedImage)
    ? selectedImage
    : galleryImages[0] ?? '';

  return (
    <div className="pt-24 min-h-screen bg-[#F5F2EB] animate-fade-in-up">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 pb-24">

        {/* Breadcrumb / Back */}
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[#A8A29E] hover:text-[#2C2A26] transition-colors mb-8"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Shop
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">

          {/* Left: Main Image Only */}
          <div className="flex flex-col gap-4">
            <div className="w-full aspect-[4/5] bg-[#EBE7DE] overflow-hidden">
              {activeImage && (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="w-full h-full object-cover animate-fade-in-up"
                />
              )}
            </div>
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3" aria-label="Product gallery">
                {galleryImages.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    aria-label={`View product image ${index + 1}`}
                    aria-pressed={image === activeImage}
                    onClick={() => setSelectedImage(image)}
                    className={`aspect-square overflow-hidden border transition-colors ${
                      image === activeImage
                        ? 'border-[#2C2A26]'
                        : 'border-transparent hover:border-[#A8A29E]'
                    }`}
                  >
                    <img
                      src={image}
                      alt=""
                      className="size-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="flex flex-col justify-center max-w-xl">
             <span className="text-sm font-medium text-[#A8A29E] uppercase tracking-widest mb-2">{product.category}</span>
             <h1 className="text-4xl md:text-5xl font-serif text-[#2C2A26] mb-4">{product.name}</h1>
             <span className="text-2xl font-light text-[#2C2A26] mb-8">${product.price}</span>

             <RichTextContent
               html={product.longDescription || product.description}
               className="text-[#5D5A53] leading-relaxed font-light text-lg mb-8 border-b border-[#D6D1C7] pb-8"
             />

             {showSizes && (
                <div className="mb-8">
                  <span className="block text-xs font-bold uppercase tracking-widest text-[#2C2A26] mb-4">Select Size</span>
                  <div className="flex gap-4">
                    {sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-12 h-12 flex items-center justify-center border transition-all duration-300 ${
                          selectedSize === size
                            ? 'border-[#2C2A26] bg-[#2C2A26] text-[#F5F2EB]'
                            : 'border-[#D6D1C7] text-[#5D5A53] hover:border-[#2C2A26]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
             )}

             <div className="flex flex-col gap-4">
               <button
                 onClick={() => onAddToCart(product)}
                 className="w-full py-5 bg-[#2C2A26] text-[#F5F2EB] uppercase tracking-widest text-sm font-medium hover:bg-[#433E38] transition-colors"
               >
                 Add to Cart — ${product.price}
               </button>
               <ul className="mt-8 space-y-2 text-sm text-[#5D5A53]">
                 {product.features.map((feature, idx) => (
                   <li key={idx} className="flex items-center gap-3">
                     <span className="w-1 h-1 bg-[#2C2A26] rounded-full"></span>
                     {feature}
                   </li>
                 ))}
               </ul>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
