import { useEffect, useState } from 'react';
import { AudioContext } from 'react-native-audio-api';
import { VISIBLE_BARS } from '../constants';

const downsampleData = (
  data: Float32Array | number[],
  target: number,
): number[] => {
  const values = Array.from(data);
  if (!values.length || target <= 0) return new Array(target).fill(1);
  const blockSize = Math.floor(values.length / target);
  const bars: number[] = [];
  for (let i = 0; i < target; i++) {
    const start = i * blockSize;
    const end = start + blockSize;
    let min = Infinity,
      max = -Infinity;
    for (let j = start; j < end; j++) {
      const v = values[j] ?? 0;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const amplitude = Math.abs(max - min);
    bars.push(amplitude);
  }
  const sorted = [...bars].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 1;
  const MAX_BAR = 40;
  const scaled = bars.map(v => {
    const ratio = Math.min(v / p95, 1);
    const boosted = Math.pow(ratio, 0.5);
    return 1 + boosted * (MAX_BAR - 1);
  });
  return scaled.map((v, i, arr) => {
    const prev = arr[i - 1] ?? v;
    const next = arr[i + 1] ?? v;
    const smoothed = prev * 0.2 + v * 0.6 + next * 0.2;
    if (smoothed < 1) return 1;
    if (smoothed > MAX_BAR) return MAX_BAR;
    return smoothed;
  });
};

const getStaticAmplitudes = async (assetUri: string): Promise<number[]> => {
  try {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const buffer = await audioContext.decodeAudioData(assetUri);
    const channelData = new Float32Array(buffer.length);
    buffer.copyFromChannel(channelData, 0);
    const res = downsampleData(channelData, VISIBLE_BARS);
    return res;
  } catch (error) {
    console.error('getStaticAmplitudes error', error);
    return new Array(VISIBLE_BARS).fill(2);
  }
};

export const useWaveformBars = (uri: string, providedBars?: number[]) => {
  const [bars, setBars] = useState<number[] | null>(
    providedBars && providedBars.length > 0 ? providedBars : null,
  );
  const [loading, setLoading] = useState(
    !(providedBars && providedBars.length > 0),
  );

  useEffect(() => {
    if (providedBars && providedBars.length > 0) {
      setBars(providedBars);
      setLoading(false);
      return;
    }
    if (!uri) {
      setBars(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getStaticAmplitudes(uri)
      .then(amps => setBars(amps))
      .catch(err => console.warn('Bar generation failed', err))
      .finally(() => setLoading(false));
  }, [uri, providedBars]);

  return { bars, loading };
};
