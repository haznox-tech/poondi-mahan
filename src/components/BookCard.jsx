import { motion } from 'framer-motion';
import { BookOpen, Download, FileText, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function BookCard({ book }) {
  const { t } = useTranslation();

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-white border border-[#E8D7B5] rounded-2xl overflow-hidden flex flex-col md:flex-row gap-0 hover:border-[#B78A3B] transition-all duration-300 hover:shadow-xl hover:shadow-[#173F35]/10 group"
    >
      {/* Book Cover Visual with 3D Effect - Mobile Optimized */}
      <div className="w-full md:w-64 bg-gradient-to-br from-[#173F35] via-[#0E2D27] to-[#091e1a] flex flex-col items-center justify-center p-6 sm:p-8 relative overflow-hidden flex-shrink-0">
        {/* Ambient glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#B78A3B]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#B78A3B]/10 rounded-full blur-2xl pointer-events-none" />

        {book.cover ? (
          <a
            href={book.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative group-hover:scale-105 transition-transform duration-500 cursor-pointer block max-w-[160px] sm:max-w-[180px]"
            title={`Read ${book.title} in new tab`}
          >
            {/* Book 3D Spine and Shadow */}
            <div className="relative rounded-lg shadow-2xl shadow-black/70 overflow-hidden border border-[#FAF7F0]/20">
              <img
                src={book.cover}
                alt={`Cover of ${book.title}`}
                width={180}
                height={250}
                loading="lazy"
                decoding="async"
                className="w-full h-auto object-cover block"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/10 pointer-events-none" />
            </div>
            {/* Quick Read overlay on hover */}
            <div className="absolute inset-0 bg-[#0E2D27]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center text-[#FAF7F0] font-sans text-xs font-semibold gap-1.5 backdrop-blur-[2px]">
              <ExternalLink size={16} className="text-[#D8B86A]" />
              <span>{t('common.readOnline', 'Read Online')}</span>
            </div>
          </a>
        ) : (
          <div className="w-36 h-48 bg-[#173F35] rounded-lg border border-[#B78A3B]/40 flex flex-col items-center justify-center shadow-2xl p-4 text-center">
            <BookOpen size={36} className="text-[#B78A3B] mb-2" aria-hidden="true" />
            <span className="text-[11px] text-[#E8D7B5] font-serif uppercase tracking-widest">Spiritual Book</span>
          </div>
        )}

        {/* Badge */}
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F0]/10 border border-[#FAF7F0]/15 text-[#E8D7B5] text-xs font-sans">
          <FileText size={13} className="text-[#B78A3B]" />
          <span>PDF {book.fileSize ? `• ${book.fileSize}` : ''}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 sm:p-7 md:p-8 flex flex-col justify-between flex-1 bg-[#FAF7F0]">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="inline-flex items-center text-xs font-semibold tracking-wider uppercase text-[#B78A3B] font-sans bg-[#B78A3B]/10 px-2.5 py-0.5 rounded-full">
              {book.language}
            </span>
            {book.pages && (
              <span className="text-xs text-[#77736A] font-sans">
                • {book.pages}
              </span>
            )}
          </div>

          <h3 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#173F35] font-semibold mb-1 leading-snug">
            {book.title}
          </h3>

          {book.titleTamil && (
            <p className="font-tamil text-base sm:text-lg text-[#B78A3B] mb-3 sm:mb-4 font-medium" lang="ta">
              {book.titleTamil}
            </p>
          )}

          <p className="text-[#77736A] text-sm sm:text-base leading-relaxed font-sans mb-4 sm:mb-6">
            {book.description}
          </p>

          {book.publishedBy && (
            <p className="text-xs text-[#77736A]/80 font-sans italic mb-6">
              Published by: <span className="text-[#173F35] font-medium not-italic">{book.publishedBy}</span>
            </p>
          )}
        </div>

        {/* Action Buttons - 100% Mobile Friendly */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-[#E8D7B5]/60">
          <a
            href={book.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#173F35] hover:bg-[#0E2D27] text-[#FAF7F0] text-sm sm:text-base font-sans font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-sm active:scale-[0.98] w-full sm:w-auto"
            title="Read book in new tab"
          >
            <BookOpen size={18} className="text-[#D8B86A]" aria-hidden="true" />
            <span>{t('common.readOnline', 'Read Online')}</span>
            <ExternalLink size={14} className="opacity-70 ml-0.5" aria-hidden="true" />
          </a>

          <a
            href={book.pdfUrl}
            download="Poondi-Swamy-Tamil-Book-1.pdf"
            className="inline-flex items-center justify-center gap-2 border border-[#B78A3B] text-[#B78A3B] hover:bg-[#B78A3B] hover:text-[#FAF7F0] text-sm sm:text-base font-sans font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 active:scale-[0.98] w-full sm:w-auto"
            title="Download PDF directly to your device"
          >
            <Download size={18} aria-hidden="true" />
            <span>{t('common.downloadPdf', 'Download PDF')}</span>
          </a>
        </div>
      </div>
    </motion.article>
  );
}


