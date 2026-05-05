"use strict";

import { HEIGHT, MIN_HEIGHT, NOISE_THRESHOLD, TARGET } from "../constants";
export const downsampleWithPeaks = (data, targetCount) => {
  if (!data?.length) return new Array(targetCount).fill(2);
  const result = new Array(targetCount);
  const segSize = data.length / targetCount;
  for (let i = 0; i < targetCount; i++) {
    const start = Math.floor(i * segSize);
    let end = Math.floor((i + 1) * segSize);
    if (end <= start) end = start + 1;
    let maxVal = 2;
    for (let j = start; j < end && j < data.length; j++) {
      if (data[j] > maxVal) maxVal = data[j];
    }
    result[i] = maxVal;
  }
  return result;
};
export const formatTime = secs => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};
export const amplitudeToBarHeight = amp => {
  const clamped = Math.max(0, Math.min(1, amp));
  if (clamped < NOISE_THRESHOLD) return MIN_HEIGHT;
  const normalized = (clamped - NOISE_THRESHOLD) / (1 - NOISE_THRESHOLD);
  const scaled = Math.pow(normalized, 0.9);
  return Math.max(MIN_HEIGHT, scaled * HEIGHT);
};
export const generateBars = amps => {
  if (!amps || amps.length === 0) return new Array(TARGET).fill(MIN_HEIGHT);
  const bars = [];
  for (let i = 0; i < TARGET; i++) {
    const start = Math.floor(i / TARGET * amps.length);
    const end = Math.floor((i + 1) / TARGET * amps.length);
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
//# sourceMappingURL=waveform.js.map