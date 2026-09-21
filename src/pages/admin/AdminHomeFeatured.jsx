import { useState, useEffect } from 'react';
import {
  Star,
  Check,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Images,
  Trash2,
} from 'lucide-react';
import {
  getAllGalleryItems,
  getFeaturedIds,
  saveFeaturedIds,
  syncFromCodebase,
  flushToCodebase,
} from '../../admin/adminStore.js';
import clsx from 'clsx';

export default function AdminHomeFeatured() {
  const [allItems, setAllItems] = useState(() =>
    typeof window !== 'undefined' ? getAllGalleryItems() : []
  );
  const [selectedIds, setSelectedIds] = useState(() => {
    if (typeof window === 'undefined') return [];
    const saved = getFeaturedIds();
    if (saved && saved.length > 0) return saved;
    const list = getAllGalleryItems();
    return list.slice(0, 6).map((i) => i.id);
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    const onUpdate = () => {
      if (!isMounted) return;
      const updatedList = getAllGalleryItems();
      setAllItems(updatedList);
      const saved = getFeaturedIds();
      if (saved && saved.length > 0) {
        setSelectedIds(saved);
      }
    };

    syncFromCodebase().then(() => {
      if (isMounted) onUpdate();
    });

    window.addEventListener('pm_gallery_updated', onUpdate);
    window.addEventListener('pm_featured_updated', onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('pm_gallery_updated', onUpdate);
      window.removeEventListener('pm_featured_updated', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, []);

  // Helper to find item by id
  const getItem = (id) => allItems.find((i) => String(i.id) === String(id));

  // Selected items resolved
  const selectedItems = selectedIds.map(getItem).filter(Boolean);

  const toggleSelect = (id) => {
    setErrorMsg('');
    setSaveSuccess(false);

    const isMatch = (val) => String(val) === String(id);

    if (selectedIds.some(isMatch)) {
      // Remove
      setSelectedIds(selectedIds.filter((itemKey) => !isMatch(itemKey)));
    } else {
      // Add
      if (selectedIds.length >= 6) {
        setErrorMsg('Maximum 6 images can be featured on the Home page preview. Remove an image before adding another.');
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removeSelected = (id) => {
    setSelectedIds(selectedIds.filter((itemKey) => String(itemKey) !== String(id)));
  };

  const handleSave = async () => {
    setErrorMsg('');
    if (selectedIds.length !== 6) {
      setErrorMsg(`Please select exactly 6 images for the Home page grid (currently ${selectedIds.length} selected).`);
      return;
    }
    saveFeaturedIds(selectedIds);
    await flushToCodebase();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleResetDefault = async () => {
    const defaultIds = allItems.slice(0, 6).map((i) => i.id);
    setSelectedIds(defaultIds);
    saveFeaturedIds(defaultIds);
    await flushToCodebase();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };


  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10 pb-16">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-[#D8B86A] flex items-center gap-2.5 sm:gap-3">
              <Star className="text-[#D8B86A] shrink-0" size={24} />
              <span>Home Page Featured Images</span>
            </h1>
            <p className="text-[#77736A] text-xs sm:text-sm mt-1">
              Select the exact 6 photos displayed in the "Moments of Grace - Ashramam Gallery" preview on the Home page.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleResetDefault}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#1a2e28] hover:bg-[#173F35] text-[#FAF7F0] border border-[#1e3530] transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-[#B78A3B] hover:bg-[#D8B86A] text-[#0a1210] shadow-md shadow-[#B78A3B]/20 transition-all cursor-pointer"
            >
              <Check size={14} />
              <span>Save (6)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#2a1a1a] border border-[#5a2a2a] flex items-center gap-2.5 text-[#f87171] text-xs">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#173F35]/50 border border-[#2a5a4a] flex items-center gap-2.5 text-[#4ade80] text-xs">
          <CheckCircle2 size={15} className="shrink-0" />
          <span className="font-semibold">Home page featured images updated successfully!</span>
        </div>
      )}

      {/* Current Selection Shelf */}
      <div className="bg-[#0a1210] border border-[#1e3530] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 pb-3.5 sm:pb-4 border-b border-[#1e3530]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#173F35] flex items-center justify-center text-[#D8B86A] shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-semibold text-[#FAF7F0]">
                Current 6 Preview Slots
              </h2>
              <p className="text-[11px] sm:text-xs text-[#77736A]">
                These 6 photos will appear on the Home page preview.
              </p>
            </div>
          </div>
          <span
            className={clsx(
              'self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold font-mono border',
              selectedIds.length === 6
                ? 'bg-[#173F35] border-[#2a5a4a] text-[#4ade80]'
                : 'bg-[#2a1a1a] border-[#5a2a2a] text-[#f87171]'
            )}
          >
            {selectedIds.length} / 6 Selected
          </span>
        </div>

        {/* 6 Preview Grid Slots */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
          {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
            const item = selectedItems[slotIdx];
            return (
              <div
                key={slotIdx}
                className={clsx(
                  'aspect-[4/3] rounded-xl sm:rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden transition-all',
                  item
                    ? 'border-[#B78A3B]/60 bg-[#0f1a17] group'
                    : 'border-dashed border-[#1e3530] bg-[#0a1210]'
                )}
              >
                {item ? (
                  <>
                    <img
                      src={item.src}
                      alt={item.alt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                      <div className="flex justify-between items-center">
                        <span className="bg-[#B78A3B] text-[#0a1210] text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded">
                          Slot #{slotIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSelected(item.id)}
                          className="p-1 rounded-md bg-[#2a1a1a] text-[#f87171] hover:bg-[#3a1a1a] transition-colors cursor-pointer"
                          title="Remove from featured"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="text-[#FAF7F0] text-[10px] line-clamp-1 font-serif">
                        {item.title || item.alt}
                      </p>
                    </div>
                    {/* Fixed slot badge when not hovering */}
                    <span className="absolute top-1.5 left-1.5 group-hover:hidden bg-[#0a1210]/85 text-[#D8B86A] text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#B78A3B]/30">
                      #{slotIdx + 1}
                    </span>
                  </>
                ) : (
                  <div className="text-center p-2 sm:p-3">
                    <span className="text-[#77736A] text-xs font-semibold block mb-0.5">
                      Slot #{slotIdx + 1}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[#77736A]/60">Empty slot</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Picker Grid from All Photos */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 border-b border-[#1e3530] pb-3 sm:pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-serif font-semibold text-[#FAF7F0] flex items-center gap-2">
              <Images size={18} className="text-[#D8B86A]" />
              <span>Select Photos from Gallery</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-[#77736A] mt-0.5">
              Click any photo to select or deselect it for the Home page preview.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
          {allItems.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const selectionIndex = selectedIds.indexOf(item.id);

            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={clsx(
                  'cursor-pointer relative aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-200 group select-none',
                  isSelected
                    ? 'border-[#B78A3B] ring-2 ring-[#B78A3B] shadow-lg shadow-[#B78A3B]/20'
                    : 'border-[#1e3530] hover:border-[#2a5a4a] opacity-80 hover:opacity-100'
                )}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Status indicator top right */}
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                  {isSelected ? (
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#B78A3B] text-[#0a1210] font-bold text-[10px] sm:text-xs flex items-center justify-center shadow-md">
                      #{selectionIndex + 1}
                    </span>
                  ) : (
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/60 text-white/60 border border-white/20 flex items-center justify-center text-[10px] sm:text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      +
                    </span>
                  )}
                </div>

                {/* Admin tag if uploaded */}
                {item.isAdmin && (
                  <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2">
                    <span className="bg-[#173F35]/90 text-[#4ade80] text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#2a5a4a]">
                      Uploaded
                    </span>
                  </div>
                )}

                {/* Bottom title bar */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2.5 sm:p-3 pt-5">
                  <p className="text-[11px] sm:text-xs text-[#D8B86A] font-serif font-medium line-clamp-1">
                    {item.title || 'Sri Poondi Mahan'}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-[#FAF7F0]/70 line-clamp-1">
                    {item.alt}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
