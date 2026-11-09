/**
 * Küçük çizgi ikonlar
 *
 * Karakter yerine (✕, ‹, ↺) çizim kullanılır; her telefonda aynı görünür.
 * Çizimler 24x24'lük bir alanda, yuvarlak uçlu kalın çizgilerle tanımlıdır.
 */
import Svg, { Path } from 'react-native-svg';

export type IconName =
  | 'close'
  | 'back'
  | 'chevronLeft'
  | 'chevronRight'
  | 'reset'
  | 'hint'
  | 'lock'
  | 'star'
  | 'clock'
  | 'undo'
  | 'pause'
  | 'play'
  | 'flame'
  | 'check';

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
      {name === 'pause' && <Path d="M9 6 V18 M15 6 V18" {...stroke} />}
      {name === 'play' && <Path d="M8 5.5 L18 12 L8 18.5 Z" {...stroke} fill={color} />}
      {name === 'check' && <Path d="M5.5 12.5 L10 17 L18.5 7.5" {...stroke} />}
      {name === 'flame' && (
        <>
          <Path
            d="M13.2 2.4 C13.4 6 18.6 8.4 18.6 14.4 C18.6 18.6 15.7 21.6 12 21.6 C8.3 21.6 5.4 18.7 5.4 15.2 C5.4 12.6 6.6 10.4 7.6 7.6 C8.6 9.8 9.4 10.8 10.4 11.4 C10.4 7.8 11.2 4.8 13.2 2.4 Z"
            fill={color}
            stroke={color}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          {/* Açık renkli iç alev: damladan ayırır */}
          <Path
            d="M12 20.6 C10.3 20.6 9.2 19.4 9.2 17.8 C9.2 16.4 10.2 15.2 11.2 13.6 C11.6 14.8 12.2 15.4 13 15.8 C13.2 15 13.2 14.4 13 13.6 C14.2 14.8 14.8 16.2 14.8 17.8 C14.8 19.4 13.7 20.6 12 20.6 Z"
            fill="#FFFFFF"
            opacity={0.5}
          />
        </>
      )}
      {name === 'undo' && (
        <>
          <Path d="M8.5 5.5 L4 10 L8.5 14.5" {...stroke} />
          <Path d="M4 10 H14 A5 5 0 0 1 14 20 H9.5" {...stroke} />
        </>
      )}
      {name === 'clock' && (
        <>
          <Path d="M3.5 12 A8.5 8.5 0 1 1 20.5 12 A8.5 8.5 0 1 1 3.5 12 Z" {...stroke} />
          <Path d="M12 7.2 V12 L15.2 14" {...stroke} />
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
