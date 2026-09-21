import clsx from 'clsx';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  as: Tag = 'button',
  className,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-sans font-semibold tracking-wide transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B78A3B] focus-visible:outline-offset-3 rounded';

  const variants = {
    primary:
      'bg-[#173F35] text-[#FAF7F0] border border-[#173F35] hover:bg-[#0E2D27] hover:border-[#0E2D27] active:scale-[0.98]',
    gold:
      'bg-[#B78A3B] text-[#FAF7F0] border border-[#B78A3B] hover:bg-[#D8B86A] hover:border-[#D8B86A] active:scale-[0.98]',
    outline:
      'bg-transparent text-[#FAF7F0] border border-[#FAF7F0]/60 hover:border-[#B78A3B] hover:text-[#B78A3B] active:scale-[0.98]',
    'outline-dark':
      'bg-transparent text-[#173F35] border border-[#B78A3B] hover:bg-[#B78A3B] hover:text-[#FAF7F0] active:scale-[0.98]',
    ghost:
      'bg-transparent text-[#B78A3B] underline-offset-4 hover:underline active:scale-[0.98]',
  };

  const sizes = {
    sm: 'text-xs px-4 py-2',
    md: 'text-sm px-4 py-3',
    lg: 'text-base px-8 py-4',
  };

  return (
    <Tag className={clsx(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Tag>
  );
}
