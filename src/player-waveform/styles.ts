import { StyleSheet } from 'react-native';
import { colors } from '../theme';

const styles = StyleSheet.create({
  outer: { marginVertical: 8 },
  container: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  waveWrap: { position: 'relative' },
  speedBtn: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  speedText: { fontSize: 12, fontWeight: '600' },
  timeRow: { alignItems: 'flex-end', marginTop: 4 },
  timeText: { fontSize: 10, fontWeight: '500' },
  scrubberDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  scrubberDotDragging: {
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  iconStyle: {
    height: 16,
    width: 16,
    resizeMode: 'contain',
  },
});

export default styles;
