"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeGestureHandler = require("react-native-gesture-handler");
var _reactNativeSound = _interopRequireDefault(require("react-native-sound"));
var _reactNativeSvg = _interopRequireWildcard(require("react-native-svg"));
var _helpers = require("./../helpers");
var _constants = require("./../constants");
var _assets = require("./../assets");
var _styles = _interopRequireDefault(require("./styles"));
var _hooks = require("./../hooks");
var _theme = require("../theme");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
_reactNativeSound.default.setCategory('Playback', true);
const defaultSentColors = {
  backgroundColor: _theme.colors.lightGreen,
  waveformBg: _theme.colors.rgba002,
  waveformFg: _theme.colors.darkGreen,
  scrubberDot: _theme.colors.blue,
  timerText: _theme.colors.darkGreen,
  speedButtonBg: _theme.colors.rgba005,
  speedButtonText: _theme.colors.black
};
const defaultReceivedColors = {
  backgroundColor: _theme.colors.lightGrey,
  waveformBg: _theme.colors.rgba015,
  waveformFg: _theme.colors.black,
  scrubberDot: _theme.colors.blue,
  timerText: _theme.colors.grey,
  speedButtonBg: _theme.colors.rgba005,
  speedButtonText: _theme.colors.black
};
const PlayerWaveform = /*#__PURE__*/(0, _react.forwardRef)(({
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
  // minLoaderDuration = 300,
}, ref) => {
  const soundRef = (0, _react.useRef)(null);
  const [isPlaying, setIsPlaying] = (0, _react.useState)(false);
  const [duration, setDuration] = (0, _react.useState)(0);
  const [currentTime, setCurrentTime] = (0, _react.useState)(0);
  const [speed, setSpeed] = (0, _react.useState)(1);
  const [isLoading, setIsLoading] = (0, _react.useState)(false);
  const [waveformWidth, setWaveformWidth] = (0, _react.useState)(0);
  const [isDragging, setIsDragging] = (0, _react.useState)(false);
  const finishFlagRef = (0, _react.useRef)(false);
  const isSpeedChangingRef = (0, _react.useRef)(false);
  const intervalRef = (0, _react.useRef)(null);
  const syncIntervalRef = (0, _react.useRef)(null);
  const startTimeRef = (0, _react.useRef)(0);
  const isPlayingRef = (0, _react.useRef)(false);
  const isDraggingRef = (0, _react.useRef)(false);
  const dragTargetRef = (0, _react.useRef)(0);
  const finishLockRef = (0, _react.useRef)(0);
  // const loadStartTimeRef = useRef(0);

  const {
    bars: finalBars,
    loading: barsLoading
  } = (0, _hooks.useWaveformBars)(uri, barsProp);
  const visibleBars = (0, _react.useMemo)(() => {
    if (!finalBars?.length) return new Array(_constants.VISIBLE_BARS).fill(2);
    return (0, _helpers.downsampleWithPeaks)(finalBars, _constants.VISIBLE_BARS);
  }, [finalBars]);
  const barHeights = (0, _react.useMemo)(() => {
    return visibleBars.map(h => {
      const val = h <= 1 ? h * _constants.HEIGHT : Math.min(_constants.HEIGHT, h);
      return Math.max(2, val);
    });
  }, [visibleBars]);
  const totalBars = barHeights.length;
  const ratio = _constants.BAR_WIDTH_FIXED / _constants.GAP_FIXED;
  let barW = 0,
    gapW = 0;
  if (waveformWidth > 0 && totalBars > 0) {
    const denominator = totalBars * ratio + totalBars - 1;
    gapW = waveformWidth / denominator;
    barW = ratio * gapW;
  }
  const progressWidth = currentTime / (duration || 1) * waveformWidth;
  const stateTheme = sent ? theme?.sent ?? defaultSentColors : theme?.received ?? defaultReceivedColors;
  const bgColor = stateTheme.backgroundColor ?? (sent ? _theme.colors.lightGreen : _theme.colors.lightGrey);
  const waveBg = seekColor ?? stateTheme.waveformBg ?? (sent ? _theme.colors.rgba002 : _theme.colors.rgba015);
  const waveFg = filledSeekColor ?? stateTheme.waveformFg ?? (sent ? _theme.colors.darkGreen : _theme.colors.black);
  const dotColor = seekDotColor ?? stateTheme.scrubberDot ?? _theme.colors.blue;
  const timeColor = stateTheme.timerText ?? (sent ? _theme.colors.darkGreen : _theme.colors.grey);
  const speedBtnBg = stateTheme.speedButtonBg ?? _theme.colors.rgba005;
  const speedBtnTextColor = stateTheme.speedButtonText ?? _theme.colors.black;
  (0, _react.useEffect)(() => {
    setIsLoading(true);
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.release();
    }
    const cleanPath = uri?.replace('file://', '');
    const sound = new _reactNativeSound.default(cleanPath, '', err => {
      if (err) {
        setIsLoading(false);
        return;
      }
      if (sound.isLoaded()) {
        let dur = sound.getDuration();
        if (isNaN(dur) || dur === 0) dur = 1;
        setDuration(dur);
        setCurrentTime(0);
        sound.stop();
        stopTimer();
        sound.setCurrentTime(0);
        sound.setSpeed(speed);
      }
      soundRef.current = sound;
      sound.stop();
      setIsLoading(false);
    });
    return () => {
      stopTimer();
      soundRef.current?.stop();
      soundRef.current?.release();
      soundRef.current = null;
    };
  }, [uri]);
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

  // const loadSound = async (): Promise<boolean> => {
  //   if (soundRef.current) return true;
  //   if (isLoading) return false;
  //   setIsLoading(true);
  //   loadStartTimeRef.current = Date.now();
  //   return new Promise(resolve => {
  //     const cleanPath = uri.replace('file://', '');
  //     const sound = new Sound(cleanPath, '', err => {
  //       const elapsed = Date.now() - loadStartTimeRef.current;
  //       const remaining = Math.max(0, minLoaderDuration - elapsed);
  //       const finish = () => {
  //         if (err) {
  //           setIsLoading(false);
  //           resolve(false);
  //           return;
  //         }
  //         const dur = sound.getDuration();
  //         setDuration(isNaN(dur) || dur === 0 ? 1 : dur);
  //         sound.setSpeed(speed);
  //         soundRef.current = sound;
  //         setIsLoading(false);
  //         resolve(true);
  //       };
  //       if (remaining > 0) setTimeout(finish, remaining);
  //       else finish();
  //     });
  //   });
  // };

  const play = async () => {
    try {
      if (isSpeedChangingRef.current) return;
      if (isLoading) return;
      // const loaded = await loadSound();

      // if (!loaded) return;

      // // Small delay to ensure native sound is ready (fixes first‑play issue)
      // await new Promise(resolve => setTimeout(resolve, 200));

      if (Date.now() < finishLockRef.current) return;
      const isAtEnd = Math.abs(currentTime - duration) < 0.1 || currentTime >= duration - 0.05;
      if (isAtEnd) {
        finishLockRef.current = 0;
        soundRef.current?.setCurrentTime(0);
        setCurrentTime(0);
        startTimeRef.current = Date.now();
      } else {
        // soundRef.current?.setCurrentTime(currentTime);
        startTimeRef.current = Date.now() - currentTime * 1000;
      }
      soundRef.current?.play(() => {});
      setIsPlaying(true);
      isPlayingRef.current = true;
      startTimer();
    } catch (error) {
      //
    }
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
  const togglePlayPause = () => {
    return isPlaying ? pause() : play();
  };
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
  (0, _react.useEffect)(() => {
    return () => {
      stopTimer();
      soundRef.current?.stop();
      soundRef.current?.release();
      soundRef.current = null;
    };
  }, []);
  const gesture = _reactNativeGestureHandler.Gesture.Pan().runOnJS(true).onStart(() => {
    if (isLoading || !soundRef.current) return;
    setIsDragging(true);
    isDraggingRef.current = true;
    stopTimer();
  }).onUpdate(e => {
    if (isLoading || !soundRef.current || waveformWidth === 0) return;
    let pos = e.x / waveformWidth;
    pos = Math.min(1, Math.max(0, pos));
    const newTime = pos * duration;
    setCurrentTime(newTime);
    dragTargetRef.current = newTime;
  }).onEnd(async () => {
    if (isLoading || !soundRef.current) return;
    if (dragTargetRef.current !== undefined && soundRef.current) {
      await seek(dragTargetRef.current);
    }
    setIsDragging(false);
    isDraggingRef.current = false;
    if (isPlayingRef.current) {
      startTimer();
    }
  });
  (0, _react.useImperativeHandle)(ref, () => ({
    play,
    pause,
    seek
  }));
  const renderDefaultPlayPause = () => {
    const icon = isPlaying ? _assets.icons.pause : _assets.icons.play;
    const tint = isPlaying ? pauseIconTintColor : playIconTintColor;
    const loaderVisible = isLoading || barsLoading;
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Pressable, {
      onPress: togglePlayPause,
      style: [_styles.default.playBtn, playButtonStyle],
      disabled: loaderVisible,
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Image, {
        source: icon,
        style: [_styles.default.iconStyle, playIconStyle, !isPlaying && {
          right: -2
        }],
        tintColor: tint
      })
    });
  };
  const showSpinner = isLoading || barsLoading;
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
    style: [_styles.default.outer, {
      width: `${widthPercent}%`,
      alignSelf: 'flex-end',
      ...containerStyle
    }],
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.View, {
      style: [_styles.default.container, {
        backgroundColor: bgColor,
        ...style
      }],
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.View, {
        style: _styles.default.row,
        children: [showSpinner ? /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
          style: [_styles.default.playBtn, playButtonStyle],
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.ActivityIndicator, {
            size: 'small',
            color: _theme.colors.black
          })
        }) : renderPlayPause ? renderPlayPause(isPlaying) : renderDefaultPlayPause(), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeGestureHandler.GestureDetector, {
          gesture: gesture,
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
            style: [_styles.default.waveWrap, {
              height: _constants.HEIGHT,
              width: '68%'
            }],
            onLayout: e => setWaveformWidth(e.nativeEvent.layout.width),
            children: waveformWidth > 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeSvg.default, {
                height: _constants.HEIGHT,
                width: waveformWidth,
                children: barHeights.map((h, i) => /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeSvg.Rect, {
                  x: i * (barW + gapW),
                  y: (_constants.HEIGHT - h) / 2,
                  width: barW,
                  height: h,
                  fill: waveBg
                }, i))
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
                style: [_reactNative.StyleSheet.absoluteFill, {
                  width: progressWidth,
                  overflow: 'hidden'
                }],
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeSvg.default, {
                  height: _constants.HEIGHT,
                  width: waveformWidth,
                  children: barHeights.map((h, i) => /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeSvg.Rect, {
                    x: i * (barW + gapW),
                    y: (_constants.HEIGHT - h) / 2,
                    width: barW,
                    height: h,
                    fill: waveFg
                  }, i))
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
                style: [_styles.default.scrubberDot, isDragging && _styles.default.scrubberDotDragging, {
                  left: progressWidth - (isDragging ? 8 : 6),
                  top: (_constants.HEIGHT - (isDragging ? 16 : 12)) / 2,
                  backgroundColor: dotColor
                }]
              })]
            })
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Pressable, {
          onPress: changeSpeed,
          style: [_styles.default.speedBtn, {
            backgroundColor: speedBtnBg
          }, speedStyle],
          children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.Text, {
            style: [_styles.default.speedText, {
              color: speedBtnTextColor
            }, speedTextStyle],
            children: [speed, "x"]
          })
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
        style: [_styles.default.timeRow, timerStyle],
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.Text, {
          style: [_styles.default.timeText, {
            color: timeColor
          }, timerTextStyle],
          children: [(0, _helpers.formatTime)(currentTime), " / ", (0, _helpers.formatTime)(duration)]
        })
      })]
    })
  });
});
var _default = exports.default = PlayerWaveform;
//# sourceMappingURL=index.js.map