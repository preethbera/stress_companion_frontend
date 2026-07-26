export class SpeechService {
  /**
   * The public interface for SpeechService. 
   * Do not change these parameter signatures in future implementations.
   * @param {Function} onLiveText - Receives the continuously updating transcript
   * @param {Function} onError - Receives error objects
   */
  constructor(onLiveText, onError) {
    this.onLiveText = onLiveText;
    this.onError = onError;
    
    // Internal state (can be changed in future implementations)
    this.recognition = null;
    this.isActive = false;
    this.finalTranscript = "";
    
    this._init();
  }

  /**
   * Internal initialization. Replace this logic later when upgrading STT engines.
   */
  _init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("SpeechService: Web Speech API is not supported in this browser.");
      if (this.onError) this.onError(new Error("Browser unsupported"));
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true; 
    this.recognition.interimResults = true; 
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      let interimTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          this.finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const fullText = (this.finalTranscript + interimTranscript).trim();
      if (this.onLiveText) this.onLiveText(fullText);
    };

    this.recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error("SpeechService Error:", event.error);
        
        // Fatal errors that mean we should stop trying to restart
        if (event.error === 'network' || event.error === 'not-allowed') {
          this.isActive = false;
        }
        
        if (this.onError) this.onError(event);
      }
    };

    this.recognition.onend = () => {
      if (this.isActive) {
        try {
          this.recognition.start();
        } catch (e) {
          // Prevent crash if restarting too quickly
        }
      }
    };
  }

  /**
   * Public API: Starts the listening process.
   */
  start() {
    if (!this.recognition || this.isActive) return;
    this.isActive = true;
    try {
      this.recognition.start();
    } catch (err) {
      console.warn("SpeechService: Recognition already started.");
    }
  }

  /**
   * Public API: Stops the listening process.
   */
  stop() {
    if (!this.recognition || !this.isActive) return;
    this.isActive = false;
    this.recognition.stop();
  }

  /**
   * Public API: Wipes the current transcript buffer.
   */
  clearTranscript() {
    this.finalTranscript = "";
    if (this.onLiveText) this.onLiveText("");
  }
}