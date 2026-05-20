# Changelog

## [1.0.2-beta.0] - 2025-05-20

### Added

- **Recording timer** – Displays elapsed time during recording (mm:ss).
- **Slide‑to‑lock** – Slide up while recording to lock; slide left to cancel. Delete button cancels recording.
- **Hold long press** – Long press on the record button starts recording (after 600ms).
- **Lazy loading for audio** – Playback sound loads only on first user tap (no auto‑play).
- **Loader with minimum duration** – Prevents play button flicker during audio load (`minLoaderDuration` prop).

### Fixed

- **Auto‑play on Android** – Sound is now only loaded and played after user interaction.
- **Second recording failure on Android** (real devices) – Added session reset and cleanup logic.
- **Gesture crashes** – Used `.runOnJS(true)` on all gesture callbacks to avoid worklet errors.
- **Play button responsiveness** – Added `activeOffsetY` to `Pan` gesture so it doesn’t block `Tap`.
- **Seek during loading** – Gesture is disabled while audio loads.

### Changed

- Refactored recording into a singleton service (`RecordingService`) for better state management and performance.
- Gesture callbacks now run on the JS thread (`.runOnJS(true)`), eliminating the need for `'worklet'` directives.
