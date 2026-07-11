interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const sizeMap = {
  xs: { img: 'h-8 w-8', text: 'text-[10px] sm:text-[11px]' },
  sm: { img: 'h-11 w-11', text: 'text-[11px] sm:text-xs md:text-sm' },
  md: { img: 'h-14 w-14', text: 'text-sm md:text-base' },
  lg: { img: 'h-20 w-20', text: 'text-lg md:text-xl' },
} as const;

export default function Logo({
  size = 'sm',
  showText = true,
  className = '',
  textClassName = '',
}: LogoProps) {
  const sizes = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      <img
        src="/logo.png"
        alt="Namdev Global Community"
        className={`${sizes.img} object-contain shrink-0`}
      />
      {showText && (
        <span
          className={`font-sans font-bold text-slate-900 tracking-tight leading-tight truncate ${sizes.text} ${textClassName}`}
        >
          Namdev Global Community
        </span>
      )}
    </div>
  );
}
