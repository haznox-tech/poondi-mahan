import Breadcrumbs from './Breadcrumbs.jsx';

export default function PageHero({ title, subtitle, breadcrumbs, bgImage }) {
  return (
    <section
      className="relative min-h-[360px] lg:min-h-[420px] flex items-end pb-12 pt-32 overflow-hidden"
      style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {/* Overlay */}
      <div className={bgImage 
        ? "absolute inset-0 bg-gradient-to-t from-[#0E2D27] via-[#0E2D27]/70 to-black/45" 
        : "absolute inset-0 bg-gradient-to-b from-[#0E2D27]/90 via-[#173F35]/80 to-[#173F35]/95"
      } />

      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #B78A3B 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 lg:px-10 w-full">
        {breadcrumbs && (
          <div className="mb-4">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-medium text-[#FAF7F0] leading-tight mb-3">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[#E8D7B5]/70 text-lg max-w-2xl font-sans">
            {subtitle}
          </p>
        )}
        <div className="h-px w-24 bg-[#B78A3B] mt-6" />
      </div>
    </section>
  );
}
