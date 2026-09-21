import { Clock, Bell, } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { poojaSchedule } from '../data/poojaSchedule.js';

export default function PoojaScheduleCard() {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language?.startsWith('ta');

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-[#E8D7B5] transition-all duration-300 hover:shadow-xl">
      {/* Header Banner - Matching the Reference Design with Premium Touch */}
      <div className="bg-gradient-to-r from-[#173F35] via-[#173F35] to-[#173F35] px-6 py-5 text-white flex items-center justify-center gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-inner">
          <Clock size={20} className="text-white" aria-hidden="true" />
        </div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-white drop-shadow-xs">
          {t('contactPage.poojaScheduleTitle', 'Pooja Schedule Time')}
        </h2>
      </div>

      {/* Timetable Rows with Alternating Striped Background */}
      <div className="divide-y divide-gray-100 font-sans">
        {poojaSchedule.map((item, index) => {
          const isEven = index % 2 === 1;
          const title = isTamil && item.titleTa ? item.titleTa : item.titleEn;

          return (
            <div
              key={item.id}
              className={`flex items-center justify-between px-5 sm:px-8 py-4 transition-colors ${
                isEven ? 'bg-[#F2F4F7]/70' : 'bg-white'
              } hover:bg-[#FAF7F0]`}
            >
              <div className="flex items-center gap-3 pr-4">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  item.highlight ? 'bg-[#FA5B3D]' : 'bg-[#B78A3B]/60'
                }`} />
                <span className="text-sm sm:text-base text-[#173F35] font-medium leading-snug">
                  {title}
                </span>
              </div>

              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold font-mono tracking-wider bg-white border border-[#E8D7B5]/80 text-[#173F35] shadow-2xs">
                  {item.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Devotional Note */}
      <div className="bg-[#FAF7F0] px-6 py-3.5 border-t border-[#E8D7B5]/70 flex items-center justify-between text-xs text-[#77736A] font-sans">
        <span className="flex items-center gap-1.5 text-[#B78A3B] font-medium">
          <Bell size={16} aria-hidden="true" />
          {t('contactPage.darshanOpen', 'Daily Darshan & Annadanam Open to All')}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-[#77736A]">
          {t('contactPage.timingsSubject', '* Timings are standard daily schedule')}
        </span>
      </div>
    </div>
  );
}
