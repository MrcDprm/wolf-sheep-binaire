# Sounds

All sounds are synthesized by [scripts/make-sounds.py](../../scripts/make-sounds.py); no recordings are used. They are short, round and soft like the drawn pieces, play once (never in a loop) and never overlap.

| File | Sound | When |
|---|---|---|
| `sheep.mp3` | Bouncy little "mee" | The board is full and three sheep stand side by side |
| `wolf.mp3` | Rising and falling pup "auu" | The board is full and three wolves stand side by side |
| `error.mp3` | Two falling wooden notes | The board is full, no triple, but a row or column is unbalanced |
| `complete.mp3` | Warm marimba arpeggio | A level is solved |
| `timeup.mp3` | Two slow falling notes | The time runs out |
| `hint.mp3` | Soft sparkle | A hint places a piece |

To regenerate: `python scripts/make-sounds.py` (needs numpy, scipy and ffmpeg). The script is seeded, so it writes the same files every time.
