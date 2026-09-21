import clsx from 'clsx';

export default function SectionHeading({
  overline,
  heading,
  subheading,
  align = 'left',
  light = false,
  className,
}) {
  return (
    <div className={clsx('mb-0', align === 'center' && 'text-center', className)}>
      {overline && (
        <p
          className={clsx(
            'text-xs font-semibold tracking-widest uppercase mb-3 font-sans',
            light ? 'text-[#D8B86A]' : 'text-[#B78A3B]'
          )}
        >
          {overline}
        </p>
      )}
      <h2
        className={clsx(
          'font-serif font-medium leading-tight mb-4',
          'text-2xl sm:text-4xl lg:text-5xl',
          light ? 'text-[#FAF7F0]' : 'text-[#173F35]'
        )}
      >
        {heading}
      </h2>
      {/* Gold accent line */}
      <div
        className={clsx(
          'h-0.5 w-16 bg-[#B78A3B] mb-5',
          align === 'center' && 'mx-auto'
        )}
      />
      {subheading && (
        <p
          className={clsx(
            'text-base leading-relaxed max-w-2xl font-sans',
            light ? 'text-[#E8D7B5]/80' : 'text-[#77736A]',
            align === 'center' && 'mx-auto'
          )}
        >
          {subheading}
        </p>
      )}
    </div>
  );
}
