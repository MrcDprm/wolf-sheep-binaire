/**
 * İpucunun gerekçesini oyuncunun okuyacağı cümleye çevirir.
 * Örnek: "3. satırda iki kurt yan yana; yanlarına koyun gelmeli."
 */
import type { Hint } from '../engine/hint';

type Translate = (key: string, vars?: Record<string, string | number>) => string;

export function describeHint(hint: Hint, t: Translate): string {
  if (hint.kind === 'wrong') return t('hintReason.wrong');
  if (hint.kind === 'reveal') return t('hintReason.reveal');

  // Hücreye gelemeyen hayvan (gerekçedeki) ve konan hayvan; İngilizcede tekil/çoğul ayrı
  const banned = hint.value === 1 ? 2 : 1;
  const name = (v: 1 | 2, many: boolean) =>
    t(v === 1 ? (many ? 'hintReason.wolves' : 'hintReason.wolf') : many ? 'hintReason.sheepMany' : 'hintReason.sheep');
  const line = hint.line
    ? t(hint.line.axis === 'row' ? 'hintReason.row' : 'hintReason.col', { n: hint.line.index + 1 })
    : '';

  return t(`hintReason.${hint.kind}`, {
    line,
    animal: name(banned, false),
    animals: name(banned, true),
    other: name(hint.value, false),
    others: name(hint.value, true),
    value: name(hint.value, false),
  });
}
