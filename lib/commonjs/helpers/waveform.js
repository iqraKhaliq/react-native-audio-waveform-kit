"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateBars = exports.formatTime = exports.formatRecordingTime = exports.downsampleWithPeaks = exports.amplitudeToBarHeight = void 0;
var _constants = require("../constants");
const downsampleWithPeaks = (data, targetCount) => {
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
exports.downsampleWithPeaks = downsampleWithPeaks;
const formatTime = secs => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};
exports.formatTime = formatTime;
const amplitudeToBarHeight = amp => {
  const clamped = Math.max(0, Math.min(1, amp));
  if (clamped < _constants.NOISE_THRESHOLD) return _constants.MIN_HEIGHT;
  const normalized = (clamped - _constants.NOISE_THRESHOLD) / (1 - _constants.NOISE_THRESHOLD);
  const scaled = Math.pow(normalized, 0.9);
  return Math.max(_constants.MIN_HEIGHT, scaled * _constants.HEIGHT);
};
exports.amplitudeToBarHeight = amplitudeToBarHeight;
const generateBars = amps => {
  if (!amps || amps.length === 0) return new Array(_constants.TARGET).fill(_constants.MIN_HEIGHT);
  const bars = [];
  for (let i = 0; i < _constants.TARGET; i++) {
    const start = Math.floor(i / _constants.TARGET * amps.length);
    const end = Math.floor((i + 1) / _constants.TARGET * amps.length);
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
exports.generateBars = generateBars;
const formatRecordingTime = seconds => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
exports.formatRecordingTime = formatRecordingTime;
//# sourceMappingURL=waveform.js.map