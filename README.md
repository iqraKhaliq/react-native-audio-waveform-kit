# 🎙️ React Native Audio Waveform Kit

WhatsApp‑style voice recording and playback waveforms for React Native.

[![npm version](https://badge.fury.io/js/react-native-audio-waveform-kit.svg)](https://www.npmjs.com/package/react-native-audio-waveform-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎤 **Recording**
  - Tap to start/stop recording.
  - **Slide up** while recording to lock (recording continues after finger release).
  - **Long press** (600ms) to start recording without movement.
  - **Slide left** while recording to cancel/delete.
  - **Delete button** (trash icon) appears while recording – tap to cancel.
  - Live waveform visualisation.
  - Recording timer (mm:ss).
- ▶️ **Playback**
  - Play/pause, scrubbing, speed control (1x/1.5x/2x).
  - Loader during initial load (no auto‑play).
  - Auto‑replay prevention (stops accidental replay of short audio).
- 🎨 **Themable** – separate colours for sent (outgoing) and received (incoming) messages: bubble background, waveform fill, scrubber dot, timer text, speed button.
- 📊 **Waveform** – constant 40 bars with peak‑preserving downsampling (auto‑generated if bars not provided).
- 🧹 **No auto‑replay** – prevents accidental replay of short audio
- 🖼️ **Customisable icons** – use your own play/pause/record/delete icons.
- 🔧 **Built with TypeScript** – full type definitions.

## Installation

```bash
npm install react-native-audio-waveform-kit
```

**Peer dependencies** (must be installed in your app):

```bash
npm install react-native-audio-api react-native-sound react-native-gesture-handler react-native-svg react-native-reanimated react-native-worklets
```

### iOS (extra step)

```bash
cd ios && pod install && cd ..
```

### Android permissions

Add the following line to `android/app/src/main/AndroidManifest.xml` inside the `<manifest>` tag:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<!-- Foreground service and microphone permissions for background usage -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE"/>

<!-- Optional: for Bluetooth microphone support -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

<!-- Paste this inside <application> tag -->
<service android:stopWithTask="true" android:name="com.swmansion.audioapi.system.CentralizedForegroundService" android:foregroundServiceType="microphone" />
```

### iOS microphone usage description

Add this to `ios/YourApp/Info.plist` inside the `<dict>` tag:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access to record voice messages</string>

<key>UIBackgroundModes</key>
	<array>
		<string>audio</string>
    <!-- Optional: for Bluetooth microphone support -->
    <string>bluetooth-peripheral</string>
		<string>external-accessory</string>
		<string>bluetooth-central</string>
	</array>
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

| Prop                   | Type                                                  | Default   | Description                                                                                                               |
| ---------------------- | ----------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------- |
| `onStop`               | `(output: any) => void`                               | –         | Called when recording stops normally (tap stop or release without cancel). Returns `{ uri, duration, size, amplitudes }`. |
| `onCancel`             | `() => void`                                          | –         | Called when recording is cancelled (slide left or tap delete button).                                                     |
| `style`                | `ViewStyle`                                           | –         | Style for the outer container                                                                                             |
| `waveformStyle`        | `ViewStyle`                                           | –         | Style for the waveform SVG wrapper                                                                                        |
| `buttonStyle`          | `ViewStyle`                                           | –         | Style for the record button                                                                                               |
| `iconStyle`            | `ImageStyle`                                          | –         | Style for the icon image                                                                                                  |
| `recordingIconTint`    | `string`                                              | `#ff3b30` | Tint color for the recording icon (when recording)                                                                        |
| `recordIconTint`       | `string`                                              | `#34c759` | Tint color for the idle (record) icon                                                                                     |
| `recordingFillColor`   | `string`                                              | `#ff3b30` | Waveform bar colour while recording                                                                                       |
| `idleFillColor`        | `string`                                              | `#ccc`    | Waveform bar colour when idle                                                                                             |
| `recordingBorderColor` | `string`                                              | `#ff3b30` | Button border colour while recording                                                                                      |
| `idleBorderColor`      | `string`                                              | `#34c759` | Button border colour when idle                                                                                            |
| `renderIcon`           | `(isRecording: boolean) => ReactNode`                 | –         | Custom icon renderer                                                                                                      |
| `renderWaveform`       | `(bars: number[], isRecording: boolean) => ReactNode` | –         | Custom waveform renderer                                                                                                  |
| `showTimer`            | `boolean`                                             | `true`    | Whether to show the recording timer                                                                                       |
| `timerStyle`           | `ViewStyle`                                           | –         | Style for the timer container                                                                                             |
| `timerTextStyle`       | `TextStyle`                                           | –         | Style for the timer text                                                                                                  |
| `renderTimer`          | `(elapsedSeconds: number) => ReactNode`               | –         | Custom timer renderer                                                                                                     |
| `cancelThreshold`      | `number`                                              | `40`      | Horizontal swipe distance (px) to cancel while recording                                                                  |
| `slideUpThreshold`     | `number`                                              | `20`      | Vertical swipe distance (px) to start recording (slide up)                                                                |

**Ref methods** – `start()`, `stop()`, `cancel()`.

**Gesture behaviour:**

- **Tap** – start recording (if idle), stop and send (if recording).
- **Slide up** while idle → start recording immediately.
- **Long/Hold press**

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

The repository includes an example app that is pre‑configured to use a local `.tgz` file. If you want to run the example against the **latest published npm package** (instead of building from source), follow these steps:

```bash
# Clone the repository
git clone https://github.com/iqraKhaliq/react-native-audio-waveform-kit.git
cd react-native-audio-waveform-kit/example

# Remove the local tarball dependency from package.json
# (Delete the line: "react-native-audio-waveform-kit": "../react-native-audio-waveform-kit-1.0.0.tgz")

# Install dependencies and the latest npm package
npm install
npm install react-native-audio-waveform-kit@latest

# Install peer dependencies (if not already present)
npm install react-native-audio-api react-native-sound react-native-gesture-handler react-native-reanimated react-native-worklets react-native-svg

# iOS only: install pods
cd ios && pod install && cd ..

# Run the app
npx react-native run-ios   # or run-android
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## Contributing

Issues and pull requests are welcome. Please follow the existing code style.

## License

MIT

---

**Built with ❤️ for the React Native community**
