import { useState } from 'react';
import { Phone, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TrusteeCard({ trustee }) {
  const [imageError, setImageError] = useState(false);
  const { i18n } = useTranslation();
  const isTamil = i18n.language?.startsWith('ta');

  const displayName = isTamil && trustee.nameTa ? trustee.nameTa : trustee.name;
  const displayRole = isTamil && trustee.roleTa ? trustee.roleTa : trustee.role;

  const initials = trustee.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-[#FAF7F0] border border-[#E8D7B5] rounded-2xl p-8 hover:border-[#B78A3B] transition-all duration-300 hover:shadow-xl hover:shadow-[#173F35]/10 group flex flex-col items-center text-center">
      {/* Trustee Photo or Avatar */}
      <div className="relative mb-6">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-[#B78A3B] shadow-lg shadow-[#173F35]/15 bg-[#173F35] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          {trustee.image && !imageError ? (
            <img
              src={trustee.image}
              alt={`${displayName} - ${displayRole}`}
              width={128}
              height={128}
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <span className="font-serif text-3xl text-[#D8B86A] font-medium tracking-wider">
              {initials}
            </span>
          )}
        </div>

        {/* Crown Badge */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#173F35] text-[#D8B86A] p-1.5 rounded-full border border-[#B78A3B]/40 shadow-sm">
          <Crown size={14} aria-hidden="true" />
        </div>
      </div>

      {/* Role badge */}
      <div className="mb-2 mt-1">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-[#B78A3B] font-sans bg-[#B78A3B]/10 px-3 py-1 rounded-full">
          {displayRole}
        </span>
      </div>

      {/* Name */}
      <h3 className="font-serif text-xl sm:text-2xl text-[#173F35] font-semibold mb-4 leading-snug">
        {displayName}
      </h3>

      {/* Phone numbers */}
      <div className="flex flex-col items-center gap-2 mt-auto w-full pt-4 border-t border-[#E8D7B5]/60">
        {trustee.phone.map((ph) => (
          <a
            key={ph}
            href={`tel:+91${ph.replace(/\s/g, '')}`}
            className="inline-flex items-center gap-2 text-sm text-[#77736A] hover:text-[#173F35] bg-[#F2EBDD]/60 hover:bg-[#F2EBDD] px-4 py-2 rounded-xl transition-all duration-200 font-sans font-medium w-full justify-center group/phone"
          >
            <Phone size={14} className="text-[#B78A3B] group-hover/phone:scale-110 transition-transform" aria-hidden="true" />
            <span>{ph}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

