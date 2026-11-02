/**
 * İlk açılış dili
 *
 * Cihazın tercih ettiği diller sırayla taranır; desteklenen ilk dil seçilir.
 * Hiçbiri desteklenmiyorsa İngilizce açılır.
 */
export type Language = 'tr' | 'en';

export function pickLanguage(languageCodes: (string | null | undefined)[]): Language {
  for (const code of languageCodes) {
    const lang = code?.toLowerCase();
    if (lang === 'tr' || lang === 'en') return lang;
  }
  return 'en';
}
