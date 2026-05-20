import { StyleSheet } from 'react-native';
import { colors } from '../theme';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waveWrap: {
    overflow: 'hidden',
    width: '85%',
    paddingHorizontal: 12,
    borderRadius: 12,
    paddingVertical: 6,
    alignItems: 'center',
    flexDirection: 'column',
  },
  btn: {
    borderRadius: 40,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconStyle: {
    height: 22,
    width: 22,
    resizeMode: 'contain',
  },
  timerContainer: {
    alignSelf: 'flex-end',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.black,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
    width: '100%',
  },
  deleteIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    tintColor: colors.red,
  },
  lockZone: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  lockIndicator: {
    marginBottom: 8,
    backgroundColor: colors.rgba006,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  lockIndicatorText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  lockHintContainer: {
    marginBottom: 8,
    backgroundColor: colors.rgba006,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  lockHintText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  lockContainer: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    width: 24,
  },
  lockIcon: {
    fontSize: 20,
    fontWeight: '600',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  rightSection: {
    alignItems: 'center',
    flexDirection: 'column',
    minHeight: 70,
  },
  hintContainerLeft: {
    position: 'absolute',
    bottom: 50,
    left: -50,
    alignItems: 'center',
  },
  hintText: {
    backgroundColor: colors.rgba007,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
});

export default styles;
