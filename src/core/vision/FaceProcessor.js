/**
 * Purpose: Handles raw detection from the AI model and applies business rules
 * for face tracking and status evaluation.
 * * Note on Resolution: This module is strictly resolution-agnostic. 
 * All tracking math (area and distance) is calculated relative to the 
 * coordinate system provided by the AI model, ensuring it works flawlessly 
 * across 4K webcams and low-res thermal cameras alike.
 */

import { normalizeBoundingBox } from './VideoUtils';

/**
 * Passes the in-memory video element to the model at a specific timestamp.
 *
 * @param {HTMLVideoElement} videoElement - The detached video element.
 * @param {Object} detector - The initialized MediaPipe FaceDetector instance.
 * @param {number} timestamp - The current timestamp in milliseconds.
 * @returns {Array<Object>} - Raw list of detected face objects.
 */
export function detectFacesInFrame(videoElement, detector, timestamp) {
  try {
    // Ensure the video has enough data to process before feeding it to the AI
    if (videoElement.readyState < 2) return [];

    const result = detector.detectForVideo(videoElement, timestamp);
    return result?.detections || [];
  } catch (error) {
    console.error('FaceProcessor: Error during detection:', error);
    return [];
  }
}

/**
 * Evaluates the number of detected faces and returns a strict status code.
 * Used to trigger UI warnings like "Multiple people detected".
 *
 * @param {Array<Object>} detections - List of detected face objects.
 * @returns {'NO_FACE' | 'SINGLE_FACE' | 'MULTIPLE_FACES'}
 */
export function getFaceCountStatus(detections) {
  if (!detections || detections.length === 0) return 'NO_FACE';
  if (detections.length === 1) return 'SINGLE_FACE';
  return 'MULTIPLE_FACES';
}

/**
 * Identifies the primary target face to maintain a stable tracking lock across frames.
 *
 * - On first detection (no prior state): picks the largest face (closest to camera).
 * - On subsequent frames: picks the face whose center is nearest to the last known position,
 * preventing the tracking box from jumping between people.
 *
 * @param {Array<Object>} detections - List of detected face objects.
 * @param {{x: number, y: number}|null} lastKnownCenter - The center coordinate from the previous frame.
 * @returns {Object|null} - The single face object to track.
 */
export function getTrackedFace(detections, lastKnownCenter = null) {
  if (!detections || detections.length === 0) return null;
  
  // Fast path: If there's only one face, track it immediately
  if (detections.length === 1) return detections[0];

  // State 1: No tracking lock yet. Find the largest face (closest to the lens).
  if (!lastKnownCenter) {
    return detections.reduce((largestFace, currentFace) => {
      const currentArea = calculateArea(currentFace.boundingBox);
      const largestArea = calculateArea(largestFace.boundingBox);
      return currentArea > largestArea ? currentFace : largestFace;
    });
  }

  // State 2: Tracking lock is active. Find the face closest to our last known coordinates.
  return detections.reduce((closestFace, currentFace) => {
    const currentDistance = getDistanceToPoint(currentFace.boundingBox, lastKnownCenter);
    const closestDistance = getDistanceToPoint(closestFace.boundingBox, lastKnownCenter);
    return currentDistance < closestDistance ? currentFace : closestFace;
  });
}

// ============================================================================
// Private Helper Functions
// ============================================================================

/**
 * Calculates the 2D area of a bounding box.
 * Works perfectly regardless of whether the inputs are raw pixels or percentages.
 */
function calculateArea(boundingBox) {
  const { width, height } = normalizeBoundingBox(boundingBox);
  return width * height;
}

/**
 * Finds the exact center (x, y) coordinate of a bounding box.
 */
function getBoundingBoxCenter(boundingBox) {
  const { x, y, width, height } = normalizeBoundingBox(boundingBox);
  return { 
    x: x + (width / 2), 
    y: y + (height / 2) 
  };
}

/**
 * Calculates the straight-line distance (hypotenuse) between a bounding box center
 * and a specific target point using the Pythagorean theorem.
 */
function getDistanceToPoint(boundingBox, targetPoint) {
  const center = getBoundingBoxCenter(boundingBox);
  return Math.sqrt(
    Math.pow(center.x - targetPoint.x, 2) + Math.pow(center.y - targetPoint.y, 2)
  );
}