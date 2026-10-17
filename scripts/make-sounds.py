"""
Oyun seslerini sentezler (kayıt kullanılmaz).

Çalıştırma: python scripts/make-sounds.py  (numpy, scipy ve ffmpeg gerekir)

- sheep.mp3: kısa, titreyen "meee" (döngüde aralıklı çalar)
- wolf.mp3: yükselip alçalan yumuşak "auuu" (döngüde aralıklı çalar)
- complete.mp3: Do-Mi-Sol-Do zil akoru
"""
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

RATE = 44100
OUT = Path(__file__).resolve().parent.parent / "assets" / "sounds"


def envelope(n, attack, release):
    """Yumuşak giriş ve çıkış (saniye)."""
    env = np.ones(n)
    a = int(attack * RATE)
    r = int(release * RATE)
    env[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    env[n - r:] = np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return env


def formant(signal, center, width, gain):
    """Sesli harf tınısı için bant geçiren filtre."""
    sos = butter(2, [center - width / 2, center + width / 2], btype="band", fs=RATE, output="sos")
    return sosfilt(sos, signal) * gain


def harmonics(freq_curve, count, rolloff):
    """Değişen frekansta, üst harmonikleri azalan dalga."""
    phase = 2 * np.pi * np.cumsum(freq_curve) / RATE
    wave = np.zeros_like(freq_curve)
    for k in range(1, count + 1):
        wave += np.sin(k * phase) / (k ** rolloff)
    return wave


def sheep(duration=0.85, gap=0.75):
    n = int(duration * RATE)
    t = np.arange(n) / RATE
    # Hafifçe düşen perde + koyuna özgü hızlı titreme
    pitch = 420 - 60 * (t / duration) + 14 * np.sin(2 * np.pi * 9 * t)
    raw = harmonics(pitch, 14, 1.1)
    tremolo = 0.72 + 0.28 * np.sin(2 * np.pi * 9 * t)
    # "e" sesli harfi: F1 ~ 550 Hz, F2 ~ 1900 Hz
    voiced = formant(raw, 550, 260, 1.0) + formant(raw, 1900, 500, 0.55) + formant(raw, 2700, 600, 0.2)
    sound = voiced * tremolo * envelope(n, 0.05, 0.25)
    return np.concatenate([sound, np.zeros(int(gap * RATE))])


def wolf(duration=1.7, gap=0.8):
    n = int(duration * RATE)
    t = np.arange(n) / RATE
    x = t / duration
    # Yükselip alçalan uluma eğrisi + yavaş titreşim
    pitch = 330 + 260 * np.sin(np.pi * np.clip(x * 1.15, 0, 1)) ** 1.5 - 60 * x
    pitch += 6 * np.sin(2 * np.pi * 5 * t) * np.clip(x * 3, 0, 1)
    raw = harmonics(pitch, 6, 2.2)
    # "u" sesli harfi: koyu tını
    voiced = formant(raw, 380, 300, 1.0) + formant(raw, 850, 300, 0.25) + raw * 0.15
    sound = voiced * envelope(n, 0.25, 0.55)
    return np.concatenate([sound, np.zeros(int(gap * RATE))])


def chime(duration=1.9):
    n = int(duration * RATE)
    t = np.arange(n) / RATE
    out = np.zeros(n)
    for i, f in enumerate([523.25, 659.25, 783.99, 1046.5]):
        start = int(i * 0.11 * RATE)
        tt = t[: n - start]
        note = (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * 2.6)
        out[start:] += note * (0.5 - i * 0.05)
    return out * envelope(n, 0.005, 0.4)


def save(name, samples, loudness):
    samples = samples / np.max(np.abs(samples)) * 0.9
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "s.wav"
        wavfile.write(wav, RATE, (samples * 32767).astype(np.int16))
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
             "-af", f"loudnorm=I={loudness}:TP=-3:LRA=7", "-ar", str(RATE), "-ac", "1",
             "-c:a", "libmp3lame", "-b:a", "128k", str(OUT / name)],
            check=True,
        )
    print(name)


save("sheep.mp3", sheep(), -22)
save("wolf.mp3", wolf(), -22)
save("complete.mp3", chime(), -20)
