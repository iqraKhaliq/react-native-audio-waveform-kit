"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeAudioApi = require("react-native-audio-api");
var _reactNativeSvg = _interopRequireWildcard(require("react-native-svg"));
var _constants = require("../constants");
var _helpers = require("../helpers");
var _assets = require("./../assets");
var _styles = _interopRequireDefault(require("./styles"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const RecordingWaveform = /*#__PURE__*/(0, _react.forwardRef)(({
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
  const recorderRef = (0, _react.useRef)(null);
  const amplitudesRef = (0, _react.useRef)([]);
  const isRecordingRef = (0, _react.useRef)(false);
  const [isRecording, setIsRecording] = (0, _react.useState)(false);
  const [bars, setBars] = (0, _react.useState)([]);
  (0, _react.useEffect)(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      const raw = amplitudesRef.current.slice(-_constants.MAX_BARS);
      setBars(raw.map(_helpers.amplitudeToBarHeight));
    }, 80);
    return () => clearInterval(interval);
  }, [isRecording]);
  (0, _react.useEffect)(() => {
    return () => {
      if (recorderRef.current && isRecordingRef.current) {
        try {
          recorderRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);
  const createRecorder = () => {
    const recorder = new _reactNativeAudioApi.AudioRecorder();
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
    const permission = await _reactNativeAudioApi.AudioManager.requestRecordingPermissions();
    if (permission !== 'Granted') return;
    await _reactNativeAudioApi.AudioManager.setAudioSessionOptions({
      iosCategory: 'record',
      iosMode: 'default',
      iosOptions: []
    });
    await _reactNativeAudioApi.AudioManager.setAudioSessionActivity(true);
    amplitudesRef.current = [];
    setBars([]);
    isRecordingRef.current = true;
    const recorder = createRecorder();
    recorderRef.current = recorder;
    const startResult = recorder.start();
    if (startResult?.status === 'error') {
      isRecordingRef.current = false;
      recorderRef.current = null;
      await _reactNativeAudioApi.AudioManager.setAudioSessionActivity(false);
      return;
    }
    setIsRecording(true);
  };
  const stop = async () => {
    if (!recorderRef.current) return;
    isRecordingRef.current = false;
    setIsRecording(false);
    const stopResult = recorderRef.current.stop();
    await _reactNativeAudioApi.AudioManager.setAudioSessionActivity(false);
    const output = {
      uri: stopResult?.paths?.[0],
      duration: stopResult?.duration,
      size: stopResult?.size,
      amplitudes: (0, _helpers.generateBars)(amplitudesRef.current)
    };
    recorderRef.current = null;
    setBars([]);
    onStop?.(output);
  };
  (0, _react.useImperativeHandle)(ref, () => ({
    start,
    stop
  }));
  const totalWidth = _constants.MAX_BARS * (_constants.BAR_WIDTH + _constants.GAP);
  const defaultWaveform = () => /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeSvg.default, {
    height: _constants.HEIGHT,
    width: totalWidth - 32,
    children: bars?.map((h, i) => /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativeSvg.Rect, {
      x: i * (_constants.BAR_WIDTH + _constants.GAP),
      y: (_constants.HEIGHT - h) / 2,
      width: _constants.BAR_WIDTH,
      height: h,
      fill: isRecording ? recordingFillColor : idleFillColor
    }, i))
  });
  const defaultIcon = () => /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Image, {
    source: isRecording ? _assets.icons.recording : _assets.icons.record,
    style: [_styles.default.iconStyle, iconStyle, {
      tintColor: isRecording ? recordingIconTint : recordIconTint
    }]
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.View, {
    style: [_styles.default.container, style],
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
      style: [_styles.default.waveWrap, waveformStyle],
      children: renderWaveform ? renderWaveform(bars, isRecording) : defaultWaveform()
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Pressable, {
      onPressIn: start,
      onPressOut: stop,
      style: [_styles.default.btn, {
        borderWidth: 2,
        borderColor: isRecording ? recordingBorderColor : idleBorderColor
      }, buttonStyle],
      children: renderIcon ? renderIcon(isRecording) : defaultIcon()
    })]
  });
});
var _default = exports.default = RecordingWaveform;
//# sourceMappingURL=index.js.map