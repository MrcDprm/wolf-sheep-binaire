import type { Title } from '../types/user';

/**
 * 20 aşamalı unvan sistemi
 * Toplam puana göre güncellenir. En yüksek puan 300 x 12 = 3600;
 * son unvan neredeyse bütün seviyeleri 3 yıldızla bitirmeyi ister.
 */
export const TITLES: Title[] = [
  { id: 1,  name: 'Lamb Apprentice',     nameTr: 'Kuzu Çırağı',               minPoints: 0,     icon: '🐑' },
  { id: 2,  name: 'Meadow Wanderer',     nameTr: 'Çayır Gezgini',             minPoints: 30,    icon: '🌿' },
  { id: 3,  name: 'Shepherd Novice',     nameTr: 'Çoban Acemi',               minPoints: 80,   icon: '🪄' },
  { id: 4,  name: 'Fence Builder',       nameTr: 'Çit Ustası',                minPoints: 150,   icon: '🪵' },
  { id: 5,  name: 'Alert Watcher',       nameTr: 'Uyanık Bekçi',              minPoints: 250,   icon: '👁️' },
  { id: 6,  name: 'Wolfprint Tracker',   nameTr: 'Kurt İzi Takipçisi',        minPoints: 380,   icon: '🐾' },
  { id: 7,  name: 'Woolkeeper',          nameTr: 'Yün Koruyucu',              minPoints: 540,  icon: '🧶' },
  { id: 8,  name: 'Pasture Guardian',    nameTr: 'Mera Muhafızı',             minPoints: 730,  icon: '🛡️' },
  { id: 9,  name: 'Logic Shepherd',      nameTr: 'Mantık Çobanı',             minPoints: 950,  icon: '🧩' },
  { id: 10, name: 'Wolf Whisperer',      nameTr: 'Kurt Fısıldayan',           minPoints: 1200,  icon: '🐺' },
  { id: 11, name: 'Grid Sage',           nameTr: 'Izgara Bilgesi',            minPoints: 1450,  icon: '📐' },
  { id: 12, name: 'Herd Commander',      nameTr: 'Sürü Komutanı',             minPoints: 1700,  icon: '⚔️' },
  { id: 13, name: 'Balance Keeper',      nameTr: 'Denge Bekçisi',             minPoints: 1950,  icon: '⚖️' },
  { id: 14, name: 'Pattern Weaver',      nameTr: 'Örüntü Dokuyucu',           minPoints: 2200,  icon: '🕸️' },
  { id: 15, name: 'Blind Wolf Tamer',    nameTr: 'Kör Kurt Evcilleştirici',   minPoints: 2450,  icon: '🙈' },
  { id: 16, name: 'Impossible Solver',   nameTr: 'İmkansız Çözücü',           minPoints: 2700,  icon: '💡' },
  { id: 17, name: 'Flock Architect',     nameTr: 'Sürü Mimarı',               minPoints: 2950, icon: '🏛️' },
  { id: 18, name: 'Grandmaster Shepherd',nameTr: 'Büyük Usta Çoban',          minPoints: 3150, icon: '👑' },
  { id: 19, name: 'Legend of the Grid',  nameTr: 'Izgaranın Efsanesi',        minPoints: 3350, icon: '⭐' },
  { id: 20, name: 'Master of Flocks and Claws', nameTr: 'Sürülerin ve Pençelerin Efendisi', minPoints: 3550, icon: '🏆' },
];

/**
 * Toplam puana göre kullanıcının sahip olması gereken unvanı döner.
 */
export function getTitleForPoints(totalPoints: number): string {
  let title = TITLES[0];
  for (const t of TITLES) {
    if (totalPoints >= t.minPoints) {
      title = t;
    } else {
      break;
    }
  }
  return title.nameTr;
}

export function getTitleObjectForPoints(totalPoints: number): Title {
  let title = TITLES[0];
  for (const t of TITLES) {
    if (totalPoints >= t.minPoints) {
      title = t;
    } else {
      break;
    }
  }
  return title;
}

export function getNextTitle(totalPoints: number): Title | null {
  for (const t of TITLES) {
    if (totalPoints < t.minPoints) return t;
  }
  return null;
}
