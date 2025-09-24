import cv2
import numpy as np
import onnxruntime as ort
from ultralytics import YOLO
import torch
import ultralytics.nn
import os
import logging

# Safe loading is handled by ultralytics internally

logger = logging.getLogger(__name__)

class BaseDetector:
    def __init__(self, model_path):
        self.model_path = model_path
        self.model = None
        self.model_type = None
        self.load_model()

    def load_model(self):
        """
        Robust model loading for both .pt and .onnx formats.
        """
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found: {self.model_path}")

        ext = os.path.splitext(self.model_path)[1].lower()
        logger.info(f"Loading model: {self.model_path} (format: {ext})")

        if ext == '.pt':
            try:
                self.model = YOLO(self.model_path)
                self.model_type = 'pytorch'
                logger.info(f"✅ Successfully loaded PyTorch model: {os.path.basename(self.model_path)}")
            except Exception as e:
                logger.error(f"❌ PyTorch model loading failed: {e}")
                raise
        elif ext == '.onnx':
            try:
                self.model = ort.InferenceSession(self.model_path, providers=['CPUExecutionProvider'])
                self.model_type = 'onnx'
                logger.info(f"✅ Successfully loaded ONNX model: {os.path.basename(self.model_path)}")
            except Exception as e:
                logger.error(f"❌ ONNX model loading failed: {e}")
                raise
        else:
            raise ValueError(f"Unsupported model format: {ext}. Supported: .pt, .onnx")

    def predict_onnx(self, image_array, conf_threshold=0.25):
        """
        Prediction logic for standard YOLOv8/v11 ONNX models exported from ultralytics.
        """
        try:
            h, w = image_array.shape[:2]

            # Preprocess image
            img_resized = cv2.resize(image_array, (640, 640))
            img_norm = img_resized.transpose(2, 0, 1).astype('float32') / 255.0
            img_batch = np.expand_dims(img_norm, axis=0)

            # Run inference
            outputs = self.model.run(None, {'images': img_batch})
            output_data = outputs[0]  # Shape: (1, 4+num_classes+1, num_detections) or similar

            print(f"DEBUG: ONNX output shape: {output_data.shape} for model {self.model_path}")

            # Handle different output formats from ultralytics ONNX export
            if len(output_data.shape) == 3:  # (1, 84, 8400) or (1, 5, 8400) format
                output = output_data[0]  # Remove batch dimension -> (84/5, 8400)

                num_classes = 1  # Based on training code (single class: garbage/bad_streetlight)

                if output.shape[0] == 5:  # [x,y,w,h,conf]
                    boxes_xywh = output[:4, :]  # (4, 8400)
                    conf_scores = output[4:5, :]  # (1, 8400)
                    class_probs = np.zeros((1, 8400))  # No class probs for single class

                elif output.shape[0] == 84:  # Standard COCO format [x,y,w,h] + 80 classes
                    boxes_xywh = output[:4, :]
                    conf_scores = np.max(output[4:, :], axis=0, keepdims=True)  # Max over classes
                    class_indices_temp = np.argmax(output[4:, :], axis=0)
                    class_probs = output[4:, :]

                else:
                    # Try to detect (5*num_detections) flattened or other formats
                    if output.shape[1] % 5 == 0:  # Check if divisible by 5 (x,y,w,h,conf per detection)
                        num_dets = output.shape[1] // 5
                        output_reshaped = output.reshape(output.shape[0], 5, num_dets)
                        if output_reshaped.shape[0] == 1:  # Single row?
                            boxes_xywh = output_reshaped[0, :4, :]
                            conf_scores = output_reshaped[0, 4:5, :]
                            class_probs = np.zeros((1, num_dets))
                        else:
                            logger.error(f"Unexpected reshaped output shape: {output_reshaped.shape}")
                            return np.array([]), np.array([]), np.array([])
                    else:
                        logger.error(f"Unsupported output format shape: {output.shape}")
                        return np.array([]), np.array([]), np.array([])

                # Transpose to (num_detections, features)
                boxes_xywh = boxes_xywh.T  # (8400, 4)
                conf_scores = conf_scores.T  # (8400, 1)

                # For single class models, class index is always 0
                class_indices = np.zeros(len(boxes_xywh), dtype=int)

                # Use object confidence directly (since single class)
                scores = conf_scores.flatten()

            elif len(output_data.shape) == 2 and output_data.shape[1] == 8400:
                # Legacy format: (2, 8400) or (14, 8400) - from older exports
                output_data = output_data[0]  # Take first batch
                if output_data.shape[0] == 5:  # [x,y,w,h,conf]
                    boxes_xywh = output_data[:4, :].T
                    scores = output_data[4, :]
                    class_indices = np.zeros(len(scores), dtype=int)
                elif output_data.shape[0] == 14:  # Better format with classes
                    boxes_xywh = output_data[:4, :].T
                    conf_scores = output_data[4:, :].T
                    class_indices = np.argmax(conf_scores, axis=1)
                    scores = np.max(conf_scores, axis=1)
                else:
                    logger.error(f"Unsupported legacy shape[0]: {output_data.shape[0]}")
                    return np.array([]), np.array([]), np.array([])
            else:
                logger.error(f"Unsupported output shape: {output_data.shape}")
                return np.array([]), np.array([]), np.array([])

            # Apply confidence threshold
            valid_idx = scores > conf_threshold
            boxes_xywh = boxes_xywh[valid_idx]
            scores = scores[valid_idx]
            class_indices = class_indices[valid_idx]

            if len(boxes_xywh) == 0:
                return np.array([]), np.array([]), np.array([])

            # Convert from normalized xywh to pixel xyxy coordinates
            x_scale = boxes_xywh[:, 0] * w
            y_scale = boxes_xywh[:, 1] * h
            w_scale = boxes_xywh[:, 2] * w
            h_scale = boxes_xywh[:, 3] * h

            # Center-based to corner-based
            x1 = np.maximum(0, x_scale - w_scale / 2)
            y1 = np.maximum(0, y_scale - h_scale / 2)
            x2 = np.minimum(w, x_scale + w_scale / 2)
            y2 = np.minimum(h, y_scale + h_scale / 2)

            boxes_xyxy = np.column_stack([x1, y1, x2, y2]).astype(np.float32)

            return boxes_xyxy, scores, class_indices

        except Exception as e:
            logger.error(f"ONNX prediction error: {e}")
            import traceback
            traceback.print_exc()
            return np.array([]), np.array([]), np.array([])

    def predict_array(self, image_array, conf_threshold=0.25):
        raise NotImplementedError("Each detector must implement its own predict_array method.")
