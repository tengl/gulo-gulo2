import { RECORDING_DURATION } from '../domain/score';

// SPEL-003: the real recording is the master clock. No frame-based sequencer.
// AudioBufferSourceNode gives sample-accurate looping and resumes at the same
// sample after a pause; muting leaves that timeline running.
export class Waltz {
  private context: AudioContext;
  private master: GainNode;
  private source: AudioBufferSourceNode | null = null;
  private buffer: AudioBuffer | null = null;
  private loading: Promise<AudioBuffer> | null = null;
  private abort = new AbortController();
  private epoch = 0;
  private offset = 0;
  private version = 0;
  private disposed = false;

  constructor() {
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.65;
    this.master.connect(this.context.destination);
  }
  private async load() {
    // MP3 is a fallback for browsers unable to decode Vorbis. Both are local.
    for (const extension of ['ogg', 'mp3']) {
      try {
        const response = await fetch(`/game/blue-danube.${extension}`, { signal: this.abort.signal });
        if (!response.ok) throw new Error('Inspelningen kunde inte hämtas.');
        return await this.context.decodeAudioData(await response.arrayBuffer());
      } catch (error) {
        if (this.abort.signal.aborted || extension === 'mp3') throw error;
      }
    }
    throw new Error('Inspelningen kunde inte avkodas.');
  }
  async resume(time: number) {
    const version = ++this.version;
    // Called directly from the start button, before the first network await.
    await this.context.resume();
    this.loading ??= this.load();
    this.buffer = await this.loading;
    if (this.disposed || version !== this.version) return;
    this.source?.stop();
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.loop = true;
    source.loopEnd = RECORDING_DURATION;
    source.connect(this.master);
    source.onended = () => source.disconnect();
    this.offset = time;
    this.epoch = this.context.currentTime + 0.04;
    source.start(this.epoch, time % RECORDING_DURATION);
    this.source = source;
  }
  time() {
    return this.source ? this.offset + Math.max(0, this.context.currentTime - this.epoch) : this.offset;
  }
  pause() {
    this.offset = this.time();
    this.version++;
    this.source?.stop(); this.source = null;
  }
  mute(muted: boolean) {
    this.master.gain.setTargetAtTime(muted ? 0 : 0.65, this.context.currentTime, 0.025);
  }
  close() {
    this.pause(); this.disposed = true; this.abort.abort();
    this.master.disconnect(); void this.context.close();
  }
}
