type Props = { size?: number; className?: string };

export function OnzeLogo({ size = 28, className = "" }: Props) {
  const id = `onze-logo-${size}`;
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="16" cy="16" r="14" stroke={`url(#${id}-a)`} strokeWidth="2" />
        <path
          d="M9 11h2v10H9zm5 0h2l3 6v-6h2v10h-2l-3-6v6h-2z"
          fill={`url(#${id}-a)`}
        />
        <defs>
          <linearGradient id={`${id}-a`} x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1B6B3A" />
            <stop offset="1" stopColor="#2A8F4F" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-xl font-medium tracking-tight">
        Onze
        <span className="ml-0.5 align-super text-[10px] text-onze-pitch-soft">.ai</span>
      </span>
    </span>
  );
}
