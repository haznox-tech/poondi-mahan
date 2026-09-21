import { useState } from 'react';
import { Phone, Copy, Check, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ContactCard({ name, nameTa, role, roleTa, phones, image }) {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [imageError, setImageError] = useState(false);
  const { i18n } = useTranslation();
  const isTamil = i18n.language?.startsWith('ta');

  const displayName = isTamil && nameTa ? nameTa : name;
  const displayRole = isTamil && roleTa ? roleTa : role;

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const copyToClipboard = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      // fallback for older browsers
    }
  };

  return (
    <div className="bg-[#FAF7F0] border border-[#E8D7B5] rounded-2xl p-5 sm:p-6 hover:border-[#B78A3B] transition-all duration-300 shadow-xs hover:shadow-md">
      <div className="flex items-center gap-4 mb-4">
        {/* Photo Avatar */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-[#B78A3B] bg-[#173F35] flex items-center justify-center flex-shrink-0 shadow-sm">
          {image && !imageError ? (
            <img
              src={image}
              alt={`${displayName} - ${displayRole}`}
              width={64}
              height={64}
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <span className="font-serif text-lg text-[#D8B86A] font-semibold">
              {initials}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Crown size={12} className="text-[#B78A3B]" aria-hidden="true" />
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[#B78A3B] font-sans">
              {displayRole}
            </span>
          </div>
          <h3 className="font-serif text-lg sm:text-xl text-[#173F35] font-semibold leading-snug truncate">
            {displayName}
          </h3>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 pt-3 border-t border-[#E8D7B5]/60">
        {phones.map((ph, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 bg-[#F2EBDD]/60 hover:bg-[#F2EBDD] p-2 sm:px-3 rounded-xl transition-colors">
            <a
              href={`tel:+91${ph.replace(/\s/g, '')}`}
              className="flex items-center gap-2 text-sm text-[#173F35] hover:text-[#B78A3B] transition-colors font-sans font-medium"
              aria-label={`Call ${name} at ${ph}`}
            >
              <Phone size={14} className="text-[#B78A3B]" aria-hidden="true" />
              <span>{ph}</span>
            </a>
            <button
              type="button"
              onClick={() => copyToClipboard(ph, idx)}
              className="p-1.5 rounded-lg hover:bg-[#E8D7B5] transition-colors cursor-pointer text-[#77736A] hover:text-[#173F35]"
              aria-label={`Copy phone number ${ph}`}
              title="Copy number"
            >
              {copiedIdx === idx ? (
                <Check size={14} className="text-green-600" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

