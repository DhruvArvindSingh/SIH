import cv2
import numpy as np
from .base_detector import BaseDetector

class FallenTreeDetector(BaseDetector):
    def __init__(self, model_path='models/fallenTree.onnx'):
        super().__init__(model_path)
        self.classes = {0: "fallen_tree"}
        self.priority_color = (0, 0, 255)  # Red for high priority

    def predict_array(self, image_array, conf_threshold=0.25):
        """Predict on image array with high priority logic"""
        annotated = image_array.copy()
        detections = []
        
        boxes, scores, classes = self.predict_onnx(image_array, conf_threshold)

        h, w = image_array.shape[:2]
        if len(boxes) > 0:
            for i, (box, score, cls) in enumerate(zip(boxes, scores, classes)):
                x1, y1, x2, y2 = map(int, box)

                # Skip clearly invalid boxes
                if x1 >= x2 or y1 >= y2:
                    continue

                # Clamp coordinates to image bounds
                x1 = max(0, min(w-1, x1))
                y1 = max(0, min(h-1, y1))
                x2 = max(x1+1, min(w, x2))
                y2 = max(y1+1, min(h, y2))

                class_name = self.classes.get(int(cls), "unknown")

                detections.append({
                    'id': i,
                    'class': class_name,
                    'bbox': [x1, y1, x2, y2],
                    'confidence': float(score),
                    'priority': 'high'
                })

                cv2.rectangle(annotated, (x1, y1), (x2, y2), self.priority_color, 2)
                label = f"Fallen Tree (HIGH) ({score:.2f})"
                label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                cv2.rectangle(annotated, (x1, y1 - 25), (x1 + label_size[0], y1), self.priority_color, -1)
                cv2.putText(annotated, label, (x1, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        overall_priority = 'high' if detections else 'low'

        return annotated, overall_priority, detections
