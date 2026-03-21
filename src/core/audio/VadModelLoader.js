import { env } from "onnxruntime-web";

export class VadModelLoader {
  static loadingPromise = null;
  static isReady = false;

  // Swapped to CDN paths
  static CDN_PATHS = {
    baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/",
    onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
    _modelURL: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/silero_vad.onnx", // used for health check
  };

  static async initialize() {
    if (this.isReady) return this.CDN_PATHS;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this._setupEnvironment();
    return this.loadingPromise;
  }

  static async _setupEnvironment() {
    try {
      // 1. Tell ONNX runtime where to find .wasm files on the CDN
      env.wasm.wasmPaths = this.CDN_PATHS.onnxWASMBasePath;

      // 2. Force single-threading (avoids SharedArrayBuffer/COOP header issues)
      env.wasm.numThreads = 1;

      // 3. HEAD check only — ensure the CDN is reachable and the model exists
      const response = await fetch(this.CDN_PATHS._modelURL, { method: "HEAD" });
      if (!response.ok) {
        throw new Error(`VAD model not found on CDN at ${this.CDN_PATHS._modelURL}`);
      }

      this.isReady = true;
      this.loadingPromise = null; // clear so GC can reclaim
      return this.CDN_PATHS;
    } catch (error) {
      console.error("VadModelLoader: Failed to initialize VAD assets from CDN", error);
      this.loadingPromise = null;
      throw error;
    }
  }
}