export class SimpleVAD {
  constructor({
    onSpeechStart,
    onSpeechEnd,
    onAudioFrame,
    energyThreshold = 0.01,
    silenceDurationMs = 800
  }) {
    this.onSpeechStart = onSpeechStart;
    this.onSpeechEnd = onSpeechEnd;
    this.onAudioFrame = onAudioFrame;

    this.energyThreshold = energyThreshold;
    this.silenceDurationMs = silenceDurationMs;

    this.speaking = false;
    this.lastVoiceTime = 0;
  }

  process(audioBuffer, timestamp) {
    const rms = this.computeRMS(audioBuffer);

    if (rms > this.energyThreshold) {
      this.lastVoiceTime = timestamp;

      if (!this.speaking) {
        this.speaking = true;
        this.onSpeechStart?.();
      }

      this.onAudioFrame?.(audioBuffer);
    } else if (
      this.speaking &&
      timestamp - this.lastVoiceTime > this.silenceDurationMs
    ) {
      this.speaking = false;
      this.onSpeechEnd?.();
    }
  }

  computeRMS(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }
}
