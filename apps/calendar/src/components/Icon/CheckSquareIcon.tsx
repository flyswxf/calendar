type Props = {
  size?: number;
};

export default function CheckSquareIcon({ size = 18 }: Props) {
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
      <polyline points="9 11 11 13 15 9" />
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}
