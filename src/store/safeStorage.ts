/**
 * Bozuk kayda dayanıklı JSON depolama (zustand persist için)
 *
 * zustand'ın createJSONStorage'ı, telefondaki kayıt bozuksa (ör. yarım yazılmış JSON)
 * okurken hata fırlatır; zustand o zaman yüklemeyi hiç bitirmez ve yüklemeyi bekleyen
 * ekran hiç açılmaz. Burada okuma hatası "kayıt yok" sayılır, uygulama varsayılan
 * durumla açılır ve ilk yazmada kayıt düzelir.
 */
import type { PersistStorage, StateStorage, StorageValue } from 'zustand/middleware';

export function safeJSONStorage<S>(getStorage: () => StateStorage): PersistStorage<S> {
  return {
    getItem: async (name) => {
      try {
        const raw = await getStorage().getItem(name);
        return raw === null ? null : (JSON.parse(raw) as StorageValue<S>);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => getStorage().setItem(name, JSON.stringify(value)),
    removeItem: (name) => getStorage().removeItem(name),
  };
}
