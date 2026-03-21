import { MicVAD } from "@ricky0123/vad-web";

export class VadEngine {
  // Private fields to prevent accidental external mutation
  #vadInstance = null;
  #stream = null;
  #starting = false;
  #cancelled = false;
  #callbacks;

  constructor(callbacks = {}) {
    this.#callbacks = callbacks;
  }

  // Observable state for the UI/Hook
  get isRunning() {
    return !!this.#vadInstance;
  }

async start(stream) {
    if (this.#vadInstance || this.#starting) {
      console.warn("VadEngine: Already running or starting.");
      return;
    }
    if (!stream) throw new Error("VadEngine: No audio stream provided.");

    this.#starting = true;
    this.#cancelled = false;
    this.#stream = stream;

    try {
      const instance = await MicVAD.new({
        stream: this.#stream,
        model: "v5",
        
        // --- 1. FORCE CDN FOR VAD MODEL & WORKLET ---
        // This stops Vite from looking for ./silero_vad_v5.onnx locally
        baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/",
        workletURL: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/vad.worklet.bundle.min.js",

        // --- 2. FORCE CDN FOR ONNX RUNTIME ---
        // This completely bypasses Vite's node_modules/.vite/deps/ crashes
        ortConfig: (ort) => { 
          ort.env.wasm.numThreads = 1; 
          ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";
        },
        
        // --- ENGINE TUNING ---
        positiveSpeechThreshold: 0.65,
        negativeSpeechThreshold: 0.4,
        minSpeechMs: 100,
        preSpeechPadMs: 300,
        redemptionMs: 1000,
        
        // --- SAFE CALLBACKS ---
        onSpeechStart: () => this.#safeCall("onSpeechStart"),
        onSpeechEnd: (audio) => this.#safeCall("onSpeechEnd", audio),
        onVADMisfire: () => this.#safeCall("onMisfire"),
      });

      if (this.#cancelled) {
        instance.destroy?.();
        return;
      }

      this.#vadInstance = instance;
      this.#vadInstance.start();
      
    } catch (err) {
      console.error("VadEngine: Failed to start", err);
      throw err;
    } finally {
      this.#starting = false;
    }
  }

  stop() {
    this.#cancelled = true;

    if (this.#vadInstance) {
      if (typeof this.#vadInstance.destroy === "function") {
        this.#vadInstance.destroy();
      } else {
        this.#vadInstance.pause?.();
        console.warn("VadEngine: destroy() unavailable — possible memory leak.");
      }
      this.#vadInstance = null;
    }

    // 3. We NO LONGER stop the tracks here. 
    // useVoiceAgent owns the stream lifecycle. We just drop the reference.
    this.#stream = null;
  }

  /**
   * Safely executes callbacks so errors don't crash the VAD WASM internals.
   */
  #safeCall(name, ...args) {
    try {
      this.#callbacks[name]?.(...args);
    } catch (err) {
      console.error(`VadEngine: callback "${name}" threw`, err);
    }
  }
}