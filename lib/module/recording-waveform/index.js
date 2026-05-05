"use strict";

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import Svg, { Rect } from 'react-native-svg';
import { BAR_WIDTH, GAP, HEIGHT, MAX_BARS } from '../constants';
import { amplitudeToBarHeight, generateBars } from '../helpers';
import { icons } from './../assets';
import styles from './styles';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const RecordingWaveform = /*#__PURE__*/forwardRef(({
  onStop,
  style,
  waveformStyle,
  buttonStyle,
  iconStyle,
  recordingIconTint = '#ff3b30',
  recordIconTint = '#34c759',
  recordingFillColor = '#ff3b30',
  idleFillColor = '#ccc',
  recordingBorderColor = '#ff3b30',
  idleBorderColor = '#34c759',
  renderIcon,
  renderWaveform
}, ref) => {
  const recorderRef = useRef(null);
  const amplitudesRef = useRef([]);
  const isRecordingRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);
  const [bars, setBars] = useState([]);
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
    recorder.onAudioReady?.({
      sampleRate: 16000,
      bufferLength: 1024,
      channelCount: 1
    }, event => {
      if (!isRecordingRef.current) return;
      const data = event?.buffer?.getChannelData?.(0);
      if (!data) return;
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      const rms = Math.sqrt(sum / data.length);
      amplitudesRef.current.push(Math.min(1, rms * 12));
    });
    return recorder;
  };
  const start = async () => {
    if (isRecordingRef.current) return;
    const permission = await AudioManager.requestRecordingPermissions();
    if (permission !== 'Granted') return;
    await AudioManager.setAudioSessionOptions({
      iosCategory: 'record',
      iosMode: 'default',
      iosOptions: []
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
      amplitudes: generateBars(amplitudesRef.current)
    };
    recorderRef.current = null;
    setBars([]);
    onStop?.(output);
  };
  useImperativeHandle(ref, () => ({
    start,
    stop
  }));
  const totalWidth = MAX_BARS * (BAR_WIDTH + GAP);
  const defaultWaveform = () => /*#__PURE__*/_jsx(Svg, {
    height: HEIGHT,
    width: totalWidth - 32,
    children: bars?.map((h, i) => /*#__PURE__*/_jsx(Rect, {
      x: i * (BAR_WIDTH + GAP),
      y: (HEIGHT - h) / 2,
      width: BAR_WIDTH,
      height: h,
      fill: isRecording ? recordingFillColor : idleFillColor
    }, i))
  });
  const defaultIcon = () => /*#__PURE__*/_jsx(Image, {
    source: isRecording ? icons.recording : icons.record,
    style: [styles.iconStyle, iconStyle, {
      tintColor: isRecording ? recordingIconTint : recordIconTint
    }]
  });
  return /*#__PURE__*/_jsxs(View, {
    style: [styles.container, style],
    children: [/*#__PURE__*/_jsx(View, {
      style: [styles.waveWrap, waveformStyle],
      children: renderWaveform ? renderWaveform(bars, isRecording) : defaultWaveform()
    }), /*#__PURE__*/_jsx(Pressable, {
      onPressIn: start,
      onPressOut: stop,
      style: [styles.btn, {
        borderWidth: 2,
        borderColor: isRecording ? recordingBorderColor : idleBorderColor
      }, buttonStyle],
      children: renderIcon ? renderIcon(isRecording) : defaultIcon()
    })]
  });
});
export default RecordingWaveform;
//# sourceMappingURL=index.js.map