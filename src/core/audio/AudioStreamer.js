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
}
