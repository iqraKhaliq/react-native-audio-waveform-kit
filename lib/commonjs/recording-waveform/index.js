"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeGestureHandler = require("react-native-gesture-handler");
var _reactNativeWorklets = require("react-native-worklets");
var _reactNativeReanimated = require("react-native-reanimated");
var _reactNativeSvg = _interopRequireWildcard(require("react-native-svg"));
var _constants = require("../constants");
var _helpers = require("../helpers");
var _assets = require("./../assets");
var _styles = _interopRequireDefault(require("./styles"));
var _theme = require("../theme");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const RecordingWaveform = /*#__PURE__*/(0, _react.forwardRef)(({
  onStop,
  onCancel,
  style,
  waveformStyle,
  buttonStyle,
  iconStyle,
  recordingIconTint = _theme.colors.red,
  recordIconTint = _theme.colors.green,
  recordingFillColor = _theme.colors.red,
  idleFillColor = _theme.colors.gray,
  recordingBorderColor = _theme.colors.red,
  idleBorderColor = _theme.colors.green,
  renderIcon,
  renderWaveform,
  showTimer = true,
  timerStyle,
  timerTextStyle,
  renderTimer,
  cancelThreshold = 40,
  slideUpThreshold = 20
}, ref) => {
  const service = _helpers.RecordingService.getInstance();
  const [isRecording, setIsRecording] = (0, _react.useState)(false);
  const [bars, setBars] = (0, _react.useState)([]);
  const [elapsedSeconds, setElapsedSeconds] = (0, _react.useState)(0);
  const timerIntervalRef = (0, _react.useRef)(null);
  const cancelTriggeredRef = (0, _reactNativeReanimated.useSharedValue)(false);
  const startedByPanRef = (0, _reactNativeReanimated.useSharedValue)(false);
  const panActiveRef = (0, _reactNativeReanimated.useSharedValue)(false);
  const panActiveDragRef = (0, _reactNativeReanimated.useSharedValue)(false);
  const onStopRef = (0, _react.useRef)(onStop);
  const onCancelRef = (0, _react.useRef)(onCancel);
  (0, _react.useEffect)(() => {
    onStopRef.current = onStop;
    onCancelRef.current = onCancel;
  }, [onStop, onCancel]);
  (0, _react.useEffect)(() => {
    service.setCallbacks({
      onAmplitude: () => {
        const amps = service.getAmplitudes();
        const raw = amps.slice(-_constants.MAX_BARS);
        setBars(raw.map(_helpers.amplitudeToBarHeight));
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
  (0, _react.useEffect)(() => {
    service.setCallbacks({
      onAmplitude: () => {
        const amps = service.getAmplitudes();
        const raw = amps.slice(-_constants.MAX_BARS);
        setBars(raw.map(_helpers.amplitudeToBarHeight));
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
  (0, _react.useEffect)(() => {
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
  const tap = _reactNativeGestureHandler.Gesture.Tap().onEnd(() => {
    if (isRecording && !cancelTriggeredRef.value) {
      (0, _reactNativeWorklets.scheduleOnRN)(stopRecording);
    } else if (!isRecording) {
      (0, _reactNativeWorklets.scheduleOnRN)(startRecording);
    }
  });
  const pan = _reactNativeGestureHandler.Gesture.Pan().onStart(() => {
    if (!isRecording) {
      panActiveRef.value = true;
      panActiveDragRef.value = false;
    }
  }).onUpdate(event => {
    const dy = event.translationY;
    const dx = event.translationX;
    if (!isRecording && !startedByPanRef.value && dy < -slideUpThreshold && dx === 0) {
      startedByPanRef.value = true;
      (0, _reactNativeWorklets.scheduleOnRN)(startRecording);
    }
    if (isRecording && !cancelTriggeredRef.value && !panActiveDragRef.value && dx <= -cancelThreshold && Math.abs(dy) <= 25) {
      (0, _reactNativeWorklets.scheduleOnRN)(cancelRecording);
    }
  }).onEnd(() => {
    panActiveRef.value = false;
    startedByPanRef.value = false;
    panActiveDragRef.value = true;
  });
  const longPress = _reactNativeGestureHandler.Gesture.LongPress().minDuration(600).onStart(() => {
    if (!isRecording && !startedByPanRef.value) {
      (0, _reactNativeWorklets.scheduleOnRN)(startRecording);
    }
  }).onEnd(() => {
    (0, _reactNativeWorklets.scheduleOnRN)(stopRecording);
  });
  const slideAndHold = _reactNativeGestureHandler.Gesture.Simultaneous(pan, longPress);
  const gesture = _reactNativeGestureHandler.Gesture.Race(tap, slideAndHold);
  (0, _react.useImperativeHandle)(ref, () => ({
    start: startRecording,
    stop: stopRecording,
    cancel: cancelRecording
  }));
  const totalWidth = _constants.MAX_BARS * (_constants.BAR_WIDTH + _constants.GAP);
  const defaultWaveform = () => /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeSvg.default, {
    height: _constants.HEIGHT,
    width: totalWidth - 32,
    children: bars.map((h, i) => /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeSvg.Rect, {
      x: i * (_constants.BAR_WIDTH + _constants.GAP),
      y: (_constants.HEIGHT - h) / 2,
      width: _constants.BAR_WIDTH,
      height: h,
      fill: isRecording ? recordingFillColor : idleFillColor
    }, i))
  });
  const defaultIcon = () => {
    const iconSource = isRecording ? _assets.icons.recording : _assets.icons.record;
    const tint = isRecording ? recordingIconTint : recordIconTint;
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Image, {
      source: iconSource,
      style: [_styles.default.iconStyle, iconStyle, {
        tintColor: tint
      }]
    });
  };
  const defaultTimer = () => /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Text, {
    style: [_styles.default.timerText, timerTextStyle],
    children: (0, _helpers.formatRecordingTime)(elapsedSeconds)
  });
  const buttonContent = renderIcon ? renderIcon(isRecording) : defaultIcon();
  const timerDisplay = renderTimer ? renderTimer(elapsedSeconds) : defaultTimer();
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNativeGestureHandler.GestureHandlerRootView, {
    style: [_styles.default.container, style],
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.View, {
      style: [_styles.default.waveWrap, waveformStyle],
      children: [renderWaveform ? renderWaveform(bars, isRecording) : defaultWaveform(), isRecording && showTimer && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.View, {
        style: _styles.default.timerRow,
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Pressable, {
          onPress: cancelRecording,
          hitSlop: {
            left: 20,
            right: 20,
            top: 20,
            bottom: 20
          },
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Image, {
            source: _assets.icons.delete,
            style: _styles.default.deleteIcon
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
          style: [_styles.default.timerContainer, timerStyle],
          children: timerDisplay
        })]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
      style: _styles.default.rightSection,
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeGestureHandler.GestureDetector, {
        gesture: gesture,
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
          style: [_styles.default.btn, {
            borderWidth: 2,
            borderColor: isRecording ? recordingBorderColor : idleBorderColor
          }, buttonStyle],
          children: buttonContent
        })
      })
    })]
  });
});
var _default = exports.default = RecordingWaveform;
//# sourceMappingURL=index.js.map