# Koyun & Kurt — Binaire Bulmaca Oyunu

Takuzu/Binairo kurallarına dayanan, **Koyun 🐑** ve **Kurt 🐺** sembolleriyle temalandırılmış bir mantık bulmacası oyunu. React Native (Expo) ile geliştirilmiştir.

---

## Oyun Hakkında

Her satır ve sütunda eşit sayıda koyun ve kurt yerleştirmek zorundasın — ama üç ardışık aynı sembol koyamazsın. Kulağa basit geliyor, değil mi?

- **400 kampanya seviyesi** — 6×6'dan 12×12'ye kadar büyüyen ızgaralar
- **İmkansız Mod** — hata göstergesi kapalı, körlemesine oynarsın (premium)
- **Günlük bulmaca** — her sabah 10:00'da yeni bir bulmaca
- **Gün/gece döngüsü** — arayüz saate göre renk paletini değiştirir

---

## Kurulum

```bash
npm install
npx expo start
```

iOS simülatör, Android emülatör veya Expo Go ile çalıştırabilirsin.

### Native bağımlılıklar için

Firebase ve diğer native modüller için `google-services.json` (Android) ve `GoogleService-Info.plist` (iOS) dosyalarını ilgili klasörlere eklemeyi unutma.

---

## Proje Yapısı

```
app/                  Expo Router sayfaları
├── (game)/           Oyun rotaları (menü, seviye, günlük, imkansız)
├── leaderboard.tsx
├── settings.tsx
├── tutorial.tsx
└── share-result.tsx

src/
├── engine/           Oyun motoru (generator, validator, solver, precompute)
├── store/            Zustand store'ları (game, user, settings)
├── services/         Firebase, RevenueCat, AdMob
├── components/       UI bileşenleri (GameGrid, GridCell, LevelCompleteModal...)
├── hooks/            Custom hook'lar
├── constants/        Seviyeler, unvanlar, puan tabloları
├── i18n/             TR / EN çeviriler
└── utils/            Puan hesaplama, tarih, paylaşım
```

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | React Native + Expo (Bare uyumlu) |
| Navigasyon | Expo Router |
| State | Zustand + AsyncStorage |
| Backend | Firebase (Auth, Firestore) |
| Monetizasyon | RevenueCat + Google AdMob |
| Animasyon | React Native Reanimated 4 |
| Ses | expo-av |

---

## Oyun Kuralları

1. Yatay veya dikey olarak **yan yana en fazla 2** aynı sembol konulabilir.
2. Her satır ve sütun **tam olarak eşit sayıda** 🐑 Koyun ve 🐺 Kurt içermelidir.

Kural ihlalinde hücre kırmızıya döner, cihaz titrer ve bir hayvan sesi çalar. Hatayı düzelttikçe uyarılar anında kaybolur.

---

## Lisans

MIT
