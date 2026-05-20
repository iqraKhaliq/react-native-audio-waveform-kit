type RecordingServiceCallbacks = {
    onAmplitude?: (rms: number) => void;
    onStop?: (output: any) => void;
    onCancel?: () => void;
};
declare class RecordingService {
    private static instance;
    private recorder;
    private amplitudes;
    private isRecording;
    private callbacks;
    private isStarting;
    private constructor();
    static getInstance(): RecordingService;
    setCallbacks(callbacks: RecordingServiceCallbacks): void;
    private delay;
    start(): Promise<boolean>;
    stop(): Promise<void>;
    cancel(): Promise<void>;
    isActive(): boolean;
    getAmplitudes(): number[];
}
export default RecordingService;
//# sourceMappingURL=recording.d.ts.map