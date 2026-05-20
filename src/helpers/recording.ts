import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import { Platform } from 'react-native';
import { generateBars } from './waveform';

type RecordingServiceCallbacks = {
  onAmplitude?: (rms: number) => void;
  onStop?: (output: any) => void;
  onCancel?: () => void;
};

class RecordingService {
  private static instance: RecordingService;
  private recorder: AudioRecorder | null = null;
  private amplitudes: number[] = [];
  private isRecording = false;
  private callbacks: RecordingServiceCallbacks = {};
  private isStarting = false;

  private constructor() {}

  public static getInstance(): RecordingService {
    if (!RecordingService.instance) {
      RecordingService.instance = new RecordingService();
    }
    return RecordingService.instance;
  }

  public setCallbacks(callbacks: RecordingServiceCallbacks) {
    this.callbacks = callbacks;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async start(): Promise<boolean> {
    if (this.isRecording || this.isStarting) return false;
    this.isStarting = true;
    try {
      // Deactivate any existing session
      await AudioManager.setAudioSessionActivity(false);
      await this.delay(50);

      const permission = await AudioManager.requestRecordingPermissions();
      if (permission !== 'Granted') return false;

      await AudioManager.setAudioSessionOptions({
        iosCategory: 'record',
        iosMode: 'default',
        iosOptions: [
          'allowAirPlay',
          'allowBluetoothA2DP',
          'allowBluetoothHFP',
          'bluetoothHighQualityRecording',
        ],
      });
      await AudioManager.setAudioSessionActivity(true);
      await this.delay(50);

      this.amplitudes = [];
      this.isRecording = true;

      this.recorder = new AudioRecorder();
      this.recorder.enableFileOutput();
      this.recorder.onAudioReady?.(
        {
          sampleRate: Platform.OS === 'ios' ? 16000 : 48000,
          bufferLength: 1024,
          channelCount: 1,
        },
        (event: any) => {
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
        },
      );

      const startResult = this.recorder.start();
      if (startResult?.status === 'error') {
        console.error('Start error', startResult.message);
        this.isRecording = false;
        this.recorder = null;
        await AudioManager.setAudioSessionActivity(false);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Start exception', error);
      await AudioManager.setAudioSessionActivity(false);
      return false;
    } finally {
      this.isStarting = false;
    }
  }

  public async stop(): Promise<void> {
    if (!this.recorder || !this.isRecording) return;
    this.isRecording = false;
    const stopResult = this.recorder.stop();
    await AudioManager.setAudioSessionActivity(false);
    await this.delay(100);

    let output = null;
    if (stopResult?.status === 'error') {
      console.error('Stop error', stopResult.message);
    } else {
      output = {
        uri: stopResult?.paths?.[0],
        duration: stopResult?.duration,
        size: stopResult?.size,
        amplitudes: generateBars(this.amplitudes),
      };
    }
    this.recorder = null;
    this.callbacks.onStop?.(output);
    this.amplitudes = [];
  }

  public async cancel(): Promise<void> {
    if (!this.recorder || !this.isRecording) return;
    this.isRecording = false;
    const stopResult = this.recorder.stop();
    await AudioManager.setAudioSessionActivity(false);
    await this.delay(100);
    if (stopResult?.status === 'error') {
      console.error('Cancel error', stopResult.message);
    }
    this.recorder = null;
    this.callbacks.onCancel?.();
    this.amplitudes = [];
  }

  public isActive(): boolean {
    return this.isRecording;
  }

  public getAmplitudes(): number[] {
    return this.amplitudes;
  }
}

export default RecordingService;
