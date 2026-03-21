import { CameraManager } from './CameraManager';
import { createDetachedVideo } from './VideoUtils';

/**
 * Purpose: A global singleton registry that keeps heavy video objects alive in memory.
 * It now also acts as the Single Source of Truth for the actual hardware resolution
 * of every connected camera.
 */
export class MediaRegistry {
  static #videoElements = new Map();
  static #streams = new Map();
  static #metadata = new Map(); // NEW: Stores the true hardware configuration

  /**
   * Registers a MediaStream under a logical camera ID (e.g., "optical") and creates 
   * an off-screen video element. It also extracts and saves the true hardware resolution.
   *
   * @param {string} cameraId - Logical identifier (e.g., "optical", "thermal").
   * @param {MediaStream} stream - The active media stream.
   * @returns {HTMLVideoElement} - The bound off-screen video element.
   */
  static registerStream(cameraId, stream) {
    if (this.#videoElements.has(cameraId)) {
      console.warn(`MediaRegistry: Overwriting existing stream for "${cameraId}".`);
      this.destroyStream(cameraId);
    }

    const videoElement = createDetachedVideo(stream);
    
    // NEW: Extract the true hardware settings immediately
    const metadata = CameraManager.getStreamMetadata(stream);

    this.#videoElements.set(cameraId, videoElement);
    this.#streams.set(cameraId, stream);
    this.#metadata.set(cameraId, metadata);

    if (metadata) {
      console.log(`MediaRegistry: Registered "${cameraId}" operating at actual resolution of ${metadata.width}x${metadata.height} (${metadata.frameRate}fps)`);
    }

    return videoElement;
  }

  /**
   * @param {string} cameraId
   * @returns {HTMLVideoElement|null}
   */
  static getVideoElement(cameraId) {
    return this.#videoElements.get(cameraId) || null;
  }

  static getStream(cameraId) {
    return this.#streams.get(cameraId) || null;
  }

  /**
   * Retrieves the actual hardware resolution and settings of the registered camera.
   * This allows any component to know the exact dimensions of the feed without querying the DOM.
   * * @param {string} cameraId 
   * @returns {{ width: number, height: number, frameRate: number, aspectRatio: number, deviceId: string } | null}
   */
  static getMetadata(cameraId) {
    return this.#metadata.get(cameraId) || null;
  }

  /**
   * Stops the stream, releases the video element, and removes all references from the registry.
   *
   * @param {string} cameraId
   * @returns {boolean} - True if anything was destroyed, false if the ID was not registered.
   */
  static destroyStream(cameraId) {
    const stream = this.#streams.get(cameraId);
    const videoElement = this.#videoElements.get(cameraId);

    if (!stream && !videoElement) return false;

    if (stream) CameraManager.stopStream(stream);

    if (videoElement) {
      videoElement.pause();
      videoElement.srcObject = null;
      videoElement.removeAttribute('src');
      videoElement.load();
    }

    this.#videoElements.delete(cameraId);
    this.#streams.delete(cameraId);
    this.#metadata.delete(cameraId); // Clean up the metadata

    return true;
  }
}