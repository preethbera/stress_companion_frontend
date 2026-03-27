export class AudioStreamer {
  /**
   * Fetches a list of all available audio input devices.
   * @returns {Promise<MediaDeviceInfo[]>}
   */
  static async getMicrophones() {
    try {
      // 1. Request permissions to ensure device labels are populated by the browser
      const tempStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // 2. Immediately stop the temporary tracks so the browser recording indicator turns off
      tempStream.getTracks().forEach((track) => track.stop());

      // 3. Fetch all devices
      const devices = await navigator.mediaDevices.enumerateDevices();

      // 4. Filter for audio inputs and strip out OS/Browser virtual endpoints
      return devices.filter((device) => {
        return (
          device.kind === "audioinput" &&
          device.deviceId &&
          device.deviceId !== "default" &&
          device.deviceId !== "communications" &&
          // Safety check in case permissions fail and labels are empty strings
          (!device.label ||
            (!device.label.startsWith("Default - ") &&
              !device.label.startsWith("Communications - ")))
        );
      });
    } catch (error) {
      console.error("AudioStreamer: Failed to enumerate microphones", error);
      return [];
    }
  }

  /**
   * Requests a MediaStream for a specific microphone.
   * @param {string} deviceId - The specific mic ID
   * @param {object} options - Optional overrides (echoCancellation, noiseSuppression)
   * @returns {Promise<MediaStream>}
   */
  static async getStream(deviceId, options = {}) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("AudioStreamer: Browser API is not supported.");
    }

    // Defaulting to browser-level optimizations which are usually helpful for VAD
    const {
      echoCancellation = true,
      noiseSuppression = true,
      autoGainControl = true,
    } = options;

    const constraints = {
      audio: {
        echoCancellation,
        noiseSuppression,
        autoGainControl,
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      },
      video: false,
    };

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.error(
        `AudioStreamer: Failed to get stream for mic ${deviceId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Safely completely kills an audio stream.
   * @param {MediaStream} stream
   */
  static stopStream(stream) {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }

  /**
   * Creates a pure JS volume analyzer tuned for human speech detection.
   * @param {MediaStream} stream
   * @returns {object} Object with getVolume() returning a normalized, smoothed value (0-1) and stop()
   */
  static createVolumeAnalyzer(stream) {
    const audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
    const analyzer = audioContext.createAnalyser();

    // 512 gives us slightly better frequency resolution than 256
    analyzer.fftSize = 512;
    // Built-in audio context smoothing (0.8 is a good default for UI responsiveness)
    analyzer.smoothingTimeConstant = 0.8;

    let source;
    try {
      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyzer);
    } catch (err) {
      console.error("AudioStreamer: Failed to connect stream to analyzer", err);
    }

    const dataArray = new Uint8Array(analyzer.frequencyBinCount);

    // We will keep track of a smoothed volume for fluid UI animations
    let smoothedVolume = 0;

    return {
      getVolume: () => {
        analyzer.getByteFrequencyData(dataArray);

        // 1. Target Human Voice Frequencies (~250Hz to ~3000Hz)
        // At a typical 44.1kHz sample rate, with fftSize 512, each bin represents ~86Hz.
        // Bin 3 (~250Hz) to Bin 35 (~3000Hz) captures the core of human speech.
        const startBin = 3;
        const endBin = 35;

        let sum = 0;
        for (let i = startBin; i <= endBin; i++) {
          sum += dataArray[i];
        }

        const numBins = endBin - startBin + 1;
        const averageEnergy = sum / numBins; // Value between 0 and 255

        // 2. Apply a Noise Gate
        // A quiet room usually hovers around an energy level of 10-30.
        // We ignore anything below this threshold.
        const noiseGate = 35;
        const maxExpectedEnergy = 150; // Normal speaking volume usually peaks around here

        let normalizedVolume = 0;
        if (averageEnergy > noiseGate) {
          // Scale the value from 0 to 1 based on our expected voice range
          normalizedVolume =
            (averageEnergy - noiseGate) / (maxExpectedEnergy - noiseGate);
          // Clamp the value to ensure it never exceeds 1 or drops below 0
          normalizedVolume = Math.min(1, Math.max(0, normalizedVolume));
        }

        // 3. Smooth the UI Output (Exponential Moving Average)
        // This prevents the visualizer from dropping to 0 instantly between words
        // Adjust the multipliers (e.g., 0.7/0.3) to make it faster or slower
        smoothedVolume = smoothedVolume * 0.7 + normalizedVolume * 0.3;

        // For very tiny lingering decimals, snap it to 0
        if (smoothedVolume < 0.01) smoothedVolume = 0;

        return smoothedVolume;
      },
      stop: () => {
        if (source) source.disconnect();
        analyzer.disconnect();
        if (audioContext.state !== "closed") {
          audioContext.close().catch(console.error);
        }
      },
    };
  }
}
