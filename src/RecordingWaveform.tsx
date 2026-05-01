import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from 'react';
import { Pressable, Text, StyleSheet, View, Image } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { AudioRecorder, AudioManager } from 'react-native-audio-api';

const GAP = 2;
const TARGET = 40;
const HEIGHT = 40;
const BAR_WIDTH = 2;
const MAX_BARS = 80;
const NOISE_THRESHOLD = 0.03;
const MIN_HEIGHT = 2;

const amplitudeToBarHeight = (amp: number) => {
  const clamped = Math.max(0, Math.min(1, amp));
  if (clamped < NOISE_THRESHOLD) return MIN_HEIGHT;
  const normalized = (clamped - NOISE_THRESHOLD) / (1 - NOISE_THRESHOLD);
  const scaled = Math.pow(normalized, 0.9);
  return Math.max(MIN_HEIGHT, scaled * HEIGHT);
};

const generateBars = (amps: number[]) => {
  if (!amps || amps.length === 0) return new Array(TARGET).fill(MIN_HEIGHT);
  const bars: number[] = [];
  for (let i = 0; i < TARGET; i++) {
    const start = Math.floor((i / TARGET) * amps.length);
    const end = Math.floor(((i + 1) / TARGET) * amps.length);
    let sum = 0,
      max = 0,
      count = 0;
    for (let j = start; j < end && j < amps.length; j++) {
      const v = amps[j];
      sum += v;
      if (v > max) max = v;
      count++;
    }
    const avg = count ? sum / count : 0;
    const value = avg * 0.7 + max * 0.3;
    bars.push(amplitudeToBarHeight(value));
  }
  return bars;
};

const RecordingWaveform = forwardRef(({ onStop }: any, ref) => {
  const recorderRef = useRef<any>(null);
  const amplitudesRef = useRef<number[]>([]);
  const isRecordingRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      const raw = amplitudesRef.current.slice(-MAX_BARS);
      setBars(raw.map(amplitudeToBarHeight));
    }, 80);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (recorderRef.current && isRecordingRef.current) {
        try {
          recorderRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const createRecorder = () => {
    const recorder = new AudioRecorder();
    recorder.enableFileOutput();
    recorder.onAudioReady?.(
      { sampleRate: 16000, bufferLength: 1024, channelCount: 1 },
      (event: any) => {
        if (!isRecordingRef.current) return;
        const data = event?.buffer?.getChannelData?.(0);
        if (!data) return;
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / data.length);
        amplitudesRef.current.push(Math.min(1, rms * 12));
      },
    );
    return recorder;
  };

  const start = async () => {
    if (isRecordingRef.current) return;
    const permission = await AudioManager.requestRecordingPermissions();
    if (permission !== 'Granted') return;
    await AudioManager.setAudioSessionOptions({
      iosCategory: 'record',
      iosMode: 'default',
      iosOptions: [],
    });
    await AudioManager.setAudioSessionActivity(true);
    amplitudesRef.current = [];
    setBars([]);
    isRecordingRef.current = true;
    const recorder = createRecorder();
    recorderRef.current = recorder;
    const startResult = recorder.start();
    if (startResult?.status === 'error') {
      isRecordingRef.current = false;
      recorderRef.current = null;
      await AudioManager.setAudioSessionActivity(false);
      return;
    }
    setIsRecording(true);
  };

  const stop = async () => {
    if (!recorderRef.current) return;
    isRecordingRef.current = false;
    setIsRecording(false);
    const stopResult = recorderRef.current.stop();
    await AudioManager.setAudioSessionActivity(false);
    const output = {
      uri: stopResult?.paths?.[0],
      duration: stopResult?.duration,
      size: stopResult?.size,
      amplitudes: generateBars(amplitudesRef.current),
    };
    recorderRef.current = null;
    onStop?.(output);
  };

  useImperativeHandle(ref, () => ({ start, stop }));

  const totalWidth = MAX_BARS * (BAR_WIDTH + GAP);
  const icons = {
    record: require('./assets/record.png'),
    recording: require('./assets/recording.png'),
  };

  return (
    <View style={styles.container}>
      <View style={styles.waveWrap}>
        <Svg height={HEIGHT} width={totalWidth - 32}>
          {bars.map((h, i) => (
            <Rect
              key={i}
              x={i * (BAR_WIDTH + GAP)}
              y={(HEIGHT - h) / 2}
              width={BAR_WIDTH}
              height={h}
              fill={isRecording ? '#ff3b30' : '#ccc'}
            />
          ))}
        </Svg>
      </View>
      <Pressable
        onPressIn={start}
        onPressOut={stop}
        style={[
          styles.btn,
          {
            borderWidth: 2,
            borderColor: isRecording ? '#ff3b30' : '#34c759',
          },
        ]}
      >
        <Image
          source={isRecording ? icons.recording : icons.record}
          style={[
            styles.iconStyle,
            { tintColor: isRecording ? '#ff3b30' : '#34c759' },
          ]}
        />
      </Pressable>
    </View>
  );
});

export default RecordingWaveform;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waveWrap: {
    overflow: 'hidden',
    width: '85%',
    paddingHorizontal: 12,
    borderRadius: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  btn: {
    borderRadius: 40,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconStyle: {
    height: 22,
    width: 22,
    resizeMode: 'contain',
  },
});
