interface ChainSVGProps {
  /** Number of horizontal links — controls total width */
  links?: number;
}

/**
 * SVG chain strip.
 * Horizontal and vertical ellipses are rendered in two passes so vertical
 * links sit visually in front of horizontal ones. A handful of links
 * carry a subtle purple-tinted stroke to suggest reflected light.
 */
export function ChainSVG({ links = 16 }: ChainSVGProps) {
  const SPACING = 18;
  const W = (links - 1) * SPACING + 18;
  const H = 24;

  const purpleH = new Set([2, 7, 11].filter(i => i < links));
  const purpleV = new Set([4, 9, 13].filter(i => i < links - 1));

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      aria-hidden="true"
    >
      {/* Pass 1: horizontal links — drawn first, sit behind vertical */}
      {Array.from({ length: links }, (_, i) => {
        const cx = i * SPACING + 9;
        const lit = purpleH.has(i);
        return (
          <ellipse
            key={`h${i}`}
            cx={cx} cy={12}
            rx={8.5} ry={4.2}
            stroke={lit ? '#4A2878' : '#1C1628'}
            strokeWidth="1.3"
            fill={lit ? '#140F20' : '#0C0A12'}
          />
        );
      })}
      {/* Pass 2: vertical links — interlocked between horizontal pairs */}
      {Array.from({ length: links - 1 }, (_, i) => {
        const cx = i * SPACING + 18;
        const lit = purpleV.has(i);
        return (
          <ellipse
            key={`v${i}`}
            cx={cx} cy={12}
            rx={4.2} ry={9}
            stroke={lit ? '#5A3490' : '#18142A'}
            strokeWidth="1.3"
            fill={lit ? '#110D1E' : '#0A0810'}
          />
        );
      })}
    </svg>
  );
}
