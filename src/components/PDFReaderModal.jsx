import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ExternalLink, BookOpen } from 'lucide-react';

export default function PDFReaderModal({ isOpen, onClose, book }) {
  useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Handle ESC key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!book) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#091e1a]/90 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-6xl h-[92vh] max-h-[950px] bg-[#0E2D27] border border-[#B78A3B]/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#173F35] border-b border-[#B78A3B]/20 text-[#FAF7F0] shrink-0">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-8 h-8 rounded-lg bg-[#B78A3B]/20 flex items-center justify-center text-[#B78A3B] shrink-0">
                  <BookOpen size={18} />
                </div>
                <div className="min-w-0">
                  <h3 id="pdf-modal-title" className="font-serif text-sm sm:text-base text-[#FAF7F0] font-medium truncate">
                    {book.title}
                  </h3>
                  {book.titleTamil && (
                    <p className="font-tamil text-xs text-[#E8D7B5]/70 truncate">
                      {book.titleTamil}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={book.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F0]/10 hover:bg-[#FAF7F0]/20 text-[#FAF7F0] text-xs font-sans font-medium transition-colors"
                  title="Open in new window"
                >
                  <ExternalLink size={14} />
                  <span>Open Full</span>
                </a>

                <a
                  href={book.pdfUrl}
                  download="Poondi-Swamy-Tamil-Book-1.pdf"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#B78A3B] hover:bg-[#D8B86A] text-[#FAF7F0] text-xs font-sans font-semibold transition-colors shadow-sm"
                  title="Download PDF"
                >
                  <Download size={14} />
                  <span>Download</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#FAF7F0]/80 hover:text-[#FAF7F0] hover:bg-[#FAF7F0]/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B78A3B]"
                  aria-label="Close reader"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Viewer Body */}
            <div className="relative flex-1 w-full bg-[#1b2220] overflow-hidden flex flex-col">
              <iframe
                src={`${book.pdfUrl}#toolbar=1&navpanes=0`}
                title={`PDF Reader - ${book.title}`}
                className="w-full h-full border-0 flex-1"
              />

              {/* Mobile Fallback Overlay (Shown if iframe PDF preview is unsupported) */}
              <noscript>
                <div className="p-8 text-center text-[#FAF7F0]">
                  <p className="mb-4">JavaScript is required to preview this book.</p>
                  <a
                    href={book.pdfUrl}
                    download
                    className="inline-flex items-center gap-2 bg-[#B78A3B] px-4 py-2 rounded text-white"
                  >
                    Download PDF
                  </a>
                </div>
              </noscript>
            </div>

            {/* Footer Bar */}
            <div className="px-4 py-2 bg-[#091e1a] border-t border-[#B78A3B]/10 flex flex-wrap items-center justify-between text-[11px] text-[#E8D7B5]/60 font-sans">
              <span>{book.publishedBy || 'Sri Poondi Mahan Attru Swamy Ashramam'}</span>
              <div className="flex items-center gap-2">
                <span>{book.fileSize || 'PDF Format'}</span>
                <span>•</span>
                <a
                  href={book.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D8B86A] hover:underline"
                >
                  Direct PDF Link
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
