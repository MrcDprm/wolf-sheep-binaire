/**
 * Küçük çizgi ikonlar
 *
 * Karakter yerine (✕, ‹, ↺) çizim kullanılır; her telefonda aynı görünür.
 * Çizimler 24x24'lük bir alanda, yuvarlak uçlu kalın çizgilerle tanımlıdır.
 */
import Svg, { Path } from 'react-native-svg';

export type IconName = 'close' | 'back' | 'chevronLeft' | 'chevronRight' | 'reset' | 'hint' | 'lock' | 'star';

interface IconProps {
  name: IconName;
  size?: number;
  color: string;
}

export function Icon({ name, size = 24, color }: IconProps) {
  const stroke = {
    stroke: color,
    strokeWidth: 2.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'close' && <Path d="M6 6 L18 18 M18 6 L6 18" {...stroke} />}
      {name === 'back' && <Path d="M15 5 L8 12 L15 19" {...stroke} />}
      {name === 'chevronLeft' && <Path d="M14.5 6 L8.5 12 L14.5 18" {...stroke} />}
      {name === 'chevronRight' && <Path d="M9.5 6 L15.5 12 L9.5 18" {...stroke} />}
      {name === 'reset' && (
        <>
          <Path d="M5 12 A7 7 0 1 0 7.5 6.6" {...stroke} />
          <Path d="M7.8 2.8 L7.5 6.6 L11.3 7" {...stroke} />
        </>
      )}
      {name === 'hint' && (
        <>
          <Path d="M9 17 h6 M10 20.5 h4" {...stroke} />
          <Path
            d="M8.2 14.2 A6 6 0 1 1 15.8 14.2 C15 15 15 15.6 15 17 H9 C9 15.6 9 15 8.2 14.2 Z"
            {...stroke}
          />
        </>
      )}
      {name === 'lock' && (
        <>
          <Path d="M8 10.5 V8 a4 4 0 0 1 8 0 V10.5" {...stroke} />
          <Path d="M6 10.5 h12 v9 h-12 Z" {...stroke} fill={color} />
        </>
      )}
      {name === 'star' && (
        <Path
          d="M12 3.2 L14.6 8.6 L20.5 9.3 L16.1 13.4 L17.3 19.3 L12 16.4 L6.7 19.3 L7.9 13.4 L3.5 9.3 L9.4 8.6 Z"
          fill={color}
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}
