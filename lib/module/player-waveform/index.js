"use strict";

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Sound from 'react-native-sound';
import Svg, { Rect } from 'react-native-svg';
import { downsampleWithPeaks, formatTime } from './../helpers';
import { BAR_WIDTH_FIXED, GAP_FIXED, HEIGHT, VISIBLE_BARS } from './../constants';
import { icons } from './../assets';
import styles from './styles';
import { useWaveformBars } from './../hooks';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
const defaultSentColors = {
  backgroundColor: '#dcf8c5',
  waveformBg: 'rgba(0,0,0,0.2)',
  waveformFg: '#075e54',
  scrubberDot: '#0084ff',
  timerText: '#075e54',
  speedButtonBg: 'rgba(0,0,0,0.05)',
  speedButtonText: '#000000'
};
const defaultReceivedColors = {
  backgroundColor: '#e5e5ea',
  waveformBg: 'rgba(0,0,0,0.15)',
  waveformFg: '#000000',
  scrubberDot: '#0084ff',
  timerText: '#6c6c70',
  speedButtonBg: 'rgba(0,0,0,0.05)',
  speedButtonText: '#000000'
};
const PlayerWaveform = /*#__PURE__*/forwardRef(({
  uri,
  bars: barsProp,
  onProgress,
  onFinish,
  sent = true,
  widthPercent = 80,
  seekDotColor,
  filledSeekColor,
  seekColor,
  theme,
  style,
  timerStyle,
  speedStyle,
  timerTextStyle,
  speedTextStyle,
  renderPlayPause,
  playButtonStyle,
  playIconStyle,
  playIconTintColor,
  pauseIconTintColor,
  containerStyle
}, ref) => {
  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [waveformWidth, setWaveformWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const finishFlagRef = useRef(false);
  const isSpeedChangingRef = useRef(false);
  const intervalRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const startTimeRef = useRef(0);
  const isPlayingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragTargetRef = useRef(0);
  const finishLockRef = useRef(0);
  const {
    bars: finalBars,
    loading: barsLoading
  } = useWaveformBars(uri, barsProp);
  const visibleBars = useMemo(() => {
    if (!finalBars?.length) return new Array(VISIBLE_BARS).fill(2);
    return downsampleWithPeaks(finalBars, VISIBLE_BARS);
  }, [finalBars]);
  const barHeights = useMemo(() => {
    return visibleBars.map(h => {
      const val = h <= 1 ? h * HEIGHT : Math.min(HEIGHT, h);
      return Math.max(2, val);
    });
  }, [visibleBars]);
  const totalBars = barHeights.length;
  const ratio = BAR_WIDTH_FIXED / GAP_FIXED;
  let barW = 0,
    gapW = 0;
  if (waveformWidth > 0 && totalBars > 0) {
    const denominator = totalBars * ratio + totalBars - 1;
    gapW = waveformWidth / denominator;
    barW = ratio * gapW;
  }
  const progressWidth = currentTime / (duration || 1) * waveformWidth;
  const stateTheme = sent ? theme?.sent ?? defaultSentColors : theme?.received ?? defaultReceivedColors;
  const bgColor = stateTheme.backgroundColor ?? (sent ? '#dcf8c5' : '#e5e5ea');
  const waveBg = seekColor ?? stateTheme.waveformBg ?? (sent ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)');
  const waveFg = filledSeekColor ?? stateTheme.waveformFg ?? (sent ? '#075e54' : '#000000');
  const dotColor = seekDotColor ?? stateTheme.scrubberDot ?? '#0084ff';
  const timeColor = stateTheme.timerText ?? (sent ? '#075e54' : '#6c6c70');
  const speedBtnBg = stateTheme.speedButtonBg ?? 'rgba(0,0,0,0.05)';
  const speedBtnTextColor = stateTheme.speedButtonText ?? '#000000';
  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  };
  const startTimer = () => {
    stopTimer();
    syncIntervalRef.current = setInterval(() => {
      if (!soundRef.current || !isPlayingRef.current) return;
      soundRef.current.getCurrentTime(actualTime => {
        if (actualTime > 0.05 || actualTime === 0 && duration === 0) {
          const newTime = Math.min(actualTime, duration);
          setCurrentTime(newTime);
          onProgress?.(newTime, duration);
          startTimeRef.current = Date.now() - newTime * 1000;
        }
      });
    }, 1000);
    intervalRef.current = setInterval(() => {
      if (!isPlayingRef.current) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      let newTime = Math.min(elapsed, duration);
      setCurrentTime(newTime);
      onProgress?.(newTime, duration);
      if (newTime >= duration - 0.05 && !finishFlagRef.current) {
        finishFlagRef.current = true;
        stopTimer();
        setIsPlaying(false);
        isPlayingRef.current = false;
        setCurrentTime(duration);
        soundRef.current?.stop();
        finishLockRef.current = Date.now() + 2000;
        onFinish?.();
        setTimeout(() => {
          finishFlagRef.current = false;
          finishLockRef.current = 0;
        }, 2000);
      }
    }, 100);
  };
  useEffect(() => {
    setIsLoading(true);
    stopTimer();
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.release();
    }
    const cleanPath = uri.replace('file://', '');
    const sound = new Sound(cleanPath, '', err => {
      if (err) {
        console.error('Load error', err);
        setIsLoading(false);
        return;
      }
      let dur = sound.getDuration();
      if (isNaN(dur) || dur === 0) dur = 1;
      setDuration(dur);
      setCurrentTime(0);
      sound.setSpeed(speed);
      soundRef.current = sound;
      setIsLoading(false);
    });
    return () => {
      stopTimer();
      soundRef.current?.stop();
      soundRef.current?.release();
      soundRef.current = null;
    };
  }, [uri]);
  const play = async () => {
    if (Date.now() < finishLockRef.current) return;
    if (isSpeedChangingRef.current) return;
    if (!soundRef.current) return;
    const isAtEnd = Math.abs(currentTime - duration) < 0.1 || currentTime >= duration - 0.05;
    if (isAtEnd) {
      finishLockRef.current = 0;
      soundRef.current.setCurrentTime(0);
      setCurrentTime(0);
      startTimeRef.current = Date.now();
    } else {
      startTimeRef.current = Date.now() - currentTime * 1000;
    }
    soundRef.current.play(() => {});
    setIsPlaying(true);
    isPlayingRef.current = true;
    startTimer();
  };
  const pause = async () => {
    if (isSpeedChangingRef.current) return;
    if (soundRef.current && isPlayingRef.current) {
      soundRef.current.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
      stopTimer();
    }
  };
  const togglePlayPause = () => isPlaying ? pause() : play();
  const seek = async seconds => {
    if (!soundRef.current) return;
    soundRef.current.setCurrentTime(seconds);
    setCurrentTime(seconds);
    startTimeRef.current = Date.now() - seconds * 1000;
  };
  const changeSpeed = async () => {
    const speeds = [1, 1.5, 2];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    if (next === speed || isSpeedChangingRef.current) return;
    isSpeedChangingRef.current = true;
    setSpeed(next);
    if (soundRef.current) {
      const wasPlaying = isPlayingRef.current;
      if (wasPlaying) {
        soundRef.current.pause();
        stopTimer();
      }
      soundRef.current.setSpeed(next);
      if (wasPlaying) {
        startTimeRef.current = Date.now() - currentTime * 1000;
        soundRef.current.play(() => {});
        setIsPlaying(true);
        isPlayingRef.current = true;
        startTimer();
      }
    }
    setTimeout(() => isSpeedChangingRef.current = false, 150);
  };
  const gesture = Gesture.Pan().onStart(() => {
    setIsDragging(true);
    isDraggingRef.current = true;
    stopTimer();
  }).onUpdate(e => {
    if (waveformWidth === 0) return;
    let pos = e.x / waveformWidth;
    pos = Math.min(1, Math.max(0, pos));
    const newTime = pos * duration;
    setCurrentTime(newTime);
    dragTargetRef.current = newTime;
  }).onEnd(async () => {
    if (dragTargetRef.current !== undefined && soundRef.current) {
      await seek(dragTargetRef.current);
    }
    setIsDragging(false);
    isDraggingRef.current = false;
    if (isPlayingRef.current) {
      startTimer();
    }
  });
  useImperativeHandle(ref, () => ({
    play,
    pause,
    seek
  }));
  const renderDefaultPlayPause = () => {
    const icon = isPlaying ? icons.pause : icons.play;
    const tint = isPlaying ? pauseIconTintColor : playIconTintColor;
    return /*#__PURE__*/_jsx(Pressable, {
      onPress: togglePlayPause,
      style: [styles.playBtn, playButtonStyle],
      children: /*#__PURE__*/_jsx(Image, {
        source: icon,
        style: [styles.iconStyle, playIconStyle, !isPlaying && {
          right: -2
        }],
        tintColor: tint
      })
    });
  };
  const showSpinner = isLoading || barsLoading;
  return /*#__PURE__*/_jsx(View, {
    style: [styles.outer, {
      width: `${widthPercent}%`,
      alignSelf: 'flex-end',
      ...containerStyle
    }],
    children: /*#__PURE__*/_jsxs(View, {
      style: [styles.container, {
        backgroundColor: bgColor,
        ...style
      }],
      children: [/*#__PURE__*/_jsxs(View, {
        style: styles.row,
        children: [showSpinner ? /*#__PURE__*/_jsx(View, {
          style: [styles.playBtn, playButtonStyle],
          children: /*#__PURE__*/_jsx(ActivityIndicator, {
            size: "small",
            color: "#000"
          })
        }) : renderPlayPause ? renderPlayPause(isPlaying) : renderDefaultPlayPause(), /*#__PURE__*/_jsx(GestureDetector, {
          gesture: gesture,
          children: /*#__PURE__*/_jsx(View, {
            style: [styles.waveWrap, {
              height: HEIGHT,
              width: '68%'
            }],
            onLayout: e => setWaveformWidth(e.nativeEvent.layout.width),
            children: waveformWidth > 0 && /*#__PURE__*/_jsxs(_Fragment, {
              children: [/*#__PURE__*/_jsx(Svg, {
                height: HEIGHT,
                width: waveformWidth,
                children: barHeights.map((h, i) => /*#__PURE__*/_jsx(Rect, {
                  x: i * (barW + gapW),
                  y: (HEIGHT - h) / 2,
                  width: barW,
                  height: h,
                  fill: waveBg
                }, i))
              }), /*#__PURE__*/_jsx(View, {
                style: [StyleSheet.absoluteFill, {
                  width: progressWidth,
                  overflow: 'hidden'
                }],
                children: /*#__PURE__*/_jsx(Svg, {
                  height: HEIGHT,
                  width: waveformWidth,
                  children: barHeights.map((h, i) => /*#__PURE__*/_jsx(Rect, {
                    x: i * (barW + gapW),
                    y: (HEIGHT - h) / 2,
                    width: barW,
                    height: h,
                    fill: waveFg
                  }, i))
                })
              }), /*#__PURE__*/_jsx(View, {
                style: [styles.scrubberDot, isDragging && styles.scrubberDotDragging, {
                  left: progressWidth - (isDragging ? 8 : 6),
                  top: (HEIGHT - (isDragging ? 16 : 12)) / 2,
                  backgroundColor: dotColor
                }]
              })]
            })
          })
        }), /*#__PURE__*/_jsx(Pressable, {
          onPress: changeSpeed,
          style: [styles.speedBtn, {
            backgroundColor: speedBtnBg
          }, speedStyle],
          children: /*#__PURE__*/_jsxs(Text, {
            style: [styles.speedText, {
              color: speedBtnTextColor
            }, speedTextStyle],
            children: [speed, "x"]
          })
        })]
      }), /*#__PURE__*/_jsx(View, {
        style: [styles.timeRow, timerStyle],
        children: /*#__PURE__*/_jsxs(Text, {
          style: [styles.timeText, {
            color: timeColor
          }, timerTextStyle],
          children: [formatTime(currentTime), " / ", formatTime(duration)]
        })
      })]
    })
  });
});
export default PlayerWaveform;
//# sourceMappingURL=index.js.map