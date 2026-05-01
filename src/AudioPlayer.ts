import { AudioContext, AudioBuffer, AudioBufferSourceNode, GainNode } from 'react-native-audio-api';

export default class AudioPlayer {
    private audioContext: AudioContext;
    private sourceNode: AudioBufferSourceNode | null = null;
    private gainNode: GainNode | null = null;
    private audioBuffer: AudioBuffer | null = null;
    private isPlaying = false;
    private currentPosition = 0;
    private playbackRate = 1;
    private volume = 1;
    private onProgressCallback: ((current: number, duration: number) => void) | null = null;
    private onFinishCallback: (() => void) | null = null;

    constructor() {
        this.audioContext = new AudioContext();
    }

    async load(uri: string): Promise<void> {
        const buffer = await this.audioContext.decodeAudioData(uri);
        this.audioBuffer = buffer;
        this.currentPosition = 0;
    }

    async play(): Promise<void> {
        if (this.isPlaying || !this.audioBuffer) return;
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.sourceNode = this.audioContext.createBufferSource({ pitchCorrection: true });
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.playbackRate.value = this.playbackRate;

        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.volume;
        this.sourceNode.connect(this.gainNode).connect(this.audioContext.destination);

        this.sourceNode.onPositionChanged = (event) => {
            this.currentPosition = event.value;
            this.onProgressCallback?.(this.currentPosition, this.getDuration());
        };
        this.sourceNode.onPositionChangedInterval = 100;

        this.sourceNode.onEnded = () => {
            this.isPlaying = false;
            this.currentPosition = this.getDuration();
            this.onProgressCallback?.(this.currentPosition, this.getDuration());
            this.onFinishCallback?.();
        };

        this.sourceNode.start(this.audioContext.currentTime, this.currentPosition);
        this.isPlaying = true;
    }

    async pause(): Promise<void> {
        if (!this.isPlaying) return;
        this.sourceNode?.stop(this.audioContext.currentTime);
        await this.audioContext.suspend();
        this.isPlaying = false;
    }

    async stop(): Promise<void> {
        if (this.sourceNode) {
            this.sourceNode.stop(this.audioContext.currentTime);
            this.sourceNode = null;
        }
        this.isPlaying = false;
        this.currentPosition = 0;
    }

    async seek(seconds: number): Promise<void> {
        if (!this.audioBuffer) return;
        const newPos = Math.min(Math.max(0, seconds), this.getDuration());
        this.currentPosition = newPos;
        if (this.isPlaying) {
            await this.pause();
            await this.play();
        }
    }

    setPlaybackRate(rate: number): void {
        this.playbackRate = rate;
        if (this.sourceNode) {
            this.sourceNode.playbackRate.value = rate;
        }
    }

    setVolume(vol: number): void {
        this.volume = vol;
        if (this.gainNode) {
            this.gainNode.gain.value = vol;
        }
    }

    getCurrentTime(): number {
        return this.currentPosition;
    }

    getDuration(): number {
        return this.audioBuffer?.duration ?? 0;
    }

    isPlayingState(): boolean {
        return this.isPlaying;
    }

    onProgress(cb: (current: number, duration: number) => void) {
        this.onProgressCallback = cb;
    }

    onFinish(cb: () => void) {
        this.onFinishCallback = cb;
    }

    release(): void {
        this.stop();
        this.audioContext.close();
    }
}