export class TTSEngine {
  /**
   * @param {Function} onStart - Fires when the AI begins speaking
   * @param {Function} onEnd - Fires when the AI finishes speaking
   */
  constructor(onStart, onEnd) {
    this.onStart = onStart;
    this.onEnd = onEnd;
    this.synth = window.speechSynthesis;
    this.selectedVoice = null;
    
    // Attempt to load voices immediately
    this._loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = this._loadVoices.bind(this);
    }
  }

  _loadVoices() {
    const voices = this.synth.getVoices();
    if (voices.length === 0) return;

    // Try to find a high-quality native English voice
    this.selectedVoice = 
      voices.find(v => v.name.includes("Google US English")) ||
      voices.find(v => v.name.includes("Samantha")) || 
      voices.find(v => v.lang === "en-US") || 
      voices[0];
  }

  /**
   * Speaks a string of text. If already speaking, it cancels the previous speech.
   * @param {string} text - The AI's response
   */
  speak(text) {
    if (!this.synth) return;
    if (!text) return;

    // Interrupt previous speech (Barge-in support)
    this.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    
    // Tuning the voice to sound a bit more natural
    utterance.rate = 1.0; 
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      if (this.onStart) this.onStart();
    };

    utterance.onend = () => {
      if (this.onEnd) this.onEnd();
    };

    utterance.onerror = (e) => {
      // Ignore 'interrupted' errors, as we trigger those intentionally on barge-in
      if (e.error !== "interrupted") {
        console.error("TTSEngine Error:", e);
      }
      if (this.onEnd) this.onEnd();
    };

    this.synth.speak(utterance);
  }

  /**
   * Instantly stops the AI from talking.
   */
  cancel() {
    if (this.synth.speaking || this.synth.pending) {
      this.synth.cancel();
    }
  }
}