import { cn } from '@/lib/utils'

interface PFIconProps {
  className?: string
  size?: number
}

export function PFIcon({ className, size = 24 }: PFIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-current', className)}
    >
      {/* Building body */}
      <path
        d="M4 21V8l8-5 8 5v13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Floor line */}
      <path
        d="M2 21h20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Window left */}
      <rect
        x="8"
        y="11"
        width="3"
        height="3"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Window right */}
      <rect
        x="13"
        y="11"
        width="3"
        height="3"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Door */}
      <path
        d="M10 21v-4.5a2 2 0 0 1 4 0V21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
