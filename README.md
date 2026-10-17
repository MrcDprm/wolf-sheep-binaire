**English** | [Türkçe](README.tr.md)

# Sheep & Wolf

A calm logic puzzle for your phone: fill a 6×6 pasture with sheep and wolves so that no three of the same animal stand side by side and every row and column holds 3 of each. 300 hand-checked levels, fully offline.

**[Download the APK](https://github.com/MrcDprm/wolf-sheep-binaire/releases/latest)** · Coming soon to App Store and Google Play

## Features

- **300 fixed levels** across 6 difficulties (Easiest, Easy, Medium, Hard, Very Hard, Impossible), 50 each. Every puzzle has exactly one solution.
- **Difficulty by starting pieces:** Easiest starts with 24 of 36 cells filled, Impossible with only 7.
- **Locked progression:** finishing a level unlocks the next one. A level picker shows your stars, and arrows on the game screen move between levels.
- **Hear your mistakes:** three sheep in a row start bleating and three wolves start howling, until you fix it. A clear message says what is wrong.
- **Hints and stars:** a hint fixes one empty or wrong cell. Fewer hints mean more stars; you get 5 new hints every day.
- **Sky that follows the clock:** morning, afternoon, evening and night colors. The board and pieces stay the same.
- **Drawn pieces and sounds:** the round sheep and the angular wolf can be told apart by shape alone. All sounds are synthesized in the project.
- **Turkish and English**, tutorial on first launch, sound and haptics settings, share your result as an image.
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
- EAS Build for the Android APK

## Installation

### Android

1. Download `koyun-kurt.apk` from the [latest release](https://github.com/MrcDprm/wolf-sheep-binaire/releases/latest).
2. Open it on your phone. If Android asks, allow installing apps from this source.
3. Open **Koyun & Kurt** from the home screen.

### Run from source

Requires Node.js 20 or newer and the Expo Go app on your phone.

```bash
npm ci
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iPhone). Press `w` to open the web version in a browser.

### Tests and tools

```bash
npm test                    # level data, unlocking and rule engine
npm run lint
npm run generate-levels     # rebuilds src/constants/levelData.ts (same result every time)
python scripts/make-sounds.py   # synthesizes the sounds (numpy, scipy, ffmpeg)
python scripts/make-icons.py    # renders the icons (playwright, Edge)
```

### Build the APK

```bash
npx eas-cli build -p android --profile apk
```

## What I Learned

- Generating puzzles with a single solution: I fill a valid board with backtracking, then remove cells one by one and put a cell back whenever the puzzle stops having exactly one answer.
- Making generated content reproducible: a seeded random number generator writes the same 300 levels every time, and tests check each one.
- Keeping the game logic out of the screens. The rule engine is plain TypeScript, so I can test it with Node without a phone.
- Managing state with Zustand and saving it with AsyncStorage, including a version number and a migration when the level format changed.
- Expo Go only runs packages that ship inside it, so I moved from native Firebase to the JavaScript SDK first, and later removed online features to keep the game offline.
- Drawing the pieces with SVG and designing them so shape, not color, tells them apart.
- Looping sounds while a mistake exists, and synthesizing the sounds myself instead of using recordings.
- Respecting the system "reduce motion" setting and labeling every cell for screen readers.
- Building an Android APK in the cloud with EAS Build.

## Future Plans

- Publishing on Google Play and the App Store.
- Optional cloud backup of progress.

## License

[MIT](LICENSE)
