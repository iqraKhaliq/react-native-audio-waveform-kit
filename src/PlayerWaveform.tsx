import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Rect } from 'react-native-svg';
import AudioPlayer from './AudioPlayer';

const HEIGHT = 40;
const BAR_WIDTH_FIXED = 3;
const GAP_FIXED = 2;
const VISIBLE_BARS = 40;

type PlayerRef = {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
};

type Props = {
  uri: string;
  bars: number[];
  onProgress?: (current: number, duration: number) => void;
  onFinish?: () => void;
  sent?: boolean;
  widthPercent?: number;
};

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const downsampleWithPeaks = (data: number[], targetCount: number): number[] => {
  if (!data?.length) return new Array(targetCount).fill(2);
  const result = new Array(targetCount);
  const segSize = data.length / targetCount;
  for (let i = 0; i < targetCount; i++) {
    const start = Math.floor(i * segSize);
    let end = Math.floor((i + 1) * segSize);
    if (end <= start) end = start + 1;
    let maxVal = 2;
    for (let j = start; j < end && j < data.length; j++) {
      if (data[j] > maxVal) maxVal = data[j];
    }
    result[i] = maxVal;
  }
  return result;
};

const PlayerWaveform = forwardRef<PlayerRef, Props>(
  (
    { uri, bars, onProgress, onFinish, sent = true, widthPercent = 80 },
    ref,
  ) => {
    const playerRef = useRef<AudioPlayer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [waveformWidth, setWaveformWidth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const finishFlagRef = useRef(false);
    const isSpeedChangingRef = useRef(false);

    // Waveform data
    const visibleBars = useMemo(() => {
      if (!bars?.length) return new Array(VISIBLE_BARS).fill(2);
      return downsampleWithPeaks(bars, VISIBLE_BARS);
    }, [bars]);

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

    // Player lifecycle
    useEffect(() => {
      const player = new AudioPlayer();
      playerRef.current = player;
      setIsLoading(true);
      player
        .load(uri)
        .then(() => {
          setDuration(player.getDuration());
          setCurrentTime(player.getCurrentTime());
          setIsLoading(false);
        })
        .catch((err: Error) => {
          console.error('Load error', err);
          setIsLoading(false);
        });

      player.onProgress((cur, dur) => {
        setCurrentTime(cur);
        setDuration(dur);
        onProgress?.(cur, dur);
        if (cur >= dur - 0.05 && !finishFlagRef.current) {
          finishFlagRef.current = true;
          setIsPlaying(false);
          onFinish?.();
          setTimeout(() => (finishFlagRef.current = false), 500);
        }
      });

      player.onFinish(() => {
        setIsPlaying(false);
        onFinish?.();
      });

      return () => {
        player.stop();
        player.release();
        playerRef.current = null;
      };
    }, [uri]);

    // Playback controls
    const play = async () => {
      if (isSpeedChangingRef.current) return;
      const isAtEnd =
        Math.abs(currentTime - duration) < 0.1 ||
        currentTime >= duration - 0.05;
      if (isAtEnd) {
        await playerRef.current?.stop();
        await playerRef.current?.load(uri);
        await playerRef.current?.play();
      } else {
        await playerRef.current?.play();
      }
      setIsPlaying(true);
    };

    const pause = async () => {
      if (isSpeedChangingRef.current) return;
      await playerRef.current?.pause();
      setIsPlaying(false);
    };

    const seek = async (seconds: number) => {
      if (isSpeedChangingRef.current) return;
      await playerRef.current?.seek(seconds);
      setCurrentTime(seconds);
    };

    const togglePlayPause = () => (isPlaying ? pause() : play());

    const changeSpeed = async () => {
      const speeds = [1, 1.5, 2];
      const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
      if (next === speed || isSpeedChangingRef.current) return;
      isSpeedChangingRef.current = true;
      setSpeed(next);
      playerRef.current?.setPlaybackRate(next);
      setTimeout(() => (isSpeedChangingRef.current = false), 100);
    };

    const gesture = Gesture.Pan()
      .onStart(() => setIsDragging(true))
      .onUpdate(e => {
        if (waveformWidth === 0 || isSpeedChangingRef.current) return;
        let pos = e.x / waveformWidth;
        pos = Math.min(1, Math.max(0, pos));
        const newTime = pos * duration;
        seek(newTime);
      })
      .onEnd(() => setIsDragging(false));

    useImperativeHandle(ref, () => ({ play, pause, seek }));

    // Colors
    const bgColor = sent ? '#dcf8c5' : '#e5e5ea';
    const waveBg = sent ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)';
    const waveFg = sent ? '#075e54' : '#000000';
    const timeColor = sent ? '#075e54' : '#6c6c70';
    const dotColor = '#0084ff';

    const showSpinner = isLoading && !isSpeedChangingRef.current;

    return (
      <View
        style={[
          styles.outer,
          { width: `${widthPercent}%`, alignSelf: 'flex-end' },
        ]}
      >
        <View style={[styles.container, { backgroundColor: bgColor }]}>
          <View style={styles.row}>
            {showSpinner ? (
              <View style={styles.playBtn}>
                <ActivityIndicator size="small" color="#000" />
              </View>
            ) : (
              <Pressable
                onPress={togglePlayPause}
                style={styles.playBtn}
                disabled={isSpeedChangingRef.current}
              >
                <Text style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
              </Pressable>
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
            <Pressable onPress={changeSpeed} style={styles.speedBtn}>
              <Text style={styles.speedText}>{speed}x</Text>
            </Pressable>
          </View>
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: timeColor }]}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  outer: { marginVertical: 8 },
  container: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playIcon: { fontSize: 14, fontWeight: '700', color: '#000' },
  waveWrap: { position: 'relative' },
  speedBtn: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  speedText: { fontSize: 12, fontWeight: '600', color: '#000' },
  timeRow: { alignItems: 'flex-end', marginTop: 4 },
  timeText: { fontSize: 10, fontWeight: '500' },
  scrubberDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
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
});

export default PlayerWaveform;
