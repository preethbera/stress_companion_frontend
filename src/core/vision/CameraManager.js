export class CameraManager {
  /**
   * Fetches a list of all available video input devices (cameras).
   * @returns {Promise<MediaDeviceInfo[]>}
   */
  static async getVideoDevices() {
    try {
      // Force hardware awake so the browser can read accurate device labels
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error("CameraManager: Failed to enumerate video devices", error);
      return [];
    }
  }

  /**
   * Requests a MediaStream from the browser using ideal constraints.
   * * Note: The resolution provided in options is a request, not a guarantee. 
   * The browser will return the closest match the hardware can provide.
   * * @param {string|null} deviceId - Physical ID of the camera.
   * @param {Object} options - Requested resolution and framerate.
   * @returns {Promise<MediaStream>}
   */
  static async getStream(deviceId, options = {}) {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("CameraManager: Browser API is not supported.");
    }

    const { width = 1280, height = 720, frameRate = 30 } = options;
    const constraints = {
      video: {
        width: { ideal: width },
        height: { ideal: height },
        frameRate: { ideal: frameRate },
        ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "user" })
      },
      audio: false
    };

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.error(`CameraManager: Failed to get stream for device ${deviceId}`, error);
      throw error;
    }
  }

  /**
   * NEW: Extracts the actual, negotiated hardware resolution and settings from an active stream.
   * This is critical for making the app camera-agnostic.
   * * @param {MediaStream} stream 
   * @returns {Object|null} - The actual hardware configuration of the stream.
   */
  static getStreamMetadata(stream) {
    if (!stream) return null;
    
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return null;

    const settings = videoTrack.getSettings();
    
    return {
      width: settings.width || 0,
      height: settings.height || 0,
      frameRate: settings.frameRate || 0,
      aspectRatio: settings.aspectRatio || (settings.width / settings.height) || 1,
      deviceId: settings.deviceId
    };
  }

  /**
   * Safely stops all tracks associated with a MediaStream to free up hardware.
   * @param {MediaStream} stream 
   */
  static stopStream(stream) {
    if (!stream) return;
    stream.getTracks().forEach(track => track.stop());
  }
}