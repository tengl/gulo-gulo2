const paths = {
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  close: "m6 6 12 12M6 18 18 6",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  check: "m5 12 4 4L19 6",
  bag: "M5 8h14l1 13H4L5 8Zm4 0V6a3 3 0 0 1 6 0v2",
  write: "m16 3 5 5-12 12-6 1 1-6L16 3Zm-9 11 3 3M13 6l5 5",
  menu: "M4 6h16M4 12h16M4 18h10",
  trash: "M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7",
} as const;

export function Icon({
  name,
  size = 20,
}: {
  name: keyof typeof paths;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
