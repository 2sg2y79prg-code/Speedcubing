const PATHS: Record<string, string> = {
  plus: 'M8 3v10M3 8h10',
  edit: 'M10.5 2.5l3 3L6 13H3v-3z',
  trash: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 8.5h5.6l.7-8.5',
  left: 'M10 3L5 8l5 5',
  right: 'M6 3l5 5-5 5',
  down: 'M3 6l5 5 5-5',
  timer: 'M8 5v3.5l2 1.5M6 1.5h4M8 15a6 6 0 100-12 6 6 0 000 12z',
  play: 'M5 3l8 5-8 5z',
  check: 'M3 8.5l3 3 7-7',
};

export function Icon({ name, size = 15 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}
