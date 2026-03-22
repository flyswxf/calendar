type Props = {
  size?: number;
};

export default function CalendarIcon({ size = 18 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="17" rx="2" ry="2" />
      <line x1="16" y1="2.5" x2="16" y2="6" />
      <line x1="8" y1="2.5" x2="8" y2="6" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}
