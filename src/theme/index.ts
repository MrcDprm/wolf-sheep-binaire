/**
 * Tema: mera paleti, yazı tipi ve ölçüler
 *
 * Tahta, taşlar ve düğmeler her saatte aynıdır; gün dilimine göre sadece
 * gökyüzü (arka plan), yazı ve yüzey renkleri değişir (bkz. constants/dayPhase.ts).
 */

export const palette = {
  // Keçe tahta
  felt: '#5E8C3A',
  feltEdge: '#4C7530',
  stitch: 'rgba(255,248,236,0.35)',
  slot: 'rgba(0,0,0,0.14)',
  slotGiven: 'rgba(0,0,0,0.26)',
  slotError: 'rgba(200,55,45,0.28)',

  // Koyun taşı
  wool: '#FFF8EC',
  woolEdge: '#E2D3B8',
  woolFace: '#3B3530',
  woolNose: '#5A524A',

  // Kurt taşı
  slate: '#4F5866',
  slateEdge: '#3A414C',
  slateDark: '#2F353F',
  muzzle: '#D5D9E0',

  // Saman: ana düğme, yıldız, kurt gözü
  straw: '#E8B23A',
  strawEdge: '#C48F1F',

  ink: '#2E2A24',
  error: '#C8372D',
  errorOnDark: '#FF8A7E',
} as const;

export const fonts = {
  medium: 'Baloo2_500Medium',
  semibold: 'Baloo2_600SemiBold',
  bold: 'Baloo2_700Bold',
  extrabold: 'Baloo2_800ExtraBold',
} as const;

/** Yazı boyutları (px) */
export const fontSize = {
  display: 44,
  title: 26,
  heading: 21,
  body: 17,
  small: 15,
  caption: 13,
} as const;

export const radius = {
  button: 22,
  board: 26,
  cell: 14,
  tile: 18,
} as const;

/** Dokunsal düğmelerin alt kenar yüksekliği (basınca bu kadar aşağı iner) */
export const EDGE = 5;
