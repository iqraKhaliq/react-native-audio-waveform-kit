import React, { ReactNode } from 'react';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';
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
declare const RecordingWaveform: React.ForwardRefExoticComponent<Props & React.RefAttributes<RecordingWaveformRef>>;
export default RecordingWaveform;
//# sourceMappingURL=index.d.ts.map