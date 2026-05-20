"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNativeAudioApi = require("react-native-audio-api");
var _reactNative = require("react-native");
var _waveform = require("./waveform");
class RecordingService {
  recorder = null;
  amplitudes = [];
  isRecording = false;
  callbacks = {};
  isStarting = false;
  constructor() {}
  static getInstance() {
    if (!RecordingService.instance) {
      RecordingService.instance = new RecordingService();
    }
    return RecordingService.instance;
  }
  setCallbacks(callbacks) {
    this.callbacks = callbacks;
  }
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async start() {
    if (this.isRecording || this.isStarting) return false;
    this.isStarting = true;
    try {
      // Deactivate any existing session
      await _reactNativeAudioApi.AudioManager.setAudioSessionActivity(false);
      await this.delay(50);
      const permission = await _reactNativeAudioApi.AudioManager.requestRecordingPermissions();
      if (permission !== 'Granted') return false;
      await _reactNativeAudioApi.AudioManager.setAudioSessionOptions({
        iosCategory: 'record',
        iosMode: 'default',
        iosOptions: ['allowAirPlay', 'allowBluetoothA2DP', 'allowBluetoothHFP', 'bluetoothHighQualityRecording']
      });
      await _reactNativeAudioApi.AudioManager.setAudioSessionActivity(true);
      await this.delay(50);
      this.amplitudes = [];
      this.isRecording = true;
      this.recorder = new _reactNativeAudioApi.AudioRecorder();
      this.recorder.enableFileOutput();
      this.recorder.onAudioReady?.({
        sampleRate: _reactNative.Platform.OS === 'ios' ? 16000 : 48000,
        bufferLength: 1024,
        channelCount: 1
      }, event => {
        if (!this.isRecording) return;
        const data = event?.buffer?.getChannelData?.(0);
        if (!data) return;
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / data.length);
        // Raw RMS typically 0..0.5, multiply by 12 for better visibility
        const normalized = Math.min(1, rms * 12);
        this.amplitudes.push(normalized);
        this.callbacks.onAmplitude?.(normalized);
      });
      const startResult = this.recorder.start();
      if (startResult?.status === 'error') {
        console.error('Start error', startResult.message);
        this.isRecording = false;
        this.recorder = null;
        await _reactNativeAudioApi.AudioManager.setAudioSessionActivity(false);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Start exception', error);
      await _reactNativeAudioApi.AudioManager.setAudioSessionActivity(false);
      return false;
    } finally {
      this.isStarting = false;
    }
  }
  async stop() {
    if (!this.recorder || !this.isRecording) return;
    this.isRecording = false;
    const stopResult = this.recorder.stop();
    await _reactNativeAudioApi.AudioManager.setAudioSessionActivity(false);
    await this.delay(100);
    let output = null;
    if (stopResult?.status === 'error') {
      console.error('Stop error', stopResult.message);
    } else {
      output = {
        uri: stopResult?.paths?.[0],
        duration: stopResult?.duration,
        size: stopResult?.size,
        amplitudes: (0, _waveform.generateBars)(this.amplitudes)
      };
    }
    this.recorder = null;
    this.callbacks.onStop?.(output);
    this.amplitudes = [];
  }
  async cancel() {
    if (!this.recorder || !this.isRecording) return;
    this.isRecording = false;
    const stopResult = this.recorder.stop();
    await _reactNativeAudioApi.AudioManager.setAudioSessionActivity(false);
    await this.delay(100);
    if (stopResult?.status === 'error') {
      console.error('Cancel error', stopResult.message);
    }
    this.recorder = null;
    this.callbacks.onCancel?.();
    this.amplitudes = [];
  }
  isActive() {
    return this.isRecording;
  }
  getAmplitudes() {
    return this.amplitudes;
  }
}
var _default = exports.default = RecordingService;
//# sourceMappingURL=recording.js.map