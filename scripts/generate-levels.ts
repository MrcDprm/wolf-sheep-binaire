/// <reference types="node" />
/**
 * 300 seviyeyi üretip src/constants/levelData.ts dosyasına yazar.
 *
 * Çalıştırma: npm run generate-levels
 *
 * Tohum sabit olduğu için her çalıştırmada aynı dosya çıkar. Her bulmacanın
 * çözümü diğerlerinden farklıdır ve tek çözümlüdür.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRng } from '../src/engine/random';
import { generateSolution, carvePuzzle } from '../src/engine/generator';
import { DIFFICULTIES, GRID_SIZE, LEVELS_PER_DIFFICULTY, cluesFor } from '../src/constants/difficulties';
import type { RawGrid } from '../src/types/game';

const SEED = 20261017;
const rng = createRng(SEED);
const toText = (raw: RawGrid) => raw.flat().join('');

const usedSolutions = new Set<string>();
const lines: string[] = [];

for (const config of DIFFICULTIES) {
  lines.push(`  // ${config.id}`);
  for (let i = 0; i < LEVELS_PER_DIFFICULTY; i++) {
    const clues = cluesFor(config, i);
    let entry: [string, string] | null = null;

    while (!entry) {
      const solution = generateSolution(GRID_SIZE, rng);
      const key = toText(solution);
      if (usedSolutions.has(key)) continue;
      const puzzle = carvePuzzle(solution, clues, rng);
      if (!puzzle) continue;
      usedSolutions.add(key);
      entry = [toText(puzzle), key];
    }

    lines.push(`  ['${entry[0]}', '${entry[1]}'],`);
  }
}

const out = `/**
 * Seviye verisi — elle düzenlemeyin, scripts/generate-levels.ts ile üretilir.
 *
 * Her satır: [başlangıç tahtası, çözüm], 6x6 = 36 karakter, satır satır.
 * 0 = boş, 1 = kurt, 2 = koyun.
 */
export const LEVEL_DATA: readonly (readonly [string, string])[] = [
${lines.join('\n')}
];
`;

writeFileSync(join(__dirname, '..', 'src', 'constants', 'levelData.ts'), out);
console.log(`${usedSolutions.size} seviye yazıldı`);
