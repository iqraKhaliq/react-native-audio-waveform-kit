import React, { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
type Props = {
    onStop?: (output: any) => void;
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
};
declare const RecordingWaveform: React.ForwardRefExoticComponent<Props & React.RefAttributes<any>>;
export default RecordingWaveform;
//# sourceMappingURL=index.d.ts.map