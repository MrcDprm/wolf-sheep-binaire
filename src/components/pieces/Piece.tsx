/**
 * Oyun taşları
 *
 * Koyun yuvarlak, kabarık bir yün bulutu; kurt köşeli, sivri kulaklı.
 * Şekilleri farklı olduğu için renk ayırt edemeyen oyuncu da ikisini karıştırmaz.
 * Çizimler 100x100'lük bir alanda tanımlıdır, `size` ile ölçeklenir.
 */
import { memo } from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { palette } from '../../theme';

export type PieceKind = 'sheep' | 'wolf';

interface PieceProps {
  kind: PieceKind;
  size: number;
}

// Yün bulutunu oluşturan yedi tutam (merkez x, y)
const WOOL_PUFFS: [number, number][] = [
  [50, 28],
  [74, 38],
  [78, 62],
  [60, 79],
  [36, 79],
  [20, 60],
  [25, 36],
];

function Sheep() {
  return (
    <>
      <G fill={palette.wool} stroke={palette.woolEdge} strokeWidth={3}>
        {WOOL_PUFFS.map(([cx, cy]) => (
          <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={17} />
        ))}
      </G>
      {/* Tutamların iç kenarlarını örten gövde */}
      <Circle cx={50} cy={55} r={30} fill={palette.wool} />
      {/* Kulaklar */}
      <Path d="M12 50 Q20 41 32 49 Q22 58 12 50 Z" fill={palette.woolFace} />
      <Path d="M88 50 Q80 41 68 49 Q78 58 88 50 Z" fill={palette.woolFace} />
      {/* Yüz, gözler, burun */}
      <Ellipse cx={50} cy={58} rx={19} ry={22} fill={palette.woolFace} />
      <Circle cx={43} cy={54} r={3.6} fill={palette.wool} />
      <Circle cx={57} cy={54} r={3.6} fill={palette.wool} />
      <Ellipse cx={50} cy={68} rx={5} ry={3} fill={palette.woolNose} />
    </>
  );
}

function Wolf() {
  return (
    <>
      {/* Baş ve sivri kulaklar */}
      <Path
        d="M14 10 L38 30 L62 30 L86 10 L84 52 L50 92 L16 52 Z"
        fill={palette.slate}
        stroke={palette.slateEdge}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {/* Kulak içleri */}
      <Path d="M22 22 L33 31 L24 40 Z M78 22 L67 31 L76 40 Z" fill={palette.slateDark} />
      {/* Açık renk namlu */}
      <Path d="M33 58 L50 50 L67 58 L50 88 Z" fill={palette.muzzle} />
      {/* Kehribar gözler */}
      <Path d="M30 46 L42 44 L38 50 Z" fill={palette.straw} />
      <Path d="M70 46 L58 44 L62 50 Z" fill={palette.straw} />
      {/* Burun */}
      <Path d="M44 64 L56 64 L50 71 Z" fill={palette.slateDark} />
    </>
  );
}

function PieceComponent({ kind, size }: PieceProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {kind === 'sheep' ? <Sheep /> : <Wolf />}
    </Svg>
  );
}

export const Piece = memo(PieceComponent);
