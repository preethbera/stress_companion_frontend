import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

export class ModelLoader {
  static instances = new Map();
  static loadingPromises = new Map();

  /**
   * Retrieves a specific instance of the Face Detector.
   * Utilizes a registry pattern to allow multiple independent models to run simultaneously
   * without sharing internal temporal tracking state across different camera feeds.
   *
   * @param {string} instanceId - A unique identifier for the camera feed (e.g., "optical", "thermal").
   * @param {string} modelBasePath - The directory path containing the model assets.
   * @returns {Promise<FaceDetector>} The requested FaceDetector instance.
   */
  static async getFaceDetector(instanceId, modelBasePath = "/models") {
    if (this.instances.has(instanceId)) {
      return this.instances.get(instanceId);
    }

    if (this.loadingPromises.has(instanceId)) {
      return this.loadingPromises.get(instanceId);
    }

    const promise = this._loadMediaPipeModel(modelBasePath)
      .then((detector) => {
        this.instances.set(instanceId, detector);
        this.loadingPromises.delete(instanceId);
        return detector;
      })
      .catch((error) => {
        this.loadingPromises.delete(instanceId);
        throw error;
      });

    this.loadingPromises.set(instanceId, promise);
    return promise;
  }

  /**
   * Downloads and initializes the MediaPipe vision task.
   *
   * @param {string} modelBasePath - The directory path containing the model assets.
   * @returns {Promise<FaceDetector>} A newly initialized FaceDetector.
   */
  static async _loadMediaPipeModel(modelBasePath) {
    try {
      const vision = await FilesetResolver.forVisionTasks(modelBasePath);
      
      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `${modelBasePath}/blaze_face_short_range.tflite`,
          delegate: "GPU", 
        },
        runningMode: "VIDEO",
      });

      return detector;
    } catch (error) {
      console.error(`ModelLoader: Failed to initialize vision model from ${modelBasePath}`, error);
      throw error;
    }
  }

  /**
   * Frees up GPU and RAM memory by closing specific model instances or clearing the entire registry.
   * Call this during teardown phases to prevent memory leaks.
   *
   * @param {string|null} instanceId - The specific instance to close. If null, closes all instances.
   */
  static dispose(instanceId = null) {
    if (instanceId) {
      const instance = this.instances.get(instanceId);
      if (instance) {
        instance.close();
        this.instances.delete(instanceId);
        this.loadingPromises.delete(instanceId);
      }
    } else {
      this.instances.forEach((instance) => instance.close());
      this.instances.clear();
      this.loadingPromises.clear();
    }
  }
}