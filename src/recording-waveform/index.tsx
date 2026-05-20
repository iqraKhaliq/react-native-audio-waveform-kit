import React, {
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useSharedValue } from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import { BAR_WIDTH, GAP, HEIGHT, MAX_BARS } from '../constants';
import {
  amplitudeToBarHeight,
  formatRecordingTime,
  RecordingService,
} from '../helpers';
import { icons } from './../assets';
import styles from './styles';
import { colors } from '../theme';

type Props = {
  onStop?: (output: any) => void;
  onCancel?: () => void;
  style?: StyleProp<ViewStyle>;
  waveformStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<any>;
  recordingIconTint?: string;
  recordIconTint?: string;
  recordingFillColor?: string;
  idleFillColor?: string;
  recordingBorderColor?: string;
  idleBorderColor?: string;
  renderIcon?: (isRecording: boolean) => ReactNode;
  renderWaveform?: (bars: number[], isRecording: boolean) => ReactNode;
  showTimer?: boolean;
  timerStyle?: StyleProp<ViewStyle>;
  timerTextStyle?: StyleProp<TextStyle>;
  renderTimer?: (elapsedSeconds: number) => ReactNode;
  cancelThreshold?: number;
  slideUpThreshold?: number;
};

export type RecordingWaveformRef = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  cancel: () => Promise<void>;
};

const RecordingWaveform = forwardRef<RecordingWaveformRef, Props>(
  (
    {
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
      slideUpThreshold = 20,
    },
    ref,
  ) => {
    const service = RecordingService.getInstance();
    const [isRecording, setIsRecording] = useState(false);
    const [bars, setBars] = useState<number[]>([]);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
        },
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
        },
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

    const pan = Gesture.Pan()
      .onStart(() => {
        if (!isRecording) {
          panActiveRef.value = true;
          panActiveDragRef.value = false;
        }
      })
      .onUpdate(event => {
        const dy = event.translationY;
        const dx = event.translationX;
        if (
          !isRecording &&
          !startedByPanRef.value &&
          dy < -slideUpThreshold &&
          dx === 0
        ) {
          startedByPanRef.value = true;
          scheduleOnRN(startRecording);
        }

        if (
          isRecording &&
          !cancelTriggeredRef.value &&
          !panActiveDragRef.value &&
          dx <= -cancelThreshold &&
          Math.abs(dy) <= 25
        ) {
          scheduleOnRN(cancelRecording);
        }
      })
      .onEnd(() => {
        panActiveRef.value = false;
        startedByPanRef.value = false;
        panActiveDragRef.value = true;
      });

    const longPress = Gesture.LongPress()
      .minDuration(600)
      .onStart(() => {
        if (!isRecording && !startedByPanRef.value) {
          scheduleOnRN(startRecording);
        }
      })
      .onEnd(() => {
        scheduleOnRN(stopRecording);
      });

    const slideAndHold = Gesture.Simultaneous(pan, longPress);
    const gesture = Gesture.Race(tap, slideAndHold);

    useImperativeHandle(ref, () => ({
      start: startRecording,
      stop: stopRecording,
      cancel: cancelRecording,
    }));

    const totalWidth = MAX_BARS * (BAR_WIDTH + GAP);

    const defaultWaveform = () => (
      <Svg height={HEIGHT} width={totalWidth - 32}>
        {bars.map((h, i) => (
          <Rect
            key={i}
            x={i * (BAR_WIDTH + GAP)}
            y={(HEIGHT - h) / 2}
            width={BAR_WIDTH}
            height={h}
            fill={isRecording ? recordingFillColor : idleFillColor}
          />
        ))}
      </Svg>
    );

    const defaultIcon = () => {
      const iconSource = isRecording ? icons.recording : icons.record;
      const tint = isRecording ? recordingIconTint : recordIconTint;
      return (
        <Image
          source={iconSource}
          style={[styles.iconStyle, iconStyle, { tintColor: tint }]}
        />
      );
    };

    const defaultTimer = () => (
      <Text style={[styles.timerText, timerTextStyle]}>
        {formatRecordingTime(elapsedSeconds)}
      </Text>
    );

    const buttonContent = renderIcon ? renderIcon(isRecording) : defaultIcon();

    const timerDisplay = renderTimer
      ? renderTimer(elapsedSeconds)
      : defaultTimer();

    return (
      <GestureHandlerRootView style={[styles.container, style]}>
        <View style={[styles.waveWrap, waveformStyle]}>
          {renderWaveform
            ? renderWaveform(bars, isRecording)
            : defaultWaveform()}
          {isRecording && showTimer && (
            <View style={styles.timerRow}>
              <Pressable
                onPress={cancelRecording}
                hitSlop={{ left: 20, right: 20, top: 20, bottom: 20 }}
              >
                <Image source={icons.delete} style={styles.deleteIcon} />
              </Pressable>
              <View style={[styles.timerContainer, timerStyle]}>
                {timerDisplay}
              </View>
            </View>
          )}
        </View>
        <View style={styles.rightSection}>
          <GestureDetector gesture={gesture}>
            <View
              style={[
                styles.btn,
                {
                  borderWidth: 2,
                  borderColor: isRecording
                    ? recordingBorderColor
                    : idleBorderColor,
                },
                buttonStyle,
              ]}
            >
              {buttonContent}
            </View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    );
  },
);

export default RecordingWaveform;
