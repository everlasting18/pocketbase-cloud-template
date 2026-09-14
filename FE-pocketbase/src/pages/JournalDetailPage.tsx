/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import RichTextContent from '@/components/common/RichTextContent';
import { useCatalog } from '@/contexts/CatalogContext';

const JournalDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { articles, isLoading } = useCatalog();

  const article = articles.find((a) => String(a.id) === id);
  if (!article) return isLoading ? null : <Navigate to="/" replace />;

  const onBack = () => navigate('/#journal');

  return (
    <div className="min-h-screen bg-[#F5F2EB] animate-fade-in-up">
       {/* Hero Image for Article - Full bleed to top so navbar sits on it */}
       <div className="w-full h-[50vh] md:h-[60vh] relative overflow-hidden">
          {article.image && (
            <img
               src={article.image}
               alt={article.title}
               className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/20"></div>
       </div>

       <div className="max-w-3xl mx-auto px-6 md:px-12 -mt-32 relative z-10 pb-32">
          <div className="bg-[#F5F2EB] p-8 md:p-16 shadow-xl shadow-[#2C2A26]/5">
             <div className="flex justify-between items-center mb-12 border-b border-[#D6D1C7] pb-8">
                <button
                  onClick={onBack}
                  className="group flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[#A8A29E] hover:text-[#2C2A26] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Back to Journal
                </button>
                <span className="text-xs font-medium uppercase tracking-widest text-[#A8A29E]">{article.date}</span>
             </div>

             <h1 className="text-4xl md:text-6xl font-serif text-[#2C2A26] mb-12 leading-tight md:leading-none text-center">
               {article.title}
             </h1>

             {typeof article.content === 'string' ? (
               <RichTextContent
                 html={article.content}
                 className="mx-auto font-light leading-loose text-[#5D5A53]"
               />
             ) : (
               <div className="rich-content mx-auto font-light leading-loose text-[#5D5A53]">
                 {article.content}
               </div>
             )}

             <div className="mt-16 pt-12 border-t border-[#D6D1C7] flex justify-center">
                 <span className="text-2xl font-serif italic text-[#2C2A26]">Aura</span>
             </div>
          </div>
       </div>
    </div>
  );
};

export default JournalDetailPage;
