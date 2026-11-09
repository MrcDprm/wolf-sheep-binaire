"""
Oyun seslerini sentezler (kayıt kullanılmaz).

Çalıştırma: python scripts/make-sounds.py  (numpy, scipy ve ffmpeg gerekir)

Sesler oyunun çizimi gibidir: yuvarlak, sıcak ve kısa. Gerçek meleme ya da uluma
değil, onların sevimli ve sade hâli. Hepsinde güçlü bir alt gövde ("tok" ses) var,
sert tizler kısılır, ses seviyeleri birbirine eşitlenir; hiçbiri döngüde çalmaz.

- sheep.mp3: zıplayan küçük "mee" (tahta dolu, yan yana üç koyun var)
- wolf.mp3: yükselip inen yavru "auu" (tahta dolu, yan yana üç kurt var)
- error.mp3: inen iki tok tahta notası (tahta dolu, üçlü yok ama satır/sütun dengesi bozuk)
- complete.mp3: sıcak marimba arpeji (seviye bitti)
- timeup.mp3: yavaşça inen iki yumuşak nota (süre doldu)
- hint.mp3: hafif bir parıltı (ipucu bir taş koydu)
"""
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

RATE = 44100
OUT = Path(__file__).resolve().parent.parent / "assets" / "sounds"
RNG = np.random.default_rng(20261109)  # gürültü kısımları her seferinde aynı çıksın


# ---------------------------------------------------------------------------
# Yardımcılar
# ---------------------------------------------------------------------------

def timeline(duration):
    return np.arange(int(duration * RATE)) / RATE


def smoothstep(x, start, end):
    """start'tan end'e yumuşak geçiş (0 → 1)."""
    k = np.clip((x - start) / (end - start), 0, 1)
    return k * k * (3 - 2 * k)


def fade(n, attack, release):
    """Tık sesi olmasın diye yumuşak giriş ve çıkış (saniye)."""
    env = np.ones(n)
    a = max(1, int(attack * RATE))
    r = max(1, int(release * RATE))
    env[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    env[n - r:] *= np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return env


def lowpass(x, cutoff):
    return sosfilt(butter(4, cutoff, btype="low", fs=RATE, output="sos"), x)


def band(x, center, width):
    lo, hi = max(40, center - width / 2), center + width / 2
    return sosfilt(butter(2, [lo, hi], btype="band", fs=RATE, output="sos"), x)


def phase_of(freq_curve):
    return 2 * np.pi * np.cumsum(freq_curve) / RATE


def voice_source(freq_curve, tilt):
    """Ses telleri gibi zengin kaynak: harmonikler yükseldikçe zayıflar (tilt büyüdükçe daha koyu)."""
    phase = phase_of(freq_curve)
    top = np.max(freq_curve)
    wave = np.zeros_like(freq_curve)
    k = 1
    while k * top < 8000:
        wave += np.sin(k * phase) / k ** tilt
        k += 1
    return wave, phase


def vowel(source, formants):
    """Sesli harf tınısı: (merkez, genişlik, kazanç) formantları."""
    return sum(gain * band(source, center, width) for center, width, gain in formants)


def mallet(freq, duration, decay, bright=0.22, pitch_drop=0.012):
    """Tahta tokmak notası (marimba gibi): güçlü temel ton, çabuk sönen 4. kısmi, kısa vuruş."""
    t = timeline(duration)
    f = freq * (1 + pitch_drop * np.exp(-t * 70))  # vuruş anında hafif perde düşüşü
    phase = phase_of(f)
    body = np.sin(phase) * np.exp(-t * decay)
    overtone = bright * np.sin(3.99 * phase) * np.exp(-t * decay * 4)
    knock = lowpass(RNG.standard_normal(len(t)), 1800) * 0.06 * np.exp(-t * 260)
    return (body + overtone + knock) * fade(len(t), 0.003, 0.05)


def bell(freq, duration, decay):
    """Küçük zil: temel ton + hafif 2,76 kat kısmi, iki eş titreşen ses (parıltı)."""
    t = timeline(duration)
    wave = np.sin(2 * np.pi * freq * t) + np.sin(2 * np.pi * (freq + 2.5) * t)
    wave += 0.18 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t * decay * 2)
    return wave * np.exp(-t * decay) * fade(len(t), 0.004, 0.08)


def place(parts, duration):
    """(başlangıç saniyesi, ses) parçalarını tek kanala dizer."""
    out = np.zeros(int(duration * RATE))
    for start, part in parts:
        i = int(start * RATE)
        end = min(len(out), i + len(part))
        out[i:end] += part[: end - i]
    return out


def normalize(x, rms_db, peak_db=-1.5):
    """Duyulan seviyeyi eşitler: sesli kısmın ortalama gücü rms_db, tepe en fazla peak_db."""
    active = x[np.abs(x) > np.max(np.abs(x)) * 0.05]
    rms = np.sqrt(np.mean(active ** 2))
    x = x * (10 ** (rms_db / 20) / rms)
    peak = np.max(np.abs(x))
    ceiling = 10 ** (peak_db / 20)
    return x * (ceiling / peak) if peak > ceiling else x


# ---------------------------------------------------------------------------
# Sesler
# ---------------------------------------------------------------------------

def sheep():
    """Zıplayan küçük "mee": kısa "m" mırıltısı, ardından titreyen "e"."""
    d = 0.5
    t = timeline(d)
    x = t / d
    pitch = 600 - 70 * x + 85 * np.exp(-(((x - 0.18) / 0.12) ** 2))
    pitch += 16 * np.sin(2 * np.pi * 11 * t) * smoothstep(x, 0.25, 0.45)  # meleme titremesi
    source, phase = voice_source(pitch, 1.35)
    nasal = lowpass(source, 900)
    e_vowel = vowel(source, [(480, 140, 1.0), (2050, 260, 0.42), (2850, 320, 0.12)])
    k = smoothstep(t, 0.025, 0.075)
    voiced = nasal * (1 - k) * 0.9 + e_vowel * k
    body = 0.32 * np.sin(phase)  # yuvarlak, tok gövde
    flutter = 1 - 0.28 * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * t)) * smoothstep(x, 0.25, 0.45)
    out = (voiced + body) * flutter * fade(len(t), 0.012, 0.17)
    return lowpass(out, 6000)


def wolf():
    """Yavru kurt "auu": yükselir, kısa bir titreşimle durur, hafifçe iner; "a"dan "u"ya kayar."""
    d = 0.8
    t = timeline(d)
    x = t / d
    pitch = 330 + 230 * (1 - np.exp(-x / 0.12)) - 90 * smoothstep(x, 0.6, 1.0)
    pitch += 11 * np.sin(2 * np.pi * 5.5 * t) * smoothstep(x, 0.3, 0.5)
    source, phase = voice_source(pitch, 1.75)
    a_vowel = vowel(source, [(760, 180, 1.0), (1150, 220, 0.5), (2500, 300, 0.08)])
    u_vowel = vowel(source, [(380, 120, 1.0), (820, 160, 0.35), (2400, 300, 0.05)])
    m = smoothstep(x, 0.15, 0.6)
    voiced = a_vowel * (1 - m) + u_vowel * m * 1.25
    breath = band(RNG.standard_normal(len(t)), 1300, 900) * 0.035 * smoothstep(x, 0.0, 0.2)
    body = 0.4 * np.sin(phase)
    out = (voiced + body + breath) * fade(len(t), 0.045, 0.22)
    return lowpass(out, 5000)


def error_notes():
    """İnen iki tok tahta notası (Mi → Do): uyarı ama korkutmayan."""
    notes = [(0.0, mallet(329.63, 0.22, 11, bright=0.1)), (0.12, mallet(261.63, 0.28, 10, bright=0.1))]
    return lowpass(place(notes, 0.42), 2600)


def complete():
    """Sıcak marimba arpeji Do-Mi-Sol-Do; son nota uzun kalır."""
    freqs = [523.25, 659.25, 783.99, 1046.5]
    parts = [(i * 0.09, mallet(f, 0.7, 6.5) * (1.0 - i * 0.08)) for i, f in enumerate(freqs[:3])]
    parts.append((0.27, mallet(freqs[3], 1.0, 3.6) * 0.85))
    parts.append((0.36, bell(2093.0, 0.6, 7) * 0.12))  # en sonda minik parıltı
    return place(parts, 1.3)


def timeup():
    """Yavaşça inen iki yumuşak nota (Sol → Re), ikincisi hafifçe aşağı süzülür."""
    second = mallet(293.66, 0.75, 3.8, bright=0.12, pitch_drop=0.03)
    t = timeline(0.75)
    second = second * (1 - 0.03 * smoothstep(t, 0.1, 0.7))  # "aww" gibi sönüş
    return lowpass(place([(0.0, mallet(392.0, 0.5, 5, bright=0.14)), (0.22, second)], 1.0), 3200)


def hint():
    """Hafif parıltı: iki yükselen küçük zil (Mi → Si)."""
    return place([(0.0, bell(1318.5, 0.35, 9)), (0.08, bell(1975.5, 0.4, 9) * 0.8)], 0.5)


def save(name, samples, rms_db):
    samples = normalize(samples, rms_db)
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "s.wav"
        wavfile.write(wav, RATE, (samples * 32767).astype(np.int16))
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
             "-ar", str(RATE), "-ac", "1", "-c:a", "libmp3lame", "-b:a", "128k", str(OUT / name)],
            check=True,
        )
    peak = 20 * np.log10(np.max(np.abs(samples)))
    print(f"{name:13} {len(samples) / RATE:.2f} sn, tepe {peak:.1f} dBFS")


if __name__ == "__main__":
    # Hedef seviyeler duyulan yükseklik (LUFS) eşit olacak şekilde ölçülerek seçildi;
    # ipucu parıltısı bilerek biraz daha kısık
    save("sheep.mp3", sheep(), -17)
    save("wolf.mp3", wolf(), -17)
    save("error.mp3", error_notes(), -16.5)
    save("complete.mp3", complete(), -16.5)
    save("timeup.mp3", timeup(), -17)
    save("hint.mp3", hint(), -21)
