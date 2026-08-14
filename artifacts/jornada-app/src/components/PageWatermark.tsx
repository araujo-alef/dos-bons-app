import type { WatermarkIdentity } from '@/lib/watermark';

interface PageWatermarkProps {
  identity: WatermarkIdentity;
}

/**
 * Repeating diagonal watermark overlay.
 * Always present on every book page — appears in screenshots for identification.
 * pointer-events: none so it never interferes with navigation or interactive elements.
 */

// Fixed positions (top/left %) — slightly staggered, not a perfect grid.
const POSITIONS: { top: string; left: string }[] = [
  { top:  '6%', left:  '4%'  },
  { top:  '6%', left:  '54%' },
  { top: '23%', left:  '21%' },
  { top: '40%', left:  '2%'  },
  { top: '40%', left:  '51%' },
  { top: '57%', left:  '17%' },
  { top: '74%', left:  '5%'  },
  { top: '74%', left:  '54%' },
];

export function PageWatermark({ identity }: PageWatermarkProps) {
  const label = `${identity.name} · ${identity.email}`;

  return (
    <div
      aria-hidden="true"
      style={{
        position:      'absolute',
        inset:         0,
        overflow:      'hidden',
        pointerEvents: 'none',
        zIndex:        10,
        userSelect:    'none',
      }}
    >
      {POSITIONS.map((pos, i) => (
        <span
          key={i}
          style={{
            position:      'absolute',
            top:           pos.top,
            left:          pos.left,
            transform:     'rotate(-25deg)',
            transformOrigin: 'top left',
            fontSize:      '9px',
            fontFamily:    'monospace',
            fontWeight:    500,
            letterSpacing: '0.06em',
            whiteSpace:    'nowrap',
            color:         'rgba(40,20,8,0.055)',
            userSelect:    'none',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            WebkitUserSelect: 'none' as any,
          }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
