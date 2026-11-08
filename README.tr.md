[English](README.md) | **Türkçe**

# Koyun & Kurt

Telefon için sakin bir mantık bulmacası: 6×6'lık merayı koyun ve kurtlarla doldur; aynı hayvan yan yana üç kez gelmesin, her satır ve sütunda 3 koyun ve 3 kurt olsun. Hepsi kontrol edilmiş 300 seviye, tamamen internetsiz.

**[App Store'dan indir](https://apps.apple.com/app/koyun-kurt-sheep-wolf/id6829908940)**

## Özellikler

- **300 sabit seviye:** 6 zorluk (En Kolay, Kolay, Orta, Zor, Çok Zor, İmkânsız), her birinde 50 seviye. Her bulmacanın tek bir çözümü var.
- **Zorluk başlangıç taşlarıyla:** En Kolay'da 36 hücrenin 24'ü dolu başlar, İmkânsız'da sadece 7'si.
- **İstediğin zorluktan başla:** her zorluğun ilk seviyesi açık; zorluğun içinde bir seviyeyi bitirince sonraki açılır. "Devam et" en son oynadığın zorluktan sürer, seviye seçme ekranında yıldızların görünür.
- **Her seviyenin bir süresi var:** her zorluğun sabit bir süresi var, En Kolay'da 30 saniyeden İmkânsız'da 7 dakikaya kadar. Süre dolarsa seviye kaybedilir ve yeniden denersin. Uygulama arka plandayken süre durur; süre sınırı Ayarlar'dan kapatılabilir.
- **Kaldığın yerden devam:** seviyeden çıksan da uygulamayı kapatsan da tahta, ipuçları ve süre döndüğünde seni bekler.
- **Hatanı duy:** yan yana üç koyun gelince meleme, üç kurt gelince uluma başlar ve sen düzeltene kadar susmaz. Ekrandaki mesaj neyin yanlış olduğunu söyler.
- **İpucu ve yıldızlar:** ipucu boş ya da yanlış bir hücreyi düzeltir. Daha az ipucu, daha çok yıldız demek; her gün 5 yeni ipucu gelir.
- **Saate göre gökyüzü:** sabah, öğle, akşam ve gece renkleri. Tahta ve taşlar hep aynı kalır.
- **Çizilmiş taşlar ve sesler:** yuvarlak koyun ile köşeli kurt sadece şekilden ayırt edilebilir. Bütün sesler projede sentezlendi.
- **Türkçe ve İngilizce**, ilk açılışta eğitim, ses, titreşim ve süre sınırı ayarları, sonucu görsel olarak paylaşma.
- **İnternetsiz ve gizli:** hesap yok, reklam yok, hiçbir veri telefondan çıkmaz.

## Ekran Görüntüleri

| Menü | Oyun | Seviyeler |
|---|---|---|
| ![Ana menü](docs/menu.png) | ![Hata olarak işaretlenmiş üç koyun](docs/game-error.png) | ![Gece seviye seçme ekranı](docs/levels-night.png) |

| Seviye tamamlandı | Eğitim | Türkçe, gece |
|---|---|---|
| ![Seviye tamamlandı kartı](docs/complete.png) | ![Eğitim adımı](docs/tutorial.png) | ![Gece Türkçe menü](docs/menu-tr-night.png) |

## Kullanılan Teknolojiler

- React Native, Expo ve Expo Router
- TypeScript
- Zustand ve AsyncStorage (ilerleme telefonda kalır)
- React Native Reanimated, react-native-svg, expo-audio, expo-haptics, expo-sharing
- tsx ile Node.js test aracı
- App Store derlemesi için EAS Build ve EAS Submit

## Kurulum ve Çalıştırma

### iPhone

**Koyun & Kurt**'u [App Store'dan](https://apps.apple.com/app/koyun-kurt-sheep-wolf/id6829908940) yükle. Ücretsiz; reklam ve uygulama içi satın alma yok.

### Kaynak koddan çalıştırma

Node.js 20 ya da üstü gerekir.

```bash
npm ci
npx expo start
```

Tarayıcıda web sürümünü açmak için `w` tuşuna bas. Telefonda Expo Go ile açmak için Expo Go sürümünün projenin Expo SDK sürümüyle aynı olması gerekir.

### Testler ve araçlar

```bash
npm test                    # seviye verisi, kilitler, kural motoru, süre sınırı ve kayıtlar
npm run lint
npm run generate-levels     # src/constants/levelData.ts dosyasını yeniden üretir (her seferinde aynı sonuç)
python scripts/make-sounds.py   # sesleri sentezler (numpy, scipy, ffmpeg)
python scripts/make-icons.py    # ikonları çizer (playwright, Edge)
```

### App Store derlemesi

```bash
npx eas-cli build -p ios --profile production --auto-submit
```

## Öğrendiklerim

- Tek çözümlü bulmaca üretmeyi öğrendim: önce geri izleme (backtracking) ile kurallara uyan dolu bir tahta kuruyorum, sonra hücreleri tek tek siliyorum; bulmacanın tek bir cevabı kalmayınca o hücreyi geri koyuyorum.
- Üretilen içeriği tekrarlanabilir yapmayı öğrendim: tohumlu bir rastgele sayı üreteci her seferinde aynı 300 seviyeyi yazıyor, testler de her birini kontrol ediyor.
- Oyun mantığını ekranlardan ayrı tuttum. Kural motoru düz TypeScript olduğu için telefona gerek kalmadan Node ile test edebiliyorum.
- Eskiyebilen durumu saklamamayı öğrendim: kırmızı hata işaretleri her hücrede tutuluyordu ve Sıfırla, başta verilen taşlar için bunları yeniden hesaplamayı unutuyordu. Artık tahtayı değiştiren her şey işaretleri yeniden hesaplayan tek bir fonksiyondan geçiyor; bir test de 300 seviyede 18.000 rastgele hamle oynayıp işaretlerin tahtayla hep aynı kaldığını kontrol ediyor.
- Yarım kalan seviyeyi güvenle kaydetmeyi öğrendim: oyuncu çıkınca ya da uygulama arka plana geçince tahta ve süre telefona yazılıyor; geri okunan her şey denetleniyor, bozuk ya da eski bir kayıt seviyeyi baştan açıyor.
- React Native'in AppState'iyle sayacı durdurmayı öğrendim; süre sadece oyun ekrandayken işliyor.
- Durumu Zustand ile yönetip AsyncStorage ile kaydettim; seviye biçimi değişince sürüm numarası ve geçiş (migration) ekledim.
- Expo Go sadece içinde gelen paketleri çalıştırıyor. Bu yüzden önce yerel Firebase'den JavaScript SDK'sına geçtim, sonra oyunu internetsiz tutmak için çevrimiçi özellikleri kaldırdım.
- Taşları SVG ile çizdim ve onları rengin değil şeklin ayırt etmesi için tasarladım.
- Hata sürdükçe sesi döngüde çaldırmayı ve sesleri kayıt yerine kendim sentezlemeyi öğrendim.
- Sistemdeki "hareketi azalt" ayarına uymayı ve her hücreyi ekran okuyucu için etiketlemeyi öğrendim.
- EAS Build ile Android APK'yı bulutta derledim.
- Windows'tan App Store'a çıktım: EAS ile bulutta iOS derlemesi, gizlilik bildirimi (privacy manifest) ve gizlilik politikası sayfası, istenen boyutlarda mağaza görselleri; App Review ek bilgi isteyince inceleme notları ve ekran kaydıyla ikinci gönderim.

## Lisans

[MIT](LICENSE)
