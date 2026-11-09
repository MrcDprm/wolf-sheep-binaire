[English](README.md) | **Türkçe**

# Koyun & Kurt

Telefon için sakin bir mantık bulmacası: 6×6'lık merayı koyun ve kurtlarla doldur; aynı hayvan yan yana üç kez gelmesin, her satır ve sütunda 3 koyun ve 3 kurt olsun. Hepsi kontrol edilmiş 300 seviye ve her gün yeni bir günün bulmacası, tamamen internetsiz.

**[App Store'dan indir](https://apps.apple.com/app/koyun-kurt-sheep-wolf/id6829908940)**

## Özellikler

- **300 sabit seviye:** 6 zorluk (En Kolay, Kolay, Orta, Zor, Çok Zor, İmkânsız), her birinde 50 seviye. Her bulmacanın tek bir çözümü var.
- **Zorluk başlangıç taşlarıyla:** En Kolay'da 36 hücrenin 24'ü dolu başlar, İmkânsız'da sadece 7'si.
- **İstediğin zorluktan başla:** her zorluğun ilk seviyesi açık; zorluğun içinde bir seviyeyi bitirince sonraki açılır. "Devam et" en son oynadığın zorluktan sürer, seviye seçme ekranında yıldızların görünür.
- **Günün bulmacası ve seri:** her gün yeni bir bulmaca; telefonda tarihten üretilir, sunucu olmadan herkes aynı bulmacayı alır. Hafta Pazartesi Kolay ile başlar, Pazar İmkânsız ile biter. Her gün çözerek serini büyüt; çözdüğün her gün seri takvimine bir koyun gelir.
- **İstatistikler:** süren ve en uzun seri, beş haftalık takvim, sonraki unvana ilerleme; her zorlukta bitirilen seviye, yıldız, en iyi ve ortalama süre.
- **Günlük hatırlatma (isteğe bağlı):** seçtiğin saatte, yalnızca günün bulmacasını henüz çözmediğin günlerde gelen yerel bildirim. İzin yalnızca açtığında istenir, hiçbir şey sunucudan geçmez.
- **Her seviyenin bir süresi var:** her zorluğun sabit bir süresi var, En Kolay'da 30 saniyeden İmkânsız'da 7 dakikaya kadar; En Kolay'ın ilk 5 seviyesi süresiz, yeni oyuncu önce kuralları öğrensin. Süre dolarsa seviye kaybedilir ve yeniden denersin. Süreye dokununca oyun durur; uygulama arka plana geçince de durur. Süre sınırı Ayarlar'dan kapatılabilir.
- **Nedenini söyleyen ipucu:** ipucu bir sonraki mantık adımını ve nedenini gösterir ("2. sütunda iki kurt yan yana; yanlarına koyun gelmeli"), gerekçe olan taşları vurgular; yanlış bir taş koyduysan önce onu kaldırır. 300 seviyenin hepsi yalnızca ipucuyla bitirilebilir. Daha az ipucu, daha çok yıldız demek; her gün 5 yeni ipucu gelir.
- **Geri al:** hamlelerini tek tek geri al, Sıfırla da dahil.
- **Hatalar tahta dolunca görünür:** kırmızı işaretler ve tek kısa ses ancak bütün hücreler dolunca gelir, rastgele dokunarak bulmaca çözülemez. Ekrandaki mesaj neyin yanlış olduğunu söyler.
- **En iyi süreler:** her seviye en hızlı süreni saklar, geçince "Yeni rekor!" görünür.
- **Kaldığın yerden devam:** seviyeden çıksan da uygulamayı kapatsan da tahta, ipuçları ve süre döndüğünde seni bekler.
- **Saate göre gökyüzü:** sabah, öğle, akşam ve gece renkleri. Tahta ve taşlar hep aynı kalır.
- **Çizilmiş taşlar ve sesler:** yuvarlak koyun ile köşeli kurt sadece şekilden ayırt edilebilir. Bütün sesler çizimlere uyacak şekilde projede sentezlendi.
- **Türkçe ve İngilizce**, ilk açılışta eğitim, ses, titreşim ve süre sınırı ayarları, sonucu (seviyeler ve günün bulmacası) görsel olarak paylaşma.
- **İnternetsiz ve gizli:** hesap yok, reklam yok, hiçbir veri telefondan çıkmaz.

## Ekran Görüntüleri

| Menü | Oyun | İstatistikler |
|---|---|---|
| ![Günün bulmacası kartıyla ana menü](docs/menu.png) | ![Bir sonraki adımı açıklayan ipucu](docs/game.png) | ![Seri takvimiyle istatistikler](docs/stats.png) |

| Günün bulmacası çözüldü | Seviyeler | Türkçe, gece |
|---|---|---|
| ![En uzun seriyle çözülen günün bulmacası](docs/daily.png) | ![Gece seviye seçme ekranı](docs/levels-night.png) | ![Gece Türkçe menü](docs/menu-tr-night.png) |

## Kullanılan Teknolojiler

- React Native, Expo ve Expo Router
- TypeScript
- Zustand ve AsyncStorage (ilerleme telefonda kalır)
- React Native Reanimated, react-native-svg, expo-audio, expo-haptics, expo-sharing
- Günlük hatırlatma için expo-notifications (yalnızca yerel bildirim, push yok)
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

Tarayıcıda web sürümünü açmak için `w` tuşuna bas. Telefonda Expo Go ile açmak için Expo Go sürümünün projenin Expo SDK sürümüyle aynı olması gerekir. Hatırlatmalar için gerçek bir derleme gerekir; bildirimler web'de ve Expo Go'da çalışmaz.

### Testler ve araçlar

```bash
npm test                    # seviyeler, kural motoru, ipucu, günün bulmacası, seri, istatistik, hatırlatma ve kayıtlar
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
- Sunucusuz günün bulmacası yapmayı öğrendim: tarih tohum oluyor, her telefon aynı bulmacayı üretiyor. Yalnızca ipucu motorunun cevap açmadan çözebildiği bulmacaları tutuyorum; her gün sadece mantıkla çözülebiliyor.
- Kendini açıklayan bir ipucu motoru yazdım: bir hücreyi kesinleştiren en basit kuralı arıyor (yan yana iki, iki taş arası boşluk, dolmuş satır), yoksa bütün bir satır ya da sütun üzerinden akıl yürütüyor. Bir test 300 seviyenin hepsini yalnızca ipucuyla çözüyor.
- Hataları ancak tahta dolunca göstermeyi öğrendim; oyun deneme yanılmayı değil akıl yürütmeyi ödüllendiriyor.
- Oyun mantığını ekranlardan ayrı tuttum. Kural motoru düz TypeScript olduğu için telefona gerek kalmadan Node ile test edebiliyorum; seviye ve günün bulmacası ekranları da tek bir oyun alanı bileşenini paylaşıyor.
- Eskiyebilen durumu saklamamayı öğrendim: kırmızı hata işaretleri her hücrede tutuluyordu ve Sıfırla, başta verilen taşlar için bunları yeniden hesaplamayı unutuyordu. Artık tahtayı değiştiren her şey işaretleri yeniden hesaplayan tek bir fonksiyondan geçiyor; bir test de 300 seviyede 18.000 rastgele hamle oynayıp işaretlerin tahtayla hep aynı kaldığını kontrol ediyor.
- Seriyi ve istatistikleri ayrı sayaçlar tutmadan kaydedilen sonuçlardan hesaplamayı öğrendim; sayılar kayıtla hiçbir zaman çelişemiyor.
- Yerel bildirimleri tekrarlayan tek bir bildirim yerine önümüzdeki 7 güne tek tek kurmayı öğrendim; bulmacası çözülen gün atlanabiliyor. İzni de oyuncu hatırlatmayı açtığı anda istiyorum.
- Yarım kalan seviyeyi güvenle kaydetmeyi öğrendim: oyuncu çıkınca ya da uygulama arka plana geçince tahta ve süre telefona yazılıyor; geri okunan her şey denetleniyor, bozuk ya da eski bir kayıt seviyeyi baştan açıyor.
- Kaydı bozuk dosyaya dayanıklı yapmayı öğrendim: zustand'ın JSON depolaması bozuk bir dosyayı yüklemeyi hiç bitirmiyordu; onu sardım, geri okunan her alanı oyuncunun ilerlemesini silmeden denetliyorum.
- React Native'in AppState'iyle oyunu duraklatmayı öğrendim; süre sadece oyun ekrandayken işliyor.
- Durumu Zustand ile yönetip AsyncStorage ile kaydettim; seviye biçimi değişince sürüm numarası ve geçiş (migration) ekledim.
- Expo Go sadece içinde gelen paketleri çalıştırıyor. Bu yüzden önce yerel Firebase'den JavaScript SDK'sına geçtim, sonra oyunu internetsiz tutmak için çevrimiçi özellikleri kaldırdım.
- Taşları SVG ile çizdim ve onları rengin değil şeklin ayırt etmesi için tasarladım.
- Sesleri kayıt yerine Python ile kendim sentezlemeyi, ses yüksekliklerini eşitlemeyi ve aynı anda tek kısa ses çalarak seslerin üst üste binmemesini öğrendim.
- Sistemdeki "hareketi azalt" ayarına uymayı ve her hücreyi ekran okuyucu için etiketlemeyi öğrendim.
- EAS Build ile Android APK'yı bulutta derledim.
- Windows'tan App Store'a çıktım: EAS ile bulutta iOS derlemesi, gizlilik bildirimi (privacy manifest) ve gizlilik politikası sayfası, istenen boyutlarda mağaza görselleri; App Review ek bilgi isteyince inceleme notları ve ekran kaydıyla ikinci gönderim.

## Lisans

[MIT](LICENSE)
