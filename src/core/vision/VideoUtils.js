/**
 * Purpose: Pure functions for video manipulation and frame extraction.
 * Note: These utilities are resolution-agnostic and rely on the intrinsic 
 * dimensions of the active video elements.
 */

/**
 * Normalizes a MediaPipe bounding box to a consistent {x, y, width, height} shape.
 *
 * MediaPipe uses `originX`/`originY` in some running modes and `x`/`y` in others.
 * This function is the single point of truth for resolving that inconsistency.
 *
 * @param {Object} boundingBox - A raw MediaPipe bounding box object.
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function normalizeBoundingBox(boundingBox) {
  return {
    x: boundingBox.originX ?? boundingBox.x,
    y: boundingBox.originY ?? boundingBox.y,
    width: boundingBox.width,
    height: boundingBox.height,
  };
}

/**
 * Takes a raw MediaStream and binds it to an off-screen HTMLVideoElement.
 * This allows the browser to process the pixel data without rendering it to the DOM.
 * * @param {MediaStream} stream
 * @returns {HTMLVideoElement}
 */
export function createDetachedVideo(stream) {
  const videoElement = document.createElement('video');

  videoElement.autoplay = true;
  videoElement.playsInline = true;
  videoElement.muted = true;
  videoElement.srcObject = stream;

  videoElement.onloadedmetadata = () => {
    videoElement.play().catch((err) => {
      console.error('VideoUtils: Error auto-playing detached video:', err);
    });
  };

  return videoElement;
}

/**
 * Draws the current frame of a video element onto an off-screen canvas and returns it as a Blob.
 * If a bounding box is provided, only that specific region is captured and exported.
 *
 * @param {HTMLVideoElement} videoElement - The video element containing the active stream.
 * @param {Object|null} [boundingBox=null] - A raw MediaPipe bounding box or a normalized {x, y, width, height}.
 * @returns {Promise<Blob>}
 */
export function extractFrameAsBlob(videoElement, boundingBox = null) {
  return new Promise((resolve, reject) => {
    try {
      // Intrinsic dimensions represent the true hardware resolution of the stream
      const { videoWidth, videoHeight } = videoElement;

      if (videoWidth === 0 || videoHeight === 0) {
        throw new Error('VideoUtils: Video dimensions are zero. Ensure the stream is playing.');
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('VideoUtils: Could not get 2D canvas context.');

      if (boundingBox) {
        const { x, y, width, height } = normalizeBoundingBox(boundingBox);

        // 1. Clamp the starting coordinates to the top-left edge of the video
        const safeX = Math.max(0, x);
        const safeY = Math.max(0, y);

        // 2. Calculate how much we shifted the box if it was off-screen (e.g., x was -10)
        const shiftX = safeX - x;
        const shiftY = safeY - y;

        // 3. Subtract that shift from the width/height to prevent grabbing non-face pixels
        const adjustedWidth = width - shiftX;
        const adjustedHeight = height - shiftY;

        // 4. Clamp the final width/height to the bottom-right edge of the video
        const safeWidth = Math.min(adjustedWidth, videoWidth - safeX);
        const safeHeight = Math.min(adjustedHeight, videoHeight - safeY);

        // Abort if the box is entirely outside the video frame
        if (safeWidth <= 0 || safeHeight <= 0) {
          throw new Error('VideoUtils: Bounding box produces zero or negative dimensions after clamping.');
        }

        canvas.width = safeWidth;
        canvas.height = safeHeight;
        
        // Draw only the safe cropped area
        ctx.drawImage(
          videoElement, 
          safeX, safeY, safeWidth, safeHeight, // Source crop
          0, 0, safeWidth, safeHeight          // Destination canvas
        );
      } else {
        // No bounding box provided: capture the entire frame
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      }

      canvas.toBlob(
        (blob) => blob
          ? resolve(blob)
          : reject(new Error('VideoUtils: canvas.toBlob() returned null.')),
        'image/jpeg',
        0.9 // High-quality JPEG compression
      );
    } catch (error) {
      reject(error);
    }
  });
}