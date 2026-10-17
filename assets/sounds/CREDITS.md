# Sounds

All sounds are synthesized by [scripts/make-sounds.py](../../scripts/make-sounds.py); no recordings are used.

| File | Sound |
|---|---|
| `sheep.mp3` | Short trembling "baa" with a pause, loops while three sheep are side by side |
| `wolf.mp3` | Soft rising and falling howl with a pause, loops while three wolves are side by side |
| `complete.mp3` | C major chime when a level is solved |

To regenerate: `python scripts/make-sounds.py` (needs numpy, scipy and ffmpeg).
