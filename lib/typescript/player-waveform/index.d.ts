import React, { ReactNode } from 'react';
import { ImageStyle, TextStyle, ViewStyle } from 'react-native';
type ThemeColors = {
    backgroundColor?: string;
    waveformBg?: string;
    waveformFg?: string;
    scrubberDot?: string;
    timerText?: string;
    speedButtonBg?: string;
    speedButtonText?: string;
};
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
};
type PlayerRef = {
    play: () => void;
    pause: () => void;
    seek: (seconds: number) => void;
};
declare const PlayerWaveform: React.ForwardRefExoticComponent<Props & React.RefAttributes<PlayerRef>>;
export default PlayerWaveform;
//# sourceMappingURL=index.d.ts.map