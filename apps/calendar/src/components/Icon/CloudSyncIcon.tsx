type Props = {
  size?: number;
};

export default function CloudSyncIcon({ size = 18 }: Props) {
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
      <path d="M6.5 18a4.5 4.5 0 1 1 .9-8.91 6 6 0 0 1 11.1 2.23A3.5 3.5 0 1 1 18 18H6.5Z" />
      <path d="M9.5 14.2l2 2 3-3" />
    </svg>
  );
}
