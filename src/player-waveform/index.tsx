import React, {
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Sound from 'react-native-sound';
import Svg, { Rect } from 'react-native-svg';
import { downsampleWithPeaks, formatTime } from './../helpers';
import {
  BAR_WIDTH_FIXED,
  GAP_FIXED,
  HEIGHT,
  VISIBLE_BARS,
} from './../constants';
import { icons } from './../assets';
import styles from './styles';
import { useWaveformBars } from './../hooks';
import { colors, ThemeColors } from '../theme';

Sound.setCategory('Playback', true);

type Props = {
  uri: string;
  bars?: number[];
  onProgress?: (current: number, duration: number) => void;
  onFinish?: () => void;
  sent?: boolean;
  widthPercent?: number;
  seekDotColor?: string;
  filledSeekColor?: string;
  seekColor?: string;
  theme?: {
    sent?: ThemeColors;
    received?: ThemeColors;
  };
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  timerStyle?: ViewStyle;
  speedStyle?: ViewStyle;
  timerTextStyle?: TextStyle;
  speedTextStyle?: TextStyle;
  renderPlayPause?: (isPlaying: boolean) => ReactNode;
  playButtonStyle?: ViewStyle;
  playIconStyle?: ImageStyle;
  playIconTintColor?: string;
  pauseIconTintColor?: string;
  minLoaderDuration?: number;
};

type PlayerRef = {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
};

const defaultSentColors: ThemeColors = {
  backgroundColor: colors.lightGreen,
  waveformBg: colors.rgba002,
  waveformFg: colors.darkGreen,
  scrubberDot: colors.blue,
  timerText: colors.darkGreen,
  speedButtonBg: colors.rgba005,
  speedButtonText: colors.black,
};

const defaultReceivedColors: ThemeColors = {
  backgroundColor: colors.lightGrey,
  waveformBg: colors.rgba015,
  waveformFg: colors.black,
  scrubberDot: colors.blue,
  timerText: colors.grey,
  speedButtonBg: colors.rgba005,
  speedButtonText: colors.black,
};

const PlayerWaveform = forwardRef<PlayerRef, Props>(
  (
    {
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
      containerStyle,
      // minLoaderDuration = 300,
    },
    ref,
  ) => {
    const soundRef = useRef<Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [waveformWidth, setWaveformWidth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const finishFlagRef = useRef(false);
    const isSpeedChangingRef = useRef(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef(0);
    const isPlayingRef = useRef(false);
    const isDraggingRef = useRef(false);
    const dragTargetRef = useRef(0);
    const finishLockRef = useRef(0);
    // const loadStartTimeRef = useRef(0);

    const { bars: finalBars, loading: barsLoading } = useWaveformBars(
      uri,
      barsProp,
    );
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
    const progressWidth = (currentTime / (duration || 1)) * waveformWidth;

    const stateTheme = sent
      ? (theme?.sent ?? defaultSentColors)
      : (theme?.received ?? defaultReceivedColors);
    const bgColor =
      stateTheme.backgroundColor ??
      (sent ? colors.lightGreen : colors.lightGrey);
    const waveBg =
      seekColor ??
      stateTheme.waveformBg ??
      (sent ? colors.rgba002 : colors.rgba015);
    const waveFg =
      filledSeekColor ??
      stateTheme.waveformFg ??
      (sent ? colors.darkGreen : colors.black);
    const dotColor = seekDotColor ?? stateTheme.scrubberDot ?? colors.blue;
    const timeColor =
      stateTheme.timerText ?? (sent ? colors.darkGreen : colors.grey);
    const speedBtnBg = stateTheme.speedButtonBg ?? colors.rgba005;
    const speedBtnTextColor = stateTheme.speedButtonText ?? colors.black;

    useEffect(() => {
      setIsLoading(true);
      if (soundRef.current) {
        soundRef.current.stop();
        soundRef.current.release();
      }
      const cleanPath = uri?.replace('file://', '');

      const sound = new Sound(cleanPath, '', (err: Error | null) => {
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
          if (actualTime > 0.05 || (actualTime === 0 && duration === 0)) {
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
        const isAtEnd =
          Math.abs(currentTime - duration) < 0.1 ||
          currentTime >= duration - 0.05;

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

    const seek = async (seconds: number) => {
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
      setTimeout(() => (isSpeedChangingRef.current = false), 150);
    };

    useEffect(() => {
      return () => {
        stopTimer();
        soundRef.current?.stop();
        soundRef.current?.release();
        soundRef.current = null;
      };
    }, []);

    const gesture = Gesture.Pan()
      .runOnJS(true)
      .onStart(() => {
        if (isLoading || !soundRef.current) return;

        setIsDragging(true);
        isDraggingRef.current = true;
        stopTimer();
      })
      .onUpdate(e => {
        if (isLoading || !soundRef.current || waveformWidth === 0) return;
        let pos = e.x / waveformWidth;
        pos = Math.min(1, Math.max(0, pos));
        const newTime = pos * duration;
        setCurrentTime(newTime);
        dragTargetRef.current = newTime;
      })
      .onEnd(async () => {
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

    useImperativeHandle(ref, () => ({ play, pause, seek }));

    const renderDefaultPlayPause = () => {
      const icon = isPlaying ? icons.pause : icons.play;
      const tint = isPlaying ? pauseIconTintColor : playIconTintColor;
      const loaderVisible = isLoading || barsLoading;
      return (
        <Pressable
          onPress={togglePlayPause}
          style={[styles.playBtn, playButtonStyle]}
          disabled={loaderVisible}
        >
          <Image
            source={icon}
            style={[
              styles.iconStyle,
              playIconStyle,
              !isPlaying && { right: -2 },
            ]}
            tintColor={tint}
          />
        </Pressable>
      );
    };

    const showSpinner = isLoading || barsLoading;

    return (
      <View
        style={[
          styles.outer,
          {
            width: `${widthPercent}%`,
            alignSelf: 'flex-end',
            ...containerStyle,
          },
        ]}
      >
        <View
          style={[styles.container, { backgroundColor: bgColor, ...style }]}
        >
          <View style={styles.row}>
            {showSpinner ? (
              <View style={[styles.playBtn, playButtonStyle]}>
                <ActivityIndicator size={'small'} color={colors.black} />
              </View>
            ) : renderPlayPause ? (
              renderPlayPause(isPlaying)
            ) : (
              renderDefaultPlayPause()
            )}
            <GestureDetector gesture={gesture}>
              <View
                style={[styles.waveWrap, { height: HEIGHT, width: '68%' }]}
                onLayout={e => setWaveformWidth(e.nativeEvent.layout.width)}
              >
                {waveformWidth > 0 && (
                  <>
                    <Svg height={HEIGHT} width={waveformWidth}>
                      {barHeights.map((h, i) => (
                        <Rect
                          key={i}
                          x={i * (barW + gapW)}
                          y={(HEIGHT - h) / 2}
                          width={barW}
                          height={h}
                          fill={waveBg}
                        />
                      ))}
                    </Svg>
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        { width: progressWidth, overflow: 'hidden' },
                      ]}
                    >
                      <Svg height={HEIGHT} width={waveformWidth}>
                        {barHeights.map((h, i) => (
                          <Rect
                            key={i}
                            x={i * (barW + gapW)}
                            y={(HEIGHT - h) / 2}
                            width={barW}
                            height={h}
                            fill={waveFg}
                          />
                        ))}
                      </Svg>
                    </View>
                    <View
                      style={[
                        styles.scrubberDot,
                        isDragging && styles.scrubberDotDragging,
                        {
                          left: progressWidth - (isDragging ? 8 : 6),
                          top: (HEIGHT - (isDragging ? 16 : 12)) / 2,
                          backgroundColor: dotColor,
                        },
                      ]}
                    />
                  </>
                )}
              </View>
            </GestureDetector>
            <Pressable
              onPress={changeSpeed}
              style={[
                styles.speedBtn,
                { backgroundColor: speedBtnBg },
                speedStyle,
              ]}
            >
              <Text
                style={[
                  styles.speedText,
                  { color: speedBtnTextColor },
                  speedTextStyle,
                ]}
              >
                {speed}x
              </Text>
            </Pressable>
          </View>
          <View style={[styles.timeRow, timerStyle]}>
            <Text
              style={[styles.timeText, { color: timeColor }, timerTextStyle]}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </View>
        </View>
      </View>
    );
  },
);

export default PlayerWaveform;
