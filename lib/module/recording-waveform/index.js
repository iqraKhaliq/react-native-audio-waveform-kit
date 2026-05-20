"use strict";

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useSharedValue } from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import { BAR_WIDTH, GAP, HEIGHT, MAX_BARS } from '../constants';
import { amplitudeToBarHeight, formatRecordingTime, RecordingService } from '../helpers';
import { icons } from './../assets';
import styles from './styles';
import { colors } from '../theme';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const RecordingWaveform = /*#__PURE__*/forwardRef(({
  onStop,
  onCancel,
  style,
  waveformStyle,
  buttonStyle,
  iconStyle,
  recordingIconTint = colors.red,
  recordIconTint = colors.green,
  recordingFillColor = colors.red,
  idleFillColor = colors.gray,
  recordingBorderColor = colors.red,
  idleBorderColor = colors.green,
  renderIcon,
  renderWaveform,
  showTimer = true,
  timerStyle,
  timerTextStyle,
  renderTimer,
  cancelThreshold = 40,
  slideUpThreshold = 20
}, ref) => {
  const service = RecordingService.getInstance();
  const [isRecording, setIsRecording] = useState(false);
  const [bars, setBars] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef(null);
  const cancelTriggeredRef = useSharedValue(false);
  const startedByPanRef = useSharedValue(false);
  const panActiveRef = useSharedValue(false);
  const panActiveDragRef = useSharedValue(false);
  const onStopRef = useRef(onStop);
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onStopRef.current = onStop;
    onCancelRef.current = onCancel;
  }, [onStop, onCancel]);
  useEffect(() => {
    service.setCallbacks({
      onAmplitude: () => {
        const amps = service.getAmplitudes();
        const raw = amps.slice(-MAX_BARS);
        setBars(raw.map(amplitudeToBarHeight));
      },
      onStop: output => {
        setIsRecording(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        onStopRef.current?.(output);
        setBars([]);
      },
      onCancel: () => {
        setIsRecording(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        onCancelRef.current?.();
        setBars([]);
      }
    });
  }, []);

  // Subscribe to amplitude updates
  useEffect(() => {
    service.setCallbacks({
      onAmplitude: () => {
        const amps = service.getAmplitudes();
        const raw = amps.slice(-MAX_BARS);
        setBars(raw.map(amplitudeToBarHeight));
      },
      onStop: output => {
        setIsRecording(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        onStop?.(output);
        setBars([]);
      },
      onCancel: () => {
        setIsRecording(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        onCancel?.();
        setBars([]);
      }
    });
    return () => {
      if (service.isActive()) service.cancel();
    };
  }, []);

  // Timer for elapsed seconds
  useEffect(() => {
    if (!isRecording) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }
    setElapsedSeconds(0);
    const startTime = Date.now();
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);
  const startRecording = async () => {
    if (service.isActive()) return;
    const success = await service.start();
    if (success) {
      setIsRecording(true);
      cancelTriggeredRef.value = false;
    }
  };
  const stopRecording = async () => {
    await service.stop();
    setIsRecording(false);
  };
  const cancelRecording = async () => {
    if (cancelTriggeredRef.value) return;
    cancelTriggeredRef.value = true;
    await service.cancel();
    setIsRecording(false);
    setTimeout(() => {
      cancelTriggeredRef.value = false;
    }, 200);
  };
  const tap = Gesture.Tap().onEnd(() => {
    if (isRecording && !cancelTriggeredRef.value) {
      scheduleOnRN(stopRecording);
    } else if (!isRecording) {
      scheduleOnRN(startRecording);
    }
  });
  const pan = Gesture.Pan().onStart(() => {
    if (!isRecording) {
      panActiveRef.value = true;
      panActiveDragRef.value = false;
    }
  }).onUpdate(event => {
    const dy = event.translationY;
    const dx = event.translationX;
    if (!isRecording && !startedByPanRef.value && dy < -slideUpThreshold && dx === 0) {
      startedByPanRef.value = true;
      scheduleOnRN(startRecording);
    }
    if (isRecording && !cancelTriggeredRef.value && !panActiveDragRef.value && dx <= -cancelThreshold && Math.abs(dy) <= 25) {
      scheduleOnRN(cancelRecording);
    }
  }).onEnd(() => {
    panActiveRef.value = false;
    startedByPanRef.value = false;
    panActiveDragRef.value = true;
  });
  const longPress = Gesture.LongPress().minDuration(600).onStart(() => {
    if (!isRecording && !startedByPanRef.value) {
      scheduleOnRN(startRecording);
    }
  }).onEnd(() => {
    scheduleOnRN(stopRecording);
  });
  const slideAndHold = Gesture.Simultaneous(pan, longPress);
  const gesture = Gesture.Race(tap, slideAndHold);
  useImperativeHandle(ref, () => ({
    start: startRecording,
    stop: stopRecording,
    cancel: cancelRecording
  }));
  const totalWidth = MAX_BARS * (BAR_WIDTH + GAP);
  const defaultWaveform = () => /*#__PURE__*/_jsx(Svg, {
    height: HEIGHT,
    width: totalWidth - 32,
    children: bars.map((h, i) => /*#__PURE__*/_jsx(Rect, {
      x: i * (BAR_WIDTH + GAP),
      y: (HEIGHT - h) / 2,
      width: BAR_WIDTH,
      height: h,
      fill: isRecording ? recordingFillColor : idleFillColor
    }, i))
  });
  const defaultIcon = () => {
    const iconSource = isRecording ? icons.recording : icons.record;
    const tint = isRecording ? recordingIconTint : recordIconTint;
    return /*#__PURE__*/_jsx(Image, {
      source: iconSource,
      style: [styles.iconStyle, iconStyle, {
        tintColor: tint
      }]
    });
  };
  const defaultTimer = () => /*#__PURE__*/_jsx(Text, {
    style: [styles.timerText, timerTextStyle],
    children: formatRecordingTime(elapsedSeconds)
  });
  const buttonContent = renderIcon ? renderIcon(isRecording) : defaultIcon();
  const timerDisplay = renderTimer ? renderTimer(elapsedSeconds) : defaultTimer();
  return /*#__PURE__*/_jsxs(GestureHandlerRootView, {
    style: [styles.container, style],
    children: [/*#__PURE__*/_jsxs(View, {
      style: [styles.waveWrap, waveformStyle],
      children: [renderWaveform ? renderWaveform(bars, isRecording) : defaultWaveform(), isRecording && showTimer && /*#__PURE__*/_jsxs(View, {
        style: styles.timerRow,
        children: [/*#__PURE__*/_jsx(Pressable, {
          onPress: cancelRecording,
          hitSlop: {
            left: 20,
            right: 20,
            top: 20,
            bottom: 20
          },
          children: /*#__PURE__*/_jsx(Image, {
            source: icons.delete,
            style: styles.deleteIcon
          })
        }), /*#__PURE__*/_jsx(View, {
          style: [styles.timerContainer, timerStyle],
          children: timerDisplay
        })]
      })]
    }), /*#__PURE__*/_jsx(View, {
      style: styles.rightSection,
      children: /*#__PURE__*/_jsx(GestureDetector, {
        gesture: gesture,
        children: /*#__PURE__*/_jsx(View, {
          style: [styles.btn, {
            borderWidth: 2,
            borderColor: isRecording ? recordingBorderColor : idleBorderColor
          }, buttonStyle],
          children: buttonContent
        })
      })
    })]
  });
});
export default RecordingWaveform;
//# sourceMappingURL=index.js.map