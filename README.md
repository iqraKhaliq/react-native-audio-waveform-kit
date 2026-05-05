# 🎙️ React Native Audio Waveform Kit

WhatsApp‑style voice recording and playback waveforms for React Native.

[![npm version](https://badge.fury.io/js/react-native-audio-waveform-kit.svg)](https://www.npmjs.com/package/react-native-audio-waveform-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎤 **Hold‑to‑record** with live waveform visualisation
- ▶️ **Playback** with scrubbing, speed control (1x/1.5x/2x)
- 🎨 **Themable** – sent/received bubble colours, progress fill, scrubber dot
- 📊 **Waveform** – constant 40 bars with peak‑preserving downsampling
- 🧹 **No auto‑replay** – prevents accidental replay of short audio
- 🖼️ **Customisable icons** – use your own play/pause/record buttons
- 🔧 **Built with TypeScript** – type definitions included

## Installation

```bash
npm install react-native-audio-waveform-kit
```

**Peer dependencies** (must be installed in your app):

```bash
npm install react-native-audio-api react-native-sound react-native-gesture-handler react-native-svg
```

### iOS (extra step)

```bash
cd ios && pod install && cd ..
```

### Android permissions

Add the following line to `android/app/src/main/AndroidManifest.xml` inside the `<manifest>` tag:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### iOS microphone usage description

Add this to `ios/YourApp/Info.plist` inside the `<dict>` tag:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access to record voice messages</string>
```

## Quick Start Example

```tsx
import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  RecordingWaveform,
  PlayerWaveform,
  PlayerRef,
} from 'react-native-audio-waveform-kit';

export default function App() {
  const playerRef = useRef<PlayerRef>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [bars, setBars] = useState<number[]>([]);

  const handleStop = (output: any) => {
    setUri(output.uri);
    setBars(output.amplitudes);
  };

  return (
    <View style={styles.container}>
      <RecordingWaveform onStop={handleStop} />
      {uri && <PlayerWaveform ref={playerRef} uri={uri} bars={bars} sent />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
});
```

## Component APIs

### `RecordingWaveform`

| Prop                   | Type                                                  | Default   | Description                                                                 |
| ---------------------- | ----------------------------------------------------- | --------- | --------------------------------------------------------------------------- |
| `onStop`               | `(output: any) => void`                               | –         | Called when recording stops. Returns `{ uri, duration, size, amplitudes }`. |
| `style`                | `ViewStyle`                                           | –         | Style for the outer container                                               |
| `waveformStyle`        | `ViewStyle`                                           | –         | Style for the waveform SVG wrapper                                          |
| `buttonStyle`          | `ViewStyle`                                           | –         | Style for the record button                                                 |
| `iconStyle`            | `ImageStyle`                                          | –         | Style for the icon image                                                    |
| `recordingIconTint`    | `string`                                              | `#ff3b30` | Tint color for the recording icon                                           |
| `recordIconTint`       | `string`                                              | `#34c759` | Tint color for the idle (record) icon                                       |
| `recordingFillColor`   | `string`                                              | `#ff3b30` | Waveform bar colour while recording                                         |
| `idleFillColor`        | `string`                                              | `#ccc`    | Waveform bar colour when idle                                               |
| `recordingBorderColor` | `string`                                              | `#ff3b30` | Button border colour while recording                                        |
| `idleBorderColor`      | `string`                                              | `#34c759` | Button border colour when idle                                              |
| `renderIcon`           | `(isRecording: boolean) => ReactNode`                 | –         | Custom icon renderer                                                        |
| `renderWaveform`       | `(bars: number[], isRecording: boolean) => ReactNode` | –         | Custom waveform renderer                                                    |

**Ref methods** – `start()` and `stop()`.

---

### `PlayerWaveform`

| Prop                                                  | Type                                             | Default      | Description                                                 |
| ----------------------------------------------------- | ------------------------------------------------ | ------------ | ----------------------------------------------------------- |
| `uri`                                                 | `string`                                         | **required** | Path to the audio file (e.g., from `RecordingWaveform`)     |
| `bars`                                                | `number[]`                                       | optional     | Raw amplitudes (auto‑generated if not provided)             |
| `onProgress`                                          | `(current: number, duration: number) => void`    | –            | Progress callback                                           |
| `onFinish`                                            | `() => void`                                     | –            | Called when playback ends                                   |
| `sent`                                                | `boolean`                                        | `true`       | `true` = outgoing bubble (green), `false` = incoming (gray) |
| `widthPercent`                                        | `number`                                         | `80`         | Percentage of parent width the player occupies              |
| `seekDotColor`                                        | `string`                                         | –            | Override scrubber dot colour                                |
| `filledSeekColor`                                     | `string`                                         | –            | Override filled waveform colour                             |
| `seekColor`                                           | `string`                                         | –            | Override background waveform colour                         |
| `theme`                                               | `{ sent?: ThemeColors; received?: ThemeColors }` | –            | Full theme object (see below)                               |
| `style`, `containerStyle`, `timerStyle`, `speedStyle` | `ViewStyle`                                      | –            | Style overrides                                             |
| `timerTextStyle`, `speedTextStyle`                    | `TextStyle`                                      | –            | Text style overrides                                        |
| `playButtonStyle`                                     | `ViewStyle`                                      | –            | Custom style for play/pause button                          |
| `playIconStyle`                                       | `ImageStyle`                                     | –            | Custom style for the button icon                            |
| `playIconTintColor`                                   | `string`                                         | –            | Tint colour for play icon                                   |
| `pauseIconTintColor`                                  | `string`                                         | –            | Tint colour for pause icon                                  |
| `renderPlayPause`                                     | `(isPlaying: boolean) => ReactNode`              | –            | Replace the button entirely                                 |

**Ref methods** – `play()`, `pause()`, `seek(seconds)`.

#### ThemeColors object

```ts
type ThemeColors = {
  backgroundColor?: string; // bubble background
  waveformBg?: string; // unfilled waveform colour
  waveformFg?: string; // filled waveform (progress) colour
  scrubberDot?: string; // scrubber dot colour
  timerText?: string; // timer text colour
  speedButtonBg?: string; // speed button background
  speedButtonText?: string; // speed button text colour
};
```

## Advanced Examples

### Theming a received message (gray bubble)

```tsx
<PlayerWaveform
  uri={uri}
  bars={bars}
  sent={false}
  theme={{
    received: {
      backgroundColor: '#f0f0f0',
      waveformFg: '#ff9500',
      scrubberDot: '#ff9500',
      timerText: '#555',
    },
  }}
/>
```

### Custom play/pause button with icons

```tsx
<PlayerWaveform
  uri={uri}
  bars={bars}
  playIconTintColor="white"
  pauseIconTintColor="white"
  playButtonStyle={{ backgroundColor: '#007aff', borderRadius: 30 }}
/>
```

### Custom record icon and waveform

```tsx
<RecordingWaveform
  onStop={handleStop}
  renderIcon={recording => (
    <Text style={{ fontSize: 20 }}>{recording ? '⏺' : '🎙️'}</Text>
  )}
  renderWaveform={(bars, recording) => (
    <View style={{ flexDirection: 'row' }}>
      {bars.map((h, i) => (
        <View key={i} style={{ width: 3, height: h, backgroundColor: 'red' }} />
      ))}
    </View>
  )}
/>
```

## Running the Example Project

The package includes a fully functional example app. To run it:

```bash
git clone https://github.com/iqraKhaliq/react-native-audio-waveform-kit.git
cd react-native-audio-waveform-kit/example
npm install
npx react-native run-ios   # or run-android
```

## Contributing

Issues and pull requests are welcome. Please follow the existing code style.

## License

MIT

---

**Built with ❤️ for the React Native community**
