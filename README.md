**English** | [Türkçe](README.tr.md)

# Sheep & Wolf

A calm logic puzzle for your phone: fill a 6×6 pasture with sheep and wolves so that no three of the same animal stand side by side and every row and column holds 3 of each. 300 hand-checked levels, fully offline.

**[Download on the App Store](https://apps.apple.com/app/koyun-kurt-sheep-wolf/id6829908940)**

## Features

- **300 fixed levels** across 6 difficulties (Easiest, Easy, Medium, Hard, Very Hard, Impossible), 50 each. Every puzzle has exactly one solution.
- **Difficulty by starting pieces:** Easiest starts with 24 of 36 cells filled, Impossible with only 7.
- **Start at any difficulty:** the first level of every difficulty is open; inside a difficulty, finishing a level unlocks the next one. Continue picks up the difficulty you played last, and the level picker shows your stars.
- **A clock for every level:** each difficulty has a fixed time limit, from 30 seconds on Easiest to 7 minutes on Impossible. If it runs out, the level is lost and you try again. The clock pauses while the app is in the background, and the limit can be turned off in Settings.
- **Pick up where you left off:** leave a level or close the app, and the board, the hints and the clock are waiting when you come back.
- **Hear your mistakes:** three sheep in a row start bleating and three wolves start howling, until you fix it. A clear message says what is wrong.
- **Hints and stars:** a hint fixes one empty or wrong cell. Fewer hints mean more stars; you get 5 new hints every day.
- **Sky that follows the clock:** morning, afternoon, evening and night colors. The board and pieces stay the same.
- **Drawn pieces and sounds:** the round sheep and the angular wolf can be told apart by shape alone. All sounds are synthesized in the project.
- **Turkish and English**, tutorial on first launch, sound, haptics and time limit settings, share your result as an image.
- **Offline and private:** no account, no ads, no data leaves the phone.

## Screenshots

| Menu | Game | Levels |
|---|---|---|
| ![Main menu](docs/menu.png) | ![A sheep triple marked as an error](docs/game-error.png) | ![Level picker at night](docs/levels-night.png) |

| Level complete | Tutorial | Turkish, night |
|---|---|---|
| ![Level complete card](docs/complete.png) | ![Tutorial step](docs/tutorial.png) | ![Turkish menu at night](docs/menu-tr-night.png) |

## Tech Stack

- React Native, Expo and Expo Router
- TypeScript
- Zustand with AsyncStorage (progress stays on the device)
- React Native Reanimated, react-native-svg, expo-audio, expo-haptics, expo-sharing
- Node.js test runner with tsx
- EAS Build and EAS Submit for the App Store build

## Installation

### iPhone

Install **Koyun & Kurt** from the [App Store](https://apps.apple.com/app/koyun-kurt-sheep-wolf/id6829908940). It is free, with no ads and no in-app purchases.

### Run from source

Requires Node.js 20 or newer.

```bash
npm ci
npx expo start
```

Press `w` to open the web version in a browser. To run it on a phone with Expo Go, the Expo Go version has to match the project's Expo SDK.

### Tests and tools

```bash
npm test                    # level data, unlocking, rule engine, time limit and saved games
npm run lint
npm run generate-levels     # rebuilds src/constants/levelData.ts (same result every time)
python scripts/make-sounds.py   # synthesizes the sounds (numpy, scipy, ffmpeg)
python scripts/make-icons.py    # renders the icons (playwright, Edge)
```

### Build for the App Store

```bash
npx eas-cli build -p ios --profile production --auto-submit
```

## What I Learned

- Generating puzzles with a single solution: I fill a valid board with backtracking, then remove cells one by one and put a cell back whenever the puzzle stops having exactly one answer.
- Making generated content reproducible: a seeded random number generator writes the same 300 levels every time, and tests check each one.
- Keeping the game logic out of the screens. The rule engine is plain TypeScript, so I can test it with Node without a phone.
- Not storing state that can go stale: the red error marks lived on each cell, and Reset forgot to recompute them for the given pieces. Now every board change goes through one function that recomputes them, and a test plays 18,000 random moves across all 300 levels to check that the marks always match the board.
- Saving an unfinished level safely: the board and the clock are written to the phone when the player leaves or the app goes to the background, and everything read back is validated, so a broken or outdated save simply starts the level fresh.
- Pausing a timer with React Native's AppState, so time only runs while the game is on screen.
- Managing state with Zustand and saving it with AsyncStorage, including a version number and a migration when the level format changed.
- Expo Go only runs packages that ship inside it, so I moved from native Firebase to the JavaScript SDK first, and later removed online features to keep the game offline.
- Drawing the pieces with SVG and designing them so shape, not color, tells them apart.
- Looping sounds while a mistake exists, and synthesizing the sounds myself instead of using recordings.
- Respecting the system "reduce motion" setting and labeling every cell for screen readers.
- Building an Android APK in the cloud with EAS Build.
- Shipping to the App Store from Windows: cloud iOS builds with EAS, a privacy manifest and privacy policy page, store screenshots in the required sizes, and a second submission with review notes and a screen recording after App Review asked for more information.

## License

[MIT](LICENSE)
