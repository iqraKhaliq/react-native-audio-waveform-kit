"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNative = require("react-native");
var _theme = require("../theme");
const styles = _reactNative.StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  waveWrap: {
    overflow: 'hidden',
    width: '85%',
    paddingHorizontal: 12,
    borderRadius: 12,
    paddingVertical: 6,
    alignItems: 'center',
    flexDirection: 'column'
  },
  btn: {
    borderRadius: 40,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconStyle: {
    height: 22,
    width: 22,
    resizeMode: 'contain'
  },
  timerContainer: {
    alignSelf: 'flex-end'
  },
  timerText: {
    fontSize: 12,
    fontWeight: '500',
    color: _theme.colors.black
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
    width: '100%'
  },
  deleteIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    tintColor: _theme.colors.red
  },
  lockZone: {
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  lockIndicator: {
    marginBottom: 8,
    backgroundColor: _theme.colors.rgba006,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  lockIndicatorText: {
    color: _theme.colors.white,
    fontSize: 12,
    fontWeight: '600'
  },
  lockHintContainer: {
    marginBottom: 8,
    backgroundColor: _theme.colors.rgba006,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16
  },
  lockHintText: {
    color: _theme.colors.white,
    fontSize: 12,
    fontWeight: '500'
  },
  lockContainer: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    width: 24
  },
  lockIcon: {
    fontSize: 20,
    fontWeight: '600'
  },
  hintContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center'
  },
  rightSection: {
    alignItems: 'center',
    flexDirection: 'column',
    minHeight: 70
  },
  hintContainerLeft: {
    position: 'absolute',
    bottom: 50,
    left: -50,
    alignItems: 'center'
  },
  hintText: {
    backgroundColor: _theme.colors.rgba007,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    color: _theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden'
  }
});
var _default = exports.default = styles;
//# sourceMappingURL=styles.js.map