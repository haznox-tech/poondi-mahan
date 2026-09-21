import { useState } from 'react';
import clsx from 'clsx';

const presets = [
  { label: '₹500', value: 500 },
  { label: '₹1,000', value: 1000 },
  { label: '₹2,500', value: 2500 },
];

export default function DonationAmount({ onSelect }) {
  const [selected, setSelected] = useState(1000);
  const [custom, setCustom] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const handlePreset = (val) => {
    setSelected(val);
    setIsCustom(false);
    setCustom('');
    onSelect?.(val);
  };

  const handleCustom = (e) => {
    const v = e.target.value.replace(/\D/g, '');
    setCustom(v);
    setIsCustom(true);
    setSelected(null);
    onSelect?.(Number(v) || 0);
  };

  return (
    <div>
      <p className="text-xs font-semibold tracking-widest uppercase text-[#77736A] mb-4 font-sans">
        Select Amount
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {presets.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => handlePreset(p.value)}
            aria-pressed={!isCustom && selected === p.value}
            className={clsx(
              'py-3 px-4 rounded border font-sans font-semibold text-sm transition-all duration-200',
              !isCustom && selected === p.value
                ? 'bg-[#173F35] border-[#173F35] text-[#FAF7F0]'
                : 'bg-transparent border-[#E8D7B5] text-[#77736A] hover:border-[#B78A3B] hover:text-[#B78A3B]'
            )}
          >
            {p.label}
          </button>
        ))}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77736A] font-sans text-sm">₹</span>
          <input
            type="text"
            inputMode="numeric"
            value={custom}
            onChange={handleCustom}
            placeholder="Custom"
            aria-label="Enter custom donation amount in Rupees"
            className={clsx(
              'w-full py-3 pl-7 pr-4 rounded border font-sans text-sm outline-none transition-all duration-200',
              isCustom
                ? 'bg-transparent border-[#173F35] text-[#173F35]'
                : 'bg-transparent border-[#E8D7B5] text-[#77736A] focus:border-[#B78A3B]'
            )}
          />
        </div>
      </div>
      <p className="text-xs text-[#77736A] font-sans">
        Selected:{' '}
        <span className="font-semibold text-[#173F35]">
          ₹{(isCustom ? Number(custom) : selected || 0).toLocaleString('en-IN')}
        </span>
      </p>
    </div>
  );
}
