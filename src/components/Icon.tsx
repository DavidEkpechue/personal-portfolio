// One drawn icon set (1.5px stroke, round joins) instead of unicode arrows.
const paths = {
  external: 'M6 4h6v6M12 4 4.5 11.5',
  down: 'M8 3v10M4 9l4 4 4-4',
  up: 'M8 13V3M4 7l4-4 4 4',
  back: 'M13 8H3M7 4 3 8l4 4',
  forward: 'M3 8h10M9 4l4 4-4 4',
  plus: 'M8 3.5v9M3.5 8h9',
  minus: 'M3.5 8h9',
  fit: 'M3 6V3h3M10 3h3v3M13 10v3h-3M6 13H3v-3',
  close: 'M4 4l8 8M12 4l-8 8',
  compass: 'M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M8 5.5 9.2 8 8 10.5 6.8 8Z',
} as const

export type IconName = keyof typeof paths

export default function Icon({ name, size = 16, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>
}
